import React from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import TestGoogleAuth from '@/components/auth/TestGoogleAuth';
import AuthDebugger from '@/components/auth/AuthDebugger';
import SupabaseConfigChecker from '@/components/auth/SupabaseConfigChecker';
import WelcomeDialogTester from '@/components/auth/WelcomeDialogTester';
import { useAuth } from '@/contexts/AuthContext';

const Login: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignIn />
            
            {/* Debug Section - Remove in production */}
            <div className="border-t pt-4">
              <TestGoogleAuth />
            </div>
            
            <div className="text-center text-sm text-gray-600">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>

        {/* Debug Panel */}
        <SupabaseConfigChecker />
        <WelcomeDialogTester />
        <AuthDebugger />
      </div>
    </div>
  );
};

export default Login;