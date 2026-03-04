import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Import Components
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VotingPage from './pages/VotingPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GovtHeader from './components/layout/GovtHeader';
import GovtFooter from './components/layout/GovtFooter';

function App() {
  return (
    <Router>
      <div className="app">
        <Toaster position="top-right" />
        <GovtHeader />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/user/dashboard" element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['super', 'constituency']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/vote" element={
              <ProtectedRoute allowedRoles={['user']}>
                <VotingPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <GovtFooter />
      </div>
    </Router>
  );
}

export default App;