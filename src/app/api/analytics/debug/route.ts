import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    
    // Get all table counts and sample data
    const debug = {
      tables: {},
      sampleData: {}
    };
    
    // Check each table
    const tables = ['daily_snapshots', 'game_sessions', 'voice_sessions', 'spotify_sessions', 'monthly_summaries', 'achievements'];
    
    for (const table of tables) {
      try {
        // Get count
        const countResult = database.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;
        debug.tables[table] = countResult?.count || 0;
        
        // Get sample data (last 5 records)
        const sampleResult = database.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC LIMIT 5`).all();
        debug.sampleData[table] = sampleResult;
      } catch (error) {
        debug.tables[table] = `Error: ${error}`;
        debug.sampleData[table] = [];
      }
    }
    
    // Get database info
    const dbInfo = {
      pageCount: database.prepare('PRAGMA page_count').get(),
      pageSize: database.prepare('PRAGMA page_size').get(),
      journalMode: database.prepare('PRAGMA journal_mode').get(),
      userVersion: database.prepare('PRAGMA user_version').get()
    };
    
    // Get table schemas
    const schemas = {};
    for (const table of tables) {
      try {
        const schema = database.prepare(`PRAGMA table_info(${table})`).all();
        schemas[table] = schema;
      } catch (error) {
        schemas[table] = `Error: ${error}`;
      }
    }
    
    return NextResponse.json({
      success: true,
      debug,
      dbInfo,
      schemas,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Analytics debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
