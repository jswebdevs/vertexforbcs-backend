// Run this in a Node.js script or REPL connected to your DB
const { getDB } = require("./config/db"); // adjust path
const fs = require("fs");
const path = require("path");

async function cleanupMedia() {
  const mediaCollection = getDB().collection("media");
  const media = await mediaCollection.find({}).toArray();

  for (const m of media) {
    const filePath = path.join(__dirname, "uploads", m.folder, m.filename);
    if (!fs.existsSync(filePath)) {
      console.log("Deleting orphaned record:", m.filename);
      await mediaCollection.deleteOne({ _id: m._id });
    }
  }

  console.log("Cleanup done!");
  process.exit();
}

cleanupMedia();