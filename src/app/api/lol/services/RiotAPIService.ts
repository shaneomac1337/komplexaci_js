import {
  RiotAccount,
  Summoner,
  LeagueEntry,
  ChampionMastery,
  Match,
  CurrentGameInfo,
  SummonerProfile,
  RiotAPIError
} from '../types/summoner';
import { enrichMatchWithChampionData, enrichMasteryWithChampionData } from '../utils/championUtils';

/**
 * RiotAPIService - Updated for new Riot API endpoints (2025)
 *
 * IMPORTANT: This service has been updated to use the new PUUID-based endpoints:
 * - /lol/league/v4/entries/by-summoner/{encryptedSummonerId} → /lol/league/v4/entries/by-puuid/{encryptedPUUID}
 * - /lol/summoner/v4/summoners/by-account/{encryptedAccountId} → /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}
 * - /tft/league/v1/entries/by-summoner/{summonerId} → /tft/league/v1/entries/by-puuid/{puuid}
 * - /tft/summoner/v1/summoners/by-account/{encryptedAccountId} → /tft/summoner/v1/summoners/by-puuid/{encryptedPUUID}
 * - /tft/summoner/v1/summoners/{encryptedSummonerId} → /tft/summoner/v1/summoners/by-puuid/{encryptedPUUID}
 * - /lol/summoner/v4/summoners/{encryptedSummonerId} → /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}
 */

export class RiotAPIService {
  private apiKey: string;
  private baseUrls = {
    // Regional routing for account-v1 and match-v5
    americas: 'https://americas.api.riotgames.com',
    asia: 'https://asia.api.riotgames.com',
    europe: 'https://europe.api.riotgames.com',
    sea: 'https://sea.api.riotgames.com',
    
    // Platform routing for other APIs
    euw1: 'https://euw1.api.riotgames.com',
    eun1: 'https://eun1.api.riotgames.com',
    na1: 'https://na1.api.riotgames.com',
    kr: 'https://kr.api.riotgames.com',
    jp1: 'https://jp1.api.riotgames.com',
    br1: 'https://br1.api.riotgames.com',
    la1: 'https://la1.api.riotgames.com',
    la2: 'https://la2.api.riotgames.com',
    oc1: 'https://oc1.api.riotgames.com',
    tr1: 'https://tr1.api.riotgames.com',
    ru: 'https://ru.api.riotgames.com'
  };

