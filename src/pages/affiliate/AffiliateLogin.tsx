import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const AffiliateLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      
      // First, authenticate the affiliate user using our custom function
      const { data: authResult, error: authError } = await supabase
        .rpc('authenticate_affiliate_user', {
          email_param: email,
          password_param: password
        });

      if (authError) {
        throw authError;
      }

      if (!authResult || authResult.length === 0 || !authResult[0].is_valid) {
        toast.error('Invalid email or password');
        return;
      }

      const affiliateUser = authResult[0];

      if (affiliateUser.status !== 'active') {
        toast.error('Your affiliate account is not active. Please contact admin.');
        return;
      }

      // Create a temporary auth session for the affiliate
      // Note: This is a simplified approach. In production, you might want to 
      // create proper auth tokens or use a different authentication method
      
      // Store affiliate info in localStorage for now
      localStorage.setItem('affiliate_user', JSON.stringify({
        id: affiliateUser.id,
        email: affiliateUser.email,
        full_name: affiliateUser.full_name,
        mobile: affiliateUser.mobile,
        role: 'affiliate'
      }));

      toast.success(`Welcome back, ${affiliateUser.full_name}!`);
      navigate('/affiliate/dashboard');

    } catch (error: any) {
      console.error('Affiliate login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Affiliate Login</CardTitle>
          <CardDescription>
            Sign in to your affiliate account with email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.affiliate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don't have an affiliate account?</p>
            <p className="mt-1">Contact admin to create your account.</p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Test Credentials:</strong><br />
              Email: john.affiliate@example.com<br />
              Password: affiliate123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};