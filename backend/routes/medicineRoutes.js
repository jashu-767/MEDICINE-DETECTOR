// backend/routes/medicineRoutes.js
// All API route definitions

const express    = require("express");
const router     = express.Router();
const rateLimit  = require("express-rate-limit");

const medicineController = require("../controllers/medicineController");
const upload             = require("../middleware/upload");

// ── Rate limiting: 10 requests per minute per IP ──────────────────────────────
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many requests. Please wait a moment and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
router.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Search by medicine name
// Body: { "name": "aspirin" }
router.post("/search", searchLimiter, medicineController.searchByName);

// Search by image
// Form field: "image" (JPEG / PNG / WebP / GIF, max 5 MB)
router.post(
  "/search/image",
  searchLimiter,
  upload.single("image"),
  medicineController.searchByImage
);

// Recent search history (last 20 successful searches)
router.get("/history", medicineController.getHistory);

// All cached medicines (used for autocomplete suggestions)
router.get("/medicines", medicineController.getMedicineList);

module.exports = router;
