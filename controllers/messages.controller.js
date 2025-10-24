const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// POST a new message (Seller or Buyer)
async function createMessage(req, res) {
  try {
    const db = getDB();
    const messageData = req.body;

    // Add entryDate for sorting
    messageData.meta = {
      entryDate: new Date(),
      ...messageData.meta,
    };

    const result = await db.collection("messages").insertOne(messageData);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ error: err.message });
  }
}

// GET all messages
async function getMessages(req, res) {
  try {
    const db = getDB();
    const messages = await db
      .collection("messages")
      .find()
      .sort({ "meta.entryDate": -1 })
      .toArray();
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: err.message });
  }
}

// GET single message
async function getMessageById(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const message = await db.collection("messages").findOne({ _id: new ObjectId(id) });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(message);
  } catch (err) {
    console.error("Error fetching message:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createMessage, getMessages, getMessageById };