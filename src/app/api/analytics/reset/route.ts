import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function POST(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    console.log('🧹 Starting database reset...');
    
    // Get counts before deletion
    const beforeCounts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots').get() as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions').get() as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions').get() as any,
    };
    
    // Delete all data from all tables
    database.exec(`
      DELETE FROM daily_snapshots;
      DELETE FROM game_sessions;
      DELETE FROM voice_sessions;
      DELETE FROM spotify_sessions;
    `);
    
    // Reset auto-increment counters
    database.exec(`
      DELETE FROM sqlite_sequence WHERE name IN (
        'game_sessions', 'voice_sessions', 'spotify_sessions'
      );
    `);
    
    // Vacuum to reclaim space
    database.exec('VACUUM');
    
    // Get counts after deletion (should all be 0)
    const afterCounts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots').get() as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions').get() as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions').get() as any,
    };
    
    console.log('✅ Database reset completed');
    
    return NextResponse.json({
      success: true,
      message: 'Database reset completed',
      before: {
        dailySnapshots: beforeCounts.dailySnapshots?.count || 0,
        gameSessions: beforeCounts.gameSessions?.count || 0,
        voiceSessions: beforeCounts.voiceSessions?.count || 0,
        spotifySessions: beforeCounts.spotifySessions?.count || 0,
      },
      after: {
        dailySnapshots: afterCounts.dailySnapshots?.count || 0,
        gameSessions: afterCounts.gameSessions?.count || 0,
        voiceSessions: afterCounts.voiceSessions?.count || 0,
        spotifySessions: afterCounts.spotifySessions?.count || 0,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database reset failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
