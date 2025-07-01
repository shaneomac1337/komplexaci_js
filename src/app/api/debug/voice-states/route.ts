import { NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';
import { initializeDiscordGateway } from '@/lib/discord-startup';

export async function GET() {
  try {
    // Initialize Discord Gateway if not already done
    await initializeDiscordGateway();

    const gateway = getDiscordGateway();

    if (!gateway.isReady()) {
      return NextResponse.json(
        {
          error: 'Discord Gateway not ready',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Get all members and their voice states
    const allMembers = gateway.getAllMembers();

    // Also get raw Discord guild data for comparison
    const rawGuild = gateway.getGuild();
    const rawVoiceStates = [];

    if (rawGuild) {
      rawGuild.members.cache.forEach((member: any) => {
        if (member.user.bot) return;
        if (!member.presence || member.presence.status === 'offline') return;

        rawVoiceStates.push({
          userId: member.id,
          displayName: member.displayName || member.user.username,
          hasVoiceProperty: !!member.voice,
          voiceChannel: member.voice?.channel ? {
            id: member.voice.channel.id,
            name: member.voice.channel.name,
            streaming: member.voice.streaming || false
          } : null,
          rawVoiceState: member.voice
        });
      });
    }

    const voiceStateDebug = {
      timestamp: new Date().toISOString(),
      totalMembers: allMembers.length,
      onlineMembers: allMembers.filter(m => m.status !== 'offline').length,
      rawVoiceStatesFromGuild: rawVoiceStates,
      membersWithVoiceData: [],
      voiceStateAnalysis: {
        hasVoiceProperty: 0,
        hasVoiceChannel: 0,
        isStreaming: 0,
        voiceChannels: {}
      }
    };

    // Analyze each member's voice state
    for (const member of allMembers) {
      if (member.status === 'offline') continue;

      const voiceInfo = {
        id: member.id,
        displayName: member.displayName,
        status: member.status,
        hasVoiceProperty: !!member.voice,
        voiceState: member.voice ? {
          hasChannel: !!member.voice.channel,
          channelId: member.voice.channel?.id,
          channelName: member.voice.channel?.name,
          streaming: member.voice.streaming,
          selfMute: member.voice.selfMute,
          selfDeaf: member.voice.selfDeaf,
          serverMute: member.voice.serverMute,
          serverDeaf: member.voice.serverDeaf
        } : null,
        activities: member.activities?.map(activity => ({
          type: activity.type,
          name: activity.name,
          details: activity.details,
          state: activity.state
        })) || []
      };

      // Count voice state statistics
      if (member.voice) {
        voiceStateDebug.voiceStateAnalysis.hasVoiceProperty++;
        
        if (member.voice.channel) {
          voiceStateDebug.voiceStateAnalysis.hasVoiceChannel++;
          
          const channelName = member.voice.channel.name;
          if (!voiceStateDebug.voiceStateAnalysis.voiceChannels[channelName]) {
            voiceStateDebug.voiceStateAnalysis.voiceChannels[channelName] = {
              users: 0,
              streaming: 0
            };
          }
          voiceStateDebug.voiceStateAnalysis.voiceChannels[channelName].users++;
          
          if (member.voice.streaming) {
            voiceStateDebug.voiceStateAnalysis.isStreaming++;
            voiceStateDebug.voiceStateAnalysis.voiceChannels[channelName].streaming++;
          }
        }
      }

      // Only include members with interesting voice data or activities
      if (voiceInfo.hasVoiceProperty || voiceInfo.activities.length > 0) {
        voiceStateDebug.membersWithVoiceData.push(voiceInfo);
      }
    }

    return NextResponse.json(voiceStateDebug);

  } catch (error) {
    console.error('Error fetching voice state debug info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch voice state debug info',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
