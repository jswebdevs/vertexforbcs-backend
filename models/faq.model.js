// faq.model.js

import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    // The question text
    question: {
      type: String,
      required: [true, "FAQ question is required."],
      trim: true,
      minlength: [5, "Question must be at least 5 characters."],
      maxlength: [500, "Question cannot exceed 500 characters."],
      unique: true // Ensures no duplicate questions
    },
    
    // The answer text
    answer: {
      type: String,
      required: [true, "FAQ answer is required."],
      trim: true,
      minlength: [10, "Answer must be at least 10 characters."],
    },
    
    // Optional field to categorize the FAQ (e.g., 'Shipping', 'Account')
    category: {
      type: String,
      trim: true,
      default: "General"
    },

    // A field to control visibility on the public frontend.
    // The controllers currently don't filter by this, but it's good practice
    // for future proofing.
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // An optional field to control the display order
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    // --- Collection Name Enforcement ---
    collection: 'faq' // ⬅️ This explicitly sets the collection name to 'faq'
  }
);

// Define the model using the schema
const Faq = mongoose.model("Faq", faqSchema);

export default Faq;