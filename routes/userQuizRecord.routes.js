// backend/routes/userQuizRecord.routes.js
import express from "express";
import {
  createUserQuizRecord,
  getUserQuizRecords,
  getSingleUserQuizRecord
} from "../controllers/userQuizRecord.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createUserQuizRecord);
// GET all records for a user/course/quiz
router.get("/:userId/record/:quizId", getSingleUserQuizRecord);
router.get("/:userId/record", verifyToken, getUserQuizRecords)

export default router;