  constructor() {
    this.apiKey = process.env.RIOT_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('RIOT_API_KEY environment variable is required');
    }
  }

  private getRegionalUrl(region: string): string {
    // Map platform regions to regional clusters
    const regionMapping: Record<string, string> = {
      'euw1': 'europe',
      'eun1': 'europe',
      'tr1': 'europe',
      'ru': 'europe',
      'na1': 'americas',
      'br1': 'americas',
      'la1': 'americas',
      'la2': 'americas',
      'kr': 'asia',
      'jp1': 'asia',
      'oc1': 'sea'
    };
    
    const regionalCluster = regionMapping[region] || 'europe';
    return this.baseUrls[regionalCluster as keyof typeof this.baseUrls];
  }

  private getPlatformUrl(region: string): string {
    return this.baseUrls[region as keyof typeof this.baseUrls] || this.baseUrls.euw1;
  }

  private async makeRequest<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Riot API Error: ${response.status} - ${errorData.status?.message || response.statusText}`);
    }

    return response.json();
  }

  // Get account by Riot ID (gameName#tagLine)
  async getAccountByRiotId(gameName: string, tagLine: string, region: string = 'euw1'): Promise<RiotAccount> {
    const regionalUrl = this.getRegionalUrl(region);

    // Try multiple variations to handle edge cases
    const variations = [
      { name: gameName, tag: tagLine },
      { name: gameName.toLowerCase(), tag: tagLine.toLowerCase() },
      { name: gameName.toLowerCase(), tag: tagLine.toUpperCase() },
      { name: gameName, tag: tagLine.toUpperCase() }
    ];

    for (let i = 0; i < variations.length; i++) {
      const { name, tag } = variations[i];
      const url = `${regionalUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

      console.log(`🔍 Riot API Debug - Attempt ${i + 1}:`, {
        originalGameName: gameName,
        originalTagLine: tagLine,
        tryingGameName: name,
        tryingTagLine: tag,
        region,
        regionalUrl,
        fullUrl: url
      });

      try {
        const result = await this.makeRequest<RiotAccount>(url);
        console.log(`✅ Success on attempt ${i + 1}:`, result);
        return result;
      } catch (error) {
        console.log(`❌ Attempt ${i + 1} failed:`, error instanceof Error ? error.message : error);

        // If this is the last attempt, provide helpful error message
        if (i === variations.length - 1) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Account not found: "${gameName}#${tagLine}". ${errorMessage}. Try checking the spelling or use a different region.`);
        }

        // Wait a bit between attempts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('All account lookup attempts failed');
  }

  // Get account by PUUID
  async getAccountByPuuid(puuid: string, region: string = 'euw1'): Promise<RiotAccount> {
    const regionalUrl = this.getRegionalUrl(region);
    const url = `${regionalUrl}/riot/account/v1/accounts/by-puuid/${puuid}`;
    return this.makeRequest<RiotAccount>(url);
  }

  // Get summoner by PUUID
  async getSummonerByPuuid(puuid: string, region: string = 'euw1'): Promise<Summoner> {
    const platformUrl = this.getPlatformUrl(region);
    const url = `${platformUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return this.makeRequest<Summoner>(url);
  }

  // Get ranked stats by PUUID (updated to new API endpoint)
  async getRankedStats(puuid: string, region: string = 'euw1'): Promise<LeagueEntry[]> {
    const platformUrl = this.getPlatformUrl(region);
    const url = `${platformUrl}/lol/league/v4/entries/by-puuid/${puuid}`;
    return this.makeRequest<LeagueEntry[]>(url);
  }

  // Get champion mastery by PUUID
  async getChampionMastery(puuid: string, region: string = 'euw1', count: number = 10): Promise<ChampionMastery[]> {
    const platformUrl = this.getPlatformUrl(region);
    const url = `${platformUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
    const masteryData = await this.makeRequest<ChampionMastery[]>(url);

    // Enrich with champion data
    const enrichedMastery = await Promise.all(
      masteryData.map(mastery => enrichMasteryWithChampionData(mastery))
    );

    return enrichedMastery;
  }

  // Get match IDs by PUUID
  async getMatchIds(puuid: string, region: string = 'euw1', start: number = 0, count: number = 20): Promise<string[]> {
    const regionalUrl = this.getRegionalUrl(region);
    const url = `${regionalUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
    return this.makeRequest<string[]>(url);
  }

  // Get match details by match ID
  async getMatchDetails(matchId: string, region: string = 'euw1'): Promise<Match> {
    const regionalUrl = this.getRegionalUrl(region);
    const url = `${regionalUrl}/lol/match/v5/matches/${matchId}`;
    return this.makeRequest<Match>(url);
  }

  // Get current game info by PUUID
  async getCurrentGame(puuid: string, region: string = 'euw1'): Promise<CurrentGameInfo | null> {
    try {
      const platformUrl = this.getPlatformUrl(region);
      // Spectator API v5 uses PUUID directly (this endpoint is correct)
      const url = `${platformUrl}/lol/spectator/v5/active-games/by-summoner/${puuid}`;
      const gameInfo = await this.makeRequest<CurrentGameInfo>(url);

      // Enrich with summoner names if they're missing
      if (gameInfo && gameInfo.participants) {
        const enrichedParticipants = await Promise.all(
          gameInfo.participants.map(async (participant) => {
            // If summonerName is missing or is a champion name, fetch it using PUUID
            if (!participant.summonerName || participant.summonerName.length < 3) {
              try {
                const account = await this.getAccountByPuuid(participant.puuid, region);
                return {
                  ...participant,
                  summonerName: account.gameName && account.tagLine ? `${account.gameName}#${account.tagLine}` : `Player${participant.puuid.slice(-4)}`
                };
              } catch (error) {
                console.warn(`Failed to fetch summoner name for PUUID ${participant.puuid}:`, error);
                return participant;
              }
            }
            return participant;
          })
        );

        return {
          ...gameInfo,
          participants: enrichedParticipants
        };
      }

      return gameInfo;
    } catch (error) {
      // 404 means not in game, which is expected
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Get complete summoner profile
  async getSummonerProfile(gameName: string, tagLine: string, region: string = 'euw1'): Promise<SummonerProfile> {
    try {
      // Step 1: Get account by Riot ID
      const account = await this.getAccountByRiotId(gameName, tagLine, region);

      // Step 2: Get summoner details
      const summoner = await this.getSummonerByPuuid(account.puuid, region);

      // Step 3: Get ranked stats (updated to use PUUID)
      const rankedStats = await this.getRankedStats(account.puuid, region);

      // Step 4: Get champion mastery
      const championMastery = await this.getChampionMastery(account.puuid, region, 5);

      // Step 5: Check if in game
      const currentGame = await this.getCurrentGame(account.puuid, region);
      
      return {
        account,
        summoner,
        rankedStats,
        championMastery,
        isInGame: currentGame !== null,
        currentGame: currentGame || undefined
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get summoner profile: ${error.message}`);
      }
      throw error;
    }
  }

  // Get match history with details
  async getMatchHistory(puuid: string, region: string = 'euw1', count: number = 10): Promise<Match[]> {
    try {
      // Get match IDs
      const matchIds = await this.getMatchIds(puuid, region, 0, count);

      // Get match details for each match
      const matchPromises = matchIds.map(matchId => this.getMatchDetails(matchId, region));
      const matches = await Promise.all(matchPromises);

      // Enrich matches with champion data
      const enrichedMatches = await Promise.all(
        matches.map(match => enrichMatchWithChampionData(match))
      );

      return enrichedMatches;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get match history: ${error.message}`);
      }
      throw error;
    }
  }

  // Validate region
  isValidRegion(region: string): boolean {
    const validRegions = ['euw1', 'eun1', 'na1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru'];
    return validRegions.includes(region);
  }

  // TFT (Teamfight Tactics) Methods - Updated to new PUUID-based endpoints

  // Get TFT summoner by PUUID (updated endpoint)
  async getTFTSummonerByPuuid(puuid: string, region: string = 'euw1'): Promise<any> {
    const platformUrl = this.getPlatformUrl(region);
    const url = `${platformUrl}/tft/summoner/v1/summoners/by-puuid/${puuid}`;
    return this.makeRequest<any>(url);
  }

  // Get TFT league entries by PUUID (updated endpoint)
  async getTFTLeagueEntries(puuid: string, region: string = 'euw1'): Promise<any[]> {
    const platformUrl = this.getPlatformUrl(region);
    const url = `${platformUrl}/tft/league/v1/entries/by-puuid/${puuid}`;
    return this.makeRequest<any[]>(url);
  }

  // Parse Riot ID from string (gameName#tagLine)
  static parseRiotId(riotId: string): { gameName: string; tagLine: string } | null {
    // Handle URL-encoded hashtags
    const decodedRiotId = decodeURIComponent(riotId);

    // Try different separators (# is the standard, but handle edge cases)
    let parts: string[] = [];
    if (decodedRiotId.includes('#')) {
      parts = decodedRiotId.split('#');
    } else if (decodedRiotId.includes('-') && decodedRiotId.split('-').length === 2) {
      // Fallback for dash-separated format (like op.gg URLs)
      parts = decodedRiotId.split('-');
    }

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      console.warn('🔍 Failed to parse Riot ID:', {
        original: riotId,
        decoded: decodedRiotId,
        parts: parts
      });
      return null;
    }

    const result = {
      gameName: parts[0].trim(),
      tagLine: parts[1].trim()
    };

    console.log('🔍 Parsed Riot ID:', {
      original: riotId,
      decoded: decodedRiotId,
      result: result
    });

    return result;
  }
}
