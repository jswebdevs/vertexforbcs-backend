import express from 'express';
import { getSpecialCourses } from '../controllers/specialCoruses.controller.js'; // Import the new controller

const router = express.Router();

router.get('/', getSpecialCourses);

export default router;