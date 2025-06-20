import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Discord Server ID (you'll need to replace this with your actual server ID)
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
          avatar: member.user.avatar
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=64`
            : null,
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
      hasRealPresenceData: hasRealPresenceData,
      lastUpdated: new Date().toISOString(),
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
          roles: []
        },
        {
          id: '2',
          username: 'Barber',
          displayName: 'Barber',
          avatar: null,
          status: 'dnd',
          activity: { name: 'CS2', type: 0 },
          roles: []
        },
        {
          id: '3',
          username: 'Zander',
          displayName: 'Zander',
          avatar: null,
          status: 'idle',
          activity: null,
          roles: []
        }
      ],
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch live data - showing fallback stats'
    });
  }
}