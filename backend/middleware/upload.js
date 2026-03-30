// backend/middleware/upload.js
// Multer configuration for in-memory image uploads

const multer = require("multer");

// Store file in memory — buffer is passed directly to Claude Vision
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed (JPEG, PNG, WebP, GIF)."),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum
});

module.exports = upload;
