/**
 * routes/historyRoutes.js
 */

const express = require('express');
const router = express.Router();
const {
  getResumes, getResumeById, updateResume, deleteResume,
  getChats, getChatById, deleteChat, getStats,
} = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Stats
router.get('/stats', getStats);

// Resume history
router.get('/resumes', getResumes);
router.get('/resumes/:id', getResumeById);
router.put('/resumes/:id', updateResume);
router.delete('/resumes/:id', deleteResume);

// Backward compat: DELETE /api/history/:id → delete resume
router.delete('/:id', deleteResume);

// Chat history
router.get('/chats', getChats);
router.get('/chats/:id', getChatById);
router.delete('/chats/:id', deleteChat);

module.exports = router;
