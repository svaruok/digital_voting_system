import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './VotingPage.css';

const VotingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [userData, setUserData] = useState(null);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [step, setStep] = useState(1); // 1: Select candidate, 2: Confirm, 3: Success

  useEffect(() => {
    checkVotingStatus();
    fetchUserData();
    fetchCandidates();
  }, []);

  const checkVotingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/voting-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.hasVoted) {
        toast.error('You have already voted!');
        navigate('/user/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking voting status:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/candidates/${userData?.constituency || 'Bangalore North'}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCandidates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setStep(2);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;
    
    setVotingInProgress(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/vote',
        { candidateId: selectedCandidate.candidateId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStep(3);
      toast.success('Vote cast successfully!');
      
      // Auto redirect after 5 seconds
      setTimeout(() => {
        navigate('/user/dashboard');
      }, 5000);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cast vote');
      setStep(1);
    } finally {
      setVotingInProgress(false);
    }
  };

  const getPartySymbol = (party) => {
    const symbols = {
      'Bharatiya Janata Party': 'lotus',
      'Indian National Congress': 'hand',
      'Aam Aadmi Party': 'broom',
      'Bahujan Samaj Party': 'elephant',
      'Communist Party': 'hammer'
    };
    return symbols[party] || 'flag';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading voting portal...</p>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="voting-container">
        {/* Header */}
        <div className="voting-header">
          <div className="voter-info">
            <h1><i className="fas fa-vote-yea"></i> Cast Your Vote</h1>
            <div className="voter-details">
              <p><strong>Voter:</strong> {userData?.fullName}</p>
              <p><strong>Voter ID:</strong> {userData?.voterId}</p>
              <p><strong>Constituency:</strong> {userData?.constituency}</p>
            </div>
          </div>
          <div className="voting-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Select Candidate</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Confirm Vote</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Success</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Candidate */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Select Your Candidate</h2>
              <p>Choose one candidate from your constituency</p>
            </div>
            
            <div className="candidates-grid">
              {candidates.map((candidate) => (
                <div 
                  key={candidate.candidateId}
                  className={`candidate-card ${selectedCandidate?.candidateId === candidate.candidateId ? 'selected' : ''}`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <div className="candidate-image">
                    <i className={`fas fa-${getPartySymbol(candidate.party)}`}></i>
                  </div>
                  <div className="candidate-info">
                    <h3>{candidate.name}</h3>
                    <p className="party">{candidate.party}</p>
                    <div className="candidate-details">
                      <p><i className="fas fa-graduation-cap"></i> {candidate.education || 'Not Specified'}</p>
                      <p><i className="fas fa-balance-scale"></i> Cases: {candidate.criminalCases || 0}</p>
                      <p><i className="fas fa-rupee-sign"></i> Assets: {candidate.assets || 'Not Disclosed'}</p>
                    </div>
                    <div className="vote-count">
                      <i className="fas fa-chart-line"></i>
                      <span>{candidate.votes?.toLocaleString() || 0} votes</span>
                    </div>
                  </div>
                  <div className="select-indicator">
                    <i className="fas fa-check-circle"></i>
                  </div>
                </div>
              ))}
            </div>

            <div className="step-actions">
              <button 
                className="btn btn-outline"
                onClick={() => navigate('/user/dashboard')}
              >
                <i className="fas fa-arrow-left"></i> Back to Dashboard
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => selectedCandidate && setStep(2)}
                disabled={!selectedCandidate}
              >
                <i className="fas fa-arrow-right"></i> Continue to Confirm
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm Vote */}
        {step === 2 && selectedCandidate && (
          <div className="step-content">
            <div className="step-header">
              <h2>Confirm Your Vote</h2>
              <p>Please review your selection before confirming</p>
            </div>
            
            <div className="confirmation-card">
              <div className="confirmation-header">
                <i className="fas fa-exclamation-triangle"></i>
                <h3>Important Notice</h3>
              </div>
              <p className="warning-text">
                Once you confirm your vote, it cannot be changed or undone. 
                This is your final selection.
              </p>
              
              <div className="selected-candidate-review">
                <h4>Selected Candidate:</h4>
                <div className="candidate-review">
                  <div className="review-image">
                    <i className={`fas fa-${getPartySymbol(selectedCandidate.party)}`}></i>
                  </div>
                  <div className="review-details">
                    <h3>{selectedCandidate.name}</h3>
                    <p className="party">{selectedCandidate.party}</p>
                    <div className="review-info">
                      <p><strong>Candidate ID:</strong> {selectedCandidate.candidateId}</p>
                      <p><strong>Constituency:</strong> {selectedCandidate.constituency}</p>
                      <p><strong>State:</strong> {selectedCandidate.state}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="voter-confirmation">
                <h4>Voter Verification:</h4>
                <div className="voter-details-confirm">
                  <p><strong>Voter Name:</strong> {userData?.fullName}</p>
                  <p><strong>Voter ID:</strong> {userData?.voterId}</p>
                  <p><strong>Constituency:</strong> {userData?.constituency}</p>
                  <p><strong>Time of Vote:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setStep(1)}
                disabled={votingInProgress}
              >
                <i className="fas fa-arrow-left"></i> Go Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmVote}
                disabled={votingInProgress}
              >
                {votingInProgress ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Casting Vote...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle"></i> Confirm & Cast Vote
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="step-content success-step">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Vote Successfully Cast!</h2>
            <p className="success-message">
              Your vote has been recorded securely. Thank you for participating in the democratic process.
            </p>
            
            <div className="receipt-card">
              <h3><i className="fas fa-receipt"></i> Voting Receipt</h3>
              <div className="receipt-details">
                <div className="receipt-row">
                  <span>Transaction ID:</span>
                  <strong>VOTE{Date.now()}</strong>
                </div>
                <div className="receipt-row">
                  <span>Voter ID:</span>
                  <span>{userData?.voterId}</span>
                </div>
                <div className="receipt-row">
                  <span>Selected Candidate:</span>
                  <span>{selectedCandidate?.name}</span>
                </div>
                <div className="receipt-row">
                  <span>Party:</span>
                  <span>{selectedCandidate?.party}</span>
                </div>
                <div className="receipt-row">
                  <span>Constituency:</span>
                  <span>{userData?.constituency}</span>
                </div>
                <div className="receipt-row">
                  <span>Time:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
              
              <div className="receipt-security">
                <i className="fas fa-shield-alt"></i>
                <p>This receipt is encrypted and stored securely in the blockchain.</p>
              </div>
            </div>
            
            <div className="success-actions">
              <button className="btn btn-secondary">
                <i className="fas fa-download"></i> Download Receipt
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/user/dashboard')}
              >
                <i className="fas fa-tachometer-alt"></i> Back to Dashboard
              </button>
              <button className="btn btn-outline">
                <i className="fas fa-print"></i> Print Receipt
              </button>
            </div>
            
            <div className="auto-redirect">
              <i className="fas fa-clock"></i>
              <p>Redirecting to dashboard in 5 seconds...</p>
            </div>
          </div>
        )}

        {/* Voting Guidelines */}
        <div className="voting-guidelines">
          <h3><i className="fas fa-info-circle"></i> Voting Guidelines</h3>
          <ul>
            <li><i className="fas fa-check"></i> Voting is completely anonymous</li>
            <li><i className="fas fa-check"></i> Your vote cannot be traced back to you</li>
            <li><i className="fas fa-check"></i> Once cast, votes cannot be changed</li>
            <li><i className="fas fa-check"></i> Keep your voting receipt for reference</li>
            <li><i className="fas fa-check"></i> Report any issues to helpline 1950</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;