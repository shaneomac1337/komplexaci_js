import { NextRequest, NextResponse } from 'next/server';
import { RiotAPIService } from '../services/RiotAPIService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region') || 'euw1';

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

    // Get account by PUUID
    const account = await riotService.getAccountByPuuid(puuid, region);

    return NextResponse.json(account, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Summoner by PUUID API Error:', error);

    // Handle specific Riot API errors
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Account not found' },
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
}
