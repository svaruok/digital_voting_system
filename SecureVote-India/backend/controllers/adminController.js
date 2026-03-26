// ✅ Models (correct casing)
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ Resend (NEW)
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ SEND OTP FUNCTION (Resend)
const sendOTP = async (email, otp, name) => {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "SecureVote India - OTP",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>🗳️ SecureVote India</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:5px">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
        </div>
      `
    });

    console.log(`✅ OTP sent via Resend to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Resend error:", err);
    return false;
  }
};

// ================= ADMIN LOGIN =================
exports.adminLogin = async (req, res) => {
  const { adminId, password } = req.body;

  if (!adminId || !password) {
    return res.status(400).json({ error: 'Admin ID and password required' });
  }

  try {
    const admin = await Admin.findOne({ adminId: adminId.trim() });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // ✅ SUPER ADMIN DIRECT LOGIN
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
        process.env.JWT_SECRET,
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

    // ✅ NORMAL ADMIN → OTP FLOW
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.otp = otp;
    admin.otpExpiresAt = new Date(Date.now() + 10 * 60000);
    await admin.save();

    console.log(`🔐 ADMIN OTP for ${adminId} (${admin.email}): ${otp}`);

    const sent = await sendOTP(admin.email, otp, admin.name);

    res.json({
      message: sent ? `OTP sent to ${admin.email}` : "OTP generated (check logs)",
      adminMongoId: admin._id
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed' });
  }
};

// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  const { adminMongoId, otp } = req.body;

  if (!adminMongoId || !otp) {
    return res.status(400).json({ error: 'Admin ID and OTP required' });
  }

  try {
    const admin = await Admin.findById(adminMongoId);

    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (admin.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > admin.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    admin.otp = null;
    admin.otpExpiresAt = null;
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      {
        id: admin._id,
        adminId: admin.adminId,
        name: admin.name,
        role: admin.role,
        constituency: admin.constituency,
        permissions: admin.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        name: admin.name,
        role: admin.role,
        constituency: admin.constituency,
        permissions: admin.permissions
      }
    });

  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// ================= ADMIN STATS =================
exports.getStats = async (req, res) => {
  try {
    const User = require('../models/user');           // lowercase
    const Candidate = require('../models/candidate'); // lowercase
    const Election = require('../models/Election');   // capital E

    const [totalVoters, votesCast, totalCandidates, activeElections] =
      await Promise.all([
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
      turnout:
        totalVoters > 0
          ? ((votesCast / totalVoters) * 100).toFixed(1)
          : '0.0'
    });

  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ================= GET VOTERS =================
exports.getVoters = async (req, res) => {
  try {
    const User = require('../models/user');

    const voters = await User.find()
      .select('-otp -otpExpiresAt')
      .sort({ createdAt: -1 });

    res.json(voters);

  } catch (err) {
    console.error('Get voters error:', err);
    res.status(500).json({ error: 'Failed to fetch voters' });
  }
};