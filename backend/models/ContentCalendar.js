const mongoose = require("mongoose");

const dayContentSchema = new mongoose.Schema(
  {
    dayIndex: { type: Number, required: true },
    dayName: { type: String, required: true },
    date: { type: Date, required: true },

    blog: {
      title: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      content: { type: String, default: "" },
      summary: { type: String, default: "" },
      tags: { type: [String], default: [] },
      cta: { type: String, default: "" },
    },

    whatsapp: {
      headline: { type: String, default: "" },
      message: { type: String, default: "" },
      cta: { type: String, default: "" },
    },

    email: {
      subject: { type: String, default: "" },
      preheader: { type: String, default: "" },
      body: { type: String, default: "" },
      cta: { type: String, default: "" },
    },

    deliveryStatus: {
      blog: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
      whatsapp: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
      email: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    },

    deliveredAt: {
      blog: { type: Date, default: null },
      whatsapp: { type: Date, default: null },
      email: { type: Date, default: null },
    },
  },
  { _id: false }
);

const contentCalendarSchema = new mongoose.Schema({
  runId: { type: String, required: true, index: true },
  domain: { type: String, required: true },
  companyName: { type: String, default: "" },
  targetLocation: { type: String, default: "" },
  audienceCategory: { type: String, default: "" },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  sourceBlogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", default: null },
  sourceCorpusId: { type: mongoose.Schema.Types.ObjectId, default: null },
  blueprint: { type: mongoose.Schema.Types.Mixed, default: {} },
  personaSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  researchSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  competitorSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  weekPlan: { type: [dayContentSchema], default: [] },
  generatedByModel: {
    blog: { type: String, default: "" },
    calendar: { type: String, default: "" },
  },
  status: { type: String, enum: ["draft", "active", "completed", "archived"], default: "draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastSentAt: { type: Date, default: null },
});

contentCalendarSchema.pre("save", function saveHook(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("ContentCalendar", contentCalendarSchema);
