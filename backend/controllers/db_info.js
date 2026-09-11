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
const getCollectionFields = async (req, res) => {
    try {
        const { collectionName } = req.params;

        if (!mongoose.connection.db) {
            return res.status(503).json({
                success: false,
                message: "Database connection is not established yet.",
            });
        }

        const collection = mongoose.connection.db.collection(collectionName);

        // Sample a handful of documents rather than scanning the whole collection —
        // fine for a schemaless "what fields exist" preview.
        const sampleDocs = await collection.find({}).limit(50).toArray();

        if (sampleDocs.length === 0) {
            return res.json({ success: true, fields: [] }); // empty/new collection — no fields yet
        }

        const fieldSet = new Set();
        sampleDocs.forEach((doc) => {
            Object.keys(doc).forEach((key) => {
                if (key !== "_id" && key !== "_importId") {
                    fieldSet.add(key);
                }
            });
        });

        res.json({ success: true, fields: [...fieldSet] });

    } catch (error) {
        console.error("Error fetching collection fields:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve collection fields.",
            error: error.message,
        });
    }
};

module.exports = {
    getCollections,
    getCollectionFields,
};