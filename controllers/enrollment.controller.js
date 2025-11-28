// backend/controllers/enrollment.controller.js

import User from "../models/users.model.js";
import EnrollmentRequest from "../models/enrollmentRequest.model.js";

// --------------------------------------------------
// HELPER: Calculate Expiry Date
// --------------------------------------------------
// Accepts optional startDate to allow extending from current expiry
const calculateExpiryDate = (plan, startDate = new Date()) => {
  // Clone date to avoid mutation
  const date = new Date(startDate);
  
  switch (plan) {
    case "1M":
      date.setMonth(date.getMonth() + 1);
      break;
    case "2M":
      date.setMonth(date.getMonth() + 2);
      break;
    case "3M":
      date.setMonth(date.getMonth() + 3);
      break;
    case "6M":
      date.setMonth(date.getMonth() + 6);
      break;
    case "Lifetime":
      date.setFullYear(date.getFullYear() + 100);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date;
};


// --------------------------------------------------
// 1. CREATE: New Enrollment OR Renewal Request
// Maps to: POST /api/enrollments/request
// --------------------------------------------------
export const createEnrollmentRequest = async (req, res) => {
  const { 
    studentId, courseId, courseTitle, plan, trxID, numberUsed, amount, paymentMethod, isRenewal 
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
    
    // B. Check Enrollment Status
    const isEnrolled = student.courses.some(
        c => c.courseId.toString() === courseId && c.isActive
    );

    // ✅ LOGIC FIX: Only block duplicate if it is NOT a renewal
    if (isEnrolled && !isRenewal) {
        return res.status(400).json({ 
            message: `Already actively enrolled in ${courseTitle}. Go to 'My Courses' to renew/extend.` 
        });
    }

    // C. Create Request (Save isRenewal flag)
    const newRequest = await EnrollmentRequest.create({
      studentId,
      courseId,
      courseTitle,
      plan,
      amount,
      trxID,
      numberUsed,
      paymentMethod: paymentMethod || "Mobile Banking",
      status: 'PENDING',
      isRenewal: isRenewal || false 
    });

    return res.status(201).json({
      message: "Request submitted successfully. Awaiting admin verification.",
      enrollmentRequest: newRequest
    });

  } catch (err) {
    console.error("[createEnrollmentRequest] Error:", err);
    res.status(500).json({ message: "Server error during enrollment request." });
  }
};


// --------------------------------------------------
// 2. READ: Get All Requests (Admin View)
// --------------------------------------------------
export const getAllEnrollmentRequests = async (req, res) => {
  try {
    const requests = await EnrollmentRequest.find({})
      .populate("studentId", "firstName lastName email contactNO")
      .sort({ requestDate: -1 });

    return res.status(200).json(requests);
  } catch (err) {
    console.error("[getAllEnrollmentRequests] Error:", err);
    res.status(500).json({ message: "Server error fetching enrollment requests." });
  }
};


// --------------------------------------------------
// 3. READ: Get Single Request
// --------------------------------------------------
export const getSingleEnrollmentRequest = async (req, res) => {
  try {
    const request = await EnrollmentRequest.findById(req.params.id)
      .populate("studentId", "firstName lastName email contactNO");

    if (!request) return res.status(404).json({ message: "Request not found." });
    return res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching request." });
  }
};


// --------------------------------------------------
// 4. VERIFY: Approve Payment (Handles New & Renewal)
// Maps to: PUT /api/enrollments/:id/verify
// --------------------------------------------------
export const verifyAndEnrollStudent = async (req, res) => {
  const requestId = req.params.id;

  try {
    // A. Find Request
    const request = await EnrollmentRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.status === 'VERIFIED') return res.status(400).json({ message: "Already verified." });

    // B. Find User
    const student = await User.findById(request.studentId);
    if (!student) return res.status(404).json({ message: "Student not found." });

    // C. Handle Logic based on isRenewal
    if (request.isRenewal) {
        // --- RENEWAL LOGIC ---
        const courseIndex = student.courses.findIndex(
            c => c.courseId.toString() === request.courseId.toString()
        );

        if (courseIndex > -1) {
            // 1. Determine where to start the new plan from
            const currentExpiry = new Date(student.courses[courseIndex].expiryDate);
            const now = new Date();
            // If currently active, add time to existing expiry. If expired, start from now.
            const baseDate = currentExpiry > now ? currentExpiry : now;

            // 2. Calculate new expiry
            const newExpiryDate = calculateExpiryDate(request.plan, baseDate);

            // 3. Update Course Record
            student.courses[courseIndex].expiryDate = newExpiryDate;
            student.courses[courseIndex].plan = request.plan;
            student.courses[courseIndex].isActive = true; // Reactivate if it was expired
        } else {
            // Fallback: If they clicked renew but course wasn't found (rare), add as new
            const startDate = new Date();
            const expiryDate = calculateExpiryDate(request.plan, startDate);
            student.courses.push({
                courseId: request.courseId,
                title: request.courseTitle,
                plan: request.plan,
                startDate: startDate,
                expiryDate: expiryDate,
                isActive: true,
            });
        }
    } else {
        // --- NEW ENROLLMENT LOGIC ---
        // Check duplicate just in case
        const existingIndex = student.courses.findIndex(c => c.courseId.toString() === request.courseId.toString());
        
        if (existingIndex > -1) {
            // User is already enrolled. We extend subscription.
             const currentExpiry = new Date(student.courses[existingIndex].expiryDate);
             const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
             student.courses[existingIndex].expiryDate = calculateExpiryDate(request.plan, baseDate);
             student.courses[existingIndex].isActive = true;
        } else {
            // Push new course
            const startDate = new Date();
            const expiryDate = calculateExpiryDate(request.plan, startDate);
            student.courses.push({
                courseId: request.courseId,
                title: request.courseTitle,
                plan: request.plan,
                startDate: startDate,
                expiryDate: expiryDate,
                isActive: true,
            });
        }
    }

    // D. Update Payment Info
    // FIX: Handle "Mobile Banking" if not in User enum
    const validMethods = ["Cash", "bKash", "Rocket", "Credit Card", "Nagad", "Others"];
    // If request method isn't in valid list, default to 'Others'
    student.paymentMethod = validMethods.includes(request.paymentMethod) ? request.paymentMethod : "Others";
    
    student.trxID = request.trxID;
    student.numberUsed = request.numberUsed;
    student.status = 'active'; 

    await student.save(); 

    // E. Update Request
    request.status = 'VERIFIED';
    request.verificationDate = new Date();
    await request.save();
    
    // F. Return Result (Safe Object)
    const userObject = student.toObject(); 
    delete userObject.password;

    return res.status(200).json({
      message: request.isRenewal ? "Subscription renewed successfully." : "Student enrolled successfully.",
      updatedUser: userObject,
      request: request,
    });

  } catch (err) {
    console.error("[verifyAndEnrollStudent] Error:", err);
    if (err.name === 'ValidationError') {
        const field = Object.keys(err.errors)[0];
        return res.status(400).json({ message: `Validation Error: ${err.errors[field].message}` });
    }
    res.status(500).json({ message: "Server error during verification." });
  }
};


// --------------------------------------------------
// 5. DELETE: Reject Request
// --------------------------------------------------
export const rejectEnrollmentRequest = async (req, res) => {
  try {
    const result = await EnrollmentRequest.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Request not found." });
    return res.status(200).json({ message: "Request rejected and deleted." });
  } catch (err) {
    console.error("[rejectEnrollmentRequest] Error:", err);
    res.status(500).json({ message: "Server error deleting request." });
  }
};