import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AutoRedirect: React.FC = () => {
  const { user, profile, getRedirectPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      const redirectPath = getRedirectPath(profile);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate, getRedirectPath]);

  return null; // This component doesn't render anything
};