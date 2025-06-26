import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    // Get database file info
    const dataDir = process.env.ANALYTICS_DATA_DIR || path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'analytics.db');
    
    let fileStats = null;
    let fileExists = false;
    
    try {
      fileStats = fs.statSync(dbPath);
      fileExists = true;
    } catch (error) {
      fileExists = false;
    }
    
    // Get table counts
    const counts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots').get() as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions').get() as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions').get() as any,
    };
    
    // Get latest entries
    const latestEntries = {
      dailySnapshots: database.prepare('SELECT * FROM daily_snapshots ORDER BY created_at DESC LIMIT 5').all(),
      gameSessions: database.prepare('SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT 3').all(),
      voiceSessions: database.prepare('SELECT * FROM voice_sessions ORDER BY created_at DESC LIMIT 3').all(),
      spotifySessions: database.prepare('SELECT * FROM spotify_sessions ORDER BY created_at DESC LIMIT 3').all(),
    };
    
    // Get unique users
    const uniqueUsers = database.prepare('SELECT COUNT(DISTINCT user_id) as count FROM daily_snapshots').get() as any;
    
    // Get date range
    const dateRange = database.prepare(`
      SELECT 
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM daily_snapshots
    `).get() as any;
    
    return NextResponse.json({
      success: true,
      database: {
        path: dbPath,
        exists: fileExists,
        size: fileExists ? Math.round(fileStats!.size / 1024) : 0, // KB
        lastModified: fileExists ? fileStats!.mtime.toISOString() : null,
        dataDirectory: dataDir
      },
      statistics: {
        totalRecords: {
          dailySnapshots: counts.dailySnapshots?.count || 0,
          gameSessions: counts.gameSessions?.count || 0,
          voiceSessions: counts.voiceSessions?.count || 0,
          spotifySessions: counts.spotifySessions?.count || 0,
        },
        uniqueUsers: uniqueUsers?.count || 0,
        dateRange: {
          earliest: dateRange?.earliest_date || null,
          latest: dateRange?.latest_date || null
        }
      },
      latestEntries,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Data info failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get data info',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
