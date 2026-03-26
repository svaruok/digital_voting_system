import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || 'https://digital-voting-system-2-p2gy.onrender.com';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState('');
  const [chainOk, setChainOk] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [stats, setStats] = useState({});

  const SEPOLIA_CHAIN_ID = '0xaa36a7';

  useEffect(() => {
    fetchProfile();
    fetchStats();
    checkWallet();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
      toast.error(t('profileError') || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/api/admin/stats`);
      setStats(data);
    } catch {}
  };

  const checkWallet = async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWallet(accounts[0]);
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainOk(chainId === SEPOLIA_CHAIN_ID);
      }
    } catch {}
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error(t('noMetaMask') || 'MetaMask not found!');
      return;
    }
    setConnectingWallet(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts[0]);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }]
      });
      setChainOk(true);
      toast.success(t('walletConnected') || 'MetaMask connected!');
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://rpc.sepolia.org'],
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
        setChainOk(true);
      } else {
        toast.error(t('walletError') || 'Please switch to Sepolia');
      }
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success(t('loggedOut') || 'Logged out successfully');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('loadingProfile') || 'Loading your profile...'}</p>
      </div>
    );
  }

  const isVoted = user?.hasVoted;

  return (
    <div className="dashboard">
      {/* Hero Header */}
      <div className="hero-header">
        <div className="welcome-section">
          <h1>{t('welcome')} {user?.fullName?.split(' ')[0]} 👋</h1>
          <div className="status-badge voted-{isVoted ? 'yes' : 'no'}">
            {isVoted ? (
              <>
                <i className="fas fa-check-circle"></i>
                {t('voted') || 'Voted Successfully'}
              </>
            ) : (
              <>
                <i className="fas fa-clock"></i>
                {t('readyToVote') || 'Ready to Vote'}
              </>
            )}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          {t('logout') || 'Logout'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card election">
          <i className="fas fa-vote-yea"></i>
          <div>
            <h3>{stats.activeElections || 1}</h3>
            <p>{t('activeElections') || 'Active Elections'}</p>
          </div>
        </div>
        <div className="stat-card turnout">
          <i className="fas fa-chart-line"></i>
          <div>
            <h3>{stats.turnout || '0%'}</h3>
            <p>{t('turnout') || 'Voter Turnout'}</p>
          </div>
        </div>
        <div className="stat-card candidates">
          <i className="fas fa-users"></i>
          <div>
            <h3>{stats.totalCandidates || 4}</h3>
            <p>{t('candidates') || 'Candidates'}</p>
          </div>
        </div>
        <div className="stat-card voters">
          <i className="fas fa-user-check"></i>
          <div>
            <h3>{stats.totalVoters || 0}</h3>
            <p>{t('registeredVoters') || 'Registered Voters'}</p>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="action-section">
        {!isVoted && (
          <div className="vote-now-card">
            <div className="vote-icon">🗳️</div>
            <h2>{t('yourVoteAwaits') || 'Your Vote Awaits'}</h2>
            <p>{t('makeVoiceHeard') || 'Make your voice heard in democracy'}</p>
            <button className="primary-btn" onClick={() => navigate('/vote')}>
              {t('voteNow') || 'Vote Now'}
            </button>
          </div>
        )}

        {/* Wallet Card */}
        <div className="wallet-card">
          <h3><i className="fab fa-ethereum"></i> {t('blockchainWallet') || 'Blockchain Wallet'}</h3>
          {wallet ? (
            <div className={`wallet-status ${chainOk ? 'success' : 'warning'}`}>
              <span>{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
              <span>{chainOk ? 'Sepolia ✓' : 'Switch to Sepolia ⚠'}</span>
            </div>
          ) : (
            <button className="wallet-connect-btn" onClick={connectWallet} disabled={connectingWallet}>
              {connectingWallet ? (
                <><i className="fas fa-spinner fa-spin"></i> {t('connecting') || 'Connecting...'}</>
              ) : (
                <><i className="fas fa-wallet"></i> {t('connectWallet') || 'Connect MetaMask'}</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <h3><i className="fas fa-id-card"></i> {t('voterProfile') || 'Voter Profile'}</h3>
        <div className="profile-grid">
          {[
            ['voterId', t('voterId') || 'Voter ID', user?.voterId],
            ['fullName', t('fullName') || 'Full Name', user?.fullName],
            ['dob', t('dob') || 'Date of Birth', user?.dateOfBirth],
            ['email', t('email') || 'Email', user?.email],
            ['phone', t('phone') || 'Phone', user?.phone],
            ['state', t('state') || 'State', user?.state],
            ['registered', t('registeredOn') || 'Registered On', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'],
          ].map(([key, label, value]) => (
            <div className="profile-item" key={key}>
              <span className="label">{label}</span>
              <span className="value">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
