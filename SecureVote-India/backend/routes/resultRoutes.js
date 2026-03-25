// backend/routes/resultRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getResults,
  getResultsByConstituency
} = require('../controllers/resultController');

// GET /api/results — public
router.get('/', getResults);

// GET /api/results/:constituency — public
router.get('/:constituency', getResultsByConstituency);

module.exports = router;