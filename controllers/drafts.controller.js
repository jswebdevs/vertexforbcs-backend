const { getDB } = require("../config/db");

// GET all draft properties
async function getDraftProperties(req, res) {
  try {
    const db = getDB();

    // Case-insensitive check for status "Published"
    const draftQuery = { "meta.status": { $not: /^published$/i } };

    // Fetch draft lands, flats, houses
    const [lands, flats, houses] = await Promise.all([
      db.collection("lands").find(draftQuery).toArray(),
      db.collection("flats").find(draftQuery).toArray(),
      db.collection("houses").find(draftQuery).toArray(),
    ]);

    // Combine and sort by entryDate (newest first)
    const allDrafts = [...lands, ...flats, ...houses].sort(
      (a, b) => new Date(b.meta?.entryDate) - new Date(a.meta?.entryDate)
    );

    res.json(allDrafts);
  } catch (err) {
    console.error("Error fetching draft properties:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getDraftProperties };
