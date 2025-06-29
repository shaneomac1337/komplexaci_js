'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { DailyAward } from '@/app/api/analytics/awards/daily/route';

interface DailyAwardsProps {
  onAwardClick?: (category: string, award: DailyAward) => void;
}

export default function DailyAwards({ onAwardClick }: DailyAwardsProps) {
  const [awards, setAwards] = useState<DailyAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchAwards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/awards/daily', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAwards(data.awards);
        setLastUpdated(data.lastUpdated);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch awards');
      }
    } catch (err) {
      console.error('Error fetching daily awards:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwards();
    
    // Refresh awards every 5 minutes
    const interval = setInterval(fetchAwards, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'minut') {
      if (value >= 60) {
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      return `${value}m`;
    }
    return `${value} ${unit}`;
  };



  if (loading) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-500/20">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h4 className="text-lg font-semibold text-white">Ocenění dne</h4>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/30 rounded-lg p-2 animate-pulse">
              <div className="h-4 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-500/20">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h4 className="text-lg font-semibold text-white">Ocenění dne</h4>
        </div>
        <div className="text-red-400 text-sm">
          ❌ Chyba při načítání: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-500/20">
      <div className="flex items-center mb-3">
        <svg className="w-6 h-6 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <h4 className="text-lg font-semibold text-white">Ocenění dne</h4>
      </div>

      <div className="space-y-2">
        {awards.map((award) => (
          <button
            key={award.category}
            onClick={() => onAwardClick?.(award.category, award)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer group text-left"
          >
            {/* Award Info */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg">{award.icon}</span>
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {award.czechTitle}
                </div>
                <div className="text-gray-400 text-xs">
                  {award.totalParticipants} účastníků
                </div>
              </div>
            </div>

            {/* Winner */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {award.winner ? (
                <>
                  {award.winner.avatar ? (
                    <Image
                      src={award.winner.avatar}
                      alt={award.winner.displayName}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {award.winner.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-white text-sm font-medium truncate max-w-20">
                      {award.winner.displayName}
                    </div>
                    <div className="text-yellow-400 text-xs font-bold">
                      {formatValue(award.winner.value, award.winner.unit)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-sm">
                  Nikdo
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-3 text-gray-400 text-xs">
        Reset každý den o půlnoci • Klikni pro žebříček
      </div>
    </div>
  );
}
