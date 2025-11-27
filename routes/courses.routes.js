// backend/routes/courses.routes.js

import express from "express";
import multer from "multer";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollStudent,
  getEnrolledStudents,
} from "../controllers/courses.controller.js";

import { verifyToken, adminOnly, studentOnly } from "../middlewares/auth.middleware.js";

// ------- Multer Middleware Setup --------

// Setup Multer storage config (stores in /uploads/, you can customize)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// Create upload handler
const upload = multer({ storage });

// For admin course creation and update: handle both single and multiple image fields
const cpUpload = upload.fields([
  { name: 'courseImage', maxCount: 1 },
  { name: 'imageGallery', maxCount: 10 }
]);

const router = express.Router();

// --------------------------------------------------
// PUBLIC / STUDENT ROUTES
// --------------------------------------------------

// Get all published courses
router.get("/", async (req, res) => {
  console.log("[courses.routes] GET / - Fetch all published courses");
  await getAllCourses(req, res);
});

// Get a single course by ID (public)
router.get("/:id", async (req, res) => {
  console.log("[courses.routes] GET /:id - Fetch course details:", req.params.id);
  await getCourseById(req, res);
});

// Enroll in a course (student only)
router.post("/:courseId/enroll", verifyToken, studentOnly, async (req, res) => {
  console.log("[courses.routes] POST /:courseId/enroll - Enrolling student:", req.user?._id);
  await enrollStudent(req, res);
});

// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

// Create new course - Multer middleware enables file uploads and FormData!
router.post("/", verifyToken, adminOnly, cpUpload, async (req, res) => {
  console.log("[courses.routes] POST / - Create new course");
  await createCourse(req, res);
});

// Update existing course (also supports file upload as needed)
router.put("/:id", verifyToken, adminOnly, cpUpload, async (req, res) => {
  console.log("[courses.routes] PUT /:id - Update course:", req.params.id);
  await updateCourse(req, res);
});

// Delete course
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[courses.routes] DELETE /:id - Delete course:", req.params.id);
  await deleteCourse(req, res);
});

// Get all enrolled students for a specific course
router.get("/:id/enrolled", verifyToken, adminOnly, async (req, res) => {
  console.log("[courses.routes] GET /:id/enrolled - Fetch enrolled students");
  await getEnrolledStudents(req, res);
});

export default router;
