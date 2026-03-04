const express = require("express");
const router = express.Router();

const { loginUser, verifyOtp } = require("../controllers/authController");

router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);

module.exports = router;
