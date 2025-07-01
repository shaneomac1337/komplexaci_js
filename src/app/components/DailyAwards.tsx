'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface DailyAward {
  id: string;
  title: string;
  icon: string;
  description: string;
  winner: {
    userId: string;
    displayName: string;
    avatar: string | null;
    value: number;
    unit: string;
  } | null;
  participantCount: number;
}

export default function DailyAwards() {
  const [awards, setAwards] = useState<DailyAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAwards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/daily-awards');
      const data = await response.json();

      if (data.success) {
        setAwards(data.awards);
      } else {
        setError(data.message || 'Failed to load awards');
      }
    } catch (err) {
      console.error('Error fetching daily awards:', err);
      setError('Failed to load awards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwards();

    // Refresh every 5 minutes
    const interval = setInterval(fetchAwards, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-500/20">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h4 className="text-lg font-semibold text-white">Ocenění dne</h4>
        </div>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
          <div className="text-gray-400 text-sm mt-2">Načítání ocenění...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-red-500/20">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 mr-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h4 className="text-lg font-semibold text-white">Ocenění dne</h4>
        </div>
        <div className="text-center py-4">
          <div className="text-red-400 text-sm">❌ {error}</div>
          <button
            onClick={fetchAwards}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
          >
            Zkusit znovu
          </button>
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

      <div className="space-y-3">
        {awards.map((award) => (
          <div
            key={award.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-600/30"
          >
            {/* Award Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl">{award.icon}</span>
              <div className="min-w-0">
                <div className="text-white text-sm font-medium">
                  {award.title}
                </div>
                <div className="text-gray-400 text-xs">
                  {award.participantCount} účastníků
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
                      width={32}
                      height={32}
                      className="rounded-full border border-gray-600"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center border border-gray-600">
                      <span className="text-white text-xs font-bold">
                        {award.winner.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-white text-sm font-medium max-w-24 truncate">
                      {award.winner.displayName}
                    </div>
                    <div className="text-yellow-400 text-xs font-bold">
                      {award.winner.value} {award.winner.unit}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-sm">
                  Nikdo
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}