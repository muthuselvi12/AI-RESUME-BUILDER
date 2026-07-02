/**
 * utils/pdfExport.js — Export resume to PDF using jsPDF from structured form data.
 * A4 (210mm × 297mm) with proper margins, font sizes and spacing.
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportResumeToPDF = (formData, fileName = 'resume.pdf') => {
  const form    = formData || {};
  const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = 20;
  const marginY = 20;
  const pw      = 210;   // A4 width mm
  const ph      = 297;   // A4 height mm
  const usableW = pw - marginX * 2;
  const lineH   = 6;
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
    pdf.splitTextToSize(text.trim(), usableW).forEach(line => {
      checkPage(lineH); pdf.text(line, marginX, y); y += lineH;
    });
    y += 1;
  };

  const parseList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    const str = val.trim();
    const delimiter = str.includes('\n') ? '\n' : ',';
    return str.split(delimiter).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  };

  // Name
  pdf.setFontSize(24); pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...NAME_COLOR);
  pdf.text((form.name || 'Your Name').toUpperCase(), pw / 2, y, { align: 'center' });
  y += 10;

  // Contact
  const contact = [form.email, form.phone, form.location].filter(Boolean).join('   |   ');
  const links   = [form.linkedin, form.github].filter(Boolean).join('   |   ');
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

  if (form.summary) { addSectionHeader('Professional Summary'); addBodyText(form.summary); }

  const skillList = parseList(form.skills);
  if (skillList.length) {
    addSectionHeader('Skills');
    addBodyText(skillList.join('   ·   '));
    y += 1;
  }

  if (form.experience)    { addSectionHeader('Experience');    addBodyText(form.experience); }
  if (form.education)     { addSectionHeader('Education');     addBodyText(form.education); }
  if (form.projects)      { addSectionHeader('Projects');      addBodyText(form.projects); }
  if (form.certifications){ addSectionHeader('Certifications');addBodyText(form.certifications); }
  if (form.publications)  { addSectionHeader('Publications');  addBodyText(form.publications); }

  const langList = parseList(form.languages);
  if (langList.length) {
    addSectionHeader('Languages');
    addBodyText(langList.join('   ·   '));
  }

  pdf.save(fileName);
};

// Export as text file (for ATS systems)
export const exportAsText = (content, fileName = 'resume.txt') => {
  const element = document.getElementById('resume-preview');
  const text = content || element?.innerText || '';
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyPlainText = async (elementId) => {
  const element = document.getElementById(elementId);
  const text = element?.innerText || '';
  await copyToClipboard(text);
  return text;
};

export const copyToClipboard = async (text) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement('textarea');
    el.value = text; document.body.appendChild(el); el.select();
    document.execCommand('copy'); document.body.removeChild(el);
  }
};
