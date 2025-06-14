import { NextResponse } from 'next/server';
import { Champion, DataDragonChampionListResponse, Role } from '../../../league-of-legends/types/lol';

// DataDragon API Service
class DataDragonService {
  private baseUrl = 'https://ddragon.leagueoflegends.com';
  private locale = 'cs_CZ';
  private version: string | null = null;

  async getLatestVersion(): Promise<string> {
    if (this.version) return this.version;

    try {
      const response = await fetch(`${this.baseUrl}/api/versions.json`, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const versions = await response.json();
      this.version = versions[0]; // Latest version is first
      return this.version!; // Non-null assertion since we just assigned it
    } catch (error) {
      console.error('Failed to fetch latest version:', error);
      // Fallback to a known version
      this.version = '15.10.1';
      return this.version;
    }
  }

  async getAllChampions(): Promise<Champion[]> {
    try {
      const version = await this.getLatestVersion();
      const url = `${this.baseUrl}/cdn/${version}/data/${this.locale}/champion.json`;
      
      const response = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DataDragonChampionListResponse = await response.json();
      
      // Convert to our format
      const champions = Object.values(data.data).map(champion => ({
        id: champion.id,
        key: champion.key,
        name: champion.name,
        title: champion.title,
        description: champion.blurb,
        splash: `${this.baseUrl}/cdn/img/champion/splash/${champion.id}_0.jpg`,
        square: `${this.baseUrl}/cdn/${version}/img/champion/${champion.id}.png`,
        difficulty: this.mapDifficulty(champion.info.difficulty),
        damage: this.mapDamageType(champion.name, champion.tags),
        survivability: this.mapSurvivability(champion.info.defense),
        roles: this.mapRoles(champion.tags, champion.name),
        rangeType: this.mapRangeType(champion.name, champion.tags),
        championClass: champion.tags[0] || 'Fighter',
        region: this.mapRegion(champion.name)
      }));

      return champions;
    } catch (error) {
      console.error('Failed to fetch champions:', error);
      throw error;
    }
  }

  private mapDifficulty(difficulty: number): 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká' {
    if (difficulty <= 3) return 'Nízká';
    if (difficulty <= 6) return 'Střední';
    if (difficulty <= 8) return 'Vysoká';
    return 'Velmi vysoká';
  }

  private mapDamageType(championName: string, tags: string[]): 'Physical' | 'Magic' | 'Mixed' {
    // Magic damage champions
    const magicDamageChampions = new Set([
      'Ahri', 'Anivia', 'Annie', 'Aurelion Sol', 'Aurora', 'Azir', 'Brand', 'Cassiopeia',
      'Heimerdinger', 'Hwei', 'Kassadin', 'Lissandra', 'Lux', 'Malzahar', 'Neeko',
      'Orianna', 'Ryze', 'Swain', 'Syndra', 'Twisted Fate', 'Veigar', 'Vel\'Koz',
      'Vex', 'Viktor', 'Xerath', 'Ziggs', 'Zoe', 'Akali', 'Diana', 'Ekko', 'Evelynn',
      'Fizz', 'Katarina', 'LeBlanc', 'Sylas', 'Bard', 'Janna', 'Karma', 'Lulu',
      'Milio', 'Morgana', 'Nami', 'Seraphine', 'Sona', 'Soraka', 'Yuumi', 'Zilean',
      'Zyra', 'Amumu', 'Cho\'Gath', 'Dr. Mundo', 'Galio', 'Gragas', 'Maokai',
      'Mordekaiser', 'Rumble', 'Singed', 'Vladimir', 'Volibear', 'Zac'
    ]);

    if (magicDamageChampions.has(championName)) {
      return 'Magic';
    }

    if (tags.includes('Mage')) {
      return 'Magic';
    }
    
    if (tags.includes('Marksman') || tags.includes('Fighter') || tags.includes('Assassin')) {
      return 'Physical';
    }

    return 'Physical';
  }

