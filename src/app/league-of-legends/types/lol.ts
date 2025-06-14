export type Role = 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support';

export interface Champion {
  id: string;
  key: string;
  name: string;
  title: string;
  description: string;
  splash: string;
  square: string;
  difficulty: 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká';
  damage: 'Physical' | 'Magic' | 'Mixed';
  survivability: 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká';
  roles: Role[];
  rangeType: 'Melee' | 'Ranged';
  championClass: string;
  region: string;
}

export interface DataDragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags: string[];
  partype: string;
  stats: {
    hp: number;
    hpperlevel: number;
    mp: number;
    mpperlevel: number;
    movespeed: number;
    armor: number;
    armorperlevel: number;
    spellblock: number;
    spellblockperlevel: number;
    attackrange: number;
    hpregen: number;
    hpregenperlevel: number;
    mpregen: number;
    mpregenperlevel: number;
    crit: number;
    critperlevel: number;
    attackdamage: number;
    attackdamageperlevel: number;
    attackspeedperlevel: number;
    attackspeed: number;
  };
}

export interface DataDragonChampionListResponse {
  type: string;
  format: string;
  version: string;
  data: {
    [key: string]: DataDragonChampion;
  };
}