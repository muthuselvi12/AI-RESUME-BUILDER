import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { aiService, historyService } from '../services/api';
import { useToast } from '../context/ToastContext';

const TEMPLATES = [
  { id: 'modern',      label: 'Modern',      color: '#6366f1', icon: '✨' },
  { id: 'classic',     label: 'Classic',     color: '#1a1a2e', icon: '📜' },
  { id: 'minimal',     label: 'Minimal',     color: '#6b7280', icon: '⬜' },
  { id: 'ats-optimal', label: 'ATS Optimal', color: '#059669', icon: '🎯' },
  { id: 'technical',   label: 'Technical',   color: '#0891b2', icon: '💻' },
  { id: 'executive',   label: 'Executive',   color: '#7c3aed', icon: '👔' },
];

const EMPTY = {
  name: '', email: '', phone: '', location: '',
  linkedin: '', github: '',
  summary: '', skills: '', experience: '',
  education: '', projects: '',
  certifications: '', publications: '', languages: '',
};

// ── Parse AI-generated plain text back into structured fields ─────────────────
// This lets the generated resume render through the SAME styled ResumePreview
// component, so only the TEXT changes after generation — not the visual style.
const parseGeneratedText = (text) => {
  if (!text) return null;

  const sections = {
    name: '', email: '', phone: '', location: '', linkedin: '', github: '',
    summary: '', skills: '', education: '', experience: '',
    projects: '', certifications: '', publications: '', languages: '',
  };

  const sectionKeyMap = {
    'PROFESSIONAL SUMMARY': 'summary',
    'SUMMARY': 'summary',
    'SKILLS': 'skills',
    'EDUCATION': 'education',
    'WORK EXPERIENCE': 'experience',
    'EXPERIENCE': 'experience',
    'PROJECTS': 'projects',
    'CERTIFICATIONS': 'certifications',
    'PUBLICATIONS': 'publications',
    'LANGUAGES': 'languages',
  };
  const sectionNames = Object.keys(sectionKeyMap);

  const lines = text.split('\n');
  let i = 0;

  // First non-empty line = name
  while (i < lines.length && !lines[i].trim()) i++;
  sections.name = lines[i]?.trim() || '';
  i++;

  // Next non-empty line = contact info (email | phone | location | linkedin | github)
  while (i < lines.length && !lines[i].trim()) i++;
  const contactLine = lines[i]?.trim() || '';
  i++;

  if (contactLine) {
    const parts = contactLine.split('|').map(p => p.trim()).filter(Boolean);
    parts.forEach(part => {
      if (part.includes('@')) sections.email = part;
      else if (part.match(/linkedin\.com/i)) sections.linkedin = part;
      else if (part.match(/github\.com/i)) sections.github = part;
      else if (part.match(/[\d\-+()]{7,}/)) sections.phone = part;
      else if (!sections.location) sections.location = part;
    });
  }

  // Walk remaining lines, bucket into sections
  let currentSection = null;
  for (; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match section headers - allow for potential text after header (like "SKILLS:")
    const matched = sectionNames.find(s => trimmed.toUpperCase().startsWith(s + '') || trimmed.toUpperCase() === s);

    if (matched) {
      currentSection = sectionKeyMap[matched];
      continue;
    }

    if (currentSection && trimmed) {
      sections[currentSection] += (sections[currentSection] ? '\n' : '') + trimmed;
    }
  }

  // Clean up sections - remove placeholder text like "N/A", "(if any)", etc.
  const placeholderPatterns = [
    /^n\/a$/i,
    /^\(if any\)$/i,
    /^none$/i,
    /^n\/a\.?$/i,
  ];

  Object.keys(sections).forEach(key => {
    let val = sections[key];
    if (val && typeof val === 'string') {
      const trimmed = val.trim().toLowerCase();
      // Check if entire value is just a placeholder
      const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(trimmed));
      if (isPlaceholder) {
        sections[key] = '';
      } else {
        // Remove placeholder lines from multi-line content
        const lines = val.split('\n').filter(line => {
          const lineTrimmed = line.trim().toLowerCase();
          return lineTrimmed && !placeholderPatterns.some(pattern => pattern.test(lineTrimmed));
        });
        sections[key] = lines.join('\n');
      }
    }
  });

  // Debug: log what was parsed
  console.log('Parsed generated text sections:', {
    summary: sections.summary?.substring(0, 50),
    experience: sections.experience?.substring(0, 50),
    certifications: sections.certifications?.substring(0, 50),
    publications: sections.publications?.substring(0, 50),
    languages: sections.languages?.substring(0, 50),
  });

  return sections;
};

