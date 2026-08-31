import crypto from 'crypto';
import { getJwtSecret, getJwtSecretPrevious } from './env.js';

function hmacSign(header, body, secret) {
  return crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
}

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    const dummy = Buffer.alloc(bufA.length || 1);
    crypto.timingSafeEqual(bufA.length ? bufA : dummy, bufA.length ? bufA : dummy);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return { valid: false, needsUpgrade: false };

  if (storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return { valid: false, needsUpgrade: false };
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    if (computedHash.length !== originalHash.length) {
      return { valid: false, needsUpgrade: false };
    }
    try {
      const valid = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(originalHash, 'hex')
      );
      return { valid, needsUpgrade: false };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  return { valid: false, needsUpgrade: false };
}

export function generateToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    id: payload.id,
    tokenVersion: payload.tokenVersion || 0,
    iat: Date.now(),
    exp: Date.now() + expiresInMs
  })).toString('base64url');
  const signature = hmacSign(header, body, secret);
  return `${header}.${body}.${signature}`;
}

function decodeAndVerifyWithSecret(header, body, signature, secret) {
  const expectedSig = hmacSign(header, body, secret);
  if (!timingSafeEqualString(signature, expectedSig)) return null;

  let headerObj;
  try {
    headerObj = JSON.parse(Buffer.from(header, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
  if (!headerObj || headerObj.alg !== 'HS256' || headerObj.typ !== 'JWT') {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  try {
    const current = decodeAndVerifyWithSecret(header, body, signature, getJwtSecret());
    if (current) return current;
  } catch {
    return null;
  }

  const previous = getJwtSecretPrevious();
  if (previous) {
    try {
      return decodeAndVerifyWithSecret(header, body, signature, previous);
    } catch {
      return null;
    }
  }
  return null;
}

export function getStaffId(staff) {
  if (!staff) return '';
  if (typeof staff.get === 'function') {
    const custom = staff.get('id');
    if (custom) return String(custom);
  }
  if (staff.id) return String(staff.id);
  return '';
}

export function sanitizeStaffForPublic(staff) {
  if (!staff) return null;
  const obj = staff.toObject ? staff.toObject() : { ...staff };
  return {
    id: getStaffId(staff) || obj.id,
    name: obj.name,
    roleName: obj.roleName || '',
    avatar: obj.avatar || '',
    refCode: obj.refCode || '',
    joinDate: obj.joinDate || ''
  };
}

export function sanitizeStaffForAdmin(staff) {
  if (!staff) return null;
  const obj = staff.toObject ? staff.toObject() : { ...staff };
  delete obj.password;
  delete obj.passwordHash;
  delete obj.salt;
  delete obj._id;
  delete obj.__v;
  const customId = getStaffId(staff);
  if (customId) obj.id = customId;
  return obj;
}

export function actorFromStaff(staff) {
  if (!staff) return null;
  const obj = staff.toObject ? staff.toObject() : staff;
  return {
    id: getStaffId(staff) || obj.id,
    username: obj.username,
    name: obj.name,
    role: obj.role || 'editor',
    status: obj.status || 'active',
    tokenVersion: obj.tokenVersion || 0,
    permissions: obj.permissions || {}
  };
}
