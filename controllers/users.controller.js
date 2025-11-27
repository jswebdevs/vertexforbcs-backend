// backend/controllers/users.controller.js

import User from "../models/users.model.js";
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
      return new Date(now.setDate(now.getDate() + 30)); // Default 1 month
  }
};

// --------------------
// STUDENT REGISTRATION CONTROLLER
// --------------------
export const registerStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      contactNO,
      paymentMethod,
      trxID,
      numberUsed,
      courses, // Array of { courseId, plan } coming from frontend
    } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingStudent = await User.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already registered" });
    }

    // -------------------------------------------------
    // Process Courses & Calculate Expiry
    // -------------------------------------------------
    let processedCourses = [];
    if (courses && Array.isArray(courses)) {
      processedCourses = courses.map((c) => {
        // Ensure we have a plan, default to 1M if missing
        const plan = c.plan || "1M";
        return {
          courseId: c.courseId, // Matches new Model
          title: c.title || "", // Optional
          plan: plan,
          startDate: new Date(),
          expiryDate: calculateExpiryDate(plan), // CALCULATE EXPIRY HERE
          isActive: true,
        };
      });
    }

    const newStudent = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      contactNO,
      paymentMethod,
      trxID,
      numberUsed,
      courses: processedCourses, // Save the processed array
      userType: "student",
      status: "active", // Or "hold" if you verify payments manually
      loginMethod: "controller",
    });

    console.log("[registerStudent] New student registered:", newStudent.email);
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
// SIGNUP CONTROLLER (ADMIN/STUDENT ACCOUNT)
// --------------------
export const controllerSignup = async (req, res) => {
  const { username, password, email, firstName, lastName, userType = "student" } = req.body;
  console.log("[controllerSignup] Incoming request:", req.body);

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
// ADMIN / USER CRUD OPERATIONS
// --------------------

// GET ALL USERS (Filtered - ONLY Password Hidden)
export const getUsers = async (req, res) => {
  try {
    console.log("[getUsers] Fetching all students");
    const users = await User.find({ userType: "student" })
      .select("-password") // ✅ ONLY Password is hidden
      .sort({ joinedAt: -1 })
      .lean();

    // Map to ensure course structure is clean, but keep all other user fields
    const formattedUsers = users.map((user) => ({
      ...user, // Include all fields (firstName, contactNO, trxID, etc.)
      courses:
        user.courses?.map((course) => ({
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

// GET SINGLE USER (Filtered - ONLY Password Hidden)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
        .select("-password"); // ✅ ONLY Password is hidden

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[getUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    console.log("[updateUser] Updating user ID:", req.params.id);
    // If updating password, it will be hashed by the model pre-save hook 
    // BUT findByIdAndUpdate bypasses pre-save hooks unless structured carefully.
    // If you need to update password here, use findById -> save() pattern instead.
    // For general fields, this is fine.
    
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .select("-password");
        
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[updateUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    console.log("[deleteUser] Deleting user ID:", req.params.id);
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("[deleteUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// CHECK USERNAME OR EMAIL AVAILABILITY
export const checkUsernameOrEmail = async (req, res) => {
  try {
    const { value } = req.params;
    const normalized = value.trim().toLowerCase();
    const existing = await User.findOne({
      $or: [{ username: normalized }, { email: normalized }],
    });

    if (existing) {
      return res.json({
        available: false,
        message: "Username or email is already registered",
      });
    }

    res.json({
      available: true,
      message: "Available",
    });
  } catch (err) {
    console.error("[checkUsernameOrEmail] Error:", err);
    res.status(500).json({ available: false, message: "Server error" });
  }
};