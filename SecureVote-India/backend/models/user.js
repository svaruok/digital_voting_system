const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  aadhaar: String,
  voterId: String,
  mobile: String,
  otp: String,
  isVerified: Boolean,
  hasVoted: {
    type: Boolean,
    default: false
  }
});

// PREVENT MODEL OVERWRITE ERROR
module.exports = mongoose.models.User || mongoose.model("User", userSchema);