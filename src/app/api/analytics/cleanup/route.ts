import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

/**
 * Data Cleanup Endpoint - Removes old data beyond retention period
 * This is safe and preserves recent data for analytics
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const retentionDays = parseInt(searchParams.get('retentionDays') || '365'); // Default 1 year
    const dryRun = searchParams.get('dryRun') === 'true';
    
    if (retentionDays < 30) {
      return NextResponse.json({
        success: false,
        error: 'Invalid retention period',
        message: 'Retention period must be at least 30 days to preserve analytics data'
      }, { status: 400 });
    }
    
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    console.log(`🧹 Starting data cleanup (retention: ${retentionDays} days, cutoff: ${cutoffDateStr}, dryRun: ${dryRun})`);
    
    // Get counts of data to be removed
    const toRemoveCounts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots WHERE date < ?').get(cutoffDateStr) as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions WHERE DATE(start_time) < ?').get(cutoffDateStr) as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions WHERE DATE(start_time) < ?').get(cutoffDateStr) as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions WHERE DATE(start_time) < ?').get(cutoffDateStr) as any,
    };
    
    // Get counts of data to be preserved
    const toPreserveCounts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots WHERE date >= ?').get(cutoffDateStr) as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions WHERE DATE(start_time) >= ?').get(cutoffDateStr) as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions WHERE DATE(start_time) >= ?').get(cutoffDateStr) as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions WHERE DATE(start_time) >= ?').get(cutoffDateStr) as any,
    };
    
    if (!dryRun) {
      // Perform actual cleanup in a transaction
      const transaction = database.transaction(() => {
        database.prepare('DELETE FROM daily_snapshots WHERE date < ?').run(cutoffDateStr);
        database.prepare('DELETE FROM game_sessions WHERE DATE(start_time) < ?').run(cutoffDateStr);
        database.prepare('DELETE FROM voice_sessions WHERE DATE(start_time) < ?').run(cutoffDateStr);
        database.prepare('DELETE FROM spotify_sessions WHERE DATE(start_time) < ?').run(cutoffDateStr);
      });
      
      transaction();
      
      // Vacuum to reclaim space
      database.exec('VACUUM');
      
      console.log('✅ Data cleanup completed');
    } else {
      console.log('🔍 Dry run completed - no data was actually removed');
    }
    
    return NextResponse.json({
      success: true,
      message: dryRun ? 'Dry run completed - no data removed' : 'Data cleanup completed',
      retentionDays,
      cutoffDate: cutoffDateStr,
      dryRun,
      removed: dryRun ? null : {
        dailySnapshots: toRemoveCounts.dailySnapshots?.count || 0,
        gameSessions: toRemoveCounts.gameSessions?.count || 0,
        voiceSessions: toRemoveCounts.voiceSessions?.count || 0,
        spotifySessions: toRemoveCounts.spotifySessions?.count || 0,
      },
      preserved: {
        dailySnapshots: toPreserveCounts.dailySnapshots?.count || 0,
        gameSessions: toPreserveCounts.gameSessions?.count || 0,
        voiceSessions: toPreserveCounts.voiceSessions?.count || 0,
        spotifySessions: toPreserveCounts.spotifySessions?.count || 0,
      },
      wouldRemove: dryRun ? {
        dailySnapshots: toRemoveCounts.dailySnapshots?.count || 0,
        gameSessions: toRemoveCounts.gameSessions?.count || 0,
        voiceSessions: toRemoveCounts.voiceSessions?.count || 0,
        spotifySessions: toRemoveCounts.spotifySessions?.count || 0,
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Data cleanup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Data cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // GET request defaults to dry run
  const url = new URL(request.url);
  url.searchParams.set('dryRun', 'true');
  
  return POST(new NextRequest(url.toString(), { method: 'POST' }));
}