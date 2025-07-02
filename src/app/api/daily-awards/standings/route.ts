import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getDiscordGateway } from '@/lib/discord-gateway';

export interface StandingsEntry {
  userId: string;
  displayName: string;
  avatar: string | null;
  value: number;
  unit: string;
  rank: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Missing category parameter'
      }, { status: 400 });
    }

    const db = getAnalyticsDatabase();
    const gateway = getDiscordGateway();

    console.log(`🏆 Fetching standings for category: ${category}`);

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

    let query: string;
    let valueField: string;
    let unit: string;

    // Determine query based on category
    switch (category) {
      case 'gamer':
        query = `SELECT user_id, daily_games_minutes 
                 FROM user_stats 
                 WHERE daily_games_minutes > 0 
                 ORDER BY daily_games_minutes DESC 
                 LIMIT 50`;
        valueField = 'daily_games_minutes';
        unit = 'minut';
        break;

      case 'nerd':
        query = `SELECT user_id, daily_online_minutes 
                 FROM user_stats 
                 WHERE daily_online_minutes > 0 
                 ORDER BY daily_online_minutes DESC 
                 LIMIT 50`;
        valueField = 'daily_online_minutes';
        unit = 'minut';
        break;

      case 'listener':
        query = `SELECT user_id, daily_spotify_songs 
                 FROM user_stats 
                 WHERE daily_spotify_songs > 0 
                 ORDER BY daily_spotify_songs DESC 
                 LIMIT 50`;
        valueField = 'daily_spotify_songs';
        unit = 'písniček';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid category'
        }, { status: 400 });
    }

    // Execute query
    const results = db.getDatabase().prepare(query).all() as any[];

    // Transform results into standings
    const standings: StandingsEntry[] = results.map((result, index) => {
      const member = memberMap.get(result.user_id);
      return {
        userId: result.user_id,
        displayName: member?.displayName || 'Unknown User',
        avatar: member?.avatar || null,
        value: result[valueField],
        unit,
        rank: index + 1
      };
    });

    // Get additional statistics for today
    const totalParticipants = db.getDatabase().prepare(`
      SELECT COUNT(*) as count
      FROM user_stats
      WHERE ${valueField} > 0
    `).get() as any;

    const totalValue = db.getDatabase().prepare(`
      SELECT SUM(${valueField}) as total
      FROM user_stats
      WHERE ${valueField} > 0
    `).get() as any;

    const averageValue = totalParticipants.count > 0 ?
      Math.round((totalValue.total || 0) / totalParticipants.count) : 0;

    console.log(`🏆 Found ${standings.length} entries for ${category} standings`);

    return NextResponse.json({
      success: true,
      standings,
      category,
      totalEntries: standings.length,
      statistics: {
        totalParticipants: totalParticipants.count || 0,
        totalValue: totalValue.total || 0,
        averageValue,
        unit
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching standings:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch standings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
