export interface Weapon {
  id: string;
  name: string;
  price: string;
  stats: string;
  damage: string;
  accuracy: string;
  team: string;
  image: string;
  category: string;
}

export interface WeaponCategory {
  id: string;
  title: string;
  description: string;
  weapons: Weapon[];
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'defusal' | 'hostage' | 'wingman';
  active: boolean;
  releaseDate?: string;
  features: string[];
}

export interface GameInfo {
  title: string;
  description: string;
  basicInfo: {
    developer: string;
    releaseDate: string;
    genre: string;
    platform: string;
    model: string;
    engine: string;
    esport: string;
  };
  mechanics: {
    title: string;
    description: string;
    features: string[];
  };
  screenshots: string[];
  schema: {
    name: string;
    description: string;
    url: string;
    image: string;
    genre: string;
    operatingSystem: string;
    applicationCategory: string;
    publisher: {
      name: string;
    };
    aggregateRating: {
      ratingValue: string;
      reviewCount: string;
    };
    playMode: string[];
    gamePlatform: string[];
  };
}
