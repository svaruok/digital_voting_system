import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [votingStatus, setVotingStatus] = useState(null);
  const [electionData, setElectionData] = useState(null);
  const [constituencyStats, setConstituencyStats] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchVotingStatus();
    fetchElectionData();
  }, []);

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

  const fetchVotingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/voting-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVotingStatus(response.data);
    } catch (error) {
      console.error('Error fetching voting status:', error);
    }
  };

  const fetchElectionData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/elections/current');
      if (response.data.length > 0) {
        setElectionData(response.data[0]);
        fetchConstituencyStats(response.data[0].constituencies[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching election data:', error);
      setLoading(false);
    }
  };

  const fetchConstituencyStats = async (constituency) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/candidates/${constituency}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConstituencyStats(response.data);
    } catch (error) {
      console.error('Error fetching constituency stats:', error);
    }
  };

  const handleProceedToVote = () => {
    navigate('/vote');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Prepare chart data
  const candidateChartData = {
    labels: constituencyStats?.map(c => c.party) || [],
    datasets: [
      {
        label: 'Votes',
        data: constituencyStats?.map(c => c.votes) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="dashboard user-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>
            <i className="fas fa-user-circle"></i> Welcome, {userData?.fullName || 'Voter'}
          </h1>
          <p>Voter ID: {userData?.voterId} | Constituency: {userData?.constituency}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleProceedToVote}>
            <i className="fas fa-vote-yea"></i> Proceed to Vote
          </button>
          <button className="btn btn-outline" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Voting Status Card */}
        <div className={`status-card ${votingStatus?.hasVoted ? 'voted' : 'not-voted'}`}>
          <div className="status-icon">
            {votingStatus?.hasVoted ? (
              <i className="fas fa-check-circle"></i>
            ) : (
              <i className="fas fa-clock"></i>
            )}
          </div>
          <div className="status-content">
            <h3>Voting Status</h3>
            {votingStatus?.hasVoted ? (
              <>
                <p className="status-text">You have already voted</p>
                <p className="status-detail">
                  Voted for: <strong>{votingStatus.candidate?.name}</strong>
                </p>
                <p className="status-detail">
                  Party: <strong>{votingStatus.candidate?.party}</strong>
                </p>
                <p className="status-time">
                  <i className="fas fa-clock"></i> 
                  {new Date(votingStatus.voteTimestamp).toLocaleString()}
                </p>
              </>
            ) : (
              <>
                <p className="status-text">You haven't voted yet</p>
                <p className="status-note">
                  <i className="fas fa-info-circle"></i>
                  Please proceed to cast your vote
                </p>
              </>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="card profile-card">
          <h3><i className="fas fa-id-card"></i> Voter Profile</h3>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <span className="info-value">{userData?.fullName}</span>
            </div>
            <