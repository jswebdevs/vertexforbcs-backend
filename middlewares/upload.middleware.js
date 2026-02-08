// backend/middlewares/upload.middleware.js

import multer from 'multer';
import path from 'path';

// Configure storage for avatar files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Make sure the 'uploads' directory exists in your project root
    cb(null, 'uploads/dp/'); 
  },
  filename: function (req, file, cb) {
    // Create a unique filename: user-ID-timestamp.extension
    const ext = path.extname(file.originalname);
    // Use the user ID from the token (req.user.id) for the filename prefix
    // For now, we use the ID from the URL param
    const userId = req.params.id;
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  }
});

// Configure Multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type to allow only images
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed."));
  }
});