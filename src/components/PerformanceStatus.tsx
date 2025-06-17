'use client';

import { useState } from 'react';
import { usePerformance } from '@/contexts/PerformanceContext';

interface PerformanceStatusProps {
  showMusicHint?: boolean;
}

export default function PerformanceStatus({ showMusicHint = false }: PerformanceStatusProps) {
  const { lowPerformanceMode, isInitialized } = usePerformance();
  const [showTooltip, setShowTooltip] = useState(false);

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
    <div className="space-y-3">
      {/* Very minimalistic performance status with tooltip */}
      <div className="relative max-w-xs mx-auto">
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-xs text-purple-300">Stav výkonu:</span>
            {lowPerformanceMode ? (
              <span className="text-xs text-green-400">✓ Low-End</span>
            ) : (
              <span className="text-xs text-blue-400">⚡ High-End</span>
            )}

            {/* Question mark with tooltip */}
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className="w-4 h-4 rounded-full bg-purple-500/30 hover:bg-purple-500/50 flex items-center justify-center transition-colors duration-200 ml-1"
              title="Klikni pro více informací"
            >
              <span className="text-xs text-purple-300 font-bold">?</span>
            </button>
          </div>
        </div>

        {/* Tooltip popup */}
        {showTooltip && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 max-w-sm">
            <div className="text-xs text-gray-200 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold">⚡ High-End:</span>
                <span>Plné vizuální efekty, animace a přechody pro výkonné počítače</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 font-semibold">✓ Low-End:</span>
                <span>Zjednodušené efekty pro slabší hardware a lepší výkon</span>
              </div>
              <div className="text-purple-300 text-center pt-1 border-t border-purple-500/20">
                Změnit můžete tlačítkem v levém dolním rohu
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-xs text-red-300">✕</span>
            </button>
          </div>
        )}
      </div>

      {/* Music hint - only show when requested */}
      {showMusicHint && (
        <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-500/20 animate-pulse max-w-xs mx-auto">
          <p className="text-xs text-purple-300 flex items-center justify-center">
            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            Klikni kamkoliv pro spuštění hudby
          </p>
        </div>
      )}
    </div>
  );
}
