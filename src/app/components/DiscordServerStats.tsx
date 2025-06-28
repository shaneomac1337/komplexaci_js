'use client';

import { useState, useEffect } from 'react';

interface OnlineMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string;
  activity: any;
  customStatus: {
    name: string;
    emoji: {
      name: string;
      id: string | null;
      animated: boolean;
    } | null;
    state: string;
  } | null;
  streaming: {
    isStreaming: boolean;
    channelName: string;
    channelId: string;
    streamingTo?: string;
    streamType?: string;
    inVoice?: boolean;
  } | null;
  roles: string[];
  isRealOnline?: boolean;
  joinedAt?: string;
}

interface ActiveMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string;
  activityScore: number;
  onlineTime: number;
  statusChanges: number;
  isOnline: boolean;
}

interface DiscordStats {
  name: string;
  memberCount: number;
  onlineCount: number;
  icon: string | null;
  description: string;
  features: string[];
  boostLevel: number;
  boostCount: number;
  verificationLevel: number;
  onlineMembers: OnlineMember[];
  mostActiveMembers: ActiveMember[];
  streamingStats?: {
    totalStreaming: number;
    totalInVoice: number;
    streamingUsers: Array<{
      id: string;
      displayName: string;
      channelName: string;
      streamType: string;
    }>;
  };
  hasRealPresenceData?: boolean;
  lastUpdated: string;
  dataSource?: 'GATEWAY' | 'REST_API' | 'FALLBACK';
  error?: string;
}

