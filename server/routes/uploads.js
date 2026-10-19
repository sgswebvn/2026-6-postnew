import express from 'express';
import { requireAuth, requireAdmin, sanitizeStaff } from '../auth.js';
import { Staff } from '../models/Staff.js';
import { googleDriveService, validateImageBuffer } from '../services/googleDriveService.js';

const router = express.Router();

// ==========================================
// 1. HEALTH CHECK & DIAGNOSTICS
// ==========================================
router.get('/health', async (req, res) => {
  try {
    const health = await googleDriveService.checkHealth();
    return res.json({
      service: 'Google Drive Storage',
      ...health
    });
  } catch (err) {
    return res.status(500).json({
      service: 'Google Drive Storage',
      connected: false,
      error: err.message
    });
  }
});

// Real-time admin test connection endpoint
router.post('/test-connection', requireAuth, requireAdmin, async (req, res) => {
  try {
    const health = await googleDriveService.checkHealth();
    return res.json({
      service: 'Google Drive Storage',
      success: health.connected,
      ...health
    });
  } catch (err) {
    return res.status(500).json({
      service: 'Google Drive Storage',
      success: false,
      connected: false,
      message: err.message
    });
  }
});

// Admin disconnect token endpoint (to re-link or reset credentials)
router.delete('/token', requireAuth, requireAdmin, async (req, res) => {
  try {
    await googleDriveService.clearToken();
    return res.json({
      success: true,
      message: 'Đã hủy kết nối token Google Drive thành công.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==========================================
// 2. OAUTH 2.0 AUTHORIZATION WORKFLOW
// ==========================================
router.get('/auth/google/url', requireAuth, requireAdmin, (req, res) => {
  try {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('host') || 'www.thehori.click';
    const dynamicRedirectUri = process.env.GOOGLE_REDIRECT_URI || `${proto}://${host}/api/auth/google/callback`;
    const url = googleDriveService.getAuthUrl('hrm_admin_oauth', dynamicRedirectUri);
    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Handler for OAuth callback (both GET and POST exchange)
export async function handleGoogleOAuthCallback(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head><meta charset="UTF-8"><title>Lỗi Xác Thực</title></head>
      <body style="font-family: sans-serif; padding: 2rem; background: #fff1f2; color: #9f1239; max-width: 640px; margin: 2rem auto; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <h2>❌ Xác thực Google Drive bị hủy hoặc từ chối</h2>
        <p>Chi tiết: <code>${error}</code></p>
        <p><a href="/admin" style="display:inline-block;padding:0.6rem 1.2rem;background:#e11d48;color:#fff;text-decoration:none;border-radius:6px;">Quay lại trang quản trị</a></p>
      </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Mã xác thực (code) không được cung cấp.');
  }

  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('host') || 'www.thehori.click';
  const detectedUri = `${proto}://${host}${req.baseUrl || ''}${req.path}`.replace(/\/+$/, '');

  try {
    const tokens = await googleDriveService.exchangeAuthCode(code, detectedUri);
    return res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head><meta charset="UTF-8"><title>Xác Thực Thành Công</title></head>
      <body style="font-family: sans-serif; padding: 2rem; background: #f0fdf4; color: #166534; text-align: center; max-width: 640px; margin: 2rem auto; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <h2>✅ Liên kết Google Drive thành công!</h2>
        <p>Đã cấp quyền lưu trữ ảnh vào thư mục <strong>${googleDriveService.getFolderId()}</strong>.</p>
        <p>Hệ thống HRM đã sẵn sàng tải lên ảnh đại diện và ảnh bài viết trực tiếp lên Google Drive.</p>
        <p><a href="/admin" style="display: inline-block; padding: 0.6rem 1.2rem; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 1rem; font-weight: 600;">Quay lại Quản trị HRM</a></p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[OAuth Callback Error]', err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head><meta charset="UTF-8"><title>Lỗi Trao Đổi Token</title></head>
      <body style="font-family: sans-serif; padding: 2rem; background: #fff1f2; color: #9f1239; max-width: 680px; margin: 2rem auto; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); line-height: 1.6;">
        <h2 style="margin-top:0;">❌ Trao đổi token với Google thất bại: ${err.message}</h2>
        <div style="background:#fff;padding:1.25rem;border-radius:8px;border:1px solid #fecdd3;margin:1rem 0;color:#334155;text-align:left;">
          <h4 style="margin:0 0 0.5rem 0;color:#9f1239;">📋 Nguyên nhân & Cách khắc phục redirect_uri_mismatch:</h4>
          <p style="margin:0.25rem 0;">Google Cloud Console yêu cầu mục <strong>Authorized redirect URIs</strong> phải chứa chính xác các URI sau:</p>
          <ul style="margin:0.5rem 0;padding-left:1.5rem;font-family:monospace;font-size:0.9rem;">
            <li>https://www.thehori.click/api/auth/google/callback</li>
            <li>https://thehori.click/api/auth/google/callback</li>
          </ul>
          <p style="margin:0.5rem 0 0 0;font-size:0.9rem;color:#475569;">
            👉 <strong>Bước 1:</strong> Truy cập <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:#2563eb;font-weight:600;">Google Cloud Console &rarr; Credentials</a><br/>
            👉 <strong>Bước 2:</strong> Nhấp vào Client ID của bạn &rarr; Thêm cả 2 URI trên vào <strong>Authorized redirect URIs</strong> &rarr; Bấm <strong>Save</strong>.<br/>
            👉 <strong>Bước 3:</strong> Vào lại trang quản trị và bấm <strong>"Liên kết lại Google Drive"</strong>.
          </p>
        </div>
        <p><a href="/admin" style="display:inline-block;padding:0.6rem 1.2rem;background:#e11d48;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Quay lại trang quản trị</a></p>
      </body>
      </html>
    `);
  }
}

router.get('/auth/google/callback', handleGoogleOAuthCallback);

// ==========================================
// 3. SECURE FILE STREAMING PROXY (DISPLAY IMAGES)
// ==========================================
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({ error: 'File ID is required.' });
    }

    const { stream, metadata } = await googleDriveService.getFileStream(fileId);

    // Cache headers: 24 hours client cache, 7 days revalidate
    res.setHeader('Content-Type', metadata.mimeType || 'image/jpeg');
    if (metadata.size) {
      res.setHeader('Content-Length', metadata.size);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    if (metadata.md5Checksum) {
      res.setHeader('ETag', `"${metadata.md5Checksum}"`);
    }

    // Check If-None-Match for 304 Not Modified
    if (req.headers['if-none-match'] && metadata.md5Checksum && req.headers['if-none-match'] === `"${metadata.md5Checksum}"`) {
      return res.status(304).end();
    }

    stream.on('error', (streamErr) => {
      console.error('[Drive Stream Pipe Error]', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream image from Google Drive.' });
      }
    });

    stream.pipe(res);
  } catch (err) {
    const status = err.status || err.code;
    if (status === 404) {
      return res.status(404).json({ error: 'Image not found on Google Drive.' });
    }
    return res.status(500).json({ error: 'Failed to retrieve image.' });
  }
});

// Helper to parse base64 payload
function parseBase64Image(imageBase64) {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('Dữ liệu ảnh base64 không được để trống.');
  }
  const commaIdx = imageBase64.indexOf(',');
  const cleanBase64 = commaIdx !== -1 ? imageBase64.substring(commaIdx + 1) : imageBase64;
  return Buffer.from(cleanBase64, 'base64');
}

// ==========================================
// 4. AVATAR UPLOAD (HRM / PROFILE / STAFF)
// ==========================================
router.post('/avatar', requireAuth, async (req, res) => {
  try {
    const { imageBase64, mimeType, staffId, fileName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu hình ảnh (imageBase64).' });
    }

    // Determine target staff: if staffId provided, only admin can update another user's avatar
    const targetId = staffId || req.user.id;
    if (targetId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền thay đổi ảnh đại diện của nhân viên khác.' });
    }

    const staff = await Staff.findOne({
      $or: [{ id: targetId }, { username: targetId }]
    });

    if (!staff) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ nhân viên cần cập nhật ảnh.' });
    }

    // Parse & validate buffer
    const buffer = parseBase64Image(imageBase64);
    const validation = validateImageBuffer(buffer, mimeType || 'image/jpeg');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Upload to Google Drive (folder ID is configured via environment / default)
    const uploadResult = await googleDriveService.uploadImage({
      buffer,
      fileName: fileName || `avatar_${staff.username}`,
      mimeType: validation.mimeType
    });

    // Update staff record with new avatar URL
    const previousAvatar = staff.avatar;
    staff.avatar = uploadResult.url;
    await staff.save();

    return res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công.',
      avatar: uploadResult.url,
      fileId: uploadResult.fileId,
      staff: sanitizeStaff(staff),
      previousAvatar
    });
  } catch (err) {
    console.error('[Avatar Upload Error]', err);
    return res.status(500).json({
      error: err.message || 'Không thể tải ảnh đại diện lên Google Drive.'
    });
  }
});

// ==========================================
// 5. GENERAL IMAGE UPLOAD (POSTS, COVER, CONTENT)
// ==========================================
router.post('/image', requireAuth, async (req, res) => {
  try {
    const { imageBase64, fileName, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu hình ảnh.' });
    }

    const buffer = parseBase64Image(imageBase64);
    const validation = validateImageBuffer(buffer, mimeType || 'image/jpeg');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const result = await googleDriveService.uploadImage({
      buffer,
      fileName,
      mimeType: validation.mimeType
    });

    return res.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      fileName: result.name,
      mimeType: result.mimeType,
      size: result.size
    });
  } catch (err) {
    console.error('[Image Upload Error]', err);
    return res.status(500).json({
      error: err.message || 'Không thể tải ảnh lên Google Drive.'
    });
  }
});

export default router;
