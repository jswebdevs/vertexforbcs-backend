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
  "https://vertexfbcs.netlify.app",
  "https://vertexforbcs.org",
  "https://www.vertexforbcs.org",
];

// Dynamic CORS options function for fine-grained control
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // allow session cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Manually respond to OPTIONS preflight requests (for older browsers/clients)
app.options("*", cors(corsOptions));

// -------------------------------
// JSON PARSER
// -------------------------------
app.use(express.json());

// -------------------------------
// STATIC UPLOADS FOLDER (before media routes)
///uploads is public for images/files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// -------------------------------
// START SERVER
// -------------------------------
const startServer = async () => {
  try {
    await connectDB(); // Mongoose connection
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}. Start Coding Now`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
