import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsService } from '@/lib/analytics/service';
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET(request: NextRequest) {
  try {
    const analyticsService = getAnalyticsService();
    const db = getAnalyticsDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get current active users
    const activeUsers = analyticsService.getActiveUsers();
    
    // Get all active sessions from database
    const activeSessions = {
      games: db.getActiveGameSessions(),
      voice: db.getActiveVoiceSessions(),
      spotify: db.getActiveSpotifySessions()
    };

    // Get stale sessions
    const staleSessions = {
      games: db.getStaleGameSessions(5),
      voice: db.getStaleVoiceSessions(5),
      spotify: db.getStaleSpotifySessions(5)
    };

    // Get specific user info if requested
    let userInfo = null;
    if (userId) {
      userInfo = {
        activeUser: analyticsService.getUserActivity(userId),
        gameSessions: db.getActiveGameSessions(userId),
        voiceSessions: db.getActiveVoiceSessions(userId),
        spotifySessions: db.getActiveSpotifySessions(userId)
      };
    }

    const response = {
      timestamp: new Date().toISOString(),
      activeUsers: activeUsers.map(user => ({
        userId: user.userId,
        displayName: user.displayName,
        currentStatus: user.currentStatus,
        currentGame: user.currentGame,
        gameSessionId: user.gameSessionId,
        isInVoice: user.isInVoice,
        voiceSessionId: user.voiceSessionId,
        isStreaming: user.isStreaming,
        totalStreamingMinutes: user.totalStreamingMinutes,
        currentSpotify: user.currentSpotify,
        spotifySessionId: user.spotifySessionId
      })),
      activeSessions,
      staleSessions,
      summary: {
        activeUsers: activeUsers.length,
        activeSessions: activeSessions.games.length + activeSessions.voice.length + activeSessions.spotify.length,
        staleSessions: staleSessions.games.length + staleSessions.voice.length + staleSessions.spotify.length
      },
      userInfo
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Debug Sessions API Error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to get debug session information',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
