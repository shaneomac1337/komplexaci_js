import { FilterState } from '../components/FilterPanel';

export interface MatchData {
  gameId: string;
  championName: string;
  gameMode: string;
  gameType: string;
  gameCreation: number;
  gameDuration: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  role?: string;
  lane?: string;
  teamPosition?: string;
  [key: string]: any;
}

export interface ChampionMasteryData {
  championId: string;
  championName: string;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  [key: string]: any;
}

/**
 * Filter match history based on filter criteria
 */
export function filterMatches(matches: MatchData[], filters: FilterState): MatchData[] {
  return matches.filter(match => {
    // Champion filter
    if (filters.champions.length > 0 && !filters.champions.includes(match.championName)) {
      return false;
    }

    // Game mode filter
    if (filters.gameModes.length > 0 && !filters.gameModes.includes(match.gameMode)) {
      return false;
    }

    // Result filter
    if (filters.results === 'wins' && !match.win) {
      return false;
    }
    if (filters.results === 'losses' && match.win) {
      return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      const matchDate = match.gameCreation;
      const dayInMs = 24 * 60 * 60 * 1000;

      switch (filters.dateRange) {
        case '7days':
          if (now - matchDate > 7 * dayInMs) return false;
          break;
        case '30days':
          if (now - matchDate > 30 * dayInMs) return false;
          break;
        case 'custom':
          if (filters.customDateStart && filters.customDateEnd) {
            const startDate = new Date(filters.customDateStart).getTime();
            const endDate = new Date(filters.customDateEnd).getTime();
            if (matchDate < startDate || matchDate > endDate) return false;
          }
          break;
      }
    }

    // Role filter
    if (filters.roles.length > 0) {
      const matchRole = match.teamPosition || match.lane || match.role;

      if (!matchRole || !filters.roles.includes(matchRole)) {
        return false;
      }
    }

    // Game duration filter
    if (filters.gameDuration !== 'all') {
      const durationMinutes = match.gameDuration / 60;
      switch (filters.gameDuration) {
        case 'short':
          if (durationMinutes >= 20) return false;
          break;
        case 'normal':
          if (durationMinutes < 20 || durationMinutes > 35) return false;
          break;
        case 'long':
          if (durationMinutes <= 35) return false;
          break;
      }
    }

    // Performance filters
    if (filters.minKDA !== undefined || filters.maxKDA !== undefined) {
      const kda = match.deaths === 0 ? 
        (match.kills + match.assists) : 
        (match.kills + match.assists) / match.deaths;
      
      if (filters.minKDA !== undefined && kda < filters.minKDA) return false;
      if (filters.maxKDA !== undefined && kda > filters.maxKDA) return false;
    }

    if (filters.minDamage !== undefined && match.totalDamageDealtToChampions < filters.minDamage) {
      return false;
    }
    if (filters.maxDamage !== undefined && match.totalDamageDealtToChampions > filters.maxDamage) {
      return false;
    }

    return true;
  });
}

/**
 * Filter champion mastery based on filter criteria
 */
export function filterChampionMastery(
  masteryData: ChampionMasteryData[], 
  filters: FilterState
): ChampionMasteryData[] {
  return masteryData.filter(mastery => {
    // Mastery level filter
    if (filters.masteryLevels.length > 0 && !filters.masteryLevels.includes(mastery.championLevel)) {
      return false;
    }

    // Mastery points filter
    if (filters.minMasteryPoints !== undefined && mastery.championPoints < filters.minMasteryPoints) {
      return false;
    }
    if (filters.maxMasteryPoints !== undefined && mastery.championPoints > filters.maxMasteryPoints) {
      return false;
    }

    // Champion filter (if user wants to see mastery for specific champions)
    if (filters.champions.length > 0 && !filters.champions.includes(mastery.championName)) {
      return false;
    }

    return true;
  });
}

/**
 * Extract unique champions from match history
 */
export function getUniqueChampions(matches: MatchData[]): string[] {
  const champions = new Set(matches.map(match => match.championName));
  return Array.from(champions).sort();
}