export default function DiscordServerStats() {
  const [stats, setStats] = useState<DiscordStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('DiscordServerStats useEffect running');

    const fetchStats = async () => {
      try {
        console.log('Fetching Discord stats...');
        const response = await fetch('/api/discord/server-stats');

        if (!response.ok) {
          throw new Error('Failed to fetch Discord stats');
        }

        const data = await response.json();
        console.log('Discord stats received:', data);

        // Debug streaming data
        if (data.streamingStats) {
          console.log('🔍 Streaming stats received:', data.streamingStats);
        }

        // Debug individual member streaming data
        const streamingMembers = data.onlineMembers?.filter((member: OnlineMember) => member.streaming?.isStreaming);
        const voiceMembers = data.onlineMembers?.filter((member: OnlineMember) => member.streaming?.inVoice || member.streaming?.isStreaming);

        console.log('🔍 All online members with streaming data:', data.onlineMembers?.map(m => ({
          name: m.displayName,
          streaming: m.streaming
        })));

        if (streamingMembers?.length > 0) {
          console.log('🔴 Members currently streaming:', streamingMembers);
        }

        if (voiceMembers?.length > 0) {
          console.log('🎤 Members in voice:', voiceMembers);
        }

        setStats(data);
        setError(data.error || null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Discord stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 mr-3 bg-blue-400 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-600 rounded w-32 animate-pulse"></div>
        </div>
        <div className="text-center py-2 mb-3">
          <p className="text-sm text-gray-400">🔄 Načítání Discord serveru...</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 bg-gray-600 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-gray-500 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-red-500/20">
        <div className="text-red-400 text-sm">
          Nepodařilo se načíst Discord statistiky
        </div>
      </div>
    );
  }

  const getVerificationLevelText = (level: number) => {
    const levels = ['Žádná', 'Nízká', 'Střední', 'Vysoká', 'Nejvyšší'];
    return levels[level] || 'Neznámá';
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'idle': return 'bg-yellow-400';
      case 'dnd': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Neaktivní';
      case 'dnd': return 'Nerušit';
      default: return 'Offline';
    }
  };

  const getActivityIcon = (activity: any) => {
    if (!activity) return '';
    
    switch (activity.type) {
      case 0: return '🎮'; // Playing
      case 1: return '📺'; // Streaming
      case 2: return '🎵'; // Listening (Spotify)
      case 3: return '📺'; // Watching
      case 4: return '📝'; // Custom status
      case 5: return '🏆'; // Competing
      default: return '🎮';
    }
  };

  const formatActivityName = (activity: any) => {
    if (!activity) return '';

    // For Spotify, show artist - song format
    if (activity.name === 'Spotify' && activity.details && activity.state) {
      return `${activity.details} - ${activity.state}`;
    }

    // For games with details (like rich presence)
    if (activity.details) {
      return `${activity.name}: ${activity.details}`;
    }

    return activity.name;
  };

  const formatCustomStatus = (customStatus: any) => {
    if (!customStatus) return '';

    let statusText = '';

    // Add emoji if present
    if (customStatus.emoji) {
      if (customStatus.emoji.id) {
        // Custom emoji - use Discord CDN
        const extension = customStatus.emoji.animated ? 'gif' : 'png';
        statusText += `<img src="https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${extension}" alt="${customStatus.emoji.name}" class="inline w-4 h-4" /> `;
      } else if (customStatus.emoji.name) {
        // Unicode emoji
        statusText += `${customStatus.emoji.name} `;
      }
    }

    // Add status text
    if (customStatus.state) {
      statusText += customStatus.state;
    } else if (customStatus.name) {
      statusText += customStatus.name;
    }

    return statusText;
  };

  // Separate online and offline members
  const onlineMembers = stats.onlineMembers.filter(member =>
    member.status && member.status !== 'offline' && member.status !== 'unknown'
  );
  const offlineMembers = stats.onlineMembers.filter(member =>
    !member.status || member.status === 'offline' || member.status === 'unknown'
  );

  return (
    <div className="bg-gray-700/30 rounded-xl p-4 border border-blue-500/20 transition-all duration-300 ease-in-out">
      <div className="flex items-center mb-3">
        <div className="flex items-center mr-3">
          {stats.icon ? (
            <img
              src={stats.icon}
              alt={`${stats.name} icon`}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-white">{stats.name}</h4>
          {error && (
            <p className="text-xs text-yellow-400">⚠️ Zobrazují se záložní data</p>
          )}
        </div>
      </div>

      {/* Server Statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4 transition-all duration-300 ease-in-out">
        <div>
          <div className="text-gray-400">Členové</div>
          <div className="text-white font-semibold">{stats.memberCount}</div>
        </div>
        <div>
          <div className="text-gray-400">Online</div>
          <div className="text-green-400 font-semibold">{onlineMembers.length}</div>
        </div>
        <div>
          <div className="text-gray-400">Boost Level</div>
          <div className="text-purple-400 font-semibold">
            {stats.boostLevel > 0 ? `Level ${stats.boostLevel}` : 'Žádný'}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Boosts</div>
          <div className="text-purple-400 font-semibold">{stats.boostCount}</div>
        </div>
      </div>

      {/* Live Activity Summary - Simple counts only */}
      {stats.streamingStats && (stats.streamingStats.totalStreaming > 0 || stats.streamingStats.totalInVoice > 0) && (
        <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-red-500/20">
          <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center">
            <span className="mr-2">📺</span>
            Živá aktivita
          </h5>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {stats.streamingStats.totalStreaming > 0 && (
              <div>
                <div className="text-gray-400">Streamuje</div>
                <div className="text-red-400 font-semibold">{stats.streamingStats.totalStreaming}</div>
              </div>
            )}
            {stats.streamingStats.totalInVoice > 0 && (
              <div>
                <div className="text-gray-400">Ve voice</div>
                <div className="text-green-400 font-semibold">{stats.streamingStats.totalInVoice}</div>
              </div>
            )}
          </div>
        </div>
      )}
      

      <div className="text-xs text-gray-500 mt-2 flex justify-end items-center">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${
            stats.dataSource === 'GATEWAY' ? 'bg-green-400 animate-pulse' :
            stats.dataSource === 'REST_API' ? 'bg-yellow-400' :
            'bg-red-400'
          }`}></div>
          <span className={
            stats.dataSource === 'GATEWAY' ? 'text-green-400 font-medium' :
            stats.dataSource === 'REST_API' ? 'text-yellow-400' :
            'text-red-400'
          }>
            {stats.dataSource === 'GATEWAY' ? '🚀 Real-time' :
             stats.dataSource === 'REST_API' ? '📡 API' :
             '❌ Offline'}
          </span>
        </div>
      </div>

      {/* Online Members Section */}
      {onlineMembers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-600/30">
          <h5 className="text-sm font-semibold text-green-300 mb-2 flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Online členové ({onlineMembers.length})
          </h5>
          <div
            className="space-y-3 max-h-48 overflow-y-auto pr-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937'
            }}
          >
            {onlineMembers.map((member) => (
              <div key={member.id} className="flex items-start space-x-3 text-xs">
                <div className="relative">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Status indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-700 ${getStatusColor(member.status)}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="text-white font-medium truncate">{member.displayName}</div>
                    <div className="text-gray-500 text-xs">({getStatusText(member.status)})</div>
                  </div>
                  <div className="text-gray-400 text-xs truncate">@{member.username}</div>
                  {member.customStatus && (
                    <div className="text-purple-300 text-xs mt-1 flex items-start">
                      <span className="mr-1 mt-0.5 flex-shrink-0">💭</span>
                      <span
                        className="break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatCustomStatus(member.customStatus) }}
                      ></span>
                    </div>
                  )}
                  {member.activity &&
                   !(member.streaming?.isStreaming && member.activity.name === 'Screen Share') && (
                    <div className="text-blue-300 text-xs mt-1 flex items-start">
                      <span className="mr-1 mt-0.5 flex-shrink-0">{getActivityIcon(member.activity)}</span>
                      <span className="break-words leading-relaxed">{formatActivityName(member.activity)}</span>
                    </div>
                  )}

                  {/* Simple Streaming/Voice Status */}
                  {member.streaming?.isStreaming && (
                    <div className="text-red-400 text-xs mt-1 flex items-center">
                      <span className="mr-1">📺</span>
                      <span>
                        Streamuje: {
                          member.activity?.type === 0
                            ? member.activity.name // Show game name if playing
                            : member.streaming.channelName // Otherwise show channel
                        }
                      </span>
                    </div>
                  )}

                  {/* Voice Channel Status (if not streaming) */}
                  {member.streaming?.inVoice && !member.streaming?.isStreaming && (
                    <div className="text-green-400 text-xs mt-1 flex items-center">
                      <span className="mr-1">🎤</span>
                      <span>{member.streaming.channelName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Members Section */}
      {offlineMembers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-600/30">
          <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            Offline členové ({offlineMembers.length})
          </h5>
          <div
            className="space-y-2 max-h-40 overflow-y-auto pr-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937'
            }}
          >
            {offlineMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 text-xs opacity-60">
                <div className="relative">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.displayName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Offline indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-700 bg-gray-500"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-300 font-medium truncate">{member.displayName}</div>
                  <div className="text-gray-500 text-xs truncate">@{member.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}