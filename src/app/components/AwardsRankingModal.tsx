'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AwardRanking, RankingEntry } from '@/app/api/analytics/awards/ranking/[category]/route';
import { DailyAward } from '@/app/api/analytics/awards/daily/route';

interface AwardsRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  award: DailyAward | null;
}

export default function AwardsRankingModal({ 
  isOpen, 
  onClose, 
  category, 
  award 
}: AwardsRankingModalProps) {
  const [ranking, setRanking] = useState<AwardRanking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = async () => {
    if (!category) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/awards/ranking/${category}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRanking(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch ranking');
      }
    } catch (err) {
      console.error('Error fetching ranking:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && category) {
      fetchRanking();
    }
  }, [isOpen, category]);

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

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 2: return 'text-gray-300 bg-gray-300/10 border-gray-300/30';
      case 3: return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      default: return 'text-gray-400 bg-gray-700 border-gray-600';
    }
  };

  const getAwardGradient = (category: string): string => {
    switch (category) {
      case 'nerd': return 'from-blue-500 to-purple-600';
      case 'gamer': return 'from-green-500 to-emerald-600';
      case 'listener': return 'from-pink-500 to-rose-600';
      case 'streamer': return 'from-red-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getAwardGradient(category)} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{award?.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">{award?.czechTitle}</h2>
                <p className="text-white/90">{award?.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </div>
          
          {ranking && (
            <div className="mt-4 text-white/90 text-sm">
              📊 Celkem {ranking.totalParticipants} účastníků • {new Date(ranking.date).toLocaleDateString('cs-CZ')}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-gray-400">Načítám žebříček...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">❌ Chyba při načítání žebříčku</div>
              <div className="text-gray-400 text-sm">{error}</div>
              <button
                onClick={fetchRanking}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zkusit znovu
              </button>
            </div>
          )}

          {ranking && ranking.rankings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">😴</div>
              <div className="text-gray-400 text-lg">Dnes ještě nikdo nesoutěží</div>
              <div className="text-gray-500 text-sm mt-2">Buď první a získej ocenění!</div>
            </div>
          )}

          {ranking && ranking.rankings.length > 0 && (
            <div className="space-y-3">
              {ranking.rankings.map((entry) => (
                <div
                  key={entry.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border transition-all duration-200
                    ${getRankColor(entry.rank)}
                    ${entry.isWinner ? 'ring-2 ring-yellow-400/50' : ''}
                    hover:scale-[1.02] hover:shadow-lg
                  `}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <span className="text-lg font-bold">
                      {getRankEmoji(entry.rank)}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {entry.avatar ? (
                      <Image
                        src={entry.avatar}
                        alt={entry.displayName}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-gray-600"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center border-2 border-gray-600">
                        <span className="text-white text-lg font-bold">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Winner Crown */}
                    {entry.isWinner && (
                      <div className="absolute -top-1 -right-1 text-yellow-400 text-lg">
                        👑
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">
                      {entry.displayName}
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-white font-bold text-lg">
                      {formatValue(entry.value, entry.unit)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {entry.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-750">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              💡 Tip: Při stejném skóre vyhrává ten, kdo ho dosáhl dříve
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Zavřít
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
