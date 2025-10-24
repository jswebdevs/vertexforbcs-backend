const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// GET all properties (lands, flats, houses combined)
async function getAllProperties(req, res) {
  try {
    const db = getDB();

    // Fetch all properties from each collection
    const [lands, flats, houses] = await Promise.all([
      db.collection("lands").find({}).toArray(),
      db.collection("flats").find({}).toArray(),
      db.collection("houses").find({}).toArray(),
    ]);

    // Combine all
    const allProperties = [...lands, ...flats, ...houses];

    res.json(allProperties);
  } catch (err) {
    console.error("Error fetching all properties:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllProperties };
