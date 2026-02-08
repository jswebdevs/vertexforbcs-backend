import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary (Get these from your Dashboard)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vertex-uploads', // The folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'pdf'],
    resource_type: 'auto', // Auto-detects image vs video
  },
});

export const upload = multer({ storage });