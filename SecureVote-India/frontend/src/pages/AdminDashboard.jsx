import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
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
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const statsResponse = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAdminData(statsResponse.data.admin);
      setStats(statsResponse.data.stats);
      
      // Fetch election results if super admin
      if (statsResponse.data.admin.role === 'super') {
        const resultsResponse = await axios.get('http://localhost:5000/api/election/results', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(resultsResponse.data.results);
      }
      
      // Mock recent activities
      setRecentActivities([
        { id: 1, action: 'Vote Cast', user: 'Voter123', time: '2 minutes ago', icon: 'fa-vote-yea' },
        { id: 2, action: 'System Login', user: 'Admin001', time: '5 minutes ago', icon: 'fa-sign-in-alt' },
        { id: 3, action: 'Report Generated', user: 'System', time: '10 minutes ago', icon: 'fa-file-alt' },
        { id: 4, action: 'New Voter Registered', user: 'Voter456', time: '15 minutes ago', icon: 'fa-user-plus' },
        { id: 5, action: 'Security Audit', user: 'System', time: '30 minutes ago', icon: 'fa-shield-alt' }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load dashboard');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleAddCandidate = () => {
    toast.success('Add candidate feature coming soon!');
  };

  const handleViewReports = () => {
    toast.success('Report generation feature coming soon!');
  };

  const handleManageUsers = () => {
    toast.success('User management feature coming soon!');
  };

  const handleGenerateResults = () => {
    toast.success('Results generation feature coming soon!');
  };

  // Prepare chart data
  const turnoutChartData = {
    labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM'],
    datasets: [
      {
        label: 'Voter Turnout',
        data: [12, 19, 25, 32, 40, 48, 55],
        borderColor: 'rgb(255, 153, 51)',
        backgroundColor: 'rgba(255, 153, 51, 0.2)',
        tension: 0.4
      }
    ]
  };

  const partyDistributionData = {
    labels: stats?.topCandidates?.map(c => c.party) || ['BJP', 'INC', 'AAP', 'BSP', 'Others'],
    datasets: [
      {
        data: stats?.topCandidates?.map(c => c.votes) || [45, 30, 15, 5, 5],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ]
      }
    ]
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      {/* Header */}
      <div className="dashboard-header admin-header">
        <div className="welcome-section">
          <h1>
            <i className="fas fa-user-shield"></i> Admin Dashboard
          </h1>
          <div className="admin-info">
            <p>
              <strong>Admin:</strong> {adminData?.name} | 
              <strong> Role:</strong> {adminData?.role} | 
              {adminData?.constituency && <><strong> Constituency:</strong> {adminData.constituency}</>}
            </p>
            <p className="last-login">
              <i className="fas fa-clock"></i> Last Login: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleGenerateResults}>
            <i className="fas fa-chart-pie"></i> Generate Results
          </button>
          <button className="btn btn-outline" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-tachometer-alt"></i> Overview
        </button>
        <button 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <i className="fas fa-chart-bar"></i> Results
        </button>
        <button 
          className={`tab ${activeTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidates')}
        >
          <i className="fas fa-user-tie"></i> Candidates
        </button>
        <button 
          className={`tab ${activeTab === 'voters' ? 'active' : ''}`}
          onClick={() => setActiveTab('voters')}
        >
          <i className="fas fa-users"></i> Voters
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <i className="fas fa-file-alt"></i> Reports
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-voters">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>Total Voters</h3>
            <p className="stat-number">{stats?.totalVoters?.toLocaleString() || '0'}</p>
            <p className="stat-change">
              <i className="fas fa-arrow-up"></i> 12% from last election
            </p>
          </div>
        </div>

        <div className="stat-card votes-cast">
          <div className="stat-icon">
            <i className="fas fa-vote-yea"></i>
          </div>
          <div className="stat-content">
            <h3>Votes Cast</h3>
            <p className="stat-number">{stats?.votesCast?.toLocaleString() || '0'}</p>
            <p className="stat-change">
              <i className="fas fa-chart-line"></i> {stats?.voterTurnout || '0'}% turnout
            </p>
          </div>
        </div>

        <div className="stat-card total-candidates">
          <div className="stat-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="stat-content">
            <h3>Candidates</h3>
            <p className="stat-number">{stats?.totalCandidates || '0'}</p>
            <p className="stat-change">
              <i className="fas fa-plus"></i> {stats?.topCandidates?.length || '0'} leading
            </p>
          </div>
        </div>

        <div className="stat-card ongoing-elections">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>Ongoing Elections</h3>
            <p className="stat-number">{stats?.ongoingElections || '0'}</p>
            <p className="stat-change">
              <i className="fas fa-clock"></i> Active now
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3><i className="fas fa-chart-line"></i> Voter Turnout Trend</h3>
          <div className="chart-container">
            <Line 
              data={turnoutChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Hourly Voter Turnout'
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3><i className="fas fa-chart-pie"></i> Party Distribution</h3>
          <div className="chart-container">
            <Pie 
              data={partyDistributionData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Candidates & Recent Activities */}
      <div className="info-grid">
        {/* Top Candidates */}
        <div className="card top-candidates-card">
          <h3><i className="fas fa-trophy"></i> Top Candidates</h3>
          <div className="candidates-list">
            {stats?.topCandidates?.map((candidate, index) => (
              <div key={index} className="candidate-item">
                <div className="candidate-rank">
                  <span className={`rank-badge rank-${index + 1}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="candidate-details">
                  <h4>{candidate.name}</h4>
                  <p className="candidate-party">{candidate.party}</p>
                </div>
                <div className="candidate-votes">
                  <span className="votes-count">{candidate.votes?.toLocaleString()}</span>
                  <span className="votes-label">votes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card activities-card">
          <h3><i className="fas fa-history"></i> Recent Activities</h3>
          <div className="activities-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <i className={`fas ${activity.icon}`}></i>
                </div>
                <div className="activity-details">
                  <h4>{activity.action}</h4>
                  <p>{activity.user} • {activity.time}</p>
                </div>
                <div className="activity-status">
                  <span className="status-dot"></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={handleAddCandidate}>
            <i className="fas fa-user-plus"></i>
            <span>Add Candidate</span>
          </button>
          <button className="action-btn" onClick={handleManageUsers}>
            <i className="fas fa-user-cog"></i>
            <span>Manage Voters</span>
          </button>
          <button className="action-btn" onClick={handleViewReports}>
            <i className="fas fa-file-export"></i>
            <span>Generate Reports</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-cogs"></i>
            <span>System Settings</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-shield-alt"></i>
            <span>Security Audit</span>
          </button>
          <button className="action-btn">
            <i className="fas fa-database"></i>
            <span>Backup Data</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="system-status">
        <h3><i className="fas fa-server"></i> System Status</h3>
        <div className="status-grid">
          <div className="status-item online">
            <i className="fas fa-check-circle"></i>
            <div>
              <h4>Voting System</h4>
              <p>Operational</p>
            </div>
          </div>
          <div className="status-item online">
            <i className="fas fa-check-circle"></i>
            <div>
              <h4>Database</h4>
              <p>Connected</p>
            </div>
          </div>
          <div className="status-item online">
            <i className="fas fa-check-circle"></i>
            <div>
              <h4>Security</h4>
              <p>Active</p>
            </div>
          </div>
          <div className="status-item warning">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <h4>Backup</h4>
              <p>Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;