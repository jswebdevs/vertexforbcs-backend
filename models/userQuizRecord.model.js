// backend/models/userQuizRecord.model.js

import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedAnswer: { type: String, required: true }, // "A", "B", "C", "D"
    correctAnswer: { type: String }, // store for fast lookup/results, optional
    score: { type: Number, default: 0 }
  },
  { _id: false }
);

const userQuizRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    score: { type: Number, default: 0 },
    answers: { type: [answerSchema], default: [] }
  },
  { timestamps: true }
);

const UserQuizRecord = mongoose.model("UserQuizRecord", userQuizRecordSchema);

export default UserQuizRecord;
