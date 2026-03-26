const User = require('../models/user');
const jwt = require('jsonwebtoken');




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
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      voterId: voterId.trim(),
      dateOfBirth: normalizeDOB(dateOfBirth)
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        voterId: user.voterId,
        constituency: user.constituency,
        role: 'voter'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      constituency: user.constituency,
      fullName: user.fullName
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
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