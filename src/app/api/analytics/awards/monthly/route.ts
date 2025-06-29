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

    console.log(`🏆 Calculating monthly awards for ${currentMonth} using session-based method`);

    // Calculate date range for the month (30 days from now)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    // Get all user stats and calculate monthly data using session-based method (same as UI)
    const allUserStats = db.getAllUserStats();
    const activeUsers = [];
    
    for (const userStat of allUserStats) {
      const userId = userStat.user_id;
      
      // Calculate from sessions (same method as UI)
      const gameStats = db.getDatabase().prepare(`
        SELECT SUM(duration_minutes) as total_minutes, COUNT(DISTINCT game_name) as games_played
        FROM game_sessions
        WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      `).get(userId, startDateStr, endDateStr) as any;
      
      const voiceStats = db.getDatabase().prepare(`
        SELECT SUM(duration_minutes) as total_minutes
        FROM voice_sessions
        WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      `).get(userId, startDateStr, endDateStr) as any;
      
      const spotifyStats = db.getDatabase().prepare(`
        SELECT COUNT(*) as plays_count
        FROM spotify_sessions
        WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      `).get(userId, startDateStr, endDateStr) as any;
      
      const onlineStats = db.getDatabase().prepare(`
        SELECT SUM(online_minutes) as total_minutes
        FROM daily_snapshots
        WHERE user_id = ? AND date >= ? AND date <= ?
      `).get(userId, startDateStr, endDateStr) as any;
      
      const monthlyGameTime = Math.round(gameStats?.total_minutes || 0);
      const monthlyVoiceTime = Math.round(voiceStats?.total_minutes || 0);
      const monthlyGamesPlayed = gameStats?.games_played || 0;
      const monthlySpotifyPlays = spotifyStats?.plays_count || 0;
      const monthlyOnlineTime = Math.round(onlineStats?.total_minutes || 0);
      
      if (monthlyOnlineTime > 0 || monthlyVoiceTime > 0 || monthlyGamesPlayed > 0 || monthlySpotifyPlays > 0) {
        activeUsers.push({
          ...userStat,
          monthly_online_minutes: monthlyOnlineTime,
          monthly_voice_minutes: monthlyVoiceTime,
          monthly_games_played: monthlyGamesPlayed,
          monthly_spotify_minutes: monthlySpotifyPlays
        });
      }
    }

    console.log(`📊 Found ${activeUsers.length} active users this month (session-based calculation)`);

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
        dataSource: 'session-based (game_sessions, voice_sessions, spotify_sessions, daily_snapshots)',
        dateRange: { startDate: startDateStr, endDate: endDateStr },
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