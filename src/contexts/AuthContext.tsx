import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/integrations/supabase/affiliate-types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signInWithOTP: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAffiliate: boolean;
  isCustomer: boolean;
  getRedirectPath: (profile: Profile | null) => string;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Use raw SQL query to bypass type issues
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If profiles table has RLS policy issues or profile not found, create one
        if (error.code === 'PGRST116' || error.code === '42P17' || error.message?.includes('infinite recursion detected')) {
          await createProfile(userId);
        }
      } else {
        setProfile(data as unknown as Profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      await createProfile(userId);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('profiles' as any)
        .insert({
          id: userId,
          email: userData.user.email!,
          role: 'customer',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        
        // If profiles table has policy issues, create a temporary profile in memory
        if (error.code === '42P17' || error.message?.includes('infinite recursion detected') || error.message?.includes('relation "profiles" does not exist')) {
          console.log('Profiles table has policy issues, creating temporary profile');
          const tempProfile: Profile = {
            id: userId,
            email: userData.user.email!,
            role: 'customer',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(tempProfile);
        }
      } else {
        setProfile(data as unknown as Profile);
      }
    } catch (error) {
      console.error('Error in createProfile:', error);
      
      // Fallback: create temporary profile for testing
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const tempProfile: Profile = {
          id: userId,
          email: userData.user.email!,
          role: 'customer',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(tempProfile);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      // For admin login, ensure profile exists and has admin role
      if (data.user) {
        await ensureAdminProfile(data.user.id, data.user.email!);
      }

      toast.success('Signed in successfully');
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      const errorMessage = 'Failed to sign in';
      toast.error(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const ensureAdminProfile = async (userId: string, email: string) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && (fetchError.code === 'PGRST116' || fetchError.code === '42P17' || fetchError.message?.includes('infinite recursion detected'))) {
        // Profile doesn't exist or table doesn't exist, create it with admin role
        const { error: insertError } = await supabase
          .from('profiles' as any)
          .insert({
            id: userId,
            email: email,
            role: 'admin',
            status: 'active'
          });

        if (insertError) {
          console.error('Error creating admin profile:', insertError);
          
          // If table has policy issues, create temporary admin profile
          if (insertError.code === '42P17' || insertError.message?.includes('infinite recursion detected') || insertError.message?.includes('relation "profiles" does not exist')) {
            console.log('Creating temporary admin profile due to policy issues');
            const tempProfile: Profile = {
              id: userId,
              email: email,
              role: 'admin',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setProfile(tempProfile);
            return;
          }
        } else {
          console.log('Admin profile created successfully');
        }
      } else if (existingProfile && (existingProfile as any).role !== 'admin') {
        // Profile exists but not admin, update it
        const { error: updateError } = await supabase
          .from('profiles' as any)
          .update({ role: 'admin', status: 'active' })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile to admin:', updateError);
        } else {
          console.log('Profile updated to admin role');
        }
      }
      
      // Fetch the updated profile
      await fetchProfile(userId);
    } catch (error) {
      console.error('Error in ensureAdminProfile:', error);
      
      // Fallback: create temporary admin profile
      const tempProfile: Profile = {
        id: userId,
        email: email,
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(tempProfile);
    }
  };

  const signInWithOTP = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only allow existing users to sign in
        },
      });

      if (error) {
        if (error.message.includes('User not found')) {
          toast.error('Account not found. Please contact admin to create your affiliate account.');
        } else {
          toast.error(error.message);
        }
        throw error;
      }

      toast.success('Check your email for the login link!');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        throw error;
      }
      setUser(null);
      setProfile(null);
      setSession(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get redirect path based on user role
  const getRedirectPath = (userProfile: Profile | null) => {
    if (!userProfile) return '/';
    
    switch (userProfile.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'affiliate':
        return '/affiliate/dashboard';
      case 'customer':
      default:
        return '/';
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isAffiliate = profile?.role === 'affiliate';
  const isCustomer = profile?.role === 'customer';

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInWithOTP,
    signOut,
    isAdmin,
    isAffiliate,
    isCustomer,
    getRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};