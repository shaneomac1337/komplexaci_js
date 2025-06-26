'use client';

import { useState, useEffect } from 'react';
import DiscordAvatar from './DiscordAvatar';

interface UserAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  avatar: string | null;
}

interface UserAnalyticsData {
  totals24h: any;
  totals7d: any;
  totals30d: any;
  gameSessions: any[];
  topTracks: any[];
  loading: boolean;
  error: string | null;
}

export default function UserAnalyticsModal({ isOpen, onClose, userId, displayName, avatar }: UserAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'spotify'>('overview');
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData>({
    totals24h: {},
    totals7d: {},
    totals30d: {},
    gameSessions: [],
    topTracks: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserAnalytics();
    }
  }, [isOpen, userId]);

  const fetchUserAnalytics = async () => {
    setAnalyticsData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch data for all three time periods
      const [response24h, response7d, response30d] = await Promise.all([
        fetch(`/api/analytics/user/${userId}?timeRange=1d`),
        fetch(`/api/analytics/user/${userId}?timeRange=7d`),
        fetch(`/api/analytics/user/${userId}?timeRange=30d`)
      ]);

      const [result24h, result7d, result30d] = await Promise.all([
        response24h.json(),
        response7d.json(),
        response30d.json()
      ]);

      if (result24h.success && result7d.success && result30d.success) {
        setAnalyticsData({
          totals24h: result24h.data.totals || {},
          totals7d: result7d.data.totals || {},
          totals30d: result30d.data.totals || {},
          gameSessions: result30d.data.gameSessions || [],
          topTracks: result30d.data.topTracks || [],
          loading: false,
          error: null
        });
      } else {
        setAnalyticsData(prev => ({
          ...prev,
          loading: false,
          error: 'Nepodařilo se načíst uživatelská data'
        }));
      }
    } catch (error) {
      console.error('User analytics fetch error:', error);
      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: 'Nepodařilo se načíst uživatelská data'
      }));
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'game': return '🎮';
      case 'voice': return '🎤';
      case 'spotify': return '🎵';
      default: return '📊';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'game': return 'text-blue-400';
      case 'voice': return 'text-green-400';
      case 'spotify': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <DiscordAvatar
                userId={userId}
                avatar={avatar}
                displayName={displayName}
                size={48}
                className="border-2 border-white/20"
              />
              <div>
                <h2 className="text-xl font-bold text-white">{displayName}</h2>
                <p className="text-blue-100 text-sm">Osobní statistiky</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-800 px-6 py-4">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Přehled', icon: '📊' },
              { id: 'games', label: 'Hry', icon: '🎮' },
              { id: 'spotify', label: 'Spotify', icon: '🎵' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {analyticsData.loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-300">Načítání dat...</span>
            </div>
          ) : analyticsData.error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-lg mb-2">❌ Chyba</div>
              <p className="text-gray-400">{analyticsData.error}</p>
              <button
                onClick={fetchUserAnalytics}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Zkusit znovu
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Time Period Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">⏰</div>
                      <div className="text-lg font-bold text-white">
                        {formatTime(analyticsData.totals24h.totalOnlineTime || 0)}
                      </div>
                      <div className="text-gray-400 text-sm">24 hodin</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">📅</div>
                      <div className="text-lg font-bold text-white">
                        {formatTime(analyticsData.totals7d.totalOnlineTime || 0)}
                      </div>
                      <div className="text-gray-400 text-sm">7 dní</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-lg font-bold text-white">
                        {formatTime(analyticsData.totals30d.totalOnlineTime || 0)}
                      </div>
                      <div className="text-gray-400 text-sm">30 dní</div>
                    </div>
                  </div>

                  {/* Activity Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="mb-3">
                        <div className="text-white font-medium">Hry</div>
                        <div className="text-gray-400 text-sm">30 dní</div>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {formatTime(analyticsData.totals30d.totalGameTime || 0)}
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">🎤</span>
                        <div>
                          <div className="text-white font-medium">Voice</div>
                          <div className="text-gray-400 text-sm">30 dní</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {formatTime(analyticsData.totals30d.totalVoiceTime || 0)}
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="mb-3">
                        <div className="text-white font-medium">Spotify</div>
                        <div className="text-gray-400 text-sm">30 dní</div>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {analyticsData.totals30d.totalSongsPlayed || 0} písní
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="mb-3">
                        <div className="text-white font-medium">Screen Share</div>
                        <div className="text-gray-400 text-sm">30 dní</div>
                      </div>
                      <div className="text-xl font-bold text-white">
                        {formatTime(analyticsData.totals30d.totalScreenShareTime || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'games' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Nejhranější hry (30 dní)</h3>
                  {analyticsData.gameSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>Žádná herní aktivita</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.gameSessions.slice(0, 10).map((game, index) => (
                        <div key={game.game_name} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-blue-400 min-w-[2rem]">
                                {index + 1}.
                              </span>
                              <div>
                                <div className="text-white font-medium">{game.game_name}</div>
                                <div className="text-gray-400 text-sm">
                                  {game.session_count} relací
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">{formatTime(game.total_minutes)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'spotify' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Top 10 skladeb (30 dní)</h3>
                  {analyticsData.topTracks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>Žádná Spotify aktivita</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.topTracks.slice(0, 10).map((track, index) => (
                        <div key={`${track.track_name}-${track.artist}`} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-purple-400 min-w-[2rem]">
                                {index + 1}.
                              </span>
                              <div>
                                <div className="text-white font-medium">{track.track_name}</div>
                                <div className="text-gray-400 text-sm">{track.artist}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">{track.play_count}×</div>
                              <div className="text-gray-400 text-sm">přehrání</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
