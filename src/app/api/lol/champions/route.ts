import { NextResponse } from 'next/server';
import { Champion, DataDragonChampionListResponse, Role } from '../../../league-of-legends/types/lol';

// DataDragon API Service
class DataDragonService {
  private baseUrl = 'https://ddragon.leagueoflegends.com';
  private defaultLocale = 'cs_CZ';
  private defaultVersion = '15.10.1';
  private cachedVersion: string | null = null;

  async getLatestVersion(): Promise<string> {
    if (this.cachedVersion) return this.cachedVersion;

    try {
      const response = await fetch(`${this.baseUrl}/api/versions.json`, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const versions = await response.json();
      this.cachedVersion = versions[0]; // Latest version is first
      return this.cachedVersion!; // Non-null assertion since we just assigned it
    } catch (error) {
      console.error('Failed to fetch latest version:', error);
      // Fallback to a known version
      this.cachedVersion = this.defaultVersion;
      return this.cachedVersion;
    }
  }

  async getAllChampions(locale?: string, version?: string): Promise<Champion[]> {
    try {
      const apiVersion = version || await this.getLatestVersion();
      const apiLocale = locale || this.defaultLocale;
      const url = `${this.baseUrl}/cdn/${apiVersion}/data/${apiLocale}/champion.json`;
      
      const response = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DataDragonChampionListResponse = await response.json();
      
      // Convert to our format
      const champions = Object.values(data.data).map(champion => {
        // Transform champion name for display (e.g., MonkeyKing -> Wukong)
        const displayName = this.getDisplayName(champion.name);

        return {
          id: champion.id,
          key: champion.key,
          name: displayName,
          title: champion.title,
          description: champion.blurb,
          splash: `${this.baseUrl}/cdn/img/champion/splash/${champion.id}_0.jpg`,
          square: `${this.baseUrl}/cdn/${apiVersion}/img/champion/${champion.id}.png`,
          difficulty: this.mapDifficulty(champion.info.difficulty),
          damage: this.mapDamageType(champion.name, champion.tags, champion.info),
          survivability: this.mapSurvivability(champion.info.defense),
          roles: this.mapRoles(champion.tags, champion.name, champion.id),
          rangeType: this.mapRangeType(displayName, champion.tags),
          championClass: champion.tags[0] || 'Fighter',
          region: this.mapRegion(displayName)
        };
      });

      return champions;
    } catch (error) {
      console.error('Failed to fetch champions:', error);
      throw error;
    }
  }

  private getDisplayName(originalName: string): string {
    // Transform DataDragon names to preferred display names
    const displayNameMap: Record<string, string> = {
      'MonkeyKing': 'Wukong',
      'RenataGlasc': 'Renata Glasc',
      // Add other name transformations as needed
    };

    return displayNameMap[originalName] || originalName;
  }

  private mapDifficulty(difficulty: number): 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká' {
    if (difficulty <= 3) return 'Nízká';
    if (difficulty <= 6) return 'Střední';
    if (difficulty <= 8) return 'Vysoká';
    return 'Velmi vysoká';
  }

  private mapDamageType(championName: string, tags: string[], info: any): 'Physical' | 'Magic' {
    // Use API data to determine damage type
    // info.attack = physical damage rating (0-10)
    // info.magic = magic damage rating (0-10)
    
    if (info.attack > info.magic) {
      return 'Physical';
    } else if (info.magic > info.attack) {
      return 'Magic';
    }
    
    // If equal, fall back to tag-based detection
    if (tags.includes('Marksman') || tags.includes('Fighter') || tags.includes('Assassin')) {
      return 'Physical';
    }
    
    if (tags.includes('Mage')) {
      return 'Magic';
    }

    // Default to Physical for ambiguous cases
    return 'Physical';
  }

