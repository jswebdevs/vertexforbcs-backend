// backend/config/db.js

import mongoose from "mongoose";

// -------------------------------
// DATABASE CONNECTION FUNCTION
// -------------------------------
export const connectDB = async () => {
  try {
    // Ensure MongoDB URI exists
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI not found in environment variables");
      process.exit(1);
    }

    // Connect with best practice configuration
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true, // Build indexes automatically
      connectTimeoutMS: 20000, // Connection timeout
      serverSelectionTimeoutMS: 20000, // Server selection timeout
    });


    // Connection Events
    mongoose.connection.on("connected", () => {
      console.log("🟢 Mongoose connection established successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`🔴 Mongoose connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("🟡 Mongoose connection lost. Retrying...");
    });
  } catch (err) {
    console.error("❌ Mongoose connection error:", err);
    process.exit(1);
  }
};
