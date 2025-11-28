// backend/models/enrollmentRequest.model.js

import mongoose from "mongoose";

const enrollmentRequestSchema = new mongoose.Schema({
  // Link to the student who made the request
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  // Details of the course requested
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true 
  },
  courseTitle: { type: String, required: true },

  // Payment and plan details from the cart
  plan: { 
    type: String, 
    enum: ["1M", "2M", "3M", "6M", "Lifetime"],
    required: true 
  },
  amount: { type: Number, required: true },
  trxID: { type: String, required: true, trim: true },
  numberUsed: { type: String, trim: true },
  paymentMethod: { type: String, default: "Mobile Banking" },
  
  // Status for Admin Review
  status: {
    type: String,
    enum: ["PENDING", "VERIFIED", "REJECTED"],
    default: "PENDING",
  },
  
  // ✅ NEW FIELD: Tracks if this is a renewal request
  isRenewal: { type: Boolean, default: false },

  // Dates
  requestDate: { type: Date, default: Date.now },
  verificationDate: { type: Date },
});

const EnrollmentRequest = mongoose.model("EnrollmentRequest", enrollmentRequestSchema);
export default EnrollmentRequest;