  private mapSurvivability(defense: number): 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká' {
    if (defense <= 3) return 'Nízká';
    if (defense <= 6) return 'Střední';
    if (defense <= 8) return 'Vysoká';
    return 'Velmi vysoká';
  }

  private mapRoles(tags: string[], championName: string, championId?: string): Role[] {
    // Official champion position mapping from League of Legends Wiki
    // Source: https://leagueoflegends.fandom.com/wiki/List_of_champions_by_draft_position
    // Legend: ✓ = Official Riot position, 3P = Third-party viable position
    const championPositions: Record<string, Role[]> = {
      'Aatrox': ['TOP'],
      'Ahri': ['MID'],
      'Akali': ['TOP', 'MID'],
      'Akshan': ['MID'],
      'Alistar': ['SUPPORT'],
      'Ambessa': ['MID'],
      'Amumu': ['JUNGLE', 'SUPPORT'],
      'Anivia': ['MID'],
      'Annie': ['MID'],
      'Aphelios': ['ADC'],
      'Ashe': ['ADC', 'SUPPORT'],
      'Aurelion Sol': ['MID'],
      'Aurora': ['TOP', 'MID'],
      'Azir': ['MID'],
      'Bard': ['SUPPORT'],
      'Bel\'Veth': ['JUNGLE'],
      'Blitzcrank': ['SUPPORT'],
      'Brand': ['JUNGLE', 'MID', 'SUPPORT'], // ✓ Jungle, 3P Mid, ✓ Support
      'Braum': ['SUPPORT'],
      'Briar': ['JUNGLE'],
      'Caitlyn': ['ADC'],
      'Camille': ['TOP', 'SUPPORT'], // ✓ Top, 3P Support
      'Cassiopeia': ['MID'],
      'Cho\'Gath': ['TOP'],
      'Corki': ['MID'],
      'Darius': ['TOP'],
      'Diana': ['JUNGLE', 'MID'], // ✓ Jungle, ✓ Mid
      'Dr. Mundo': ['TOP'],
      'Draven': ['ADC'],
      'Ekko': ['JUNGLE', 'MID'], // ✓ Jungle, ✓ Mid
      'Elise': ['JUNGLE'],
      'Evelynn': ['JUNGLE'],
      'Ezreal': ['ADC'],
      'Fiddlesticks': ['JUNGLE'],
      'Fiora': ['TOP'],
      'Fizz': ['MID'],
      'Galio': ['MID', 'SUPPORT'], // ✓ Mid, 3P Support
      'Gangplank': ['TOP'],
      'Garen': ['TOP'],
      'Gnar': ['TOP'],
      'Gragas': ['TOP', 'JUNGLE', 'MID'], // 3P Top, ✓ Jungle, 3P Mid
      'Graves': ['JUNGLE'],
      'Gwen': ['TOP'],
      'Hecarim': ['JUNGLE'],
      'Heimerdinger': ['TOP', 'MID', 'SUPPORT'], // 3P Top, 3P Mid, ✓ Support
      'Hwei': ['MID', 'SUPPORT'], // ✓ Mid, ✓ Support
      'Illaoi': ['TOP'],
      'Irelia': ['TOP', 'MID'], // ✓ Top, ✓ Mid
      'Ivern': ['JUNGLE'],
      'Janna': ['SUPPORT'],
      'Jarvan IV': ['JUNGLE'],
      'Jax': ['TOP', 'JUNGLE'], // ✓ Top, ✓ Jungle
      'Jayce': ['TOP', 'MID'], // ✓ Top, 3P Mid
      'Jhin': ['ADC'],
      'Jinx': ['ADC'],
      'K\'Sante': ['TOP'],
      'Kai\'Sa': ['ADC'],
      'Kalista': ['ADC'],
      'Karma': ['TOP', 'MID', 'SUPPORT'], // 3P Top, ✓ Mid, ✓ Support
      'Karthus': ['JUNGLE'],
      'Kassadin': ['MID'],
      'Katarina': ['MID'],
      'Kayle': ['TOP'],
      'Kayn': ['JUNGLE'],
      'Kennen': ['TOP'],
      'Kha\'Zix': ['JUNGLE'],
      'Kindred': ['JUNGLE'],
      'Kled': ['TOP'],
      'Kog\'Maw': ['ADC'],
      'LeBlanc': ['MID'],
      'Lee Sin': ['JUNGLE'],
      'Leona': ['SUPPORT'],
      'Lillia': ['JUNGLE'],
      'Lissandra': ['MID'],
      'Lucian': ['ADC'],
      'Lulu': ['SUPPORT'],
      'Lux': ['MID', 'SUPPORT'], // ✓ Mid, ✓ Support
      'Malphite': ['TOP', 'MID', 'SUPPORT'], // ✓ Top, 3P Mid, 3P Support
      'Malzahar': ['MID'],
      'Maokai': ['JUNGLE', 'SUPPORT'], // 3P Jungle, ✓ Support
      'Master Yi': ['JUNGLE'],
      'Mel': ['MID'],
      'Milio': ['SUPPORT'],
      'Miss Fortune': ['ADC'],
      'Mordekaiser': ['TOP'],
      'Morgana': ['SUPPORT'],
      'Naafiri': ['MID'],
      'Nami': ['SUPPORT'],
      'Nasus': ['TOP'],
      'Nautilus': ['SUPPORT'],
      'Neeko': ['MID', 'SUPPORT'], // ✓ Mid, ✓ Support
      'Nidalee': ['JUNGLE'],
      'Nilah': ['ADC'],
      'Nocturne': ['JUNGLE'],
      'Nunu & Willump': ['JUNGLE'],
      'Nunu': ['JUNGLE'], // Alternative name
      'Olaf': ['TOP'],
      'Orianna': ['MID'],
      'Ornn': ['TOP'],
      'Pantheon': ['TOP', 'JUNGLE', 'MID', 'SUPPORT'], // ✓ Top, 3P Jungle, 3P Mid, ✓ Support
      'Poppy': ['TOP', 'JUNGLE'], // ✓ Top, ✓ Jungle
      'Pyke': ['SUPPORT'],
      'Qiyana': ['MID'],
      'Quinn': ['TOP'],
      'Rakan': ['SUPPORT'],
      'Rammus': ['JUNGLE'],
      'Rek\'Sai': ['JUNGLE'],
      'Rell': ['SUPPORT'],
      'RenataGlasc': ['SUPPORT'],
      'Renekton': ['TOP'],
      'Rengar': ['TOP', 'JUNGLE'], // 3P Top, ✓ Jungle
      'Riven': ['TOP'],
      'Rumble': ['TOP', 'MID'], // ✓ Top, 3P Mid
      'Ryze': ['MID'],
      'Samira': ['ADC'],
      'Sejuani': ['JUNGLE'],
      'Senna': ['ADC', 'SUPPORT'], // ✓ ADC, ✓ Support
      'Seraphine': ['ADC', 'SUPPORT'], // ✓ ADC, ✓ Support
      'Sett': ['TOP'],
      'Shaco': ['JUNGLE', 'SUPPORT'], // ✓ Jungle, 3P Support
      'Shen': ['TOP', 'SUPPORT'], // ✓ Top, 3P Support
      'Shyvana': ['JUNGLE'],
      'Singed': ['TOP'],
      'Sion': ['TOP'],
      'Sivir': ['ADC'],
      'Skarner': ['TOP', 'JUNGLE'], // ✓ Top, ✓ Jungle
      'Smolder': ['TOP', 'MID', 'ADC'], // 3P Top, 3P Mid, ✓ ADC
      'Sona': ['SUPPORT'],
      'Soraka': ['SUPPORT'],
      'Swain': ['MID', 'SUPPORT'], // 3P Mid, ✓ Support
      'Sylas': ['TOP', 'MID'], // 3P Top, ✓ Mid
      'Syndra': ['MID'],
      'Tahm Kench': ['TOP', 'SUPPORT'], // ✓ Top, 3P Support
      'Taliyah': ['JUNGLE', 'MID'], // ✓ Jungle, 3P Mid
      'Talon': ['JUNGLE', 'MID'], // 3P Jungle, ✓ Mid (Official)
      'Taric': ['MID', 'SUPPORT'], // 3P Mid, ✓ Support
      'Teemo': ['TOP', 'JUNGLE', 'SUPPORT'], // ✓ Top, 3P Jungle, 3P Support
      'Thresh': ['SUPPORT'],
      'Tristana': ['MID', 'ADC'], // 3P Mid, ✓ ADC
      'Trundle': ['TOP', 'JUNGLE'], // ✓ Top, 3P Jungle
      'Tryndamere': ['TOP'],
      'Twisted Fate': ['TOP', 'MID', 'ADC'], // 3P Top, ✓ Mid, ✓ ADC
      'Twitch': ['ADC', 'SUPPORT'], // ✓ ADC, 3P Support
      'Udyr': ['TOP', 'JUNGLE'], // ✓ Top, ✓ Jungle
      'Urgot': ['TOP'],
      'Varus': ['ADC'],
      'Vayne': ['TOP', 'ADC'], // 3P Top, ✓ ADC
      'Veigar': ['MID', 'SUPPORT'], // ✓ Mid, 3P Support
      'Vel\'Koz': ['MID', 'SUPPORT'], // 3P Mid, ✓ Support
      'Vex': ['MID'],
      'Vi': ['JUNGLE'],
      'Viego': ['JUNGLE'],
      'Viktor': ['MID'],
      'Vladimir': ['TOP', 'MID'], // 3P Top, ✓ Mid
      'Volibear': ['TOP', 'JUNGLE'], // ✓ Top, 3P Jungle
      'Warwick': ['TOP', 'JUNGLE'], // 3P Top, ✓ Jungle
      'Wukong': ['TOP', 'JUNGLE'], // Alternative name for MonkeyKing
      'Xayah': ['ADC'],
      'Xerath': ['MID', 'SUPPORT'], // ✓ Mid, ✓ Support
      'Xin Zhao': ['JUNGLE'],
      'Yasuo': ['TOP', 'MID', 'ADC'], // ✓ Top, ✓ Mid, ✓ ADC
      'Yone': ['TOP', 'MID'], // ✓ Top, ✓ Mid
      'Yorick': ['TOP'],
      'Yuumi': ['SUPPORT'],
      'Zac': ['TOP', 'JUNGLE', 'SUPPORT'], // 3P Top, ✓ Jungle, 3P Support
      'Zed': ['JUNGLE', 'MID'], // 3P Jungle, ✓ Mid
      'Zeri': ['ADC'],
      'Ziggs': ['MID', 'ADC'], // 3P Mid, ✓ ADC
      'Zilean': ['SUPPORT'],
      'Zoe': ['MID'],
      'Zyra': ['SUPPORT']
    };

    // Handle name variations and aliases
    const nameAliases: Record<string, string> = {
      'Nunu': 'Nunu & Willump',
      'MonkeyKing': 'Wukong', // DataDragon uses MonkeyKing, we want to display as Wukong
      'Renata Glasc': 'RenataGlasc',
      'Cho\'Gath': 'Cho\'Gath',
      'Dr. Mundo': 'Dr. Mundo',
      'Kai\'Sa': 'Kai\'Sa',
      'Kha\'Zix': 'Kha\'Zix',
      'Kog\'Maw': 'Kog\'Maw',
      'Rek\'Sai': 'Rek\'Sai',
      'Vel\'Koz': 'Vel\'Koz',
      'Bel\'Veth': 'Bel\'Veth'
    };

    // ID-based aliases (for cases where ID differs from display name)
    const idAliases: Record<string, string> = {
      'Nunu': 'Nunu & Willump',
      'MonkeyKing': 'Wukong', // Wukong's internal ID maps to display name
      'RenataGlasc': 'RenataGlasc'
    };

    // Try multiple lookup strategies
    let lookupName = championName;

    // 1. Try original name
    if (championPositions[championName]) {
      return championPositions[championName];
    }

    // 2. Try name aliases
    if (nameAliases[championName]) {
      lookupName = nameAliases[championName];
      if (championPositions[lookupName]) {
        return championPositions[lookupName];
      }
    }

    // 3. Try champion ID if provided
    if (championId && idAliases[championId]) {
      lookupName = idAliases[championId];
      if (championPositions[lookupName]) {
        return championPositions[lookupName];
      }
    }

    // 4. Try champion ID directly
    if (championId && championPositions[championId]) {
      return championPositions[championId];
    }

    // Debug: Log missing champions (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Missing role mapping for champion: "${championName}" (ID: "${championId}")`);
    }

    // Fallback to class-based mapping
    const roleMapping: Record<string, Role[]> = {
      'Fighter': ['TOP'],
      'Tank': ['TOP'],
      'Mage': ['MID'],
      'Assassin': ['MID'],
      'Marksman': ['ADC'],
      'Support': ['SUPPORT']
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

    return roles.length > 0 ? roles : ['TOP'];
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
    // Official region mapping from League of Legends Universe
    const championRegions: Record<string, string> = {
      // Bandle City
      'Corki': 'Bandle City', 'Lulu': 'Bandle City', 'Rumble': 'Bandle City', 'Teemo': 'Bandle City',
      'Tristana': 'Bandle City', 'Veigar': 'Bandle City', 'Yuumi': 'Bandle City',

      // Bilgewater
      'Fizz': 'Bilgewater', 'Gangplank': 'Bilgewater', 'Graves': 'Bilgewater', 'Illaoi': 'Bilgewater',
      'Miss Fortune': 'Bilgewater', 'Nautilus': 'Bilgewater', 'Nilah': 'Bilgewater', 'Pyke': 'Bilgewater',
      'Tahm Kench': 'Bilgewater', 'Twisted Fate': 'Bilgewater',

      // Demacia
      'Fiora': 'Demacia', 'Galio': 'Demacia', 'Garen': 'Demacia', 'Jarvan IV': 'Demacia',
      'Kayle': 'Demacia', 'Lucian': 'Demacia', 'Lux': 'Demacia', 'Morgana': 'Demacia',
      'Poppy': 'Demacia', 'Quinn': 'Demacia', 'Shyvana': 'Demacia', 'Sona': 'Demacia',
      'Sylas': 'Demacia', 'Vayne': 'Demacia', 'Xin Zhao': 'Demacia',

      // Freljord
      'Anivia': 'Freljord', 'Ashe': 'Freljord', 'Aurora': 'Freljord', 'Braum': 'Freljord',
      'Gnar': 'Freljord', 'Gragas': 'Freljord', 'Lissandra': 'Freljord', 'Nunu & Willump': 'Freljord',
      'Nunu': 'Freljord', 'Olaf': 'Freljord', 'Ornn': 'Freljord', 'Sejuani': 'Freljord',
      'Trundle': 'Freljord', 'Tryndamere': 'Freljord', 'Udyr': 'Freljord', 'Volibear': 'Freljord',

      // Ionia
      'Ahri': 'Ionia', 'Akali': 'Ionia', 'Hwei': 'Ionia', 'Irelia': 'Ionia', 'Ivern': 'Ionia',
      'Jhin': 'Ionia', 'Karma': 'Ionia', 'Kayn': 'Ionia', 'Kennen': 'Ionia', 'Lee Sin': 'Ionia',
      'Lillia': 'Ionia', 'Master Yi': 'Ionia', 'Wukong': 'Ionia', 'MonkeyKing': 'Ionia',
      'Rakan': 'Ionia', 'Sett': 'Ionia', 'Shen': 'Ionia', 'Syndra': 'Ionia', 'Varus': 'Ionia',
      'Xayah': 'Ionia', 'Yasuo': 'Ionia', 'Yone': 'Ionia', 'Zed': 'Ionia',

      // Ixtal
      'Malphite': 'Ixtal', 'Milio': 'Ixtal', 'Neeko': 'Ixtal', 'Nidalee': 'Ixtal',
      'Qiyana': 'Ixtal', 'Rengar': 'Ixtal', 'Skarner': 'Ixtal', 'Zyra': 'Ixtal',

      // Noxus
      'Ambessa': 'Noxus', 'Briar': 'Noxus', 'Cassiopeia': 'Noxus', 'Darius': 'Noxus',
      'Draven': 'Noxus', 'Katarina': 'Noxus', 'Kled': 'Noxus', 'LeBlanc': 'Noxus',
      'Mel': 'Noxus', 'Mordekaiser': 'Noxus', 'Rell': 'Noxus', 'Riven': 'Noxus',
      'Samira': 'Noxus', 'Sion': 'Noxus', 'Swain': 'Noxus', 'Talon': 'Noxus', 'Vladimir': 'Noxus',

      // Piltover
      'Caitlyn': 'Piltover', 'Camille': 'Piltover', 'Ezreal': 'Piltover', 'Heimerdinger': 'Piltover',
      'Jayce': 'Piltover', 'Orianna': 'Piltover', 'Seraphine': 'Piltover', 'Vi': 'Piltover',

      // Shadow Isles
      'Elise': 'Shadow Isles', 'Gwen': 'Shadow Isles', 'Hecarim': 'Shadow Isles', 'Kalista': 'Shadow Isles',
      'Karthus': 'Shadow Isles', 'Maokai': 'Shadow Isles', 'Thresh': 'Shadow Isles', 'Vex': 'Shadow Isles',
      'Viego': 'Shadow Isles', 'Yorick': 'Shadow Isles',

      // Shurima
      'Akshan': 'Shurima', 'Ammu': 'Shurima', 'Amumu': 'Shurima', 'Azir': 'Shurima',
      'K\'Sante': 'Shurima', 'Naafiri': 'Shurima', 'Nasus': 'Shurima', 'Rammus': 'Shurima',
      'Renekton': 'Shurima', 'Sivir': 'Shurima', 'Taliyah': 'Shurima', 'Xerath': 'Shurima',

      // Targon
      'Aphelios': 'Targon', 'Diana': 'Targon', 'Leona': 'Targon', 'Pantheon': 'Targon',
      'Soraka': 'Targon', 'Taric': 'Targon', 'Zoe': 'Targon',

      // The Void
      'Bel\'Veth': 'The Void', 'Cho\'Gath': 'The Void', 'Kai\'Sa': 'The Void', 'Kassadin': 'The Void',
      'Kha\'Zix': 'The Void', 'Kog\'Maw': 'The Void', 'Malzahar': 'The Void', 'Rek\'Sai': 'The Void',
      'Vel\'Koz': 'The Void',

      // Zaun
      'Blitzcrank': 'Zaun', 'Dr. Mundo': 'Zaun', 'Ekko': 'Zaun', 'Janna': 'Zaun', 'Jinx': 'Zaun',
      'Renata Glasc': 'Zaun', 'RenataGlasc': 'Zaun', 'Singed': 'Zaun', 'Twitch': 'Zaun',
      'Urgot': 'Zaun', 'Viktor': 'Zaun', 'Warwick': 'Zaun', 'Zac': 'Zaun', 'Zeri': 'Zaun', 'Ziggs': 'Zaun',

      // Runeterra (Global/Multiple regions)
      'Aatrox': 'Runeterra', 'Alistar': 'Runeterra', 'Annie': 'Runeterra', 'Aurelion Sol': 'Runeterra',
      'Bard': 'Runeterra', 'Brand': 'Runeterra', 'Evelynn': 'Runeterra', 'Fiddlesticks': 'Runeterra',
      'Jax': 'Runeterra', 'Kindred': 'Runeterra', 'Nami': 'Runeterra', 'Nocturne': 'Runeterra',
      'Ryze': 'Runeterra', 'Senna': 'Runeterra', 'Shaco': 'Runeterra', 'Smolder': 'Runeterra', 'Zilean': 'Runeterra'
    };

    return championRegions[championName] || 'Runeterra';
  }
}

const datadragonService = new DataDragonService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || undefined;
    const version = searchParams.get('version') || undefined;

    const champions = await datadragonService.getAllChampions(locale, version);

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
