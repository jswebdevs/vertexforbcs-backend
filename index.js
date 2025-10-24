// backend/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/users.routes.js";
import courseRoutes from "./routes/courses.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// -------------------------------
// ALLOWED ORIGINS
// -------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://vertexfbcs.netlify.app",
  "https://vertexforbcs.org",
  "https://www.vertexforbcs.org",
];

// -------------------------------
// CORS SETUP
// -------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Optional: also use CORS package
app.use(cors({ origin: allowedOrigins, credentials: true }));

// -------------------------------
// JSON PARSER
// -------------------------------
app.use(express.json());

// -------------------------------
// ROOT ROUTE
// -------------------------------
app.get("/", (req, res) => {
  res.send("🚀 Vertex for BCS Backend is Running Securely!");
});

// -------------------------------
// ROUTES
// -------------------------------
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);

// -------------------------------
// START SERVER
// -------------------------------
const startServer = async () => {
  try {
    await connectDB(); // Mongoose connection
    console.log("✅ Database connected successfully");

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
