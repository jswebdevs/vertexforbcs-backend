import path from "path";
import fs from "fs";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Media from "../models/media.model.js";

// ESM __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ffmpeg binary setup
ffmpeg.setFfmpegPath("C:\\ffm\\bin\\ffmpeg.exe");
ffmpeg.setFfprobePath("C:\\ffm\\bin\\ffprobe.exe");

function getFolderByMime(mime) {
  if (mime.startsWith("image/")) return "img";
  if (mime.startsWith("video/")) return "vid";
  return "docs";
}

async function generateImageThumb(filePath, thumbPath) {
  try {
    await sharp(filePath).resize(200, 200, { fit: "inside" }).toFile(thumbPath);
  } catch (err) {
    console.warn(`⚠️ Failed to generate image thumbnail for ${filePath}: ${err.message}`);
  }
}

async function generateVideoThumb(filePath, thumbPath) {
  return new Promise((resolve) => {
    ffmpeg(filePath)
      .on("end", () => resolve())
      .on("error", (err) => {
        console.warn(`⚠️ Failed to generate video thumbnail for ${filePath}: ${err.message}`);
        resolve();
      })
      .screenshots({
        count: 1,
        folder: path.dirname(thumbPath),
        filename: path.basename(thumbPath),
        size: "160x?"
      });
  });
}

export async function addMedia(req, res) {
  try {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const baseUrl = "http://localhost:5000"; // adjust as needed
    const mediaDocs = [];

    await Promise.all(
      files.map(async (file) => {
        const folder = getFolderByMime(file.mimetype);
        const filePath = file.path;
        let thumbUrl = null;

        // Ensure subfolder exists
        const uploadDir = path.join(__dirname, `../uploads/${folder}`);
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        try {
          if (folder === "img") {
            const thumbPath = path.join(uploadDir, "thumb-" + file.filename);
            await generateImageThumb(filePath, thumbPath);
            if (fs.existsSync(thumbPath)) {
              thumbUrl = `${baseUrl}/uploads/${folder}/thumb-${file.filename}`;
            }
          } else if (folder === "vid") {
            const thumbFilename = "thumb-" + file.filename + ".png";
            const thumbPath = path.join(uploadDir, thumbFilename);
            await generateVideoThumb(filePath, thumbPath);
            if (fs.existsSync(thumbPath)) {
              thumbUrl = `${baseUrl}/uploads/${folder}/${thumbFilename}`;
            }
          }
        } catch (err) {
          console.warn(`⚠️ Thumbnail generation failed for ${file.filename}:`, err.message);
        }

        const doc = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          folder,
          uploadDate: new Date(),
          url: `${baseUrl}/uploads/${folder}/${file.filename}`,
          thumbUrl,
          title: req.body.title || file.originalname,
          description: req.body.description || "",
          altText: req.body.altText || "",
          tags: req.body.tags ? req.body.tags.split(",") : [],
        };
        mediaDocs.push(doc);
      })
    );

    const created = await Media.insertMany(mediaDocs);
    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Add media error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getAllMedia(req, res) {
  try {
    const { search, type, fromDate, toDate, limit = 20, page = 1 } = req.query;
    const query = {};
    if (search)
      query.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    if (type) query.mimeType = { $regex: type, $options: "i" };
    if (fromDate) query.uploadDate = { ...query.uploadDate, $gte: new Date(fromDate) };
    if (toDate) query.uploadDate = { ...query.uploadDate, $lte: new Date(toDate) };

    const media = await Media.find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const total = await Media.countDocuments(query);
    res.json({ media, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("❌ Get all media error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getMediaById(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ error: "Media not found" });
    res.json(media);
  } catch (err) {
    console.error("❌ Get media by ID error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateMedia(req, res) {
  try {
    const { id } = req.params;
    const { title, description, altText, tags } = req.body;
    const updated = await Media.findByIdAndUpdate(
      id,
      {
        title,
        description,
        altText,
        tags: tags ? tags.split(",") : [],
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Media not found" });
    res.json({ message: "✅ Media updated successfully", media: updated });
  } catch (err) {
    console.error("❌ Update media error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteMedia(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ error: "Media not found" });

    try {
      const filePath = path.join(__dirname, "../uploads", media.folder, media.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.warn("⚠️ File delete failed:", err.message);
    }

    try {
      if (media.thumbUrl) {
        const thumbPath = path.join(
          __dirname,
          "../uploads",
          media.folder,
          path.basename(media.thumbUrl)
        );
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
    } catch (err) {
      console.warn("⚠️ Thumbnail delete failed:", err.message);
    }

    await Media.findByIdAndDelete(id);
    res.json({ message: "✅ Media deleted successfully" });
  } catch (err) {
    console.error("❌ Delete media error:", err);
    res.status(500).json({ error: err.message });
  }
}
