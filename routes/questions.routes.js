// backend/routes/questions.routes.js

import express from "express";
import multer from "multer";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  importQuestionsCSV
} from "../controllers/questions.controller.js";

import { verifyToken, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// --------------------------------------------------
// PUBLIC / STUDENT ROUTES
// --------------------------------------------------

// Get all questions (optionally filter by quizId via query: ?quizId=...)
router.get("/", async (req, res) => {
  console.log("[questions.routes] GET / - Fetch all questions");
  await getAllQuestions(req, res);
});

// Get single question by ID
router.get("/:id", async (req, res) => {
  console.log(
    "[questions.routes] GET /:id - Fetch question:",
    req.params.id
  );
  await getQuestionById(req, res);
});

// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

// Create question
router.post("/create", verifyToken, adminOnly, async (req, res) => {
  console.log("[questions.routes] POST /create - Create new question");
  await createQuestion(req, res);
});

// Update question
router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log(
    "[questions.routes] PUT /:id - Update question:",
    req.params.id
  );
  await updateQuestion(req, res);
});

// Delete question
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log(
    "[questions.routes] DELETE /:id - Delete question:",
    req.params.id
  );
  await deleteQuestion(req, res);
});

router.post(
  "/quizzes/:quizId/questions/import", // URL matches your frontend
  verifyToken,
  adminOnly,
  upload.single("file"),
  importQuestionsCSV
);


export default router;
