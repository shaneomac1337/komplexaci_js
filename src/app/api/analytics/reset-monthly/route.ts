import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

/**
 * Monthly Analytics Reset API
 * 
 * This endpoint handles the monthly reset of analytics data on the 1st of each month.
 * It creates snapshots of current monthly data before resetting monthly counters.
 */

export async function POST(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM format
    
    // Calculate previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = prevMonth.toISOString().substring(0, 7); // YYYY-MM format

    console.log(`🗓️ Starting monthly reset for ${currentMonth}`);

    // Get current user stats before reset
    const currentUserStats = db.getAllUserStats();
    console.log(`📊 Found ${currentUserStats.length} user stats entries`);

    // Create monthly snapshots table if it doesn't exist
    db.getDatabase().exec(`
      CREATE TABLE IF NOT EXISTS monthly_snapshots (
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        online_minutes INTEGER DEFAULT 0,
        voice_minutes INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        spotify_minutes INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, month)
      );
      
      CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month ON monthly_snapshots(month);
      CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_user_month ON monthly_snapshots(user_id, month);
    `);

    // Calculate monthly snapshots using session-based method (same as UI)
    // Use actual calendar month boundaries for accuracy
    const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0); // Day 0 of current month = last day of prev month
    const startDateStr = firstDayOfPrevMonth.toISOString().split('T')[0];
    const endDateStr = lastDayOfPrevMonth.toISOString().split('T')[0];

    console.log(`📊 Calculating monthly stats for ${previousMonth} (${startDateStr} to ${endDateStr}) using session-based method`);
    
    let monthlySnapshotsCreated = 0;
    for (const userStat of currentUserStats) {
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
      
      // Use daily snapshots for online time (from Discord Gateway tracking)
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
      
      // Only create snapshot if user has any activity
      if (monthlyOnlineTime > 0 || monthlyVoiceTime > 0 || monthlyGamesPlayed > 0 || monthlySpotifyPlays > 0) {
        try {
          db.getDatabase().prepare(`
            INSERT INTO monthly_snapshots (user_id, month, online_minutes, voice_minutes, games_played, spotify_minutes)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, month) DO UPDATE SET
              online_minutes = excluded.online_minutes,
              voice_minutes = excluded.voice_minutes,
              games_played = excluded.games_played,
              spotify_minutes = excluded.spotify_minutes
          `).run(
            userId,
            previousMonth,
            monthlyOnlineTime,
            monthlyVoiceTime,
            monthlyGamesPlayed,
            monthlySpotifyPlays
          );
          monthlySnapshotsCreated++;
          
          console.log(`📸 Created snapshot for ${userId}: ${monthlyOnlineTime}m online, ${monthlyVoiceTime}m voice, ${monthlyGamesPlayed} games, ${monthlySpotifyPlays} spotify`);
        } catch (error) {
          console.warn(`⚠️ Failed to create monthly snapshot for user ${userId}:`, error);
        }
      }
    }

    console.log(`📸 Created ${monthlySnapshotsCreated} monthly snapshots for ${previousMonth}`);

    // Reset monthly stats in user_stats table (this doesn't affect active sessions)
    const resetResult = db.resetMonthlyStats();
    console.log(`🔄 Reset monthly stats for all users: ${resetResult.changes} records updated`);

    // Note: We don't end active sessions during monthly reset - they continue tracking
    console.log(`ℹ️ Active sessions continue tracking across monthly reset boundary`);

    // Also reset current month's monthly snapshots to 0 (for backward compatibility)
    const snapshotResetCount = db.getDatabase().prepare(`
      UPDATE monthly_snapshots
      SET
        online_minutes = 0,
        voice_minutes = 0,
        games_played = 0,
        spotify_minutes = 0
      WHERE month = ?
    `).run(currentMonth);

    console.log(`🔄 Reset ${snapshotResetCount.changes} monthly snapshots for ${currentMonth}`);

    // Get summary of reset operation
    const summary = {
      month: currentMonth,
      previousMonth,
      resetTime: now.toISOString(),
      userStatsReset: resetResult.changes,
      monthlySnapshotsReset: snapshotResetCount.changes,
      historicalSnapshotsCreated: monthlySnapshotsCreated,
      activeUsersLastMonth: currentUserStats.filter(s =>
        s.monthly_online_minutes > 0 || s.monthly_voice_minutes > 0 ||
        s.monthly_games_played > 0 || s.monthly_spotify_minutes > 0
      ).length
    };

    console.log(`✅ Monthly reset completed successfully:`, summary);

    return NextResponse.json({
      success: true,
      message: 'Monthly reset completed successfully',
      summary
    });

  } catch (error) {
    console.error('❌ Error during monthly reset:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform monthly reset',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    
    // Get current monthly data using session-based calculations (same as UI and POST method)
    // Use current month boundaries for the status check
    const currentUserStats = db.getAllUserStats();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDateStr = firstDayOfMonth.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    const activeUserStats = [];
    for (const userStat of currentUserStats) {
      const userId = userStat.user_id;
      
      // Calculate from sessions (same method as UI and POST)
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
        activeUserStats.push({
          ...userStat,
          monthly_online_minutes: monthlyOnlineTime,
          monthly_voice_minutes: monthlyVoiceTime,
          monthly_games_played: monthlyGamesPlayed,
          monthly_spotify_minutes: monthlySpotifyPlays
        });
      }
    }

    // Check if monthly_snapshots table exists
    let monthlySnapshotsExist = false;
    try {
      db.getDatabase().prepare('SELECT COUNT(*) FROM monthly_snapshots LIMIT 1').get();
      monthlySnapshotsExist = true;
    } catch {
      monthlySnapshotsExist = false;
    }

    let existingMonthlySnapshots = 0;
    if (monthlySnapshotsExist) {
      const result = db.getDatabase().prepare('SELECT COUNT(*) as count FROM monthly_snapshots WHERE month = ?').get(currentMonth) as any;
      existingMonthlySnapshots = result?.count || 0;
    }

    return NextResponse.json({
      success: true,
      message: 'Monthly reset status',
      data: {
        month: currentMonth,
        currentUserStats: currentUserStats.length,
        activeMonthlyUsers: activeUserStats.length,
        existingMonthlySnapshots,
        monthlySnapshotsTableExists: monthlySnapshotsExist,
        lastResetWouldAffect: {
          userStats: activeUserStats.length,
          monthlySnapshotsCreated: activeUserStats.length
        },
        topMonthlyUsers: activeUserStats
          .sort((a, b) => b.monthly_online_minutes - a.monthly_online_minutes)
          .slice(0, 5)
          .map(u => ({
            user_id: u.user_id,
            monthly_online_minutes: u.monthly_online_minutes,
            monthly_voice_minutes: u.monthly_voice_minutes,
            monthly_games_played: u.monthly_games_played,
            monthly_spotify_minutes: u.monthly_spotify_minutes
          }))
      }
    });

  } catch (error) {
    console.error('❌ Error getting monthly reset status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get monthly reset status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}