import { useEffect } from 'react';
import { ConvexError } from 'convex/values';

/**
 * Hook to handle Convex query errors and provide user-friendly error messages
 */
export function useConvexErrorHandler() {
  const handleError = (error: unknown): string => {
    if (error instanceof ConvexError) {
      // Handle specific Convex errors
      if (error.data?.code === 'ArgumentValidationError') {
        return 'Invalid request parameters. Please check the URL and try again.';
      }
      return error.message || 'A database error occurred';
    }

    if (error instanceof Error) {
      // Handle validation errors specifically
      if (error.message.includes('ArgumentValidationError')) {
        return 'Invalid ID format. Please check the URL and try again.';
      }
      if (error.message.includes('Value does not match validator')) {
        return 'Invalid ID format. Please check the URL and try again.';
      }
      return error.message;
    }

    return 'An unexpected error occurred';
  };

  return { handleError };
}

/**
 * Hook to safely execute Convex queries with error handling
 */
export function useSafeQuery<T>(
  queryResult: T | undefined,
  onError?: (error: string) => void
): {
  data: T | null;
  isLoading: boolean;
  error: string | null;
} {
  useEffect(() => {
    if (queryResult && typeof queryResult === 'object' && 'error' in queryResult) {
      const errorMessage = (queryResult as any).error;
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [queryResult, onError]);

  if (queryResult === undefined) {
    return { data: null, isLoading: true, error: null };
  }

  if (queryResult && typeof queryResult === 'object' && 'error' in queryResult) {
    return {
      data: null,
      isLoading: false,
      error: (queryResult as any).error || 'An error occurred'
    };
  }

  return { data: queryResult, isLoading: false, error: null };
}
