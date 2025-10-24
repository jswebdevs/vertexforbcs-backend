const express = require("express");
const router = express.Router();
const { getRecentProperties } = require("../controllers/recent.controller");

// GET recent properties
router.get("/", getRecentProperties);

module.exports = router;
