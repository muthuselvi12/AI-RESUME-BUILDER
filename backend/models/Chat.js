/**
 * models/Chat.js — Chat history schema for the AI assistant
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Session title (auto-generated from first message)
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
    },
    // Array of message turns in this conversation
    messages: [messageSchema],
    // Link to a resume if this chat is about one
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for full-text search on chat content
chatSchema.index({ title: 'text' });

module.exports = mongoose.model('Chat', chatSchema);
