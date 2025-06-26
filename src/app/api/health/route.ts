import { NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';

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

    // Determine overall health
    const isHealthy = isReady && !!serverStats;

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        discord_gateway: discordStatus.ready ? 'ready' : 'not_ready',
        discord_stats: discordStatus.hasServerStats ? 'available' : 'unavailable',
        analytics_db: 'operational',
        member_count: discordStatus.memberCount
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