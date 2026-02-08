import Pricing from '../models/pricing.model.js'; 

// ------------------------------------------------------------------
// 1. CREATE Pricing Plan
// Route: POST /api/pricing
// ------------------------------------------------------------------
export const createPlan = async (req, res) => {
  try {
    // Minimal: Directly save req.body. 
    // Validation is handled by the Mongoose schema.
    const newPlan = new Pricing(req.body);
    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    // Handle validation errors or duplicate key errors from MongoDB
    res.status(500).json({ message: "Error creating pricing plan", error: error.message });
  }
};

// ------------------------------------------------------------------
// 2. GET ALL Pricing Plans (For Frontend/Public Display)
// Route: GET /api/pricing
// ------------------------------------------------------------------
export const getAllPlans = async (req, res) => {
  try {
    // Returns all documents, sorted by price (ascending) as is common for pricing pages.
    const plans = await Pricing.find().sort({ price: 1 });
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pricing plans", error: error.message });
  }
};


// ------------------------------------------------------------------
// 3. GET SINGLE Pricing Plan
// Route: GET /api/pricing/:id
// ------------------------------------------------------------------
export const getPlanById = async (req, res) => {
  try {
    const plan = await Pricing.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Pricing plan not found" });
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pricing plan", error: error.message });
  }
};

// ------------------------------------------------------------------
// 4. UPDATE Pricing Plan
// Route: PUT /api/pricing/:id
// ------------------------------------------------------------------
export const updatePlan = async (req, res) => {
  try {
    const updatedPlan = await Pricing.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } // Return the updated document and run schema validation
    );
    if (!updatedPlan) return res.status(404).json({ message: "Pricing plan not found" });
    res.status(200).json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: "Error updating pricing plan", error: error.message });
  }
};

// ------------------------------------------------------------------
// 5. DELETE Pricing Plan
// Route: DELETE /api/pricing/:id
// ------------------------------------------------------------------
export const deletePlan = async (req, res) => {
  try {
    const deletedPlan = await Pricing.findByIdAndDelete(req.params.id);
    if (!deletedPlan) return res.status(404).json({ message: "Pricing plan not found" });
    res.status(200).json({ message: "Pricing plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting pricing plan", error: error.message });
  }
};