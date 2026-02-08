import Gallery from "../models/gallery.model.js";

// ------------------------------------------------------------------
// 1. CREATE Gallery Item
// Route: POST /api/gallery
// ------------------------------------------------------------------
export const createGallery = async (req, res) => {
  try {
    // Minimal: Directly save req.body.
    // Ensure frontend sends 'images' as an array of strings and 'tags' as an array.
    const newGallery = new Gallery(req.body);
    const savedGallery = await newGallery.save();
    res.status(201).json(savedGallery);
  } catch (error) {
    res.status(500).json({ message: "Error creating gallery item", error: error.message });
  }
};

// ------------------------------------------------------------------
// 2. GET ALL Gallery Items (For Admin Dashboard)
// Route: GET /api/gallery
// ------------------------------------------------------------------
export const getAllGallery = async (req, res) => {
  try {
    // Returns all documents. Sorted by date (newest first).
    const gallery = await Gallery.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(gallery);
  } catch (error) {
    res.status(500).json({ message: "Error fetching gallery items", error: error.message });
  }
};

// ------------------------------------------------------------------
// 3. GET PUBLIC Gallery Items (For Website Frontend)
// Route: GET /api/gallery/public
// ------------------------------------------------------------------
export const getPublicGallery = async (req, res) => {
  try {
    // Filters for 'Published' status as defined in your Schema.
    const gallery = await Gallery.find({ status: "Published" }).sort({ date: -1, createdAt: -1 });
    res.status(200).json(gallery);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public gallery items", error: error.message });
  }
};

// ------------------------------------------------------------------
// 4. GET SINGLE Gallery Item
// Route: GET /api/gallery/:id
// ------------------------------------------------------------------
export const getGalleryById = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) return res.status(404).json({ message: "Gallery item not found" });
    res.status(200).json(galleryItem);
  } catch (error) {
    res.status(500).json({ message: "Error fetching gallery item", error: error.message });
  }
};

// ------------------------------------------------------------------
// 5. UPDATE Gallery Item
// Route: PUT /api/gallery/:id
// ------------------------------------------------------------------
export const updateGallery = async (req, res) => {
  try {
    const updatedGallery = await Gallery.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedGallery) return res.status(404).json({ message: "Gallery item not found" });
    res.status(200).json(updatedGallery);
  } catch (error) {
    res.status(500).json({ message: "Error updating gallery item", error: error.message });
  }
};

// ------------------------------------------------------------------
// 6. DELETE Gallery Item
// Route: DELETE /api/gallery/:id
// ------------------------------------------------------------------
export const deleteGallery = async (req, res) => {
  try {
    const deletedGallery = await Gallery.findByIdAndDelete(req.params.id);
    if (!deletedGallery) return res.status(404).json({ message: "Gallery item not found" });
    res.status(200).json({ message: "Gallery item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting gallery item", error: error.message });
  }
};