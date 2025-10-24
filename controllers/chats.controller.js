const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

/**
 * Add a new message to a visitor's chat
 * POST /api/chat
 */
async function addMessage(req, res) {
  try {
    const db = getDB();
    const { email, sender, message } = req.body;

    if (!email || !sender || !message) {
      return res
        .status(400)
        .json({ error: "Email, sender, and message are required" });
    }

    const msg = {
      id: new ObjectId(),
      sender,
      message,
      createdAt: new Date(),
    };

    // Add message to visitor's messages array, or create visitor if not exist
    const result = await db.collection("visitors").updateOne(
      { email },
      { $push: { messages: msg }, $setOnInsert: { name: req.body.name || "Guest" } },
      { upsert: true }
    );

    // Emit via Socket.IO
    if (req.io) {
      req.io.emit("receive_message", { email, ...msg });
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get all messages for a specific visitor
 * GET /api/chat/:email
 */
async function getMessages(req, res) {
  try {
    const db = getDB();
    const { email } = req.params;

    if (!email) return res.status(400).json({ error: "Email required" });

    const visitor = await db.collection("visitors").findOne({ email });
    if (!visitor) return res.status(404).json({ error: "Visitor not found" });

    res.json(visitor.messages || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get all visitors with their messages
 * GET /api/chat
 */
async function getAllChats(req, res) {
  try {
    const db = getDB();
    const visitors = await db
      .collection("visitors")
      .find({}, { projection: { name: 1, email: 1, messages: 1 } })
      .toArray();

    res.json(visitors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addMessage,
  getMessages,
  getAllChats,
};
