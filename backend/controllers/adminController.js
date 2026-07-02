/**
 * controllers/adminController.js — Admin-only operations
 */

const User = require('../models/User');
const Resume = require('../models/Resume');
const Chat = require('../models/Chat');

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalResumes, totalChats, recentUsers, recentResumes] = await Promise.all([
      User.countDocuments(),
      Resume.countDocuments(),
      Chat.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt lastActive'),
      Resume.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .select('title template createdAt userId'),
    ]);

    // User growth — last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newResumesThisWeek = await Resume.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      dashboard: {
        totals: { users: totalUsers, resumes: totalResumes, chats: totalChats },
        thisWeek: { users: newUsersThisWeek, resumes: newResumesThisWeek },
        recentUsers,
        recentResumes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(query),
    ]);

    res.json({ users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/admin/users/:id/role ────────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin".' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: `User role updated to ${role}.`, user });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Resume.deleteMany({ userId: req.params.id }),
      Chat.deleteMany({ userId: req.params.id }),
    ]);

    res.json({ message: 'User and all associated data deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getUsers, updateUserRole, deleteUser };
