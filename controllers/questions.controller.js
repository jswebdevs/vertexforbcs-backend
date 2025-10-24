const { getDB } = require("../config/db");

// GET all featured properties
async function getFeaturedProperties(req, res) {
  try {
    const db = getDB();

    // Case-insensitive check for "Featured"
    const featuredQuery = { "meta.tags": { $regex: /^featured$/i } };

    // Fetch featured lands, flats, houses
    const [lands, flats, houses] = await Promise.all([
      db.collection("lands").find(featuredQuery).toArray(),
      db.collection("flats").find(featuredQuery).toArray(),
      db.collection("houses").find(featuredQuery).toArray(),
    ]);

    // Combine and sort by newest first
    const allFeatured = [...lands, ...flats, ...houses].sort(
      (a, b) => new Date(b.meta?.entryDate) - new Date(a.meta?.entryDate)
    );

    res.json(allFeatured);
  } catch (err) {
    console.error("Error fetching featured properties:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getFeaturedProperties };
