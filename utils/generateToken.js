// utils/generateToken.js
import jwt from "jsonwebtoken";

/**
 * Generate JWT token for a user
 * @param {string} id - user ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token expires in 7 days
  });
};

export default generateToken;