  private mapSurvivability(defense: number): 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká' {
    if (defense <= 3) return 'Nízká';
    if (defense <= 6) return 'Střední';
    if (defense <= 8) return 'Vysoká';
    return 'Velmi vysoká';
  }

  private mapRoles(tags: string[], championName: string): Role[] {
    // Official champion position mapping from League of Legends Wiki
    // Source: https://leagueoflegends.fandom.com/wiki/List_of_champions_by_draft_position
    // Legend: ✓ = Official Riot position, 3P = Third-party viable position
    const championPositions: Record<string, Role[]> = {
      'Aatrox': ['Top'],
      'Ahri': ['Mid'],
      'Akali': ['Top', 'Mid'],
      'Akshan': ['Mid'],
      'Alistar': ['Support'],
      'Ambessa': ['Mid'],
      'Amumu': ['Jungle', 'Support'],
      'Anivia': ['Mid'],
      'Annie': ['Mid'],
      'Aphelios': ['ADC'],
      'Ashe': ['ADC', 'Support'],
      'Aurelion Sol': ['Mid'],
      'Aurora': ['Top', 'Mid'],
      'Azir': ['Mid'],
      'Bard': ['Support'],
      'Bel\'Veth': ['Jungle'],
      'Blitzcrank': ['Support'],
      'Brand': ['Jungle', 'Mid', 'Support'], // ✓ Jungle, 3P Mid, ✓ Support
      'Braum': ['Support'],
      'Briar': ['Jungle'],
      'Caitlyn': ['ADC'],
      'Camille': ['Top', 'Support'], // ✓ Top, 3P Support
      'Cassiopeia': ['Mid'],
      'Cho\'Gath': ['Top'],
      'Corki': ['Mid'],
      'Darius': ['Top'],
      'Diana': ['Jungle', 'Mid'], // ✓ Jungle, ✓ Mid
      'Dr. Mundo': ['Top'],
      'Draven': ['ADC'],
      'Ekko': ['Jungle', 'Mid'], // ✓ Jungle, ✓ Mid
      'Elise': ['Jungle'],
      'Evelynn': ['Jungle'],
      'Ezreal': ['ADC'],
      'Fiddlesticks': ['Jungle'],
      'Fiora': ['Top'],
      'Fizz': ['Mid'],
      'Galio': ['Mid', 'Support'], // ✓ Mid, 3P Support
      'Gangplank': ['Top'],
      'Garen': ['Top'],
      'Gnar': ['Top'],
      'Gragas': ['Top', 'Jungle', 'Mid'], // 3P Top, ✓ Jungle, 3P Mid
      'Graves': ['Jungle'],
      'Gwen': ['Top'],
      'Hecarim': ['Jungle'],
      'Heimerdinger': ['Top', 'Mid', 'Support'], // 3P Top, 3P Mid, ✓ Support
      'Hwei': ['Mid', 'Support'], // ✓ Mid, ✓ Support
      'Illaoi': ['Top'],
      'Irelia': ['Top', 'Mid'], // ✓ Top, ✓ Mid
      'Ivern': ['Jungle'],
      'Janna': ['Support'],
      'Jarvan IV': ['Jungle'],
      'Jax': ['Top', 'Jungle'], // ✓ Top, ✓ Jungle
      'Jayce': ['Top', 'Mid'], // ✓ Top, 3P Mid
      'Jhin': ['ADC'],
      'Jinx': ['ADC'],
      'K\'Sante': ['Top'],
      'Kai\'Sa': ['ADC'],
      'Kalista': ['ADC'],
      'Karma': ['Top', 'Mid', 'Support'], // 3P Top, ✓ Mid, ✓ Support
      'Karthus': ['Jungle'],
      'Kassadin': ['Mid'],
      'Katarina': ['Mid'],
      'Kayle': ['Top'],
      'Kayn': ['Jungle'],
      'Kennen': ['Top'],
      'Kha\'Zix': ['Jungle'],
      'Kindred': ['Jungle'],
      'Kled': ['Top'],
      'Kog\'Maw': ['ADC'],
      'LeBlanc': ['Mid'],
      'Lee Sin': ['Jungle'],
      'Leona': ['Support'],
      'Lillia': ['Jungle'],
      'Lissandra': ['Mid'],
      'Lucian': ['ADC'],
      'Lulu': ['Support'],
      'Lux': ['Mid', 'Support'], // ✓ Mid, ✓ Support
      'Malphite': ['Top', 'Mid', 'Support'], // ✓ Top, 3P Mid, 3P Support
      'Malzahar': ['Mid'],
      'Maokai': ['Jungle', 'Support'], // 3P Jungle, ✓ Support
      'Master Yi': ['Jungle'],
      'Mel': ['Mid'],
      'Milio': ['Support'],
      'Miss Fortune': ['ADC'],
      'Mordekaiser': ['Top'],
      'Morgana': ['Support'],
      'Naafiri': ['Mid'],
      'Nami': ['Support'],
      'Nasus': ['Top'],
      'Nautilus': ['Support'],
      'Neeko': ['Mid', 'Support'], // ✓ Mid, ✓ Support
      'Nidalee': ['Jungle'],
      'Nilah': ['ADC'],
      'Nocturne': ['Jungle'],
      'Nunu & Willump': ['Jungle'],
      'Olaf': ['Top'],
      'Orianna': ['Mid'],
      'Ornn': ['Top'],
      'Pantheon': ['Top', 'Jungle', 'Mid', 'Support'], // ✓ Top, 3P Jungle, 3P Mid, ✓ Support
      'Poppy': ['Top', 'Jungle'], // ✓ Top, ✓ Jungle
      'Pyke': ['Support'],
      'Qiyana': ['Mid'],
      'Quinn': ['Top'],
      'Rakan': ['Support'],
      'Rammus': ['Jungle'],
      'Rek\'Sai': ['Jungle'],
      'Rell': ['Support'],
      'RenataGlasc': ['Support'],
      'Renekton': ['Top'],
      'Rengar': ['Top', 'Jungle'], // 3P Top, ✓ Jungle
      'Riven': ['Top'],
      'Rumble': ['Top', 'Mid'], // ✓ Top, 3P Mid
      'Ryze': ['Mid'],
      'Samira': ['ADC'],
      'Sejuani': ['Jungle'],
      'Senna': ['ADC', 'Support'], // ✓ ADC, ✓ Support
      'Seraphine': ['ADC', 'Support'], // ✓ ADC, ✓ Support
      'Sett': ['Top'],
      'Shaco': ['Jungle', 'Support'], // ✓ Jungle, 3P Support
      'Shen': ['Top', 'Support'], // ✓ Top, 3P Support
      'Shyvana': ['Jungle'],
      'Singed': ['Top'],
      'Sion': ['Top'],
      'Sivir': ['ADC'],
      'Skarner': ['Top', 'Jungle'], // ✓ Top, ✓ Jungle
      'Smolder': ['Top', 'Mid', 'ADC'], // 3P Top, 3P Mid, ✓ ADC
      'Sona': ['Support'],
      'Soraka': ['Support'],
      'Swain': ['Mid', 'Support'], // 3P Mid, ✓ Support
      'Sylas': ['Top', 'Mid'], // 3P Top, ✓ Mid
      'Syndra': ['Mid'],
      'Tahm Kench': ['Top', 'Support'], // ✓ Top, 3P Support
      'Taliyah': ['Jungle', 'Mid'], // ✓ Jungle, 3P Mid
      'Talon': ['Jungle', 'Mid'], // 3P Jungle, ✓ Mid (Official)
      'Taric': ['Mid', 'Support'], // 3P Mid, ✓ Support
      'Teemo': ['Top', 'Jungle', 'Support'], // ✓ Top, 3P Jungle, 3P Support
      'Thresh': ['Support'],
      'Tristana': ['Mid', 'ADC'], // 3P Mid, ✓ ADC
      'Trundle': ['Top', 'Jungle'], // ✓ Top, 3P Jungle
      'Tryndamere': ['Top'],
      'Twisted Fate': ['Top', 'Mid', 'ADC'], // 3P Top, ✓ Mid, ✓ ADC
      'Twitch': ['ADC', 'Support'], // ✓ ADC, 3P Support
      'Udyr': ['Top', 'Jungle'], // ✓ Top, ✓ Jungle
      'Urgot': ['Top'],
      'Varus': ['ADC'],
      'Vayne': ['Top', 'ADC'], // 3P Top, ✓ ADC
      'Veigar': ['Mid', 'Support'], // ✓ Mid, 3P Support
      'Vel\'Koz': ['Mid', 'Support'], // 3P Mid, ✓ Support
      'Vex': ['Mid'],
      'Vi': ['Jungle'],
      'Viego': ['Jungle'],
      'Viktor': ['Mid'],
      'Vladimir': ['Top', 'Mid'], // 3P Top, ✓ Mid
      'Volibear': ['Top', 'Jungle'], // ✓ Top, 3P Jungle
      'Warwick': ['Top', 'Jungle'], // 3P Top, ✓ Jungle
      'MonkeyKing': ['Top', 'Jungle'], // 3P Top, ✓ Jungle
      'Xayah': ['ADC'],
      'Xerath': ['Mid', 'Support'], // ✓ Mid, ✓ Support
      'Xin Zhao': ['Jungle'],
      'Yasuo': ['Top', 'Mid', 'ADC'], // ✓ Top, ✓ Mid, ✓ ADC
      'Yone': ['Top', 'Mid'], // ✓ Top, ✓ Mid
      'Yorick': ['Top'],
      'Yuumi': ['Support'],
      'Zac': ['Top', 'Jungle', 'Support'], // 3P Top, ✓ Jungle, 3P Support
      'Zed': ['Jungle', 'Mid'], // 3P Jungle, ✓ Mid
      'Zeri': ['ADC'],
      'Ziggs': ['Mid', 'ADC'], // 3P Mid, ✓ ADC
      'Zilean': ['Support'],
      'Zoe': ['Mid'],
      'Zyra': ['Support']
    };

    if (championPositions[championName]) {
      return championPositions[championName];
    }

    // Fallback to class-based mapping
    const roleMapping: Record<string, Role[]> = {
      'Fighter': ['Top'],
      'Tank': ['Top'],
      'Mage': ['Mid'],
      'Assassin': ['Mid'],
      'Marksman': ['ADC'],
      'Support': ['Support']
    };

    const roles: Role[] = [];
    tags.forEach(tag => {
      if (roleMapping[tag]) {
        roleMapping[tag].forEach(role => {
          if (!roles.includes(role)) {
            roles.push(role);
          }
        });
      }
    });

    return roles.length > 0 ? roles : ['Top'];
  }

  private mapRangeType(championName: string, tags: string[]): 'Melee' | 'Ranged' {
    const rangedChampions = new Set([
      'Aphelios', 'Ashe', 'Caitlyn', 'Corki', 'Draven', 'Ezreal', 'Jhin', 'Jinx',
      'Kai\'Sa', 'Kalista', 'Kog\'Maw', 'Lucian', 'Miss Fortune', 'Nilah', 'Samira',
      'Sivir', 'Smolder', 'Tristana', 'Twitch', 'Varus', 'Vayne', 'Xayah', 'Zeri',
      'Ahri', 'Anivia', 'Annie', 'Aurelion Sol', 'Aurora', 'Azir', 'Brand', 'Cassiopeia',
      'Heimerdinger', 'Hwei', 'Kassadin', 'Lissandra', 'Lux', 'Malzahar', 'Neeko',
      'Orianna', 'Ryze', 'Swain', 'Syndra', 'Twisted Fate', 'Veigar', 'Vel\'Koz',
      'Vex', 'Viktor', 'Xerath', 'Ziggs', 'Zoe', 'Bard', 'Janna', 'Karma', 'Lulu',
      'Milio', 'Morgana', 'Nami', 'Renata Glasc', 'Senna', 'Seraphine', 'Sona',
      'Soraka', 'Yuumi', 'Zilean', 'Zyra', 'Graves', 'Jayce', 'Kayle', 'Kennen',
      'Kindred', 'Nidalee', 'Quinn', 'Rumble', 'Teemo', 'Urgot', 'Vladimir'
    ]);

    if (rangedChampions.has(championName)) {
      return 'Ranged';
    }

    if (tags.includes('Marksman') || tags.includes('Mage')) {
      return 'Ranged';
    }

    return 'Melee';
  }

  private mapRegion(championName: string): string {
    // Simplified region mapping - you can expand this
    const championRegions: Record<string, string> = {
      'Garen': 'Demacia',
      'Darius': 'Noxus',
      'Ashe': 'Freljord',
      'Ahri': 'Ionia',
      'Jinx': 'Zaun',
      'Vi': 'Piltover',
      // Add more mappings as needed
    };

    return championRegions[championName] || 'Runeterra';
  }
}

const datadragonService = new DataDragonService();

export async function GET() {
  try {
    const champions = await datadragonService.getAllChampions();
    
    return NextResponse.json(champions, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch champions' },
      { status: 500 }
    );
  }
}
