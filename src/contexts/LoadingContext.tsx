import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface LoadingContextType {
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
  isComponentLoading: (key: string) => boolean;
  setComponentLoading: (key: string, loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [componentLoadingStates, setComponentLoadingStates] = useState<Record<string, boolean>>({});
  
  // Safely use useLocation with error handling
  let location;
  try {
    location = useLocation();
  } catch (error) {
    // If useLocation fails (not in router context), use a fallback
    location = { pathname: '/' };
  }

  // Reset loading states on route change
  useEffect(() => {
    setIsPageLoading(true);
    setComponentLoadingStates({});
    
    // Simulate minimum loading time for better UX
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const setPageLoading = (loading: boolean) => {
    setIsPageLoading(loading);
  };

  const isComponentLoading = (key: string) => {
    return componentLoadingStates[key] || false;
  };

  const setComponentLoading = (key: string, loading: boolean) => {
    setComponentLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  };

  return (
    <LoadingContext.Provider value={{
      isPageLoading,
      setPageLoading,
      isComponentLoading,
      setComponentLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Hook for automatic component loading management
export function useAutoLoading(key: string, dependencies: any[] = [], delay: number = 200) {
  const { setComponentLoading } = useLoading();

  useEffect(() => {
    setComponentLoading(key, true);
    
    const timer = setTimeout(() => {
      setComponentLoading(key, false);
    }, delay);

    return () => {
      clearTimeout(timer);
      setComponentLoading(key, false);
    };
  }, dependencies);
}