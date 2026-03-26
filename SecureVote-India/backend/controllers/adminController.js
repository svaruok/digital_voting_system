const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    // ✅ DIRECT LOGIN (SUPER ADMIN)
    if (adminId.trim() === 'ADMIN001' && password === 'admin123') {
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

    // ✅ GENERATE OTP (NO EMAIL)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.otp = otp;
    admin.otpExpiresAt = new Date(Date.now() + 10 * 60000);
    await admin.save();

    console.log(`🔐 ADMIN OTP for ${adminId}: ${otp}`);

    // 🔥 SEND OTP DIRECTLY TO FRONTEND
    res.json({
      message: "OTP generated",
      otp: otp,
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
    const User = require('../models/user');
    const Candidate = require('../models/candidate');
    const Election = require('../models/Election');

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