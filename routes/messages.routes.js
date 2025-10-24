const express = require("express");
const router = express.Router();
const {
  createMessage,
  getMessages,
  getMessageById,
} = require("../controllers/messages.controller");

// Routes
router.post("/", createMessage);
router.get("/", getMessages);
router.get("/:id", getMessageById);

module.exports = router;
