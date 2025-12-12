/**
 * React hook for Darknet Shield RAG search functionality.
 *
 * Provides secure, tenant-isolated AI search capabilities with
 * automatic error handling and loading states.
 */

import { useState } from 'react';
import { api } from '../lib/api';
import type { SearchRequest, SearchResponse } from '../lib/apiTypes';

interface UseDarknetSearchReturn {
  search: (query: string, mode?: SearchRequest['mode']) => Promise<void>;
  result: SearchResponse | null;
  loading: boolean;
  error: string | null;
  clearResult: () => void;
}

export const useDarknetSearch = (): UseDarknetSearchReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);

  const search = async (query: string, mode: SearchRequest['mode'] = 'standard') => {
    setLoading(true);
    setError(null);

    try {
      const searchRequest: SearchRequest = { query, mode };
      const response = await api.search(searchRequest);

      if (response.ok) {
        setResult(response.data);
      } else {
        // Handle different error types
        if (response.isUnauthorized) {
          setError('Authentication required. Please log in again.');
        } else if (response.isForbidden) {
          setError('Access denied. You do not have permission to search.');
        } else if (response.isValidationError) {
          setError('Invalid search query. Please check your input.');
        } else {
          // Use the human-readable explanation from the backend if available
          const explanation = response.error?.explanation_for_humans ||
                            response.error?.message ||
                            'Search failed. Please try again.';
          setError(explanation);
        }
      }
    } catch (err) {
      console.error('Search request failed:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    search,
    result,
    loading,
    error,
    clearResult,
  };
};