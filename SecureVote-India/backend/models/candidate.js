const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  party:       { type: String, required: true, trim: true },
  partySymbol: { type: String, default: '🗳️' },
  constituency: { type: String, default: 'India' },
  manifesto:   { type: String, default: '' },
  votes:       { type: Number, default: 0 },
  txHashes:    { type: [String], default: [] },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);
