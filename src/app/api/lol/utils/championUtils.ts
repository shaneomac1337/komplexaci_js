// Utility functions for champion data mapping

interface ChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface ChampionListResponse {
  type: string;
  format: string;
  version: string;
  data: {
    [key: string]: ChampionData;
  };
}

class ChampionDataService {
  private championCache: Map<number, ChampionData> = new Map();
  private championNameCache: Map<string, ChampionData> = new Map();
  private lastFetch: number = 0;
  private cacheExpiry: number = 3600000; // 1 hour in milliseconds

  async getChampionData(): Promise<Map<number, ChampionData>> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.championCache.size > 0 && (now - this.lastFetch) < this.cacheExpiry) {
      return this.championCache;
    }

    try {
      // Fetch latest version
      const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await versionResponse.json();
      const latestVersion = versions[0];

      // Fetch champion data
      const championResponse = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
      );
      const championData: ChampionListResponse = await championResponse.json();

      // Clear existing cache
      this.championCache.clear();
      this.championNameCache.clear();

      // Populate cache
      Object.values(championData.data).forEach(champion => {
        const championId = parseInt(champion.key);
        this.championCache.set(championId, champion);
        this.championNameCache.set(champion.id.toLowerCase(), champion);
        this.championNameCache.set(champion.name.toLowerCase(), champion);
      });

      this.lastFetch = now;
      return this.championCache;
    } catch (error) {
      console.error('Failed to fetch champion data:', error);
      // Return existing cache if available, even if expired
      return this.championCache;
    }
  }

  async getChampionById(championId: number): Promise<ChampionData | null> {
    const championMap = await this.getChampionData();
    return championMap.get(championId) || null;
  }

  async getChampionByName(championName: string): Promise<ChampionData | null> {
    await this.getChampionData(); // Ensure cache is populated
    return this.championNameCache.get(championName.toLowerCase()) || null;
  }

  async getAllChampions(): Promise<ChampionData[]> {
    const championMap = await this.getChampionData();
    return Array.from(championMap.values());
  }

  getChampionImageUrl(championId: string, version?: string): string {
    const gameVersion = version || '15.10.1'; // Fallback version
    return `https://ddragon.leagueoflegends.com/cdn/${gameVersion}/img/champion/${championId}.png`;
  }

  getChampionSplashUrl(championId: string, skinNum: number = 0): string {
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
  }

  getChampionLoadingUrl(championId: string, skinNum: number = 0): string {
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_${skinNum}.jpg`;
  }
}

// Singleton instance
const championDataService = new ChampionDataService();

export { championDataService, type ChampionData };

// Helper functions for common operations
export async function getChampionName(championId: number): Promise<string> {
  const champion = await championDataService.getChampionById(championId);
  return champion?.name || `Champion ${championId}`;
}

export async function getChampionImage(championId: number, version?: string): Promise<string> {
  const champion = await championDataService.getChampionById(championId);
  if (!champion) return '';
  return championDataService.getChampionImageUrl(champion.id, version);
}

export async function enrichMatchWithChampionData(match: any): Promise<any> {
  // Add champion names and images to match participants
  const enrichedParticipants = await Promise.all(
    match.info.participants.map(async (participant: any) => {
      const championName = await getChampionName(participant.championId);
      const championImage = await getChampionImage(participant.championId);
      
      return {
        ...participant,
        championName,
        championImage
      };
    })
  );

  return {
    ...match,
    info: {
      ...match.info,
      participants: enrichedParticipants
    }
  };
}

export async function enrichMasteryWithChampionData(mastery: any): Promise<any> {
  const championName = await getChampionName(mastery.championId);
  const championImage = await getChampionImage(mastery.championId);
  
  return {
    ...mastery,
    championName,
    championImage
  };
}
