/**
 * @file Footer.tsx
 * @purpose Footer component with project links
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.4
 */

import Link from 'next/link';

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-gray-800/40 bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-4">Game</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/game/new" className="text-sm text-gray-400 hover:text-gray-100">
                    New Game
                  </Link>
                </li>
                <li>
                  <Link href="/game/rules" className="text-sm text-gray-400 hover:text-gray-100">
                    Quantum Rules
                  </Link>
                </li>
                <li>
                  <Link href="/game/tutorial" className="text-sm text-gray-400 hover:text-gray-100">
                    Tutorial
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Models</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/models/leaderboard" className="text-sm text-gray-400 hover:text-gray-100">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/models/compare" className="text-sm text-gray-400 hover:text-gray-100">
                    Compare Models
                  </Link>
                </li>
                <li>
                  <Link href="/models/strategies" className="text-sm text-gray-400 hover:text-gray-100">
                    Strategies
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-sm text-gray-400 hover:text-gray-100">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="text-sm text-gray-400 hover:text-gray-100">
                    API Reference
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://github.com/quantum-chess-ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-gray-100"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">About</h3>
              <p className="text-sm text-gray-400">
                Watch AI models compete in quantum chess while revealing their reasoning process.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800/40">
            <p className="text-center text-sm text-gray-400">
              © 2025 Quantum Chess Battleground. Open source project.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}