'use client';

import { usePerformance } from '@/contexts/PerformanceContext';

export default function PerformanceControl() {
  const { lowPerformanceMode, togglePerformanceMode, isInitialized } = usePerformance();

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {lowPerformanceMode ? (
        // Show status indicator when Low-End PC mode is active
        <button
          onClick={togglePerformanceMode}
          className="bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-green-500/25 border border-green-500/30 hover:bg-green-700/90 transition-all duration-300"
          title="Klikněte pro vypnutí Low-End PC režimu"
        >
          <div className="flex items-center gap-2">
            <span className="text-green-300">✓</span>
            <span>Low-End PC režim aktivní</span>
          </div>
        </button>
      ) : (
        // Show button when High-End mode is active (default state)
        <button
          onClick={togglePerformanceMode}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-orange-500/25"
          title="Přepnout na Low-End PC režim"
        >
          ⚡ Low-End PC
        </button>
      )}
    </div>
  );
}
