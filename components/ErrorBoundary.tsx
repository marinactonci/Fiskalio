"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  resetError
}: {
  error: Error;
  resetError: () => void
}) {
  return (
    <div className="py-16 text-center">
      <h2 className="mb-4 font-semibold text-2xl">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={resetError}>
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      </div>
    </div>
  );
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error) => {
    console.error('Error handled:', error);
    // You could also send error to a reporting service here
  };
}
