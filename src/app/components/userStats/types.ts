export interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  avatar: string | null;
}

export interface UserStats {
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
    serverAverages?: {
      avgGameTime: number;
      avgVoiceTime: number;
      avgSongsPlayed: number;
      totalActiveUsers: number;
    };
    percentiles?: {
      gameTimePercentile: number;
      voiceTimePercentile: number;
      songsPlayedPercentile: number;
    };
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  category: 'gaming' | 'voice' | 'spotify' | 'special';
}
