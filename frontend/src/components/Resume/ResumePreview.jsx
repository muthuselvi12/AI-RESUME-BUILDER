/**
 * components/Resume/ResumePreview.js
 * Live preview of the resume. Supports modern, classic, minimal, ats-optimal, technical, executive templates.
 */

import React from 'react';
import styles from './ResumePreview.module.css';

// Convert 'ats-optimal' → 'atsOptimal' to match CSS module class names
const toCamelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

export default function ResumePreview({ formData, template, generatedContent }) {
  const {
    name, email, phone, location,
    linkedin, github,
    summary, skills,
    experience, education, projects,
    certifications, publications, languages,
  } = formData || {};

  const templateClass = styles[toCamelCase(template)] || styles.modern;

  const skillList = typeof skills === 'string'
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : skills || [];

  const langList = typeof languages === 'string'
    ? languages.split(',').map((s) => s.trim()).filter(Boolean)
    : languages || [];

  const hasData = name || skillList.length || experience;

  if (!hasData && !generatedContent) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📄</div>
        <p>Fill in your details on the left to see the live preview.</p>
      </div>
    );
  }

  if (generatedContent) {
    return (
      <div id="resume-preview-content" className={`${styles.preview} ${templateClass}`}>
        <div
          className={styles.generatedContent}
          dangerouslySetInnerHTML={{ __html: generatedContent }}
        />
      </div>
    );
  }

  const contact = [email, phone, location].filter(Boolean).join(' · ');
  const links = [linkedin, github].filter(Boolean).join(' · ');

  return (
    <div id="resume-preview-content" className={`${styles.preview} ${templateClass}`}>

      <div className={styles.header}>
        <h1 className={styles.name}>{name || 'Your Name'}</h1>
        {contact && <p className={styles.contact}>{contact}</p>}
        {links && <p className={styles.links}>{links}</p>}
      </div>

      {summary && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Professional Summary</h2>
          <p className={styles.bodyText}>{summary}</p>
        </div>
      )}

      {skillList.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          <div className={styles.skills}>
            {skillList.map((s) => (
              <span key={s} className={styles.skillChip}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {education && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>
          <pre className={styles.preText}>{education}</pre>
        </div>
      )}

      {experience && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Experience</h2>
          <pre className={styles.preText}>{experience}</pre>
        </div>
      )}

      {projects && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Projects</h2>
          <pre className={styles.preText}>{projects}</pre>
        </div>
      )}

      {certifications && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Certifications</h2>
          <pre className={styles.preText}>{certifications}</pre>
        </div>
      )}

      {publications && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Publications</h2>
          <pre className={styles.preText}>{publications}</pre>
        </div>
      )}

      {langList.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Languages</h2>
          <div className={styles.skills}>
            {langList.map((l) => (
              <span key={l} className={styles.skillChip}>{l}</span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}