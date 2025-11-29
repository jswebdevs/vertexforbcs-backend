// backend/controllers/courses.controller.js

import Course from "../models/courses.model.js";
import Media from "../models/media.model.js"; 
import Quiz from "../models/quizzes.model.js"; // ✅ CORRECTED: Use 'Quiz' alias for the model

// --- HELPER: Handle File Upload & Create Media Document ---
const processFileUpload = async (file, folder = "courses") => {
  if (!file) return null;
  
  const url = `/uploads/${file.filename}`;
  const thumbUrl = `/uploads/${file.filename}`; 

  const newMedia = await Media.create({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    folder: folder,
    uploadDate: new Date(),
    url: url,
    thumbUrl: thumbUrl,
  });

  return newMedia._id; // Return the ObjectId
};


// --------------------------------------------------
// CREATE NEW COURSE
// --------------------------------------------------
export const createCourse = async (req, res) => {
  try {
    const {
      title, description, category, subCategory, level, tags, language,
      startDate, endDate, duration, status,
      "subscription.amount": subscriptionAmount, "subscription.billingCycle": billingCycle,
      "subscription.currency": currency, "subscription.trialPeriodDays": trialPeriodDays,
      "subscription.active": subscriptionActive,
      
      courseImageId, videoPreviewId, imageGalleryIds 
    } = req.body;

    // 1. Tags & Syllabus Parsing
    let tagsArr = [];
    if (tags) {
      try { tagsArr = Array.isArray(tags) ? tags : JSON.parse(tags); } catch { tagsArr = tags.split(",").map((t) => t.trim()).filter(Boolean); }
    }

    let syllabusArr = [];
    if (req.body.syllabus) {
      try { syllabusArr = JSON.parse(req.body.syllabus); } catch { syllabusArr = []; }
    }

    // 3. Handle Media (Priority: New File Upload > Library ID)
    let courseImage = null;
    if (req.files && req.files["courseImage"] && req.files["courseImage"][0]) {
      courseImage = await processFileUpload(req.files["courseImage"][0]);
    } else if (courseImageId) {
      courseImage = courseImageId; 
    }

    let videoPreview = null;
    if (req.files && req.files["videoPreview"] && req.files["videoPreview"][0]) {
      videoPreview = await processFileUpload(req.files["videoPreview"][0]);
    } else if (videoPreviewId) {
      videoPreview = videoPreviewId;
    }

    let imageGallery = [];
    if (imageGalleryIds) {
      const ids = Array.isArray(imageGalleryIds) ? imageGalleryIds : [imageGalleryIds];
      imageGallery = [...imageGallery, ...ids];
    }
    if (req.files && req.files["imageGallery"] && Array.isArray(req.files["imageGallery"])) {
      const uploadPromises = req.files["imageGallery"].map(file => processFileUpload(file));
      const newIds = await Promise.all(uploadPromises);
      imageGallery = [...imageGallery, ...newIds];
    }

    // 4. Subscription
    const subscription = {
      amount: parseFloat(subscriptionAmount),
      billingCycle: billingCycle || "monthly",
      currency: currency || "BDT",
      trialPeriodDays: trialPeriodDays || 0,
      active: subscriptionActive !== undefined ? subscriptionActive : true,
    };

    const courseData = {
      title, description, category, subCategory, level, language,
      startDate, endDate, duration,
      tags: tagsArr,
      courseImage, imageGallery, videoPreview, 
      syllabus: syllabusArr,
      subscription,
      status: status || "draft",
    };

    if (!title || !subscription.amount) {
      return res.status(400).json({ message: "Title and subscription.amount are required" });
    }

    const savedCourse = await new Course(courseData).save();
    
    res.status(201).json({ message: "Course created successfully", course: savedCourse });

  } catch (error) {
    console.error("[courses.controller] Create Error:", error);
    res.status(500).json({ message: "Server error creating course" });
  }
};


