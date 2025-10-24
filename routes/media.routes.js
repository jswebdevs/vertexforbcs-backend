const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  addMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
} = require("../controllers/media.controller");

// === Ensure upload folders exist ===
const folders = ["uploads/img", "uploads/vid", "uploads/docs"];
folders.forEach((folder) => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
});

// === Multer storage configuration ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/docs";
    if (file.mimetype.startsWith("image/")) folder = "uploads/img";
    else if (file.mimetype.startsWith("video/")) folder = "uploads/vid";
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

// === Multer middleware ===
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
});

// === ROUTES ===

// ✅ Main upload endpoint (match frontend)
// You can upload files with field name "files"
router.post("/", upload.array("files", 20), addMedia);

// Optional alternate route (if you want to keep /upload)
router.post("/upload", upload.array("files", 20), addMedia);

// Media management routes
router.get("/", getAllMedia);
router.get("/:id", getMediaById);
router.put("/:id", updateMedia);
router.delete("/:id", deleteMedia);

module.exports = router;
