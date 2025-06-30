import { NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';

export async function GET() {
  try {
    const gateway = getDiscordGateway();
    
    if (!gateway.isReady()) {
      return NextResponse.json({
        success: false,
        error: 'Discord Gateway not ready'
      });
    }

    const allMembers = gateway.getAllMembers();
    
    // Filter members with activities
    const membersWithActivities = allMembers
      .filter(member => member.activities && member.activities.length > 0)
      .map(member => ({
        id: member.id,
        displayName: member.displayName,
        status: member.status,
        activities: member.activities.map(activity => ({
          name: activity.name,
          type: activity.type,
          details: activity.details,
          state: activity.state,
          timestamps: activity.timestamps
        }))
      }));

    return NextResponse.json({
      success: true,
      totalMembers: allMembers.length,
      membersWithActivities: membersWithActivities.length,
      activities: membersWithActivities
    });
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activities',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}