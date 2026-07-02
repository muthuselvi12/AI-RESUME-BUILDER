require('dotenv').config();
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Resume = require('../models/Resume');
const Chat = require('../models/Chat');
const User = require('../models/User');

// ── Initialize Groq AI ────────────────────────────────────────────────────────
let groq;
try {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY not set in .env');
  } else {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq AI initialized');
  }
} catch (err) {
  console.error('❌ Groq init failed:', err.message);
}

// ── Helper: Call Groq AI ──────────────────────────────────────────────────────
const askAI = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.7,
  });
  return response.choices[0].message.content;
};

// ── Helper: Format resume data for prompt ─────────────────────────────────────
const formatResumeData = (d) => `
CANDIDATE INFORMATION:
Name: ${d.name || 'N/A'}
Email: ${d.email || 'N/A'}
Phone: ${d.phone || 'N/A'}
Location: ${d.location || 'N/A'}
LinkedIn: ${d.linkedin || 'N/A'}
GitHub: ${d.github || 'N/A'}
Professional Summary: ${d.summary || 'N/A'}
Skills: ${d.skills || 'N/A'}
Education: ${d.education || 'N/A'}
Work Experience: ${d.experience || 'N/A'}
Projects: ${d.projects || 'N/A'}
Certifications: ${d.certifications || 'N/A'}
Publications: ${d.publications || 'N/A'}
Languages: ${d.languages || 'N/A'}
`.trim();

// ── POST /api/ai/generate-resume ──────────────────────────────────────────────
const generateResume = async (req, res, next) => {
  if (!groq) {
    return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to backend .env file.' });
  }

  try {
    const { inputData, template = 'modern', title = 'My Resume', jobDescription } = req.body;

    if (!inputData?.name) {
      return res.status(400).json({ error: 'Candidate name is required.' });
    }

    const prompt = jobDescription && jobDescription.trim()
      ? `
You are a professional resume writer and ATS optimization expert.

A candidate wants to apply for a job. Write a HIGHLY ATS-OPTIMIZED resume TAILORED to the job description below.

JOB DESCRIPTION:
${jobDescription}

${formatResumeData(inputData)}

INSTRUCTIONS:
1. Analyze the job description — extract key skills, keywords, tools, requirements
2. Rewrite experience and summary to MATCH the job requirements
3. Include ALL important keywords from the job description naturally
4. Use strong action verbs: Led, Developed, Implemented, Achieved, Optimized, Built, Delivered
5. Quantify achievements with numbers and percentages wherever possible
6. Make skills section mirror what the job description asks for
7. Keep formatting clean and ATS-friendly — no tables, no graphics
8. Use standard section headings ATS systems recognize

TEMPLATE STYLE: ${template}

OUTPUT FORMAT (use EXACTLY these section headings in ALL CAPS, in this EXACT order):
[Candidate Full Name]
[Email] | [Phone] | [Location] | [LinkedIn] | [GitHub]

PROFESSIONAL SUMMARY
(2-3 sentences tailored to this specific role using job keywords)

SKILLS
(comma-separated, prioritize skills from job description)

EDUCATION
(Institution | Degree | Year)

WORK EXPERIENCE
(Each role: Company | Title | Duration)
- Achievement bullet points using job description keywords

PROJECTS
(Project Name | Technologies)
- Description

CERTIFICATIONS
(if any)

PUBLICATIONS
(if any)

LANGUAGES
(if any)

Return ONLY the resume text. No extra commentary or explanation.
      `.trim()
      : `
You are a professional resume writer and ATS optimization expert.

Write a CLEAN, PROFESSIONAL, ATS-FRIENDLY resume based on the candidate information below.

${formatResumeData(inputData)}

INSTRUCTIONS:
1. Write a compelling professional summary highlighting key strengths
2. Organize skills clearly and relevantly
3. Use strong action verbs: Led, Developed, Implemented, Achieved, Optimized, Built, Delivered
4. Quantify achievements with numbers and percentages wherever possible
5. Use clean formatting — no tables, no graphics, no special characters
6. Use standard ATS-recognized section headings
7. Make every bullet point impactful and concise

TEMPLATE STYLE: ${template}

OUTPUT FORMAT (use EXACTLY these section headings in ALL CAPS, in this EXACT order):
[Candidate Full Name]
[Email] | [Phone] | [Location] | [LinkedIn] | [GitHub]

PROFESSIONAL SUMMARY
(2-3 strong sentences highlighting candidate value)

SKILLS
(comma-separated list of relevant skills)

EDUCATION
(Institution | Degree | Year)

WORK EXPERIENCE
(Each role: Company | Title | Duration)
- Achievement-focused bullet points

PROJECTS
(Project Name | Technologies)
- Description

CERTIFICATIONS
(if any)

PUBLICATIONS
(if any)

LANGUAGES
(if any)

Return ONLY the resume text. No extra commentary or explanation.
      `.trim();

    const generatedContent = await askAI(prompt);

    const resume = await Resume.create({
      userId: req.user._id,
      inputData,
      generatedContent,
      template,
      title,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { resumesCreated: 1 } });

    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('resume-generated', {
        resumeId: resume._id,
        title,
      });
    }

    res.status(201).json({
      message: 'Resume generated successfully!',
      resume: {
        id: resume._id,
        generatedContent,
        template,
        title,
        createdAt: resume.createdAt,
      },
    });

  } catch (err) {
    console.error('Resume generation failed:', err.message);
    next(err);
  }
};

