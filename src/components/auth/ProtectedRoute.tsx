import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'affiliate' | 'customer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    // Redirect to appropriate login page based on required role
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    } else if (requiredRole === 'affiliate') {
      return <Navigate to="/affiliate/login" replace />;
    } else {
      return <LoginForm />;
    }
  }

  if (requiredRole && profile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: {requiredRole} | Your role: {profile.role}
          </p>
          <div className="mt-4 space-x-2">
            {requiredRole === 'admin' && (
              <Navigate to="/admin/login" replace />
            )}
            {requiredRole === 'affiliate' && (
              <Navigate to="/affiliate/login" replace />
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};