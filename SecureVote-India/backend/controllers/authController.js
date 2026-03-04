const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  const { aadhaar, voterId } = req.body;

  try {
    let user = await User.findOne({ aadhaar, voterId });

    if (!user) {
      user = new User({
        aadhaar,
        voterId,
        mobile: "9999999999"
      });
    }

    const otp = generateOTP();

    user.otp = otp;
    user.isVerified = false;

    await user.save();

    console.log("OTP:", otp);

    res.json({ message: "OTP Sent Successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  const { aadhaar, voterId, otp } = req.body;

  try {
    const user = await User.findOne({ aadhaar, voterId });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login Successful",
      token,
      hasVoted: user.hasVoted
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
