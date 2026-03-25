const User = require('../models/user');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendOTP = async (email, otp, name) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@securevote.in',
      to: email,
      subject: 'SecureVote India — Your Login OTP',
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#0A0F2C">Your SecureVote OTP</h2>
        <div style="background:#f8f9fa;border:2px solid #e9ecef;border-radius:12px;padding:24px;text-align:center;font-size:48px;font-weight:bold;letter-spacing:8px;color:#0A0F2C;margin:24px 0">${otp}</div>
        <p>Valid for 10 minutes only. Do not share with anyone.</p>
        <p style="color:#666;font-size:14px">If you didn't request this, ignore this email.</p>
      </div>`
    });
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Email failed for ${email}:`, err.message);
    if (err.code === 'EAUTH') {
      console.error('💡 Fix: Setup .env EMAIL_USER=your@gmail.com EMAIL_PASS=app_password');
    }
    return false;
  }
};

const normalizeDOB = (raw) => {
  if (!raw) return '';
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return raw.trim();
  }
  const date = new Date(raw);
  if (!isNaN(date.getTime())) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(raw).trim();
};



// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  const { voterId, fullName, dateOfBirth, email, phone, state, constituency, address } = req.body;

  if (!voterId || !fullName || !dateOfBirth || !email || !phone || !state || !constituency) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const exists = await User.findOne({
      $or: [{ voterId }, { email }]
    });

    if (exists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = new User({
      voterId: voterId.trim(),
      fullName: fullName.trim(),
      dateOfBirth: normalizeDOB(dateOfBirth),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      state: state.trim(),
      constituency: constituency.trim(),
      address: address || ''
    });

    await user.save();

    res.status(201).json({ message: 'Registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Register failed' });
  }
};



// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  const { email, voterId, dateOfBirth } = req.body;

  if (!email || !voterId || !dateOfBirth) {
    return res.status(400).json({ error: 'Email, VoterId and DOB required' });
  }

  try {
    const user = await User.findOne({ voterId });

    if (!user) {
      return res.status(404).json({ error: 'Voter not registered. Please register first' });
    }

    const storedDOB = normalizeDOB(user.dateOfBirth);
    const enteredDOB = normalizeDOB(dateOfBirth);

    if (storedDOB !== enteredDOB) {
      return res.status(401).json({ error: 'Date of Birth mismatch' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60000);

    await user.save({ validateBeforeSave: false });

    console.log(`🔐 USER OTP for ${user.voterId} (${user.email}): ${otp}`);
    
    const sent = await sendOTP(email, otp, user.fullName);
    if (!sent) {
      console.warn(`❌ Email delivery failed for ${email}`);
    }

    res.json({
      message: sent ? 'OTP sent to your Gmail' : 'OTP generated ✓ Check server console (setup .env EMAIL_*)',
      userId: user._id,
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};



// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ error: 'UserId and OTP required' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    user.otp = null;
    user.otpExpiresAt = null;

    await user.save({ validateBeforeSave: false });

    const token = jwt.sign(
      {
        id: user._id,
        voterId: user.voterId,
        constituency: user.constituency,
        role: user.role || 'voter'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      constituency: user.constituency,
      hasVoted: user.hasVoted,
      fullName: user.fullName
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OTP verify failed' });
  }
};



// ================= PROFILE (FIXED MAIN BUG) =================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user._id,
      voterId: user.voterId,
      fullName: user.fullName,
      constituency: user.constituency || "Hyderabad",
      hasVoted: user.hasVoted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile failed' });
  }
};