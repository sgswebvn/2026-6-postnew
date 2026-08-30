import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SECRET || 'hori-click-secure-jwt-secret-2026-production';

/**
 * Hash password using standard Scrypt algorithm with 16-byte random salt
 * @param {string} password 
 * @returns {string} format 'salt:hash'
 */
export function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored hash (or legacy plaintext with auto-upgrade flag)
 * @param {string} password 
 * @param {string} storedHash 
 * @returns {{ valid: boolean, needsUpgrade: boolean }}
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return { valid: false, needsUpgrade: false };

  // Check if stored in 'salt:hash' scrypt format
  if (storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return { valid: false, needsUpgrade: false };
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const valid = crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
    return { valid, needsUpgrade: false };
  }

  // Legacy plaintext match
  const valid = password === storedHash;
  return { valid, needsUpgrade: valid };
}

/**
 * Generate a cryptographically signed JWT-like token
 * @param {Object} payload 
 * @param {number} expiresInMs default 7 days
 * @returns {string}
 */
export function generateToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + expiresInMs
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode token
 * @param {string} token 
 * @returns {Object|null}
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Sanitize staff member data for public consumption (zero sensitive credentials/salaries)
 * @param {Object} staff 
 * @returns {Object}
 */
export function sanitizeStaffForPublic(staff) {
  if (!staff) return null;
  const obj = staff.toObject ? staff.toObject() : { ...staff };
  delete obj.password;
  delete obj.passwordHash;
  delete obj.salt;
  delete obj.salary;
  return {
    id: obj.id,
    name: obj.name,
    username: obj.username,
    role: obj.role || 'editor',
    roleName: obj.roleName || '',
    avatar: obj.avatar || '',
    refCode: obj.refCode || '',
    joinDate: obj.joinDate || '',
    status: obj.status || 'active',
    seedingHits: obj.seedingHits || 0,
    permissions: obj.permissions || {}
  };
}

/**
 * Sanitize staff member data for authenticated admin view (includes salary, hides password hash)
 * @param {Object} staff 
 * @returns {Object}
 */
export function sanitizeStaffForAdmin(staff) {
  if (!staff) return null;
  const obj = staff.toObject ? staff.toObject() : { ...staff };
  delete obj.password;
  delete obj.passwordHash;
  delete obj.salt;
  return obj;
}
