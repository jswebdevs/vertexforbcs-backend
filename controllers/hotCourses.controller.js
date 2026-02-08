import Course from '../models/courses.model.js'; 

export const getHotCourses = async (req, res) => {
  try {
    const hotCourses = await Course.find({ 
        // regex: looks for 'hot' regardless of case (Hot, HOT, hot)
        // ^ and $ ensure it matches the full word, not just part of a word (like 'hotel')
        tags: { $regex: /^hot$/i } 
      })
      // FIX: Add populate to replace the image ID with the full media document
      .populate("courseImage") 
      // .select('title price thumbnail instructor tags') // Commented out to return ALL fields for now
      // .limit(10); // Removed limit as requested

    res.status(200).json({
      success: true,
      count: hotCourses.length,
      data: hotCourses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching hot courses'
    });
  }
};