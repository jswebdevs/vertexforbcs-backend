const express = require("express");
const { getDraftProperties } = require("../controllers/drafts.controller");
const router = express.Router();

router.get("/", getDraftProperties);

module.exports = router;
