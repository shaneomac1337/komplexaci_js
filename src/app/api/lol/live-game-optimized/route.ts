import { NextRequest, NextResponse } from 'next/server';
import { RiotAPIService } from '../services/RiotAPIService';

// Debug flag for development
const DEBUG_MODE = process.env.RIOT_API_DEBUG === 'true';

// In-memory cache for live game data
const liveGameCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL_SECONDS = 60; // Increased to 1 minute since we're polling every 2 minutes
const RATE_LIMIT_CACHE_TTL_SECONDS = 300; // 5 minutes cache when rate limited

// Special handling for game end detection  
const GAME_END_DETECTION_TTL = 30; // Increased to 30 seconds - still much faster than old system

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

// Rate limiting tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // Increased from 100ms to 200ms between requests for better rate limiting

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region') || 'euw1';
    const memberName = searchParams.get('memberName') || 'Unknown';

    // Validate required parameters
    if (!puuid) {
      return NextResponse.json(
        { error: 'puuid parameter is required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `${puuid}-${region}`;
    const now = Date.now();

    // Check cache first - but use shorter cache for players who were recently in game
    const cached = liveGameCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < cached.ttl * 1000) {
      // If player was in game, use shorter cache to detect game end faster
      const wasInGame = cached.data.inGame;
      const cacheAge = (now - cached.timestamp) / 1000;

      if (wasInGame && cacheAge > GAME_END_DETECTION_TTL) {
        if (DEBUG_MODE) {
          console.log(`🔄 Player ${memberName} was in game, checking for game end (cache age: ${cacheAge}s)`);
        }
        // Don't use cache, check API directly for game end detection
      } else {
        if (DEBUG_MODE) {
          console.log(`📋 Cache hit for ${memberName} live game status (${wasInGame ? 'IN GAME' : 'NOT IN GAME'})`);
        }
        return NextResponse.json(cached.data, {
          headers: {
            'Cache-Control': `public, max-age=${wasInGame ? GAME_END_DETECTION_TTL : 30}, stale-while-revalidate=60`,
            'X-Cache': 'HIT'
          },
        });
      }
    }

    // Rate limiting protection
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    // Validate region
    const riotService = new RiotAPIService();
    if (!riotService.isValidRegion(region)) {
      return NextResponse.json(
        { error: 'Invalid region. Valid regions: euw1, eun1, na1, kr, jp1, br1, la1, la2, oc1, tr1, ru' },
        { status: 400 }
      );
    }

    if (DEBUG_MODE) {
      console.log(`🎮 Fetching live game for ${memberName} (${puuid.slice(-8)}...)`);
    }

    try {
      // Get current game info
      const currentGame = await riotService.getCurrentGame(puuid, region);

      let isActuallyInGame = false;
      let validatedGameInfo = null;

      if (currentGame) {
        const queueId = currentGame.gameQueueConfigId;
        const queueName = getQueueTypeName(queueId);

        if (DEBUG_MODE) {
          console.log(`🎮 Game detected for ${memberName}: ${queueName} (Queue ID: ${queueId})`);
        }

        // Filter out non-trackable queues (custom games, practice tool, etc.)
        if (!isTrackableQueue(queueId)) {
          if (DEBUG_MODE) {
            console.log(`🚫 Ignoring non-trackable queue for ${memberName}: ${queueName} (Queue ID: ${queueId})`);
          }
          isActuallyInGame = false;
          validatedGameInfo = null;
        } else {
          // Cross-reference with match history to validate if game is actually still active
          // If the game appears in completed matches, it's over (spectator data is stale)
          try {
            if (DEBUG_MODE) {
              console.log(`🔍 Cross-referencing trackable game for ${memberName} (${queueName})...`);
            }

            // Get recent match IDs (last 5 - balanced approach)
            const recentMatchIds = await riotService.getMatchIds(puuid, region, 0, 5);

            // Construct expected match ID format: PLATFORM_GAMEID
            const platformCode = region.toUpperCase();
            const expectedMatchId = `${platformCode}_${currentGame.gameId}`;

            if (DEBUG_MODE) {
              console.log(`🔍 Looking for ${expectedMatchId} in recent matches:`, recentMatchIds);
            }

            // Check if this game appears in completed matches
            const gameFoundInHistory = recentMatchIds.includes(expectedMatchId);

            if (gameFoundInHistory) {
              if (DEBUG_MODE) {
                console.log(`❌ Game ${expectedMatchId} found in match history - game is COMPLETED (spectator data is stale)`);
              }
              isActuallyInGame = false;
              validatedGameInfo = null;
            } else {
              console.log(`✅ Game ${expectedMatchId} NOT in match history - ${queueName} is ACTIVE`);
              
              // Additional validation: Check game duration for potential stale data
              const gameStartTime = currentGame.gameStartTime;
              const gameDurationMinutes = Math.floor((Date.now() - gameStartTime) / 1000 / 60);
              
              // Define reasonable max durations by queue type
              const maxDurations: { [key: number]: number } = {
                450: 35,  // ARAM
                900: 25,  // URF
                1900: 25, // URF
                1700: 20, // Arena
                1020: 40, // One for All
                420: 70,  // Ranked Solo
                440: 70,  // Ranked Flex
                400: 70,  // Normal Draft
                430: 70   // Normal Blind
              };
              
              const maxDuration = maxDurations[queueId] || 70;
              
              if (gameDurationMinutes > maxDuration) {
                console.log(`⚠️ Game duration (${gameDurationMinutes}min) exceeds max for ${queueName} (${maxDuration}min) - likely stale data`);
                isActuallyInGame = false;
                validatedGameInfo = null;
              } else {
                isActuallyInGame = true;
                validatedGameInfo = {
                  ...currentGame,
                  queueTypeName: queueName, // Add human-readable queue name
                  gameDurationMinutes // Add calculated duration for easier debugging
                };
              }
            }

          } catch (matchHistoryError) {
            // Handle PUUID decryption errors gracefully - don't spam logs
            if (matchHistoryError instanceof Error && matchHistoryError.message.includes('decrypting')) {
              console.log(`⚠️ PUUID invalid for ${memberName} - skipping match history check, using duration-based validation`);
              
              // Fall back to duration-based validation only
              const gameStartTime = currentGame.gameStartTime;
              const gameDurationMinutes = Math.floor((Date.now() - gameStartTime) / 1000 / 60);
              
              // Define reasonable max durations by queue type
              const maxDurations: { [key: number]: number } = {
                450: 35,  // ARAM
                900: 25,  // URF
                1900: 25, // URF
                1700: 20, // Arena
                1020: 40, // One for All
                420: 70,  // Ranked Solo
                440: 70,  // Ranked Flex
                400: 70,  // Normal Draft
                430: 70   // Normal Blind
              };
              
              const maxDuration = maxDurations[queueId] || 70;
              
              if (gameDurationMinutes > maxDuration) {
                console.log(`⚠️ Game duration (${gameDurationMinutes}min) exceeds max for ${queueName} (${maxDuration}min) - likely stale data`);
                isActuallyInGame = false;
                validatedGameInfo = null;
              } else {
                isActuallyInGame = true;
                validatedGameInfo = {
                  ...currentGame,
                  queueTypeName: queueName, // Add human-readable queue name
                  gameDurationMinutes // Add calculated duration for easier debugging
                };
              }
            } else {
              // Other errors - log once but don't spam
              console.log(`⚠️ Match history check failed for ${memberName}: ${matchHistoryError instanceof Error ? matchHistoryError.message : 'Unknown error'}`);
              
              // Fallback: assume game is active if we can't check match history
              isActuallyInGame = true;
              validatedGameInfo = {
                ...currentGame,
                queueTypeName: queueName
              };
            }
          }
        }
      }

      const result = {
        inGame: isActuallyInGame,
        gameInfo: validatedGameInfo,
        timestamp: Date.now(),
        memberName,
        validated: true
      };

      // Use different cache TTL based on game status
      const cacheTTL = result.inGame ? GAME_END_DETECTION_TTL : CACHE_TTL_SECONDS;
      const maxAge = result.inGame ? GAME_END_DETECTION_TTL : 30;

      // Cache the result
      liveGameCache.set(cacheKey, {
        data: result,
        timestamp: now,
        ttl: cacheTTL
      });

      if (DEBUG_MODE) {
        console.log(`✅ Live game check for ${memberName}: ${result.inGame ? 'IN GAME' : 'NOT IN GAME'} (validated, cache TTL: ${cacheTTL}s)`);
      }

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=60`,
          'X-Cache': 'MISS'
        },
      });

    } catch (error) {
      if (DEBUG_MODE) {
        console.error(`Live Game API Error for ${memberName}:`, error);
      }

      // Handle rate limiting specifically
      if (error instanceof Error && error.message.includes('429')) {
        if (DEBUG_MODE) {
          console.log(`⚠️ Rate limited for ${memberName}, caching empty result`);
        }
        
        const rateLimitResult = {
          inGame: false,
          gameInfo: null,
          timestamp: Date.now(),
          memberName,
          rateLimited: true
        };

        // Cache rate limit response for longer
        liveGameCache.set(cacheKey, {
          data: rateLimitResult,
          timestamp: now,
          ttl: RATE_LIMIT_CACHE_TTL_SECONDS
        });

        return NextResponse.json(rateLimitResult, {
          status: 200, // Return 200 instead of 429 to avoid client-side errors
          headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
            'X-Rate-Limited': 'true'
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
              memberName 
            },
            { status: 200 }
          );
        }
        
        // Handle decryption errors (invalid/expired PUUIDs)
        if (error.message.includes('decrypting')) {
          if (DEBUG_MODE) {
            console.log(`⚠️ PUUID decryption error for ${memberName} - may need to update PUUID`);
          }
          return NextResponse.json(
            { 
              inGame: false, 
              gameInfo: null, 
              error: 'Player data needs refresh',
              memberName 
            },
            { status: 200 }
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
              memberName 
            },
            { status: 200 }
          );
        }
      }

      return NextResponse.json(
        { 
          inGame: false, 
          gameInfo: null, 
          error: 'Unknown error occurred',
          memberName 
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Live Game Optimized API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of liveGameCache.entries()) {
    if (now - value.timestamp > value.ttl * 1000) {
      liveGameCache.delete(key);
    }
  }
  
  // Also cleanup failed PUUID cache
  RiotAPIService.cleanupFailedPuuidCache();
}, 60000); // Clean up every minute
