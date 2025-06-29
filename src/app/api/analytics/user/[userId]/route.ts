import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    const db = getAnalyticsDatabase();
    
    // Get user's reset dates and monthly counters to respect monthly reset
    const userStats = db.getDatabase().prepare(`
      SELECT last_monthly_reset, last_daily_reset, monthly_online_minutes, monthly_voice_minutes,
             monthly_games_played, monthly_games_minutes, monthly_spotify_minutes
      FROM user_stats
      WHERE user_id = ?
    `).get(userId) as any;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        // For monthly view, we use accumulated counters from user_stats, not session calculations
        // This makes it work exactly like daily reset system
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate.setFullYear(2020);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get user's daily snapshots
    const dailySnapshots = db.getDailySnapshots(userId, startDateStr, endDateStr);
    
    // Get user's game sessions
    const gameSessions = db.getDatabase().prepare(`
      SELECT 
        game_name,
        COUNT(*) as session_count,
        SUM(duration_minutes) as total_minutes,
        AVG(duration_minutes) as avg_minutes,
        MIN(start_time) as first_played,
        MAX(start_time) as last_played
      FROM game_sessions 
      WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      GROUP BY game_name
      ORDER BY total_minutes DESC
    `).all(userId, startDateStr, endDateStr);
    
    // Get user's voice activity
    const voiceActivity = db.getDatabase().prepare(`
      SELECT 
        channel_name,
        COUNT(*) as session_count,
        SUM(duration_minutes) as total_minutes,
        SUM(screen_share_minutes) as screen_share_minutes,
        AVG(duration_minutes) as avg_minutes
      FROM voice_sessions 
      WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      GROUP BY channel_name
      ORDER BY total_minutes DESC
    `).all(userId, startDateStr, endDateStr);
    
    // Get user's Spotify activity (focus on plays, not time)
    const spotifyActivity = db.getDatabase().prepare(`
      SELECT
        artist,
        COUNT(*) as plays_count,
        COUNT(DISTINCT track_name) as unique_tracks
      FROM spotify_sessions
      WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      GROUP BY artist
      ORDER BY plays_count DESC
      LIMIT 10
    `).all(userId, startDateStr, endDateStr);
    
    // Get top tracks (focus on play count)
    const topTracks = db.getDatabase().prepare(`
      SELECT
        track_name,
        artist,
        COUNT(*) as play_count
      FROM spotify_sessions
      WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      GROUP BY track_name, artist
      ORDER BY play_count DESC
      LIMIT 10
    `).all(userId, startDateStr, endDateStr);
    
    // Get recent sessions
    const recentSessions = [];
    
    // Add recent game sessions
    const recentGames = db.getDatabase().prepare(`
      SELECT 'game' as type, game_name as name, start_time, end_time, duration_minutes
      FROM game_sessions 
      WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      ORDER BY start_time DESC
      LIMIT 5
    `).all(userId, startDateStr, endDateStr);
    
    // Add recent voice sessions
    const recentVoice = db.getDatabase().prepare(`
      SELECT 'voice' as type, channel_name as name, start_time, end_time, duration_minutes
      FROM voice_sessions 
      WHERE user_id = ? AND date(start_time) >= ? AND date(start_time) <= ?
      ORDER BY start_time DESC
      LIMIT 5
    `).all(userId, startDateStr, endDateStr);
    
    recentSessions.push(...recentGames, ...recentVoice);
    recentSessions.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    
    // Calculate totals from actual session data
    // For 30d (monthly) view, use accumulated counters from user_stats (like daily reset system)
    // For other time ranges, use session-based calculations
    let totalGameTime, totalVoiceTime, totalSongsPlayed, totalScreenShareTime;
    
    if (timeRange === '30d') {
      // Use monthly counters from user_stats (reset to 0 by monthly reset)
      totalGameTime = userStats?.monthly_games_minutes || 0; // Now we have proper monthly game time tracking!
      totalVoiceTime = userStats?.monthly_voice_minutes || 0;
      totalSongsPlayed = userStats?.monthly_spotify_minutes || 0; // This represents songs, not minutes
      totalScreenShareTime = 0; // Not tracked in monthly counters yet
    } else {
      // Use session-based calculations for other time ranges
      totalGameTime = gameSessions.reduce((sum: number, game: any) => sum + game.total_minutes, 0);
      totalVoiceTime = voiceActivity.reduce((sum: number, voice: any) => sum + voice.total_minutes, 0);
      totalSongsPlayed = spotifyActivity.reduce((sum: number, artist: any) => sum + artist.plays_count, 0);
      totalScreenShareTime = voiceActivity.reduce((sum: number, voice: any) => sum + voice.screen_share_minutes, 0);
    }

    // Use saved daily snapshots for online time (this comes from Discord Gateway's real tracking)
    const totalOnlineTime = dailySnapshots.reduce((sum, day) => sum + day.online_minutes, 0);

    const totals = {
      totalOnlineTime: Math.round(totalOnlineTime),
      totalGameTime,
      totalVoiceTime,
      totalSongsPlayed,
      totalScreenShareTime: totalScreenShareTime,
      gamesPlayed: gameSessions.length,
      voiceChannelsUsed: voiceActivity.length,
      artistsListened: spotifyActivity.length,
      achievementsEarned: 0
    };
    
    // Calculate activity patterns
    const activityPatterns = {
      hourlyActivity: [],
      dailyActivity: []
    };
    
    return NextResponse.json({
      success: true,
      userId,
      timeRange,
      dateRange: { startDate: startDateStr, endDate: endDateStr },
      data: {
        dailySnapshots,
        gameSessions,
        voiceActivity,
        spotifyActivity,
        topTracks,
        achievements: [],
        recentSessions: recentSessions.slice(0, 10),
        totals,
        activityPatterns
      }
    });
    
  } catch (error) {
    console.error('❌ User analytics API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
