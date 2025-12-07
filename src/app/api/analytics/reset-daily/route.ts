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
  const db = getAnalyticsDatabase();
  const gateway = getDiscordGateway();
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Variables to track reset results
  let resetResult: any;
  let snapshotResetCount: any;
  let endedGameSessions: any;
  let endedVoiceSessions: any;
  let endedSpotifySessions: any;
  let deletedGameSessions: any;
  let deletedVoiceSessions: any;
  let deletedSpotifySessions: any;
  let snapshotsCreated = 0;

  try {
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

    // Wrap all database operations in a transaction for atomicity
    console.log('🔒 Starting database transaction for daily reset...');
    db.beginTransaction();

    try {
      // Create historical snapshots for yesterday using session-based calculation for accuracy
      // This ensures we capture exactly yesterday's activity, not accumulated stats since last reset
      for (const userStat of currentUserStats) {
        try {
          const userId = userStat.user_id;

          // Calculate yesterday's activity from actual session data
          const gameStats = db.getDatabase().prepare(`
            SELECT SUM(duration_minutes) as total_minutes, COUNT(DISTINCT game_name) as games_played
            FROM game_sessions
            WHERE user_id = ? AND date(start_time) = ?
          `).get(userId, yesterday) as any;

          const voiceStats = db.getDatabase().prepare(`
            SELECT SUM(duration_minutes) as total_minutes
            FROM voice_sessions
            WHERE user_id = ? AND date(start_time) = ?
          `).get(userId, yesterday) as any;

          const spotifyStats = db.getDatabase().prepare(`
            SELECT COUNT(*) as plays_count
            FROM spotify_sessions
            WHERE user_id = ? AND date(start_time) = ?
          `).get(userId, yesterday) as any;

          // Get existing snapshot for online time (tracked separately by Discord Gateway)
          const existingSnapshot = db.getDailySnapshot(userId, yesterday);
          const onlineMinutes = existingSnapshot?.online_minutes || userStat.daily_online_minutes || 0;

          const voiceMinutes = Math.round(voiceStats?.total_minutes || 0);
          const gamesPlayed = gameStats?.games_played || 0;
          const spotifyMinutes = spotifyStats?.plays_count || 0;

          if (onlineMinutes > 0 || voiceMinutes > 0 || gamesPlayed > 0 || spotifyMinutes > 0) {
            db.upsertDailySnapshot({
              user_id: userId,
              date: yesterday,
              online_minutes: onlineMinutes,
              voice_minutes: voiceMinutes,
              games_played: gamesPlayed,
              spotify_minutes: spotifyMinutes
            });
            snapshotsCreated++;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to create historical snapshot for user ${userStat.user_id}:`, error);
        }
      }

      // Reset daily stats in user_stats table
      resetResult = db.resetDailyStats();
      console.log(`🔄 Reset daily stats for all users: ${resetResult.changes} records updated`);

      // Also reset today's daily snapshots to 0 (for backward compatibility)
      snapshotResetCount = db.getDatabase().prepare(`
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
      endedGameSessions = db.getDatabase().prepare(`
        UPDATE game_sessions
        SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
        WHERE status = 'active'
      `).run(now.toISOString());

      endedVoiceSessions = db.getDatabase().prepare(`
        UPDATE voice_sessions
        SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
        WHERE status = 'active'
      `).run(now.toISOString());

      endedSpotifySessions = db.getDatabase().prepare(`
        UPDATE spotify_sessions
        SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
        WHERE status = 'active'
      `).run(now.toISOString());

      console.log(`🔄 Ended ${endedGameSessions.changes} game sessions, ${endedVoiceSessions.changes} voice sessions, and ${endedSpotifySessions.changes} Spotify sessions`);

      // 🧹 CLEAR OLD SESSION HISTORY (keep today's for Recent Activities)
      console.log(`🧹 Clearing old session history (before ${yesterday})...`);

      // Delete only sessions from before yesterday (preserve today's for Recent Activities)
      deletedGameSessions = db.getDatabase().prepare(`
        DELETE FROM game_sessions
        WHERE date(start_time) < ? AND status = 'ended'
      `).run(yesterday);

      deletedVoiceSessions = db.getDatabase().prepare(`
        DELETE FROM voice_sessions
        WHERE date(start_time) < ? AND status = 'ended'
      `).run(yesterday);

      deletedSpotifySessions = db.getDatabase().prepare(`
        DELETE FROM spotify_sessions
        WHERE date(start_time) < ? AND status = 'ended'
      `).run(yesterday);

      console.log(`🧹 Cleared old session history: ${deletedGameSessions.changes} game, ${deletedVoiceSessions.changes} voice, ${deletedSpotifySessions.changes} Spotify sessions deleted`);

      // Commit the transaction
      db.commitTransaction();
      console.log('✅ Database transaction committed successfully');

    } catch (txError) {
      // Rollback on any error within the transaction
      console.error('❌ Error during transaction, rolling back:', txError);
      db.rollbackTransaction();
      throw txError;
    }

    // Restart active sessions for users who are currently active (playing games, in voice, listening to Spotify)
    console.log(`🔄 Checking if Discord Gateway is ready for session recovery... Ready: ${gateway.isReady()}`);
    if (gateway.isReady()) {
      const guild = gateway.getGuild();
      console.log(`🔄 Guild found: ${guild ? guild.name : 'null'}`);
      if (guild) {
        console.log('🔄 Recovering active sessions after daily reset...');
        const analyticsService = getAnalyticsService();
        analyticsService.recoverExistingSessions(guild);
        console.log('✅ Session recovery completed after daily reset');
      } else {
        console.log('⚠️ Guild not available for session recovery after daily reset');
      }
    } else {
      console.log('⚠️ Discord Gateway not ready for session recovery after daily reset');
    }

    // Get summary of reset operation
    const summary = {
      date: today,
      resetTime: now.toISOString(),
      gatewayReset: gateway.isReady(),
      transactionUsed: true,
      userStatsReset: resetResult?.changes || 0,
      dailySnapshotsReset: snapshotResetCount?.changes || 0,
      sessionsEnded: {
        game: endedGameSessions?.changes || 0,
        voice: endedVoiceSessions?.changes || 0,
        spotify: endedSpotifySessions?.changes || 0
      },
      oldSessionsDeleted: {
        game: deletedGameSessions?.changes || 0,
        voice: deletedVoiceSessions?.changes || 0,
        spotify: deletedSpotifySessions?.changes || 0
      },
      sessionRecoveryAttempted: gateway.isReady(),
      historicalSnapshotsCreated: snapshotsCreated
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