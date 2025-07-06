import { NextRequest, NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';

export async function GET(request: NextRequest) {
  try {
    const gateway = getDiscordGateway();
    
    if (!gateway.isReady()) {
      return NextResponse.json({
        success: false,
        message: 'Discord gateway not ready'
      });
    }

    const guild = gateway.getGuild();
    if (!guild) {
      return NextResponse.json({
        success: false,
        message: 'Guild not found'
      });
    }

    const members: any[] = [];
    guild.members.cache.forEach(member => {
      try {
        const avatarUrl = member.displayAvatarURL({ size: 64, extension: 'png' });
        members.push({
          id: member.id,
          displayName: member.displayName,
          username: member.user.username,
          avatar: avatarUrl,
          avatarHash: member.avatar,
          hasCustomAvatar: !!member.avatar
        });
      } catch (error) {
        members.push({
          id: member.id,
          displayName: member.displayName,
          username: member.user.username,
          avatar: null,
          avatarHash: null,
          hasCustomAvatar: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    return NextResponse.json({
      success: true,
      members: members.slice(0, 10), // Return first 10 members for debugging
      totalMembers: members.length
    });

  } catch (error) {
    console.error('❌ Error in debug-avatars:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
