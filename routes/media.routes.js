import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// For ESM compatibility with __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  addMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia
} from "../controllers/media.controller.js";

const router = express.Router();

// Ensure upload folders exist (absolute paths)
const folders = ["uploads/img", "uploads/vid", "uploads/docs"];
folders.forEach((folder) => {
  const absFolder = path.join(__dirname, "..", folder);
  if (!fs.existsSync(absFolder)) fs.mkdirSync(absFolder, { recursive: true });
});

// Multer storage configuration (absolute path)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/docs";
    if (file.mimetype.startsWith("image/")) folder = "uploads/img";
    else if (file.mimetype.startsWith("video/")) folder = "uploads/vid";
    const absFolder = path.join(__dirname, "..", folder);
    cb(null, absFolder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

// Multer instance (limit: 1GB per file)
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }
});

// RESTful routes
router.post("/", upload.array("files", 20), addMedia);
router.post("/upload", upload.array("files", 20), addMedia);
router.get("/", getAllMedia);
router.get("/:id", getMediaById);
router.put("/:id", updateMedia);
router.delete("/:id", deleteMedia);

export default router;
