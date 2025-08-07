/**
 * @file page.tsx
 * @purpose Home page for the Quantum Chess Battleground
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.1
 */

export default function HomePage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Quantum Chess Battleground
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Watch AI models compete in quantum chess while revealing their reasoning process
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border border-gray-800 rounded-lg hover:border-quantum-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">🎮 Play Game</h2>
            <p className="text-sm text-gray-400">
              Start a new quantum chess game with AI models
            </p>
          </div>
          
          <div className="p-6 border border-gray-800 rounded-lg hover:border-quantum-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">🏆 Tournaments</h2>
            <p className="text-sm text-gray-400">
              Watch AI models compete in automated tournaments
            </p>
          </div>
          
          <div className="p-6 border border-gray-800 rounded-lg hover:border-quantum-500 transition-colors">
            <h2 className="text-xl font-semibold mb-2">📊 Analytics</h2>
            <p className="text-sm text-gray-400">
              Explore performance metrics and model comparisons
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}