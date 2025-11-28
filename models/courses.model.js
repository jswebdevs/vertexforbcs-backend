import mongoose from "mongoose";

const syllabusSchema = new mongoose.Schema({
  title: String,
  topics: [String],
  resources: [
    {
      title: String,
      link: String,
    },
  ],
});

const enrolledStudentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startDate: { type: Date, default: Date.now },
  nextBillingDate: { type: Date },
  progress: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: String,
    subCategory: String,
    level: String,
    tags: [String],
    language: String,
    startDate: Date,
    endDate: Date,
    duration: String,

    // ✅ CHANGED: Reference the Media model instead of storing raw strings
    courseImage: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Media" 
    },
    imageGallery: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Media" 
    }],
    videoPreview: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Media" 
    },

    syllabus: [syllabusSchema],

    subscription: {
      billingCycle: { type: String, default: "monthly" },
      currency: { type: String, default: "BDT" },
      amount: { type: Number, required: true },
      trialPeriodDays: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
    },

    enrolledStudents: [enrolledStudentSchema],

    reviews: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;