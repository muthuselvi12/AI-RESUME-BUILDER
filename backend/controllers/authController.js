/**
 * controllers/authController.js — User registration, login, profile
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper: Generate JWT ──────────────────────────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ─── @route  POST /api/auth/register ──────────────────────────────────────────
// ─── @access Public ───────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Create user (password hashing happens in pre-save hook)
    // Convert email to lowercase to match schema transform
    const user = await User.create({ name, email: email.toLowerCase(), password });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        resumesCreated: user.resumesCreated,
        chatsCount: user.chatsCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  POST /api/auth/login ─────────────────────────────────────────────
// ─── @access Public ───────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        resumesCreated: user.resumesCreated,
        chatsCount: user.chatsCount,
        lastActive: user.lastActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  GET /api/auth/me ──────────────────────────────────────────────────
// ─── @access Private ──────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        resumesCreated: user.resumesCreated,
        chatsCount: user.chatsCount,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route  PUT /api/auth/profile ────────────────────────────────────────────
// ─── @access Private ──────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      // Retrieve user with password so pre-save hook runs correctly
      const user = await User.findById(req.user._id).select('+password');
      user.name = name || user.name;
      user.password = password;
      await user.save();

      return res.json({ message: 'Profile updated successfully.' });
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.json({ message: 'Profile updated.', user: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile };
