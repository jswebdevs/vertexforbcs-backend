// backend/controllers/users.controller.js

import User from "../models/users.model.js";
import Quiz from "../models/quizzes.model.js"; // ✅ Imported Quiz to fetch titles
import UserQuizRecord from "../models/userQuizRecord.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import multer from "multer"
import nodemailer from "nodemailer"
import OTP from "../models/otp.model.js"
import dotenv from "dotenv"


dotenv.config();
// --------------------
// HELPER: CALCULATE EXPIRY DATE
// --------------------
const calculateExpiryDate = (plan) => {
  const now = new Date();
  switch (plan) {
    case "1M":
      return new Date(now.setDate(now.getDate() + 30));
    case "2M":
      return new Date(now.setDate(now.getDate() + 60));
    case "3M":
      return new Date(now.setDate(now.getDate() + 90));
    case "6M":
      return new Date(now.setDate(now.getDate() + 180));
    case "Lifetime":
      return new Date(now.setFullYear(now.getFullYear() + 100));
    default:
      return new Date(now.setDate(now.getDate() + 30));
  }
};



// --------------------
// STUDENT REGISTRATION CONTROLLER
// --------------------
export const registerStudent = async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, contactNO, paymentMethod, trxID, numberUsed, courses,
    } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingStudent = await User.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already registered" });
    }

    let processedCourses = [];
    if (courses && Array.isArray(courses)) {
      processedCourses = courses.map((c) => {
        const plan = c.plan || "1M";
        return {
          courseId: c.courseId,
          title: c.title || "",
          plan: plan,
          startDate: new Date(),
          expiryDate: calculateExpiryDate(plan),
          isActive: true,
        };
      });
    }

    const newStudent = await User.create({
      firstName, lastName, email: normalizedEmail, password, contactNO, paymentMethod, trxID, numberUsed,
      courses: processedCourses,
      userType: "student",
      status: "active",
      loginMethod: "controller",
    });

    res.status(201).json({
      message: "Student registered successfully.",
      student: newStudent,
    });
  } catch (err) {
    console.error("[registerStudent] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// SIGNUP CONTROLLER
// --------------------
export const controllerSignup = async (req, res) => {
  const { username, password, email, firstName, lastName, userType = "student" } = req.body;

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
      return res.status(401).json({ message: "User not found" });
    }

    if (user.loginMethod !== "controller") {
      return res.status(401).json({ message: "Use the correct login method" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error("[controllerLogin] Unexpected error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// CRUD OPERATIONS
// --------------------

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ userType: "student" })
      .select("-password -quizzesAttended.details")
      .sort({ joinedAt: -1 })
      .lean();

    const formattedUsers = users.map((user) => ({
      ...user,
      courses: user.courses?.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        plan: course.plan,
        expiryDate: course.expiryDate,
      })) || [],
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error("[getUsers] Error:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

export const getUser = async (req, res) => {
  try {
    // Exclude the 'details' field from the quizzesAttended array to keep response light
    const user = await User.findById(req.params.id)
        .select("-password -quizzesAttended.details"); 

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[getUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Separate password from the rest of the data
    const { password, ...updateData } = req.body;

    // IF a password is provided, hash it and add it to updateData
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    // Update user using the modified updateData
    const user = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("[updateUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("[deleteUser] Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkUsernameOrEmail = async (req, res) => {
  try {
    const { value } = req.params;
    const normalized = value.trim().toLowerCase();
    const existing = await User.findOne({
      $or: [{ username: normalized }, { email: normalized }],
    });

    if (existing) {
      return res.json({ available: false, message: "Username or email is already registered" });
    }
    res.json({ available: true, message: "Available" });
  } catch (err) {
    console.error("[checkUsernameOrEmail] Error:", err);
    res.status(500).json({ available: false, message: "Server error" });
  }
};

// --------------------
// LEGACY / UTILITY ROUTES (If still used by frontend)
// --------------------

export const newEnrollRequest = async (req, res) => {
  // This logic is now largely handled by enrollment.controller.js, 
  // but kept here if legacy routes still point to it.
  const studentId = req.params.id;
  const { trxID, numberUsed, paymentMethod } = req.body;

  try {
    await User.findByIdAndUpdate(studentId, {
      paymentMethod: paymentMethod || "Mobile Banking",
      trxID: trxID,
      numberUsed: numberUsed,
    });
    return res.status(200).json({ message: "Payment info updated." });
  } catch (err) {
    console.error("[newEnrollRequest] Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

export const getEnrollmentRequest = async (req, res) => {
    // Placeholder for legacy support
    res.status(200).json({ message: "Use /api/enrollments/ for requests." });
};

// --------------------------------------------------
// NEW: SAVE QUIZ RESULT
// Maps to: POST /api/users/:studentId/:quizId
// --------------------------------------------------
export const saveQuizResult = async (req, res) => {
  const { studentId, quizId } = req.params;
  const { score, rightAnswers, wrongAnswers, totalAnswered, answers } = req.body;

  // --- 1. ATOMIC DUPLICATE CHECK & INITIAL VALIDATIONS ---
  try {
    // Check if already attended using the dedicated record model
    const alreadyAttended = await UserQuizRecord.findOne({ userId: studentId, quizId: quizId });
    
    if (alreadyAttended) {
        // FIX: Use HTTP 409 Conflict for resource already existing
        console.log(`[saveQuizResult] Duplicate submission blocked for User ${studentId} on Quiz ${quizId}`);
        return res.status(409).json({ message: "Quiz already attempted. Duplicate submission blocked." });
    }

    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // --- 2. Create Full Detailed Record in UserQuizRecord (The "Heavy" Data) ---
    const finishedAtTime = new Date();

    const detailedRecord = await UserQuizRecord.create({
        userId: studentId,
        quizId: quizId,
        courseId: quiz.courseID, 
        score: parseFloat(score),
        totalAnswered: parseInt(totalAnswered) || 0,
        rightAnswers: parseInt(rightAnswers) || 0,
        wrongAnswers: parseInt(wrongAnswers) || 0,
        answers: answers, // Full Q&A details
        finishedAt: finishedAtTime
    });

    // --- 3. Create Summary Object for User Profile (The "Light" Data) ---
    const summaryResult = {
      quizId: quiz._id,
      quizTitle: quiz.quizTitle,
      score: parseFloat(score),
      totalAnswered: parseInt(totalAnswered) || 0,
      rightAnswers: parseInt(rightAnswers) || 0,
      wrongAnswers: parseInt(wrongAnswers) || 0,
      submittedAt: finishedAtTime
    };

    // --- 4. Atomic Update User Profile ---
    // FIX: Use findByIdAndUpdate with $push for atomic array update.
    // This is generally safer than fetching, modifying, and saving (user.save()) 
    // when dealing with array pushes in concurrent environments.
    const updatedUser = await User.findByIdAndUpdate(
        studentId,
        { $push: { quizzesAttended: summaryResult } },
        { new: true } // Return the updated document
    );

    if (!updatedUser) {
        // If user was found earlier but somehow failed to update
        throw new Error("Failed to atomically update user profile.");
    }

    console.log(`[saveQuizResult] Saved result for ${user.username}`);
    res.status(200).json({ message: "Quiz result saved successfully", result: summaryResult });

  } catch (err) {
    console.error("[saveQuizResult] Error:", err);
    // Handle potential database errors (like unique index violation if you add one)
    res.status(500).json({ message: "Server error saving quiz result" });
  }
};


export const getStudentQuizResult = async (req, res) => {
  const { studentId, quizId } = req.params;

  try {
    // STRATEGY 1: Check the new 'UserQuizRecord' collection (The separate model)
    let record = await UserQuizRecord.findOne({ userId: studentId, quizId: quizId });

    // STRATEGY 2: Fallback to 'User' collection (Legacy embedded data)
    if (!record) {
      console.log("Record not found in UserQuizRecord, checking User profile...");
      
      // Find the user and specifically pull the quizzesAttended array
      const user = await User.findById(studentId).select("quizzesAttended");
      
      if (user && user.quizzesAttended) {
        // Find the specific quiz in the array
        const embeddedRecord = user.quizzesAttended.find(
          (q) => q.quizId.toString() === quizId
        );
        
        // If found, map it to look like a standard record
        if (embeddedRecord) {
            record = {
                // Spread existing data
                ...embeddedRecord.toObject(), 
                // Ensure compatibility fields
                userId: studentId,
                answers: embeddedRecord.details || [] // Map 'details' to 'answers' if needed
            };
        }
      }
    }

    if (!record) {
      return res.status(404).json({ message: "Detailed quiz record not found." });
    }

    res.status(200).json(record);

  } catch (err) {
    console.error("[getStudentQuizResult] Error:", err);
    res.status(500).json({ message: "Server error fetching quiz result" });
  }
};

export const updateAvatar = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Multer puts the local file path on req.file.path
        const localPath = req.file?.path; 
        
        if (!localPath) {
            return res.status(400).json({ message: "No avatar file provided or invalid file type." });
        }
        
        // --- IMPORTANT: Convert path to public URL ---
        // path.basename is now defined because you imported 'path'
        const avatarUrl = `https://backend.vertexforbcs.org/uploads/dp/${path.basename(localPath)}`; 
        
        // ... (User finding and security checks)
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });


        // Update the avatar field
        user.avatar = avatarUrl;
        await user.save();

        res.status(200).json({ 
            message: "Avatar updated successfully.", 
            avatarUrl: user.avatar,
            user: { _id: user._id, avatar: user.avatar, email: user.email } 
        });
    } catch (err) {
        console.error("[updateAvatar] Error:", err.message);
        
        // Catch Multer errors here, now that 'multer' is defined
        if (err instanceof multer.MulterError) { // <-- FIX 3: 'multer' is now defined
             return res.status(400).json({ message: `File Upload Error: ${err.message}` });
        }
        // Catch other errors, including potential errors from disk writing
        if (err.code === 'ENOENT') {
            return res.status(500).json({ message: "Server error: Target upload folder does not exist." });
        }
        res.status(500).json({ message: "Server error updating avatar." });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const userId = req.params.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required." });
        }
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        // 1. Check if the current password is correct
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid current password." });
        }

        // 2. Hash the new password and save (pre-save hook handles hashing)
        user.password = newPassword; 
        await user.save(); // The pre-save hook in userSchema will hash this new password

        res.status(200).json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("[updatePassword] Error:", err);
        res.status(500).json({ message: "Server error updating password." });
    }
};


// --- Configuration ---

// 1. Configure Transporter for Custom Domain (Webuzo/cPanale)

const transporter = nodemailer.createTransport({
  host: "mail.vertexforbcs.org",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_MAIL, // Ensure .env matches this name
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  authMethod: 'LOGIN' // Critical fix for your cPanel server
});

const generateEmailTemplate = (otpCode) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="color: #4CAF50; margin: 0;">Vertex for BCS</h2>
        <p style="color: #666; font-size: 14px; margin-top: 5px;">Your Success Partner</p>
      </div>
      <p style="color: #333; font-size: 16px;">Hello,</p>
      <p style="color: #555; line-height: 1.5;">We received a request to reset your password. Use the OTP below:</p>
      <div style="background-color: #f9f9f9; border: 1px dashed #4CAF50; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; border-radius: 5px;">
        ${otpCode}
      </div>
      <p style="color: #555;">Valid for <strong>5 minutes</strong>.</p>
    </div>
  `;
};

// --- Controllers ---

// A. Send Forgot Password OTP
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert OTP (Update if exists, Insert if new)
    await OTP.findOneAndUpdate(
      { email },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await transporter.sendMail({
      from: `"Vertex Support" <${process.env.SMTP_MAIL}>`,
      to: email,
      subject: "Action Required: Your Password Reset OTP",
      text: `Your OTP is ${otpCode}`,
      html: generateEmailTemplate(otpCode),
    });

    res.status(200).json({ message: "OTP sent successfully. Please check your email." });

  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP." });
  }
};

// C. Verify OTP (Step 2)
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check if OTP exists for this email
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Success - just return 200 so frontend can move to Step 3
    res.status(200).json({ message: "OTP verified." });

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Verification failed." });
  }
};

// B. Reset Password with OTP
export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update User
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    // Delete used OTP
    await OTP.deleteOne({ email });

    res.status(200).json({ message: "Password reset successfully. Please login." });

  } catch (error) {
    console.error("Reset Error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
};