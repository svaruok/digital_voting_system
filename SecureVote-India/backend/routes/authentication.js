// backend/routes/authentication.js
const express = require('express');
const router  = express.Router();
const {
  registerUser,
  loginUser,
  verifyOtp,
  getProfile
} = require('../controllers/authController');

const authenticateUser = require('../middleware/auth');

// POST /api/user/register
router.post('/register', registerUser);

// POST /api/user/login
router.post('/login', loginUser);

// POST /api/user/verify-otp
router.post('/verify-otp', verifyOtp);

// GET /api/user/profile (protected)
router.get('/profile', authenticateUser, getProfile);

module.exports = router;