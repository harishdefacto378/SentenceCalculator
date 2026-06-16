const express = require("express");
const { health, getDrugList, createSentence } = require("../controllers/dataverseController");
const { validateCreateSentence } = require("../utils/validation");

const router = express.Router();

router.get("/health", health);
router.post("/getdruglist", getDrugList);
router.post("/createsentence", validateCreateSentence, createSentence);

module.exports = router;
