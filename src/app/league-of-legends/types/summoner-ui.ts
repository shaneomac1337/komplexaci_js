// Frontend types for summoner UI components

export interface SummonerProfile {
  account: {
    puuid: string;
    gameName?: string;
    tagLine?: string;
  };
  summoner: {
    id: string;
    accountId: string;
    puuid: string;
    profileIconId: number;
    revisionDate: number;
    summonerLevel: number;
  };
  rankedStats: RankedEntry[];
  championMastery: ChampionMasteryEntry[];
  isInGame: boolean;
  currentGame?: CurrentGame;
}

export interface RankedEntry {
  leagueId: string;
  summonerId: string;
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR' | 'RANKED_FLEX_TT';
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: {
    target: number;
    wins: number;
    losses: number;
    progress: string;
  };
}

export interface ChampionMasteryEntry {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  markRequiredForNextLevel: number;
  tokensEarned: number;
  championSeasonMilestone: number;
  milestoneGrades: string[];
  nextSeasonMilestone: {
    requireGradeCounts: Record<string, number>;
    rewardMarks: number;
    bonus: boolean;
    totalGamesRequiredForReward: number;
  };
  // Enriched data
  championName?: string;
  championImage?: string;
}

export interface MatchHistoryEntry {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    endOfGameResult: string;
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: MatchParticipant[];
    platformId: string;
    queueId: number;
    teams: MatchTeam[];
    tournamentCode: string;
  };
}

export interface MatchParticipant {
  puuid: string;
  participantId: number;
  teamId: number;
  championId: number;
  championName: string;
  championTransform: number;
  individualPosition: string;
  teamPosition: string;
  role: string;
  lane: string;
  spell1Id: number;
  spell2Id: number;
  summoner1Id: number;
  summoner2Id: number;
  kills: number;
  deaths: number;
  assists: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  unrealKills: number;
  totalDamageDealt: number;
  magicDamageDealt: number;
  physicalDamageDealt: number;
  trueDamageDealt: number;
  largestCriticalStrike: number;
  totalDamageDealtToChampions: number;
  magicDamageDealtToChampions: number;
  physicalDamageDealtToChampions: number;
  trueDamageDealtToChampions: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalDamageTaken: number;
  magicDamageTaken: number;
  physicalDamageTaken: number;
  trueDamageTaken: number;
  damageSelfMitigated: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  visionScore: number;
  timeCCingOthers: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  totalTimeCrowdControlDealt: number;
  champLevel: number;
  visionWardsBoughtInGame: number;
  sightWardsBoughtInGame: number;
  wardsPlaced: number;
  wardsKilled: number;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;
  firstTowerKill: boolean;
  firstTowerAssist: boolean;
  firstInhibitorKill: boolean;
  firstInhibitorAssist: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  teamEarlySurrendered: boolean;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  consumablesPurchased: number;
  itemsPurchased: number;
  goldEarned: number;
  goldSpent: number;
  turretKills: number;
  inhibitorKills: number;
  totalTimeSpentDead: number;
  longestTimeSpentLiving: number;
  // Enriched data
  championImage?: string;
}

export interface MatchTeam {
  teamId: number;
  win: boolean;
  firstBlood: boolean;
  firstTower: boolean;
  firstInhibitor: boolean;
  firstRiftHerald: boolean;
  firstBaron: boolean;
  firstDragon: boolean;
  dragonKills: number;
  riftHeraldKills: number;
  baronKills: number;
  inhibitorKills: number;
  towerKills: number;
  bans: Array<{
    championId: number;
    pickTurn: number;
  }>;
  objectives: {
    baron: { first: boolean; kills: number };
    champion: { first: boolean; kills: number };
    dragon: { first: boolean; kills: number };
    horde: { first: boolean; kills: number };
    inhibitor: { first: boolean; kills: number };
    riftHerald: { first: boolean; kills: number };
    tower: { first: boolean; kills: number };
  };
}

export interface CurrentGame {
  gameId: number;
  mapId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  participants: CurrentGameParticipant[];
  observers: {
    encryptionKey: string;
  };
  platformId: string;
  bannedChampions: Array<{
    championId: number;
    teamId: number;
    pickTurn: number;
  }>;
  gameStartTime: number;
  gameLength: number;
}

export interface CurrentGameParticipant {
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  summonerName: string;
  summonerId: string;
  puuid: string;
  bot: boolean;
  perks: {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
  };
}

export interface Region {
  code: string;
  name: string;
  flag: string;
  cluster: string;
  countries: string[];
}

// UI State types
export interface SummonerSearchState {
  isLoading: boolean;
  error: string | null;
  profile: SummonerProfile | null;
  matchHistory: MatchHistoryEntry[];
  selectedRegion: string;
}

// Component Props types
export interface SummonerCardProps {
  profile: SummonerProfile;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export interface RankDisplayProps {
  rankedStats: RankedEntry[];
}

export interface ChampionMasteryProps {
  championMastery: ChampionMasteryEntry[];
  maxDisplay?: number;
}

export interface MatchHistoryProps {
  matches: MatchHistoryEntry[];
  summonerPuuid: string;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export interface LiveGameProps {
  currentGame: CurrentGame;
  summonerPuuid: string;
}
