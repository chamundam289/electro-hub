import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                An error occurred while loading this component. This might be due to:
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Database tables not created yet</li>
                <li>• Missing permissions or policies</li>
                <li>• Network connectivity issues</li>
              </ul>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false })}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
              {this.state.error && (
                <details className="text-xs text-left bg-gray-50 p-2 rounded">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple functional error boundary for specific components
export const SimpleErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Component Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            This component failed to load. Please check the database setup and refresh the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};