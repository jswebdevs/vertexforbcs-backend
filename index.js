// backend/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

// Import routes
import userRoutes from "./routes/users.routes.js";
import courseRoutes from "./routes/courses.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import quizRoutes from "./routes/quizzes.routes.js";
import courseQuizRoutes from "./routes/courseQuiz.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import userQuizRoutes from "./routes/userQuizRecord.routes.js";
import sliderRoutes from "./routes/sliders.route.js"; 
import hotCoursesRoutes from "./routes/hotCourses.routes.js";
import specialCoursesRoutes from "./routes/specialCourses.routes.js"
import galleryRoutes from "./routes/gallery.routes.js"
import faqRoutes from "./routes/faq.routes.js"
import pricingRoutes from "./routes/pricing.routes.js"

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// -------------------------------
// CORS SETUP
// -------------------------------

const allowedOrigins = [
  "http://localhost:5173",
  "https://vertexforbcs.org",
  "https://www.vertexforbcs.org",
  "http://localhost",
];

// Dynamic CORS options function for fine-grained control
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS Blocked Request from: ${origin}`); // DEBUG: Log blocked origins
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // allow session cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Manually respond to OPTIONS preflight requests
app.options("*", cors(corsOptions));

// -------------------------------
// JSON PARSER
// -------------------------------
app.use(express.json());

// -------------------------------
// 🔍 DEBUG MIDDLEWARE (Add this here)
// -------------------------------
app.use((req, res, next) => {
  console.log(`\n------------------------------------------`);
  console.log(`📨 [${new Date().toISOString()}] Incoming Request`);
  console.log(`🔹 Method: ${req.method}`);
  console.log(`🔹 URL:    ${req.originalUrl}`);
  console.log(`🔹 Origin: ${req.headers.origin || "Unknown (Postman/Server)"}`);
  
  // Log body only if it exists and isn't empty
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
  }
  console.log(`------------------------------------------\n`);
  next();
});

// -------------------------------
// STATIC UPLOADS FOLDER
// -------------------------------
// DEBUG: Print the path being used for uploads

app.use("uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------------
// ROOT ROUTE
// -------------------------------
app.get("/", (req, res) => {
  res.send("🚀 Vertex for BCS Backend is Running Securely!");
});

// -------------------------------
// API ROUTES
// -------------------------------

app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courses", courseQuizRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api", userQuizRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/hot-courses", hotCoursesRoutes)
app.use("/api/special-courses", specialCoursesRoutes)
app.use("/api/gallery", galleryRoutes)
app.use("/api/faq", faqRoutes)
app.use("/api/pricing", pricingRoutes)


// You had imported sliderRoutes but didn't use it. 
// If you need it, uncomment the line below:
// app.use("/api/sliders", sliderRoutes); 

// -------------------------------
// START SERVER
// -------------------------------
const startServer = async () => {
  try {
    await connectDB(); // Mongoose connection
    console.log("✅ MongoDB Connection Established");

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}. Start Coding Now`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();