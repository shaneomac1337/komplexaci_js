import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getDiscordGateway } from '@/lib/discord-gateway';

export interface DailyAward {
  category: 'nerd' | 'gamer' | 'streamer';
  title: string;
  czechTitle: string;
  description: string;
  winner: {
    id: string;
    displayName: string;
    avatar: string | null;
    value: number; // minutes or track count
    unit: string; // 'minut' | 'minut streamování'
    achievedAt: string; // timestamp when they achieved this score (for tie-breaking)
  } | null;
  icon: string; // emoji
  totalParticipants: number; // how many users had activity in this category today
}

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const gateway = getDiscordGateway();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`🏆 Calculating daily awards for ${today}`);

    // Get all Discord members for avatar and display name info
    const allMembers = gateway.isReady() ? gateway.getAllMembers() : [];
    const memberMap = new Map(allMembers.map(m => [m.id, m]));

    // 1. NERD OF THE DAY - Most online time (from real-time user_stats)
    const nerdQuery = db.getDatabase().prepare(`
      SELECT
        user_id,
        daily_online_minutes as online_minutes,
        last_daily_reset as created_at
      FROM user_stats
      WHERE daily_online_minutes > 0
      ORDER BY daily_online_minutes DESC, last_daily_reset ASC
      LIMIT 1
    `);
    const nerdWinner = nerdQuery.get() as any;

    const nerdParticipants = db.getDatabase().prepare(`
      SELECT COUNT(*) as count
      FROM user_stats
      WHERE daily_online_minutes > 0
    `).get() as any;

    // 2. GAMER OF THE DAY - Most gaming time (from real-time user_stats)
    const gamerQuery = db.getDatabase().prepare(`
      SELECT
        user_id,
        daily_games_minutes as total_gaming_minutes,
        last_daily_reset as created_at
      FROM user_stats
      WHERE daily_games_minutes > 0
      ORDER BY daily_games_minutes DESC, last_daily_reset ASC
      LIMIT 1
    `);
    const gamerWinner = gamerQuery.get() as any;

    const gamerParticipants = db.getDatabase().prepare(`
      SELECT COUNT(*) as count
      FROM user_stats
      WHERE daily_games_minutes > 0
    `).get() as any;

    // 3. STREAMER OF THE DAY - Most streaming minutes (from real-time user_stats)
    const streamerQuery = db.getDatabase().prepare(`
      SELECT
        user_id,
        daily_streaming_minutes as total_streaming_minutes,
        last_daily_reset as created_at
      FROM user_stats
      WHERE daily_streaming_minutes > 0
      ORDER BY daily_streaming_minutes DESC, last_daily_reset ASC
      LIMIT 1
    `);
    const streamerWinner = streamerQuery.get() as any;

    const streamerParticipants = db.getDatabase().prepare(`
      SELECT COUNT(*) as count
      FROM user_stats
      WHERE daily_streaming_minutes > 0
    `).get() as any;

    // Helper function to create award object
    const createAward = (
      category: DailyAward['category'],
      title: string,
      czechTitle: string,
      description: string,
      icon: string,
      winner: any,
      valueField: string,
      unit: string,
      participants: number
    ): DailyAward => {
      let awardWinner = null;
      
      if (winner && winner[valueField] > 0) {
        const member = memberMap.get(winner.user_id);
        awardWinner = {
          id: winner.user_id,
          displayName: member?.displayName || 'Unknown User',
          avatar: member?.avatar || null,
          value: winner[valueField],
          unit,
          achievedAt: winner.first_achieved || winner.created_at || new Date().toISOString()
        };
      }

      return {
        category,
        title,
        czechTitle,
        description,
        winner: awardWinner,
        icon,
        totalParticipants: participants
      };
    };

    // Create awards array
    const awards: DailyAward[] = [
      createAward(
        'nerd',
        'Nerd of the Day',
        'Nerd dne',
        'Nejvíce času stráveného online',
        '🤓',
        nerdWinner,
        'online_minutes',
        'minut',
        nerdParticipants?.count || 0
      ),
      createAward(
        'gamer',
        'Gamer of the Day',
        'Pařmen dne',
        'Nejvíce času stráveného hraním',
        '🎮',
        gamerWinner,
        'total_gaming_minutes',
        'minut',
        gamerParticipants?.count || 0
      ),
      createAward(
        'streamer',
        'Streamer of the Day',
        'Streamer dne',
        'Nejvíce minut streamování',
        '📺',
        streamerWinner,
        'total_streaming_minutes',
        'minut',
        streamerParticipants?.count || 0
      )
    ];

    console.log(`🏆 Daily awards calculated:`, awards.map(a => 
      `${a.czechTitle}: ${a.winner?.displayName || 'Nikdo'} (${a.winner?.value || 0} ${a.winner?.unit || ''})`
    ));

    return NextResponse.json({
      success: true,
      date: today,
      awards,
      dataSource: gateway.isReady() ? 'GATEWAY' : 'DATABASE',
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
