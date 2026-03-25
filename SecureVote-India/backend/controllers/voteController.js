const mongoose = require('mongoose');
const User = require('../models/user');
const Candidate = require('../models/candidate');

exports.castVote = async (req, res) => {
  const { candidateId, txHash, walletAddress } = req.body;

  // ✅ FIX: validate ID
  if (!mongoose.isValidObjectId(candidateId)) {
    return res.status(400).json({ error: 'Invalid candidate ID' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, hasVoted: false },
      {
        hasVoted: true,
        txHash: txHash || null,
        walletAddress: walletAddress || null
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ error: 'Already voted or user not found' });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $inc: {
          votes: 1,
          blockchainVotes: txHash ? 1 : 0
        }
      },
      { new: true }
    );

    if (!candidate) {
      await User.findByIdAndUpdate(req.user.id, { hasVoted: false });
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ message: 'Vote cast successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vote failed' });
  }
};