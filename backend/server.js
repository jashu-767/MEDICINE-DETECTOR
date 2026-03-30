// backend/server.js
// Express app entry point

require("dotenv").config();

const express        = require("express");
const cors           = require("cors");
const morgan         = require("morgan");
const connectDB      = require("./config/db");
const medicineRoutes = require("./routes/medicineRoutes");
const errorHandler   = require("./middleware/errorHandler");

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Create Express app ────────────────────────────────────────────────────────
const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(morgan("dev"));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", medicineRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` })
);

// ── Central error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Medicine Detection API → http://localhost:${PORT}`);
  console.log(`📋  Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`\n    Endpoints:`);
  console.log(`      GET  /api/health`);
  console.log(`      POST /api/search         { name: "aspirin" }`);
  console.log(`      POST /api/search/image   multipart image upload`);
  console.log(`      GET  /api/history`);
  console.log(`      GET  /api/medicines\n`);
});

module.exports = app;
