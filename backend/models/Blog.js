const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: String,
  category: { type: String, default: "ACCOUNTING" },
  targetKeywords: [String],
  wordCount: Number,
  metaDescription: String,
  socialHooks: [String],
  
  // New Additions: Multi-channel 1-Week Content Calendar Arrays
  // Note: Multi-channel content (WhatsApp/email week plans) are stored in a separate
  // ContentCalendar collection and are intentionally NOT embedded in the Blog model
  // to prevent accidental exposure via public blog APIs.
  
  faq: [
    {
      question: String,
      answer: String
    }
  ],
  readingTime: Number,
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  opportunityScore: Number,
  durationMs: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Blog", blogSchema);