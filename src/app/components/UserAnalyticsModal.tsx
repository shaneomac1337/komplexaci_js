'use client';

import { useState, useEffect } from 'react';
import SafeImage from './SafeImage';

interface UserAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  avatar: string | null;
}

interface UserAnalyticsData {
  totals30d: any;
  gameSessions: any[];
  topTracks: any[];
  loading: boolean;
  error: string | null;
}

export default function UserAnalyticsModal({ isOpen, onClose, userId, displayName, avatar }: UserAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'spotify'>('overview');
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData>({
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
      // Fetch only monthly data (30d period)
      const response30d = await fetch(`/api/analytics/user/${userId}?timeRange=monthly`);
      const result30d = await response30d.json();

      if (result30d.success) {
        setAnalyticsData({
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#2f3136] rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-xl border border-[#40444b]">
        {/* Header */}
        <div className="bg-[#36393f] p-4 sm:p-6 border-b border-[#40444b]">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <SafeImage
                src={avatar}
                alt={displayName}
                width={40}
                height={40}
                className="rounded-full sm:w-12 sm:h-12"
                fallback={
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                }
              />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">{displayName}</h2>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-semibold text-[#5865f2]">Měsíční statistiky</p>
                  <p className="text-xs text-[#b9bbbe]">
                    {new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' })} - {new Date().toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#b9bbbe] hover:text-white text-xl sm:text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-[#40444b] transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#36393f] px-4 sm:px-6 py-3 border-b border-[#40444b]">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Přehled', icon: '📊' },
              { id: 'games', label: 'Hry', icon: '🎮' },
              { id: 'spotify', label: 'Spotify', icon: '🎵' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#5865f2] text-white'
                    : 'text-[#b9bbbe] hover:text-white hover:bg-[#40444b]'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)] overflow-y-auto">
          {analyticsData.loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#5865f2]"></div>
              <span className="ml-3 text-[#b9bbbe] text-sm sm:text-base">Načítání dat...</span>
            </div>
          ) : analyticsData.error ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-red-400 text-base sm:text-lg mb-2">❌ Chyba</div>
              <p className="text-[#b9bbbe] text-sm sm:text-base">{analyticsData.error}</p>
              <button
                onClick={fetchUserAnalytics}
                className="mt-4 bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Zkusit znovu
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Activity Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-[#36393f] rounded-lg p-4 border border-[#40444b]">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-xl sm:text-2xl">🎮</span>
                        <div>
                          <div className="text-white font-medium text-sm sm:text-base">Hry</div>
                          <div className="text-[#b9bbbe] text-xs sm:text-sm">Měsíc</div>
                        </div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {formatTime(analyticsData.totals30d.totalGameTime || 0)}
                      </div>
                    </div>

                    <div className="bg-[#36393f] rounded-lg p-4 border border-[#40444b]">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-xl sm:text-2xl">🎤</span>
                        <div>
                          <div className="text-white font-medium text-sm sm:text-base">Voice</div>
                          <div className="text-[#b9bbbe] text-xs sm:text-sm">Měsíc</div>
                        </div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {formatTime(analyticsData.totals30d.totalVoiceTime || 0)}
                      </div>
                    </div>

                    <div className="bg-[#36393f] rounded-lg p-4 border border-[#40444b]">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-xl sm:text-2xl">🎵</span>
                        <div>
                          <div className="text-white font-medium text-sm sm:text-base">Spotify</div>
                          <div className="text-[#b9bbbe] text-xs sm:text-sm">Měsíc</div>
                        </div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {analyticsData.totals30d.totalSongsPlayed || 0} písní
                      </div>
                    </div>

                    <div className="bg-[#36393f] rounded-lg p-4 border border-[#40444b]">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-xl sm:text-2xl">🖥️</span>
                        <div>
                          <div className="text-white font-medium text-sm sm:text-base">Screen Share</div>
                          <div className="text-[#b9bbbe] text-xs sm:text-sm">Měsíc</div>
                        </div>
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {formatTime(analyticsData.totals30d.totalScreenShareTime || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'games' && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Nejhranější hry (Měsíc)</h3>
                  {analyticsData.gameSessions.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-[#b9bbbe]">
                      <p className="text-sm sm:text-base">Žádná herní aktivita</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {analyticsData.gameSessions.slice(0, 10).map((game, index) => (
                        <div key={game.game_name} className="bg-[#36393f] rounded-lg p-3 sm:p-4 border border-[#40444b]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                              <span className="text-sm sm:text-base font-bold text-[#5865f2] min-w-[1.5rem] sm:min-w-[2rem]">
                                {index + 1}.
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-medium text-sm sm:text-base truncate">{game.game_name}</div>
                                <div className="text-[#b9bbbe] text-xs sm:text-sm">
                                  {game.session_count} relací
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="text-white font-bold text-sm sm:text-base">{formatTime(game.total_minutes)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'spotify' && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Top 10 skladeb (Měsíc)</h3>
                  {analyticsData.topTracks.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-[#b9bbbe]">
                      <p className="text-sm sm:text-base">Žádná Spotify aktivita</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {analyticsData.topTracks.slice(0, 10).map((track, index) => (
                        <div key={`${track.track_name}-${track.artist}`} className="bg-[#36393f] rounded-lg p-3 sm:p-4 border border-[#40444b]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                              <span className="text-sm sm:text-base font-bold text-[#1db954] min-w-[1.5rem] sm:min-w-[2rem]">
                                {index + 1}.
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-medium text-sm sm:text-base truncate">{track.track_name}</div>
                                <div className="text-[#b9bbbe] text-xs sm:text-sm truncate">{track.artist}</div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="text-white font-bold text-sm sm:text-base">{track.play_count}×</div>
                              <div className="text-[#b9bbbe] text-xs sm:text-sm">přehrání</div>
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
