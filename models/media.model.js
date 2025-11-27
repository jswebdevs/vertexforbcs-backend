//backend/models/media.model.js
import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  folder: { type: String, required: true, enum: ["img", "vid", "docs"] },
  uploadDate: { type: Date, default: Date.now },
  url: { type: String, required: true },
  thumbUrl: { type: String, default: null },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  altText: { type: String, default: "" },
  tags: { type: [String], default: [] },
});

const Media = mongoose.model("Media", mediaSchema);

export default Media;

