// backend/models/SearchHistory.js
// Logs every search for analytics and the recent-history sidebar

const mongoose = require("mongoose");

const SearchHistorySchema = new mongoose.Schema(
  {
    query:         { type: String, trim: true },      // what the user typed
    imageSearch:   { type: Boolean, default: false }, // was this an image search?
    medicineName:  { type: String, trim: true },      // resolved medicine name
    medicineId:    { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    success:       { type: Boolean, default: true },
    errorMessage:  String,
    responseTimeMs:Number,
    ipAddress:     String,
  },
  { timestamps: true }
);

SearchHistorySchema.index({ createdAt: -1 });
SearchHistorySchema.index({ medicineName: 1 });

module.exports = mongoose.model("SearchHistory", SearchHistorySchema);
