'use client';

import { useState, useEffect } from 'react';
import DiscordAvatar from './DiscordAvatar';

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  avatar: string | null;
}

interface UserStats {
  userId: string;
  timeRange: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: {
    totals: {
      totalSongsPlayed: number;
      totalOnlineTime: number;
      totalGameTime: number;
      totalVoiceTime: number;
      totalScreenShareTime: number;
      gamesPlayed: number;
      voiceChannelsUsed: number;
      artistsListened: number;
    };
    spotifyActivity: Array<{
      artist: string;
      plays_count: number;
      unique_tracks: number;
    }>;
    topTracks: Array<{
      track_name: string;
      artist: string;
      play_count: number;
    }>;
    gameSessions: Array<{
      game_name: string;
      total_minutes: number;
      session_count: number;
    }>;
    voiceActivity: Array<{
      channel_name: string;
      total_minutes: number;
      screen_share_minutes: number;
      session_count: number;
    }>;
    recentSessions: Array<{
      type: 'game' | 'voice' | 'spotify';
      name: string;
      start_time: string;
      duration_minutes: number;
      details?: string;
    }>;
  };
}

// Helper function to extract avatar hash from Discord CDN URL
function extractAvatarHash(avatarUrl: string): string | null {
  if (!avatarUrl) return null;
  const match = avatarUrl.match(/\/avatars\/\d+\/([a-f0-9]+)\.png/);
  return match ? match[1] : null;
}

