import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsService } from '@/lib/analytics/service';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function POST(request: NextRequest) {
  try {
    const analyticsService = getAnalyticsService();
    const db = getAnalyticsDatabase();
    
    // Get current active sessions count before cleanup
    const beforeStats = {
      gameSessions: db.getActiveGameSessions().length,
      voiceSessions: db.getActiveVoiceSessions().length,
      spotifySessions: db.getActiveSpotifySessions().length
    };
    
    console.log('🧹 Manual session cleanup triggered');
    
    // End all active sessions
    const currentTime = new Date();
    const endTimeISO = currentTime.toISOString();
    
    // End all active game sessions
    const gameResult = db.getDatabase().prepare(`
      UPDATE game_sessions 
      SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
      WHERE status = 'active'
    `).run(endTimeISO);
    
    // End all active voice sessions
    const voiceResult = db.getDatabase().prepare(`
      UPDATE voice_sessions 
      SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
      WHERE status = 'active'
    `).run(endTimeISO);
    
    // End all active Spotify sessions
    const spotifyResult = db.getDatabase().prepare(`
      UPDATE spotify_sessions 
      SET status = 'ended', end_time = ?, last_updated = CURRENT_TIMESTAMP
      WHERE status = 'active'
    `).run(endTimeISO);
    
    // Clear active users map
    const activeUsers = analyticsService.getActiveUsers();
    const activeUserCount = activeUsers.length;
    
    // Force clear the active users map (this is a bit hacky but needed for testing)
    (analyticsService as any).activeUsers.clear();
    
    const afterStats = {
      gameSessions: db.getActiveGameSessions().length,
      voiceSessions: db.getActiveVoiceSessions().length,
      spotifySessions: db.getActiveSpotifySessions().length
    };
    
    console.log(`🧹 Session cleanup completed: ${gameResult.changes} game, ${voiceResult.changes} voice, ${spotifyResult.changes} Spotify sessions ended`);
    
    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      timestamp: currentTime.toISOString(),
      results: {
        before: beforeStats,
        after: afterStats,
        ended: {
          gameSessions: gameResult.changes,
          voiceSessions: voiceResult.changes,
          spotifySessions: spotifyResult.changes
        },
        activeUsersCleared: activeUserCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error during session cleanup:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const analyticsService = getAnalyticsService();
    
    // Get current session counts
    const activeSessions = {
      gameSessions: db.getActiveGameSessions().length,
      voiceSessions: db.getActiveVoiceSessions().length,
      spotifySessions: db.getActiveSpotifySessions().length
    };
    
    // Check for duplicate sessions
    const duplicateGameSessions = db.getDatabase().prepare(`
      SELECT user_id, game_name, COUNT(*) as session_count
      FROM game_sessions 
      WHERE status = 'active' 
      GROUP BY user_id, game_name 
      HAVING COUNT(*) > 1
    `).all();
    
    const activeUsers = analyticsService.getActiveUsers();
    
    return NextResponse.json({
      success: true,
      message: 'Session cleanup status',
      timestamp: new Date().toISOString(),
      data: {
        activeSessions,
        duplicateGameSessions: duplicateGameSessions.length,
        duplicateDetails: duplicateGameSessions,
        activeUsers: activeUsers.length,
        needsCleanup: duplicateGameSessions.length > 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking session cleanup status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check session status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
