const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  constituency:    { type: String, required: true },
  status:          { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
  startDate:       { type: Date },
  endDate:         { type: Date },
  contractAddress: { type: String, default: null },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.models.Election || mongoose.model('Election', ElectionSchema);