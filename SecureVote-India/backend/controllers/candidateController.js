const Candidate = require("../models/candidate");


// ADD CANDIDATE (ADMIN)
exports.addCandidate = async (req, res) => {

  const { name, party } = req.body;

  try {

    const candidate = new Candidate({
      name,
      party
    });

    await candidate.save();

    res.json({
      message: "Candidate Added Successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// GET ALL CANDIDATES
exports.getCandidates = async (req, res) => {

  try {

    const candidates = await Candidate.find();
    res.json(candidates);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
