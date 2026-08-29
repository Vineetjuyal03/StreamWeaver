const express = require("express");

const router = express.Router();

const {
    saveMapping,
    getMappingById
} = require("../controllers/mappingController");

router.post("/mapping/save",saveMapping);

router.get("/mapping/:id",getMappingById);


module.exports = router;