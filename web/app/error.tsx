/**
 * @file error.tsx
 * @purpose Global error boundary component
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.4
 */

'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.message && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-100">
              Error details
            </summary>
            <pre className="mt-2 p-4 bg-gray-800 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-quantum-600 text-white rounded hover:bg-quantum-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}