/**
 * @file loading.tsx
 * @purpose Global loading state component
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.4
 */

export default function Loading(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-quantum-500"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
}