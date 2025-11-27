// backend/controllers/quizzes.controller.js

import Quiz from "../models/quizzes.model.js";

// --------------------------------------------------
// CREATE NEW QUIZ (Admin)
// --------------------------------------------------
export const createQuiz = async (req, res) => {
  console.log("[quizzes.controller] createQuiz - req.body:", req.body);

  try {
    const {
      courseID,
      courseTitle,
      quizTitle,
      quizDescription,
      quizDate,
      totalMarks,
      startTime,
      endTime,
      duration,
      highestMarks, // can be null on creation
    } = req.body;

    // Basic validation
    if (!courseID || !courseTitle || !quizTitle || !quizDate || !totalMarks || !startTime || !endTime || !duration) {
      return res.status(400).json({
        message:
          "courseID, courseTitle, quizTitle, quizDate, totalMarks, startTime, endTime, and duration are required",
      });
    }

    const quizData = {
      courseID,
      courseTitle,
      quizTitle,
      quizDescription,
      quizDate,
      totalMarks,
      startTime,
      endTime,
      duration,
      highestMarks: highestMarks ?? null,
      // Optional: you can set status based on your needs
      status: "draft",
      createdBy: req.user?._id, // if you use auth
    };

    const newQuiz = await new Quiz(quizData).save();

    console.log("[quizzes.controller] New quiz created:", newQuiz._id);
    return res.status(201).json({
      message: "Quiz created successfully",
      quiz: newQuiz,
    });
  } catch (error) {
    console.error("[quizzes.controller] Error creating quiz:", error);
    return res.status(500).json({ message: "Server error creating quiz" });
  }
};

// --------------------------------------------------
// GET ALL QUIZZES (optionally filter by courseID)
// --------------------------------------------------
export const getAllQuizzes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseID) {
      filter.courseID = req.query.courseID;
    }

    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(quizzes);
  } catch (error) {
    console.error("[quizzes.controller] Error fetching quizzes:", error);
    return res.status(500).json({ message: "Server error fetching quizzes" });
  }
};

// --------------------------------------------------
// GET SINGLE QUIZ BY ID
// --------------------------------------------------
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    return res.status(200).json(quiz);
  } catch (error) {
    console.error("[quizzes.controller] Error fetching quiz:", error);
    return res.status(500).json({ message: "Server error fetching quiz" });
  }
};

// --------------------------------------------------
// UPDATE QUIZ (Admin)
// --------------------------------------------------
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = { ...req.body };

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    console.log("[quizzes.controller] Quiz updated:", updatedQuiz._id);
    return res
      .status(200)
      .json({ message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (error) {
    console.error("[quizzes.controller] Error updating quiz:", error);
    return res.status(500).json({ message: "Server error updating quiz" });
  }
};

// --------------------------------------------------
// DELETE QUIZ (Admin)
// --------------------------------------------------
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuiz = await Quiz.findByIdAndDelete(id);
    if (!deletedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    console.log("[quizzes.controller] Quiz deleted:", deletedQuiz._id);
    return res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("[quizzes.controller] Error deleting quiz:", error);
    return res.status(500).json({ message: "Server error deleting quiz" });
  }
};
