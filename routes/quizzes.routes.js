// backend/routes/quiz.routes.js

import express from "express";
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getQuizLeaderboard
} from "../controllers/quizzes.controller.js";

import { verifyToken, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --------------------------------------------------
// PUBLIC / STUDENT ROUTES
// --------------------------------------------------

// Get all quizzes (optionally filter by courseID via query: ?courseID=...)
router.get("/", async (req, res) => {
  console.log("[quiz.routes] GET / - Fetch all quizzes");
  await getAllQuizzes(req, res);
});

// Get single quiz by ID
router.get("/:id", async (req, res) => {
  console.log("[quiz.routes] GET /:id - Fetch quiz:", req.params.id);
  await getQuizById(req, res);
});

// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

// Create quiz
// This matches your frontend POST: "https://vertexforbcs.com/vartexforbcs/web/quiz/create"
router.post("/", verifyToken, adminOnly, async (req, res) => {
  console.log("[quiz.routes] POST /create - Create new quiz");
  await createQuiz(req, res);
});

// Update quiz
router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[quiz.routes] PUT /:id - Update quiz:", req.params.id);
  await updateQuiz(req, res);
});

// Delete quiz
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[quiz.routes] DELETE /:id - Delete quiz:", req.params.id);
  await deleteQuiz(req, res);
});

// Public or Student Protected route to view scores
router.get("/leaderboard/:id", getQuizLeaderboard);

export default router;
