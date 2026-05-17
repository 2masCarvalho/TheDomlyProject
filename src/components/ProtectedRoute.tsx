import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'owner' | 'resident';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { user, loading, roleLoading, isOwner, isResident } = useAuth();

  if (loading || roleLoading) {
    return <LoadingSpinner text="A carregar sessão..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole === 'owner' && isResident && !isOwner) {
    return <Navigate to="/portal" replace />;
  }

  if (requireRole === 'resident' && !isResident) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