// ── ATS Score Calculator ──────────────────────────────────────────────────────
const calcATS = (form) => {
  let score = 0;
  const feedback = [];

  if (form.name?.trim())             score += 10; else feedback.push('Add your full name');
  if (form.email?.includes('@'))     score += 5;  else feedback.push('Add a professional email');
  if (form.phone?.trim())            score += 5;  else feedback.push('Add your phone number');
  if (form.linkedin?.trim())         score += 5;  else feedback.push('Add LinkedIn profile URL');
  if (form.github?.trim())           score += 5;  else feedback.push('Add GitHub profile URL');

  if (form.summary?.length > 50)          score += 15;
  else if (form.summary?.length > 20)     score += 8;
  else feedback.push('Add a professional summary (50+ characters)');

  if (form.skills) {
    const n = form.skills.split(',').filter(s => s.trim()).length;
    if (n >= 8)      score += 20;
    else if (n >= 5) score += 15;
    else if (n >= 3) score += 10;
    else { score += 5; feedback.push('Add more skills (8+ recommended)'); }
  } else feedback.push('Add relevant skills');

  if (form.experience?.trim())    score += 15; else feedback.push('Add work experience');
  if (form.education?.trim())     score += 8;  else feedback.push('Add education details');
  if (form.projects?.trim())      score += 7;  else feedback.push('Add projects');
  if (form.certifications?.trim()) score += 5;

  const text = `${form.summary || ''} ${form.experience || ''}`.toLowerCase();
  const verbs = ['led','developed','created','managed','implemented','achieved','improved','designed','built','launched','delivered','optimized'];
  if (verbs.filter(v => text.includes(v)).length >= 3) score = Math.min(score + 5, 100);

  return { score: Math.min(score, 100), feedback: feedback.slice(0, 5) };
};

