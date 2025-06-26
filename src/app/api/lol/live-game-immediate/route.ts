import { NextRequest, NextResponse } from 'next/server';
import { RiotAPIService } from '../services/RiotAPIService';

// Excluded queue types (blacklist approach - only exclude what causes problems)
// Custom games (0) are the main source of stale data issues
const EXCLUDED_QUEUE_IDS = new Set([
  0, // Custom games / Practice Tool - causes stale data issues
  // Note: We now track ALL other modes including rotating game modes
]);

// Helper function to check if a queue is trackable
const isTrackableQueue = (queueId: number): boolean => {
  return !EXCLUDED_QUEUE_IDS.has(queueId);
};

// Helper function to get queue type name
const getQueueTypeName = (queueId: number): string => {
  const queueNames: { [key: number]: string } = {
    // Ranked Queues
    420: 'Ranked Solo/Duo',
    440: 'Ranked Flex',

    // Normal Queues
    400: 'Normal Draft',
    430: 'Normal Blind',
    490: 'Normal Quickplay',

    // Special Queues
    450: 'ARAM',
    700: 'Clash',

    // Rotating Game Modes (common ones)
    900: 'URF',
    1010: 'Snow URF',
    1020: 'One for All',
    1200: 'Nexus Blitz',
    1300: 'Nexus Blitz',
    1400: 'Ultimate Spellbook',
    1700: 'Arena',
    1900: 'URF',

    // Custom/Practice (excluded but for display)
    0: 'Custom Game',

    // Co-op vs AI
    830: 'Co-op vs AI (Intro)',
    840: 'Co-op vs AI (Beginner)',
    850: 'Co-op vs AI (Intermediate)',
  };

  // If we don't have a specific name, try to categorize by range
  if (!queueNames[queueId]) {
    if (queueId >= 1700 && queueId <= 1799) return 'Arena';
    if (queueId >= 1400 && queueId <= 1499) return 'Ultimate Spellbook';
    if (queueId >= 1200 && queueId <= 1399) return 'Nexus Blitz';
    if (queueId >= 1000 && queueId <= 1099) return 'Rotating Game Mode';
    if (queueId >= 900 && queueId <= 999) return 'URF';
    if (queueId >= 800 && queueId <= 899) return 'Co-op vs AI';
    if (queueId >= 700 && queueId <= 799) return 'Tournament';
  }

  return queueNames[queueId] || `Game Mode ${queueId}`;
};

/**
 * Immediate live game check endpoint - bypasses all caching for real-time game end detection
 * Use this when you need to immediately check if a game has ended
 * Updated with match history cross-reference validation
 */

