import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AffiliateUser {
  id: string;
  email: string;
  full_name: string;
  mobile: string;
  role: 'affiliate';
}

export const useAffiliateAuth = () => {
  const [affiliateUser, setAffiliateUser] = useState<AffiliateUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if affiliate is logged in
    const storedUser = localStorage.getItem('affiliate_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAffiliateUser(user);
      } catch (error) {
        console.error('Error parsing stored affiliate user:', error);
        localStorage.removeItem('affiliate_user');
      }
    }
    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem('affiliate_user');
    setAffiliateUser(null);
    navigate('/affiliate/login');
  };

  const isAuthenticated = !!affiliateUser;

  return {
    affiliateUser,
    loading,
    signOut,
    isAuthenticated
  };
};