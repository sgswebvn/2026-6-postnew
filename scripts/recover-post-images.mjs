import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../server/db.js';
import { googleDriveService } from '../server/services/googleDriveService.js';

// Mapping table between Post Slugs and Image files in Postnewimage
// Verified through direct visual analysis and textual match of title, subject, and artwork
const POST_IMAGE_MAPPING = [
  {
    slug: 'why-the-nba-is-more-than-basketball-how-american-basketball-became-a-global-entertainment-empire',
    filename: '2hgb6fhl63jwq1ovam193tidilyukwng3kpi1.jpg',
    description: 'NBA Global Entertainment Empire (LeBron, Curry, Wembanyama, Globe)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'sophie-cunningham-basketball-role-player-or-media-superstar',
    filename: '2hgb6fhl649oir9uhxya70pkhbutwuzkdx2o5.jpg',
    description: 'Sophie Cunningham Media Superstar (Phone screen, 1M+ likes, Fever #8)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'sophie-cunningham-s-2026-season-an-efficient-shooter-whose-role-got-smaller',
    filename: '2hgb6fhl6dsajd2gp6ohcmadloosuhkgm5lg21.jpg',
    description: 'Sophie Cunningham 2026 Season Stats (7.9 PTS, 41.9% 3PT, bench & towel)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'sophie-cunningham-s-real-basketball-talent-why-her-game-is-more-complicated-than-the-numbers-suggest',
    filename: '2hgb6fhl6f6hmp98ybkgnkehedoxvouhabdk23.jpg',
    description: 'Sophie Cunningham Real Basketball Talent (Play diagram, Shooting, Defense, Physicality)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'sophie-cunningham-s-career-the-journey-from-college-star-to-wnba-s-most-discussed-personalities',
    filename: '2hgb6fhl67vrnk6xyzr3yzkf3cbvwffvehog12.jpg',
    description: 'Sophie Cunningham Career Journey (College Mizzou -> Phoenix Mercury -> Indiana Fever)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'the-wnba-in-2026-a-basketball-revolution-has-entered-its-most-important-phase',
    filename: '2hgb6fhl6gs93kre1ejzicggjtu2xjbvju6k25.jpg',
    description: 'The WNBA in 2026 (WNBA 2026 - A New Era For Womens Basketball)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'the-nba-in-2026-why-adaptability-matters-more-than-ever-in-the-race-for-a-championship',
    filename: '2hgb6fhl68jrz6kjtuuksyqil4ligeanozze14.jpg',
    description: 'The NBA in 2026 (NBA 2026 - A New Era of Competition, Knicks, OKC)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'men-s-vs-women-s-basketball-in-2026-one-sport-two-different-worlds',
    filename: '2hgb6fhl6bf1tvsjmsuhw3k0ziqxmyad7liu18.jpg',
    description: 'Mens vs Womens Basketball in 2026 (NBA vs WNBA - Same Game Different Stories)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'film-color-theory-explained-how-movies-use-color-to-shape-emotion',
    filename: null,
    description: 'Film Color Theory (No matching asset in Postnewimage)',
    confidence: 'NO_IMAGE_FOUND'
  },
  {
    slug: 'inception-vs-interstellar-two-different-views-of-reality',
    filename: null,
    description: 'Inception vs Interstellar (No matching asset in Postnewimage)',
    confidence: 'NO_IMAGE_FOUND'
  },
  {
    slug: 'the-truman-show-the-hidden-cost-of-a-life-without-freedom',
    filename: '2hgb6fhl6fc89p4angdagd6pt90v0qazm4hy24.jpg',
    description: 'The Truman Show (The Truman Show - Freedom, Surveillance, and Reality)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'parasite-explained-the-house-is-the-real-main-character',
    filename: '2hgb6fhl697z9w48y4iln9kld5ubzdjdcg1w15.jpg',
    description: 'Parasite Explained (Parasite - How Architecture Reveals Class Inequality)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: '12-angry-men-the-dangerous-difference-between-being-certain-and-being-right',
    filename: '2hgb6fhl6emkh5yzuqxwo1wkhsdvsizjvatg22.jpg',
    description: '12 Angry Men (12 Angry Men - Doubt, Justice, and the Power of Bias)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'ikiru-what-makes-a-life-worth-living-when-time-is-running-out',
    filename: '2hgb6fhl68lzeyihl3enuz17vzecn3pzmzwu13.jpg',
    description: 'Ikiru (Ikiru - What Makes a Life Worth Living?)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'project-hail-mary-why-saving-the-world-begins-with-trust',
    filename: '2hgb6fhl64fznfez8iiyd7bea8gsjxsuidq46.jpg',
    description: 'Project Hail Mary (Project Hail Mary - Science. Survival. Friendship)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'the-odyssey-2026-when-a-hero-s-journey-becomes-a-question-about-power',
    filename: null,
    description: 'The Odyssey 2026 (No matching asset in Postnewimage)',
    confidence: 'NO_IMAGE_FOUND'
  },
  {
    slug: 'tim-conway-s-drunken-bullfighter-why-the-sketch-works',
    filename: '2hgb6fhl6bxgq5afpnpxtv67xgh6cgs5c40019.jpg',
    description: 'Tim Conway Drunken Bullfighter (The Carol Burnett Show - Tim Conway The Drunken Bullfighter)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'undercover-cops-how-tim-conway-and-harvey-korman-turn-a-police-mission-into-comedy',
    filename: '2hgb6fhl63vv91fjmkphfperkvzbelatkxpg4.jpg',
    description: 'Undercover Cops (The Carol Burnett Show - Undercover Cops)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'the-carol-burnett-show-s-no-frills-airline-when-cheap-becomes-absurd',
    filename: '2hgb6fhl67bq0l3dbgvib8tcy8bfeiidns6i11.jpg',
    description: 'No-Frills Airline (The Carol Burnett Show - The Lowest Cost Airline You Can Imagine)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'the-old-folks-the-quiet-genius-of-classic-comedy',
    filename: '2hgb6fhl63tpaekdbotlefq2hwqxkfxhixwa2.jpg',
    description: 'The Old Folks (The Carol Burnett Show - The Old Folks)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'johnny-carson-s-most-inappropriate-moment-why-it-aired',
    filename: '2hgb6fhl69vochdp5aoy7o2pflai7i4edor216.jpg',
    description: 'Johnny Carson Moment (The Tonight Show - The Most Inappropriate Johnny Carson Moment)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'mrs-wiggins-office-christmas-eve-when-the-office-party-becomes-a-disaster',
    filename: '2hgb6fhl66mponntpolll367mkxzpdklr5ty9.jpg',
    description: 'Mrs. Wiggins Office Christmas Eve (The Carol Burnett Show - Mrs. Wiggins Office Christmas Eve Goes Wrong)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'tim-conway-s-vending-machine-standoff-more-than-a-joke-about-coffee',
    filename: '2hgb6fhl66uw2ksxcoxfopjetbmr1ozb0xh210.jpg',
    description: 'Vending Machine Standoff (The Carol Burnett Show - Vending Machine Standoff with Mr. Tudball)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  },
  {
    slug: 'tim-conway-s-royal-ceremony-when-a-hero-refuses-his-honor',
    filename: '2hgb6fhl6aswikkdhyxvkkj7kd8hqghrblti17.jpg',
    description: 'Tim Conway Royal Ceremony (The Carol Burnett Show - The Royal Ceremony That Tim Conway Completely Ruined)',
    confidence: '100% (High Confidence - Visual & Textual Match)'
  }
];

async function main() {
  console.log('================================================================');
  console.log('        AUTOMATED POST IMAGE RECOVERY & MIGRATION TOOL          ');
  console.log('================================================================');

  // 1. Connect DB
  await connectDB();
  const db = mongoose.connection.db;
  const postsCollection = db.collection('posts');

  // 2. Backup current posts collection before any modification
  console.log('\n[STEP 1] Creating pre-migration safety backup of posts...');
  const currentPosts = await postsCollection.find({}).toArray();
  const backupDir = path.resolve('backups', 'pre_image_recovery');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `posts_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(currentPosts, null, 2), 'utf-8');
  console.log(`[BACKUP OK] Saved ${currentPosts.length} posts to: ${backupFile}`);

  // 3. Connect to Google Drive & fetch existing files to prevent duplicates
  console.log('\n[STEP 2] Verifying Google Drive folder and cache...');
  const health = await googleDriveService.checkHealth();
  if (!health.connected) {
    throw new Error(`Google Drive is not connected: ${health.message}`);
  }
  console.log(`[DRIVE OK] Connected to folder "${health.folderName}" (${health.folderId})`);

  const drive = await googleDriveService.getDriveClient();
  const folderId = googleDriveService.getFolderId();

  // Query existing files in Drive folder
  const existingDriveRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, md5Checksum, appProperties)',
    pageSize: 100
  });

  const driveMd5Map = new Map();
  for (const f of existingDriveRes.data.files) {
    if (f.md5Checksum) {
      driveMd5Map.set(f.md5Checksum, f);
    }
    if (f.appProperties?.md5) {
      driveMd5Map.set(f.appProperties.md5, f);
    }
  }
  console.log(`[DRIVE CACHE] Found ${existingDriveRes.data.files.length} existing files in Drive folder.`);

  // 4. Process each post mapping
  console.log('\n[STEP 3] Uploading images to Google Drive and updating posts...');
  const imageFolder = path.resolve('Postnewimage');
  const recoveryReport = {
    generatedAt: new Date().toISOString(),
    totalPostsInDatabase: currentPosts.length,
    totalImagesInFolder: fs.readdirSync(imageFolder).filter(f => !f.startsWith('.')).length,
    successfulRecoveries: 0,
    unmatchedPosts: 0,
    uploadedToDrive: 0,
    reusedFromDrive: 0,
    details: []
  };

  const md5ToUploadResult = new Map();

  for (let i = 0; i < POST_IMAGE_MAPPING.length; i++) {
    const item = POST_IMAGE_MAPPING[i];
    const post = currentPosts.find(p => p.slug === item.slug);

    if (!post) {
      console.warn(`[WARN] Post with slug "${item.slug}" not found in database!`);
      continue;
    }

    console.log(`\n----------------------------------------------------------------`);
    console.log(`Processing [${i + 1}/${POST_IMAGE_MAPPING.length}]: "${post.title}"`);
    console.log(`Slug: ${post.slug}`);

    if (!item.filename) {
      console.log(`  -> [SKIPPED] No matching image in Postnewimage. Preserving existing post data.`);
      recoveryReport.unmatchedPosts++;
      recoveryReport.details.push({
        postId: String(post._id),
        title: post.title,
        slug: post.slug,
        status: 'UNMATCHED_NO_ASSET',
        originalCoverImage: post.coverImage,
        recoveredCoverImage: post.coverImage,
        notes: 'Bài viết chưa có ảnh trong thư mục Postnewimage. Giữ nguyên dữ liệu an toàn.',
        confidence: item.confidence
      });
      continue;
    }

    const localImagePath = path.join(imageFolder, item.filename);
    if (!fs.existsSync(localImagePath)) {
      console.error(`  -> [ERROR] Image file not found: ${localImagePath}`);
      continue;
    }

    const buffer = fs.readFileSync(localImagePath);
    const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');

    let uploadResult = null;

    // Check if we already uploaded this exact file during this session
    if (md5ToUploadResult.has(md5Hash)) {
      uploadResult = md5ToUploadResult.get(md5Hash);
      recoveryReport.reusedFromDrive++;
      console.log(`  -> [REUSE CACHE] Reused file ID ${uploadResult.fileId} from this session.`);
    } else if (driveMd5Map.has(md5Hash)) {
      // Check if file already exists on Drive
      const existingDriveFile = driveMd5Map.get(md5Hash);
      uploadResult = {
        fileId: existingDriveFile.id,
        url: `/api/uploads/file/${existingDriveFile.id}`,
        name: existingDriveFile.name,
        size: existingDriveFile.size,
        mimeType: existingDriveFile.mimeType,
        reused: true
      };
      md5ToUploadResult.set(md5Hash, uploadResult);
      recoveryReport.reusedFromDrive++;
      console.log(`  -> [REUSE DRIVE] Found on Google Drive (ID: ${uploadResult.fileId}). Reusing existing file.`);
    } else {
      // Upload to Google Drive
      console.log(`  -> [UPLOADING] Uploading ${item.filename} (${buffer.length} bytes) to Google Drive...`);
      const sanitizedName = `${post.slug.slice(0, 40)}.jpg`;
      const uploaded = await googleDriveService.uploadImage({
        buffer,
        fileName: sanitizedName,
        mimeType: 'image/jpeg'
      });
      uploadResult = {
        fileId: uploaded.fileId,
        url: uploaded.url,
        name: uploaded.name,
        size: uploaded.size,
        mimeType: uploaded.mimeType,
        reused: false
      };
      md5ToUploadResult.set(md5Hash, uploadResult);
      recoveryReport.uploadedToDrive++;
      console.log(`  -> [UPLOAD SUCCESS] Google Drive fileId: ${uploadResult.fileId}`);
    }

    // 5. Update Post in Database
    const newImageUrl = uploadResult.url;
    const oldCoverImage = post.coverImage;

    // Detect old image URLs in content to replace
    let updatedContent = post.content || '';
    const oldSupabaseRegex = /https:\/\/mmltqgekvpdnezqdavvc\.supabase\.co\/storage\/v1\/object\/public\/postnew\/uploads\/[^\s"'>]+/gi;
    const matchedOldUrls = (post.content || '').match(oldSupabaseRegex) || [];

    if (matchedOldUrls.length > 0) {
      updatedContent = updatedContent.replace(oldSupabaseRegex, newImageUrl);
      // Also clean up error fallbacks in HTML if present
      updatedContent = updatedContent.replace(/onerror="[^"]*"/gi, 'loading="lazy"');
    }

    await postsCollection.updateOne(
      { _id: post._id },
      {
        $set: {
          coverImage: newImageUrl,
          content: updatedContent,
          updatedAt: new Date()
        }
      }
    );

    recoveryReport.successfulRecoveries++;
    console.log(`  -> [UPDATED] Cover: ${newImageUrl}`);
    console.log(`  -> [CONTENT] Replaced ${matchedOldUrls.length} old Supabase image references in body.`);

    recoveryReport.details.push({
      postId: String(post._id),
      title: post.title,
      slug: post.slug,
      status: 'RECOVERED_SUCCESS',
      sourceImageFile: item.filename,
      sourceImageDescription: item.description,
      googleDriveFileId: uploadResult.fileId,
      newImageUrl: newImageUrl,
      previousCoverImage: oldCoverImage,
      contentImagesUpdated: matchedOldUrls.length,
      confidence: item.confidence
    });
  }

  // 6. Save recovery report JSON
  const reportPath = path.resolve('image-recovery-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(recoveryReport, null, 2), 'utf-8');
  console.log(`\n[REPORT] Saved detailed recovery report to: ${reportPath}`);

  // 7. Verify integrity and streamability
  console.log('\n[STEP 4] Verifying image streamability for all updated posts...');
  let streamVerifiedCount = 0;
  for (const item of recoveryReport.details) {
    if (item.status === 'RECOVERED_SUCCESS') {
      try {
        const streamInfo = await googleDriveService.getFileStream(item.googleDriveFileId);
        if (streamInfo.metadata) {
          streamVerifiedCount++;
        }
      } catch (err) {
        console.error(`[STREAM CHECK FAIL] File ID: ${item.googleDriveFileId} - ${err.message}`);
      }
    }
  }
  console.log(`[VERIFICATION COMPLETE] ${streamVerifiedCount}/${recoveryReport.successfulRecoveries} images verified streamable.`);

  await mongoose.disconnect();
  console.log('\n================================================================');
  console.log('              IMAGE RECOVERY PROCESS FINISHED                   ');
  console.log('================================================================');
  console.log(`Total Posts: ${recoveryReport.totalPostsInDatabase}`);
  console.log(`Successfully Recovered: ${recoveryReport.successfulRecoveries}`);
  console.log(`New Uploads to Drive: ${recoveryReport.uploadedToDrive}`);
  console.log(`Reused from Drive: ${recoveryReport.reusedFromDrive}`);
  console.log(`Unmatched (No Asset): ${recoveryReport.unmatchedPosts}`);
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