// ── POST /api/ai/improve-resume ───────────────────────────────────────────────
const improveResume = async (req, res, next) => {
  if (!groq) {
    return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to backend .env file.' });
  }

  try {
    const { resumeContent, resumeId, jobDescription } = req.body;

    if (!resumeContent) {
      return res.status(400).json({ error: 'Resume content is required.' });
    }

    const prompt = `
You are an expert resume editor and ATS optimization specialist.

Improve the following resume:

${resumeContent}

${jobDescription ? `Optimize specifically for this job:\n${jobDescription}\n` : ''}

IMPROVEMENT TASKS:
1. Strengthen all action verbs
2. Add quantifiable metrics to achievements
3. Improve professional summary
4. Fix grammar and professional language
5. Make bullet points more impactful
6. Ensure ATS-friendly formatting
7. Remove weak phrases like "responsible for" or "helped with"
8. Keep the section order exactly as is: SUMMARY, SKILLS, EDUCATION, EXPERIENCE, PROJECTS, CERTIFICATIONS, PUBLICATIONS, LANGUAGES

Return ONLY the improved resume text. Keep same format and ALL CAPS section headings.
No extra commentary or explanation.
    `.trim();

    const improvedContent = await askAI(prompt);

    if (resumeId) {
      await Resume.findOneAndUpdate(
        { _id: resumeId, userId: req.user._id },
        { generatedContent: improvedContent }
      );
    }

    res.json({
      message: 'Resume improved successfully!',
      improvedContent,
    });

  } catch (err) {
    console.error('Resume improvement failed:', err.message);
    next(err);
  }
};

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
const chat = async (req, res, next) => {
  if (!groq) {
    return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to backend .env file.' });
  }

  try {
    const { message, chatId, resumeContext } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    let chatSession;
    let history = '';

    if (chatId) {
      chatSession = await Chat.findOne({ _id: chatId, userId: req.user._id });
      if (chatSession) {
        history = chatSession.messages.slice(-6).map(m =>
          `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        ).join('\n');
      }
    }

    const prompt = `
You are an expert AI career coach and resume assistant.
You help users with resume improvement, skill suggestions, cover letters, interview preparation, and career advice.
Be concise, professional, and always give concrete actionable suggestions.
Use bullet points and clear formatting in your responses.

${resumeContext ? `User resume context:\n${resumeContext}\n` : ''}
${history ? `Previous conversation:\n${history}\n` : ''}

User: ${message}
Assistant:`.trim();

    const assistantResponse = await askAI(prompt);

    if (chatSession) {
      chatSession.messages.push(
        { role: 'user', content: message },
        { role: 'assistant', content: assistantResponse }
      );
      await chatSession.save();
    } else {
      const titleText = message.length > 50
        ? message.substring(0, 50) + '...'
        : message;

      chatSession = await Chat.create({
        userId: req.user._id,
        title: titleText,
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: assistantResponse },
        ],
      });

      await User.findByIdAndUpdate(req.user._id, { $inc: { chatsCount: 1 } });
    }

    res.json({
      message: 'Response generated!',
      response: assistantResponse,
      chatId: chatSession._id,
      title: chatSession.title,
    });

  } catch (err) {
    console.error('Chat failed:', err.message);
    next(err);
  }
};

// ── POST /api/ai/parse-resume ─────────────────────────────────────────────────
const parseResume = async (req, res, next) => {
  if (!groq) {
    return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to backend .env file.' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let resumeText = '';
    const mimeType = req.file.mimetype;
    const fileName = req.file.originalname.toLowerCase();

    // ── Extract text based on file type ──
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      resumeText = result.value;
    } else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
      resumeText = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' });
    }

    resumeText = resumeText.trim();

    if (!resumeText || resumeText.length < 20) {
      return res.status(400).json({ error: 'Could not extract readable text from this file. Try a different format.' });
    }

    console.log('Extracted resume text length:', resumeText.length);
    console.log('First 300 chars:', resumeText.substring(0, 300));

    // ── Use AI to parse text into structured fields ──
    const parsePrompt = `
You are a resume parser. Extract structured information from this resume text and return ONLY valid JSON.

RESUME TEXT:
${resumeText.substring(0, 6000)}

Extract and return ONLY a valid JSON object with these exact fields:
{
  "name": "full name of the candidate",
  "email": "email address",
  "phone": "phone number",
  "location": "city, state or country",
  "linkedin": "linkedin profile URL if mentioned, else empty string",
  "github": "github profile URL if mentioned, else empty string",
  "summary": "ONLY the professional summary, objective, or 'about me' paragraph near the top of the resume describing the candidate's background and career goals. Do NOT include any work history, company names, or job titles in this field.",
  "skills": "comma-separated list of ALL technical and soft skills found",
  "education": "all education formatted as: Institution | Degree | Year on each line",
  "experience": "ONLY actual jobs, internships, or work history with company names and job titles, each formatted as: Company | Job Title | Duration on first line, then bullet points with • for each responsibility. If the candidate has no formal work experience or internships listed, return empty string. Do NOT put summary or objective text here.",
  "projects": "all projects formatted as: Project Name | Technologies Used on first line, then • description on next line. Separate each project with a blank line.",
  "certifications": "all certifications found, one per line, format: Certification Name | Issuer | Year. If none found, return empty string",
  "publications": "all publications found, one per line. If none found, return empty string",
  "languages": "comma-separated list of spoken/written languages mentioned, if any. If none found, return empty string"
}

CRITICAL RULES:
- The "summary" field must ONLY contain the about/objective paragraph, NEVER work experience or company details
- The "experience" field must ONLY contain real jobs/internships with company names, NEVER summary or objective text
- The summary field must NEVER contain words like "internship", "experience in", "worked at", "company", "led", "developed", "managed", or any company-related achievement language — that belongs ONLY in the experience field
- The summary field should be a short 2-3 sentence overview only, describing the candidate's background and career goals
- Extract EVERY piece of information present in the resume text, do not skip anything
- If a section genuinely doesn't exist in the resume, use empty string ""
- Do not invent information that isn't in the text
- Preserve all bullet points and details from experience and projects
- Return ONLY the JSON object, no markdown code blocks, no explanation text
    `.trim();

    const jsonResponse = await askAI(parsePrompt);

    const cleaned = jsonResponse
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse failed, raw AI response:', jsonResponse);

      const emailMatch    = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch     = resumeText.match(/[\+]?[\d\s\-().]{7,15}/);
      const linkedinMatch  = resumeText.match(/linkedin\.com\/in\/[\w-]+/i);
      const githubMatch    = resumeText.match(/github\.com\/[\w-]+/i);
      const lines          = resumeText.split('\n').filter(l => l.trim());

      parsed = {
        name:           lines[0]?.trim() || '',
        email:          emailMatch?.[0] || '',
        phone:          phoneMatch?.[0]?.trim() || '',
        location:       '',
        linkedin:       linkedinMatch?.[0] || '',
        github:         githubMatch?.[0] || '',
        summary:        '',
        skills:         '',
        education:      '',
        experience:     resumeText.substring(0, 2000),
        projects:       '',
        certifications: '',
        publications:   '',
        languages:      '',
      };
    }

    console.log('Parsed result:', parsed);

    res.json({
      message: 'Resume parsed successfully!',
      data: parsed,
    });

  } catch (err) {
    console.error('Parse error:', err.message);
    next(err);
  }
};

module.exports = { generateResume, improveResume, chat, parseResume };