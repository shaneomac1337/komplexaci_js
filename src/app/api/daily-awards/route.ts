import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getDiscordGateway } from '@/lib/discord-gateway';
import { getBestDiscordAvatarUrl } from '@/lib/discord-avatar-utils';

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
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') === 'monthly' ? 'monthly' : 'daily';

    console.log(`🏆 Calculating ${period} awards...`);

    // Get Discord members for display names and avatars
    const memberMap = new Map();
    if (gateway.isReady()) {
      const guild = gateway.getGuild();
      if (guild) {
        guild.members.cache.forEach(member => {
          try {
            const avatarUrl = getBestDiscordAvatarUrl(member.id, member.user.avatar, member.user.discriminator, 64);
            memberMap.set(member.id, {
              displayName: member.displayName,
              avatar: avatarUrl
            });
            console.log(`✅ Member ${member.displayName} avatar: ${avatarUrl}`);
          } catch (error) {
            console.error(`❌ Error getting avatar for ${member.displayName}:`, error);
            memberMap.set(member.id, {
              displayName: member.displayName,
              avatar: null
            });
          }
        });
      }
    }

    // Validate + shape a winner from a (user_id, value) pair.
    const resolveWinner = (user_id: string, value: number, unit: string) => {
      if (!value || value <= 0) return null;
      const member = memberMap.get(user_id);
      let avatarUrl = member?.avatar || null;
      if (avatarUrl && (!avatarUrl.startsWith('https://') || !avatarUrl.includes('cdn.discordapp.com'))) {
        console.warn(`⚠️  Invalid avatar URL for ${member?.displayName}: ${avatarUrl}`);
        avatarUrl = null;
      }
      return {
        userId: user_id,
        displayName: member?.displayName || 'Unknown User',
        avatar: avatarUrl,
        value,
        unit
      };
    };

    // Category config. Daily reads a user_stats column directly; monthly sums
    // daily_snapshots over the Prague calendar month + today's live counter.
    const CATEGORY_CONFIG = [
      { id: 'gamer',    icon: '🎮', dailyTitle: 'Pařmen dne',     monthlyTitle: 'Pařmen měsíce',     description: 'Nejvíce času stráveného hraním',  dailyCol: 'daily_games_minutes', monthlyMetric: 'games_minutes',  liveCol: 'daily_games_minutes', unit: 'minut' },
      { id: 'nerd',     icon: '🤓', dailyTitle: 'Nerd dne',       monthlyTitle: 'Nerd měsíce',       description: 'Nejvíce času stráveného online', dailyCol: 'daily_online_minutes', monthlyMetric: 'online_minutes', liveCol: 'daily_online_minutes', unit: 'minut' },
      { id: 'listener', icon: '🎵', dailyTitle: 'Posluchač dne', monthlyTitle: 'Posluchač měsíce', description: 'Nejvíce písniček na Spotify',     dailyCol: 'daily_spotify_songs', monthlyMetric: 'spotify_minutes', liveCol: 'daily_spotify_songs', unit: 'písniček' },
    ];

    // Create awards array (daily or monthly)
    const awards: DailyAward[] = CATEGORY_CONFIG.map((cfg) => {
      let winner = null;
      let participantCount = 0;

      if (period === 'monthly') {
        const rows = db.getMonthlyLeaderboard(cfg.monthlyMetric, cfg.liveCol, 1000);
        participantCount = rows.length;
        if (rows.length > 0) {
          winner = resolveWinner(rows[0].user_id, rows[0].value, cfg.unit);
        }
      } else {
        const top = db.getDatabase().prepare(
          `SELECT user_id, ${cfg.dailyCol} AS value
           FROM user_stats
           WHERE ${cfg.dailyCol} > 0
           ORDER BY ${cfg.dailyCol} DESC
           LIMIT 1`
        ).get() as any;
        const count = db.getDatabase().prepare(
          `SELECT COUNT(*) as count FROM user_stats WHERE ${cfg.dailyCol} > 0`
        ).get() as any;
        participantCount = count?.count || 0;
        if (top) {
          winner = resolveWinner(top.user_id, top.value, cfg.unit);
        }
      }

      return {
        id: cfg.id,
        title: period === 'monthly' ? cfg.monthlyTitle : cfg.dailyTitle,
        icon: cfg.icon,
        description: cfg.description,
        winner,
        participantCount
      };
    });

    console.log(`🏆 ${period} awards calculated:`, awards.map(a => 
      `${a.title}: ${a.winner?.displayName || 'Nikdo'} (${a.winner?.value || 0} ${a.winner?.unit || ''})`
    ));

    return NextResponse.json({
      success: true,
      awards,
      period,
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
