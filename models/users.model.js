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

  // Payment info for the *latest* transaction
  paymentMethod: {
    type: String,
    enum: ["Cash", "bKash", "Rocket", "Credit Card", "Nagad", "Others", "Mobile Banking"],
  },
  trxID: { type: String, trim: true },
  numberUsed: { type: String, trim: true },

  // -------------------------------
  // COURSE SUBSCRIPTIONS
  // -------------------------------
  courses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
      title: { type: String },
      plan: {
        type: String,
        enum: ["1M", "2M", "3M", "6M", "Lifetime"],
        required: true,
      },
      startDate: { type: Date, default: Date.now },
      expiryDate: { type: Date, required: true },
      isActive: { type: Boolean, default: true },
    },
  ],

  // -------------------------------
  // QUIZ RESULTS & HISTORY (Updated)
  // -------------------------------
  quizzesAttended: [
    {
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
      quizTitle: { type: String }, // Snapshot of title for easy display
      score: { type: Number, required: true },
      totalAnswered: { type: Number, default: 0 },
      rightAnswers: { type: Number, default: 0 },
      wrongAnswers: { type: Number, default: 0 },
      submittedAt: { type: Date, default: Date.now },
      
      // Detailed breakdown of answers (for review)
      details: [
        {
          questionId: { type: String }, 
          serialNo: { type: Number },
          answer: { type: String } // Option selected (A, B, C, D)
        }
      ]
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
userSchema.methods.hasActiveCourse = function (courseIdToCheck) {
  const course = this.courses.find(
    (c) => c.courseId.toString() === courseIdToCheck.toString()
  );

  if (!course) return false; 

  const now = new Date();
  return course.isActive && course.expiryDate > now;
};

const User = mongoose.model("User", userSchema);
export default User;