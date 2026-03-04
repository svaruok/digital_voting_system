import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('voter');
  const [loading, setLoading] = useState(false);

  // Voter login state
  const [voterId, setVoterId] = useState('');
  const [dob, setDob] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');

  // Admin login state
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [tempAdminId, setTempAdminId] = useState('');

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCaptcha = '';
    for (let i = 0; i < 6; i++) {
      newCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(newCaptcha);
    setUserCaptcha('');
  };

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  // Handle Voter Login
  const handleVoterLogin = async (e) => {
    e.preventDefault();
    
    if (userCaptcha.toUpperCase() !== captcha) {
      toast.error('Invalid CAPTCHA. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/user/login', {
        voterId,
        dateOfBirth: dob
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', 'user');
      localStorage.setItem('userName', response.data.user.name);
      
      toast.success('Login successful!');
      navigate('/user/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!showOtp) {
      // Step 1: Send OTP
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/admin/login', {
          adminId,
          password
        });

        setTempAdminId(response.data.adminId);
        setShowOtp(true);
        toast.success('OTP sent to registered email address');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Invalid admin credentials');
      } finally {
        setLoading(false);
      }
    } else {
      // Step 2: Verify OTP
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/admin/verify-otp', {
          adminId: tempAdminId,
          otp
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.admin.role);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
        
        toast.success('Admin login successful!');
        navigate('/admin/dashboard');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Invalid OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-tabs">
          <button
            className={`tab-btn ${activeTab === 'voter' ? 'active' : ''}`}
            onClick={() => setActiveTab('voter')}
          >
            <i className="fas fa-user-check"></i> Voter Login
          </button>
          <button
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <i className="fas fa-user-shield"></i> Admin Login
          </button>
        </div>

        <div className="login-content">
          {activeTab === 'voter' ? (
            <form className="login-form" onSubmit={handleVoterLogin}>
              <div className="form-header">
                <h2><i className="fas fa-vote-yea"></i> Voter Login Portal</h2>
                <p>Enter your credentials to access the voting system</p>
              </div>

              <div className="form-group">
                <label htmlFor="voter-id">
                  <i className="fas fa-id-card"></i> Voter ID Number
                </label>
                <input
                  type="text"
                  id="voter-id"
                  className="form-input"
                  placeholder="Enter your Voter ID (e.g., ABC1234567)"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dob">
                  <i className="fas fa-calendar-alt"></i> Date of Birth
                </label>
                <input
                  type="date"
                  id="dob"
                  className="form-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <div className="captcha-section">
                <div className="captcha-display">
                  <span>{captcha}</span>
                  <button
                    type="button"
                    className="refresh-captcha-btn"
                    onClick={generateCaptcha}
                  >
                    <i className="fas fa-redo"></i>
                  </button>
                </div>
                <div className="form-group">
                  <label htmlFor="captcha-input">
                    <i className="fas fa-shield-alt"></i> Enter CAPTCHA
                  </label>
                  <input
                    type="text"
                    id="captcha-input"
                    className="form-input"
                    placeholder="Enter the characters above"
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-btn voter-login-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i> Login to Vote
                  </>
                )}
              </button>

              <div className="login-links">
                <a href="#">
                  <i className="fas fa-question-circle"></i> Forgot Voter ID?
                </a>
                <a href="#">
                  <i className="fas fa-user-plus"></i> New Voter Registration
                </a>
                <a href="#">
                  <i className="fas fa-search"></i> Check Electoral Roll
                </a>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleAdminLogin}>
              <div className="form-header">
                <h2><i className="fas fa-user-shield"></i> Admin Login Portal</h2>
                <p>Secure access for election officials</p>
              </div>

              {!showOtp ? (
                <>
                  <div className="form-group">
                    <label htmlFor="admin-id">
                      <i className="fas fa-user-tie"></i> Admin ID
                    </label>
                    <input
                      type="text"
                      id="admin-id"
                      className="form-input"
                      placeholder="Enter your Admin ID"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-password">
                      <i className="fas fa-key"></i> Password
                    </label>
                    <input
                      type="password"
                      id="admin-password"
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="security-note">
                    <i className="fas fa-info-circle"></i>
                    <p>After submitting, an OTP will be sent to your registered email address.</p>
                  </div>

                  <button
                    type="submit"
                    className="login-btn admin-login-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Sending OTP...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Send OTP
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="otp-section">
                    <div className="otp-icon">
                      <i className="fas fa-mobile-alt"></i>
                    </div>
                    <h3>Enter OTP</h3>
                    <p>Please enter the 6-digit OTP sent to your registered email</p>
                    
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input otp-input"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength="6"
                        required
                      />
                    </div>

                    <div className="otp-timer">
                      <i className="fas fa-clock"></i>
                      <span>OTP valid for 10 minutes</span>
                    </div>

                    <div className="otp-actions">
                      <button
                        type="submit"
                        className="login-btn admin-login-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Verifying...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle"></i> Verify OTP
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setShowOtp(false);
                          setOtp('');
                        }}
                      >
                        <i className="fas fa-arrow-left"></i> Back
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="login-links">
                <a href="#">
                  <i className="fas fa-lock"></i> Security Guidelines
                </a>
                <a href="#">
                  <i className="fas fa-phone-alt"></i> Admin Support
                </a>
              </div>
            </form>
          )}
        </div>

        <div className="login-info">
          <div className="info-card">
            <i className="fas fa-shield-alt"></i>
            <h4>Secure Voting</h4>
            <p>End-to-end encrypted voting system with blockchain verification</p>
          </div>
          <div className="info-card">
            <i className="fas fa-bolt"></i>
            <h4>Quick Process</h4>
            <p>Cast your vote in less than 2 minutes from anywhere</p>
          </div>
          <div className="info-card">
            <i className="fas fa-chart-line"></i>
            <h4>Live Tracking</h4>
            <p>Real-time election statistics and voter turnout updates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;