import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

/**
 * Monthly Analytics Awards API
 * 
 * This endpoint provides monthly awards based on user activity data.
 * Awards are calculated from the user_stats table monthly counters.
 */

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format

    console.log(`🏆 Calculating monthly awards for ${currentMonth}`);

    // Get all user stats with monthly data
    const allUserStats = db.getAllUserStats();
    const activeUsers = allUserStats.filter(user => 
      user.monthly_online_minutes > 0 || 
      user.monthly_voice_minutes > 0 || 
      user.monthly_games_played > 0 || 
      user.monthly_spotify_minutes > 0
    );

    console.log(`📊 Found ${activeUsers.length} active users this month`);

    // 1. Nerd of the Month (most online time)
    const nerdOfTheMonth = activeUsers.length > 0 
      ? activeUsers.reduce((prev, current) => 
          current.monthly_online_minutes > prev.monthly_online_minutes ? current : prev
        )
      : null;

    // 2. Voice Champion (most voice time)
    const voiceChampion = activeUsers.length > 0
      ? activeUsers.reduce((prev, current) => 
          current.monthly_voice_minutes > prev.monthly_voice_minutes ? current : prev
        )
      : null;

    // 3. Gamer of the Month (most games played)
    const gamerOfTheMonth = activeUsers.length > 0
      ? activeUsers.reduce((prev, current) => 
          current.monthly_games_played > prev.monthly_games_played ? current : prev
        )
      : null;

    // 4. Music Lover (most Spotify time)
    const musicLover = activeUsers.length > 0
      ? activeUsers.reduce((prev, current) => 
          current.monthly_spotify_minutes > prev.monthly_spotify_minutes ? current : prev
        )
      : null;

    // Format awards response
    const awards = {
      nerdOfTheMonth: nerdOfTheMonth ? {
        winner: nerdOfTheMonth.user_id,
        value: nerdOfTheMonth.monthly_online_minutes,
        unit: 'minutes',
        totalParticipants: activeUsers.filter(u => u.monthly_online_minutes > 0).length
      } : {
        winner: null,
        value: 0,
        unit: 'minutes',
        totalParticipants: 0
      },

      voiceChampion: voiceChampion ? {
        winner: voiceChampion.user_id,
        value: voiceChampion.monthly_voice_minutes,
        unit: 'minutes',
        totalParticipants: activeUsers.filter(u => u.monthly_voice_minutes > 0).length
      } : {
        winner: null,
        value: 0,
        unit: 'minutes',
        totalParticipants: 0
      },

      gamerOfTheMonth: gamerOfTheMonth ? {
        winner: gamerOfTheMonth.user_id,
        value: gamerOfTheMonth.monthly_games_played,
        unit: 'games',
        totalParticipants: activeUsers.filter(u => u.monthly_games_played > 0).length
      } : {
        winner: null,
        value: 0,
        unit: 'games',
        totalParticipants: 0
      },

      musicLover: musicLover ? {
        winner: musicLover.user_id,
        value: musicLover.monthly_spotify_minutes,
        unit: 'minutes',
        totalParticipants: activeUsers.filter(u => u.monthly_spotify_minutes > 0).length
      } : {
        winner: null,
        value: 0,
        unit: 'minutes',
        totalParticipants: 0
      }
    };

    // Calculate summary statistics
    const summary = {
      month: currentMonth,
      totalActiveUsers: activeUsers.length,
      totalOnlineMinutes: activeUsers.reduce((sum, user) => sum + user.monthly_online_minutes, 0),
      totalVoiceMinutes: activeUsers.reduce((sum, user) => sum + user.monthly_voice_minutes, 0),
      totalGamesPlayed: activeUsers.reduce((sum, user) => sum + user.monthly_games_played, 0),
      totalSpotifyMinutes: activeUsers.reduce((sum, user) => sum + user.monthly_spotify_minutes, 0),
      lastMonthlyReset: activeUsers.length > 0 ? activeUsers[0].last_monthly_reset : null
    };

    console.log(`✅ Monthly awards calculated successfully for ${activeUsers.length} users`);

    return NextResponse.json({
      success: true,
      message: 'Monthly awards calculated successfully',
      month: currentMonth,
      awards,
      summary,
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataSource: 'user_stats.monthly_*',
        activeUsers: activeUsers.length,
        totalUsers: allUserStats.length
      }
    });

  } catch (error) {
    console.error('❌ Error calculating monthly awards:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate monthly awards',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}