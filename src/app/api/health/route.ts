import { NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';
import { getAnalyticsService } from '@/lib/analytics/service';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET() {
  try {
    // Check Discord Gateway status
    const gateway = getDiscordGateway();
    const isReady = gateway.isReady();
    const serverStats = gateway.getServerStats();

    const discordStatus = {
      ready: isReady,
      hasServerStats: !!serverStats,
      memberCount: gateway.getMemberCount()
    };

    // Check analytics health
    let analyticsStatus = { status: 'unknown', activeSessions: 0, activeUsers: 0, validationMethod: 'real-time' };
    try {
      const analyticsService = getAnalyticsService();
      const db = getAnalyticsDatabase();

      const analyticsHealth = analyticsService.healthCheck();
      const dbHealth = db.healthCheck();

      const activeSessions = {
        games: db.getActiveGameSessions().length,
        voice: db.getActiveVoiceSessions().length,
        spotify: db.getActiveSpotifySessions().length
      };

      analyticsStatus = {
        status: dbHealth.status,
        activeSessions: activeSessions.games + activeSessions.voice + activeSessions.spotify,
        activeUsers: analyticsHealth.activeUsers,
        validationMethod: 'real-time' // Now using real-time Discord validation instead of stale cleanup
      };
    } catch (error) {
      analyticsStatus.status = 'error';
    }

    // Determine overall health
    const isHealthy = isReady && !!serverStats && analyticsStatus.status === 'healthy';

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        discord_gateway: discordStatus.ready ? 'ready' : 'not_ready',
        discord_stats: discordStatus.hasServerStats ? 'available' : 'unavailable',
        analytics_db: analyticsStatus.status,
        analytics_sessions: analyticsStatus.activeSessions,
        analytics_validation: analyticsStatus.validationMethod,
        analytics_active_users: analyticsStatus.activeUsers,
        member_count: discordStatus.memberCount,
        session_recovery: discordStatus.ready ? 'available' : 'unavailable'
      },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      node_version: process.version,
      platform: process.platform
    }
  };

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });

  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        discord_gateway: 'error',
        discord_stats: 'error',
        analytics_db: 'error',
        member_count: 0
      }
    }, {
      status: 503
    });
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}