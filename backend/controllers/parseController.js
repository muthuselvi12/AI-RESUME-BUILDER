/**
 * controllers/parseController.js — File parsing for resume extraction
 * Parses PDF, DOC, DOCX, TXT files and extracts resume data
 */

const fs = require('fs');
const path = require('path');

// Try to load parsers - will work after npm install
let pdfParse, mammoth;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not installed');
}
try {
  mammoth = require('mammoth');
} catch (e) {
  console.warn('mammoth not installed');
}

// ─── Helper: Parse extracted text into resume fields ───────────────────────────
const parseResumeText = (text) => {
  if (!text || typeof text !== 'string') {
    console.error('Invalid text input:', text);
    return {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: '',
      experience: '',
      education: '',
      projects: '',
      certifications: ''
    };
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Initialize empty resume data
  const resume = {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    projects: '',
    certifications: ''
  };

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) resume.email = emailMatch[0];

  // Extract phone
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/);
  if (phoneMatch) {
    const phone = phoneMatch[0].replace(/[^\d+\-\s()]/g, '').trim();
    if (phone.length >= 10) resume.phone = phone;
  }

  // Extract location (simple pattern)
  const locationMatch = text.match(/(?:Location|Address|City)[\s:]*([A-Za-z\s,]+)/);
  if (locationMatch) resume.location = locationMatch[1].trim();

  // Try to find name (usually first line or after common headers)
  const firstLine = lines[0];
  if (firstLine && firstLine.length > 2 && firstLine.length < 50 && !firstLine.includes('@')) {
    // Check if it looks like a name (mostly letters)
    if (/^[A-Za-z\s.'-]+$/.test(firstLine)) {
      resume.name = firstLine;
    }
  }

  // Extract skills section
  const skillsPatterns = [
    /(?:Technical Skills|Programming Skills|Skills|Technologies)[\s:]*([\s\S]*?)(?:Experience|Education|Projects|Certifications)/i,
    /(?:SKILLS|TECHNICAL SKILLS)[\s:]*([\s\S]*?)(?:\n\n|\r\n\r\n)/i
  ];
  for (const pattern of skillsPatterns) {
    const match = text.match(pattern);
    if (match) {
      resume.skills = match[1].replace(/[^\w\s,.-]/g, '').trim();
      break;
    }
  }

  // Extract experience section
  const expPatterns = [
    /(?:Work Experience|Professional Experience|Experience)[\s:]*([\s\S]*?)(?:Education|Projects|Skills|Certifications)/i,
    /(?:EXPERIENCE|PROFESSIONAL EXPERIENCE)[\s:]*([\s\S]*?)(?:\n\n|\r\n\r\n)/i
  ];
  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      resume.experience = match[1].trim();
      break;
    }
  }

  // Extract education section
  const eduPatterns = [
    /(?:Education|Academic Background)[\s:]*([\s\S]*?)(?:Experience|Projects|Skills|Certifications)/i,
    /(?:EDUCATION|ACADEMIC BACKGROUND)[\s:]*([\s\S]*?)(?:\n\n|\r\n\r\n)/i
  ];
  for (const pattern of eduPatterns) {
    const match = text.match(pattern);
    if (match) {
      resume.education = match[1].trim();
      break;
    }
  }

  // Extract projects section
  const projPatterns = [
    /(?:Projects|Projects & Achievements)[\s:]*([\s\S]*?)(?:Experience|Education|Skills|Certifications)/i,
    /(?:PROJECTS|PROJECTS & ACHIEVEMENTS)[\s:]*([\s\S]*?)(?:\n\n|\r\n\r\n)/i
  ];
  for (const pattern of projPatterns) {
    const match = text.match(pattern);
    if (match) {
      resume.projects = match[1].trim();
      break;
    }
  }

  // If name still not found, try first substantial line
  if (!resume.name) {
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 40 && /^[A-Za-z\s.'-]+$/.test(line) && !line.includes('@')) {
        resume.name = line;
        break;
      }
    }
  }

  // If no structured sections found, use the whole text as experience
  if (!resume.experience && text.length > 100) {
    resume.experience = text.substring(0, 2000);
  }

  return resume;
};

// ─── @route  POST /api/ai/parse-resume ─────────────────────────────────────────
// ─── @access Private ──────────────────────────────────────────────────────────
const parseResume = async (req, res, next) => {
  try {
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    let text = '';

    console.log('Parsing file:', file.originalname, 'type:', ext, 'size:', file.size);

    if (!file.buffer) {
      console.error('No buffer available');
      return res.status(400).json({ error: 'File data not received properly' });
    }

    if (ext === '.txt') {
      text = file.buffer.toString('utf-8');
      console.log('TXT parsed, length:', text.length);
    } else if (ext === '.pdf') {
      if (pdfParse) {
        const data = await pdfParse(file.buffer);
        text = data.text || '';
        console.log('PDF parsed, length:', text.length);
      } else {
        return res.status(400).json({ error: 'PDF parsing not available. Please install pdf-parse.' });
      }
    } else if (ext === '.docx') {
      // Use mammoth for DOCX files
      if (mammoth) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value || '';
        console.log('DOCX parsed, length:', text.length);
      } else {
        return res.status(400).json({ error: 'DOCX parsing not available. Please install mammoth.' });
      }
    } else if (ext === '.doc') {
      // DOC files require textract which has compatibility issues
      return res.status(400).json({ error: 'DOC format not supported. Please convert to DOCX, PDF, or TXT.' });
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    // Parse the extracted text
    const parsedData = parseResumeText(text);

    res.json({
      message: 'Resume parsed successfully',
      data: parsedData,
      rawText: text.substring(0, 500)
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse file: ' + error.message });
  }
};

module.exports = { parseResume };