// --------------------------------------------------
// UPDATE COURSE
// --------------------------------------------------
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { 
        courseImageId, videoPreviewId, imageGalleryIds,
        ...otherFields 
    } = req.body;

    const updatedFields = { ...otherFields };

    // --- Media Update Logic ---

    // 1. Course Image
    if (req.files && req.files["courseImage"] && req.files["courseImage"][0]) {
      updatedFields.courseImage = await processFileUpload(req.files["courseImage"][0]);
    } else if (courseImageId !== undefined) {
      updatedFields.courseImage = courseImageId || null; 
    }

    // 2. Video Preview
    if (req.files && req.files["videoPreview"] && req.files["videoPreview"][0]) {
      updatedFields.videoPreview = await processFileUpload(req.files["videoPreview"][0]);
    } else if (videoPreviewId !== undefined) {
      updatedFields.videoPreview = videoPreviewId || null;
    }

    // 3. Gallery
    let newGallery = [];
    if (imageGalleryIds) {
        const ids = Array.isArray(imageGalleryIds) ? ids.filter(id => id && id !== '[]') : (imageGalleryIds !== '[]' ? [imageGalleryIds] : []);
        newGallery = [...newGallery, ...ids];
    }
    if (req.files && req.files["imageGallery"] && Array.isArray(req.files["imageGallery"])) {
       const uploadPromises = req.files["imageGallery"].map(f => processFileUpload(f));
       const newIds = await Promise.all(uploadPromises);
       newGallery = [...newGallery, ...newIds];
    }

    if (imageGalleryIds !== undefined || (req.files && req.files["imageGallery"])) {
        updatedFields.imageGallery = newGallery;
    }

    // --- Parsing Complex Fields ---
    if (updatedFields.tags) {
      try { updatedFields.tags = JSON.parse(updatedFields.tags); } catch { updatedFields.tags = updatedFields.tags.split(",").map((t) => t.trim()).filter(Boolean); }
    }
    if (updatedFields.syllabus) {
      try { updatedFields.syllabus = JSON.parse(updatedFields.syllabus); } catch { updatedFields.syllabus = []; }
    }
    
    // --- Nested Subscription ---
    if (req.body["subscription.amount"]) {
        updatedFields.subscription = {
            amount: req.body["subscription.amount"],
            billingCycle: req.body["subscription.billingCycle"],
            currency: req.body["subscription.currency"],
            active: true 
        };
        delete updatedFields["subscription.amount"];
        delete updatedFields["subscription.billingCycle"];
        delete updatedFields["subscription.currency"];
    }

    // Update and Populate result immediately
    const updatedCourse = await Course.findByIdAndUpdate(id, { $set: updatedFields }, { new: true })
        .populate("courseImage")
        .populate("videoPreview")
        .populate("imageGallery");
    
    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    console.error("[courses.controller] Update Error:", error);
    res.status(500).json({ message: "Server error updating course" });
  }
};


// --------------------------------------------------
// GET SINGLE COURSE BY ID (Populated)
// --------------------------------------------------
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("courseImage")   
      .populate("imageGallery")  
      .populate("videoPreview"); 

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json(course);
  } catch (error) {
    console.error("[courses.controller] Error fetching course:", error);
    res.status(500).json({ message: "Server error fetching course" });
  }
};


// --------------------------------------------------
// GET ALL COURSES
// --------------------------------------------------
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("courseImage")
      .sort({ createdAt: -1 });
      
    res.status(200).json(courses);
  } catch (error) {
    console.error("[courses.controller] Error fetching courses:", error);
    res.status(500).json({ message: "Server error fetching courses" });
  }
};

// --------------------------------------------------
// OTHER CONTROLLERS (Unchanged)
// --------------------------------------------------
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find and Delete the Course
    const deletedCourse = await Course.findByIdAndDelete(id);
    
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2. Delete Associated Quizzes
    // Note: Quiz is imported as 'Quiz', not 'quiz' (lowercase)
    const quizDeletionResult = await Quiz.deleteMany({ courseID: id });

    console.log(`[courses.controller] Course deleted: ${deletedCourse.title}`);
    console.log(`[courses.controller] Associated Quizzes deleted: ${quizDeletionResult.deletedCount}`);

    res.status(200).json({ 
      message: "Course and associated quizzes deleted successfully",
      deletedQuizzesCount: quizDeletionResult.deletedCount 
    });

  } catch (error) {
    console.error("[courses.controller] Error deleting course:", error);
    res.status(500).json({ message: "Server error deleting course" });
  }
};

export const enrollStudent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const alreadyEnrolled = course.enrolledStudents.some(
      (s) => s.studentId.toString() === studentId.toString()
    );
    if (alreadyEnrolled) return res.status(400).json({ message: "Student already enrolled" });

    const enrollment = { studentId, startDate: new Date() };
    course.enrolledStudents.push(enrollment);
    await course.save();

    res.status(200).json({ message: "Student enrolled successfully", course });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ message: "Server error enrolling student" });
  }
};

export const getEnrolledStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate(
      "enrolledStudents.studentId",
      "firstName lastName email"
    );
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.status(200).json(course.enrolledStudents);
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    res.status(500).json({ message: "Server error fetching enrolled students" });
  }
};