// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voting_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Schemas
const userSchema = new mongoose.Schema({
    voterId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: String,
    constituency: String,
    state: String,
    hasVoted: { type: Boolean, default: false },
    votedFor: String,
    voteTimestamp: Date,
    createdAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
    adminId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['super', 'constituency'], default: 'constituency' },
    constituency: String,
    permissions: [String],
    lastLogin: Date,
    createdAt: { type: Date, default: Date.now }
});

const candidateSchema = new mongoose.Schema({
    candidateId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    party: { type: String, required: true },
    partySymbol: String,
    constituency: { type: String, required: true },
    state: { type: String, required: true },
    photo: String,
    votes: { type: Number, default: 0 },
    criminalCases: Number,
    assets: String,
    liabilities: String,
    education: String
});

const electionSchema = new mongoose.Schema({
    electionId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['Lok Sabha', 'Assembly', 'Municipal'] },
    state: String,
    constituencies: [String],
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
    totalVoters: Number,
    votesCast: { type: Number, default: 0 },
    resultsPublished: { type: Boolean, default: false }
});

const OTPschema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Candidate = mongoose.model('Candidate', candidateSchema);
const Election = mongoose.model('Election', electionSchema);
const OTP = mongoose.model('OTP', OTPschema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes

// 1. User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { voterId, fullName, dateOfBirth, email, phone, address, constituency, state } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ voterId }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already registered' });
        }
        
        const user = new User({
            voterId,
            fullName,
            dateOfBirth,
            email,
            phone,
            address,
            constituency,
            state
        });
        
        await user.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// 2. User Login
