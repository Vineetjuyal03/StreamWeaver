const express = require("express");
const router = express.Router();
const { getCollections,getCollectionFields} = require("../controllers/db_info");

// GET /collections
router.get("/collections", getCollections);
router.get("/collections/:collectionName/fields", getCollectionFields);
module.exports = router;