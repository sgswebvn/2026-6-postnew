import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const { BSON } = mongoose.mongo;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    backupDir: null,
    db: null,
    targetDb: null,
    collection: null,
    drop: false,
    allowProduction: false,
    confirm: null,
    testRestore: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--backup-dir=')) {
      options.backupDir = arg.split('=')[1].trim();
    } else if (arg.startsWith('--db=')) {
      options.db = arg.split('=')[1].trim();
    } else if (arg.startsWith('--target-db=')) {
      options.targetDb = arg.split('=')[1].trim();
    } else if (arg.startsWith('--collection=')) {
      options.collection = arg.split('=')[1].trim();
    } else if (arg.startsWith('--confirm=')) {
      options.confirm = arg.split('=')[1].trim();
    } else if (arg === '--drop') {
      options.drop = true;
    } else if (arg === '--allow-production') {
      options.allowProduction = true;
    } else if (arg === '--test-restore' || arg === '--verify-only') {
      options.testRestore = true;
    }
  }

  return options;
}

function maskMongoUri(uri) {
  if (!uri) return 'N/A';
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  } catch {
    return '***';
  }
}

function findLatestBackupDir(baseDir = 'backups/mongodb') {
  const resolvedBase = path.resolve(process.cwd(), baseDir);
  if (!fs.existsSync(resolvedBase)) {
    return null;
  }
  const entries = fs.readdirSync(resolvedBase, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort()
    .reverse();

  if (entries.length === 0) return null;
  return path.join(resolvedBase, entries[0]);
}

function readBsonFile(bsonPath) {
  const buf = fs.readFileSync(bsonPath);
  const docs = [];
  let offset = 0;
  while (offset < buf.length) {
    const docSize = buf.readInt32LE(offset);
    if (docSize <= 0 || offset + docSize > buf.length) {
      throw new Error(`Corrupted BSON file in ${bsonPath} at offset ${offset}`);
    }
    const docBuf = buf.subarray(offset, offset + docSize);
    docs.push(BSON.deserialize(docBuf));
    offset += docSize;
  }
  return docs;
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    console.log(`
MongoDB Restore & Verification Tool
Usage:
  node scripts/restore-mongodb.mjs [options]

Options:
  --backup-dir=<path>    Path to backup snapshot directory (defaults to latest in backups/mongodb/)
  --db=<source_db>       Which database to restore (e.g. blogweb or RsManagement)
  --target-db=<db_name>  Destination database name (e.g. blogweb_restored or temp_db)
  --collection=<name>    Restore a specific collection only
  --drop                 Drop existing destination collection before restoring
  --test-restore         Safely restore to a temporary DB, verify document counts and indexes, then drop it
  --allow-production     Required flag if targeting production databases
  --confirm=RESTORE      Required safety confirmation if targeting production databases
  --help, -h             Show this help message
    `);
    process.exit(0);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[RESTORE ERROR] MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  // 1. Locate backup directory
  let backupDir = options.backupDir;
  if (!backupDir) {
    backupDir = findLatestBackupDir();
    if (!backupDir) {
      console.error('[RESTORE ERROR] No backup directory found in backups/mongodb. Please run backup first.');
      process.exit(1);
    }
  } else {
    backupDir = path.resolve(process.cwd(), backupDir);
    if (!fs.existsSync(backupDir)) {
      console.error(`[RESTORE ERROR] Backup directory not found: ${backupDir}`);
      process.exit(1);
    }
  }

  console.log('====================================================');
  console.log('         MONGODB RESTORE & VERIFY UTILITY           ');
  console.log('====================================================');
  console.log(`[INFO] Server: ${maskMongoUri(uri)}`);
  console.log(`[INFO] Source Backup: ${backupDir}`);

  // Discover databases inside the backup folder
  const dbEntries = fs.readdirSync(backupDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (dbEntries.length === 0) {
    console.error('[RESTORE ERROR] No database subdirectories found inside backup directory.');
    process.exit(1);
  }

  console.log(`[INFO] Databases available in backup: ${dbEntries.join(', ')}`);

  // Connect
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });
  const client = mongoose.connection.client;

  // Execute test restore mode
  if (options.testRestore) {
    console.log('\n>>> RUNNING TEST RESTORE VERIFICATION IN ISOLATED TEMPORARY DB <<<');
    for (const sourceDbName of dbEntries) {
      if (options.db && options.db !== sourceDbName) continue;

      const shortName = sourceDbName.slice(0, 12);
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const tempDbName = `_t_${shortName}_${randomSuffix}`;
      console.log(`\n[TEST] Verifying restore for "${sourceDbName}" into temporary DB "${tempDbName}"...`);
      const tempDb = client.db(tempDbName);

      try {
        const sourceDir = path.join(backupDir, sourceDbName);
        const files = fs.readdirSync(sourceDir);
        const bsonFiles = files.filter(f => f.endsWith('.bson'));

        let totalDocsRestored = 0;
        for (const bFile of bsonFiles) {
          const colName = bFile.replace(/\.bson$/, '');
          if (options.collection && options.collection !== colName) continue;

          const bsonPath = path.join(sourceDir, bFile);
          const docs = readBsonFile(bsonPath);

          if (docs.length > 0) {
            await tempDb.collection(colName).insertMany(docs, { ordered: false });
          }

          // Restore indexes if metadata exists
          const metaPath = path.join(sourceDir, `${colName}.metadata.json`);
          let indexesCreated = 0;
          if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            if (meta.indexes && Array.isArray(meta.indexes)) {
              const customIndexes = meta.indexes.filter(idx => idx.name !== '_id_');
              if (customIndexes.length > 0) {
                const indexSpecs = customIndexes.map(idx => ({
                  key: idx.key,
                  name: idx.name,
                  unique: !!idx.unique,
                  sparse: !!idx.sparse
                }));
                await tempDb.collection(colName).createIndexes(indexSpecs);
                indexesCreated = indexSpecs.length;
              }
            }
          }

          const restoredCount = await tempDb.collection(colName).countDocuments();
          if (restoredCount !== docs.length) {
            throw new Error(`Restored count mismatch in ${colName}: expected ${docs.length}, got ${restoredCount}`);
          }

          totalDocsRestored += restoredCount;
          console.log(`  -> Checked collection "${colName}": ${restoredCount} docs, ${indexesCreated} custom indexes verified.`);
        }

        console.log(`[TEST PASSED] Database "${sourceDbName}" restored successfully (${totalDocsRestored} docs verified).`);
      } finally {
        // Always drop the temporary database
        console.log(`[CLEANUP] Dropping temporary test database "${tempDbName}"...`);
        await tempDb.dropDatabase();
        console.log(`[CLEANUP] Temporary test database removed cleanly.`);
      }
    }

    await mongoose.disconnect();
    console.log('\n[SUMMARY] ALL TEST RESTORES COMPLETED AND VERIFIED 100% SUCCESSFULLY.');
    return;
  }

  // Regular restore mode
  const sourceDbName = options.db || (dbEntries.includes('blogweb') ? 'blogweb' : dbEntries[0]);
  const targetDbName = options.targetDb;

  if (!targetDbName) {
    console.error('\n[SAFETY ERROR] Please specify --target-db=<name> to indicate the destination database.');
    console.error('Example: npm run db:restore -- --target-db=blogweb_restored\n');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Safety checks against overwriting production database
  const configuredDb = mongoose.connection.db?.databaseName;
  const isProductionTarget = (targetDbName === configuredDb || targetDbName === 'blogweb' || targetDbName === 'RsManagement');

  if (isProductionTarget) {
    if (!options.allowProduction || options.confirm !== 'RESTORE') {
      console.error('\n==================== [CRITICAL SAFETY GUARD] ====================');
      console.error(`TARGET DATABASE "${targetDbName}" APPEARS TO BE A PRODUCTION DATABASE!`);
      console.error('To prevent accidental data loss or corruption, you MUST explicitly provide:');
      console.error('  --allow-production --confirm=RESTORE');
      console.error('=================================================================\n');
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  console.log(`[RESTORE] Restoring from "${sourceDbName}" into target DB "${targetDbName}"...`);
  const targetDb = client.db(targetDbName);
  const sourceDir = path.join(backupDir, sourceDbName);

  if (!fs.existsSync(sourceDir)) {
    console.error(`[RESTORE ERROR] Source database directory does not exist: ${sourceDir}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const files = fs.readdirSync(sourceDir);
  const bsonFiles = files.filter(f => f.endsWith('.bson'));

  for (const bFile of bsonFiles) {
    const colName = bFile.replace(/\.bson$/, '');
    if (options.collection && options.collection !== colName) continue;

    console.log(`\n  -> Restoring collection "${colName}"...`);
    const targetCol = targetDb.collection(colName);

    if (options.drop) {
      console.log(`     [DROP] Dropping existing collection "${colName}" in destination...`);
      try {
        await targetCol.drop();
      } catch (err) {
        // Ignored if collection does not exist
      }
    }

    const docs = readBsonFile(path.join(sourceDir, bFile));
    if (docs.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        await targetCol.insertMany(batch, { ordered: false });
      }
    }

    // Restore indexes
    const metaPath = path.join(sourceDir, `${colName}.metadata.json`);
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      if (meta.indexes && Array.isArray(meta.indexes)) {
        const customIndexes = meta.indexes.filter(idx => idx.name !== '_id_');
        if (customIndexes.length > 0) {
          const indexSpecs = customIndexes.map(idx => ({
            key: idx.key,
            name: idx.name,
            unique: !!idx.unique,
            sparse: !!idx.sparse
          }));
          await targetCol.createIndexes(indexSpecs);
        }
      }
    }

    const finalCount = await targetCol.countDocuments();
    console.log(`     [SUCCESS] Restored ${docs.length} documents. Current count in target: ${finalCount}`);
  }

  await mongoose.disconnect();
  console.log('\n====================================================');
  console.log(`[RESTORE COMPLETED] Database "${targetDbName}" restored successfully.`);
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('[FATAL RESTORE ERROR]', err);
  process.exit(1);
});
