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
  
  // Payment info for the *latest* transaction (optional, for history use a separate Transaction model)
  paymentMethod: {
    type: String,
    enum: ["Cash", "bKash", "Rocket", "Credit Card", "Nagad", "Others", "Mobile Banking"],
  },
  trxID: { type: String, trim: true },
  numberUsed: { type: String, trim: true },

  // -------------------------------
  // PER-COURSE SUBSCRIPTIONS (Modified)
  // -------------------------------
  // This replaces the old 'activeSubscription' and simple 'courses' list.
  // Each object here represents a specific access right to a specific course.
  courses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
      title: { type: String }, // Optional snapshot of title
      
      // Which plan did they buy for THIS specific course?
      plan: { 
        type: String, 
        enum: ["1M", "2M", "3M", "6M", "Lifetime"],
        required: true 
      }, 
      
      // When does access to THIS course start and end?
      startDate: { type: Date, default: Date.now },
      expiryDate: { type: Date, required: true }, 
      
      isActive: { type: Boolean, default: true }
    },
  ],

  status: {
    type: String,
    enum: ["active", "hold", "suspended", "banned"],
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

  // REMOVED: activeSubscription (Global subscription is no longer needed)
  
  quizzesAttended: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
  avatar: { type: String },
  lastLogin: { type: Date },

  loginMethod: {
    type: String,
    enum: ["controller"], 
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
// HELPER METHOD: CHECK COURSE ACCESS
// -------------------------------
// Use this in your controllers/middleware to check if a user can view a course
userSchema.methods.hasActiveCourse = function (courseIdToCheck) {
  const course = this.courses.find(
    (c) => c.courseId.toString() === courseIdToCheck.toString()
  );

  if (!course) return false; // Not enrolled

  // Check if today is before the expiry date
  const now = new Date();
  return course.isActive && course.expiryDate > now;
};

// -------------------------------
// MODEL EXPORT
// -------------------------------
const User = mongoose.model("User", userSchema);
export default User;