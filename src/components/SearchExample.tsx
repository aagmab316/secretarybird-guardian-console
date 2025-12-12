/**
 * Example component demonstrating Darknet Shield RAG search usage.
 *
 * This shows how to integrate the secure search functionality into your UI.
 */

import React, { useState } from 'react';
import { useDarknetSearch } from '../hooks/useDarknetSearch';

export const SearchExample: React.FC = () => {
  const [query, setQuery] = useState('');
  const { search, result, loading, error, clearResult } = useDarknetSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await search(query.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Darknet Shield AI Search</h2>
      <p className="text-gray-600 mb-6">
        Secure, privacy-first AI search powered by the Darknet Shield.
        Your data is protected against extortion and inversion attacks.
      </p>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about cases, risks, or any protected information..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Search Results</h3>
            <button
              onClick={clearResult}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-800 leading-relaxed">{result.answer}</p>
          </div>

          {result.citations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sources</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {result.citations.map((citation, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {citation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p>
          🔒 Protected by Darknet Shield: Your search is tenant-isolated and
          all sensitive data remains encrypted at rest.
        </p>
      </div>
    </div>
  );
};