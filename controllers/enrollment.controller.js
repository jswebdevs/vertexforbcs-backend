// backend/controllers/enrollment.controller.js

import User from "../models/users.model.js";
import EnrollmentRequest from "../models/enrollmentRequest.model.js";
// Assuming you have a Course model to fetch the course title if needed, but not strictly required here.
// import Course from "../models/course.model.js"; 


// --------------------------------------------------
// HELPER: Calculate Expiry Date (Needed for enrollment approval)
// --------------------------------------------------
const calculateExpiryDate = (plan) => {
  const now = new Date();
  switch (plan) {
    case "1M":
      now.setMonth(now.getMonth() + 1);
      break;
    case "2M":
      now.setMonth(now.getMonth() + 2);
      break;
    case "3M":
      now.setMonth(now.getMonth() + 3);
      break;
    case "6M":
      now.setMonth(now.getMonth() + 6);
      break;
    case "Lifetime":
      now.setFullYear(now.getFullYear() + 100);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
      break;
  }
  return now;
};


// --------------------------------------------------
// 1. CREATE: New Enrollment Request (Student Submission)
// Maps to: POST /api/enrollments/request
// --------------------------------------------------
export const createEnrollmentRequest = async (req, res) => {
  const { 
    studentId, courseId, courseTitle, plan, trxID, numberUsed, amount, paymentMethod
  } = req.body;

  try {
    if (!studentId || !courseId || !trxID || !plan || !amount) {
      return res.status(400).json({ message: "Missing required enrollment fields." });
    }

    // A. Check if the student exists
    const student = await User.findById(studentId).select("courses");
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    
    // B. Check if student is ALREADY actively enrolled
    const isEnrolled = student.courses.some(
        c => c.courseId.toString() === courseId && c.isActive
    );
    if (isEnrolled) {
        return res.status(400).json({ message: `Already actively enrolled in ${courseTitle}.` });
    }

    // C. Create the new Enrollment Request document (PENDING)
    const newRequest = await EnrollmentRequest.create({
      studentId: studentId,
      courseId: courseId,
      courseTitle: courseTitle,
      plan: plan,
      amount: amount,
      trxID: trxID,
      numberUsed: numberUsed,
      paymentMethod: paymentMethod || "Mobile Banking",
      status: 'PENDING'
    });

    return res.status(201).json({
      message: "Enrollment request submitted successfully. Awaiting admin verification.",
      enrollmentRequest: newRequest
    });

  } catch (err) {
    console.error("[createEnrollmentRequest] Error:", err);
    res.status(500).json({ message: "Server error during enrollment request." });
  }
};


// --------------------------------------------------
// 2. READ: Get All Requests (Admin View)
// Maps to: GET /api/enrollments 
// --------------------------------------------------
export const getAllEnrollmentRequests = async (req, res) => {
  try {
    const requests = await EnrollmentRequest.find({})
      .populate("studentId", "firstName lastName email contactNO") // Get student details
      .sort({ requestDate: -1 }); // Newest first

    return res.status(200).json(requests);
  } catch (err) {
    console.error("[getAllEnrollmentRequests] Error:", err);
    res.status(500).json({ message: "Server error fetching enrollment requests." });
  }
};


// --------------------------------------------------
// 3. READ: Get Single Request
// Maps to: GET /api/enrollments/:id
// --------------------------------------------------
export const getSingleEnrollmentRequest = async (req, res) => {
  const requestId = req.params.id;
  try {
    const request = await EnrollmentRequest.findById(requestId)
      .populate("studentId", "firstName lastName email contactNO");

    if (!request) {
      return res.status(404).json({ message: "Enrollment request not found." });
    }
    return res.status(200).json(request);
  } catch (err) {
    console.error("[getSingleEnrollmentRequest] Error:", err);
    res.status(500).json({ message: "Server error fetching request." });
  }
};


// --------------------------------------------------
// 4. UPDATE/VERIFY: Approve Payment & Enroll Student (Admin Action)
// Maps to: PUT /api/enrollments/:id/verify
// --------------------------------------------------
export const verifyAndEnrollStudent = async (req, res) => {
  const requestId = req.params.id;

  try {
    // A. Find the request
    const request = await EnrollmentRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }
    if (request.status === 'VERIFIED') {
      return res.status(400).json({ message: "This request has already been verified." });
    }

    // B. Find the user
    const student = await User.findById(request.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student linked to this request not found." });
    }

    // C. Calculate Expiry Date
    const startDate = new Date();
    const expiryDate = calculateExpiryDate(request.plan);
    
    // D. Update User's Courses Array (The Enrollment)
    const newCourseEntry = {
      courseId: request.courseId,
      title: request.courseTitle,
      plan: request.plan,
      startDate: startDate,
      expiryDate: expiryDate,
      isActive: true,
    };
    
    student.courses.push(newCourseEntry);

    // E. Update User's latest payment fields (Ensure paymentMethod matches schema enum!)
    student.paymentMethod = request.paymentMethod;
    student.trxID = request.trxID;
    student.numberUsed = request.numberUsed;
    student.status = 'active'; // Ensure student is active upon verification

    await student.save(); // Save User document to commit enrollment (may throw ValidationError)

    // F. Update Request Status to VERIFIED
    request.status = 'VERIFIED';
    request.verificationDate = new Date();
    await request.save();
    
    // G. FIX: Convert the Mongoose document to a plain object and hide password
    const userObject = student.toObject(); 
    delete userObject.password;

    return res.status(200).json({
      message: `Enrollment for ${request.courseTitle} approved. Student is now active.`,
      updatedUser: userObject, // Use the clean object
      request: request,
    });

  } catch (err) {
    console.error("[verifyAndEnrollStudent] Error:", err);
    
    // Check for Mongoose Validation Errors (e.g., enum mismatch)
    if (err.name === 'ValidationError') {
        const field = Object.keys(err.errors)[0];
        return res.status(400).json({ 
            message: `Enrollment failed: Validation error on field '${field}'. ${err.errors[field].message}` 
        });
    }
    res.status(500).json({ message: "Server error during verification and enrollment." });
  }
};


// --------------------------------------------------
// 5. DELETE: Reject/Delete Request (Admin Action)
// Maps to: DELETE /api/enrollments/:id
// --------------------------------------------------
export const rejectEnrollmentRequest = async (req, res) => {
  const requestId = req.params.id;

  try {
    const result = await EnrollmentRequest.findByIdAndDelete(requestId);

    if (!result) {
      return res.status(404).json({ message: "Enrollment request not found." });
    }

    return res.status(200).json({ message: "Enrollment request rejected and deleted successfully." });
  } catch (err) {
    console.error("[rejectEnrollmentRequest] Error:", err);
    res.status(500).json({ message: "Server error deleting request." });
  }
};