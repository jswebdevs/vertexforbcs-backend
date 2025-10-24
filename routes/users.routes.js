import express from "express";
import {
  controllerSignup,
  controllerLogin,
  registerStudent,
  syncUser,
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
// PUBLIC ROUTES
// --------------------------------------------------

// Student Registration (Public)
router.post("/register-student", async (req, res) => {
  console.log("[users.routes] POST /register-student");
  await registerStudent(req, res);
});

// Username / Email availability checker (Public)
router.get("/check-username/:value", async (req, res) => {
  console.log("[users.routes] GET /check-username/:value");
  await checkUsernameOrEmail(req, res);
});

// Generic Signup (e.g., Admin creation)
router.post("/signup", async (req, res) => {
  console.log("[users.routes] POST /signup");
  await controllerSignup(req, res);
});

// Controller-based login
router.post("/login", async (req, res) => {
  console.log("[users.routes] POST /login");
  await controllerLogin(req, res);
});

// Firebase Sync (Google Sign-In)
router.post("/sync", async (req, res) => {
  console.log("[users.routes] POST /sync");
  await syncUser(req, res);
});

// --------------------------------------------------
// STUDENT-PROTECTED ROUTES
// --------------------------------------------------

// Student accesses their own profile
router.get("/me", verifyToken, studentOnly, async (req, res) => {
  console.log("[users.routes] GET /me (Student self profile)");
  try {
    // return student info (populated by verifyToken)
    res.status(200).json(req.user);
  } catch (err) {
    console.error("[users.routes] Error fetching student profile:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// --------------------------------------------------
// ADMIN + GENERAL PROTECTED ROUTES
// --------------------------------------------------

// Admin: View all users
router.get("/", verifyToken, adminOnly, async (req, res) => {
  console.log("[users.routes] GET / (Admin) - Fetch all users");
  await getUsers(req, res);
});

// Admin OR self-access to single user
router.get("/:id", verifyToken, async (req, res) => {
  console.log("[users.routes] GET /:id (Admin or self) -", req.params.id);
  try {
    const { id } = req.params;

    // Allow admin OR self-user
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
