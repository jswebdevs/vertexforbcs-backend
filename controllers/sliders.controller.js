import Slider from "../models/sliders.model.js"; 

// ------------------------------------------------------------------
// 1. CREATE Slider
// Route: POST /api/sliders
// ------------------------------------------------------------------
export const createSlider = async (req, res) => {
  try {
    // Minimal: Directly save req.body. 
    // Validation is handled by the Mongoose schema.
    const newSlider = new Slider(req.body);
    const savedSlider = await newSlider.save();
    res.status(201).json(savedSlider);
  } catch (error) {
    res.status(500).json({ message: "Error creating slider", error: error.message });
  }
};

// ------------------------------------------------------------------
// 2. GET ALL Sliders (For Admin Dashboard)
// Route: GET /api/sliders
// ------------------------------------------------------------------
export const getAllSliders = async (req, res) => {
  try {
    // Returns all documents. 
    // If you need specific sorting later, you can add .sort({ _id: -1 })
    const sliders = await Slider.find();
    res.status(200).json(sliders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sliders", error: error.message });
  }
};

// ------------------------------------------------------------------
// 3. GET PUBLIC Sliders (For Website Frontend)
// Route: GET /api/sliders/public
// ------------------------------------------------------------------
export const getPublicSliders = async (req, res) => {
  try {
    // Minimal Model: Logic for 'isActive' and 'schedule' is removed.
    // This endpoint now behaves identically to getAllSliders but is kept 
    // separate to maintain API route structure for the frontend.
    const sliders = await Slider.find();
    res.status(200).json(sliders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public sliders", error: error.message });
  }
};

// ------------------------------------------------------------------
// 4. GET SINGLE Slider
// Route: GET /api/sliders/:id
// ------------------------------------------------------------------
export const getSliderById = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ message: "Slider not found" });
    res.status(200).json(slider);
  } catch (error) {
    res.status(500).json({ message: "Error fetching slider", error: error.message });
  }
};

// ------------------------------------------------------------------
// 5. UPDATE Slider
// Route: PUT /api/sliders/:id
// ------------------------------------------------------------------
export const updateSlider = async (req, res) => {
  try {
    const updatedSlider = await Slider.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } 
    );
    if (!updatedSlider) return res.status(404).json({ message: "Slider not found" });
    res.status(200).json(updatedSlider);
  } catch (error) {
    res.status(500).json({ message: "Error updating slider", error: error.message });
  }
};

// ------------------------------------------------------------------
// 6. DELETE Slider
// Route: DELETE /api/sliders/:id
// ------------------------------------------------------------------
export const deleteSlider = async (req, res) => {
  try {
    const deletedSlider = await Slider.findByIdAndDelete(req.params.id);
    if (!deletedSlider) return res.status(404).json({ message: "Slider not found" });
    res.status(200).json({ message: "Slider deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting slider", error: error.message });
  }
};