app.post('/api/user/login', async (req, res) => {
    try {
        const { voterId, dateOfBirth } = req.body;
        
        const user = await User.findOne({ voterId, dateOfBirth });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (user.hasVoted) {
            return res.status(400).json({ error: 'You have already voted' });
        }
        
        const token = jwt.sign(
            { userId: user._id, voterId: user.voterId, constituency: user.constituency },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        
        res.json({ token, user: { name: user.fullName, constituency: user.constituency } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// 3. Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { adminId, password } = req.body;
        
        const admin = await Admin.findOne({ adminId });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP to database
        await OTP.create({
            email: admin.email,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60000) // 10 minutes
        });
        
        // Send OTP via email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: admin.email,
            subject: 'OTP for Admin Login - Election Commission',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border-left: 5px solid #138808;">
                        <h2 style="color: #000080; border-bottom: 2px solid #FF9933; padding-bottom: 10px;">Election Commission of India</h2>
                        <h3 style="color: #333;">Your OTP for Admin Login</h3>
                        <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                            <h1 style="color: #138808; letter-spacing: 10px; margin: 0;">${otp}</h1>
                        </div>
                        <p style="color: #666;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
                        <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please contact the system administrator immediately.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Election Commission of India. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        
        res.json({ message: 'OTP sent to registered email', adminId: admin._id });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Admin login failed' });
    }
});

// 4. Verify OTP for Admin
app.post('/api/admin/verify-otp', async (req, res) => {
    try {
        const { adminId, otp } = req.body;
        
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        const otpRecord = await OTP.findOne({ 
            email: admin.email, 
            otp,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        
        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        
        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });
        
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        
        const token = jwt.sign(
            { 
                adminId: admin._id, 
                adminId: admin.adminId, 
                name: admin.name,
                role: admin.role,
                constituency: admin.constituency,
                permissions: admin.permissions 
            },
            JWT_SECRET,
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
    } catch (error) {
        res.status(500).json({ error: 'OTP verification failed' });
    }
});

// 5. Get Candidates by Constituency
app.get('/api/candidates/:constituency', authenticateToken, async (req, res) => {
    try {
        const candidates = await Candidate.find({ constituency: req.params.constituency });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

// 6. Cast Vote
app.post('/api/vote', authenticateToken, async (req, res) => {
    try {
        const { candidateId } = req.body;
        const userId = req.user.userId;
        
        // Check if user exists and hasn't voted
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.hasVoted) {
            return res.status(400).json({ error: 'You have already voted' });
        }
        
        // Check if candidate exists
        const candidate = await Candidate.findOne({ candidateId });
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        
        // Update candidate vote count
        candidate.votes += 1;
        await candidate.save();
        
        // Update user voting status
        user.hasVoted = true;
        user.votedFor = candidateId;
        user.voteTimestamp = new Date();
        await user.save();
        
        // Update election stats
        await Election.updateOne(
            { constituencies: user.constituency, status: 'ongoing' },
            { $inc: { votesCast: 1 } }
        );
        
        res.json({ 
            message: 'Vote cast successfully',
            receipt: {
                voterId: user.voterId,
                candidateName: candidate.name,
                party: candidate.party,
                timestamp: new Date(),
                voteId: `VOTE${Date.now()}${Math.random().toString(36).substr(2, 9)}`
            }
        });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Failed to cast vote' });
    }
});

// 7. Get Election Results (Admin only)
app.get('/api/election/results', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'super' && req.user.role !== 'constituency') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const { constituency, state } = req.query;
        
        let query = {};
        if (constituency && req.user.role === 'constituency') {
            query.constituency = constituency;
        } else if (state) {
            query.state = state;
        }
        
        const results = await Candidate.find(query)
            .sort({ votes: -1 })
            .select('name party constituency votes');
        
        const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0);
        
        res.json({ results, totalVotes, timestamp: new Date() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// 8. Get Dashboard Stats (Admin)
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
    try {
        if (!req.user.role) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const admin = req.user;
        
        let stats = {};
        
        if (admin.role === 'super') {
            // Super admin sees all stats
            stats.totalVoters = await User.countDocuments();
            stats.votesCast = await User.countDocuments({ hasVoted: true });
            stats.voterTurnout = ((stats.votesCast / stats.totalVoters) * 100).toFixed(2);
            stats.totalCandidates = await Candidate.countDocuments();
            stats.ongoingElections = await Election.countDocuments({ status: 'ongoing' });
            stats.totalConstituencies = (await Election.distinct('constituencies')).length;
        } else {
            // Constituency admin sees only their constituency stats
            stats.totalVoters = await User.countDocuments({ constituency: admin.constituency });
            stats.votesCast = await User.countDocuments({ 
                constituency: admin.constituency, 
                hasVoted: true 
            });
            stats.voterTurnout = stats.totalVoters > 0 ? 
                ((stats.votesCast / stats.totalVoters) * 100).toFixed(2) : 0;
            stats.totalCandidates = await Candidate.countDocuments({ constituency: admin.constituency });
            stats.topCandidates = await Candidate.find({ constituency: admin.constituency })
                .sort({ votes: -1 })
                .limit(5)
                .select('name party votes');
        }
        
        res.json({ stats, admin: { name: admin.name, role: admin.role, constituency: admin.constituency } });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// 9. Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-__v');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// 10. Get Current Elections
app.get('/api/elections/current', async (req, res) => {
    try {
        const elections = await Election.find({ 
            status: 'ongoing',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });
        
        res.json(elections);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch elections' });
    }
});

// 11. Add Candidate (Admin)
app.post('/api/admin/candidates', authenticateToken, async (req, res) => {
    try {
        if (!req.user.role || !req.user.permissions?.includes('manage_candidates')) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        const candidate = new Candidate(req.body);
        await candidate.save();
        
        res.status(201).json({ message: 'Candidate added successfully', candidate });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add candidate' });
    }
});

// 12. Add Admin (Super Admin only)
app.post('/api/admin/create', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'super') {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        const { adminId, name, email, password, role, constituency, permissions } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const admin = new Admin({
            adminId,
            name,
            email,
            password: hashedPassword,
            role,
            constituency,
            permissions
        });
        
        await admin.save();
        
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

// 13. Check Voting Status
app.get('/api/user/voting-status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('hasVoted voteTimestamp votedFor');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        let candidateInfo = null;
        if (user.hasVoted && user.votedFor) {
            candidateInfo = await Candidate.findOne({ candidateId: user.votedFor })
                .select('name party');
        }
        
        res.json({
            hasVoted: user.hasVoted,
            voteTimestamp: user.voteTimestamp,
            candidate: candidateInfo
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check voting status' });
    }
});

// 14. Initialize Demo Data (For testing only - remove in production)
app.post('/api/init-demo', async (req, res) => {
    try {
        // Create demo admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Admin({
            adminId: 'ADMIN001',
            name: 'Election Commissioner',
            email: 'admin@eci.gov.in',
            password: hashedPassword,
            role: 'super',
            permissions: ['all']
        });
        await admin.save();
        
        // Create demo candidates
        const candidates = [
            {
                candidateId: 'CAND001',
                name: 'Rajesh Kumar',
                party: 'Bharatiya Janata Party',
                partySymbol: 'Lotus',
                constituency: 'Bangalore North',
                state: 'Karnataka',
                votes: 24500
            },
            {
                candidateId: 'CAND002',
                name: 'Priya Sharma',
                party: 'Indian National Congress',
                partySymbol: 'Hand',
                constituency: 'Bangalore North',
                state: 'Karnataka',
                votes: 19800
            },
            {
                candidateId: 'CAND003',
                name: 'Amit Patel',
                party: 'Aam Aadmi Party',
                partySymbol: 'Broom',
                constituency: 'Bangalore North',
                state: 'Karnataka',
                votes: 15600
            }
        ];
        
        await Candidate.insertMany(candidates);
        
        // Create demo election
        const election = new Election({
            electionId: 'ELEC2024',
            name: 'General Elections 2024',
            type: 'Lok Sabha',
            state: 'Karnataka',
            constituencies: ['Bangalore North', 'Bangalore South', 'Bangalore Central'],
            startDate: new Date('2024-04-01'),
            endDate: new Date('2024-05-31'),
            status: 'ongoing',
            totalVoters: 500000,
            votesCast: 59900
        });
        
        await election.save();
        
        res.json({ message: 'Demo data initialized successfully' });
    } catch (error) {
        console.error('Init demo error:', error);
        res.status(500).json({ error: 'Failed to initialize demo data' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('MongoDB Connected');
});