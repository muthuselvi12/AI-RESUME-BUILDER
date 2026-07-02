/**
 * models/Resume.js — Resume schema storing user input + AI-generated content
 */

const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Raw user-provided data — all fields as simple strings
    inputData: {
      name:           { type: String, default: '' },
      email:          { type: String, default: '' },
      phone:          { type: String, default: '' },
      location:       { type: String, default: '' },
      linkedin:       { type: String, default: '' },
      github:         { type: String, default: '' },
      summary:        { type: String, default: '' },
      skills:         { type: String, default: '' },
      education:      { type: String, default: '' },
      experience:     { type: String, default: '' },
      projects:       { type: String, default: '' },
      certifications: { type: String, default: '' },
      publications:   { type: String, default: '' },
      languages:      { type: String, default: '' },
    },
    // AI-generated formatted resume text
    generatedContent: {
      type: String,
      default: '',
    },
    // Which visual template is applied
    template: {
      type: String,
      enum: ['modern', 'classic', 'minimal', 'ats-optimal', 'technical', 'executive'],
      default: 'modern',
    },
    // Optional title user gives this resume
    title: {
      type: String,
      default: 'My Resume',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
resumeSchema.index({ title: 'text', 'inputData.name': 'text' });

module.exports = mongoose.model('Resume', resumeSchema);