/**
 * Extract unique game modes from match history
 */
export function getUniqueGameModes(matches: MatchData[]): string[] {
  const gameModes = new Set(matches.map(match => match.gameMode));
  return Array.from(gameModes).sort();
}

/**
 * Calculate statistics for filtered matches
 */
export function calculateMatchStats(matches: MatchData[]) {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      winRate: 0,
      averageKDA: 0,
      averageDamage: 0,
      averageVisionScore: 0,
      averageGameDuration: 0,
      mostPlayedChampion: null,
      favoriteRole: null
    };
  }

  const wins = matches.filter(match => match.win).length;
  const winRate = (wins / matches.length) * 100;

  const totalKDA = matches.reduce((sum, match) => {
    const kda = match.deaths === 0 ? 
      (match.kills + match.assists) : 
      (match.kills + match.assists) / match.deaths;
    return sum + kda;
  }, 0);
  const averageKDA = totalKDA / matches.length;

  const totalDamage = matches.reduce((sum, match) => sum + (match.totalDamageDealtToChampions || 0), 0);
  const averageDamage = totalDamage / matches.length;

  const totalVisionScore = matches.reduce((sum, match) => sum + (match.visionScore || 0), 0);
  const averageVisionScore = totalVisionScore / matches.length;

  const totalGameDuration = matches.reduce((sum, match) => sum + match.gameDuration, 0);
  const averageGameDuration = totalGameDuration / matches.length;

  // Most played champion
  const championCounts: { [key: string]: number } = {};
  matches.forEach(match => {
    championCounts[match.championName] = (championCounts[match.championName] || 0) + 1;
  });
  const mostPlayedChampion = Object.entries(championCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  // Favorite role
  const roleCounts: { [key: string]: number } = {};
  matches.forEach(match => {
    const role = match.teamPosition || match.role || match.lane;
    if (role) {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }
  });
  const favoriteRole = Object.entries(roleCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  return {
    totalMatches: matches.length,
    winRate: Math.round(winRate * 100) / 100,
    averageKDA: Math.round(averageKDA * 100) / 100,
    averageDamage: Math.round(averageDamage),
    averageVisionScore: Math.round(averageVisionScore * 10) / 10,
    averageGameDuration: Math.round(averageGameDuration / 60), // in minutes
    mostPlayedChampion,
    favoriteRole
  };
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return filters.champions.length > 0 ||
         filters.gameModes.length > 0 ||
         filters.results !== 'all' ||
         filters.dateRange !== 'all' ||
         filters.roles.length > 0 ||
         filters.gameDuration !== 'all' ||
         filters.masteryLevels.length > 0 ||
         filters.minKDA !== undefined ||
         filters.maxKDA !== undefined ||
         filters.minDamage !== undefined ||
         filters.maxDamage !== undefined ||
         filters.minMasteryPoints !== undefined ||
         filters.maxMasteryPoints !== undefined;
}

/**
 * Get filter summary text
 */
export function getFilterSummary(filters: FilterState): string {
  const activeParts: string[] = [];

  if (filters.champions.length > 0) {
    activeParts.push(`${filters.champions.length} champion${filters.champions.length > 1 ? 'ů' : ''}`);
  }
  if (filters.gameModes.length > 0) {
    activeParts.push(`${filters.gameModes.length} herní mód${filters.gameModes.length > 1 ? 'ů' : ''}`);
  }
  if (filters.results !== 'all') {
    activeParts.push(filters.results === 'wins' ? 'pouze výhry' : 'pouze prohry');
  }
  if (filters.dateRange !== 'all') {
    activeParts.push('časové období');
  }
  if (filters.roles.length > 0) {
    activeParts.push(`${filters.roles.length} rol${filters.roles.length > 1 ? 'í' : 'e'}`);
  }

  if (activeParts.length === 0) return 'Žádné filtry';
  if (activeParts.length === 1) return activeParts[0];
  if (activeParts.length === 2) return activeParts.join(' a ');
  
  return activeParts.slice(0, -1).join(', ') + ' a ' + activeParts[activeParts.length - 1];
}
