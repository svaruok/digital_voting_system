// frontend/src/components/layout/GovtFooter.js
import React from 'react';
import './GovtFooter.css';

const GovtFooter = () => {
  return (
    <footer className="govt-footer">
      <div className="footer-content">

        <div className="footer-section">
          <h3><i className="fas fa-link"></i> Quick Links</h3>
          <ul className="footer-links">
            <li><a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer">
              <i className="fas fa-external-link-alt"></i> Election Commission
            </a></li>
            <li><a href="https://electoralsearch.in" target="_blank" rel="noopener noreferrer">
              <i className="fas fa-search"></i> Electoral Roll Search
            </a></li>
            <li><a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer">
              <i className="fas fa-landmark"></i> National Portal of India
            </a></li>
            <li><a href="#">
              <i className="fas fa-file-alt"></i> Election Laws & Rules
            </a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3><i className="fas fa-headset"></i> Help & Support</h3>
          <div className="contact-info">
            <p><i className="fas fa-phone"></i> <strong>National Voter Helpline:</strong> 1950</p>
            <p><i className="fas fa-envelope"></i> helpdesk@eci.gov.in</p>
            <p><i className="fas fa-map-marker-alt"></i> Election Commission of India, New Delhi</p>
            <p><i className="fas fa-clock"></i> Mon–Sat: 9:00 AM – 6:00 PM</p>
          </div>
        </div>

        <div className="footer-section">
          <h3><i className="fas fa-shield-alt"></i> Security & Legal</h3>
          <ul className="footer-links">
            <li><a href="#"><i className="fas fa-lock"></i> Privacy Policy</a></li>
            <li><a href="#"><i className="fas fa-user-shield"></i> Security Guidelines</a></li>
            <li><a href="#"><i className="fas fa-gavel"></i> Terms of Service</a></li>
            <li><a href="#"><i className="fas fa-ban"></i> Report Misuse</a></li>
            <li><a href="#"><i className="fas fa-cube"></i> Blockchain Audit</a></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="copyright">
          <p>© {new Date().getFullYear()} Election Commission of India. All rights reserved.</p>
          <p className="disclaimer">
            <i className="fas fa-exclamation-triangle"></i>
            Official Government of India platform. Unauthorized access is prohibited under IT Act 2000.
          </p>
        </div>
        <div className="security-badges">
          <span className="badge ssl-badge">
            <i className="fas fa-lock"></i> SSL Secured
          </span>
          <span className="badge verified-badge">
            <i className="fas fa-check-circle"></i> Verified Portal
          </span>
          <span className="badge blockchain-badge">
            <i className="fas fa-cube"></i> Blockchain
          </span>
        </div>
      </div>
    </footer>
  );
};

export default GovtFooter;