const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  adminId:      { type: String, required: true, unique: true, trim: true },
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ['super', 'district', 'booth'], default: 'district' },
  constituency: { type: String, default: '' },
  permissions:  { type: [String], default: ['view'] },
  otp:          { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  lastLogin:    { type: Date, default: null },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);