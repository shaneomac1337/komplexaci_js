import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsService } from '@/lib/analytics/service';
import { getDiscordGateway } from '@/lib/discord-gateway';

export async function POST(request: NextRequest) {
  try {
    const analyticsService = getAnalyticsService();
    const discordGateway = getDiscordGateway();

    // Check if Discord Gateway is ready
    if (!discordGateway.isReady()) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Discord Gateway not ready',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Get real Discord guild data (not cached data)
    const guild = (discordGateway as any).client?.guilds?.cache?.get((discordGateway as any).serverId);

    if (!guild) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Discord guild not available',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Trigger session recovery with real Discord data
    analyticsService.recoverExistingSessions(guild);

    // Get current state after recovery
    const activeUsers = analyticsService.getActiveUsers();
    
    const response = {
      status: 'success',
      message: 'Session recovery completed',
      timestamp: new Date().toISOString(),
      results: {
        totalMembers: allMembers.length,
        activeUsers: activeUsers.length,
        recoveredSessions: activeUsers.length,
        activeUserDetails: activeUsers.map(user => ({
          userId: user.userId,
          displayName: user.displayName,
          currentGame: user.currentGame,
          gameSessionId: user.gameSessionId,
          isInVoice: user.isInVoice,
          voiceSessionId: user.voiceSessionId,
          isStreaming: user.isStreaming,
          currentSpotify: user.currentSpotify,
          spotifySessionId: user.spotifySessionId
        }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Session Recovery API Error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to recover sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check what sessions could be recovered
export async function GET(request: NextRequest) {
  try {
    const discordGateway = getDiscordGateway();

    if (!discordGateway.isReady()) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Discord Gateway not ready',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Get real Discord guild data
    const guild = (discordGateway as any).client?.guilds?.cache?.get((discordGateway as any).serverId);

    if (!guild) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Discord guild not available',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    const potentialSessions: any[] = [];
    let totalMembers = 0;
    let onlineMembers = 0;

    // Check real Discord member data
    guild.members.cache.forEach((member: any) => {
      if (member.user.bot) return;

      totalMembers++;

      if (!member.presence || member.presence.status === 'offline') return;

      onlineMembers++;

      const activities = member.presence.activities?.map((activity: any) => ({
        type: activity.type,
        name: activity.name,
        details: activity.details,
        state: activity.state
      })) || [];

      potentialSessions.push({
        userId: member.id,
        displayName: member.displayName || member.user.username,
        status: member.presence.status,
        activities,
        couldRecoverGame: activities.some(a => a.type === 0),
        couldRecoverSpotify: activities.some(a => a.type === 2 && a.name === 'Spotify'),
        couldRecoverVoice: !!(member.voice && member.voice.channel),
        voiceChannel: member.voice?.channel ? {
          id: member.voice.channel.id,
          name: member.voice.channel.name,
          streaming: member.voice.streaming || false
        } : null
      });
    });

    const response = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      summary: {
        totalMembers,
        onlineMembers,
        potentialGameSessions: potentialSessions.filter(m => m.couldRecoverGame).length,
        potentialSpotifySessions: potentialSessions.filter(m => m.couldRecoverSpotify).length,
        potentialVoiceSessions: potentialSessions.filter(m => m.couldRecoverVoice).length
      },
      potentialSessions
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Session Recovery Check API Error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to check potential sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
