import type { WWEEra } from '../types/wwe';

export interface EraTheme {
  tagline: string;
  console: string;
  consoleBadge: string;
  accent: string;
  accent2: string;
  deep: string;
  headliners: string[];
}

export const ERA_THEME: Record<string, EraTheme> = {
  golden: {
    tagline: 'HULKAMANIA RUNS WILD',
    console: 'NES · ARCADE · SNES',
    consoleBadge: '8-BIT',
    accent: '#f0c000',
    accent2: '#e84545',
    deep: '#1a0a08',
    headliners: ['Hulk Hogan', 'Ultimate Warrior', 'Randy Savage', 'Andre the Giant'],
  },
  'new-generation': {
    tagline: 'A NEW BREED OF SUPERSTAR',
    console: 'SNES · GENESIS · PS1',
    consoleBadge: '16-BIT',
    accent: '#4a9eff',
    accent2: '#7c3aed',
    deep: '#06101e',
    headliners: ['Bret "Hitman" Hart', 'Shawn Michaels', 'Undertaker', 'Razor Ramon'],
  },
  attitude: {
    tagline: 'GET THE F OUT',
    console: 'PSX · NINTENDO 64',
    consoleBadge: 'PSX/N64',
    accent: '#dc2626',
    accent2: '#000000',
    deep: '#0a0000',
    headliners: ['Stone Cold Steve Austin', 'The Rock', 'Mick Foley', 'Triple H'],
  },
  ruthless: {
    tagline: 'THE CHAMP IS HERE',
    console: 'PS2 · GAMECUBE · X360',
    consoleBadge: 'PS2 ERA',
    accent: '#22d3ee',
    accent2: '#0ea5e9',
    deep: '#04101a',
    headliners: ['John Cena', 'Batista', 'Eddie Guerrero', 'Brock Lesnar'],
  },
  pg: {
    tagline: 'CENATION',
    console: 'PS3 · X360 · WII',
    consoleBadge: 'HD ERA',
    accent: '#f97316',
    accent2: '#fbbf24',
    deep: '#100604',
    headliners: ['John Cena', 'CM Punk', 'Edge', 'Randy Orton'],
  },
  reality: {
    tagline: 'THE YES MOVEMENT',
    console: 'PS4 · XBOX ONE',
    consoleBadge: 'NEXT-GEN',
    accent: '#94a3b8',
    accent2: '#cbd5e1',
    deep: '#08080a',
    headliners: ['Daniel Bryan', 'John Cena', 'Roman Reigns', 'Seth Rollins'],
  },
  'new-era': {
    tagline: "WOMEN'S EVOLUTION",
    console: 'PS4 · XBOX · SWITCH',
    consoleBadge: 'PS4 ERA',
    accent: '#ef4444',
    accent2: '#fbbf24',
    deep: '#0a0204',
    headliners: ['AJ Styles', 'Becky Lynch', 'Roman Reigns', 'Brock Lesnar'],
  },
  'post-covid': {
    tagline: 'IT HITS DIFFERENT',
    console: 'PS4 · PS5 · X|S',
    consoleBadge: 'PS5 DAWN',
    accent: '#a855f7',
    accent2: '#7c3aed',
    deep: '#06010c',
    headliners: ['Rey Mysterio', 'John Cena', 'Roman Reigns', 'Seth Rollins'],
  },
  renaissance: {
    tagline: 'FINISH THE STORY',
    console: 'PS5 · XBOX SERIES X',
    consoleBadge: 'PS5 ERA',
    accent: '#fbbf24',
    accent2: '#f59e0b',
    deep: '#0a0703',
    headliners: ['Cody Rhodes', 'Roman Reigns', 'Seth Rollins', 'CM Punk'],
  },
};

export const FALLBACK_THEME: EraTheme = {
  tagline: 'WRESTLING LEGENDS',
  console: 'MULTI-PLATFORM',
  consoleBadge: 'WWE',
  accent: '#dc2626',
  accent2: '#fbbf24',
  deep: '#08080a',
  headliners: [],
};

export type ThemedEra = WWEEra & EraTheme;

export function themedEra(era: WWEEra): ThemedEra {
  return { ...era, ...(ERA_THEME[era.id] ?? FALLBACK_THEME) };
}
