const { getDB } = require("../config/db");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const { ObjectId } = require("mongodb");

// --- Set ffmpeg binary paths (adjust for Linux or Windows) ---
ffmpeg.setFfmpegPath("C:\\ffm\\bin\\ffmpeg.exe");
ffmpeg.setFfprobePath("C:\\ffm\\bin\\ffprobe.exe");

// --- Determine folder type by MIME ---
function getFolderByMime(mime) {
  if (mime.startsWith("image/")) return "img";
  if (mime.startsWith("video/")) return "vid";
  return "docs";
}

// --- Generate thumbnail for images ---
async function generateImageThumb(filePath, thumbPath) {
  try {
    await sharp(filePath).resize(200, 200, { fit: "inside" }).toFile(thumbPath);
  } catch (err) {
    console.warn(`⚠️ Failed to generate image thumbnail for ${filePath}: ${err.message}`);
  }
}

// --- Generate thumbnail for videos ---
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
        size: "160x?",
      });
  });
}

// === ADD MEDIA ===
async function addMedia(req, res) {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const db = getDB();
    const mediaCollection = db.collection("media");
    const mediaDocs = [];

    // ✅ Use your production domain always
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://backend.rajproperty.site"
        : `${req.protocol}://${req.get("host")}`;

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

        mediaDocs.push({
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
        });
      })
    );

    await mediaCollection.insertMany(mediaDocs);
    res.status(201).json(mediaDocs);
  } catch (err) {
    console.error("❌ Add media error:", err);
    res.status(500).json({ error: err.message });
  }
}

// === GET ALL MEDIA ===
async function getAllMedia(req, res) {
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

    const db = getDB();
    const mediaCollection = db.collection("media");

    const media = await mediaCollection
      .find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    const total = await mediaCollection.countDocuments(query);
    res.json({ media, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("❌ Get all media error:", err);
    res.status(500).json({ error: err.message });
  }
}

// === GET MEDIA BY ID ===
async function getMediaById(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    const media = await db.collection("media").findOne({ _id: new ObjectId(id) });

    if (!media) return res.status(404).json({ error: "Media not found" });
    res.json(media);
  } catch (err) {
    console.error("❌ Get media by ID error:", err);
    res.status(500).json({ error: err.message });
  }
}

// === UPDATE MEDIA ===
async function updateMedia(req, res) {
  try {
    const { id } = req.params;
    const { title, description, altText, tags } = req.body;

    const db = getDB();
    const result = await db.collection("media").updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, description, altText, tags: tags ? tags.split(",") : [] } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Media not found" });
    res.json({ message: "✅ Media updated successfully" });
  } catch (err) {
    console.error("❌ Update media error:", err);
    res.status(500).json({ error: err.message });
  }
}

// === DELETE MEDIA ===
async function deleteMedia(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    const media = await db.collection("media").findOne({ _id: new ObjectId(id) });

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

    await db.collection("media").deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "✅ Media deleted successfully" });
  } catch (err) {
    console.error("❌ Delete media error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addMedia, getAllMedia, getMediaById, updateMedia, deleteMedia };
