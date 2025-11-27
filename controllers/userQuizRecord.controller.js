// backend/controllers/userQuizRecord.controller.js
import UserQuizRecord from "../models/userQuizRecord.model.js";

// Create a new quiz attempt/record
export const createUserQuizRecord = async (req, res) => {
  try {
    const { userId, courseId, quizId, answers, score, finishedAt } = req.body;
    if (!userId || !courseId || !quizId || !answers) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const recordData = { userId, courseId, quizId, answers, score, finishedAt };
    const newRecord = await new UserQuizRecord(recordData).save();

    res.status(201).json({ message: "Quiz record created", record: newRecord });
  } catch (error) {
    console.error("Error creating quiz record:", error);
    res.status(500).json({ message: "Server error creating quiz record" });
  }
};

// Get all records for a user/course/quiz
export const getUserQuizRecords = async (req, res) => {
  try {
    const { userId, courseId, quizId } = req.params;
    const filter = { userId, courseId, quizId };
    const records = await UserQuizRecord.find(filter);
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching user quiz records:", error);
    res.status(500).json({ message: "Server error fetching quiz records" });
  }
};

// Get single user quiz record
export const getSingleUserQuizRecord = async (req, res) => {
  try {
    const { userId, courseId, quizId } = req.params;
    const record = await UserQuizRecord.findOne({ userId, courseId, quizId });
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.status(200).json(record);
  } catch (error) {
    console.error("Error fetching user quiz record:", error);
    res.status(500).json({ message: "Server error fetching quiz record" });
  }
};
