import { NextRequest, NextResponse } from 'next/server';
import { RiotAPIService } from '../services/RiotAPIService';

// In-memory cache for PUUID lookups (these rarely change)
const puuidCache = new Map<string, { puuid: string; timestamp: number }>();
const CACHE_TTL_HOURS = 24; // Cache PUUIDs for 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riotId = searchParams.get('riotId');
    const region = searchParams.get('region') || 'euw1';

    // Validate required parameters
    if (!riotId) {
      return NextResponse.json(
        { error: 'riotId parameter is required (format: gameName#tagLine)' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `${riotId}-${region}`;
    const now = Date.now();

    // Check cache first (PUUIDs don't change often)
    const cached = puuidCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL_HOURS * 60 * 60 * 1000) {
      console.log(`📋 PUUID cache hit for ${riotId}`);
      return NextResponse.json({ 
        puuid: cached.puuid,
        riotId,
        region,
        cached: true 
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=172800', // 24h cache, 48h stale
          'X-Cache': 'HIT'
        },
      });
    }

    // Parse Riot ID
    const parsedRiotId = RiotAPIService.parseRiotId(riotId);
    if (!parsedRiotId) {
      return NextResponse.json(
        { error: 'Invalid Riot ID format. Use: gameName#tagLine' },
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

    console.log(`🔍 Fetching PUUID for ${riotId}...`);

    try {
      // Get account by Riot ID (minimal call)
      const account = await riotService.getAccountByRiotId(
        parsedRiotId.gameName,
        parsedRiotId.tagLine,
        region
      );

      // Cache the PUUID
      puuidCache.set(cacheKey, {
        puuid: account.puuid,
        timestamp: now
      });

      console.log(`✅ PUUID found for ${riotId}: ${account.puuid.slice(-8)}...`);

      return NextResponse.json({
        puuid: account.puuid,
        riotId,
        region,
        cached: false
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=172800', // 24h cache, 48h stale
          'X-Cache': 'MISS'
        },
      });

    } catch (error) {
      console.error(`PUUID API Error for ${riotId}:`, error);

      // Handle specific Riot API errors
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          return NextResponse.json(
            { error: 'Summoner not found' },
            { status: 404 }
          );
        }
        
        if (error.message.includes('403')) {
          return NextResponse.json(
            { error: 'API key invalid or expired' },
            { status: 403 }
          );
        }

        if (error.message.includes('429')) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }

        if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          return NextResponse.json(
            { error: 'Riot API is currently unavailable. Please try again later.' },
            { status: 503 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to fetch summoner data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PUUID Only API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = CACHE_TTL_HOURS * 60 * 60 * 1000;
  
  for (const [key, value] of puuidCache.entries()) {
    if (now - value.timestamp > maxAge) {
      puuidCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
