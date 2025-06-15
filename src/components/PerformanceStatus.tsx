'use client';

import { usePerformance } from '@/contexts/PerformanceContext';

interface PerformanceStatusProps {
  showMusicHint?: boolean;
}

export default function PerformanceStatus({ showMusicHint = false }: PerformanceStatusProps) {
  const { lowPerformanceMode, isInitialized } = usePerformance();

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return (
      <div className="mt-8 space-y-4">
        <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 max-w-md mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-5 h-5 mr-2 bg-gray-400 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-3 bg-gray-400 rounded w-full mb-4 animate-pulse"></div>
          <div className="h-10 bg-gray-400 rounded w-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {/* Performance status display */}
      <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 max-w-md mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span className="text-sm font-medium text-purple-300">
            Stav výkonu
          </span>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 text-center mb-4 leading-relaxed px-2">
          Tato stránka obsahuje pokročilé vizuální efekty. Režim můžete změnit pomocí tlačítka v levém dolním rohu.
        </p>

        <div className="flex flex-col items-center">
          {/* Status indicator only - no button */}
          {lowPerformanceMode ? (
            <div className="bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg px-4 py-3 text-center w-full">
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold mb-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Low-End PC režim aktivní</span>
              </div>
              <p className="text-xs text-green-300">
                ✓ Optimalizováno pro slabší hardware
              </p>
            </div>
          ) : (
            <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg px-4 py-3 text-center w-full">
              <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-semibold mb-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>High-End PC režim aktivní</span>
              </div>
              <p className="text-xs text-blue-300">
                ⚡ Plné vizuální efekty povoleny
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Music hint - only show when requested */}
      {showMusicHint && (
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-500/30 animate-pulse max-w-sm mx-auto">
          <p className="text-sm text-purple-300 flex items-center justify-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            Klikni kamkoliv pro spuštění hudby
          </p>
        </div>
      )}
    </div>
  );
}
