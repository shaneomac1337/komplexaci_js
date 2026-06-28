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
    const period = searchParams.get('period') === 'monthly' ? 'monthly' : 'daily';

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Missing category parameter'
      }, { status: 400 });
    }

    const db = getAnalyticsDatabase();
    const gateway = getDiscordGateway();

    console.log(`🏆 Fetching ${period} standings for category: ${category}`);

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

    // Category config: daily reads a user_stats column directly; monthly sums
    // daily_snapshots over the Prague calendar month + today's live counter.
    const CATEGORY_CONFIG: Record<string, { dailyCol: string; monthlyMetric: string; liveCol: string; unit: string }> = {
      gamer:    { dailyCol: 'daily_games_minutes', monthlyMetric: 'games_minutes',   liveCol: 'daily_games_minutes', unit: 'minut' },
      nerd:     { dailyCol: 'daily_online_minutes', monthlyMetric: 'online_minutes', liveCol: 'daily_online_minutes', unit: 'minut' },
      listener: { dailyCol: 'daily_spotify_songs', monthlyMetric: 'spotify_minutes', liveCol: 'daily_spotify_songs', unit: 'písniček' },
    };

    const config = CATEGORY_CONFIG[category];
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category'
      }, { status: 400 });
    }
    const unit = config.unit;

    // Build the ranked rows: [{ user_id, value }]
    let rows: Array<{ user_id: string; value: number }>;
    if (period === 'monthly') {
      rows = db.getMonthlyLeaderboard(config.monthlyMetric, config.liveCol, 50);
    } else {
      const valueField = config.dailyCol;
      rows = (db.getDatabase().prepare(
        `SELECT user_id, ${valueField} AS value
         FROM user_stats
         WHERE ${valueField} > 0
         ORDER BY ${valueField} DESC
         LIMIT 50`
      ).all() as any[]).map(r => ({ user_id: r.user_id, value: r.value }));
    }

    // Transform results into standings
    const standings: StandingsEntry[] = rows.map((result, index) => {
      const member = memberMap.get(result.user_id);
      return {
        userId: result.user_id,
        displayName: member?.displayName || 'Unknown User',
        avatar: member?.avatar || null,
        value: result.value,
        unit,
        rank: index + 1
      };
    });

    // Statistics computed from the result set (works for both periods)
    const participantsCount = standings.length;
    const totalValueSum = standings.reduce((sum, s) => sum + (s.value || 0), 0);
    const averageValue = participantsCount > 0 ?
      Math.round(totalValueSum / participantsCount) : 0;

    console.log(`🏆 Found ${standings.length} entries for ${category} standings`);

    return NextResponse.json({
      success: true,
      standings,
      category,
      period,
      totalEntries: standings.length,
      statistics: {
        totalParticipants: participantsCount,
        totalValue: totalValueSum,
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
