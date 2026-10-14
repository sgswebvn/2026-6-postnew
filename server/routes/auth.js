import express from 'express';
import { Staff } from '../models/Staff.js';
import {
  verifyPassword,
  signToken,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  loginRateLimiter,
  requireAuth,
  sanitizeStaff
} from '../auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const user = await Staff.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanUsername }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Your account is currently disabled. Contact system administrator.' });
    }

    const isValid = verifyPassword(password.trim(), user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Sign JWT Token
    const token = signToken(user);

    // Set HttpOnly cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    const safeUser = sanitizeStaff(user);
    return res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: 'Authentication failed due to an internal error.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.json({ message: 'Logged out successfully.' });
});

export default router;
