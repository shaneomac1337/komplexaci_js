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
    
    // Get user's reset dates and counters to respect daily/monthly reset
    const userStats = db.getDatabase().prepare(`
      SELECT last_monthly_reset, last_daily_reset,
             daily_online_minutes, daily_voice_minutes, daily_games_played, daily_games_minutes,
             daily_spotify_minutes, daily_spotify_songs, daily_streaming_minutes,
             monthly_online_minutes, monthly_voice_minutes, monthly_games_played, monthly_games_minutes,
             monthly_spotify_minutes, monthly_spotify_songs
      FROM user_stats
      WHERE user_id = ?
    `).get(userId) as any;
    
    // Calculate date range
    // NOTE: Time ranges have different semantics (intentional design):
    // - "1d" = Since last daily reset (can be less than 24 hours) - uses last_daily_reset
    // - "7d" = Last 7 calendar days (rolling window) - uses date-based filtering
    // - "30d" = Last 30 calendar days (legacy rolling period)
    // - "monthly" = Since last monthly reset - uses last_monthly_reset
    // - "90d" = Last 90 calendar days (rolling window)
    // - "all" = All time since 2020
    const endDate = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '1d':
        // Fallback start date (actual filtering uses last_daily_reset)
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        // Rolling 7-day window (calendar days, not reset-based)
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        // Legacy 30-day rolling period (session-based, calendar days)
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'monthly':
        // Monthly view uses accumulated counters from user_stats (reset-based)
        // This works exactly like daily reset system
        if (userStats?.last_monthly_reset) {
          startDate = new Date(userStats.last_monthly_reset);
        } else {
          // Fallback to 30 days if no monthly reset date
          startDate.setDate(startDate.getDate() - 30);
        }
        break;
      case '90d':
        // Rolling 90-day window (calendar days)
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate.setFullYear(2020);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get user's daily snapshots - for 1d timeRange, only get today's data after reset
    let dailySnapshots;
    if (timeRange === '1d') {
      // For daily view, only show today's snapshot (which gets reset to 0 by daily reset)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      dailySnapshots = db.getDailySnapshots(userId, today, today);
    } else {
      // For other time ranges, use the original date range
      dailySnapshots = db.getDailySnapshots(userId, startDateStr, endDateStr);
    }
    
    // For daily data (1d), use the same timezone-aware filtering as Spotify
    let sessionStartTime, sessionEndTime;
    
    if (timeRange === '1d') {
      // Get the user's last daily reset time, or use today's midnight Czech time
      const userStats = db.getUserStats(userId);
      if (userStats?.last_daily_reset) {
        sessionStartTime = userStats.last_daily_reset;
      } else {
        // Fallback: Use today's midnight in Czech time (CET/CEST)
        const czechMidnight = new Date();
        czechMidnight.setHours(0, 0, 0, 0);
        // Adjust for Czech timezone (UTC+1 or UTC+2)
        const timezoneOffset = czechMidnight.getTimezoneOffset();
        czechMidnight.setMinutes(czechMidnight.getMinutes() + timezoneOffset + 60); // +60 for CET
        sessionStartTime = czechMidnight.toISOString();
      }
      sessionEndTime = endDate.toISOString();
    } else {
      // For other time ranges, use the original date-based filtering
      sessionStartTime = startDate.toISOString();
      sessionEndTime = endDate.toISOString();
    }

    // Debug: Log the time range being used for game sessions
    console.log(`🔍 Game sessions query for ${userId}:`);
    console.log(`  Time range: ${timeRange}`);
    console.log(`  Session start: ${sessionStartTime}`);
    console.log(`  Session end: ${sessionEndTime}`);

    // Get user's game sessions
    // For 1d timeRange, use reset-time-based filtering to only count sessions after daily reset
    let gameSessions;
    if (timeRange === '1d') {
      // Get user's last daily reset time to only count sessions after reset
      const userStats = db.getUserStats(userId);
      const resetTime = userStats?.last_daily_reset || sessionStartTime;
      
      console.log(`🔍 API Game sessions query for ${userId}:`);
      console.log(`  Using reset time: ${resetTime}`);
      
      gameSessions = db.getDatabase().prepare(`
        SELECT
          game_name,
          COUNT(*) as session_count,
          SUM(duration_minutes) as total_minutes,
          AVG(duration_minutes) as avg_minutes,
          MIN(start_time) as first_played,
          MAX(start_time) as last_played
        FROM game_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND status IN ('active', 'ended')) OR
          (status = 'active')
        )
        GROUP BY game_name
        ORDER BY total_minutes DESC
      `).all(userId, resetTime);
    } else {
      gameSessions = db.getDatabase().prepare(`
        SELECT 
          game_name,
          COUNT(*) as session_count,
          SUM(duration_minutes) as total_minutes,
          AVG(duration_minutes) as avg_minutes,
          MIN(start_time) as first_played,
          MAX(start_time) as last_played
        FROM game_sessions 
        WHERE user_id = ? AND start_time >= ? AND start_time <= ?
        GROUP BY game_name
        ORDER BY total_minutes DESC
      `).all(userId, sessionStartTime, sessionEndTime);
    }
    
    // Get user's voice activity
    let voiceActivity;
    if (timeRange === '1d') {
      // Get user's last daily reset time to only count sessions after reset
      const userStatsForVoice = db.getUserStats(userId);
      const resetTime = userStatsForVoice?.last_daily_reset || sessionStartTime;

      voiceActivity = db.getDatabase().prepare(`
        SELECT
          channel_name,
          COUNT(*) as session_count,
          SUM(duration_minutes) as total_minutes,
          SUM(screen_share_minutes) as screen_share_minutes,
          AVG(duration_minutes) as avg_minutes
        FROM voice_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND status IN ('active', 'ended')) OR
          (status = 'active')
        )
        GROUP BY channel_name
        ORDER BY total_minutes DESC
      `).all(userId, resetTime);
    } else if (timeRange === 'monthly') {
      // Use monthly reset time
      const monthlyResetTime = userStats?.last_monthly_reset || sessionStartTime;

      voiceActivity = db.getDatabase().prepare(`
        SELECT
          channel_name,
          COUNT(*) as session_count,
          SUM(duration_minutes) as total_minutes,
          SUM(screen_share_minutes) as screen_share_minutes,
          AVG(duration_minutes) as avg_minutes
        FROM voice_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND status IN ('active', 'ended')) OR
          (status = 'active')
        )
        GROUP BY channel_name
        ORDER BY total_minutes DESC
      `).all(userId, monthlyResetTime);
    } else {
      voiceActivity = db.getDatabase().prepare(`
        SELECT
          channel_name,
          COUNT(*) as session_count,
          SUM(duration_minutes) as total_minutes,
          SUM(screen_share_minutes) as screen_share_minutes,
          AVG(duration_minutes) as avg_minutes
        FROM voice_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND start_time <= ?) OR
          (status = 'active')
        )
        GROUP BY channel_name
        ORDER BY total_minutes DESC
      `).all(userId, sessionStartTime, sessionEndTime);
    }
    
    // Get user's Spotify activity (focus on plays, not time)
    // For 1d timeRange, use last_daily_reset like games/voice do for consistency
    let spotifyActivity;
    let topTracks;

    if (timeRange === '1d') {
      // Use last_daily_reset for daily view (consistent with games/voice)
      const userStatsForSpotify = db.getUserStats(userId);
      const resetTime = userStatsForSpotify?.last_daily_reset || sessionStartTime;

      spotifyActivity = db.getDatabase().prepare(`
        SELECT
          artist,
          COUNT(*) as plays_count,
          COUNT(DISTINCT track_name) as unique_tracks
        FROM spotify_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND status IN ('active', 'ended')) OR
          (status = 'active')
        )
        GROUP BY artist
        ORDER BY plays_count DESC
        LIMIT 10
      `).all(userId, resetTime);

      topTracks = db.getDatabase().prepare(`
        SELECT
          track_name,
          artist,
          COUNT(*) as play_count
        FROM spotify_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND status IN ('active', 'ended')) OR
          (status = 'active')
        )
        GROUP BY track_name, artist
        ORDER BY play_count DESC
        LIMIT 10
      `).all(userId, resetTime);
    } else if (timeRange === 'monthly') {
      // Use monthly reset time for monthly view
      const monthlyResetTime = userStats?.last_monthly_reset || sessionStartTime;

      spotifyActivity = db.getDatabase().prepare(`
        SELECT
          artist,
          COUNT(*) as plays_count,
          COUNT(DISTINCT track_name) as unique_tracks
        FROM spotify_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND status IN ('active', 'ended')) OR
          (status = 'active')
        )
        GROUP BY artist
        ORDER BY plays_count DESC
        LIMIT 10
      `).all(userId, monthlyResetTime);

      topTracks = db.getDatabase().prepare(`
        SELECT
          track_name,
          artist,
          COUNT(*) as play_count
        FROM spotify_sessions
        WHERE user_id = ? AND (
          (start_time >= ? AND status IN ('active', 'ended')) OR
          (status = 'active')
        )
        GROUP BY track_name, artist
        ORDER BY play_count DESC
        LIMIT 10
      `).all(userId, monthlyResetTime);
    } else {
      // For other time ranges (7d, 30d, 90d, all), use date-based filtering
      spotifyActivity = db.getDatabase().prepare(`
        SELECT
          artist,
          COUNT(*) as plays_count,
          COUNT(DISTINCT track_name) as unique_tracks
        FROM spotify_sessions
        WHERE user_id = ? AND start_time >= ? AND start_time <= ?
        GROUP BY artist
        ORDER BY plays_count DESC
        LIMIT 10
      `).all(userId, sessionStartTime, sessionEndTime);

      topTracks = db.getDatabase().prepare(`
        SELECT
          track_name,
          artist,
          COUNT(*) as play_count
        FROM spotify_sessions
        WHERE user_id = ? AND start_time >= ? AND start_time <= ?
        GROUP BY track_name, artist
        ORDER BY play_count DESC
        LIMIT 10
      `).all(userId, sessionStartTime, sessionEndTime);
    }
    
    // Get recent sessions
    const recentSessions = [];
    
    // Add recent game sessions - cumulated by game name
    const recentGames = db.getDatabase().prepare(`
      SELECT
        'game' as type,
        game_name as name,
        MAX(start_time) as start_time,
        MAX(end_time) as end_time,
        SUM(duration_minutes) as duration_minutes
      FROM game_sessions
      WHERE user_id = ? AND (
        (date(start_time) >= ? AND date(start_time) <= ? AND duration_minutes > 0) OR
        (status = 'active')
      )
      GROUP BY game_name
      ORDER BY MAX(start_time) DESC
      LIMIT 5
    `).all(userId, startDateStr, endDateStr);
    
    // Add recent voice sessions - cumulated by channel name
    const recentVoice = db.getDatabase().prepare(`
      SELECT
        'voice' as type,
        channel_name as name,
        MAX(start_time) as start_time,
        MAX(end_time) as end_time,
        SUM(duration_minutes) as duration_minutes
      FROM voice_sessions
      WHERE user_id = ? AND (
        (date(start_time) >= ? AND date(start_time) <= ? AND duration_minutes > 0) OR
        (status = 'active')
      )
      GROUP BY channel_name
      ORDER BY MAX(start_time) DESC
      LIMIT 5
    `).all(userId, startDateStr, endDateStr);
    
    recentSessions.push(...recentGames, ...recentVoice);
    recentSessions.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    
    // Calculate totals from actual session data
    // For 1d (daily) view, use real-time counters from user_stats (includes active sessions)
    // For 30d (monthly) view, use accumulated counters from user_stats (like daily reset system)
    // For other time ranges, use session-based calculations
    let totalGameTime, totalVoiceTime, totalSongsPlayed, totalScreenShareTime;

    if (timeRange === '1d') {
      // Use daily counters from user_stats (real-time tracking, includes active sessions)
      totalGameTime = userStats?.daily_games_minutes || 0;
      totalVoiceTime = userStats?.daily_voice_minutes || 0;
      totalSongsPlayed = userStats?.daily_spotify_songs || 0;
      totalScreenShareTime = userStats?.daily_streaming_minutes || 0;
    } else if (timeRange === 'monthly') {
      // Use monthly counters from user_stats (reset to 0 by monthly reset)
      totalGameTime = userStats?.monthly_games_minutes || 0; // Now we have proper monthly game time tracking!
      totalVoiceTime = userStats?.monthly_voice_minutes || 0;
      totalSongsPlayed = userStats?.monthly_spotify_songs || 0; // Use monthly_spotify_songs for song count
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

    // Calculate server averages and percentiles (only for daily view)
    let serverAverages = null;
    let percentiles = null;

    if (timeRange === '1d') {
      // Get server-wide averages from all active users
      const averagesQuery = db.getDatabase().prepare(`
        SELECT
          AVG(daily_games_minutes) as avgGameTime,
          AVG(daily_voice_minutes) as avgVoiceTime,
          AVG(daily_spotify_songs) as avgSongsPlayed,
          COUNT(*) as totalActiveUsers
        FROM user_stats
        WHERE daily_online_minutes > 0
      `).get() as any;

      serverAverages = {
        avgGameTime: Math.round(averagesQuery?.avgGameTime || 0),
        avgVoiceTime: Math.round(averagesQuery?.avgVoiceTime || 0),
        avgSongsPlayed: Math.round(averagesQuery?.avgSongsPlayed || 0),
        totalActiveUsers: averagesQuery?.totalActiveUsers || 0
      };

      // Calculate percentiles - what % of users this user beats
      const totalUsers = serverAverages.totalActiveUsers;

      if (totalUsers > 0) {
        // Game time percentile
        const gamePercentileQuery = db.getDatabase().prepare(`
          SELECT COUNT(*) as usersBelow
          FROM user_stats
          WHERE daily_games_minutes < ? AND daily_online_minutes > 0
        `).get(totalGameTime) as any;

        // Voice time percentile
        const voicePercentileQuery = db.getDatabase().prepare(`
          SELECT COUNT(*) as usersBelow
          FROM user_stats
          WHERE daily_voice_minutes < ? AND daily_online_minutes > 0
        `).get(totalVoiceTime) as any;

        // Songs played percentile
        const songsPercentileQuery = db.getDatabase().prepare(`
          SELECT COUNT(*) as usersBelow
          FROM user_stats
          WHERE daily_spotify_songs < ? AND daily_online_minutes > 0
        `).get(totalSongsPlayed) as any;

        percentiles = {
          gameTimePercentile: Math.round((gamePercentileQuery?.usersBelow / totalUsers) * 100),
          voiceTimePercentile: Math.round((voicePercentileQuery?.usersBelow / totalUsers) * 100),
          songsPlayedPercentile: Math.round((songsPercentileQuery?.usersBelow / totalUsers) * 100)
        };
      }
    }

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
        activityPatterns,
        serverAverages,
        percentiles
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
