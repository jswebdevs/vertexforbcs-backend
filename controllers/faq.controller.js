// faq.controller.js

import Faq from "../models/faq.model.js"; 

// ------------------------------------------------------------------
// 1. CREATE Faq
// Route: POST /api/faqs
// ------------------------------------------------------------------
export const createFaq = async (req, res) => {
  try {
    // Validation is handled by the Mongoose schema.
    const newFaq = new Faq(req.body);
    const savedFaq = await newFaq.save();
    res.status(201).json(savedFaq);
  } catch (error) {
    // Check for Mongoose validation errors or duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "A FAQ with this question already exists.", 
        error: error.message 
      });
    }
    res.status(500).json({ message: "Error creating FAQ", error: error.message });
  }
};

// ------------------------------------------------------------------
// 2. GET ALL Faqs (For Admin Dashboard)
// Route: GET /api/faqs
// ------------------------------------------------------------------
export const getAllFaqs = async (req, res) => {
  try {
    // Returns all documents, sorted by sortOrder ascending, then by creation date descending
    const faqs = await Faq.find().sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching FAQs", error: error.message });
  }
};

// ------------------------------------------------------------------
// 3. GET PUBLIC Faqs (For Website Frontend)
// Route: GET /api/faqs/public
// ------------------------------------------------------------------
export const getPublicFaqs = async (req, res) => {
  try {
    // Filters for active FAQs and sorts them for public display
    const faqs = await Faq.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 }); // Sort by defined order, then by oldest first
      
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public FAQs", error: error.message });
  }
};

// ------------------------------------------------------------------
// 4. GET SINGLE Faq
// Route: GET /api/faqs/:id
// ------------------------------------------------------------------
export const getFaqById = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    res.status(200).json(faq);
  } catch (error) {
    // Handles invalid MongoDB ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid FAQ ID format" });
    }
    res.status(500).json({ message: "Error fetching FAQ", error: error.message });
  }
};

// ------------------------------------------------------------------
// 5. UPDATE Faq
// Route: PUT /api/faqs/:id
// ------------------------------------------------------------------
export const updateFaq = async (req, res) => {
  try {
    const updatedFaq = await Faq.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } // Return the updated document and run Mongoose validation
    );
    
    if (!updatedFaq) return res.status(404).json({ message: "FAQ not found" });
    res.status(200).json(updatedFaq);
  } catch (error) {
    // Handles duplicate key errors (e.g., trying to change question to an existing one)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "A FAQ with this question already exists.", 
        error: error.message 
      });
    }
    // Handles invalid MongoDB ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid FAQ ID format" });
    }
    res.status(500).json({ message: "Error updating FAQ", error: error.message });
  }
};

// ------------------------------------------------------------------
// 6. DELETE Faq
// Route: DELETE /api/faqs/:id
// ------------------------------------------------------------------
export const deleteFaq = async (req, res) => {
  try {
    const deletedFaq = await Faq.findByIdAndDelete(req.params.id);
    if (!deletedFaq) return res.status(404).json({ message: "FAQ not found" });
    res.status(200).json({ message: "FAQ deleted successfully", data: deletedFaq });
  } catch (error) {
    // Handles invalid MongoDB ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid FAQ ID format" });
    }
    res.status(500).json({ message: "Error deleting FAQ", error: error.message });
  }
};