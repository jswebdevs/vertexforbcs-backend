import express from "express";
import { getHotCourses } from "../controllers/hotCourses.controller.js"; 
const router = express.Router();

router.get("/", getHotCourses);

// ADD THIS AT THE BOTTOM
export default router;