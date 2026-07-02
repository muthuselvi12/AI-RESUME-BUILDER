/**
 * routes/aiRoutes.js
 */
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { generateResume, improveResume, chat, parseResume } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// Multer config — store file in memory (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  },
});

// All AI routes require authentication
router.use(protect);

router.post('/generate-resume', generateResume);
router.post('/improve-resume',  improveResume);
router.post('/chat',            chat);
router.post('/parse-resume', upload.single('resume'), parseResume);

module.exports = router;