import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getDiscordGateway } from '@/lib/discord-gateway';
import { getAnalyticsService } from '@/lib/analytics/service';

/**
 * Daily Analytics Reset API
 * 
 * This endpoint handles the daily reset of analytics data at midnight Czech time.
 * It creates snapshots of current data before resetting daily counters.
 */

export async function POST(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const gateway = getDiscordGateway();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`🌅 Starting daily reset for ${today}`);

    // Reset Discord Gateway daily online time without restarting sessions
    console.log('🔄 Resetting Discord Gateway daily online time...');
    if (gateway.isReady()) {
      // Reset daily online time in member cache without restarting sessions
      gateway.resetDailyOnlineTimeOnly();
      console.log('✅ Discord Gateway daily online time reset');
    } else {
      console.log('⚠️ Discord Gateway not ready, skipping daily online time reset');
    }

    // Get current user stats before reset
    const currentUserStats = db.getAllUserStats();
    console.log(`📊 Found ${currentUserStats.length} user stats entries`);

    // Create historical snapshots for yesterday from current user stats
    for (const userStat of currentUserStats) {
      if (userStat.daily_online_minutes > 0 || userStat.daily_voice_minutes > 0 ||
          userStat.daily_games_played > 0 || userStat.daily_spotify_minutes > 0) {
        try {
          db.upsertDailySnapshot({
            user_id: userStat.user_id,
            date: yesterday,
            online_minutes: userStat.daily_online_minutes,
            voice_minutes: userStat.daily_voice_minutes,
            games_played: userStat.daily_games_played,
            spotify_minutes: userStat.daily_spotify_minutes
          });
        } catch (error) {
          console.warn(`⚠️ Failed to create historical snapshot for user ${userStat.user_id}:`, error);
        }
      }
    }

    // Reset daily stats in user_stats table
    const resetResult = db.resetDailyStats();
    console.log(`🔄 Reset daily stats for all users: ${resetResult.changes} records updated`);

    // Also reset today's daily snapshots to 0 (for backward compatibility)
    const snapshotResetCount = db.getDatabase().prepare(`
      UPDATE daily_snapshots
      SET
        online_minutes = 0,
        voice_minutes = 0,
        games_played = 0,
        spotify_minutes = 0
      WHERE date = ?
    `).run(today);

    console.log(`🔄 Reset ${snapshotResetCount.changes} daily snapshots for ${today}`);

    // End all active sessions properly (but don't mark as stale - let Discord Gateway recreate them)
    const endedGameSessions = db.getDatabase().prepare(`
      UPDATE game_sessions
      SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
      WHERE status = 'active'
    `).run(now.toISOString());

    const endedVoiceSessions = db.getDatabase().prepare(`
      UPDATE voice_sessions
      SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
      WHERE status = 'active'
    `).run(now.toISOString());

    const endedSpotifySessions = db.getDatabase().prepare(`
      UPDATE spotify_sessions
      SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
      WHERE status = 'active'
    `).run(now.toISOString());

    console.log(`🔄 Ended ${endedGameSessions.changes} game sessions, ${endedVoiceSessions.changes} voice sessions, and ${endedSpotifySessions.changes} Spotify sessions`);

    // Note: We don't immediately restart analytics tracking after daily reset
    // This ensures awards start completely fresh at 0 progress
    // Tracking will restart naturally when users perform new activities (join voice, start games, etc.)
    console.log('ℹ️ Analytics tracking will restart naturally when users perform new activities');

    // Get summary of reset operation
    const summary = {
      date: today,
      resetTime: now.toISOString(),
      gatewayReset: gateway.isReady(),
      userStatsReset: resetResult.changes,
      dailySnapshotsReset: snapshotResetCount.changes,
      sessionsEnded: {
        game: endedGameSessions.changes,
        voice: endedVoiceSessions.changes,
        spotify: endedSpotifySessions.changes
      },
      historicalSnapshotsCreated: currentUserStats.filter(s =>
        s.daily_online_minutes > 0 || s.daily_voice_minutes > 0 ||
        s.daily_games_played > 0 || s.daily_spotify_minutes > 0
      ).length
    };

    console.log(`✅ Daily reset completed successfully:`, summary);

    return NextResponse.json({
      success: true,
      message: 'Daily reset completed successfully',
      summary
    });

  } catch (error) {
    console.error('❌ Error during daily reset:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform daily reset',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    // Get current daily data to show what would be reset
    const currentUserStats = db.getAllUserStats();
    const activeSessions = {
      game: db.getActiveGameSessions().length,
      voice: db.getActiveVoiceSessions().length,
      spotify: db.getActiveSpotifySessions().length
    };

    const activeUserStats = currentUserStats.filter(s =>
      s.daily_online_minutes > 0 || s.daily_voice_minutes > 0 ||
      s.daily_games_played > 0 || s.daily_spotify_minutes > 0
    );

    return NextResponse.json({
      success: true,
      message: 'Daily reset status',
      data: {
        date: today,
        currentUserStats: currentUserStats.length,
        activeUserStats: activeUserStats.length,
        activeSessions,
        lastResetWouldAffect: {
          userStats: activeUserStats.length,
          activeSessions: activeSessions.game + activeSessions.voice + activeSessions.spotify
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting daily reset status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get daily reset status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}