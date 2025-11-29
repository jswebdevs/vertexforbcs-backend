// backend/controllers/users.controller.js

import User from "../models/users.model.js";
import Quiz from "../models/quizzes.model.js"; // ✅ Imported Quiz to fetch titles
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --------------------
// HELPER: CALCULATE EXPIRY DATE
// --------------------
const calculateExpiryDate = (plan) => {
  const now = new Date();
  switch (plan) {
    case "1M":
      return new Date(now.setDate(now.getDate() + 30));
    case "2M":
      return new Date(now.setDate(now.getDate() + 60));
    case "3M":
      return new Date(now.setDate(now.getDate() + 90));
    case "6M":
      return new Date(now.setDate(now.getDate() + 180));
    case "Lifetime":
      return new Date(now.setFullYear(now.getFullYear() + 100));
    default:
      return new Date(now.setDate(now.getDate() + 30));
  }
};

// --------------------
// STUDENT REGISTRATION CONTROLLER
// --------------------
export const registerStudent = async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, contactNO, paymentMethod, trxID, numberUsed, courses,
    } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingStudent = await User.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already registered" });
    }

    let processedCourses = [];
    if (courses && Array.isArray(courses)) {
      processedCourses = courses.map((c) => {
        const plan = c.plan || "1M";
        return {
          courseId: c.courseId,
          title: c.title || "",
          plan: plan,
          startDate: new Date(),
          expiryDate: calculateExpiryDate(plan),
          isActive: true,
        };
      });
    }

    const newStudent = await User.create({
      firstName, lastName, email: normalizedEmail, password, contactNO, paymentMethod, trxID, numberUsed,
      courses: processedCourses,
      userType: "student",
      status: "active",
      loginMethod: "controller",
    });

    res.status(201).json({
      message: "Student registered successfully.",
      student: newStudent,
    });
  } catch (err) {
    console.error("[registerStudent] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// SIGNUP CONTROLLER
// --------------------
export const controllerSignup = async (req, res) => {
  const { username, password, email, firstName, lastName, userType = "student" } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const normalizedUsername = username.trim();
    const normalizedEmail = email?.trim()?.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      password: hashedPassword,
      email: normalizedEmail,
      firstName,
      lastName,
      userType,
      loginMethod: "controller",
      status: "active",
    });

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error("[controllerSignup] Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// LOGIN CONTROLLER
// --------------------
export const controllerLogin = async (req, res) => {
  try {
    let { usernameOrEmail, password } = req.body;
    usernameOrEmail = usernameOrEmail?.trim()?.toLowerCase();

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: new RegExp(`^${usernameOrEmail}$`, "i") },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.loginMethod !== "controller") {
      return res.status(401).json({ message: "Use the correct login method" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error("[controllerLogin] Unexpected error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// CRUD OPERATIONS
// --------------------

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ userType: "student" })
      .select("-password")
      .sort({ joinedAt: -1 })
      .lean();

    const formattedUsers = users.map((user) => ({
      ...user,
      courses: user.courses?.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        plan: course.plan,
        expiryDate: course.expiryDate,
      })) || [],
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error("[getUsers] Error:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[getUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[updateUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("[deleteUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkUsernameOrEmail = async (req, res) => {
  try {
    const { value } = req.params;
    const normalized = value.trim().toLowerCase();
    const existing = await User.findOne({
      $or: [{ username: normalized }, { email: normalized }],
    });

    if (existing) {
      return res.json({ available: false, message: "Username or email is already registered" });
    }
    res.json({ available: true, message: "Available" });
  } catch (err) {
    console.error("[checkUsernameOrEmail] Error:", err);
    res.status(500).json({ available: false, message: "Server error" });
  }
};

// --------------------
// LEGACY / UTILITY ROUTES (If still used by frontend)
// --------------------

export const newEnrollRequest = async (req, res) => {
  // This logic is now largely handled by enrollment.controller.js, 
  // but kept here if legacy routes still point to it.
  const studentId = req.params.id;
  const { trxID, numberUsed, paymentMethod } = req.body;

  try {
    await User.findByIdAndUpdate(studentId, {
      paymentMethod: paymentMethod || "Mobile Banking",
      trxID: trxID,
      numberUsed: numberUsed,
    });
    return res.status(200).json({ message: "Payment info updated." });
  } catch (err) {
    console.error("[newEnrollRequest] Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

export const getEnrollmentRequest = async (req, res) => {
    // Placeholder for legacy support
    res.status(200).json({ message: "Use /api/enrollments/ for requests." });
};

// --------------------------------------------------
// NEW: SAVE QUIZ RESULT
// Maps to: POST /api/users/:studentId/:quizId
// --------------------------------------------------
export const saveQuizResult = async (req, res) => {
  const { studentId, quizId } = req.params;
  const { score, rightAnswers, wrongAnswers, totalAnswered, answers } = req.body;

  try {
    // 1. Check User
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Check if Quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // 3. CRITICAL: Check if already attended
    const existingIndex = user.quizzesAttended.findIndex(
        q => q.quizId.toString() === quizId
    );

    if (existingIndex > -1) {
      // STRICT RULE: Do not allow re-submission / update
      return res.status(403).json({ 
          message: "You have already attempted this quiz. Retakes are not allowed.",
          previousResult: user.quizzesAttended[existingIndex] 
      });
    }

    // 4. Map detailed answers
    const formattedDetails = answers ? answers.map(a => ({
        questionId: a.question_id,
        serialNo: a.serialNo || 0,
        answer: a.answer
    })) : [];

    // 5. Create Result Object
    const newResult = {
      quizId: quiz._id,
      quizTitle: quiz.quizTitle,
      score: parseFloat(score),
      totalAnswered: parseInt(totalAnswered) || 0,
      rightAnswers: parseInt(rightAnswers) || 0,
      wrongAnswers: parseInt(wrongAnswers) || 0,
      details: formattedDetails,
      submittedAt: new Date()
    };

    // 6. Save New Result
    user.quizzesAttended.push(newResult);
    await user.save();

    console.log(`[saveQuizResult] Saved result for user ${user.username}, Quiz: ${quiz.quizTitle}`);
    res.status(200).json({ message: "Quiz result saved successfully", result: newResult });

  } catch (err) {
    console.error("[saveQuizResult] Error:", err);
    res.status(500).json({ message: "Server error saving quiz result" });
  }
};
// --------------------------------------------------
// SAVE QUIZ RESULT (Modified: One Attempt Only)
// --------------------------------------------------
