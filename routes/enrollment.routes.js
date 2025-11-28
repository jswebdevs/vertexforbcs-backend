// backend/routes/enrollment.routes.js

import express from "express";
import {
  createEnrollmentRequest,
  getAllEnrollmentRequests,
  getSingleEnrollmentRequest,
  verifyAndEnrollStudent,
  rejectEnrollmentRequest,
} from "../controllers/enrollment.controller.js";
import { verifyToken, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Base route for listing and creating requests: /api/enrollments

// 1. GET ALL PENDING REQUESTS (Admin Queue View)
// Protection: Requires valid token AND must be an admin
router.get("/", getAllEnrollmentRequests);

// 2. CREATE NEW REQUEST (Student Cart Submission)
// Maps to: POST /api/enrollments/request
// Protection: Requires valid token (Only logged-in students can submit requests)
router.post("/request", verifyToken, createEnrollmentRequest);

// Specific request operations: /api/enrollments/:id

// 3. GET SINGLE REQUEST (Admin View Detail)
router.get("/:id", verifyToken, adminOnly, getSingleEnrollmentRequest);

// 4. VERIFY/APPROVE AND ENROLL (Admin Action)
// Maps to: PUT /api/enrollments/:id/verify
// Protection: Requires valid token AND must be an admin
router.put("/:id/verify", verifyToken, adminOnly, verifyAndEnrollStudent);

// 5. REJECT/DELETE REQUEST (Admin Action)
// Protection: Requires valid token AND must be an admin
router.delete("/:id", verifyToken, adminOnly, rejectEnrollmentRequest);


export default router;