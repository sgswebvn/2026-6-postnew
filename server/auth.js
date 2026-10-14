import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Staff } from './models/Staff.js';
import rateLimit from 'express-rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'a-very-strong-production-jwt-secret-min-32-chars';
const COOKIE_NAME = 'admin_session';

// 1. Password Hashing & Constant-time Verification (scrypt compatible with existing staff)
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword || typeof storedPassword !== 'string' || !storedPassword.includes(':')) {
    return false;
  }
  try {
    const [salt, key] = storedPassword.split(':');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(key, 'hex'));
  } catch (err) {
    return false;
  }
}

// 2. JWT Generation & Verification
export function signToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      username: user.username,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// 3. Cookie Options
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

export { COOKIE_NAME };

// 4. Rate Limiter for Login (Chống Brute-force)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // Max 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

// 5. Auth Middleware
export async function requireAuth(req, res, next) {
  let token = req.cookies?.[COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Authentication token is missing.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  try {
    const user = await Staff.findOne({
      $or: [{ id: payload.id }, { username: payload.username }]
    });

    if (!user || user.status === 'inactive') {
      return res.status(401).json({ error: 'Account disabled or not found.' });
    }

    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Session revoked. Please log in again.' });
    }

    req.user = {
      id: user.id || user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      avatar: user.avatar
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error while verifying session.' });
  }
}

// 6. Admin Only Role Middleware
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
  next();
}

// 7. Sanitize Staff for API output (Never leak password or internal tokens)
export function sanitizeStaff(staffDoc) {
  if (!staffDoc) return null;
  const s = staffDoc.toObject ? staffDoc.toObject() : staffDoc;
  const { password, tokenVersion, __v, ...safe } = s;
  return safe;
}
