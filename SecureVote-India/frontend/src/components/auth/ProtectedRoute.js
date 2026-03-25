// frontend/src/components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token    = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // Not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to correct home
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const isAdmin = ['super', 'district', 'booth'].includes(userRole);
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;