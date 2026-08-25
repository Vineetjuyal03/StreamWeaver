const express = require("express");
const router = express.Router();
const { getCollections } = require("../controllers/db_info");

// GET /collections
router.get("/getCollections", getCollections);

module.exports = router;