export default function UserStatsModal({ isOpen, onClose, userId, displayName, avatar }: UserStatsModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'spotify' | 'gaming' | 'voice'>('overview');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserStats();
    }
  }, [isOpen, userId]);

  const fetchUserStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch today's stats (1d timeRange for daily data)
      const response = await fetch(`/api/analytics/user/${userId}?timeRange=1d`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
      } else {
        throw new Error(data.message || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatOnlineTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionTypeIcon = (type: string): string => {
    switch (type) {
      case 'game': return '🎮';
      case 'voice': return '🎤';
      case 'spotify': return '🎵';
      default: return '📊';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-purple-500/20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <DiscordAvatar
              userId={userId}
              avatar={avatar ? extractAvatarHash(avatar) : null}
              displayName={displayName}
              size={40}
            />
            <div>
              <h3 className="text-lg font-semibold text-white">{displayName}</h3>
              <p className="text-sm text-gray-400">Denní statistiky</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 bg-gray-750">
          {[
            { id: 'overview', label: '📊 Přehled', icon: '📊' },
            { id: 'spotify', label: '🎵 Spotify', icon: '🎵' },
            { id: 'gaming', label: '🎮 Hry', icon: '🎮' },
            { id: 'voice', label: '🎤 Voice', icon: '🎤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-300 border-b-2 border-purple-500 bg-gray-700/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(85vh-140px)] overflow-y-auto">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Načítání statistik...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">❌ {error}</p>
              <button
                onClick={fetchUserStats}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
              >
                Zkusit znovu
              </button>
            </div>
          )}

          {stats && !loading && (
            <div className="space-y-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Daily Overview */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3">📊 Dnešní přehled</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Online čas</div>
                        <div className="text-green-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalOnlineTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Spotify písně</div>
                        <div className="text-purple-400 font-semibold">
                          {stats.data.totals.totalSongsPlayed}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Herní čas</div>
                        <div className="text-blue-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalGameTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Voice čas</div>
                        <div className="text-yellow-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalVoiceTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {stats.data.recentSessions && stats.data.recentSessions.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">🕒 Nedávná aktivita</h4>
                      <div className="space-y-2">
                        {stats.data.recentSessions.slice(0, 5).map((session, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getSessionTypeIcon(session.type)}</span>
                              <div>
                                <div className="text-white">{session.name}</div>
                                {session.details && (
                                  <div className="text-gray-400 text-xs">{session.details}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-300">{formatOnlineTime(session.duration_minutes)}</div>
                              <div className="text-gray-500 text-xs">{formatDate(session.start_time)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spotify Tab */}
              {activeTab === 'spotify' && (
                <div className="space-y-4">
                  {/* Spotify Stats */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3">🎵 Spotify statistiky</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Celkem písní</div>
                        <div className="text-purple-400 font-semibold">
                          {stats.data.totals.totalSongsPlayed}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Různých interpretů</div>
                        <div className="text-purple-400 font-semibold">
                          {stats.data.totals.artistsListened || stats.data.spotifyActivity?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Artists */}
                  {stats.data.spotifyActivity && stats.data.spotifyActivity.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">🎤 Nejposlouchanější interpreti</h4>
                      <div className="space-y-2">
                        {stats.data.spotifyActivity.map((artist, index) => (
                          <div key={artist.artist} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-purple-300 font-medium">#{index + 1}</span>
                              <span className="text-white truncate">{artist.artist}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-purple-400 font-semibold">
                                {artist.plays_count} {artist.plays_count === 1 ? 'píseň' : 'písní'}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {artist.unique_tracks} {artist.unique_tracks === 1 ? 'track' : 'tracků'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Tracks */}
                  {stats.data.topTracks && stats.data.topTracks.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">🎶 Nejposlouchanější písně</h4>
                      <div className="space-y-2">
                        {stats.data.topTracks.map((track, index) => (
                          <div key={`${track.track_name}-${track.artist}`} className="text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <span className="text-purple-300 font-medium">#{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-white truncate">{track.track_name}</div>
                                  <div className="text-gray-400 text-xs truncate">{track.artist}</div>
                                </div>
                              </div>
                              <div className="text-purple-400 font-semibold ml-2">
                                {track.play_count}x
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Spotify Activity */}
                  {(!stats.data.spotifyActivity || stats.data.spotifyActivity.length === 0) && (
                    <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-sm">
                        🎵 Dnes ještě neposlouchal žádnou hudbu na Spotify
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gaming Tab */}
              {activeTab === 'gaming' && (
                <div className="space-y-4">
                  {/* Gaming Stats */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3">🎮 Herní statistiky</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Celkový čas</div>
                        <div className="text-blue-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalGameTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Různých her</div>
                        <div className="text-blue-400 font-semibold">
                          {stats.data.totals.gamesPlayed || stats.data.gameSessions?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Game Sessions */}
                  {stats.data.gameSessions && stats.data.gameSessions.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-300 mb-3">🏆 Nejhranější hry</h4>
                      <div className="space-y-2">
                        {stats.data.gameSessions.map((game, index) => (
                          <div key={game.game_name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-300 font-medium">#{index + 1}</span>
                              <span className="text-white truncate">{game.game_name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-blue-400 font-semibold">
                                {formatOnlineTime(game.total_minutes)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {game.session_count} {game.session_count === 1 ? 'session' : 'sessions'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Gaming Activity */}
                  {(!stats.data.gameSessions || stats.data.gameSessions.length === 0) && (
                    <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-sm">
                        � Dnes ještě nehrál žádné hry
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voice Tab */}
              {activeTab === 'voice' && (
                <div className="space-y-4">
                  {/* Voice Stats */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-yellow-300 mb-3">🎤 Voice statistiky</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Celkový čas</div>
                        <div className="text-yellow-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalVoiceTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Screen share</div>
                        <div className="text-yellow-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalScreenShareTime || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voice Channels */}
                  {stats.data.voiceActivity && stats.data.voiceActivity.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-300 mb-3">📢 Nejpoužívanější kanály</h4>
                      <div className="space-y-2">
                        {stats.data.voiceActivity.map((voice, index) => (
                          <div key={voice.channel_name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-300 font-medium">#{index + 1}</span>
                              <span className="text-white truncate">{voice.channel_name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-yellow-400 font-semibold">
                                {formatOnlineTime(voice.total_minutes)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {voice.session_count} {voice.session_count === 1 ? 'session' : 'sessions'}
                                {voice.screen_share_minutes > 0 && (
                                  <span className="ml-1">• {formatOnlineTime(voice.screen_share_minutes)} share</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Voice Activity */}
                  {(!stats.data.voiceActivity || stats.data.voiceActivity.length === 0) && (
                    <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-sm">
                        🎤 Dnes nebyl v žádném voice kanálu
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 text-center">
            Data se resetují každý den o půlnoci (CET)
          </div>
        </div>
      </div>
    </div>
  );
}