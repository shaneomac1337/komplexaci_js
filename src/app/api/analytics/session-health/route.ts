import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsService } from '@/lib/analytics/service';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET(request: NextRequest) {
  try {
    const analyticsService = getAnalyticsService();
    const db = getAnalyticsDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const staleMinutes = parseInt(searchParams.get('staleMinutes') || '5');
    const includeDetails = searchParams.get('details') === 'true';

    // Get session health information
    const activeSessions = {
      games: db.getActiveGameSessions(),
      voice: db.getActiveVoiceSessions(),
      spotify: db.getActiveSpotifySessions()
    };

    const staleSessions = {
      games: db.getStaleGameSessions(staleMinutes),
      voice: db.getStaleVoiceSessions(staleMinutes),
      spotify: db.getStaleSpotifySessions(staleMinutes)
    };

    const summary = {
      active: {
        games: activeSessions.games.length,
        voice: activeSessions.voice.length,
        spotify: activeSessions.spotify.length,
        total: activeSessions.games.length + activeSessions.voice.length + activeSessions.spotify.length
      },
      stale: {
        games: staleSessions.games.length,
        voice: staleSessions.voice.length,
        spotify: staleSessions.spotify.length,
        total: staleSessions.games.length + staleSessions.voice.length + staleSessions.spotify.length
      },
      activeUsers: analyticsService.getActiveUsers().length,
      staleThresholdMinutes: staleMinutes
    };

    const response: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      summary
    };

    // Include detailed session information if requested
    if (includeDetails) {
      response.details = {
        activeSessions,
        staleSessions
      };
    }

    // Add warnings if there are many stale sessions
    if (summary.stale.total > 5) {
      response.warnings = [
        `High number of stale sessions detected: ${summary.stale.total} sessions older than ${staleMinutes} minutes`
      ];
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Session Health API Error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to get session health information',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger session cleanup
export async function POST(request: NextRequest) {
  try {
    const analyticsService = getAnalyticsService();
    
    // Get request body
    const body = await request.json().catch(() => ({}));
    const staleMinutes = body.staleMinutes || 5;
    const forceCleanup = body.forceCleanup || false;

    let results = {
      progressUpdated: false,
      staleSessionsCleaned: false,
      validationPerformed: false,
      timestamp: new Date().toISOString()
    };

    // Update active sessions progress
    analyticsService.updateActiveSessionsProgress();
    results.progressUpdated = true;

    // Clean up stale sessions
    analyticsService.cleanupStaleSessions(staleMinutes);
    results.staleSessionsCleaned = true;

    // Validate sessions with presence
    analyticsService.validateActiveSessionsWithPresence();
    results.validationPerformed = true;

    return NextResponse.json({
      status: 'success',
      message: 'Session cleanup completed',
      results
    });

  } catch (error) {
    console.error('Session Cleanup API Error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to perform session cleanup',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
