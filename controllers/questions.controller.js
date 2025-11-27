// backend/controllers/questions.controller.js

import Question from "../models/questions.model.js";
import csv from "csvtojson";

// --------------------------------------------------
// CREATE NEW QUESTION (Admin)
// --------------------------------------------------
export const createQuestion = async (req, res) => {
  console.log("[questions.controller] createQuestion - req.body:", req.body);

  try {
    const {
      quizId,
      id,
      serialNo,
      question_title,
      img,
      A,
      B,
      C,
      D,
      correctAnswer,
      Mark,
      negativeMarks,
    } = req.body;

    // Basic validation
    if (
      !quizId ||
      !id ||
      serialNo == null ||
      !question_title ||
      !A ||
      !B ||
      !C ||
      !D ||
      !correctAnswer ||
      Mark == null ||
      negativeMarks == null
    ) {
      return res.status(400).json({
        message:
          "quizId, id, serialNo, question_title, options A-D, correctAnswer, Mark and negativeMarks are required",
      });
    }

    const questionData = {
      quizId,
      id,
      serialNo,
      question_title,
      img: Array.isArray(img) ? img : [],
      A,
      B,
      C,
      D,
      correctAnswer,
      Mark,
      negativeMarks,
    };

    const newQuestion = await new Question(questionData).save();

    console.log("[questions.controller] New question created:", newQuestion._id);
    return res.status(201).json({
      message: "Question created successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("[questions.controller] Error creating question:", error);
    return res.status(500).json({ message: "Server error creating question" });
  }
};

// --------------------------------------------------
// BULK CSV IMPORT QUESTIONS (Admin)
// --------------------------------------------------
export const importQuestionsCSV = async (req, res) => {
  try {
    // Assumes multer has placed the uploaded file in req.file
    if (!req.file)
      return res.status(400).json({ message: "No CSV file uploaded." });

    const quizId = req.params.quizId;
    if (!quizId)
      return res.status(400).json({ message: "quizId missing in params." });

    // Parse file to JSON using csvtojson
    const jsonArray = await csv().fromFile(req.file.path);

    // Ensure all required fields exist and add quizId to each question
    const validQuestions = jsonArray
      .map((q, idx) => {
        if (
          !q.id ||
          q.serialNo == null ||
          !q.question_title ||
          !q.A ||
          !q.B ||
          !q.C ||
          !q.D ||
          !q.correctAnswer ||
          q.Mark == null ||
          q.negativeMarks == null
        ) {
          // Skip invalid rows (could be enhanced to collect/report errors)
          return null;
        }
        // If img is a JSON string in CSV, parse it; else, default to empty array
        let images = [];
        if (q.img) {
          try {
            images = JSON.parse(q.img);
          } catch {
            images = [];
          }
        }
        return {
          quizId,
          id: q.id,
          serialNo: Number(q.serialNo),
          question_title: q.question_title,
          img: Array.isArray(images) ? images : [],
          A: q.A,
          B: q.B,
          C: q.C,
          D: q.D,
          correctAnswer: q.correctAnswer,
          Mark: Number(q.Mark),
          negativeMarks: Number(q.negativeMarks),
        };
      })
      .filter(Boolean);

    if (validQuestions.length === 0)
      return res.status(400).json({ message: "No valid questions in CSV." });

    const inserted = await Question.insertMany(validQuestions);

    res.status(201).json({
      message: `${inserted.length} questions imported successfully!`,
      questions: inserted,
    });
  } catch (error) {
    console.error("[questions.controller] Error importing CSV:", error);
    res
      .status(500)
      .json({ message: "Error importing questions from CSV.", error: error.message });
  }
};

// --------------------------------------------------
// GET ALL QUESTIONS (optionally filter by quizId)
// --------------------------------------------------
export const getAllQuestions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.quizId) {
      filter.quizId = req.query.quizId;
    }

    const questions = await Question.find(filter).sort({ serialNo: 1, createdAt: 1 });
    return res.status(200).json(questions);
  } catch (error) {
    console.error("[questions.controller] Error fetching questions:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching questions" });
  }
};

// --------------------------------------------------
// GET SINGLE QUESTION BY ID
// --------------------------------------------------
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    return res.status(200).json(question);
  } catch (error) {
    console.error("[questions.controller] Error fetching question:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching question" });
  }
};

// --------------------------------------------------
// UPDATE QUESTION (Admin)
// --------------------------------------------------
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = { ...req.body };

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    console.log("[questions.controller] Question updated:", updatedQuestion._id);
    return res.status(200).json({
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("[questions.controller] Error updating question:", error);
    return res
      .status(500)
      .json({ message: "Server error updating question" });
  }
};

// --------------------------------------------------
// DELETE QUESTION (Admin)
// --------------------------------------------------
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    console.log("[questions.controller] Question deleted:", deletedQuestion._id);
    return res
      .status(200)
      .json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("[questions.controller] Error deleting question:", error);
    return res
      .status(500)
      .json({ message: "Server error deleting question" });
  }
};
