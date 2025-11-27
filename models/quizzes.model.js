// backend/models/quizzes.model.js

import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    // Relation to course (store both ID and title for convenience)
    courseID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",     // or String if your courseID is not ObjectId
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
    },

    // Core quiz info
    quizTitle: {
      type: String,
      required: true,
      trim: true,
    },
    quizDescription: {
      type: String,
      default: "",
    },

    // Schedule & configuration
    quizDate: {
      type: Date,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    startTime: {
      type: String, // you can store as "HH:mm" string
      required: true,
    },
    endTime: {
      type: String, // "HH:mm"
      required: true,
    },
    duration: {
      type: String, // "30 minutes" or "00:30:00" – up to you
      required: true,
    },

    // Aggregated performance info
    highestMarks: {
      type: Number,
      default: null,
    },

    // Optional metadata
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
