const Candidate = require('../models/candidate');

// ADD
exports.addCandidate = async (req, res) => {
  const { name, party, partySymbol, constituency, manifesto } = req.body;

  if (!name || !party) {
    return res.status(400).json({ error: 'Name and party required' });
  }

  try {
    const candidate = new Candidate({
      name: name.trim(),
      party: party.trim(),
      partySymbol: partySymbol || '🗳️',
      constituency: constituency || "India",
      manifesto: manifesto || ''
    });

    await candidate.save();
    res.status(201).json({ message: 'Candidate added', candidate });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
};


// GET ALL (ALL INDIA)
exports.getCandidatesByConstituency = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ name: 1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
};


// DELETE
exports.deleteCandidate = async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
};