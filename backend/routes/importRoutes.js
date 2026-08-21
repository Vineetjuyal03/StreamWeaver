const express = require("express");
const { uploadCSV } = require("../controllers/importController");

const router = express.Router();

router.post("/upload", uploadCSV);



module.exports = router;