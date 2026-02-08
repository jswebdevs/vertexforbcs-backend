import express from "express";
import {
  createGallery,
  getAllGallery,
  getPublicGallery,
  getGalleryById,
  updateGallery,
  deleteGallery,
} from "../controllers/gallery.controller.js";

const router = express.Router();

// Public route (specific path must come before :id parameter)
router.get("/public", getPublicGallery);

// General CRUD routes
router.post("/", createGallery);
router.get("/", getAllGallery);
router.get("/:id", getGalleryById);
router.put("/:id", updateGallery);
router.delete("/:id", deleteGallery);

export default router;