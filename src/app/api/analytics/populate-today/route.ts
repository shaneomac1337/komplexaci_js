import { NextRequest, NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';

export async function POST(request: NextRequest) {
  try {
    // Get the Discord Gateway instance and force save current stats
    const gateway = getDiscordGateway();
    const savedCount = gateway.forceSaveDailyStats();

    const today = new Date().toISOString().split('T')[0];

    // Also get current Discord stats to show what was saved
    const response = await fetch('http://localhost:3000/api/discord/server-stats');
    const discordStats = await response.json();

    const activeUsers = discordStats.mostActiveMembers?.filter(m => m.dailyOnlineTime > 0) || [];

    return NextResponse.json({
      success: true,
      message: `✅ Force saved daily snapshots for ${savedCount} users`,
      date: today,
      savedCount,
      savedUsers: activeUsers.map(user => ({
        name: user.displayName,
        minutes: Math.round(user.dailyOnlineTime),
        status: user.status
      }))
    });

  } catch (error) {
    console.error('❌ Manual population failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to populate data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
