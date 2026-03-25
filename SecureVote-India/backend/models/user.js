const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  voterId:       { type: String, required: true, unique: true, trim: true },
  fullName:      { type: String, required: true },
  dateOfBirth:   { type: String, required: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:         { type: String, required: true },
  state:         { type: String, required: true },
  constituency:  { type: String, required: true },
  address:       { type: String, default: '' },
  hasVoted:      { type: Boolean, default: false },
  otp:           { type: String, default: null },
  otpExpiresAt:  { type: Date, default: null },
  walletAddress: { type: String, default: null },
  txHash:        { type: String, default: null },

  // ✅ OPTIONAL FIX (recommended)
  role:          { type: String, default: 'voter' },

  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);