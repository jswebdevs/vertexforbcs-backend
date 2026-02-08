import express from "express";
import { 
  createSlider, 
  getAllSliders, 
  getPublicSliders, 
  getSliderById, 
  updateSlider, 
  deleteSlider 
} from "../controllers/sliders.controller.js";

const router = express.Router();

// Public route (Specific path must come before generic :id param)
router.get("/public", getPublicSliders);

// Admin routes
router.post("/", createSlider);
router.get("/", getAllSliders);
router.get("/:id", getSliderById);
router.put("/:id", updateSlider);
router.delete("/:id", deleteSlider);

export default router;