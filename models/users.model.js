// backend/models/users.model.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// -------------------------------
// USER SCHEMA DEFINITION
// -------------------------------
const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String },

  // -------------------------------
  // STUDENT-SPECIFIC FIELDS
  // -------------------------------
  contactNO: { type: String, trim: true },
  paymentMethod: {
    type: String,
    enum: ["Cash", "bKash", "Rocket", "Credit Card", "Nagad", "Others"],
  },
  trxID: { type: String, trim: true },
  numberUsed: { type: String, trim: true },

  // Unified list of enrolled courses (covers both assigned and registered)
  courses: [
    {
      course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      title: { type: String },
    },
  ],

  status: {
    type: String,
    enum: ["active", "hold", "suspended"],
    default: "hold",
  },

  // -------------------------------
  // COMMON FIELDS
  // -------------------------------
  userType: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
  },
  joinedAt: { type: Date, default: Date.now },

  // Optional subscription system (if any)
  activeSubscription: {
    plan: { type: String, enum: ["1M", "2M", "3M", "6M"] },
    startDate: Date,
    expiryDate: Date,
    isActive: { type: Boolean, default: false },
  },

  quizzesAttended: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
  avatar: { type: String },
  lastLogin: { type: Date },

  // Login method (only controller-based login allowed)
  loginMethod: {
    type: String,
    enum: ["controller"], // Only support controller login
    default: "controller",
  },
});

// -------------------------------
// PASSWORD HASHING
// -------------------------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// -------------------------------
// PASSWORD VALIDATION
// -------------------------------
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// -------------------------------
// MODEL EXPORT
// -------------------------------
const User = mongoose.model("User", userSchema);
export default User;
