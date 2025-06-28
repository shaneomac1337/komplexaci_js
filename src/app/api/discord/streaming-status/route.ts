import { NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';
import { initializeDiscordGateway } from '@/lib/discord-startup';

export async function GET() {
  try {
    // Initialize Discord Gateway if not already done
    await initializeDiscordGateway();

    const gateway = getDiscordGateway();

    // Wait up to 3 seconds for Gateway to be ready
    const maxWaitTime = 3000;
    const startTime = Date.now();

    while (!gateway.isReady() && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!gateway.isReady()) {
      return NextResponse.json(
        { 
          error: 'Discord Gateway not ready',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    const stats = gateway.getServerStats();
    if (!stats) {
      return NextResponse.json(
        { 
          error: 'Server stats not available',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Get real Discord guild data (not cached Gateway data)
    const guild = (gateway as any).client?.guilds?.cache?.get((gateway as any).serverId);

    if (!guild) {
      return NextResponse.json(
        {
          error: 'Discord guild not available',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    const streamingAnalysis = {
      timestamp: new Date().toISOString(),
      totalMembers: 0,
      onlineMembers: 0,
      streamingUsers: [],
      voiceUsers: [],
      summary: {
        totalStreaming: 0,
        totalInVoice: 0,
        channels: {}
      }
    };

    // Analyze each member using real Discord data
    guild.members.cache.forEach((member: any) => {
      if (member.user.bot) return;

      streamingAnalysis.totalMembers++;

      if (!member.presence || member.presence.status === 'offline') return;

      streamingAnalysis.onlineMembers++;

      // Check voice state from real Discord data
      const voiceState = member.voice;
      const isInVoice = !!(voiceState && voiceState.channel);
      const isStreaming = voiceState?.streaming || false;

      if (isInVoice) {
        const voiceInfo = {
          id: member.id,
          displayName: member.displayName || member.user.username,
          username: member.user.username,
          channelId: voiceState.channel.id,
          channelName: voiceState.channel.name,
          isStreaming,
          status: member.presence.status,
          activities: member.presence.activities?.map((activity: any) => ({
            type: activity.type,
            name: activity.name,
            details: activity.details,
            state: activity.state
          })) || []
        };

        streamingAnalysis.voiceUsers.push(voiceInfo);
        streamingAnalysis.summary.totalInVoice++;

        // Track channel usage
        const channelName = voiceState.channel.name;
        if (!streamingAnalysis.summary.channels[channelName]) {
          streamingAnalysis.summary.channels[channelName] = {
            users: 0,
            streaming: 0
          };
        }
        streamingAnalysis.summary.channels[channelName].users++;

        if (isStreaming) {
          streamingAnalysis.streamingUsers.push({
            ...voiceInfo,
            streamType: 'Screen Share',
            streamingTo: channelName
          });
          streamingAnalysis.summary.totalStreaming++;
          streamingAnalysis.summary.channels[channelName].streaming++;
        }
      }
    });

    return NextResponse.json(streamingAnalysis);

  } catch (error) {
    console.error('Error fetching streaming status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch streaming status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
