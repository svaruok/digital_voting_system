// backend/controllers/resultController.js
const Candidate = require('../models/candidate');

// GET /api/results — public results sorted by votes
exports.getResults = async (req, res) => {
  try {
    const results = await Candidate.find().sort({ votes: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

// GET /api/results/:constituency
exports.getResultsByConstituency = async (req, res) => {
  try {
    const constituency = decodeURIComponent(req.params.constituency);
    const results = await Candidate.find({ constituency }).sort({ votes: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};