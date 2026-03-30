// backend/models/Medicine.js
// Mongoose schema for cached medicine data

const mongoose = require("mongoose");

const AlternativeSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    genericName:  String,
    manufacturer: String,
    reason:       String,
  },
  { _id: false }
);

const SideEffectSchema = new mongoose.Schema(
  {
    severity:  { type: String, enum: ["mild", "moderate", "severe"], default: "mild" },
    effect:    { type: String, required: true },
    frequency: String,
  },
  { _id: false }
);

const MedicineSchema = new mongoose.Schema(
  {
    // Identity
    name:         { type: String, required: true, trim: true, index: true },
    genericName:  { type: String, trim: true },
    brandNames:   [String],
    manufacturer: String,
    drugClass:    String,

    // Usage
    usages:           { type: [String], default: [] },
    usageDescription: String,

    // Side effects
    sideEffects:            [SideEffectSchema],
    sideEffectsDescription: String,

    // Alternatives (only Claude provides these)
    alternatives:            [AlternativeSchema],
    alternativesDescription: String,

    // Safety
    dosageInfo:       String,
    warnings:         [String],
    contraindications:[String],
    interactions:     [String],

    // Source tracking
    sources: {
      fda:    { type: Boolean, default: false },
      claude: { type: Boolean, default: false },
    },

    // Cache control — data older than 7 days is re-fetched
    lastFetched: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// Full-text search index
MedicineSchema.index({ name: "text", genericName: "text" });

// Virtual: is the cached data stale (>7 days old)?
MedicineSchema.virtual("isStale").get(function () {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(this.lastFetched).getTime() > SEVEN_DAYS;
});

module.exports = mongoose.model("Medicine", MedicineSchema);
