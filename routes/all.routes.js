const express = require("express");
const router = express.Router();
const { getAllProperties } = require("../controllers/all.controller");

// GET all properties
router.get("/", getAllProperties);

module.exports = router; // ✅ must export the router
