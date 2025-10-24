const express = require("express");
const router = express.Router();
const {
  addMessage,
  getMessages,
  getAllChats,
} = require("../controllers/chats.controller");


router.post("/", addMessage);

router.get("/:email", getMessages);

router.get("/", getAllChats);

module.exports = router;
