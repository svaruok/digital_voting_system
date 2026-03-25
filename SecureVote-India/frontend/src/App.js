import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import GovtHeader    from './components/layout/GovtHeader';
import GovtFooter    from './components/layout/GovtFooter';
import LoginPage     from './pages/LoginPage.jsx';
import UserDashboard from './pages/UserDashboard';
import VotingPage    from './pages/VotingPage';
import Admin         from './pages/Admin';
import Dashboard     from './pages/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0A0F2C',
            color: '#fff',
            border: '1px solid #FF9933',
            borderRadius: '10px',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '0.9rem'
          }
        }}
      />

      <LanguageProvider>
        <GovtHeader />
        <main style={{ minHeight: 'calc(100vh - 160px)' }}>
          <Routes>
            {/* Default: go to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Voter protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['voter']}>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/vote" element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VotingPage />
              </ProtectedRoute>
            } />

            {/* Admin protected */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super', 'district', 'booth']}>
                <Admin />
              </ProtectedRoute>
            } />

            {/* Old dashboard redirect */}
            <Route path="/old-dashboard" element={
              <ProtectedRoute allowedRoles={['super', 'district', 'booth']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
        <GovtFooter />
      </LanguageProvider>
    </Router>
  );
}

export default App;
