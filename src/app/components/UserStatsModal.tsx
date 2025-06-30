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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-purple-500/20">
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

        {/* Content */}
        <div className="p-4">
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

              {/* Spotify Activity */}
              {stats.data.spotifyActivity && stats.data.spotifyActivity.length > 0 && (
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
                    🎵 Nejposlouchanější interpreti dnes
                  </h4>
                  <div className="space-y-2">
                    {stats.data.spotifyActivity.slice(0, 5).map((artist, index) => (
                      <div key={artist.artist} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-300 font-medium">#{index + 1}</span>
                          <span className="text-white truncate">{artist.artist}</span>
                        </div>
                        <div className="text-purple-400 font-semibold">
                          {artist.plays_count} {artist.plays_count === 1 ? 'píseň' : 'písní'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Tracks */}
              {stats.data.topTracks && stats.data.topTracks.length > 0 && (
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
                    🎶 Nejposlouchanější písně dnes
                  </h4>
                  <div className="space-y-2">
                    {stats.data.topTracks.slice(0, 3).map((track, index) => (
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