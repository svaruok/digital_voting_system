// frontend/src/pages/Dashboard.js
// This is the old admin dashboard — kept for reference.
// The new full-featured admin panel is Admin.jsx
// This file redirects to /admin automatically.

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to new admin panel
    const role = localStorage.getItem('userRole');
    if (role && ['super', 'district', 'booth'].includes(role)) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="dashboard-loading">
      <p>Redirecting...</p>
    </div>
  );
};

export default Dashboard;