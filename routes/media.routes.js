import express from "express";
import {
  addMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
} from "../controllers/media.controller.js";

// 👇 IMPORT THE CLOUDINARY MIDDLEWARE HERE
// (Make sure this path points to where you saved your new middleware file)
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// RESTful routes
// We use 'upload.array("files")' which now points to Cloudinary storage
router.post("/", upload.array("files"), addMedia);
router.post("/upload", upload.array("files"), addMedia); // Backup route if needed

router.get("/", getAllMedia);
router.get("/:id", getMediaById);
router.put("/:id", updateMedia);
router.delete("/:id", deleteMedia);

export default router;