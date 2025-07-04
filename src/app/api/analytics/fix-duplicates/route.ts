import { NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function POST() {
  try {
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    console.log('🔧 Starting duplicate session cleanup...');
    
    // Find and remove duplicate game sessions (keep the latest one)
    const duplicateGames = database.prepare(`
      DELETE FROM game_sessions 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM game_sessions 
        WHERE status = 'active' 
        GROUP BY user_id, game_name
      ) AND status = 'active'
    `).run();
    
    // Find and remove duplicate voice sessions (keep the latest one)
    const duplicateVoice = database.prepare(`
      DELETE FROM voice_sessions 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM voice_sessions 
        WHERE status = 'active' 
        GROUP BY user_id, channel_name
      ) AND status = 'active'
    `).run();
    
    // Find and remove duplicate Spotify sessions (keep the latest one)
    const duplicateSpotify = database.prepare(`
      DELETE FROM spotify_sessions 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM spotify_sessions 
        WHERE status = 'active' 
        GROUP BY user_id, track_name, artist
      ) AND status = 'active'
    `).run();
    
    // Remove 0-minute ended sessions from today (they're likely artifacts)
    const today = new Date().toISOString().split('T')[0];
    const zeroMinuteSessions = database.prepare(`
      DELETE FROM game_sessions 
      WHERE duration_minutes = 0 
      AND status = 'ended' 
      AND date(start_time) = ?
    `).run(today);
    
    const zeroMinuteVoice = database.prepare(`
      DELETE FROM voice_sessions 
      WHERE duration_minutes = 0 
      AND status = 'ended' 
      AND date(start_time) = ?
    `).run(today);
    
    console.log('✅ Duplicate session cleanup completed');
    
    return NextResponse.json({
      success: true,
      message: 'Duplicate sessions cleaned up successfully',
      cleaned: {
        duplicateGameSessions: duplicateGames.changes,
        duplicateVoiceSessions: duplicateVoice.changes,
        duplicateSpotifySessions: duplicateSpotify.changes,
        zeroMinuteGameSessions: zeroMinuteSessions.changes,
        zeroMinuteVoiceSessions: zeroMinuteVoice.changes
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up duplicate sessions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clean up duplicate sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    // Check for duplicate active sessions
    const duplicateGames = database.prepare(`
      SELECT user_id, game_name, COUNT(*) as count
      FROM game_sessions 
      WHERE status = 'active' 
      GROUP BY user_id, game_name 
      HAVING COUNT(*) > 1
    `).all();
    
    const duplicateVoice = database.prepare(`
      SELECT user_id, channel_name, COUNT(*) as count
      FROM voice_sessions 
      WHERE status = 'active' 
      GROUP BY user_id, channel_name 
      HAVING COUNT(*) > 1
    `).all();
    
    const duplicateSpotify = database.prepare(`
      SELECT user_id, track_name, artist, COUNT(*) as count
      FROM spotify_sessions 
      WHERE status = 'active' 
      GROUP BY user_id, track_name, artist 
      HAVING COUNT(*) > 1
    `).all();
    
    // Check for 0-minute sessions from today
    const today = new Date().toISOString().split('T')[0];
    const zeroMinuteGames = database.prepare(`
      SELECT COUNT(*) as count
      FROM game_sessions 
      WHERE duration_minutes = 0 
      AND status = 'ended' 
      AND date(start_time) = ?
    `).get(today) as any;
    
    const zeroMinuteVoice = database.prepare(`
      SELECT COUNT(*) as count
      FROM voice_sessions 
      WHERE duration_minutes = 0 
      AND status = 'ended' 
      AND date(start_time) = ?
    `).get(today) as any;
    
    return NextResponse.json({
      success: true,
      duplicates: {
        games: duplicateGames,
        voice: duplicateVoice,
        spotify: duplicateSpotify
      },
      zeroMinuteSessions: {
        games: zeroMinuteGames.count,
        voice: zeroMinuteVoice.count
      },
      needsCleanup: duplicateGames.length > 0 || duplicateVoice.length > 0 || duplicateSpotify.length > 0 || zeroMinuteGames.count > 0 || zeroMinuteVoice.count > 0
    });
    
  } catch (error) {
    console.error('❌ Error checking for duplicates:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check for duplicates',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
