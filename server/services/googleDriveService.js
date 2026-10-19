import crypto from 'crypto';
import stream from 'stream';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { Setting } from '../models/Setting.js';

// High-speed local cache directory for proxy-streamed images
const CACHE_DIR = path.join(process.cwd(), '.cache', 'drive_images');
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {}

// Fast in-memory deduplication cache
const md5MemoryCache = new Map();

// Constant folder ID defined in project config
const DEFAULT_FOLDER_ID = '1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1';

// Supported MIME types and extensions
export const ALLOWED_MIME_TYPES = {
  'image/jpeg': { ext: 'jpg', label: 'JPEG' },
  'image/png': { ext: 'png', label: 'PNG' },
  'image/webp': { ext: 'webp', label: 'WebP' },
  'image/gif': { ext: 'gif', label: 'GIF' }
};

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates image buffer using magic byte signatures to prevent MIME spoofing
 */
export function validateImageBuffer(buffer, claimedMimeType) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { valid: false, error: 'Dữ liệu tệp không hợp lệ.' };
  }

  if (buffer.length === 0) {
    return { valid: false, error: 'Tệp rỗng (0 bytes).' };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Dung lượng ảnh vượt quá giới hạn cho phép (Tối đa: 5MB, hiện tại: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`
    };
  }

  const mime = claimedMimeType ? claimedMimeType.toLowerCase().trim() : '';
  if (!ALLOWED_MIME_TYPES[mime]) {
    return {
      valid: false,
      error: 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP hoặc GIF.'
    };
  }

  // Magic bytes check
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;
  const isWebp = buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';
  const isGif = buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a');

  let detectedMime = null;
  if (isJpeg) detectedMime = 'image/jpeg';
  else if (isPng) detectedMime = 'image/png';
  else if (isWebp) detectedMime = 'image/webp';
  else if (isGif) detectedMime = 'image/gif';

  if (!detectedMime) {
    return {
      valid: false,
      error: 'Nội dung tệp không phải là hình ảnh hợp lệ (Magic header signature không khớp).'
    };
  }

  if (detectedMime !== mime) {
    return {
      valid: false,
      error: `Định dạng tệp bị giả mạo. Khai báo: ${mime}, Thực tế: ${detectedMime}.`
    };
  }

  return { valid: true, mimeType: detectedMime, ext: ALLOWED_MIME_TYPES[detectedMime].ext };
}

/**
 * Token Encryption & Decryption (AES-256-GCM)
 */
function getEncryptionKey() {
  const rawKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || 'default-fallback-encryption-key-for-dev-32b';
  return crypto.createHash('sha256').update(rawKey).digest();
}

export function encryptToken(tokenString) {
  if (!tokenString) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  let encrypted = cipher.update(tokenString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedString) {
  if (!encryptedString || !encryptedString.includes(':')) return null;
  try {
    const [ivHex, authTagHex, encrypted] = encryptedString.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[GoogleDriveService] Token decryption error:', err.message);
    return null;
  }
}

/**
 * Service Class for Google Drive Storage
 */
class GoogleDriveService {
  constructor() {
    this.cachedRefreshToken = null;
  }

  getFolderId() {
    return (process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID).trim();
  }

  getClientId() {
    return (process.env.GOOGLE_CLIENT_ID || '').trim();
  }

  getClientSecret() {
    return (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  }

  getRedirectUri(customUri = null) {
    if (customUri && typeof customUri === 'string') {
      return customUri.trim();
    }
    if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
      return process.env.GOOGLE_REDIRECT_URI.trim();
    }
    return 'https://www.thehori.click/api/auth/google/callback';
  }

  /**
   * Retrieves active refresh token from:
   * 1. Environment variable GOOGLE_REFRESH_TOKEN (validated to not be folder ID or placeholder)
   * 2. MongoDB Setting document (key: 'global_settings', field: 'googleDriveTokens.refreshTokenEncrypted')
   */
  async getRefreshToken() {
    const envToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();
    if (envToken && envToken !== this.getFolderId() && !envToken.includes('your_') && envToken.length > 20) {
      return envToken;
    }

    if (this.cachedRefreshToken) {
      return this.cachedRefreshToken;
    }

    try {
      const setting = await Setting.findOne({ key: 'global_settings' });
      const encrypted = setting?.googleDriveTokens?.refreshTokenEncrypted;
      if (encrypted) {
        const decrypted = decryptToken(encrypted);
        if (decrypted) {
          this.cachedRefreshToken = decrypted;
          return decrypted;
        }
      }
    } catch (err) {
      console.warn('[GoogleDriveService] Could not retrieve tokens from Setting:', err.message);
    }

    return null;
  }

  /**
   * Saves refresh token to database
   */
  async saveRefreshToken(refreshToken) {
    if (!refreshToken) return;
    this.cachedRefreshToken = refreshToken;
    this.cachedDriveClient = null;
    this.cachedOAuth2Client = null;
    this.cachedActiveRefreshToken = null;
    try {
      const encrypted = encryptToken(refreshToken);
      await Setting.findOneAndUpdate(
        { key: 'global_settings' },
        {
          $set: {
            'googleDriveTokens.refreshTokenEncrypted': encrypted,
            'googleDriveTokens.updatedAt': new Date()
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('[GoogleDriveService] Failed to persist refresh token to database:', err.message);
    }
  }

  /**
   * Clears stored refresh token from database and cache
   */
  async clearToken() {
    this.cachedRefreshToken = null;
    this.cachedDriveClient = null;
    this.cachedOAuth2Client = null;
    this.cachedActiveRefreshToken = null;
    try {
      await Setting.findOneAndUpdate(
        { key: 'global_settings' },
        {
          $unset: {
            'googleDriveTokens.refreshTokenEncrypted': 1
          },
          $set: {
            'googleDriveTokens.updatedAt': new Date()
          }
        }
      );
      return true;
    } catch (err) {
      console.warn('[GoogleDriveService] Failed to clear token from DB:', err.message);
      return false;
    }
  }

  /**
   * Creates an OAuth2 Client instance
   */
  createOAuth2Client(customRedirectUri = null) {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri(customRedirectUri);

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) chưa được cấu hình.');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates Google OAuth Consent URL
   */
  getAuthUrl(state = '', customRedirectUri = null) {
    const oauth2Client = this.createOAuth2Client(customRedirectUri);
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      state
    });
  }

  /**
   * Exchanges authorization code for tokens, trying candidate redirect URIs if needed
   */
  async exchangeAuthCode(code, candidateUri = null) {
    const candidates = [];
    if (candidateUri) candidates.push(candidateUri);
    if (process.env.GOOGLE_REDIRECT_URI) candidates.push(process.env.GOOGLE_REDIRECT_URI.trim());
    candidates.push('https://www.thehori.click/api/auth/google/callback');
    candidates.push('https://thehori.click/api/auth/google/callback');
    candidates.push('https://www.thehori.click/auth/google/callback');
    candidates.push('http://localhost:5000/api/auth/google/callback');
    candidates.push('http://localhost:3000/api/auth/google/callback');

    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    let lastError = null;
    for (const uri of uniqueCandidates) {
      try {
        const oauth2Client = this.createOAuth2Client(uri);
        const { tokens } = await oauth2Client.getToken(code);
        if (tokens.refresh_token) {
          await this.saveRefreshToken(tokens.refresh_token);
        }
        return tokens;
      } catch (err) {
        lastError = err;
        // If error is not redirect_uri_mismatch, rethrow immediately
        if (!err.message?.includes('redirect_uri_mismatch')) {
          throw err;
        }
      }
    }

    throw lastError || new Error('redirect_uri_mismatch');
  }

  /**
   * Builds an authenticated Drive API Client
   */
  async getDriveClient() {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!clientId || !clientSecret) {
      const err = new Error('Thiếu cấu hình GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trong biến môi trường.');
      err.code = 'CONFIG_MISSING';
      throw err;
    }

    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      const err = new Error('Chưa có Refresh Token Google Drive. Vui lòng cấp quyền OAuth hoặc thêm GOOGLE_REFRESH_TOKEN vào .env.');
      err.code = 'AUTH_REQUIRED';
      throw err;
    }

    // Reuse persistent authenticated client to avoid 1-second token exchange on every single call
    if (this.cachedDriveClient && this.cachedActiveRefreshToken === refreshToken) {
      return this.cachedDriveClient;
    }

    const oauth2Client = this.createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const driveClient = google.drive({ version: 'v3', auth: oauth2Client });

    this.cachedActiveRefreshToken = refreshToken;
    this.cachedOAuth2Client = oauth2Client;
    this.cachedDriveClient = driveClient;

    return driveClient;
  }

  /**
   * Checks the health and connection status of Google Drive
   */
  async checkHealth() {
    const folderId = this.getFolderId();
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const refreshToken = await this.getRefreshToken();

    const diagnostics = {
      folderId,
      clientIdConfigured: Boolean(clientId),
      clientSecretConfigured: Boolean(clientSecret),
      hasRefreshToken: Boolean(refreshToken),
      connected: false,
      folderAccessible: false,
      folderName: null,
      message: ''
    };

    if (!clientId || !clientSecret) {
      diagnostics.message = 'Chưa cấu hình GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET.';
      return diagnostics;
    }

    if (!refreshToken) {
      diagnostics.message = 'Chưa có Refresh Token. Vui lòng thực hiện cấp quyền OAuth Google Drive.';
      return diagnostics;
    }

    try {
      const drive = await this.getDriveClient();
      const folderRes = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, capabilities, trashed',
        supportsAllDrives: true
      });

      if (folderRes.data.trashed) {
        diagnostics.message = `Thư mục Drive (${folderId}) đang nằm trong thùng rác (Trash).`;
        return diagnostics;
      }

      diagnostics.connected = true;
      diagnostics.folderAccessible = true;
      diagnostics.folderName = folderRes.data.name;
      diagnostics.canAddChildren = folderRes.data.capabilities?.canAddChildren ?? true;
      diagnostics.message = `Kết nối thành công tới thư mục: "${folderRes.data.name}" (${folderId}).`;
      return diagnostics;
    } catch (err) {
      const status = err.status || err.code;
      if (status === 404) {
        diagnostics.message = `Không tìm thấy thư mục Google Drive có ID "${folderId}" hoặc tài khoản chưa được chia sẻ quyền.`;
      } else if (status === 403) {
        diagnostics.message = `Không có quyền truy cập vào thư mục Google Drive "${folderId}". Vui lòng kiểm tra quyền chia sẻ.`;
      } else if (status === 401 || err.message?.includes('invalid_grant')) {
        diagnostics.message = 'Refresh Token không hợp lệ hoặc đã bị thu hồi. Vui lòng cấp quyền OAuth lại.';
      } else {
        diagnostics.message = `Lỗi kết nối Google Drive: ${err.message}`;
      }
      return diagnostics;
    }
  }

  /**
   * Upload an image buffer to Google Drive
   */
  async uploadImage({ buffer, fileName, mimeType, folderId = null }) {
    // 1. Validate image format & integrity
    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      const err = new Error(validation.error);
      err.code = 'INVALID_IMAGE';
      throw err;
    }

    // 2. Determine target folder
    const targetFolderId = folderId || this.getFolderId();
    if (!targetFolderId) {
      const err = new Error('ID thư mục Google Drive chưa được thiết lập.');
      err.code = 'FOLDER_ID_MISSING';
      throw err;
    }

    // 3. Compute checksum to prevent redundant duplicates
    const md5Hash = crypto.createHash('md5').update(buffer).digest('hex');

    // 4. Sanitize file name
    const ext = validation.ext;
    const cleanBase = String(fileName || 'image')
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .slice(0, 50);
    const finalFileName = `img_${Date.now()}_${cleanBase.endsWith(`.${ext}`) ? cleanBase : `${cleanBase}.${ext}`}`;

    // 5. Get Drive Client
    const drive = await this.getDriveClient();

    // 6. Fast deduplication check from memory cache (0ms)
    if (md5MemoryCache.has(md5Hash)) {
      const cached = md5MemoryCache.get(md5Hash);
      return {
        fileId: cached.fileId,
        name: cached.name,
        mimeType: cached.mimeType,
        size: cached.size,
        url: `/api/uploads/file/${cached.fileId}`,
        deduplicated: true
      };
    }

    // 7. Perform stream upload directly to Google Drive
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const fileMetadata = {
      name: finalFileName,
      parents: [targetFolderId],
      description: 'Uploaded via HRM / BlogWeb CMS to Google Drive',
      appProperties: {
        md5: md5Hash,
        uploadedAt: new Date().toISOString()
      }
    };

    const media = {
      mimeType: validation.mimeType,
      body: bufferStream
    };

    try {
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink',
        supportsAllDrives: true
      });

      const file = response.data;
      const proxyUrl = `/api/uploads/file/${file.id}`;

      // Immediately cache file to local disk for 0ms subsequent reads
      try {
        await fs.promises.writeFile(path.join(CACHE_DIR, `${file.id}.bin`), buffer);
        await fs.promises.writeFile(path.join(CACHE_DIR, `${file.id}.json`), JSON.stringify({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType || validation.mimeType,
          size: file.size || buffer.length,
          md5Checksum: md5Hash
        }));
        md5MemoryCache.set(md5Hash, {
          fileId: file.id,
          name: file.name,
          mimeType: file.mimeType || validation.mimeType,
          size: file.size || buffer.length
        });
      } catch (cacheErr) {
        // Cache write is non-blocking
      }

      return {
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType || validation.mimeType,
        size: file.size || buffer.length,
        url: proxyUrl,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        deduplicated: false
      };
    } catch (uploadErr) {
      console.error('[GoogleDriveService] Upload failed:', uploadErr);
      const status = uploadErr.status || uploadErr.code;
      if (status === 404) {
        const err = new Error(`Thư mục lưu trữ (${targetFolderId}) không tồn tại trên Google Drive.`);
        err.code = 'FOLDER_NOT_FOUND';
        throw err;
      }
      if (status === 403) {
        const err = new Error(`Không đủ quyền ghi tệp vào thư mục Google Drive (${targetFolderId}).`);
        err.code = 'PERMISSION_DENIED';
        throw err;
      }
      throw new Error(`Tải ảnh lên Google Drive thất bại: ${uploadErr.message}`);
    }
  }

  /**
   * Retrieves a file stream for reading & serving images safely.
   * Uses local cache layer for instant sub-millisecond response.
   */
  async getFileStream(fileId) {
    if (!fileId) throw new Error('File ID is required.');

    // 1. Check local disk cache (instant < 1ms response)
    const binPath = path.join(CACHE_DIR, `${fileId}.bin`);
    const jsonPath = path.join(CACHE_DIR, `${fileId}.json`);
    if (fs.existsSync(binPath) && fs.existsSync(jsonPath)) {
      try {
        const metadata = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
        const diskStream = fs.createReadStream(binPath);
        return {
          stream: diskStream,
          metadata,
          fromCache: true
        };
      } catch (cacheReadErr) {
        // Fallback to Drive if cache read errors
      }
    }

    // 2. Fetch from Google Drive with parallel metadata and stream requests
    const drive = await this.getDriveClient();

    const [meta, media] = await Promise.all([
      drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, md5Checksum, modifiedTime',
        supportsAllDrives: true
      }),
      drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
      )
    ]);

    // Stream to client while concurrently populating local disk cache
    const chunks = [];
    media.data.on('data', chunk => chunks.push(chunk));
    media.data.on('end', async () => {
      try {
        const fullBuffer = Buffer.concat(chunks);
        await fs.promises.writeFile(binPath, fullBuffer);
        await fs.promises.writeFile(jsonPath, JSON.stringify(meta.data));
      } catch (cacheWriteErr) {}
    });

    return {
      stream: media.data,
      metadata: meta.data,
      fromCache: false
    };
  }

  /**
   * Deletes a file from Google Drive (e.g. replacing old avatar)
   */
  async deleteFile(fileId) {
    if (!fileId) return false;
    try {
      const drive = await this.getDriveClient();
      await drive.files.delete({ fileId, supportsAllDrives: true });
      return true;
    } catch (err) {
      console.warn(`[GoogleDriveService] Failed to delete file ${fileId}:`, err.message);
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
export default googleDriveService;
