/**
 * controllers/historyController.js — Resume and chat history CRUD operations
 */

const Resume = require('../models/Resume');
const Chat = require('../models/Chat');

// ─── GET /api/history/resumes ─────────────────────────────────────────────────
const getResumes = async (req, res, next) => {
  try {
    const { search, template, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'inputData.name': { $regex: search, $options: 'i' } },
      ];
    }

    // Template filter
    const validTemplates = ['modern', 'classic', 'minimal', 'ats-optimal', 'technical', 'executive'];
    if (template && validTemplates.includes(template)) {
      query.template = template;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [resumes, total] = await Promise.all([
      Resume.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-generatedContent'), // Exclude large content from list view
      Resume.countDocuments(query),
    ]);

    res.json({
      resumes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/history/resumes/:id ─────────────────────────────────────────────
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    res.json({ resume });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/history/resumes/:id ─────────────────────────────────────────────
const updateResume = async (req, res, next) => {
  try {
    const { title, template, inputData, generatedContent } = req.body;

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, template, inputData, generatedContent },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    res.json({ message: 'Resume updated.', resume });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/history/:id ───────────────────────────────────────────────────
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    res.json({ message: 'Resume deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/history/chats ───────────────────────────────────────────────────
const getChats = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const query = { userId: req.user._id };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [chats, total] = await Promise.all([
      Chat.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-messages'), // Exclude messages from list (load separately)
      Chat.countDocuments(query),
    ]);

    res.json({
      chats,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/history/chats/:id ───────────────────────────────────────────────
const getChatById = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    res.json({ chat });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/history/chats/:id ────────────────────────────────────────────
const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    res.json({ message: 'Chat deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/history/stats ───────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalResumes, totalChats, recentResumes, templateStats] = await Promise.all([
      Resume.countDocuments({ userId }),
      Chat.countDocuments({ userId }),
      Resume.find({ userId }).sort({ createdAt: -1 }).limit(5).select('title template createdAt'),
      Resume.aggregate([
        { $match: { userId } },
        { $group: { _id: '$template', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      stats: {
        totalResumes,
        totalChats,
        recentResumes,
        templateUsage: templateStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  getChats,
  getChatById,
  deleteChat,
  getStats,
};
