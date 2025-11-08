// update-admin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const result = await mongoose.connection.db.collection('users').updateOne(
  { email: "jshikder116@gmail.com" },
  {
    $set: {
      loginMethod: "controller",
      userType: "admin",
      status: "active",
      password: "$2b$10$/kzAqhycmhrfZFezcOR6.OUa0Z8r3hXq2c3uEYZ9GMZ910AoUQR8."
    }
  }
);
console.log('Update result:', result);

const user = await mongoose.connection.db.collection('users').findOne({ email: "jshikder116@gmail.com" });
console.log('User:', user);

process.exit();
