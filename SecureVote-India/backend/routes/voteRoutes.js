// backend/routes/voteRoutes.js
const express = require('express');
const router  = express.Router();
const { castVote } = require('../controllers/voteController');
const authenticateUser = require('../middleware/auth');

// POST /api/vote — protected, voters only
router.post('/', authenticateUser, castVote);

module.exports = router;