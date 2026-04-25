'use client';

import { useState, useEffect, useRef } from 'react';
import SafeImage from './SafeImage';
import type {
  UserStatsModalProps,
  UserStats,
} from './userStats/types';
import { formatOnlineTime } from './userStats/formatters';
import OverviewTab from './userStats/OverviewTab';
import {
  ACHIEVEMENTS,
  calculateAchievementProgress,
  getUnlockedAchievements,
  getInProgressAchievements,
} from './userStats/achievements';
import './user-stats-modal.css';

export default function UserStatsModal({ isOpen, onClose, userId, displayName, avatar }: UserStatsModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements'>('overview');
  const prevDataRef = useRef<string>('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserStats(true);

      // 🔄 REAL-TIME UPDATES: Refresh every 30 seconds while modal is open
      const interval = setInterval(() => {
        fetchUserStats(false);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen, userId]);

  const fetchUserStats = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    }
    setError(null);

    try {
      // Fetch today's stats (1d timeRange for daily data)
      const response = await fetch(`/api/analytics/user/${userId}?timeRange=1d`);

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();

      if (data.success) {
        // Only update state if data actually changed
        const dataStr = JSON.stringify(data);
        if (dataStr !== prevDataRef.current) {
          prevDataRef.current = dataStr;
          setStats(data);
        }
      } else {
        throw new Error(data.message || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const todayLabel = new Date().toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
  });

  const liveState: 'is-loading' | 'is-live' | 'is-error' =
    initialLoading ? 'is-loading' : error ? 'is-error' : 'is-live';
  const liveLabel =
    liveState === 'is-loading' ? 'Načítání' : liveState === 'is-error' ? 'Offline' : 'Live';

  const TABS: Array<{ id: 'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements'; label: string; icon: string }> = [
    { id: 'overview', label: 'Přehled', icon: '📊' },
    { id: 'spotify', label: 'Spotify', icon: '🎵' },
    { id: 'gaming', label: 'Hry', icon: '🎮' },
    { id: 'voice', label: 'Voice', icon: '🎤' },
    { id: 'achievements', label: 'Úspěchy', icon: '🏆' },
  ];

  return (
    <div className="user-stats-lounge scrim" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="drag-handle" aria-hidden="true"><i /></div>

        <div className="header">
          <div className="avatar-wrap">
            <SafeImage
              src={avatar}
              alt={displayName}
              width={40}
              height={40}
              fallback={
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)' }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{displayName.charAt(0).toUpperCase()}</span>
                </div>
              }
            />
          </div>
          <div className="meta">
            <span className="name">{displayName}</span>
            <span className="sub">Dnešní aktivita · {todayLabel}</span>
          </div>
          <span className={`live-pill ${liveState}`} aria-live="polite">
            <i />
            {liveLabel}
          </span>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zavřít">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="body">
          {initialLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Načítání statistik...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">❌ {error}</p>
              <button
                onClick={() => fetchUserStats(true)}
                className="mt-2 px-4 py-2 min-h-[44px] bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
              >
                Zkusit znovu
              </button>
            </div>
          )}

          {stats && !initialLoading && (
            <div className="space-y-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && <OverviewTab stats={stats} />}

              {/* Spotify Tab */}
              {activeTab === 'spotify' && (
                <div className="space-y-4">
                  {/* Spotify Stats */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3">🎵 Spotify statistiky (celkem)</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Celkem písní dnes</div>
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
                    <div className="mt-3 pt-2 border-t border-gray-600/30">
                      <div className="text-xs text-gray-500">
                        💡 Celkový počet zahrnuje aktivní i dokončené session
                      </div>
                    </div>
                  </div>

                  {/* Top Artists */}
                  {stats.data.spotifyActivity && stats.data.spotifyActivity.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">🎤 Interpreti (kumulované počty)</h4>
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
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-600/30">
                        <div className="text-xs text-gray-500">
                          🎵 Počty jsou kumulované ze všech poslechů během dne
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Tracks */}
                  {stats.data.topTracks && stats.data.topTracks.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">🎶 Nejposlouchanější písně (kumulované)</h4>
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
                      <div className="mt-3 pt-2 border-t border-gray-600/30">
                        <div className="text-xs text-gray-500">
                          🔄 Počty přehrání jsou kumulované za celý den
                        </div>
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
                    <h4 className="text-sm font-semibold text-blue-300 mb-3">🎮 Herní statistiky (celkem)</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Celkový čas dnes</div>
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
                    <div className="mt-3 pt-2 border-t border-gray-600/30">
                      <div className="text-xs text-gray-500">
                        💡 Celkový čas zahrnuje aktivní i dokončené session
                      </div>
                    </div>
                  </div>

                  {/* Game Sessions */}
                  {stats.data.gameSessions && stats.data.gameSessions.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-300 mb-3">🏆 Jednotlivé hry (kumulované časy)</h4>
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
                      <div className="mt-3 pt-2 border-t border-gray-600/30">
                        <div className="text-xs text-gray-500">
                          📊 Časy jsou kumulované ze všech dokončených session pro každou hru
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Gaming Activity */}
                  {(!stats.data.gameSessions || stats.data.gameSessions.length === 0) && (
                    <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-sm">
                        🎮 Dnes ještě nehrál žádné hry
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
                    <h4 className="text-sm font-semibold text-yellow-300 mb-3">🎤 Voice statistiky (celkem)</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Celkový čas dnes</div>
                        <div className="text-yellow-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalVoiceTime)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Screen share celkem</div>
                        <div className="text-yellow-400 font-semibold">
                          {formatOnlineTime(stats.data.totals.totalScreenShareTime || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-600/30">
                      <div className="text-xs text-gray-500">
                        💡 Celkový čas zahrnuje aktivní i dokončené session
                      </div>
                    </div>
                  </div>

                  {/* Voice Channels */}
                  {stats.data.voiceActivity && stats.data.voiceActivity.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-300 mb-3">📢 Kanály (kumulované časy)</h4>
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
                      <div className="mt-3 pt-2 border-t border-gray-600/30">
                        <div className="text-xs text-gray-500">
                          🎙️ Časy jsou kumulované ze všech dokončených session v každém kanálu
                        </div>
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

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <div className="space-y-4">
                  {/* Unlocked Achievements */}
                  {getUnlockedAchievements(stats).length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-300 mb-3">
                        ✨ Odemčené úspěchy ({getUnlockedAchievements(stats).length}/{ACHIEVEMENTS.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {getUnlockedAchievements(stats).map((achievement) => {
                          const { current } = calculateAchievementProgress(achievement, stats);
                          return (
                            <div key={achievement.id} className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/30">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl">{achievement.icon}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold text-white">{achievement.title}</div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                      ✓ Dokončeno
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400">{achievement.description}</div>
                                  <div className="text-xs text-green-400 mt-1">
                                    {achievement.id === 'marathon-gamer' || achievement.id === 'social-butterfly' || achievement.id === 'streamer'
                                      ? formatOnlineTime(current)
                                      : achievement.id === 'night-owl' || achievement.id === 'early-bird'
                                      ? 'Splněno!'
                                      : `${current} / ${achievement.threshold}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* In-Progress Achievements */}
                  {getInProgressAchievements(stats).length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3">
                        🎯 Rozpracované úspěchy
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {getInProgressAchievements(stats).map((achievement) => {
                          const { current, progress } = calculateAchievementProgress(achievement, stats);
                          return (
                            <div key={achievement.id} className="bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl opacity-50">{achievement.icon}</div>
                                <div className="flex-1">
                                  <div className="font-semibold text-white">{achievement.title}</div>
                                  <div className="text-xs text-gray-400">{achievement.description}</div>
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-gray-400">
                                        {achievement.id === 'marathon-gamer' || achievement.id === 'social-butterfly' || achievement.id === 'streamer'
                                          ? `${formatOnlineTime(current)} / ${formatOnlineTime(achievement.threshold)}`
                                          : achievement.id === 'night-owl' || achievement.id === 'early-bird'
                                          ? 'Zkus být aktivní ve správný čas!'
                                          : `${current} / ${achievement.threshold}`}
                                      </span>
                                      <span className="text-purple-400 font-semibold">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No Achievements Yet */}
                  {getUnlockedAchievements(stats).length === 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-3">🎯</div>
                      <div className="text-gray-400 text-sm mb-2">Zatím nemáš žádné odemčené úspěchy</div>
                      <div className="text-xs text-gray-500">
                        Pokračuj v aktivitách a získej své první achievementy!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="footer">Data se resetují každý den o půlnoci (CET)</div>
      </div>
    </div>
  );
}