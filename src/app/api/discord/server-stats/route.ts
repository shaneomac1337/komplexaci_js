import { NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { initializeDiscordGateway } from '@/lib/discord-startup';
import { getBestDiscordAvatarUrl } from '@/lib/discord-avatar-utils';

export async function GET() {
  try {
    // Initialize Discord Gateway if not already done
    await initializeDiscordGateway();

    const gateway = getDiscordGateway();

    // Wait up to 3 seconds for Gateway to be ready on first load
    const maxWaitTime = 3000; // 3 seconds
    const startTime = Date.now();

    while (!gateway.isReady() && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    }

    // Try to get real-time data from Gateway first
    if (gateway.isReady()) {
      const stats = gateway.getServerStats();
      if (stats) {
        console.log(`Serving real-time Discord data: ${stats.onlineMembers.length} online members`);

        // Get all members from Gateway (both online and offline)
        const allMembers = gateway.getAllMembers();

        // Get real-time daily online minutes from user_stats for ALL members
        const db = getAnalyticsDatabase();
        const allUserStats = db.getDatabase().prepare(`
          SELECT user_id, daily_online_minutes
          FROM user_stats
        `).all();

        // Create a map for quick lookup
        const userStatsMap = new Map();
        allUserStats.forEach((stat: any) => {
          userStatsMap.set(stat.user_id, stat.daily_online_minutes);
        });

        // Update all members with real-time database data
        const membersWithRealTimeData = allMembers.map(member => ({
          ...member,
          dailyOnlineTime: userStatsMap.get(member.id) || 0
        }));

        // Get most active members (those with > 0 minutes)
        const mostActiveMembers = membersWithRealTimeData
          .filter(member => member.dailyOnlineTime > 0)
          .sort((a, b) => b.dailyOnlineTime - a.dailyOnlineTime)
          .slice(0, 50);

        // Format for frontend compatibility
        const onlineMembersWithDetails = membersWithRealTimeData.map(member => {
            // Find custom status (type 4) first, then other activities
            const customStatus = member.activities.find((activity: any) => activity.type === 4);
            const otherActivity = member.activities.find((activity: any) => activity.type !== 4);

            // Enhanced streaming detection
            const voiceState = member.voice;
            const isStreaming = voiceState?.streaming || false;
            const isInVoice = !!(voiceState && voiceState.channel);

            // Create streaming activity if user is streaming
            let displayActivity = otherActivity;
            let streamingInfo = null;

            if (isStreaming && voiceState?.channel) {
              streamingInfo = {
                isStreaming: true,
                channelName: voiceState.channel.name,
                channelId: voiceState.channel.id,
                streamingTo: `${voiceState.channel.name}`,
                streamType: 'Screen Share'
              };

              // Override activity if streaming but no game activity
              if (!otherActivity || otherActivity.type !== 0) {
                displayActivity = {
                  name: 'Screen Share',
                  type: 1, // Streaming type
                  details: `Streaming to ${voiceState.channel.name}`,
                  state: 'Live'
                };
              }
            } else if (isInVoice && voiceState?.channel) {
              // User in voice but not streaming
              streamingInfo = {
                isStreaming: false,
                channelName: voiceState.channel.name,
                channelId: voiceState.channel.id,
                inVoice: true
              };
            }

            return {
              id: member.id,
              username: member.username,
              displayName: member.displayName,
              avatar: member.avatar,
              status: member.status,
              activity: displayActivity ? {
                name: displayActivity.name,
                type: displayActivity.type,
                details: displayActivity.details,
                state: displayActivity.state,
              } : null,
              customStatus: customStatus ? {
                name: customStatus.name,
                emoji: customStatus.emoji ? {
                  name: customStatus.emoji.name,
                  id: customStatus.emoji.id,
                  animated: customStatus.emoji.animated
                } : null,
                state: customStatus.state
              } : null,
              streaming: streamingInfo,
              roles: member.roles,
              isRealOnline: member.status !== 'offline',
              joinedAt: member.joinedAt
            };
        });

        // Calculate streaming statistics
        const streamingUsers = onlineMembersWithDetails.filter(member =>
          member.streaming?.isStreaming
        );
        const voiceUsers = onlineMembersWithDetails.filter(member =>
          member.streaming?.inVoice || member.streaming?.isStreaming
        );

        const formattedStats = {
          name: stats.name,
          memberCount: stats.memberCount,
          onlineCount: stats.onlineCount,
          icon: stats.icon,
          description: stats.description,
          features: stats.features,
          boostLevel: stats.boostLevel,
          boostCount: stats.boostCount,
          verificationLevel: stats.verificationLevel,
          onlineMembers: onlineMembersWithDetails,
          streamingStats: {
            totalStreaming: streamingUsers.length,
            totalInVoice: voiceUsers.length,
            streamingUsers: streamingUsers.map(user => ({
              id: user.id,
              displayName: user.displayName,
              channelName: user.streaming.channelName,
              streamType: user.streaming.streamType || 'Screen Share'
            }))
          },
          hasRealPresenceData: true,
          lastUpdated: stats.lastUpdated.toISOString(),
          dataSource: 'GATEWAY', // Indicate this is real-time Gateway data
          mostActiveMembers: mostActiveMembers.map(member => ({
            id: member.id,
            username: member.username,
            displayName: member.displayName,
            avatar: member.avatar,
            status: member.status,
            dailyOnlineTime: member.dailyOnlineTime || 0,
            isOnline: member.status !== 'offline'
          })),
        };

        return NextResponse.json(formattedStats);
      }
    }

    // Fallback to REST API if Gateway is not available
    console.log('Discord Gateway not ready, falling back to REST API');

    const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || 'YOUR_SERVER_ID_HERE';
    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

    if (!DISCORD_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      );
    }

    // Fetch server information and members from Discord API
    const [serverResponse, membersResponse] = await Promise.all([
      fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}?with_counts=true`,
        {
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members?limit=1000`,
        {
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      )
    ]);

    if (!serverResponse.ok) {
      throw new Error(`Discord API error: ${serverResponse.status}`);
    }

    const serverData = await serverResponse.json();
    let membersData = [];
    
    // Get members data
    if (membersResponse.ok) {
      membersData = await membersResponse.json();
      console.log(`Fetched ${membersData.length} members from Discord`);
    } else {
      console.log(`Failed to fetch members: ${membersResponse.status}`);
    }

    // Try to get online members using the members endpoint with presence data
    // The standalone /presences endpoint often doesn't work, so we'll try members with presence
    let onlineMembersFromAPI = [];
    try {
      const membersWithPresenceResponse = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members?limit=1000&presence=true`,
        {
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (membersWithPresenceResponse.ok) {
        const membersWithPresence = await membersWithPresenceResponse.json();
        console.log(`Fetched ${membersWithPresence.length} members with presence data`);
        
        // Filter for online members
        onlineMembersFromAPI = membersWithPresence.filter((member: any) =>
          member.presence &&
          member.presence.status &&
          member.presence.status !== 'offline' &&
          !member.user.bot
        );
        
        console.log(`Found ${onlineMembersFromAPI.length} online members from API`);
      } else {
        console.log(`Failed to fetch members with presence: ${membersWithPresenceResponse.status}`);
      }
    } catch (error) {
      console.log('Could not fetch members with presence:', error);
    }

    // Fallback: try the old presences endpoint
    let presencesData = [];
    if (onlineMembersFromAPI.length === 0) {
      try {
        const presencesResponse = await fetch(
          `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/presences`,
          {
            headers: {
              'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (presencesResponse.ok) {
          presencesData = await presencesResponse.json();
          console.log(`Fetched ${presencesData.length} presences from Discord (fallback)`);
        } else {
          console.log(`Failed to fetch presences: ${presencesResponse.status} - ${presencesResponse.statusText}`);
        }
      } catch (error) {
        console.log('Could not fetch presences:', error);
      }
    }

    // Process all server members (no status filtering)
    const allServerMembers = [];
    let hasRealPresenceData = false;
    
    console.log(`Processing all members - API online: ${onlineMembersFromAPI.length}, Regular members: ${membersData.length}, Presences: ${presencesData.length}`);
    
    if (membersData.length > 0) {
      // Show all server members (excluding bots)
      console.log('Displaying all server members');
      
      // Sort members by join date (most recent first) and filter out bots
      const allMembers = membersData
        .filter((member: any) => !member.user.bot)
        .sort((a: any, b: any) => {
          // Sort by joined_at if available, otherwise by user ID (newer IDs = more recent)
          if (a.joined_at && b.joined_at) {
            return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
          }
          return parseInt(b.user.id) - parseInt(a.user.id);
        });

      console.log(`Found ${allMembers.length} non-bot members to display`);

      // Check if we have any presence data to enhance the display
      if (presencesData.length > 0) {
        hasRealPresenceData = true;
        console.log('Enhancing member display with available presence data');
      }

      // Process all members (no status simulation needed)
      for (const member of allMembers) {
        allServerMembers.push({
          id: member.user.id,
          username: member.user.username,
          displayName: member.nick || member.user.global_name || member.user.username,
          avatar: getBestDiscordAvatarUrl(member.user.id, member.user.avatar, member.user.discriminator, 64),
          status: 'unknown', // Not displaying status
          activity: null, // Not displaying activity
          roles: member.roles || [],
          isRealOnline: false,
          joinedAt: member.joined_at
        });
      }
    }

    console.log(`Final result: ${allServerMembers.length} total members displayed (with presence data: ${hasRealPresenceData})`);

    // Format the data for our frontend
    const stats = {
      name: serverData.name,
      memberCount: serverData.approximate_member_count || 0,
      onlineCount: serverData.approximate_presence_count || 0,
      icon: serverData.icon
        ? `https://cdn.discordapp.com/icons/${DISCORD_SERVER_ID}/${serverData.icon}.png`
        : null,
      description: serverData.description || '',
      features: serverData.features || [],
      boostLevel: serverData.premium_tier || 0,
      boostCount: serverData.premium_subscription_count || 0,
      verificationLevel: serverData.verification_level || 0,
      onlineMembers: allServerMembers,
      streamingStats: {
        totalStreaming: 0,
        totalInVoice: 0,
        streamingUsers: []
      },
      hasRealPresenceData: hasRealPresenceData,
      lastUpdated: new Date().toISOString(),
      dataSource: 'REST_API', // Indicate this is fallback data
      mostActiveMembers: [], // No activity tracking for REST API
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching Discord server stats:', error);
    
    // Return fallback data if API fails
    return NextResponse.json({
      name: 'Komplexáci',
      memberCount: 15,
      onlineCount: 3,
      icon: null,
      description: 'Herní komunita v důchodu',
      features: [],
      boostLevel: 0,
      boostCount: 0,
      verificationLevel: 1,
      onlineMembers: [
        {
          id: '1',
          username: 'shaneomac',
          displayName: 'shaneomac',
          avatar: null,
          status: 'online',
          activity: { name: 'Coding the website', type: 0 },
          streaming: null,
          roles: [],
          isRealOnline: false
        },
        {
          id: '2',
          username: 'Barber',
          displayName: 'Barber',
          avatar: null,
          status: 'dnd',
          activity: { name: 'CS2', type: 0 },
          streaming: null,
          roles: [],
          isRealOnline: false
        },
        {
          id: '3',
          username: 'Zander',
          displayName: 'Zander',
          avatar: null,
          status: 'idle',
          activity: null,
          streaming: null,
          roles: [],
          isRealOnline: false
        }
      ],
      streamingStats: {
        totalStreaming: 0,
        totalInVoice: 0,
        streamingUsers: []
      },
      hasRealPresenceData: false,
      lastUpdated: new Date().toISOString(),
      dataSource: 'FALLBACK',
      error: 'Unable to fetch live data - showing fallback stats',
      mostActiveMembers: [], // No activity tracking for fallback
    });
  }
}