export async function GET(request: NextRequest) {
  console.log(`🔴 IMMEDIATE ENDPOINT CALLED for ${request.url}`);
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region') || 'euw1';
    const memberName = searchParams.get('memberName') || 'Unknown';

    console.log(`🔴 IMMEDIATE PARAMS: puuid=${puuid?.slice(-8)}..., region=${region}, memberName=${memberName}`);

    // Validate required parameters
    if (!puuid) {
      return NextResponse.json(
        { error: 'puuid parameter is required' },
        { status: 400 }
      );
    }

    // Validate region
    const riotService = new RiotAPIService();
    if (!riotService.isValidRegion(region)) {
      return NextResponse.json(
        { error: 'Invalid region. Valid regions: euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru' },
        { status: 400 }
      );
    }

    console.log(`🔴 IMMEDIATE live game check for ${memberName} (${puuid.slice(-8)}...)`);

    try {
      // Get current game info - NO CACHING, direct API call
      const currentGame = await riotService.getCurrentGame(puuid, region);

      let isActuallyInGame = false;
      let validatedGameInfo = null;

      if (currentGame) {
        const queueId = currentGame.gameQueueConfigId;
        const queueName = getQueueTypeName(queueId);

        console.log(`🔴 IMMEDIATE: Game detected for ${memberName}: ${queueName} (Queue ID: ${queueId})`);

        // Filter out non-trackable queues (custom games, practice tool, etc.)
        if (!isTrackableQueue(queueId)) {
          console.log(`🚫 IMMEDIATE: Ignoring non-trackable queue for ${memberName}: ${queueName} (Queue ID: ${queueId})`);
          isActuallyInGame = false;
          validatedGameInfo = null;
        } else {
          // Cross-reference with match history to validate if game is actually still active
          // If the game appears in completed matches, it's over (spectator data is stale)
          try {
            console.log(`🔴 IMMEDIATE: Cross-referencing trackable game for ${memberName} (${queueName})...`);

            // Get recent match IDs (last 5)
            const recentMatchIds = await riotService.getMatchIds(puuid, region, 0, 5);

            // Construct expected match ID format: PLATFORM_GAMEID
            const platformCode = region.toUpperCase();
            const expectedMatchId = `${platformCode}_${currentGame.gameId}`;

            console.log(`🔴 IMMEDIATE: Looking for ${expectedMatchId} in recent matches:`, recentMatchIds);

            // Check if this game appears in completed matches
            const gameFoundInHistory = recentMatchIds.includes(expectedMatchId);

            if (gameFoundInHistory) {
              console.log(`❌ IMMEDIATE: Game ${expectedMatchId} found in match history - game is COMPLETED (spectator data is stale)`);
              isActuallyInGame = false;
              validatedGameInfo = null;
            } else {
              console.log(`✅ IMMEDIATE: Game ${expectedMatchId} NOT in match history - ${queueName} is ACTIVE`);
              isActuallyInGame = true;
              validatedGameInfo = {
                ...currentGame,
                queueTypeName: queueName // Add human-readable queue name
              };
            }

          } catch (matchHistoryError) {
            console.error(`⚠️ IMMEDIATE: Could not validate with match history for ${memberName}:`, matchHistoryError);
            // Fallback: assume game is active if we can't check match history
            console.log(`⚠️ IMMEDIATE: Fallback: assuming ${queueName} is active for ${memberName}`);
            isActuallyInGame = true;
            validatedGameInfo = {
              ...currentGame,
              queueTypeName: queueName
            };
          }
        }
      } else {
        console.log(`✅ IMMEDIATE: No spectator data for ${memberName} - not in game`);
      }

      const result = {
        inGame: isActuallyInGame,
        gameInfo: validatedGameInfo,
        timestamp: Date.now(),
        memberName,
        immediate: true, // Flag to indicate this was an immediate check
        validated: true // Flag to indicate this data was validated
      };

      console.log(`🔴 IMMEDIATE check for ${memberName}: ${result.inGame ? 'IN GAME' : 'NOT IN GAME'} (validated)`);

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Immediate-Check': 'true'
        },
      });

    } catch (error) {
      console.error(`Immediate Live Game API Error for ${memberName}:`, error);

      // Handle rate limiting specifically
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`⚠️ Rate limited for immediate check of ${memberName}`);
        
        return NextResponse.json({
          inGame: false,
          gameInfo: null,
          timestamp: Date.now(),
          memberName,
          rateLimited: true,
          immediate: true
        }, {
          status: 200,
          headers: {
            'X-Rate-Limited': 'true',
            'Cache-Control': 'no-cache'
          },
        });
      }

      // Handle other errors
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          return NextResponse.json(
            { 
              inGame: false, 
              gameInfo: null, 
              error: 'Player not in game',
              memberName,
              immediate: true
            },
            { 
              status: 200,
              headers: {
                'Cache-Control': 'no-cache'
              }
            }
          );
        }
        
        if (error.message.includes('403')) {
          return NextResponse.json(
            { error: 'API key invalid or expired' },
            { status: 403 }
          );
        }

        if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          return NextResponse.json(
            { 
              inGame: false, 
              gameInfo: null, 
              error: 'Riot API temporarily unavailable',
              memberName,
              immediate: true
            },
            { 
              status: 200,
              headers: {
                'Cache-Control': 'no-cache'
              }
            }
          );
        }
      }

      return NextResponse.json(
        { 
          inGame: false, 
          gameInfo: null, 
          error: 'Unknown error occurred',
          memberName,
          immediate: true
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

  } catch (error) {
    console.error('Immediate Live Game API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
