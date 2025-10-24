// backend/middlewares/auth.middleware.js

import jwt from "jsonwebtoken";
import User from "../models/users.model.js";

// ----------------------------------------------------
// VERIFY TOKEN - For Protected Routes
// ----------------------------------------------------
export const verifyToken = async (req, res, next) => {
  let token;

  try {
    // Extract token from "Authorization: Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If missing
    if (!token) {
      console.warn("[verifyToken] Token missing from header");
      return res.status(401).json({ message: "Authorization token missing" });
    }

    // Verify & Decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[verifyToken] Token decoded:", decoded);

    // Find matching user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn(`[verifyToken] No user found for ID: ${decoded.id}`);
      return res.status(401).json({ message: "User not found or unauthorized" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    // Handle Expired / Invalid tokens gracefully
    console.error(`[verifyToken] Error verifying token: ${err.message}`);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token format or signature" });
    } else {
      return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
    }
  }
};

// ----------------------------------------------------
// ADMIN ONLY RESTRICTION
// ----------------------------------------------------
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.userType === "admin") {
    console.log(`[adminOnly] Access granted for Admin: ${req.user.username}`);
    next();
  } else {
    console.warn(`[adminOnly] Access denied - Not Admin: ${req.user?.username}`);
    return res.status(403).json({ message: "Admin access only" });
  }
};

// ----------------------------------------------------
// STUDENT ONLY RESTRICTION
// ----------------------------------------------------
export const studentOnly = (req, res, next) => {
  if (req.user && req.user.userType === "student") {
    console.log(`[studentOnly] Student verified: ${req.user.username || req.user.email}`);
    next();
  } else {
    console.warn(`[studentOnly] Access denied - Not Student: ${req.user?.username || req.user?.email}`);
    return res.status(403).json({ message: "Student access only" });
  }
};
