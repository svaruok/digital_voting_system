// frontend/src/components/layout/GovtHeader.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import './GovtHeader.css';

const GovtHeader = () => {
  const navigate    = useNavigate();
  const { changeLanguage, activeLangDisplay } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const languages = ['English', 'हिंदी', 'தமிழ்', 'বাংলা', 'తెలుగు'];

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  // Re-check on storage changes (e.g. login/logout in another tab)
  useEffect(() => {
    const handleStorage = () => setIsLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <>
      <header className="govt-header">
        <div className="govt-logo-container">
          <div className="emblem-container">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Emblem_of_India.svg/100px-Emblem_of_India.svg.png"
              alt="Government of India Emblem"
              className="govt-emblem"
            />
            <div className="govt-title">
              <h1>Digital Online Voting Platform</h1>
              <h2>Election Commission of India — Blockchain Secured</h2>
            </div>
          </div>

          <div className="header-actions">
            {isLoggedIn && (
              <button className="logout-btn" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            )}
            <div className="official-seal">
              <div className="seal">🔒 OFFICIAL GOVT. PORTAL</div>
            </div>
          </div>
        </div>
      </header>

      <div className="language-selector">
        <div className="lang-buttons">
          {languages.map(lang => (
            <button
              key={lang}
  className={`lang-btn ${activeLangDisplay === lang ? 'active' : ''}`}
  onClick={() => changeLanguage(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
        <div className="header-info">
          <span className="info-item">
            <i className="fas fa-phone-alt"></i> Helpline: 1950
          </span>
          <span className="info-item">
            <i className="fas fa-clock"></i> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </>
  );
};

export default GovtHeader;