const express = require("express");
const { uploadCSV, uploadJSON, getImportStatus } = require("../controllers/importController");

const router = express.Router();

router.post("/upload/csv", uploadCSV);
router.post("/upload/json", uploadJSON);
router.get("/:importId", getImportStatus);

module.exports = router;
//importRoutes.js