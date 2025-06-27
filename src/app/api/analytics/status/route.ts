import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { getDiscordGateway } from '@/lib/discord-gateway';

/**
 * Analytics System Status Endpoint
 * Provides overview of the new analytics reset system
 */
export async function GET(request: NextRequest) {
  try {
    const db = getAnalyticsDatabase();
    const database = db.getDatabase();
    const gateway = getDiscordGateway();
    
    // Get current data counts
    const counts = {
      dailySnapshots: database.prepare('SELECT COUNT(*) as count FROM daily_snapshots').get() as any,
      gameSessions: database.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as any,
      voiceSessions: database.prepare('SELECT COUNT(*) as count FROM voice_sessions').get() as any,
      spotifySessions: database.prepare('SELECT COUNT(*) as count FROM spotify_sessions').get() as any,
    };
    
    // Get date range of data
    const dateRange = database.prepare(`
      SELECT 
        MIN(date) as earliest_date,
        MAX(date) as latest_date,
        COUNT(DISTINCT date) as unique_dates
      FROM daily_snapshots
    `).get() as any;
    
    // Get today's data
    const today = new Date().toISOString().split('T')[0];
    const todaysData = db.getCurrentDayData(today);
    
    // Get active members from Discord Gateway
    const activeMembers = gateway.isReady() ? gateway.getMostActiveMembers(5) : [];
    
    // System status
    const systemStatus = {
      discordGateway: {
        connected: gateway.isReady(),
        memberCount: gateway.getMemberCount(),
        onlineCount: gateway.getOnlineCount(),
        lastUpdated: gateway.getServerStats()?.lastUpdated || null
      },
      database: {
        healthy: db.healthCheck().status === 'healthy',
        totalRecords: Object.values(counts).reduce((sum: number, count: any) => sum + (count?.count || 0), 0),
        dateRange: {
          earliest: dateRange?.earliest_date || null,
          latest: dateRange?.latest_date || null,
          totalDays: dateRange?.unique_dates || 0
        }
      }
    };
    
    return NextResponse.json({
      success: true,
      message: 'Analytics system status - New reset architecture implemented',
      system: {
        version: '2.0.0',
        resetArchitecture: 'Non-destructive daily resets + data retention',
        lastUpdated: new Date().toISOString()
      },
      status: systemStatus,
      dataOverview: {
        totalRecords: {
          dailySnapshots: counts.dailySnapshots?.count || 0,
          gameSessions: counts.gameSessions?.count || 0,
          voiceSessions: counts.voiceSessions?.count || 0,
          spotifySessions: counts.spotifySessions?.count || 0,
        },
        dataRetention: {
          earliestRecord: dateRange?.earliest_date,
          latestRecord: dateRange?.latest_date,
          daysOfData: dateRange?.unique_dates || 0
        },
        today: {
          date: today,
          activeUsers: todaysData.dailySnapshots.length,
          sessions: {
            games: todaysData.todaysSessions.games.length,
            voice: todaysData.todaysSessions.voice.length,
            spotify: todaysData.todaysSessions.spotify.length
          }
        }
      },
      endpoints: {
        deprecated: {
          '/api/analytics/reset': 'DEPRECATED - Use alternatives below'
        },
        safe: {
          '/api/analytics/status': 'System status and overview (this endpoint)',
          '/api/analytics/data-info': 'Database information and statistics',
          '/api/analytics/export': 'Export data for backup (GET/POST)',
          '/api/analytics/cleanup': 'Remove old data beyond retention period',
          '/api/analytics/populate-today': 'Force save current daily stats'
        },
        admin: {
          '/api/analytics/admin/reset-database': 'EMERGENCY complete reset (admin auth required)'
        }
      },
      automaticFeatures: {
        dailyReset: {
          enabled: true,
          time: 'Midnight Czech time (Europe/Prague)',
          behavior: 'Resets in-memory counters only, preserves database history',
          managed_by: 'Discord Gateway Service'
        },
        dataBackup: {
          automatic: 'Before any destructive operations',
          manual: 'Available via /api/analytics/export'
        }
      },
      activeMembers: activeMembers.map(member => ({
        name: member.displayName,
        dailyMinutes: member.dailyOnlineTime,
        status: member.status
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Analytics status check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}