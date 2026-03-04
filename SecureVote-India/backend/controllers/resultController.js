const Candidate = require("../models/candidate");

exports.getResults = async (req, res) => {

  try {

    const results = await Candidate.find().sort({ votes: -1 });

    res.json(results);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
