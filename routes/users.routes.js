// backend/routes/users.routes.js

import express from "express";
import rateLimit from "express-rate-limit";
import User from "../models/users.model.js"; 
import {
  controllerSignup,
  controllerLogin,
  registerStudent,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  checkUsernameOrEmail,
  newEnrollRequest
} from "../controllers/users.controller.js";
import {
  verifyToken,
  adminOnly,
  studentOnly,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// --------------------------------------------------
// RATE LIMITERS
// --------------------------------------------------
const getUsersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts." },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: "Too many registration attempts." },
});

// --------------------------------------------------
// PUBLIC ROUTES (No Token Required)
// --------------------------------------------------

// 1. Register Student
router.post("/register-student", registerLimiter, async (req, res) => {
  console.log("[users.routes] POST /register-student");
  await registerStudent(req, res);
});

// 2. Check Availability
router.get("/check-username/:value", async (req, res) => {
  console.log("[users.routes] GET /check-username/:value");
  await checkUsernameOrEmail(req, res);
});

// 3. Admin/General Signup
router.post("/signup", registerLimiter, async (req, res) => {
  console.log("[users.routes] POST /signup");
  await controllerSignup(req, res);
});

// 4. Login
router.post("/login", loginLimiter, async (req, res) => {
  console.log("[users.routes] POST /login");
  await controllerLogin(req, res);
});

//New Enrollment

router.post("/newenrollrequest/:id", verifyToken, async (req, res) => {
    console.log("[users.routes] POST /newenrollrequest/:id");
    await newEnrollRequest(req, res);
});

// 5. Get All Users (Public)
router.get("/", getUsersLimiter, async (req, res) => {
  console.log("[users.routes] GET / (Public) - Fetch all users");
  await getUsers(req, res);
});

// 6. Get Single User (Public - Accessible by ID)
// ✅ NOTE: Removed verifyToken and req.user checks to make this public.
// The controller filters out the password.
router.get("/:id", async (req, res) => {
  console.log("[users.routes] GET /:id (Public Access) -", req.params.id);
  await getUser(req, res);
});

// --------------------------------------------------
// STUDENT-PROTECTED ROUTES (Token Required)
// --------------------------------------------------

// Student accesses their own profile via Token
router.get("/me", verifyToken, studentOnly, async (req, res) => {
  console.log("[users.routes] GET /me (Student self profile)");
  try {
    // req.user.id comes from the decoded JWT
    const student = await User.findById(req.user.id).select("-password"); 
    
    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student);
  } catch (err) {
    console.error("[users.routes] Error fetching student profile:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// --------------------------------------------------
// ADMIN PROTECTED ROUTES (Token + Admin Check)
// --------------------------------------------------

// Update User (Admin Only)
router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[users.routes] PUT /:id (Admin) -", req.params.id);
  await updateUser(req, res);
});

// Delete User (Admin Only)
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[users.routes] DELETE /:id (Admin) -", req.params.id);
  await deleteUser(req, res);
});

export default router;