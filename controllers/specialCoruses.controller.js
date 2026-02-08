import Course from '../models/courses.model.js';

export const getSpecialCourses = async (req, res) => {
  try {
    const specialCourses = await Course.find({
      // Uses Regex to find 'special', 'Special', or 'SPECIAL' in the tags array
      tags: { $regex: /^special$/i }
    })
      // FIX: Add populate to retrieve the full courseImage document
      .populate("courseImage");

    res.status(200).json({
      success: true,
      count: specialCourses.length,
      data: specialCourses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching special courses'
    });
  }
};