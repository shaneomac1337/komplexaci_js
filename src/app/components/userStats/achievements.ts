import type { Achievement, UserStats } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  // Gaming
  { id: 'marathon-gamer', title: 'Maratonec', description: 'Hraj 6+ hodin v jednom dni', icon: '🎮', threshold: 360, category: 'gaming' },
  { id: 'game-variety', title: 'Všeuměl', description: 'Zahraj 5 různých her za den', icon: '🎲', threshold: 5, category: 'gaming' },

  // Voice
  { id: 'social-butterfly', title: 'Společenský', description: '10+ hodin ve voice za den', icon: '🎤', threshold: 600, category: 'voice' },
  { id: 'streamer', title: 'Streamer', description: '2+ hodiny streamování za den', icon: '📺', threshold: 120, category: 'voice' },

  // Spotify
  { id: 'music-lover', title: 'Meloman', description: '100+ skladeb za den', icon: '🎵', threshold: 100, category: 'spotify' },
  { id: 'dj', title: 'DJ', description: '20+ různých interpretů za den', icon: '🎧', threshold: 20, category: 'spotify' },

  // Special
  { id: 'night-owl', title: 'Noční sova', description: 'Aktivní po půlnoci', icon: '🦉', threshold: 1, category: 'special' },
  { id: 'early-bird', title: 'Ranní ptáče', description: 'Aktivní před 6:00', icon: '🐦', threshold: 1, category: 'special' },
];

export interface AchievementProgress {
  current: number;
  unlocked: boolean;
  progress: number;
}

export const calculateAchievementProgress = (
  achievement: Achievement,
  stats: UserStats | null
): AchievementProgress => {
  if (!stats) return { current: 0, unlocked: false, progress: 0 };

  let current = 0;

  switch (achievement.id) {
    case 'marathon-gamer':
      current = stats.data.totals.totalGameTime;
      break;
    case 'game-variety':
      current = stats.data.totals.gamesPlayed || stats.data.gameSessions?.length || 0;
      break;
    case 'social-butterfly':
      current = stats.data.totals.totalVoiceTime;
      break;
    case 'streamer':
      current = stats.data.totals.totalScreenShareTime || 0;
      break;
    case 'music-lover':
      current = stats.data.totals.totalSongsPlayed;
      break;
    case 'dj':
      current = stats.data.totals.artistsListened || stats.data.spotifyActivity?.length || 0;
      break;
    case 'night-owl':
      current = stats.data.recentSessions?.some((session) => {
        const hour = new Date(session.start_time).getHours();
        return hour >= 0 && hour < 6;
      }) ? 1 : 0;
      break;
    case 'early-bird':
      current = stats.data.recentSessions?.some((session) => {
        const hour = new Date(session.start_time).getHours();
        return hour >= 4 && hour < 6;
      }) ? 1 : 0;
      break;
    default:
      current = 0;
  }

  const unlocked = current >= achievement.threshold;
  const progress = Math.min((current / achievement.threshold) * 100, 100);

  return { current, unlocked, progress };
};

