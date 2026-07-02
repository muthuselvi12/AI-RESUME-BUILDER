/**
 * middleware/auth.js — JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect: Verify JWT and attach user to req ───────────────────────────────
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found. Token invalid.' });
    }

    // Update last active (non-blocking — don't slow down every request for this)
    User.findByIdAndUpdate(decoded.id, { lastActive: Date.now() }).catch((err) =>
      console.error('Failed to update lastActive:', err.message)
    );

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token expired or invalid. Please log in again.' });
  }
};

// ─── AdminOnly: Restrict to admin role ───────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { protect, adminOnly };
