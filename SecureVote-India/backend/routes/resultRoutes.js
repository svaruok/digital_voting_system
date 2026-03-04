const express = require("express");
const router = express.Router();

const { getResults } = require("../controllers/resultController");

router.get("/all", getResults);

module.exports = router;
