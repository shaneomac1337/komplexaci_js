import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getDiscordGateway } from '@/lib/discord-gateway';

export interface DailyAward {
  id: string;
  title: string;
  icon: string;
  description: string;
  winner: {
    userId: string;
    displayName: string;
    avatar: string | null;
    value: number;
    unit: string;
  } | null;
  participantCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const gateway = getDiscordGateway();

    console.log('🏆 Calculating daily awards...');

    // Get Discord members for display names and avatars
    const memberMap = new Map();
    if (gateway.isReady()) {
      const guild = gateway.getGuild();
      if (guild) {
        guild.members.cache.forEach(member => {
          memberMap.set(member.id, {
            displayName: member.displayName,
            avatar: member.displayAvatarURL({ size: 64 })
          });
        });
      }
    }

    // Helper function to get winner for a category
    const getWinner = (query: string, valueField: string, unit: string) => {
      const result = db.getDatabase().prepare(query).get() as any;
      if (!result || result[valueField] <= 0) {
        return null;
      }

      const member = memberMap.get(result.user_id);
      return {
        userId: result.user_id,
        displayName: member?.displayName || 'Unknown User',
        avatar: member?.avatar || null,
        value: result[valueField],
        unit
      };
    };

    // Helper function to get participant count
    const getParticipantCount = (query: string) => {
      const result = db.getDatabase().prepare(query).get() as any;
      return result?.count || 0;
    };

    // 1. Pařmen dne (Gamer of the Day) - Most gaming time
    const gamerWinner = getWinner(
      `SELECT user_id, daily_games_minutes 
       FROM user_stats 
       WHERE daily_games_minutes > 0 
       ORDER BY daily_games_minutes DESC 
       LIMIT 1`,
      'daily_games_minutes',
      'minut'
    );

    const gamerParticipants = getParticipantCount(
      `SELECT COUNT(*) as count 
       FROM user_stats 
       WHERE daily_games_minutes > 0`
    );

    // 2. Nerd dne (Nerd of the Day) - Most online time
    const nerdWinner = getWinner(
      `SELECT user_id, daily_online_minutes 
       FROM user_stats 
       WHERE daily_online_minutes > 0 
       ORDER BY daily_online_minutes DESC 
       LIMIT 1`,
      'daily_online_minutes',
      'minut'
    );

    const nerdParticipants = getParticipantCount(
      `SELECT COUNT(*) as count 
       FROM user_stats 
       WHERE daily_online_minutes > 0`
    );

    // 3. Posluchač dne (Listener of the Day) - Most Spotify songs
    const listenerWinner = getWinner(
      `SELECT user_id, daily_spotify_songs 
       FROM user_stats 
       WHERE daily_spotify_songs > 0 
       ORDER BY daily_spotify_songs DESC 
       LIMIT 1`,
      'daily_spotify_songs',
      'písniček'
    );

    const listenerParticipants = getParticipantCount(
      `SELECT COUNT(*) as count 
       FROM user_stats 
       WHERE daily_spotify_songs > 0`
    );

    // Create awards array
    const awards: DailyAward[] = [
      {
        id: 'gamer',
        title: 'Pařmen dne',
        icon: '🎮',
        description: 'Nejvíce času stráveného hraním',
        winner: gamerWinner,
        participantCount: gamerParticipants
      },
      {
        id: 'nerd',
        title: 'Nerd dne',
        icon: '🤓',
        description: 'Nejvíce času stráveného online',
        winner: nerdWinner,
        participantCount: nerdParticipants
      },
      {
        id: 'listener',
        title: 'Posluchač dne',
        icon: '🎵',
        description: 'Nejvíce písniček na Spotify',
        winner: listenerWinner,
        participantCount: listenerParticipants
      }
    ];

    console.log('🏆 Daily awards calculated:', awards.map(a => 
      `${a.title}: ${a.winner?.displayName || 'Nikdo'} (${a.winner?.value || 0} ${a.winner?.unit || ''})`
    ));

    return NextResponse.json({
      success: true,
      awards,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error calculating daily awards:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate daily awards',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
