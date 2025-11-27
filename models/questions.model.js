// backend/models/questions.model.js

import mongoose from "mongoose";

const questionImageSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    src: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    // Local question id inside quiz (string, e.g. "q1")
    id: {
      type: String,
      required: true,
      trim: true,
    },

    // Serial number shown to student (1,2,3,...)
    serialNo: {
      type: Number,
      required: true,
    },

    // Question text
    question_title: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional images array
    img: {
      type: [questionImageSchema],
      default: [],
    },

    // Options
    A: {
      type: String,
      required: true,
      trim: true,
    },
    B: {
      type: String,
      required: true,
      trim: true,
    },
    C: {
      type: String,
      required: true,
      trim: true,
    },
    D: {
      type: String,
      required: true,
      trim: true,
    },

    // Correct option key: "A" | "B" | "C" | "D"
    correctAnswer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },

    // Marks & negative marks for this question
    Mark: {
      type: Number,
      required: true,
      min: 0,
    },
    negativeMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    // Reference back to the quiz document
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
