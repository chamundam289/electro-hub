import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback if there are hash fragments in URL
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        console.log('OAuth callback detected, processing...', { accessToken: accessToken.substring(0, 20) + '...' });
        
        // Wait for Supabase to process the session
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          console.log('Session processed successfully in AuthContext');
          // Clean the URL and stay on home page
          window.history.replaceState({}, document.title, '/');
        }
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Handle OAuth callback
    handleOAuthCallback();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle successful sign in - stay on home page
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in successfully, staying on home page');
        
        // Set flag for welcome animation
        localStorage.setItem('just_logged_in', 'true');
        
        // Clean URL if it has hash fragments
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, '/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};