import { NextRequest, NextResponse } from 'next/server';
import { getDiscordGateway } from '@/lib/discord-gateway';

/**
 * Test Daily Reset API
 * 
 * This endpoint allows manual testing of the daily reset functionality.
 * It triggers the daily reset and shows the results.
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing daily reset functionality...');

    const gateway = getDiscordGateway();
    
    if (!gateway.isReady()) {
      return NextResponse.json({
        success: false,
        error: 'Discord Gateway not ready',
        message: 'The Discord Gateway service is not connected. Daily reset requires Discord integration.'
      }, { status: 503 });
    }

    // Trigger the daily reset
    const resetResult = await gateway.triggerDailyReset();

    return NextResponse.json({
      success: true,
      message: 'Daily reset test completed successfully',
      result: resetResult
    });

  } catch (error) {
    console.error('❌ Error testing daily reset:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test daily reset',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const gateway = getDiscordGateway();
    
    // Get current state information
    const stats = gateway.getServerStats();
    const mostActive = gateway.getMostActiveMembers(5);
    
    return NextResponse.json({
      success: true,
      message: 'Daily reset test status',
      data: {
        gatewayReady: gateway.isReady(),
        serverStats: stats ? {
          memberCount: stats.memberCount,
          onlineCount: stats.onlineCount,
          lastUpdated: stats.lastUpdated
        } : null,
        mostActiveMembers: mostActive.map(member => ({
          displayName: member.displayName,
          dailyOnlineTime: member.dailyOnlineTime,
          status: member.status,
          lastSeen: member.lastSeen
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error getting daily reset test status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get test status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}