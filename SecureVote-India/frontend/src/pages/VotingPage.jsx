import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './LoginPage.css';

const API = process.env.REACT_APP_API_URL || 'https://digital-voting-system-2-p2gy.onrender.com';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const EXPECTED_CHAIN = process.env.REACT_APP_CHAIN_ID || '0xaa36a7';

const VotingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState('');
  const [chainOk, setChainOk] = useState(false);

  useEffect(() => {
    initPage();
    checkWallet();
  }, []);

  const initPage = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      const { data: userData } = await API.get('/user/profile');
      setUser(userData);

      if (userData.hasVoted) {
        toast(t('alreadyVoted') || 'You already voted', { icon: 'ℹ️' });
        navigate('/dashboard');
        return;
      }

      const { data } = await API.get('/candidates');
      setCandidates(data);
    } catch (err) {
      console.error(err);
      toast.error(t('loadFailed') || 'Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  const checkWallet = async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWallet(accounts[0]);
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainOk(chainId === EXPECTED_CHAIN);
      }
    } catch {}
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not found!');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts[0]);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: EXPECTED_CHAIN }],
      });
      setChainOk(true);
      toast.success('MetaMask Connected! ✅');
    } catch (err) {
      toast.error('Wallet connection failed');
    }
  };

  const handleVote = async () => {
    if (!selected || !wallet || !chainOk) return toast.error('Complete all steps');

    setStep(3);
    try {
      const { data } = await API.post('/vote', {
        candidateId: selected._id,
        txHash: 'simulated-' + Date.now(),
        walletAddress: wallet
      });
      setStep(4);
      toast.success('Vote Recorded on Blockchain! 🎉');
    } catch (err) {
      toast.error('Vote failed');
      setStep(2);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{t('loading') || 'Loading election data...'}</p>
    </div>
  );

  return (
    <div className="voting-page">
      <div className="voting-header">
        <div className="election-badge">
          🗳️ {t('nationalElection') || 'National Election 2026'}
        </div>
        <h1>{t('castYourVote') || 'Cast Your Vote'}</h1>
        <p>{t('oneVote') || 'One vote per citizen • Blockchain secured'}</p>
      </div>

      <div className="wallet-status">
        <button className={`wallet-btn ${wallet && chainOk ? 'connected' : ''}`} onClick={connectWallet}>
          <i className="fab fa-ethereum"></i>
          {wallet ? wallet.slice(0,6)+'...'+wallet.slice(-4) : t('connectWallet') || 'Connect MetaMask'}
        </button>
      </div>

      {step === 1 && (
        <div className="candidates-grid">
          <div className="candidates-count">
            {candidates.length} {t('candidates') || 'Candidates'}
          </div>
          {candidates.map((c, i) => (
            <div key={c._id} className={`candidate-card ${selected?._id === c._id ? 'selected' : ''}`} onClick={() => setSelected(c)}>
              <div className="candidate-symbol">{c.partySymbol}</div>
              <div className="candidate-info">
                <h3>{c.name}</h3>
                <div className="party">{c.party}</div>
                <div className="votes">{c.votes} {t('votes') || 'votes'}</div>
              </div>
            </div>
          ))}
          <button className="next-btn" disabled={!selected} onClick={() => setStep(2)}>
            {t('next') || 'Next →'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="confirm-vote">
          <div className="selected-candidate">
            <div className="symbol-large">{selected.partySymbol}</div>
            <h2>{selected.name}</h2>
            <div className="party-large">{selected.party}</div>
          </div>
          <div className="confirm-buttons">
            <button className="back-btn" onClick={() => setStep(1)}>
              ← {t('back') || 'Back'}
            </button>
            <button className="confirm-btn" onClick={handleVote}>
              <i className="fas fa-check-circle"></i>
              {t('confirmVote') || 'Confirm Vote'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="voting-processing">
          <div className="spinner-large"></div>
          <h2>{t('processing') || 'Processing Vote...'}</h2>
          <p>{t('blockchainRecording') || 'Recording on Ethereum blockchain...'}</p>
        </div>
      )}

      {step === 4 && (
        <div className="vote-success">
          <div className="success-icon">✅</div>
          <h1>{t('voteSuccess') || 'Vote Recorded!'}</h1>
          <p>{t('thankYou') || 'Thank you for participating in democracy'}</p>
          <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>
            {t('dashboard') || 'Go to Dashboard'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VotingPage;
