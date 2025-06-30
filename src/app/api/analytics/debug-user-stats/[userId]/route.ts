import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const db = getAnalyticsDatabase();
    
    // Get user stats
    const userStats = db.getUserStats(userId);
    
    if (!userStats) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        userId
      }, { status: 404 });
    }
    
    // Get recent game sessions for this user
    const recentGameSessions = db.getDatabase().prepare(`
      SELECT id, game_name, start_time, end_time, duration_minutes, status, created_at
      FROM game_sessions 
      WHERE user_id = ? 
      ORDER BY start_time DESC 
      LIMIT 10
    `).all(userId);
    
    // Get sessions since last daily reset
    const sessionsSinceReset = db.getDatabase().prepare(`
      SELECT id, game_name, start_time, end_time, duration_minutes, status, created_at
      FROM game_sessions 
      WHERE user_id = ? AND start_time >= ?
      ORDER BY start_time DESC
    `).all(userId, userStats.last_daily_reset);
    
    return NextResponse.json({
      success: true,
      userId,
      userStats,
      recentGameSessions,
      sessionsSinceReset,
      resetTime: userStats.last_daily_reset,
      currentTime: new Date().toISOString(),
      sessionCount: sessionsSinceReset.length
    });
    
  } catch (error) {
    console.error('❌ Debug user stats failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
