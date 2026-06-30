// utils/multer.js
// ─────────────────────────────────────────────────────────────────
// Vercel serverless functions have NO writable filesystem.
// diskStorage (the multer default) tries to save files to disk → crash.
// Solution: memoryStorage keeps the file in RAM as req.file.buffer,
// then we stream it straight to Cloudinary — no disk needed.
// ─────────────────────────────────────────────────────────────────
const multer = require("multer");

const storage = multer.memoryStorage();   // file lives in req.file.buffer

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

module.exports = upload;
