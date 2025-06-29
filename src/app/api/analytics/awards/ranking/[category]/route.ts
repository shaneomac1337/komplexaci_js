import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getDiscordGateway } from '@/lib/discord-gateway';

export interface RankingEntry {
  rank: number;
  id: string;
  displayName: string;
  avatar: string | null;
  value: number;
  unit: string;
  achievedAt: string;
  isWinner: boolean; // true if this is today's winner
}

export interface AwardRanking {
  category: 'nerd' | 'gamer' | 'listener' | 'streamer';
  title: string;
  czechTitle: string;
  description: string;
  icon: string;
  unit: string;
  date: string;
  rankings: RankingEntry[];
  totalParticipants: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const db = getAnalyticsDatabase();
    const gateway = getDiscordGateway();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Validate category
    const validCategories = ['nerd', 'gamer', 'streamer'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category',
        validCategories
      }, { status: 400 });
    }

    console.log(`📊 Getting ranking for category: ${category} on ${today}`);

    // Get all Discord members for avatar and display name info
    const allMembers = gateway.isReady() ? gateway.getAllMembers() : [];
    const memberMap = new Map(allMembers.map(m => [m.id, m]));

    let rankings: RankingEntry[] = [];
    let categoryInfo = {
      title: '',
      czechTitle: '',
      description: '',
      icon: '',
      unit: ''
    };

    switch (category) {
      case 'nerd': {
        categoryInfo = {
          title: 'Nerd of the Day',
          czechTitle: 'Nerd dne',
          description: 'Nejvíce času stráveného online',
          icon: '🤓',
          unit: 'minut'
        };

        const results = db.getDatabase().prepare(`
          SELECT 
            user_id,
            online_minutes,
            created_at
          FROM daily_snapshots 
          WHERE date = ? AND online_minutes > 0
          ORDER BY online_minutes DESC, created_at ASC
        `).all(today) as any[];

        rankings = results.map((result, index) => {
          const member = memberMap.get(result.user_id);
          return {
            rank: index + 1,
            id: result.user_id,
            displayName: member?.displayName || 'Unknown User',
            avatar: member?.avatar || null,
            value: result.online_minutes,
            unit: 'minut',
            achievedAt: result.created_at,
            isWinner: index === 0
          };
        });
        break;
      }

      case 'gamer': {
        categoryInfo = {
          title: 'Gamer of the Day',
          czechTitle: 'Pařmen dne',
          description: 'Nejvíce času stráveného hraním',
          icon: '🎮',
          unit: 'minut'
        };

        const results = db.getDatabase().prepare(`
          SELECT 
            user_id,
            SUM(duration_minutes) as total_gaming_minutes,
            MIN(start_time) as first_achieved
          FROM game_sessions 
          WHERE date(start_time) = ? AND status IN ('active', 'ended')
          GROUP BY user_id
          HAVING total_gaming_minutes > 0
          ORDER BY total_gaming_minutes DESC, first_achieved ASC
        `).all(today) as any[];

        rankings = results.map((result, index) => {
          const member = memberMap.get(result.user_id);
          return {
            rank: index + 1,
            id: result.user_id,
            displayName: member?.displayName || 'Unknown User',
            avatar: member?.avatar || null,
            value: result.total_gaming_minutes,
            unit: 'minut',
            achievedAt: result.first_achieved,
            isWinner: index === 0
          };
        });
        break;
      }



      case 'streamer': {
        categoryInfo = {
          title: 'Streamer of the Day',
          czechTitle: 'Streamer dne',
          description: 'Nejvíce minut streamování',
          icon: '📺',
          unit: 'minut'
        };

        const results = db.getDatabase().prepare(`
          SELECT 
            user_id,
            SUM(screen_share_minutes) as total_streaming_minutes,
            MIN(start_time) as first_achieved
          FROM voice_sessions 
          WHERE date(start_time) = ? AND screen_share_minutes > 0 AND status IN ('active', 'ended')
          GROUP BY user_id
          HAVING total_streaming_minutes > 0
          ORDER BY total_streaming_minutes DESC, first_achieved ASC
        `).all(today) as any[];

        rankings = results.map((result, index) => {
          const member = memberMap.get(result.user_id);
          return {
            rank: index + 1,
            id: result.user_id,
            displayName: member?.displayName || 'Unknown User',
            avatar: member?.avatar || null,
            value: result.total_streaming_minutes,
            unit: 'minut',
            achievedAt: result.first_achieved,
            isWinner: index === 0
          };
        });
        break;
      }
    }

    const response: AwardRanking = {
      category: category as any,
      ...categoryInfo,
      date: today,
      rankings,
      totalParticipants: rankings.length
    };

    console.log(`📊 Ranking for ${category}: ${rankings.length} participants, winner: ${rankings[0]?.displayName || 'None'}`);

    return NextResponse.json({
      success: true,
      data: response,
      dataSource: gateway.isReady() ? 'GATEWAY' : 'DATABASE',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error getting ranking for category ${(await params).category}:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get award ranking',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
