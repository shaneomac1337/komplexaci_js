'use client';

import React, { useState, useEffect } from 'react';
import SafeImage from './SafeImage';

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

interface StandingsEntry {
  userId: string;
  displayName: string;
  avatar: string | null;
  value: number;
  unit: string;
  rank: number;
}

interface StandingsStatistics {
  totalParticipants: number;
  totalValue: number;
  averageValue: number;
  unit: string;
}

export default function DailyAwards() {
  const [awards, setAwards] = useState<DailyAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAward, setSelectedAward] = useState<DailyAward | null>(null);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [statistics, setStatistics] = useState<StandingsStatistics | null>(null);

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

  const fetchStandings = async (award: DailyAward) => {
    try {
      setStandingsLoading(true);
      const response = await fetch(`/api/daily-awards/standings?category=${award.id}`);
      const data = await response.json();

      if (data.success) {
        setStandings(data.standings);
        setStatistics(data.statistics);
      } else {
        console.error('Failed to load standings:', data.message);
        setStandings([]);
        setStatistics(null);
      }
    } catch (err) {
      console.error('Error fetching standings:', err);
      setStandings([]);
      setStatistics(null);
    } finally {
      setStandingsLoading(false);
    }
  };

  const handleAwardClick = async (award: DailyAward) => {
    setSelectedAward(award);
    await fetchStandings(award);
  };

  const closeModal = () => {
    setSelectedAward(null);
    setStandings([]);
    setStatistics(null);
  };

  useEffect(() => {
    fetchAwards();

    // 🔄 REAL-TIME UPDATES: Refresh every minute for live competition tracking
    const interval = setInterval(fetchAwards, 60 * 1000);
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
            onClick={() => handleAwardClick(award)}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-600/30 cursor-pointer hover:bg-gray-700/40 hover:border-gray-500/40 transition-all duration-200"
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
                  <SafeImage
                    src={award.winner.avatar}
                    alt={award.winner.displayName}
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-600"
                    fallback={
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center border border-gray-600">
                        <span className="text-white text-xs font-bold">
                          {award.winner.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    }
                  />
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

      {/* Standings Modal */}
      {selectedAward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden border border-gray-600">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedAward.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedAward.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {selectedAward.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Date and Statistics */}
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    <span className="text-sm font-medium text-blue-400">
                      {new Date().toLocaleDateString('cs-CZ', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {statistics && (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-white font-semibold">{statistics.totalParticipants}</div>
                      <div className="text-gray-400">účastníků</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{statistics.totalValue}</div>
                      <div className="text-gray-400">celkem {statistics.unit}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{statistics.averageValue}</div>
                      <div className="text-gray-400">průměr {statistics.unit}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {standingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                  <div className="text-gray-400 text-sm mt-2">Načítání žebříčku...</div>
                </div>
              ) : standings.length > 0 ? (
                <div className="space-y-2">
                  {standings.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                        index === 1 ? 'bg-gray-400/20 border border-gray-400/30' :
                        index === 2 ? 'bg-orange-500/20 border border-orange-500/30' :
                        'bg-gray-700/30 border border-gray-600/30'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <span className={`text-sm font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </div>

                      {/* Avatar */}
                      <SafeImage
                        src={entry.avatar}
                        alt={entry.displayName}
                        width={32}
                        height={32}
                        className="rounded-full border border-gray-600"
                        fallback={
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center border border-gray-600">
                            <span className="text-white text-xs font-bold">
                              {entry.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        }
                      />

                      {/* Name and Value */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {entry.displayName}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-gray-300'
                        }`}>
                          {entry.value} {entry.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">
                    Žádní účastníci v této kategorii
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}