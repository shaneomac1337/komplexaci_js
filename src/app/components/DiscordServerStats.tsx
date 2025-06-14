'use client';

import { useState, useEffect } from 'react';

interface OnlineMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: string;
  activity: any;
  roles: string[];
  isRealOnline?: boolean;
  joinedAt?: string;
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
  hasRealPresenceData?: boolean;
  lastUpdated: string;
  error?: string;
}

export default function DiscordServerStats() {
  const [stats, setStats] = useState<DiscordStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/discord/server-stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Discord stats');
        }
        
        const data = await response.json();
        setStats(data);
        setError(data.error || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set fallback data
        setStats({
          name: 'Komplexáci',
          memberCount: 15,
          onlineCount: 3,
          icon: null,
          description: 'Herní komunita v důchodu',
          features: [],
          boostLevel: 0,
          boostCount: 0,
          verificationLevel: 1,
          onlineMembers: [],
          hasRealPresenceData: false,
          lastUpdated: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-700/30 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 mr-3 bg-blue-400 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-600 rounded w-32 animate-pulse"></div>
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

  return (
    <div className="bg-gray-700/30 rounded-xl p-4 border border-blue-500/20">
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
        <div>
          <h4 className="text-lg font-semibold text-white">{stats.name}</h4>
          {error && (
            <p className="text-xs text-yellow-400">⚠️ Zobrazují se záložní data</p>
          )}
        </div>
      </div>
      

      <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
        <span>Aktualizováno: {formatLastUpdated(stats.lastUpdated)}</span>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
          <span>Live</span>
        </div>
      </div>

      {/* Online Members Section */}
      {stats.onlineMembers && stats.onlineMembers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-600/30">
          <h5 className="text-sm font-semibold text-blue-300 mb-2 flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
            Členové serveru
          </h5>
          <p className="text-xs text-gray-400 mb-3">
            👥 Všichni členové Discord serveru
          </p>
          <div
            className="space-y-2 max-h-48 overflow-y-auto pr-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937'
            }}
          >
            {stats.onlineMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 text-xs">
                <div>
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
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{member.displayName}</div>
                  <div className="text-gray-400 text-xs truncate">@{member.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}