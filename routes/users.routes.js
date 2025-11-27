// backend/routes/users.routes.js

import express from "express";
import rateLimit from "express-rate-limit";
import {
  controllerSignup,
  controllerLogin,
  registerStudent,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  checkUsernameOrEmail,
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

// Rate limiter for public user list endpoint
const getUsersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per 15 minutes
  message: {
    error: "Too many login attempts, please try again after 15 minutes.",
  },
  skipSuccessfulRequests: true,
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registrations per hour
  message: {
    error: "Too many registration attempts, please try again later.",
  },
});

// --------------------------------------------------
// PUBLIC ROUTES
// --------------------------------------------------

// Student Registration (Public with rate limiting)
router.post("/register-student", registerLimiter, async (req, res) => {
  console.log("[users.routes] POST /register-student");
  await registerStudent(req, res);
});

// Username / Email availability checker (Public)
router.get("/check-username/:value", async (req, res) => {
  console.log("[users.routes] GET /check-username/:value");
  await checkUsernameOrEmail(req, res);
});

// Generic Signup (e.g., Admin creation with rate limiting)
router.post("/signup", registerLimiter, async (req, res) => {
  console.log("[users.routes] POST /signup");
  await controllerSignup(req, res);
});

// Controller-based login (with rate limiting)
router.post("/login", loginLimiter, async (req, res) => {
  console.log("[users.routes] POST /login");
  await controllerLogin(req, res);
});

// ✅ Get all users (Public with rate limiting - sensitive data filtered)
router.get("/", getUsersLimiter, async (req, res) => {
  console.log("[users.routes] GET / (Public) - Fetch all users");
  await getUsers(req, res);
});

// --------------------------------------------------
// STUDENT-PROTECTED ROUTES
// --------------------------------------------------

// Student accesses their own profile
router.get("/me", verifyToken, studentOnly, async (req, res) => {
  console.log("[users.routes] GET /me (Student self profile)");
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.error("[users.routes] Error fetching student profile:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// --------------------------------------------------
// ADMIN + GENERAL PROTECTED ROUTES
// --------------------------------------------------

// Admin OR self-access to single user
router.get("/:id", verifyToken, async (req, res) => {
  console.log("[users.routes] GET /:id (Admin or self) -", req.params.id);
  try {
    const { id } = req.params;
    if (req.user.userType === "admin" || req.user._id.toString() === id) {
      await getUser(req, res);
    } else {
      console.warn("[users.routes] Forbidden: not admin or self");
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (err) {
    console.error("[users.routes] Error fetching user:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// Admin updates user
router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[users.routes] PUT /:id (Admin) -", req.params.id);
  await updateUser(req, res);
});

// Admin deletes user
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[users.routes] DELETE /:id (Admin) -", req.params.id);
  await deleteUser(req, res);
});

export default router;