// ── ATS Score Panel ───────────────────────────────────────────────────────────
function ATSScore({ form, jobDesc }) {
  const { score, feedback } = calcATS(form);
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

  return (
    <div style={{ background: 'var(--bg)', border: `1.5px solid ${color}30`, borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🎯 ATS Score
        </h4>
        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: `${color}20`, color }}>{label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `conic-gradient(${color} ${score * 3.6}deg, var(--bg3) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color }}>{score}</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px', fontWeight: 500 }}>
            {score >= 80 ? '✅ Great ATS compatibility!'
              : score >= 60 ? '⚠️ Good — can still improve'
              : '❌ Fill more sections to improve'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{score}/100 points</p>
          {jobDesc && (
            <p style={{ fontSize: '10px', color: '#059669', marginTop: '3px', fontWeight: 500 }}>
              🎯 Job description detected — AI will tailor your resume
            </p>
          )}
        </div>
      </div>

      {feedback.length > 0 && (
        <div style={{ background: 'var(--bg2)', borderRadius: '8px', padding: '10px 12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '5px' }}>📋 Suggestions:</p>
          <ul style={{ fontSize: '11px', color: 'var(--text3)', paddingLeft: '16px', margin: 0, lineHeight: 1.8 }}>
            {feedback.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Styled Resume Preview — used for BOTH live preview and generated content ──
function ResumePreview({ formData: data, template }) {
  const safeData = data || {};
  const skills = safeData.skills ? safeData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const langs  = safeData.languages ? safeData.languages.split(',').map(s => s.trim()).filter(Boolean) : [];
  const hasContent = safeData.name || safeData.skills || safeData.experience;

  const accent = {
    modern: '#6366f1', classic: '#1a1a2e', minimal: '#374151',
    'ats-optimal': '#059669', technical: '#0891b2', executive: '#7c3aed',
  }[template] || '#6366f1';

  const SectionTitle = ({ title }) => (
    <h2 style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: accent,
      borderBottom: `1.5px solid ${accent}`, paddingBottom: '3px', marginBottom: '6px',
    }}>{title}</h2>
  );

  if (!hasContent) return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af' }}>
      <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>📄</div>
      <p style={{ fontSize: '12px' }}>Fill in your details to see the live preview</p>
    </div>
  );

  return (
    <div id="resume-preview" style={{ fontFamily: 'Georgia, serif', fontSize: '11px', color: '#1a1a2e', lineHeight: 1.55 }}>

      {/* Header */}
      <div style={{ borderBottom: `2.5px solid ${accent}`, paddingBottom: '10px', marginBottom: '12px' }}>
        <h1 style={{
          fontSize: template === 'minimal' ? '15px' : '19px',
          fontWeight: template === 'minimal' ? 400 : 700,
          color: template === 'modern' ? accent : '#1a1a2e',
          marginBottom: '4px',
          letterSpacing: template === 'minimal' ? '0.08em' : 'normal',
        }}>
          {safeData.name || 'Your Name'}
        </h1>
        <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.7 }}>
          {[safeData.email, safeData.phone, safeData.location].filter(Boolean).join(' | ')}
        </p>
        {(safeData.linkedin || safeData.github) && (
          <p style={{ fontSize: '10px', color: accent, lineHeight: 1.7 }}>
            {[safeData.linkedin, safeData.github].filter(Boolean).join(' | ')}
          </p>
        )}
      </div>

      {safeData.summary && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Professional Summary" />
          <p style={{ fontSize: '10px', color: '#374151', lineHeight: 1.6 }}>{safeData.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Skills" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {skills.map((sk, i) => (
              <span key={i} style={{ padding: '2px 8px', background: `${accent}15`, color: accent, borderRadius: '4px', fontSize: '9px', fontWeight: 500 }}>{sk}</span>
            ))}
          </div>
        </div>
      )}

      {safeData.education && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Education" />
          <p style={{ fontSize: '10px', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{safeData.education}</p>
        </div>
      )}

      {safeData.experience && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Work Experience" />
          <p style={{ fontSize: '10px', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{safeData.experience}</p>
        </div>
      )}

      {safeData.projects && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Projects" />
          <p style={{ fontSize: '10px', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{safeData.projects}</p>
        </div>
      )}

      {safeData.certifications && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Certifications" />
          <p style={{ fontSize: '10px', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{safeData.certifications}</p>
        </div>
      )}

      {safeData.publications && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Publications" />
          <p style={{ fontSize: '10px', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{safeData.publications}</p>
        </div>
      )}

      {langs.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <SectionTitle title="Languages" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {langs.map((l, i) => (
              <span key={i} style={{ padding: '2px 8px', background: `${accent}10`, color: accent, borderRadius: '4px', fontSize: '9px' }}>{l}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Builder Page ─────────────────────────────────────────────────────────
export default function BuilderPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const fileRef = useRef(null);

  const [form,       setForm]      = useState(EMPTY);
  const [template,   setTemplate]  = useState('modern');
  const [title,      setTitle]     = useState('My Resume');
  const [jobDesc,    setJobDesc]   = useState('');
  const [generated,  setGenerated] = useState('');
  const [resumeId,   setResumeId]  = useState(null);
  const [activeTab,  setActiveTab] = useState('preview');
  const [isMobile,   setIsMobile]  = useState(window.innerWidth < 768);
  const [loading,    setLoading]   = useState(false);
  const [improving,  setImproving] = useState(false);
  const [parsing,    setParsing]   = useState(false);
  const [genMode,    setGenMode]   = useState('');

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    if (id) {
      historyService.getResumeById(id)
        .then(r => {
          const res = r.data.resume;
          setForm({ ...EMPTY, ...res.inputData });
          setTemplate(res.template);
          setTitle(res.title);
          setGenerated(res.generatedContent);
          setResumeId(res._id);
        })
        .catch(() => toast('Could not load resume', 'error'));
    }
  }, [id]);

  const setField = useCallback((key, val) => {
    console.log('Field updated:', key, '=', val);
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  // ── Import & parse resume file ─────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
      toast('Please upload PDF, DOC, DOCX, or TXT', 'error');
      return;
    }
    setParsing(true);
    try {
      if (ext === '.txt') {
        const text = await file.text();
        const emailM    = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneM    = text.match(/[\+]?[\d\s\-().]{7,15}/);
        const linkedinM = text.match(/linkedin\.com\/in\/[\w-]+/i);
        const githubM   = text.match(/github\.com\/[\w-]+/i);
        const lines     = text.split('\n').filter(l => l.trim());
        setForm(prev => ({
          ...prev,
          name:       lines[0]              || prev.name,
          email:      emailM?.[0]           || prev.email,
          phone:      phoneM?.[0]?.trim()   || prev.phone,
          linkedin:   linkedinM?.[0]        || prev.linkedin,
          github:     githubM?.[0]          || prev.github,
          experience: text.substring(0, 2000),
        }));
        toast('✅ File loaded! Review and edit the details below.', 'success');
      } else {
        const result = await aiService.parseResume(file);
        const parsed = result.data?.data || {};
        console.log('Parsed resume data:', parsed);

        if (!parsed.name && !parsed.email && !parsed.skills) {
          toast('⚠️ Could not extract data clearly. Please fill manually.', 'error');
        }

        setForm(prev => ({
          name:           parsed.name           || prev.name,
          email:          parsed.email          || prev.email,
          phone:          parsed.phone          || prev.phone,
          location:       parsed.location       || prev.location,
          linkedin:       parsed.linkedin       || prev.linkedin,
          github:         parsed.github         || prev.github,
          summary:        parsed.summary        || prev.summary,
          skills:         parsed.skills         || prev.skills,
          education:      parsed.education      || prev.education,
          experience:     parsed.experience     || prev.experience,
          projects:       parsed.projects       || prev.projects,
          certifications: parsed.certifications || prev.certifications,
          publications:   parsed.publications   || prev.publications,
          languages:      parsed.languages      || prev.languages,
        }));
        toast('✅ Resume parsed! Review and edit the details.', 'success');
      }

    } catch (err) {
      toast('Parse failed: ' + err.message, 'error');
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Generate Resume ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!form.name.trim()) {
      toast('Please enter your name first', 'error');
      return;
    }

    const hasJobDesc = jobDesc.trim().length > 0;
    const mode = hasJobDesc ? 'ats-job' : 'ats-general';
    setGenMode(mode);
    setLoading(true);

    try {
      const { data } = await aiService.generateResume({
        inputData:      form,
        template,
        title,
        jobDescription: hasJobDesc ? jobDesc : null,
      });

      setGenerated(data.resume.generatedContent);
      setResumeId(data.resume.id);
      setActiveTab('generated');

      if (hasJobDesc) {
        toast('✅ ATS-optimised resume tailored to your job description! 🎯');
      } else {
        toast('✅ ATS-friendly resume generated! ✨');
      }

    } catch (err) {
      toast(err.response?.data?.error || 'Generation failed. Check your API key.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Improve Resume ─────────────────────────────────────────────────────────
  const handleImprove = async () => {
    if (!generated) {
      toast('Generate a resume first', 'error');
      return;
    }

    const hasJobDesc = jobDesc.trim().length > 0;
    setImproving(true);

    try {
      const { data } = await aiService.improveResume({
        resumeContent:  generated,
        resumeId,
        jobDescription: hasJobDesc ? jobDesc : null,
      });

      setGenerated(data.improvedContent);

      if (hasJobDesc) {
        toast('🚀 Resume further optimised for the job description!');
      } else {
        toast('🚀 Resume improved with stronger language & ATS formatting!');
      }

    } catch (err) {
      toast(err.response?.data?.error || 'Improvement failed.', 'error');
    } finally {
      setImproving(false);
    }
  };

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    // Use generatedData when on the generated tab, form data otherwise
    const source = (activeTab === 'generated' && generatedData) ? generatedData : form;
    if (!source || !source.name) { toast('Nothing to export yet', 'error'); return; }

    try {
      const { jsPDF } = require('jspdf');
      // A4 = 210mm × 297mm
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const marginX = 20;          // left/right margin
      const marginY = 20;          // top/bottom margin
      const pw      = 210;         // A4 width
      const ph      = 297;         // A4 height
      const usableW = pw - marginX * 2;   // 170mm text width
      const lineH   = 6;           // body line height
      let y         = marginY;

      const SECTION_COLOR = [99, 102, 241];
      const TEXT_COLOR    = [55, 65, 81];
      const NAME_COLOR    = [20, 20, 20];

      const checkPage = (needed = 10) => {
        if (y + needed > ph - marginY) { pdf.addPage(); y = marginY; }
      };

      const addSectionHeader = (title) => {
        checkPage(14);
        y += 5;
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...SECTION_COLOR);
        pdf.text(title.toUpperCase(), marginX, y);
        pdf.setDrawColor(...SECTION_COLOR);
        pdf.setLineWidth(0.4);
        pdf.line(marginX, y + 1.5, pw - marginX, y + 1.5);
        y += 8;
      };

      const addBodyText = (text) => {
        if (!text) return;
        pdf.setFontSize(10.5); pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...TEXT_COLOR);
        const lines = pdf.splitTextToSize(text.trim(), usableW);
        lines.forEach(line => {
          checkPage(lineH);
          pdf.text(line, marginX, y);
          y += lineH;
        });
        y += 1; // small gap after block
      };

      // Parse skills — handles comma-separated (manual form) AND newline-separated (AI output)
      const parseList = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean);
        const str = val.trim();
        const delimiter = str.includes('\n') ? '\n' : ',';
        return str.split(delimiter).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      };

      // ── Name ──────────────────────────────────────────────────────────────
      pdf.setFontSize(24); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...NAME_COLOR);
      pdf.text((source.name || 'Your Name').toUpperCase(), pw / 2, y, { align: 'center' });
      y += 10;

      // ── Contact ───────────────────────────────────────────────────────────
      const contact = [source.email, source.phone, source.location].filter(Boolean).join('   |   ');
      const links   = [source.linkedin, source.github].filter(Boolean).join('   |   ');
      if (contact) {
        pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...TEXT_COLOR);
        pdf.text(contact, pw / 2, y, { align: 'center' }); y += 6;
      }
      if (links) {
        pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(99, 102, 241);
        pdf.text(links, pw / 2, y, { align: 'center' }); y += 6;
      }
      y += 2;

      // ── Sections ──────────────────────────────────────────────────────────
      if (source.summary) {
        addSectionHeader('Professional Summary');
        addBodyText(source.summary);
      }

      const skillList = parseList(source.skills);
      if (skillList.length) {
        addSectionHeader('Skills');
        addBodyText(skillList.join('   ·   '));
        y += 1;
      }

      if (source.experience)     { addSectionHeader('Experience');     addBodyText(source.experience); }
      if (source.education)      { addSectionHeader('Education');      addBodyText(source.education); }
      if (source.projects)       { addSectionHeader('Projects');       addBodyText(source.projects); }
      if (source.certifications) { addSectionHeader('Certifications'); addBodyText(source.certifications); }
      if (source.publications)   { addSectionHeader('Publications');   addBodyText(source.publications); }

      const langList = parseList(source.languages);
      if (langList.length) {
        addSectionHeader('Languages');
        addBodyText(langList.join('   ·   '));
      }

      pdf.save(`${source.name || 'resume'}.pdf`);
      toast('📄 PDF exported successfully!');
    } catch (err) {
      toast('PDF export failed: ' + err.message, 'error');
    }
  };

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const handleCopy = async () => {
    const text = document.getElementById('resume-preview')?.innerText || '';
    if (!text) { toast('Nothing to copy yet', 'error'); return; }
    try {
      await navigator.clipboard.writeText(text);
      toast('📋 Copied to clipboard!');
    } catch {
      toast('Copy failed', 'error');
    }
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const sec  = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '12px' };
  const stit = { fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' };
  const inp  = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: 'inherit', marginBottom: '10px', display: 'block' };
  const lbl  = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const btnP = (bg = '#6366f1') => ({ padding: '10px 18px', background: bg, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' });
  const btnO = { padding: '9px 14px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' };
  const tabB = (active) => ({ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: active ? 'var(--bg)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text2)', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' });

  const hasJobDesc = jobDesc.trim().length > 0;

  // Parsed structured data from AI-generated text — used to render through SAME styled component
  const generatedData = generated ? parseGeneratedText(generated) : null;

  return (
    <div style={isMobile
      ? { display: 'flex', flexDirection: 'column', gap: '16px' }
      : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: 'calc(100vh - 110px)', overflow: 'hidden' }
    }>

      {/* ══════════ LEFT: FORM ══════════ */}
      <div style={{ overflowY: 'auto', paddingRight: isMobile ? 0 : '4px' }}>

        {/* Import Resume */}
        <div style={sec}>
          <p style={stit}>📤 Import Existing Resume</p>
          <input type="file" ref={fileRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
            style={{ width: '100%', padding: '14px', border: '2px dashed var(--border)', borderRadius: '10px', background: 'var(--bg2)', cursor: parsing ? 'not-allowed' : 'pointer', fontSize: '13px', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: parsing ? 0.7 : 1, transition: 'all 0.2s' }}
          >
            {parsing
              ? <><span className="spinner" /> Parsing your resume...</>
              : <>📁 Click to upload PDF, DOC, DOCX or TXT</>
            }
          </button>
          <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px', textAlign: 'center' }}>
            All fields will be auto-filled from your uploaded resume
          </p>
        </div>

        {/* Job Description */}
        <div style={{ ...sec, border: hasJobDesc ? '1.5px solid #05966940' : '1px solid var(--border)' }}>
          <p style={stit}>
            💼 Job Description
            {hasJobDesc && <span style={{ fontSize: '10px', background: '#05966920', color: '#059669', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>✓ AI will tailor resume to this job</span>}
          </p>
          <textarea
            style={{ ...inp, minHeight: '90px', resize: 'vertical', borderColor: hasJobDesc ? '#05966960' : 'var(--border)' }}
            placeholder="Paste the job description here...&#10;&#10;When provided, AI will:&#10;• Match your resume keywords to the job&#10;• Tailor your experience to the role&#10;• Optimise ATS score for this specific job"
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
          />
          {hasJobDesc && (
            <div style={{ background: '#05966912', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🎯</span>
              <p style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>
                Job description detected — your resume will be ATS-optimised and tailored to this role
              </p>
            </div>
          )}
        </div>

        {/* ATS Score */}
        <ATSScore form={form} jobDesc={jobDesc} />

        {/* Settings */}
        <div style={sec}>
          <p style={stit}>⚙️ Resume Settings</p>
          <label style={lbl}>Resume Title</label>
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Software Engineer Resume" />
          <label style={lbl}>Template</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => setTemplate(t.id)}
                style={{ border: `2px solid ${template === t.id ? t.color : 'var(--border)'}`, borderRadius: '8px', padding: '8px', cursor: 'pointer', textAlign: 'center', background: template === t.id ? `${t.color}12` : 'var(--bg2)', transition: 'all 0.2s' }}>
                <div style={{ height: '26px', background: t.color, borderRadius: '4px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px' }}>{t.icon}</div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: template === t.id ? t.color : 'var(--text2)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div style={sec}>
          <p style={stit}>👤 Personal Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
            <div><label style={lbl}>Full Name *</label><input style={inp} placeholder="Alex Chen" value={form.name} onChange={e => setField('name', e.target.value)} /></div>
            <div><label style={lbl}>Email</label><input style={inp} type="email" placeholder="alex@email.com" value={form.email} onChange={e => setField('email', e.target.value)} /></div>
            <div><label style={lbl}>Phone</label><input style={inp} placeholder="+1 555 000 0000" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
            <div><label style={lbl}>Location</label><input style={inp} placeholder="San Francisco, CA" value={form.location} onChange={e => setField('location', e.target.value)} /></div>
            <div><label style={lbl}>LinkedIn URL</label><input style={inp} placeholder="linkedin.com/in/yourname" value={form.linkedin} onChange={e => setField('linkedin', e.target.value)} /></div>
            <div><label style={lbl}>GitHub URL</label><input style={inp} placeholder="github.com/yourname" value={form.github} onChange={e => setField('github', e.target.value)} /></div>
          </div>
          <label style={lbl}>Professional Summary</label>
          <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} placeholder="Experienced software engineer with 5+ years building scalable web applications..." value={form.summary} onChange={e => setField('summary', e.target.value)} />
        </div>

        {/* Skills */}
        <div style={sec}>
          <p style={stit}>💡 Skills</p>
          <label style={lbl}>Skills (comma-separated)</label>
          <input style={inp} placeholder="React, Node.js, Python, MongoDB, TypeScript, AWS, Docker, Git..." value={form.skills} onChange={e => setField('skills', e.target.value)} />
          <p style={{ fontSize: '10px', color: 'var(--text3)' }}>💡 Add 8+ skills for best ATS score. Include both technical and soft skills.</p>
        </div>

        {/* Education */}
        <div style={sec}>
          <p style={stit}>🎓 Education</p>
          <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
            placeholder={'University Name | BSc Computer Science | 2020\nGPA: 3.8/4.0'}
            value={form.education} onChange={e => setField('education', e.target.value)} />
        </div>

        {/* Experience */}
        <div style={sec}>
          <p style={stit}>💼 Work Experience</p>
          <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical' }}
            placeholder={'Company Name | Job Title | Jan 2022 – Present\n• Led development of microservices serving 1M+ users\n• Increased performance by 40%\n\nPrevious Co | Junior Developer | 2020 – 2022\n• Built REST APIs and React dashboards'}
            value={form.experience} onChange={e => setField('experience', e.target.value)} />
        </div>

        {/* Projects */}
        <div style={sec}>
          <p style={stit}>🚀 Projects</p>
          <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }}
            placeholder={'Project Name | React, Node.js | github.com/user/repo\nDescription of what you built and its impact'}
            value={form.projects} onChange={e => setField('projects', e.target.value)} />
        </div>

        {/* Certifications */}
        <div style={sec}>
          <p style={stit}>🏆 Certifications</p>
          <textarea style={{ ...inp, minHeight: '55px', resize: 'vertical' }}
            placeholder={'AWS Certified Solutions Architect | Amazon | 2024\nGoogle Cloud Professional | Google | 2023'}
            value={form.certifications} onChange={e => setField('certifications', e.target.value)} />
        </div>

        {/* Publications */}
        <div style={sec}>
          <p style={stit}>📚 Publications</p>
          <textarea style={{ ...inp, minHeight: '55px', resize: 'vertical' }}
            placeholder={'Paper Title | Journal Name | 2024\nAuthor, A. (2024). Title. Journal, Vol(Issue).'}
            value={form.publications} onChange={e => setField('publications', e.target.value)} />
        </div>

        {/* Languages */}
        <div style={sec}>
          <p style={stit}>🌍 Languages</p>
          <input style={inp}
            placeholder="English (Native), Tamil (Fluent), Hindi (Intermediate)"
            value={form.languages} onChange={e => setField('languages', e.target.value)} />
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ marginBottom: '20px' }}>
          <button
            style={{ ...btnP(hasJobDesc ? '#059669' : '#6366f1'), width: '100%', justifyContent: 'center', marginBottom: '8px', padding: '13px' }}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" /> {hasJobDesc ? 'Tailoring to job description...' : 'Generating ATS resume...'}</>
            ) : hasJobDesc ? (
              <>🎯 Generate ATS Resume — Tailored to Job</>
            ) : (
              <>✦ Generate ATS-Friendly Resume</>
            )}
          </button>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {generated && (
              <button style={btnP(hasJobDesc ? '#059669' : '#7c3aed')} onClick={handleImprove} disabled={improving}>
                {improving
                  ? <><span className="spinner" /> Improving...</>
                  : hasJobDesc ? '🎯 Re-optimise for Job' : '🪄 Improve Resume'
                }
              </button>
            )}
            <button style={btnO} onClick={handleExportPDF}>📄 Export PDF</button>
            <button style={btnO} onClick={handleCopy}>📋 Copy Text</button>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT: PREVIEW ══════════ */}
      <div style={{ overflowY: 'auto', paddingLeft: isMobile ? 0 : '4px' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg2)', borderRadius: '10px', padding: '4px', marginBottom: '12px' }}>
          <button style={tabB(activeTab === 'preview')}   onClick={() => setActiveTab('preview')}>👁 Live Preview</button>
          <button style={tabB(activeTab === 'generated')} onClick={() => setActiveTab('generated')} disabled={!generated}>
            {genMode === 'ats-job' ? '🎯 Job-Tailored ATS' : genMode === 'ats-general' ? '✦ ATS Resume' : '✦ AI Generated'}
          </button>
        </div>

        {/* Mode badge */}
        {generated && genMode && (
          <div style={{ marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', background: genMode === 'ats-job' ? '#05966915' : '#6366f115', border: `1px solid ${genMode === 'ats-job' ? '#05966940' : '#6366f140'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{genMode === 'ats-job' ? '🎯' : '✦'}</span>
            <p style={{ fontSize: '11px', color: genMode === 'ats-job' ? '#059669' : '#6366f1', fontWeight: 500 }}>
              {genMode === 'ats-job'
                ? 'This resume is ATS-optimised and tailored to your job description'
                : 'This resume is ATS-friendly and professionally formatted'
              }
            </p>
          </div>
        )}

        {/* Live Preview tab — uses form data */}
        {activeTab === 'preview' && (
          <div className="card">
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              👁 Live Preview — {TEMPLATES.find(t => t.id === template)?.label}
            </p>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', minHeight: '300px' }}>
              <ResumePreview formData={form} template={template} />
            </div>
          </div>
        )}

        {/* Generated resume tab — SAME ResumePreview component, only data source changes */}
        {activeTab === 'generated' && generated && generatedData && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                {genMode === 'ats-job' ? '🎯 ATS Resume — Job Tailored' : '✦ ATS-Friendly Resume'}
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button style={btnO} onClick={handleCopy}>📋 Copy</button>
                <button style={btnO} onClick={handleExportPDF}>📄 PDF</button>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', minHeight: '300px' }}>
              <ResumePreview formData={generatedData} template={template} />
            </div>
          </div>
        )}

        {/* Empty state tips */}
        {!generated && (
          <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', marginBottom: '10px' }}>💡 How it works</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: '📁', text: 'Import your existing resume OR fill in the form manually' },
                { icon: '💼', text: 'Paste a job description to get a tailored ATS resume for that role' },
                { icon: '🎯', text: 'Without job description — generates a general ATS-friendly resume' },
                { icon: '✦',  text: 'Click Generate — AI writes a professional resume instantly' },
                { icon: '🪄', text: 'Use Improve to further enhance with stronger language' },
                { icon: '📄', text: 'Export to PDF when ready' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}