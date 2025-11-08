// backend/controllers/users.controller.js

import User from "../models/users.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --------------------
// STUDENT REGISTRATION CONTROLLER
// --------------------
export const registerStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contactNO,
      paymentMethod,
      trxID,
      numberUsed,
      courses,
    } = req.body;

    if (!email || !firstName || !lastName || !courses || courses.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingStudent = await User.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already registered" });
    }

    const newStudent = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      contactNO,
      paymentMethod,
      trxID,
      numberUsed,
      courses,
      userType: "student",
      status: "hold",
      loginMethod: "controller",
    });

    console.log("[registerStudent] New student registered:", newStudent.email);
    res.status(201).json({
      message: "Student registered successfully; awaiting admin approval.",
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
      console.log("[controllerSignup] Username or email already exists:", normalizedUsername);
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

    console.log("[controllerSignup] User created successfully:", user.email);

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

    console.log("[controllerLogin] Attempting login with:", usernameOrEmail);

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
      console.log("[controllerLogin] No user found for:", usernameOrEmail);
      return res.status(401).json({ message: "User not found" });
    }

    if (user.loginMethod !== "controller") {
      console.log("[controllerLogin] Wrong method login:", user.loginMethod);
      return res.status(401).json({ message: "Use the correct login method" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("[controllerLogin] Invalid password for:", usernameOrEmail);
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("[controllerLogin] Login successful for:", user.username);
    res.json({ user, token });
  } catch (err) {
    console.error("[controllerLogin] Unexpected error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// --------------------
// SYNC USER (Firebase)
// --------------------
export const syncUser = async (req, res) => {
  const {
    email,
    uid,
    username,
    firstName,
    lastName,
    userType = "student",
    photoURL,
    loginMethod = "firebase",
  } = req.body;

  if (!email || !uid) {
    return res.status(400).json({ message: "Email and Firebase UID required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Look for existing user via Firebase UID or email
    let user = await User.findOne({
      $or: [{ firebaseUID: uid }, { email: normalizedEmail }],
    });

    if (user) {
      // -----------------------------
      // UPDATE EXISTING FIREBASE USER
      // -----------------------------
      const updatedFields = {
        username: username?.trim() || user.username,
        firstName: firstName?.trim() || user.firstName,
        lastName: lastName?.trim() || user.lastName,
        email: normalizedEmail,
        avatar: photoURL || user.avatar,
        userType: user.userType || "student",
        firebaseUID: uid,
        loginMethod: loginMethod || "firebase",
        status: "active",
      };

      // merge new fields without deleting existing non-null custom fields
      Object.entries(updatedFields).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") user[key] = val;
      });

      await user.save();
      console.log("[syncUser] Existing Firebase user synced and updated");
    } else {
      // -----------------------------
      // CREATE NEW FIREBASE USER
      // -----------------------------
      user = await User.create({
        username: username?.trim() || normalizedEmail.split("@")[0],
        firstName: firstName?.trim() || "",
        lastName: lastName?.trim() || "",
        email: normalizedEmail,
        firebaseUID: uid,
        userType: userType || "student",
        loginMethod,
        avatar: photoURL || "",
        status: "active",
      });
      console.log("[syncUser] New Firebase user created:", normalizedEmail);
    }

    // -----------------------------
    // ISSUE NEW JWT TOKEN
    // -----------------------------
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // return fresh user data
    return res.status(200).json({
      message: "User synced successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("[syncUser] Error:", error);
    return res.status(500).json({ message: "Server error syncing user" });
  }
};


// --------------------
// ADMIN CRUD OPERATIONS
// --------------------
// --------------------
// GET ALL USERS (Public - Filtered)
// --------------------
export const getUsers = async (req, res) => {
  try {
    console.log("[getUsers] Fetching all students (public with filters)");

    // ✅ Find only students and exclude sensitive fields
    const users = await User.find({ userType: "student" }) // ✅ Filter for students only
      .select('-password -firebaseUID -contactNO -trxID -numberUsed -paymentMethod')
      .sort({ joinedAt: -1 }) // Sort by newest first
      .lean(); // Convert to plain JavaScript objects for better performance

    // ✅ Additional filtering - only return necessary public info
    const publicUsers = users.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      userType: user.userType,
      status: user.status,
      joinedAt: user.joinedAt,
      courses: user.courses?.map(course => ({
        course_id: course.course_id,
        title: course.title,
      })) || [],
    }));

    console.log(`[getUsers] Returning ${publicUsers.length} students`);
    res.json(publicUsers);
  } catch (err) {
    console.error("[getUsers] Error:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};


// --------------------
// GET SINGLE USER
// --------------------

export const getUser = async (req, res) => {
  try {

    const user = await User.findById(req.params.id);
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
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

// --------------------
// CHECK USERNAME OR EMAIL AVAILABILITY
// --------------------
// --------------------
// CHECK USERNAME / EMAIL VALIDITY
// --------------------
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

