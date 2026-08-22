const express = require("express");
const { uploadCSV, getImportStatus } = require("../controllers/importController");

const router = express.Router();

router.post("/upload", uploadCSV);
router.get("/:importId",getImportStatus);



module.exports = router;