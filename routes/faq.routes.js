// faq.router.js
import express from "express";
import { 
  createFaq, 
  getAllFaqs, 
  getPublicFaqs, 
  getFaqById, 
  updateFaq, 
  deleteFaq 
} from "../controllers/faq.controller.js";

const router = express.Router();

// Public route (Specific path must come before generic :id param)
router.get("/public", getPublicFaqs);

// Admin routes
router.post("/", createFaq);
router.get("/", getAllFaqs);
router.get("/:id", getFaqById);
router.put("/:id", updateFaq);
router.delete("/:id", deleteFaq);

export default router;