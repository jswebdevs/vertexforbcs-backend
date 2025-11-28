import Course from "../models/courses.model.js";
import Media from "../models/media.model.js"; // ✅ Import Media to create docs on upload

// --- HELPER: Handle File Upload & Create Media Document ---
// If a file is uploaded via Multer, we must save it to the Media collection 
// first to get an _id, because the Course model now expects ObjectIds.
const processFileUpload = async (file, folder = "courses") => {
  if (!file) return null;
  
  // Create URL based on your static serve setup
  const url = `/uploads/${file.filename}`;
  const thumbUrl = `/uploads/${file.filename}`; // Or generate real thumb if needed

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
      "subscription.amount": subscriptionAmount,
      "subscription.billingCycle": billingCycle,
      "subscription.currency": currency,
      "subscription.trialPeriodDays": trialPeriodDays,
      "subscription.active": subscriptionActive,
      
      // IDs from frontend Media Library selection
      courseImageId, 
      videoPreviewId,
      imageGalleryIds 
    } = req.body;

    // 1. Handle Tags
    let tagsArr = [];
    if (tags) {
      try {
        tagsArr = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch {
        tagsArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    // 2. Handle Syllabus
    let syllabusArr = [];
    if (req.body.syllabus) {
      try {
        syllabusArr = JSON.parse(req.body.syllabus);
      } catch {
        syllabusArr = [];
      }
    }

    // 3. Handle Media (Priority: New File Upload > Library ID)
    
    // A. Course Image
    let courseImage = null;
    if (req.files && req.files["courseImage"] && req.files["courseImage"][0]) {
      // Create Media doc for new file
      courseImage = await processFileUpload(req.files["courseImage"][0]);
    } else if (courseImageId) {
      // Use existing ID
      courseImage = courseImageId; 
    }

    // B. Video Preview
    let videoPreview = null;
    if (req.files && req.files["videoPreview"] && req.files["videoPreview"][0]) {
       videoPreview = await processFileUpload(req.files["videoPreview"][0]);
    } else if (videoPreviewId) {
       videoPreview = videoPreviewId;
    }

    // C. Image Gallery
    let imageGallery = [];
    // Add existing library IDs
    if (imageGalleryIds) {
        const ids = Array.isArray(imageGalleryIds) ? imageGalleryIds : [imageGalleryIds];
        imageGallery = [...imageGallery, ...ids];
    }
    // Add new file uploads
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
      courseImage, 
      imageGallery, 
      videoPreview, 
      syllabus: syllabusArr,
      subscription,
      status: status || "draft",
    };

    if (!title || !subscription.amount) {
      return res.status(400).json({ message: "Title and subscription.amount are required" });
    }

    const savedCourse = await new Course(courseData).save();
    
    res.status(201).json({
      message: "Course created successfully",
      course: savedCourse,
    });

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
    
    // Destructure media IDs from body, keep rest
    const { 
        courseImageId, 
        videoPreviewId, 
        imageGalleryIds,
        ...otherFields 
    } = req.body;

    const updatedFields = { ...otherFields };

    // --- Media Update Logic ---

    // 1. Course Image
    if (req.files && req.files["courseImage"] && req.files["courseImage"][0]) {
      updatedFields.courseImage = await processFileUpload(req.files["courseImage"][0]);
    } else if (courseImageId !== undefined) {
      // If sent (even empty string), update it. 
      // If empty string -> null (removes image). If ID -> ID.
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
    // Existing IDs from library
    if (imageGalleryIds) {
        const ids = Array.isArray(imageGalleryIds) ? imageGalleryIds : [imageGalleryIds];
        // Filter out '[]' string edge case
        newGallery = ids.filter(id => id && id !== '[]');
        if(imageGalleryIds === '[]') newGallery = [];
    }
    // New Uploads
    if (req.files && req.files["imageGallery"] && Array.isArray(req.files["imageGallery"])) {
       const uploadPromises = req.files["imageGallery"].map(f => processFileUpload(f));
       const newIds = await Promise.all(uploadPromises);
       newGallery = [...newGallery, ...newIds];
    }

    // Only update gallery if inputs were provided
    if (imageGalleryIds !== undefined || (req.files && req.files["imageGallery"])) {
        updatedFields.imageGallery = newGallery;
    }

    // --- Parsing Complex Fields ---
    if (updatedFields.tags) {
      try {
        updatedFields.tags = JSON.parse(updatedFields.tags);
      } catch {
        updatedFields.tags = updatedFields.tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }
    if (updatedFields.syllabus) {
      try {
        updatedFields.syllabus = JSON.parse(updatedFields.syllabus);
      } catch {
        updatedFields.syllabus = [];
      }
    }
    
    // --- Nested Subscription ---
    if (req.body["subscription.amount"]) {
        updatedFields.subscription = {
            amount: req.body["subscription.amount"],
            billingCycle: req.body["subscription.billingCycle"],
            currency: req.body["subscription.currency"],
            active: true 
        };
        // Cleanup flat keys
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
      .populate("courseImage")   // ✅ Populate to get full object (url, etc)
      .populate("imageGallery")  // ✅ Populate array
      .populate("videoPreview"); // ✅ Populate video

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
      .populate("courseImage") // Optional: Populate to show thumbnails in list
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
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
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