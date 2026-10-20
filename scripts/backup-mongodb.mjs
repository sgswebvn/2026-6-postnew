import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

const { BSON } = mongoose.mongo;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dbs: null,
    outDir: 'backups/mongodb',
    skipJson: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--dbs=')) {
      options.dbs = arg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = arg.split('=')[1].trim();
    } else if (arg === '--skip-json') {
      options.skipJson = true;
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

function getFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const HH = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${YYYY}-${MM}-${DD}_${HH}-${mm}-${ss}`;
}

function calculateFileSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    console.log(`
MongoDB Full Backup Tool
Usage:
  node scripts/backup-mongodb.mjs [options]

Options:
  --dbs=db1,db2      Comma-separated list of databases to back up.
                     Default: configured database ("blogweb") and related ("RsManagement").
  --out-dir=<path>   Directory where backups will be stored (default: backups/mongodb).
  --skip-json        Skip generating human-readable .json files (only generate BSON).
  --help, -h         Show this help message.
    `);
    process.exit(0);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[BACKUP ERROR] MONGODB_URI is not configured in .env');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('         MONGODB SECURE BACKUP UTILITY              ');
  console.log('====================================================');
  console.log(`[INFO] Connection Target: ${maskMongoUri(uri)}`);

  // Connect to MongoDB
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('[INFO] Connected successfully to MongoDB server.');
  } catch (err) {
    console.error(`[ERROR] Unable to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  const client = mongoose.connection.client;
  const defaultDbName = mongoose.connection.db?.databaseName || 'blogweb';

  // Determine target databases
  let targetDbs = options.dbs;
  if (!targetDbs || targetDbs.length === 0) {
    // If not specified, check available databases
    try {
      const adminDb = mongoose.connection.db.admin();
      const listRes = await adminDb.listDatabases();
      const availableDbNames = listRes.databases.map(d => d.name);

      // Default strategy: back up the application database AND RsManagement if it exists on the cluster
      targetDbs = [defaultDbName];
      if (availableDbNames.includes('RsManagement') && !targetDbs.includes('RsManagement')) {
        targetDbs.push('RsManagement');
      }
    } catch {
      targetDbs = [defaultDbName];
    }
  }

  console.log(`[INFO] Databases selected for backup: ${targetDbs.join(', ')}`);

  const timestamp = getFormattedTimestamp();
  const backupRoot = path.resolve(process.cwd(), options.outDir, timestamp);
  fs.mkdirSync(backupRoot, { recursive: true });

  console.log(`[INFO] Backup folder created: ${backupRoot}`);

  const backupReport = {
    timestamp,
    createdAt: new Date().toISOString(),
    connectionHost: maskMongoUri(uri),
    nodeVersion: process.version,
    mongooseVersion: mongoose.version,
    databases: []
  };

  for (const dbName of targetDbs) {
    console.log(`\n----------------------------------------------------`);
    console.log(`[DATABASE] Backing up database: "${dbName}"`);
    console.log(`----------------------------------------------------`);

    const db = client.db(dbName);
    const dbDir = path.join(backupRoot, dbName);
    fs.mkdirSync(dbDir, { recursive: true });

    let collections = [];
    try {
      collections = await db.listCollections().toArray();
    } catch (err) {
      console.error(`[ERROR] Failed to list collections for database "${dbName}": ${err.message}`);
      backupReport.databases.push({
        name: dbName,
        status: 'FAILED',
        error: err.message,
        collections: []
      });
      continue;
    }

    const dbStats = {
      name: dbName,
      status: 'SUCCESS',
      totalCollections: collections.length,
      totalDocuments: 0,
      totalBsonBytes: 0,
      collections: [],
      checksums: []
    };

    const checksumLines = [];

    for (const colInfo of collections) {
      const colName = colInfo.name;
      // Skip system collections if any
      if (colName.startsWith('system.')) continue;

      const collection = db.collection(colName);
      const docCount = await collection.countDocuments();
      dbStats.totalDocuments += docCount;

      console.log(`  -> [COLLECTION] "${colName}" (${docCount} docs)...`);

      // 1. Fetch metadata (indexes, options)
      let indexes = [];
      let colOptions = {};
      try {
        indexes = await collection.indexes();
      } catch (err) {
        console.warn(`     [WARN] Could not retrieve indexes for "${colName}": ${err.message}`);
      }
      try {
        colOptions = await collection.options();
      } catch {
        // collection options might be empty
      }

      const metadataObj = {
        options: colOptions,
        indexes,
        collectionName: colName,
        databaseName: dbName,
        docCount,
        exportedAt: new Date().toISOString(),
        type: 'collection'
      };

      const metadataPath = path.join(dbDir, `${colName}.metadata.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadataObj, null, 2), 'utf-8');
      const metaSha = calculateFileSha256(metadataPath);
      checksumLines.push(`${metaSha}  ${colName}.metadata.json`);

      // 2. Fetch and serialize all documents to standard BSON stream
      const bsonPath = path.join(dbDir, `${colName}.bson`);
      const bsonWriteStream = fs.createWriteStream(bsonPath);

      const jsonDocs = [];
      const cursor = collection.find({}).batchSize(500);

      let writtenCount = 0;
      for await (const doc of cursor) {
        const bsonBuf = BSON.serialize(doc);
        bsonWriteStream.write(bsonBuf);
        writtenCount++;

        if (!options.skipJson) {
          jsonDocs.push(doc);
        }
      }

      await new Promise((resolve, reject) => {
        bsonWriteStream.end(resolve);
        bsonWriteStream.on('error', reject);
      });

      const bsonStat = fs.statSync(bsonPath);
      dbStats.totalBsonBytes += bsonStat.size;
      const bsonSha = calculateFileSha256(bsonPath);
      checksumLines.push(`${bsonSha}  ${colName}.bson`);

      let jsonSize = 0;
      if (!options.skipJson) {
        const jsonPath = path.join(dbDir, `${colName}.json`);
        const jsonString = BSON.EJSON.stringify(jsonDocs, null, 2);
        fs.writeFileSync(jsonPath, jsonString, 'utf-8');
        jsonSize = fs.statSync(jsonPath).size;
        const jsonSha = calculateFileSha256(jsonPath);
        checksumLines.push(`${jsonSha}  ${colName}.json`);
      }

      // Verify integrity of BSON file
      let verifiedCount = 0;
      if (bsonStat.size > 0) {
        const checkBuf = fs.readFileSync(bsonPath);
        let offset = 0;
        while (offset < checkBuf.length) {
          const docSize = checkBuf.readInt32LE(offset);
          if (docSize <= 0 || offset + docSize > checkBuf.length) {
            throw new Error(`Corrupt BSON file in ${colName}.bson at offset ${offset}`);
          }
          verifiedCount++;
          offset += docSize;
        }
      }

      const match = (verifiedCount === docCount);
      if (!match) {
        console.error(`     [ERROR] Count mismatch for "${colName}": DB had ${docCount}, backup has ${verifiedCount}`);
      } else {
        console.log(`     [OK] Backed up ${verifiedCount}/${docCount} docs | BSON: ${formatBytes(bsonStat.size)} | SHA256: ${bsonSha.substring(0, 12)}...`);
      }

      dbStats.collections.push({
        name: colName,
        sourceCount: docCount,
        backedUpCount: verifiedCount,
        verified: match,
        bsonSize: bsonStat.size,
        bsonSha256: bsonSha,
        metadataSha256: metaSha,
        jsonSize,
        indexesCount: indexes.length
      });
    }

    // Write checksums file for this database
    const checksumsFilePath = path.join(dbDir, 'checksums.sha256');
    fs.writeFileSync(checksumsFilePath, checksumLines.join('\n') + '\n', 'utf-8');

    backupReport.databases.push(dbStats);
  }

  // Write manifest.json
  const manifestPath = path.join(backupRoot, 'backup-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(backupReport, null, 2), 'utf-8');

  // Write README.md in backup root
  const readmeContent = generateReadme(backupReport, backupRoot);
  fs.writeFileSync(path.join(backupRoot, 'README.md'), readmeContent, 'utf-8');

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('          BACKUP COMPLETED SUCCESSFULLY             ');
  console.log('====================================================');
  console.log(`[SUMMARY] Location: ${backupRoot}`);
  for (const d of backupReport.databases) {
    console.log(`  * Database "${d.name}": ${d.collections.length} collections, ${d.totalDocuments} documents (${formatBytes(d.totalBsonBytes)})`);
  }
  console.log(`[INFO] Checksums and documentation created at README.md`);
  console.log('====================================================\n');
}

function generateReadme(report, backupRoot) {
  let tableMd = '';
  for (const db of report.databases) {
    tableMd += `### Database: \`${db.name}\`\n\n`;
    tableMd += `Trạng thái: **${db.status}** | Tổng collections: **${db.totalCollections}** | Tổng documents: **${db.totalDocuments}** | Dung lượng BSON: **${formatBytes(db.totalBsonBytes)}**\n\n`;
    tableMd += `| Collection | Số documents | BSON Size | Số Index | Trạng thái toàn vẹn | SHA-256 (BSON Rút gọn) |\n`;
    tableMd += `|---|---|---|---|---|---|\n`;
    for (const c of db.collections) {
      tableMd += `| \`${c.name}\` | ${c.backedUpCount} | ${formatBytes(c.bsonSize)} | ${c.indexesCount} | ${c.verified ? '✅ Khớp 100%' : '❌ Lỗi'} | \`${c.bsonSha256.substring(0, 16)}...\` |\n`;
    }
    tableMd += `\n`;
  }

  return `# BẢN SAO LƯU DỮ LIỆU MONGODB (BACKUP MANIFEST)

## 1. Thông tin chung
- **Thời điểm sao lưu (Local Time):** ${report.timestamp}
- **Thời điểm sao lưu (ISO):** ${report.createdAt}
- **Máy chủ kết nối:** \`${report.connectionHost}\`
- **Môi trường chạy:** Node.js ${report.nodeVersion}, Mongoose ${report.mongooseVersion}
- **Thư mục lưu trữ:** \`${backupRoot}\`
- **Định dạng:** 
  - Standard BSON (\`.bson\`): Dữ liệu nhị phân chuẩn MongoDB, tương thích 100% với \`mongorestore\` và Node.js script. Giữ nguyên toàn bộ \`_id\`, \`ObjectId\`, \`Date\`, \`Long\`, \`Decimal128\`...
  - Metadata (\`.metadata.json\`): Định nghĩa index và options của collection theo chuẩn \`mongodump\`.
  - Extended JSON (\`.json\`): Định dạng JSON dễ đọc để kiểm tra nội dung thủ công khi cần.
  - Checksums (\`checksums.sha256\`): Bảng băm mã hóa SHA-256 xác thực tính toàn vẹn từng file.

---

## 2. Thống kê chi tiết Database & Collection

${tableMd}

---

## 3. Hướng dẫn khôi phục dữ liệu (Restore)

### Cách 1: Sử dụng công cụ tự động của dự án (Khuyến nghị)

Dự án đã tích hợp sẵn công cụ khôi phục an toàn trong file \`scripts/restore-mongodb.mjs\`:

\`\`\`bash
# 1. Kiểm tra khôi phục thử nghiệm vào Database tạm (an toàn tuyệt đối, tự động xác minh và dọn dẹp):
npm run db:verify

# 2. Khôi phục vào một database chỉ định (ví dụ khôi phục sang môi trường test hoặc db mới):
npm run db:restore -- --target-db=blogweb_restored

# 3. Khôi phục riêng một collection:
npm run db:restore -- --target-db=blogweb_test --collection=posts
\`\`\`

> ⚠️ **CẢNH BÁO AN TOÀN:**
> Theo mặc định, công cụ restore **KHÔNG BAO GIỜ** ghi đè lên database Production mà không có cờ \`--allow-production\` và xác nhận tường minh.
> Tuyệt đối không xóa hoặc ghi đè dữ liệu đang chạy nếu chưa có kế hoạch dự phòng.

### Cách 2: Sử dụng công cụ chính thức \`mongorestore\` của MongoDB (nếu đã cài đặt Database Tools)

\`\`\`bash
# Khôi phục vào database mới:
mongorestore --uri="mongodb+srv://<USER>:<PASSWORD>@cluster0.jclrhni.mongodb.net/blogweb_restored" --dir="./blogweb"

# Khôi phục database RsManagement:
mongorestore --uri="mongodb+srv://<USER>:<PASSWORD>@cluster0.jclrhni.mongodb.net/RsManagement_restored" --dir="./RsManagement"
\`\`\`

---

## 4. Bảo mật và Quyền riêng tư

- Dữ liệu trong thư mục này chứa thông tin thực tế từ hệ thống (tài khoản, nhân viên, cấu hình, bài viết, logs).
- Thư mục \`backups/\` đã được đưa vào \`.gitignore\` để ngăn chặn commit nhầm dữ liệu thật lên kho mã nguồn Git.
- **KHÔNG** sao chép, upload công khai hoặc đưa bản backup này lên internet mà không mã hóa bảo vệ.
`;
}

main().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
