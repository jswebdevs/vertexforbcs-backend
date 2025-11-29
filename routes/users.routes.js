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
  newEnrollRequest,
  saveQuizResult, // ✅ Imported new controller
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

// 5. Legacy Enrollment Request (If still used alongside enrollment.routes.js)
router.post("/newenrollrequest/:id", verifyToken, async (req, res) => {
    console.log("[users.routes] POST /newenrollrequest/:id");
    await newEnrollRequest(req, res);
});

// 6. Get All Users
router.get("/", getUsersLimiter, async (req, res) => {
  console.log("[users.routes] GET / (Public) - Fetch all users");
  await getUsers(req, res);
});


// --------------------------------------------------
// STUDENT & QUIZ ROUTES
// --------------------------------------------------

// 7. Get Student Profile
router.get("/me", verifyToken, studentOnly, async (req, res) => {
  console.log("[users.routes] GET /me (Student self profile)");
  try {
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

// 8. ✅ SAVE QUIZ RESULT (New Route)
// Maps to: https://backend.vertexforbcs.org//api/users/:studentId/:quizId
router.post("/:studentId/:quizId", verifyToken, async (req, res) => {
    console.log(`[users.routes] POST Quiz Result for Student: ${req.params.studentId}`);
    await saveQuizResult(req, res);
});


// --------------------------------------------------
// GENERAL USER ROUTES (Must come last to avoid conflicting with specific paths)
// --------------------------------------------------

// 9. Get Single User (Public Access by ID)
router.get("/:id", async (req, res) => {
  console.log("[users.routes] GET /:id (Public Access) -", req.params.id);
  await getUser(req, res);
});

// 10. Update User (Admin Only)
router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[users.routes] PUT /:id (Admin) -", req.params.id);
  await updateUser(req, res);
});

// 11. Delete User (Admin Only)
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  console.log("[users.routes] DELETE /:id (Admin) -", req.params.id);
  await deleteUser(req, res);
});

export default router;