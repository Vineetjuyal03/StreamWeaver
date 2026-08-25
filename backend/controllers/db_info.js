const mongoose = require("mongoose");

/**
 * Get list of all MongoDB collection names
 */
const getCollections = async (req, res) => {
  try {
    // Guard check to ensure the Mongoose connection is ready
    if (!mongoose.connection.db) {
      return res.status(503).json({
        success: false,
        message: "Database connection is not established yet."
      });
    }

    const collectionsList = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collectionsList.map((col) => col.name);

    res.json({
      success: true,
      collections: collectionNames
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve database collections.",
      error: error.message
    });
  }
};

module.exports = {
  getCollections,
};