# All-India Voting Fix (No Constituency Filter)

Status: 0/6

Steps:
- [ ] 1. Fix backend/server.js /api/init-demo (Candidate model import inside try)
- [ ] 2. Update backend/controllers/candidateController.js (get all candidates, no filter)
- [ ] 3. Fix backend/routes/candidateRoutes.js (router.get('/candidates'))
- [ ] 4. Update frontend/src/pages/VotingPage.jsx (API.get('/candidates'))
- [ ] 5. Run `curl -X POST http://localhost:5000/api/init-demo`
- [ ] 6. Test voting page - shows 4 candidates, vote works

**Goal:** Simple all-India election - login → vote any candidate
