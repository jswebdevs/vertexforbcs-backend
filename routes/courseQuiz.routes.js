// backend/routes/courseQuiz.routes.js

import express from "express";
import { getAllQuizzes } from "../controllers/quizzes.controller.js";

const router = express.Router();

// GET /api/courses/:courseId/quizzes
router.get("/:courseId/quizzes", async (req, res) => {
  console.log(
    "[courseQuiz.routes] GET /:courseId/quizzes - courseId:",
    req.params.courseId
  );

  // Reuse existing getAllQuizzes, inject courseID into query
  req.query.courseID = req.params.courseId;
  await getAllQuizzes(req, res);
});

export default router;
