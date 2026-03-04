const User = require("../models/user");

const Candidate = require("../models/candidate");

exports.castVote = async (req, res) => {

  const { userId, candidateId } = req.body;

  try {

    const user = await User.findById(userId);

    if (user.hasVoted) {
      return res.status(400).json({ message: "You already voted" });
    }

    const candidate = await Candidate.findById(candidateId);

    candidate.votes += 1;
    await candidate.save();

    user.hasVoted = true;
    await user.save();

    res.json({ message: "Vote Cast Successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
