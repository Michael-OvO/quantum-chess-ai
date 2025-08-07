/**
 * @file not-found.tsx
 * @purpose 404 Not Found page
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.4
 */

import Link from 'next/link';

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved to a quantum superposition.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-4 py-2 bg-quantum-600 text-white rounded hover:bg-quantum-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/game"
            className="px-4 py-2 border border-gray-800 rounded hover:bg-gray-800 transition-colors"
          >
            Start New Game
          </Link>
        </div>
      </div>
    </div>
  );
}