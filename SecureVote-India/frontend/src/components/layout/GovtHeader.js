import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GovtHeader.css';

const GovtHeader = () => {
  const navigate = useNavigate();
  const [activeLang, setActiveLang] = useState('English');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  
  const languages = ['English', 'हिंदी', 'தமிழ்', 'বাংলা'];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    navigate('/');
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
              <h2>Election Commission of India</h2>
            </div>
          </div>
          <div className="header-actions">
            {isLoggedIn && (
              <button className="logout-btn" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            )}
            <div className="official-seal">
              <div className="seal">OFFICIAL GOVT. PORTAL</div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="language-selector">
        <div className="lang-buttons">
          {languages.map((lang) => (
            <button
              key={lang}
              className={`lang-btn ${activeLang === lang ? 'active' : ''}`}
              onClick={() => setActiveLang(lang)}
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
            <i className="fas fa-clock"></i> {new Date().toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>
    </>
  );
};

export default GovtHeader;