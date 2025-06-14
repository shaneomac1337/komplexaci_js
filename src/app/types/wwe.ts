// WWE Game Types
export interface WWEGame {
  id: string;
  title: string;
  year: number;
  platform: string;
  description: string;
  features: string[];
  cover: string;
  era: string;
  series: string;
}

// WWE Era Types
export interface WWEEra {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  years: string;
  games: WWEGame[];
}

// WWE Game Info Types
export interface WWEGameInfo {
  title: string;
  description: string;
  basicInfo: {
    developer: string;
    publisher: string;
    firstGame: string;
    latestGame: string;
    genre: string;
    platforms: string;
    totalGames: string;
  };
  legacy: {
    title: string;
    description: string;
    highlights: string[];
  };
}

// Filter Types
export interface WWEFilters {
  era: string;
  series: string;
  platform?: string;
  year?: string;
}