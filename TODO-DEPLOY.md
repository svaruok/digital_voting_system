# Deploy Digital Voting System - Progress Tracker (Root level)

Status: 1/8

## Prerequisites
- [x] GitHub repo: https://github.com/svaruok/digital_voting_system ✓ Pushed
- [ ] MongoDB Atlas cluster created? 
- [ ] Render.com & Vercel accounts

## Steps:
- [x] 1. Git push complete
- [ ] 2. Backend: Create Render Web Service (SecureVote-India/backend, npm install, npm run start, copy .env vars)
- [ ] 3. Get Backend URL (e.g. https://digital-voting-backend.onrender.com)
- [ ] 4. Frontend: Vercel project (SecureVote-India/frontend), set REACT_APP_API_URL=backend_url/api
- [ ] 5. Update CORS in backend/server.js for Vercel URL
- [ ] 6. Git commit/push, auto-redeploy
- [ ] 7. Test prod login/voting
- [ ] 8. Share live links!

**Backend .env vars to copy to Render:**
```
MONGO_URI=mongodb+srv://... (Atlas)
JWT_SECRET=your_secret
GMAIL_USER=your@gmail.com
GMAIL_PASS=app_password
INIT_SECRET=secret_for_demo
PORT=10000 (Render)
```

**CORS update needed:** backend/server.js has origin: '*'
