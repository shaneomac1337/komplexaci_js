import { NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET() {
  try {
    const db = getAnalyticsDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    // Get user stats
    const userStats = db.getDatabase().prepare(`
      SELECT user_id, daily_voice_minutes, monthly_voice_minutes, last_monthly_reset, updated_at
      FROM user_stats 
      ORDER BY updated_at DESC 
      LIMIT 10
    `).all();
    
    // Get active voice sessions
    const voiceSessions = db.getDatabase().prepare(`
      SELECT user_id, channel_name, duration_minutes, start_time, status
      FROM voice_sessions 
      WHERE status = 'active'
      ORDER BY start_time DESC
    `).all();
    
    // Get today's voice sessions
    const todayVoice = db.getDatabase().prepare(`
      SELECT user_id, channel_name, duration_minutes, start_time, status
      FROM voice_sessions 
      WHERE date(start_time) = ?
      ORDER BY start_time DESC
    `).all(today);
    
    return NextResponse.json({
      success: true,
      data: {
        userStats,
        activeVoiceSessions: voiceSessions,
        todayVoiceSessions: todayVoice,
        today
      }
    });
    
  } catch (error) {
    console.error('❌ Debug voice API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch debug data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}