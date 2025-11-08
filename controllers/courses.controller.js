// backend/controllers/courses.controller.js

import Course from "../models/courses.model.js";

// --------------------------------------------------
// CREATE NEW COURSE  (Admin only, with multer)
// --------------------------------------------------
export const createCourse = async (req, res) => {
  console.log("POST BODY:", req.body);
  if (req.files) console.log("POST FILES:", req.files);

  try {
    // Multer parses dot-notation ("subscription.amount") into req.body['subscription.amount']
    // Manually construct the data object
    const {
      title,
      description,
      category,
      subCategory,
      level,
      tags,
      language,
      startDate,
      endDate,
      duration,
      videoPreview,
      status,
      "subscription.amount": subscriptionAmount,
      "subscription.billingCycle": billingCycle,
      "subscription.currency": currency,
      "subscription.trialPeriodDays": trialPeriodDays,
      "subscription.active": subscriptionActive,
    } = req.body;

    // Parse tags JSON array if sent as string or comma-separated
    let tagsArr = [];
    if (tags) {
      try {
        tagsArr = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch {
        tagsArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    // Parse syllabus JSON if sent as string.
    let syllabusArr = [];
    if (req.body.syllabus) {
      try {
        syllabusArr = JSON.parse(req.body.syllabus);
      } catch {
        syllabusArr = [];
      }
    }

    // Handle image uploads
    let courseImage = "";
    if (req.files && req.files["courseImage"] && req.files["courseImage"][0]) {
      courseImage = req.files["courseImage"][0].filename;
    }

    let imageGallery = [];
    if (req.files && req.files["imageGallery"] && Array.isArray(req.files["imageGallery"])) {
      imageGallery = req.files["imageGallery"].map((f) => f.filename);
    }

    // Mongoose nested field for subscription
    const subscription = {
      amount: parseFloat(subscriptionAmount),
      billingCycle: billingCycle || "monthly",
      currency: currency || "BDT",
      trialPeriodDays: trialPeriodDays || 0,
      active: subscriptionActive !== undefined ? subscriptionActive : true,
    };

    // Build the course object for Mongoose
    const courseData = {
      title,
      description,
      category,
      subCategory,
      level,
      tags: tagsArr,
      language,
      startDate,
      endDate,
      duration,
      courseImage,
      imageGallery,
      videoPreview,
      syllabus: syllabusArr,
      subscription,
      status: status || "draft",
    };

    // Validation: Required fields
    if (!title || !subscription.amount) {
      return res.status(400).json({ message: "Title and subscription.amount are required" });
    }

    // Create and save the course
    const newCourse = new Course(courseData);
    await newCourse.save();

    console.log("[courses.controller] New course created:", newCourse.title);
    res.status(201).json({
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("[courses.controller] Error creating course:", error);
    res.status(500).json({ message: "Server error creating course" });
  }
};

// --------------------------------------------------
// GET ALL COURSES  (Public / Student)
// --------------------------------------------------
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: "published" }).sort({
      createdAt: -1,
    });
    res.status(200).json(courses);
  } catch (error) {
    console.error("[courses.controller] Error fetching courses:", error);
    res.status(500).json({ message: "Server error fetching courses" });
  }
};

// --------------------------------------------------
// GET SINGLE COURSE BY ID
// --------------------------------------------------
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json(course);
  } catch (error) {
    console.error("[courses.controller] Error fetching course:", error);
    res.status(500).json({ message: "Server error fetching course" });
  }
};

// --------------------------------------------------
// UPDATE COURSE  (Admin only)
// --------------------------------------------------
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = { ...req.body };

    // Handle updated files (multer)
    if (req.files && req.files["courseImage"] && req.files["courseImage"][0]) {
      updatedFields.courseImage = req.files["courseImage"][0].filename;
    }
    if (req.files && req.files["imageGallery"] && Array.isArray(req.files["imageGallery"])) {
      updatedFields.imageGallery = req.files["imageGallery"].map((f) => f.filename);
    }
    // Parse JSON fields if present
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

    const updatedCourse = await Course.findByIdAndUpdate(id, { $set: updatedFields }, { new: true });
    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("[courses.controller] Course updated:", updatedCourse.title);
    res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    console.error("[courses.controller] Error updating course:", error);
    res.status(500).json({ message: "Server error updating course" });
  }
};

// --------------------------------------------------
// DELETE COURSE  (Admin only)
// --------------------------------------------------
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) return res.status(404).json({ message: "Course not found" });
    console.log("[courses.controller] Course deleted:", deletedCourse.title);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("[courses.controller] Error deleting course:", error);
    res.status(500).json({ message: "Server error deleting course" });
  }
};

// --------------------------------------------------
// ENROLL STUDENT  (Student route)
// --------------------------------------------------
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

    console.log(`[courses.controller] Student enrolled: ${studentId}`);
    res.status(200).json({ message: "Student enrolled successfully", course });
  } catch (error) {
    console.error("[courses.controller] Error enrolling student:", error);
    res.status(500).json({ message: "Server error enrolling student" });
  }
};

// --------------------------------------------------
// GET ENROLLED STUDENTS  (Admin only)
// --------------------------------------------------
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
    console.error("[courses.controller] Error fetching enrolled students:", error);
    res.status(500).json({ message: "Server error fetching enrolled students" });
  }
};
