// backend/server.js
const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
require('dotenv').config();

const connectDB  = require('./config/db');
const User       = require('./models/user');
const Admin      = require('./models/admin');
const Candidate  = require('./models/candidate');
const Election   = require('./models/Election');

const app = express();

// ─── Connect Database ─────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Auth Middleware (inline for simplicity) ──────────────────────────────────
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (!decoded.role || !['super', 'district', 'booth'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Import Route Files ───────────────────────────────────────────────────────
const authRoutes      = require('./routes/authentication');
const candidateRoutes = require('./routes/candidateRoutes');
const resultRoutes    = require('./routes/resultRoutes');
const voteRoutes      = require('./routes/voteRoutes');
const adminController = require('./controllers/adminController');

// ─── Mount Routes ─────────────────────────────────────────────────────────────
app.use('/api/user',       authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/results',    resultRoutes);
app.use('/api/vote',       voteRoutes);

// ─── Admin Routes (handled here directly) ────────────────────────────────────

// POST /api/admin/login
app.post('/api/admin/login', adminController.adminLogin);

// POST /api/admin/verify-otp
app.post('/api/admin/verify-otp', adminController.verifyOtp);

// GET /api/admin/stats
app.get('/api/admin/stats', authenticateAdmin, adminController.getStats);

// GET /api/admin/voters
app.get('/api/admin/voters', authenticateAdmin, adminController.getVoters);

// POST /api/admin/candidates
app.post('/api/admin/candidates', authenticateAdmin, async (req, res) => {
  const { name, party, partySymbol, constituency, manifesto } = req.body;
  if (!name || !party || !constituency) return res.status(400).json({ error: 'Name, party and constituency required' });
  try {
    const candidate = new Candidate({ name, party, partySymbol: partySymbol || '🗳️', constituency, manifesto: manifesto || '' });
    await candidate.save();
    res.status(201).json({ message: 'Candidate added successfully', candidate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

// GET /api/admin/candidates
app.get('/api/admin/candidates', authenticateAdmin, async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ constituency: 1, createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// DELETE /api/admin/candidates/:id
app.delete('/api/admin/candidates/:id', authenticateAdmin, async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// POST /api/admin/elections
app.post('/api/admin/elections', authenticateAdmin, async (req, res) => {
  const { title, constituency, startDate, endDate, contractAddress } = req.body;
  try {
    const election = new Election({ title, constituency, startDate, endDate, contractAddress, status: 'active' });
    await election.save();
    res.status(201).json({ message: 'Election created', election });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create election' });
  }
});

// GET /api/elections/current
app.get('/api/elections/current', async (req, res) => {
  try {
    const elections = await Election.find({ status: 'active' });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});

// ─── Demo Init ────────────────────────────────────────────────────────────────
app.post('/api/init-demo', async (req, res) => {
  const secret = process.env.INIT_SECRET;
  if (secret && req.headers['x-init-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const Admin = require('./models/admin');
    const Candidate = require('./models/candidate');
    const Election = require('./models/election');
    
    await Admin.deleteMany({});
    await Election.deleteMany({});

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await Admin.create({
      adminId: 'ADMIN001',
      name: 'Election Commissioner',
      email: 'admin@eci.gov.in',
      password: hash,
      role: 'super',
      permissions: ['all']
    });

    await Election.create({
      title: 'Lok Sabha Elections 2024',
      constituency: 'India',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 3600000)
    });

    // Add demo candidates (all India)
    await Candidate.deleteMany({});
    await Candidate.insertMany([
      { name: 'Arjun Sharma',  party: 'National Democratic Party', partySymbol: '🪷', votes: 0 },
      { name: 'Priya Patel',   party: 'Indian National Congress',  partySymbol: '✋', votes: 0 },
      { name: 'Ravi Kumar',    party: 'Bharatiya Janata Party',    partySymbol: '🌸', votes: 0 },
      { name: 'Sunita Singh',  party: 'Aam Aadmi Party',           partySymbol: '🧹', votes: 0 }
    ]);

    console.log('✅ Demo data initialized — Admin: ADMIN001/admin123 | 4 National Candidates');
    res.json({
      message: '✅ All-India demo data ready!',
      admin: 'ADMIN001/admin123',
      candidates: 4
    });
  } catch (err) {
    console.error('Init error:', err);
    res.status(500).json({ error: 'Init failed: ' + err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));