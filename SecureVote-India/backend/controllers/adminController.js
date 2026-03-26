// ❌ WRONG
// const Admin = require('../models/Admin');

// ✅ FIX
const Admin = require('../models/admin');    // Bug 1: wrong case '../models/admin'
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
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
      subject: 'SecureVote India — Admin OTP',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <div style="background:#0A0F2C;padding:24px;text-align:center;border-radius:8px 8px 0 0">
          <h2 style="color:#FF9933;margin:0">🗳️ SecureVote India</h2>
        </div>
        <div style="padding:32px;border:1px solid #eee;border-radius:0 0 8px 8px">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your Admin OTP:</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;font-size:36px;font-weight:700;letter-spacing:12px;color:#0A0F2C">${otp}</div>
          <p style="color:#888;font-size:13px">Valid for 10 minutes. Do not share.</p>
        </div>
      </div>`
    });
    console.log(`✅ Admin OTP email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ Admin email failed for ${email}:`, err.message);
    if (err.code === 'EAUTH') {
      console.error('💡 Fix: Check .env EMAIL_USER & EMAIL_PASS (Gmail App Password)');
    }
    return false;
  }
};

// POST /api/admin/login
exports.adminLogin = async (req, res) => {
  const { adminId, password } = req.body;
  if (!adminId || !password) return res.status(400).json({ error: 'Admin ID and password required' });
  try {
    const admin = await Admin.findOne({ adminId: adminId.trim() });
    if (!admin) return res.status(401).json({ error: 'Invalid admin credentials' });

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid admin credentials' });

    // Direct login for hardcoded super-admin (no OTP/email needed)
    if (adminId.trim() === 'ADMIN001' && password === 'admin123') {
      console.log(`🔓 DIRECT SUPER-ADMIN LOGIN: ${adminId}`);

      const token = jwt.sign(
        {
          id: admin._id,
          adminId: admin.adminId,
          name: admin.name,
          role: admin.role,
          constituency: admin.constituency,
          permissions: admin.permissions
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '8h' }
      );

      admin.lastLogin = new Date();
      await admin.save();

      return res.json({
        token,
        admin: {
          name: admin.name,
          role: admin.role,
          constituency: admin.constituency,
          permissions: admin.permissions
        }
      });
    }

    // Fallback: Regular admin with OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.otp = otp;
    admin.otpExpiresAt = new Date(Date.now() + 10 * 60000);
    await admin.save();

    console.log(`🔐 ADMIN OTP for ${adminId} (${admin.email}): ${otp}`);
    
    const sent = await sendOTP(admin.email, otp, admin.name);
    if (!sent) {
      console.warn(`❌ Admin email failed for ${admin.email}`);
    }

    res.json({
      message: sent ? `OTP sent to ${admin.email}` : 'OTP generated ✓ Check server console (.env EMAIL_* needed)',
      adminMongoId: admin._id,
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed' });
  }
};

// POST /api/admin/verify-otp
exports.verifyOtp = async (req, res) => {
  const { adminMongoId, otp } = req.body;

  // Bug 2: No input validation — missing adminMongoId or otp crashes findById
  if (!adminMongoId || !otp) {
    return res.status(400).json({ error: 'Admin ID and OTP are required' });
  }

  // Bug 3: No ObjectId validation — malformed adminMongoId causes unhandled CastError
  const { isValidObjectId } = require('mongoose');
  if (!isValidObjectId(adminMongoId)) {
    return res.status(400).json({ error: 'Invalid admin ID format' });
  }

  try {
    const admin = await Admin.findById(adminMongoId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    if (!admin.otp || admin.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > admin.otpExpiresAt) return res.status(400).json({ error: 'OTP expired. Please login again.' });

    admin.otp = null;
    admin.otpExpiresAt = null;
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      {
        id:           admin._id,         // Bug 4: was 'adminMongoId' — inconsistent with
        adminId:      admin.adminId,     // auth middleware which reads req.user.id
        name:         admin.name,        // Changed to 'id' to match authenticateUser middleware
        role:         admin.role,
        constituency: admin.constituency,
        permissions:  admin.permissions
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        name:         admin.name,
        role:         admin.role,
        constituency: admin.constituency,
        permissions:  admin.permissions
      }
    });
  } catch (err) {
    console.error('Admin OTP verify error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    // Bug 5 (all 3 requires): wrong casing on model imports inside the function
    const User = require('../models/user');
const Candidate = require('../models/candidate');
const Election = require('../models/election');

    const [totalVoters, votesCast, totalCandidates, activeElections] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ hasVoted: true }),
      Candidate.countDocuments(),
      Election.countDocuments({ status: 'active' })
    ]);
    const constituencies = await User.distinct('constituency');

    res.json({
      totalVoters,
      votesCast,
      totalCandidates,
      activeElections,
      totalConstituencies: constituencies.length,
      turnout: totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(1) : '0.0'
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/admin/voters
exports.getVoters = async (req, res) => {
  try {
    const User = require('../models/user'); // Bug 5 continued: was '../models/user'
    const voters = await User.find().select('-otp -otpExpiresAt').sort({ createdAt: -1 });
    res.json(voters);
  } catch (err) {
    console.error('Get voters error:', err);
    res.status(500).json({ error: 'Failed to fetch voters' });
  }
};