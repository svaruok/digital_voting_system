const express = require('express');
const router = express.Router();

const {
  addCandidate,
  getCandidatesByConstituency,
  deleteCandidate
} = require('../controllers/candidateController');

router.post('/admin/candidates', addCandidate);
router.get('/', getCandidatesByConstituency);
router.get('/candidates', getCandidatesByConstituency);
router.delete('/admin/candidates/:id', deleteCandidate);

module.exports = router;
