import { NextRequest, NextResponse } from 'next/server';
import { RiotAPIService } from '../services/RiotAPIService';

// In-memory cache for live game data
const liveGameCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL_SECONDS = 60; // 1 minute cache for live games
const RATE_LIMIT_CACHE_TTL_SECONDS = 300; // 5 minutes cache when rate limited

// Rate limiting tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests

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

    // Check cache first
    const cached = liveGameCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < cached.ttl * 1000) {
      console.log(`📋 Cache hit for ${memberName} live game status`);
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Cache': 'HIT'
        },
      });
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

    console.log(`🎮 Fetching live game for ${memberName} (${puuid.slice(-8)}...)`);

    try {
      // Get current game info
      const currentGame = await riotService.getCurrentGame(puuid, region);
      
      const result = {
        inGame: !!currentGame,
        gameInfo: currentGame,
        timestamp: Date.now(),
        memberName
      };

      // Cache the result
      liveGameCache.set(cacheKey, {
        data: result,
        timestamp: now,
        ttl: CACHE_TTL_SECONDS
      });

      console.log(`✅ Live game check for ${memberName}: ${result.inGame ? 'IN GAME' : 'NOT IN GAME'}`);

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Cache': 'MISS'
        },
      });

    } catch (error) {
      console.error(`Live Game API Error for ${memberName}:`, error);

      // Handle rate limiting specifically
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`⚠️ Rate limited for ${memberName}, caching empty result`);
        
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
}, 60000); // Clean up every minute
