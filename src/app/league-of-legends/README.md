# League of Legends Feature Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Hierarchy](#component-hierarchy)
4. [Data Flow](#data-flow)
5. [Riot API Integration](#riot-api-integration)
6. [Region Handling](#region-handling)
7. [Type Definitions](#type-definitions)
8. [Key Components](#key-components)
9. [Styling System](#styling-system)
10. [API Routes](#api-routes)
11. [Utilities](#utilities)
12. [Development Guidelines](#development-guidelines)

---

## Overview

The League of Legends feature is a comprehensive summoner search and champion browsing system for the Komplexaci gaming community website. It provides:

- **Champion Database**: Browse 160+ champions with filtering, searching, and detailed information
- **Summoner Search**: Look up player profiles by Riot ID (gameName#tagLine)
- **Live Game Tracking**: Real-time display of ongoing matches
- **Match History**: Detailed match analysis with filtering and statistics
- **Champion Mastery**: Display top mastered champions with progression
- **Rank Display**: Show ranked statistics (Solo/Duo, Flex)
- **Multi-region Support**: Query summoners across all Riot API regions

### Key Technologies

- **Next.js 14** (App Router, Server Components, Client Components)
- **TypeScript** for type safety
- **Riot Games API** (Account-v1, Summoner-v4, Champion-Mastery-v4, Match-v5, League-v4, Spectator-v5)
- **DataDragon CDN** for champion images and static data
- **CSS Modules** for component styling

---

## Architecture

### High-Level Structure

```
src/app/league-of-legends/
├── page.tsx                 # Main page component (Champions + Summoner Search)
├── layout.tsx               # SEO metadata and structured data
├── lol.module.css          # Main page styles
├── summoner.module.css     # Summoner search styles
├── components/             # React components
│   ├── SummonerSearch.tsx  # Main search component
│   ├── SummonerCard.tsx    # Profile card display
│   ├── RankDisplay.tsx     # Ranked stats display
│   ├── ChampionMastery.tsx # Champion mastery grid
│   ├── MatchHistory.tsx    # Match list with details
│   ├── LiveGame.tsx        # Live game display
│   ├── MatchStatistics.tsx # Statistics overview
│   ├── PlayedWithAnalysis.tsx # Teammate analysis
│   ├── FilterPanel.tsx     # Advanced filtering
│   ├── FilterChips.tsx     # Active filter chips
│   ├── SearchHistory.tsx   # Recent searches
│   ├── EnhancedLoading.tsx # Loading animations
│   ├── KeyboardShortcuts.tsx # Keyboard navigation
│   └── KomplexaciStatus.tsx # Team status display
├── types/
│   ├── lol.ts             # Champion type definitions
│   └── summoner-ui.ts     # UI component type definitions
└── utils/
    ├── filterUtils.ts     # Match filtering logic
    └── gameDataService.ts # Game data management

src/app/api/lol/
├── services/
│   └── RiotAPIService.ts  # Riot API client service
├── utils/
│   └── championUtils.ts   # Champion data utilities
├── types/
│   └── summoner.ts        # API type definitions
└── [routes]/
    ├── summoner/route.ts  # GET summoner profile
    ├── matches/route.ts   # GET match history
    ├── mastery/route.ts   # GET champion mastery
    ├── live-game/route.ts # GET current game
    ├── regions/route.ts   # GET available regions
    └── champions/route.ts # GET champion list
```

### Design Patterns

1. **Client-Server Separation**
   - Server Components: API routes, data fetching
   - Client Components: User interactions, state management

2. **Service Layer Pattern**
   - `RiotAPIService` encapsulates all Riot API communication
   - Handles authentication, rate limiting, error handling
   - Regional routing (platform vs. regional endpoints)

3. **Data Enrichment Pattern**
   - Raw API data is enriched with champion names/images
   - Caching at multiple levels (service, component, browser)

4. **Progressive Enhancement**
   - SEO-friendly with SSR and structured data
   - NoScript fallback content
   - URL-based search parameters for sharing

---

## Component Hierarchy

```
LeagueOfLegendsPage (page.tsx)
├── Header (global component)
├── Hero Section (champion splash rotation)
├── Game Info Section
│   └── Map Cards Grid
├── KomplexaciStatus (team member status)
├── Toggle Section (Champions / Summoner Search)
├── [IF showChampions === false]
│   └── SummonerSearch
│       ├── SearchHistory
│       ├── Search Form
│       │   ├── Input (Riot ID)
│       │   ├── Select (Region)
│       │   └── Button (Search)
│       ├── EnhancedLoading (conditional)
│       ├── Error Display (conditional)
│       ├── FilterControls (conditional on profile loaded)
│       │   ├── FilterChips
│       │   └── FilterPanel
│       └── Profile Display (conditional)
│           ├── SummonerCard
│           ├── RankDisplay
│           ├── LiveGame (conditional)
│           ├── ChampionMastery
│           ├── MatchStatistics
│           ├── PlayedWithAnalysis
│           └── MatchHistory
├── [IF showChampions === true]
│   └── Champions Section
│       ├── Search Bar
│       ├── DataDragon API Info
│       ├── Position Filters
│       ├── Advanced Filters
│       └── Champion Grid
└── Back Button
```

---

## Data Flow

### User Search Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Enter Riot ID + Region → Click Search      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CLIENT: SummonerSearch.tsx                                │
│    - Validate Riot ID format (gameName#tagLine)             │
│    - Update loading state                                    │
│    - Fetch /api/lol/summoner?riotId=X&region=Y              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API ROUTE: /api/lol/summoner/route.ts                    │
│    - Parse and validate parameters                          │
│    - Initialize RiotAPIService                              │
│    - Call getSummonerProfile()                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SERVICE: RiotAPIService.getSummonerProfile()             │
│    Step 1: getAccountByRiotId() → Riot Account API         │
│            (Regional: americas/europe/asia/sea)             │
│    Step 2: getSummonerByPuuid() → Summoner API             │
│            (Platform: euw1/na1/kr/etc.)                     │
│    Step 3: getRankedStats() → League API (by PUUID)        │
│    Step 4: getChampionMastery() → Mastery API              │
│    Step 5: getCurrentGame() → Spectator API                │
│    Return: SummonerProfile object                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DATA ENRICHMENT: championUtils.ts                        │
│    - Add champion names to mastery data                     │
│    - Add champion images (DataDragon CDN)                   │
│    - Cache champion data for performance                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. API ROUTE: Return enriched JSON response                 │
│    - Cache-Control headers (5min cache)                     │
│    - Error handling with specific status codes              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. CLIENT: Process response                                 │
│    - Update profile state                                   │
│    - Load match history (separate call)                     │
│    - Add to search history (localStorage)                   │
│    - Update URL parameters                                  │
│    - Render profile components                              │
└─────────────────────────────────────────────────────────────┘
```

### Match History Flow

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT: loadMatchHistory(puuid, count, region)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ API: /api/lol/matches?puuid=X&region=Y&count=Z              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVICE: RiotAPIService.getMatchHistory()                   │
│    1. getMatchIds() → Match-v5 API (regional)               │
│    2. For each matchId:                                     │
│       getMatchDetails() → Match-v5 API (regional)           │
│    3. Parallel Promise.all() for performance                │
│    4. enrichMatchWithChampionData() for each match          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ CLIENT: Render MatchHistory component                       │
│    - Apply filters (filterUtils.ts)                         │
│    - Calculate statistics                                   │
│    - Display matches with champion images                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Riot API Integration

### RiotAPIService Architecture

The `RiotAPIService` class (`src/app/api/lol/services/RiotAPIService.ts`) is the central service for all Riot API communication.

#### Regional Routing

Riot API uses two types of endpoints:

1. **Regional Endpoints** (Account, Match)
   - `americas.api.riotgames.com`
   - `europe.api.riotgames.com`
   - `asia.api.riotgames.com`
   - `sea.api.riotgames.com`

2. **Platform Endpoints** (Summoner, League, Mastery, Spectator)
   - `euw1.api.riotgames.com`
   - `na1.api.riotgames.com`
   - `kr.api.riotgames.com`
   - etc.

```typescript
// Example: Getting summoner profile requires both endpoint types
async getSummonerProfile(gameName: string, tagLine: string, region: string) {
  // 1. Account lookup - uses REGIONAL endpoint
  const regionalUrl = this.getRegionalUrl(region); // e.g., europe.api.riotgames.com
  const account = await fetch(`${regionalUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`);

  // 2. Summoner details - uses PLATFORM endpoint
  const platformUrl = this.getPlatformUrl(region); // e.g., euw1.api.riotgames.com
  const summoner = await fetch(`${platformUrl}/lol/summoner/v4/summoners/by-puuid/${account.puuid}`);

  // ...continue with other API calls
}
```

#### PUUID-Based Endpoints (2025 Update)

The service uses the latest PUUID-based endpoints:

| Old Endpoint (Deprecated) | New Endpoint (Current) |
|--------------------------|------------------------|
| `/lol/league/v4/entries/by-summoner/{summonerId}` | `/lol/league/v4/entries/by-puuid/{puuid}` |
| `/lol/summoner/v4/summoners/{summonerId}` | `/lol/summoner/v4/summoners/by-puuid/{puuid}` |

#### Error Handling

The service implements comprehensive error handling:

```typescript
private async makeRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'X-Riot-Token': this.apiKey },
    next: { revalidate: 300 } // 5-minute cache
  });

  if (!response.ok) {
    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new Error(`Rate limit exceeded - retry after ${retryAfter}s`);
    }

    // Handle decryption errors (expired PUUIDs)
    if (response.status === 400 && errorData.message?.includes('decrypting')) {
      throw new Error('Data decryption failed (possibly expired/invalid PUUID)');
    }

    // Other errors...
  }

  return response.json();
}
```

#### Caching Strategy

Multi-level caching for performance:

1. **Service Level**: Failed PUUID cache (5 minutes)
2. **Next.js Revalidation**: `next: { revalidate: 300 }` (5 minutes)
3. **HTTP Cache Headers**: `Cache-Control: public, s-maxage=300`
4. **Client State**: React state management
5. **Champion Data Cache**: `ChampionDataService` (1 hour)

---

## Region Handling

### Available Regions

Defined in `/api/lol/regions/route.ts`:

| Code | Name | Flag | Cluster | Example Countries |
|------|------|------|---------|------------------|
| `euw1` | Europe West | EU | europe | UK, FR, DE, ES, IT |
| `eun1` | Europe Nordic & East | EU | europe | PL, CZ, HU, RO |
| `na1` | North America | US | americas | USA, Canada |
| `kr` | Korea | KR | asia | South Korea |
| `jp1` | Japan | JP | asia | Japan |
| `br1` | Brazil | BR | americas | Brazil |
| `la1` | Latin America North | Earth | americas | Mexico, Central America |
| `la2` | Latin America South | Earth | americas | Argentina, Chile, Colombia |
| `oc1` | Oceania | AU | sea | Australia, New Zealand |
| `tr1` | Turkey | TR | europe | Turkey |
| `ru` | Russia | RU | europe | Russia, CIS |

### Region Selection Flow

```typescript
// User selects region in dropdown
<select value={selectedRegion} onChange={(e) => handleRegionChange(e.target.value)}>
  {regions.map(region => (
    <option key={region.code} value={region.code}>
      {region.flag} {region.name}
    </option>
  ))}
</select>

// Region is passed to all API calls
const profile = await fetch(`/api/lol/summoner?riotId=Faker#T1&region=kr`);
const matches = await fetch(`/api/lol/matches?puuid=X&region=kr`);
```

---

## Type Definitions

### Champion Types (`types/lol.ts`)

```typescript
export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

export interface Champion {
  id: string;              // Champion ID (e.g., "Aatrox")
  key: string;             // Numeric key (e.g., "266")
  name: string;            // Display name
  title: string;           // Champion title (e.g., "the Darkin Blade")
  description: string;     // Short description/blurb
  splash: string;          // Splash art URL
  square: string;          // Square icon URL
  difficulty: 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká';
  damage: 'Physical' | 'Magic';
  survivability: 'Nízká' | 'Střední' | 'Vysoká' | 'Velmi vysoká';
  roles: Role[];           // Champion roles
  rangeType: 'Melee' | 'Ranged';
  championClass: string;   // e.g., "Assassin", "Tank", "Mage"
  region: string;          // Lore region
}

export interface DataDragonChampion {
  // Full DataDragon API response structure
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: { attack: number; defense: number; magic: number; difficulty: number; };
  image: { full: string; sprite: string; /* ... */ };
  tags: string[];
  stats: { hp: number; armor: number; /* ... */ };
}
```

### Summoner UI Types (`types/summoner-ui.ts`)

```typescript
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
  tier: string;              // "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"
  rank: string;              // "I", "II", "III", "IV"
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: { target: number; wins: number; losses: number; progress: string; };
}

export interface ChampionMasteryEntry {
  puuid: string;
  championId: number;
  championLevel: number;     // 1-7
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  markRequiredForNextLevel: number;
  tokensEarned: number;
  championSeasonMilestone: number;
  milestoneGrades: string[];
  nextSeasonMilestone: { /* ... */ };
  // Enriched data:
  championName?: string;
  championImage?: string;
}

export interface MatchHistoryEntry {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];  // Array of PUUIDs
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;        // "CLASSIC", "ARAM", etc.
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: MatchParticipant[];
    platformId: string;
    queueId: number;
    teams: MatchTeam[];
    // ...
  };
}

export interface MatchParticipant {
  puuid: string;
  participantId: number;
  teamId: number;
  championId: number;
  championName: string;
  individualPosition: string;
  teamPosition: string;
  role: string;
  lane: string;
  spell1Id: number;
  spell2Id: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  visionScore: number;
  goldEarned: number;
  item0: number;
  item1: number;
  // ... (30+ more stats)
  win: boolean;
  championImage?: string;  // Enriched
}

export interface CurrentGame {
  gameId: number;
  mapId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  participants: CurrentGameParticipant[];
  observers: { encryptionKey: string; };
  platformId: string;
  bannedChampions: Array<{ championId: number; teamId: number; pickTurn: number; }>;
  gameStartTime: number;
  gameLength: number;
}
```

---

## Key Components

### SummonerSearch Component

**File**: `components/SummonerSearch.tsx`

Main search interface with profile display.

**Props**:
```typescript
interface SummonerSearchProps {
  onProfileFound?: (profile: SummonerProfile) => void;
}
```

**State**:
```typescript
interface SummonerSearchState {
  isLoading: boolean;
  error: string | null;
  profile: SummonerProfile | null;
  matchHistory: MatchHistoryEntry[];
  selectedRegion: string;
}
```

**Key Features**:
- Riot ID validation (gameName#tagLine format)
- URL parameter handling for direct links
- Auto-scroll to section with hash (#summoner-search)
- Search history management (localStorage)
- Real-time filtering with useMemo
- Auto-refresh live games every 30 seconds

**Usage**:
```tsx
<SummonerSearch onProfileFound={(profile) => console.log('Found:', profile)} />
```

---

### ChampionMastery Component

**File**: `components/ChampionMastery.tsx`

Displays top mastered champions with levels and points.

**Props**:
```typescript
interface ChampionMasteryProps {
  championMastery: ChampionMasteryEntry[];
  maxDisplay?: number;  // Default: 10
}
```

**Features**:
- Rank badges (#1, #2, etc.)
- Mastery level colors (1-7)
- Progress bars to next level
- Last played time formatting
- Mastery 7 special badge

**Mastery Colors**:
| Level | Color | Hex |
|-------|-------|-----|
| 1 | Brown | #8B4513 |
| 2 | Bronze | #CD7F32 |
| 3 | Silver | #C0C0C0 |
| 4 | Gold | #FFD700 |
| 5 | Cyan | #00CED1 |
| 6 | Purple | #9932CC |
| 7 | Red | #FF6347 |

---

### LiveGame Component

**File**: `components/LiveGame.tsx`

Real-time display of ongoing match.

**Props**:
```typescript
interface LiveGameProps {
  currentGame: CurrentGame;
  summonerPuuid: string;  // To highlight searched player
}
```

**Features**:
- Two-team layout (Blue vs Red)
- Champion bans display
- Summoner spell icons
- Profile icons
- Live timer (updates every second)
- Clickable summoner names (open in new tab)
- Copy game info to clipboard
- Auto-refresh button

**Game Mode Mapping**:
```typescript
const queueMap: Record<number, string> = {
  420: 'Ranked Solo/Duo',
  440: 'Ranked Flex 5v5',
  450: 'ARAM',
  400: 'Normal Draft',
  430: 'Normal Blind',
  700: 'Clash',
  1700: 'Arena',
  1900: 'URF',
  // ...
};
```

---

### MatchHistory Component

**File**: `components/MatchHistory.tsx`

Displays paginated match history with detailed stats.

**Props**:
```typescript
interface MatchHistoryProps {
  matches: MatchHistoryEntry[];
  summonerPuuid: string;
  onLoadMore?: () => void;
  isLoading?: boolean;
}
```

**Features**:
- Win/loss color coding
- KDA display (kills/deaths/assists)
- Champion images
- Item display
- Game duration
- Match timestamp
- Expandable details
- Load more pagination

---

### FilterPanel Component

**File**: `components/FilterPanel.tsx`

Advanced filtering for matches and mastery.

**Props**:
```typescript
interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableChampions: string[];
  availableGameModes: string[];
  isVisible: boolean;
  onToggle: () => void;
  matchCount: number;
  totalMatches: number;
}
```

**Filter State**:
```typescript
export interface FilterState {
  champions: string[];           // Filter by champion
  gameModes: string[];          // Filter by game mode
  results: 'all' | 'wins' | 'losses';
  dateRange: 'all' | '7days' | '30days' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  roles: string[];              // Filter by role
  gameDuration: 'all' | 'short' | 'normal' | 'long';
  masteryLevels: number[];      // Filter by mastery level
  minKDA?: number;
  maxKDA?: number;
  minDamage?: number;
  maxDamage?: number;
  minMasteryPoints?: number;
  maxMasteryPoints?: number;
}
```

---

### RankDisplay Component

**File**: `components/RankDisplay.tsx`

Shows ranked statistics for Solo/Duo and Flex queues.

**Props**:
```typescript
interface RankDisplayProps {
  rankedStats: RankedEntry[];
}
```

**Features**:
- Tier/division icons
- LP (League Points) display
- Win/loss ratio
- Win rate percentage
- Hot streak indicator
- Unranked state handling

---

## Styling System

### CSS Modules

The feature uses CSS Modules for scoped styling:

- **lol.module.css**: Main page styles (champion grid, filters, hero section)
- **summoner.module.css**: Summoner search styles (profile, matches, live game)

### Design Tokens

```css
/* Color Palette */
--primary-purple: #6e4ff6;
--primary-purple-dark: #5b3fd4;
--text-gold: #c9aa71;
--text-light: #f0e6d2;
--bg-dark: rgba(0, 0, 0, 0.3);
--border-blue: rgba(110, 79, 246, 0.3);

/* Team Colors */
--team-blue: #4a90e2;
--team-red: #e74c3c;

/* Rank Colors */
--rank-iron: #6d6d6d;
--rank-bronze: #cd7f32;
--rank-silver: #c0c0c0;
--rank-gold: #ffd700;
--rank-platinum: #00ced1;
--rank-emerald: #00ff7f;
--rank-diamond: #b9f2ff;
--rank-master: #9932cc;
--rank-grandmaster: #ff4500;
--rank-challenger: #f4c430;
```

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }
```

---

## API Routes

### GET /api/lol/summoner

Retrieve summoner profile by Riot ID.

**Parameters**:
- `riotId` (required): gameName#tagLine format
- `region` (required): Region code (euw1, na1, etc.)
- `refresh` (optional): Force cache bypass

**Response** (`SummonerProfile`):
```json
{
  "account": {
    "puuid": "abc123...",
    "gameName": "Faker",
    "tagLine": "T1"
  },
  "summoner": {
    "id": "xyz789...",
    "accountId": "...",
    "puuid": "abc123...",
    "profileIconId": 4568,
    "revisionDate": 1234567890,
    "summonerLevel": 543
  },
  "rankedStats": [...],
  "championMastery": [...],
  "isInGame": false
}
```

**Error Codes**:
- `400`: Invalid Riot ID format
- `404`: Summoner not found
- `429`: Rate limit exceeded
- `500`: Server error

---

### GET /api/lol/matches

Retrieve match history for a summoner.

**Parameters**:
- `puuid` (required): Player UUID
- `region` (required): Region code
- `count` (optional): Number of matches (1-100, default: 10)

**Response**:
```json
{
  "matches": [
    {
      "metadata": { "matchId": "EUW1_1234567890", "participants": [...] },
      "info": {
        "gameCreation": 1234567890,
        "gameDuration": 1800,
        "gameMode": "CLASSIC",
        "participants": [...],
        "teams": [...]
      }
    }
  ]
}
```

---

### GET /api/lol/mastery

Retrieve champion mastery for a summoner.

**Parameters**:
- `puuid` (required): Player UUID
- `region` (required): Region code
- `count` (optional): Top N champions (default: 10)

**Response**:
```json
{
  "mastery": [
    {
      "championId": 266,
      "championLevel": 7,
      "championPoints": 543210,
      "championName": "Aatrox",
      "championImage": "https://ddragon.leagueoflegends.com/..."
    }
  ]
}
```

---

### GET /api/lol/live-game

Check if summoner is currently in a game.

**Parameters**:
- `puuid` (required): Player UUID
- `region` (required): Region code

**Response**:
```json
{
  "inGame": true,
  "gameInfo": {
    "gameId": 1234567890,
    "gameQueueConfigId": 420,
    "gameStartTime": 1234567890,
    "participants": [...],
    "bannedChampions": [...]
  }
}
```

---

### GET /api/lol/regions

List all available regions.

**Parameters**: None

**Response**:
```json
{
  "regions": [
    {
      "code": "euw1",
      "name": "Europe West",
      "flag": "🇪🇺",
      "cluster": "europe",
      "countries": ["United Kingdom", "France", ...]
    }
  ]
}
```

---

### GET /api/lol/champions

Retrieve champion list from DataDragon.

**Parameters**:
- `locale` (optional): Language code (cs_CZ, en_US, etc.)
- `version` (optional): Game version (default: latest)

**Response**:
```json
[
  {
    "id": "Aatrox",
    "key": "266",
    "name": "Aatrox",
    "title": "the Darkin Blade",
    "splash": "https://ddragon.leagueoflegends.com/...",
    "square": "https://ddragon.leagueoflegends.com/...",
    "difficulty": "Střední",
    "roles": ["TOP"]
  }
]
```

---

## Utilities

### filterUtils.ts

Provides filtering logic for matches and champion mastery.

**Key Functions**:

```typescript
// Filter matches based on criteria
filterMatches(matches: MatchData[], filters: FilterState): MatchData[]

// Filter champion mastery
filterChampionMastery(masteryData: ChampionMasteryData[], filters: FilterState): ChampionMasteryData[]

// Extract unique values
getUniqueChampions(matches: MatchData[]): string[]
getUniqueGameModes(matches: MatchData[]): string[]

// Calculate statistics
calculateMatchStats(matches: MatchData[]): {
  totalMatches: number;
  winRate: number;
  averageKDA: number;
  averageDamage: number;
  averageVisionScore: number;
  averageGameDuration: number;
  mostPlayedChampion: string | null;
  favoriteRole: string | null;
}

// Check filter state
hasActiveFilters(filters: FilterState): boolean
getFilterSummary(filters: FilterState): string
```

**Example Usage**:
```typescript
const filteredMatches = filterMatches(allMatches, {
  champions: ['Aatrox', 'Yasuo'],
  results: 'wins',
  dateRange: '7days',
  minKDA: 3.0
});

const stats = calculateMatchStats(filteredMatches);
console.log(`Win rate: ${stats.winRate}%`);
console.log(`Average KDA: ${stats.averageKDA}`);
```

---

### championUtils.ts

Champion data management and enrichment.

**ChampionDataService**:
```typescript
class ChampionDataService {
  // Get all champion data (cached for 1 hour)
  async getChampionData(): Promise<Map<number, ChampionData>>

  // Get champion by ID
  async getChampionById(championId: number): Promise<ChampionData | null>

  // Get champion by name
  async getChampionByName(championName: string): Promise<ChampionData | null>

  // Get all champions
  async getAllChampions(): Promise<ChampionData[]>

  // Get image URLs
  getChampionImageUrl(championId: string, version?: string): string
  getChampionSplashUrl(championId: string, skinNum?: number): string
  getChampionLoadingUrl(championId: string, skinNum?: number): string
}

// Singleton instance
export const championDataService = new ChampionDataService();
```

**Helper Functions**:
```typescript
// Get champion name from ID
async getChampionName(championId: number): Promise<string>

// Get champion image URL
async getChampionImage(championId: number, version?: string): Promise<string>

// Enrich match with champion data
async enrichMatchWithChampionData(match: any): Promise<any>

// Enrich mastery with champion data
async enrichMasteryWithChampionData(mastery: any): Promise<any>
```

---

## Development Guidelines

### Adding a New Component

1. Create component file in `components/`
2. Define prop types in `types/summoner-ui.ts`
3. Import styles from CSS module
4. Export component and prop types
5. Add to parent component hierarchy

Example:
```typescript
// components/NewComponent.tsx
"use client";

import styles from '../summoner.module.css';
import { NewComponentProps } from '../types/summoner-ui';

export default function NewComponent({ prop1, prop2 }: NewComponentProps) {
  return (
    <div className={styles.newComponent}>
      {/* Component content */}
    </div>
  );
}

// types/summoner-ui.ts
export interface NewComponentProps {
  prop1: string;
  prop2: number;
}
```

---

### Adding a New API Route

1. Create route file: `/api/lol/[route-name]/route.ts`
2. Implement GET/POST handler
3. Use `RiotAPIService` for Riot API calls
4. Add proper error handling
5. Set cache headers
6. Document in this README

Example:
```typescript
// /api/lol/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RiotAPIService } from '../services/RiotAPIService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');

    if (!param) {
      return NextResponse.json(
        { error: 'param is required' },
        { status: 400 }
      );
    }

    const riotService = new RiotAPIService();
    const data = await riotService.someMethod(param);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

---

### Extending RiotAPIService

Add new methods to the service class:

```typescript
// services/RiotAPIService.ts
export class RiotAPIService {
  // ... existing methods ...

  async newMethod(param: string, region: string = 'euw1'): Promise<any> {
    const platformUrl = this.getPlatformUrl(region);
    const url = `${platformUrl}/lol/new-endpoint/v1/data/${param}`;
    return this.makeRequest<any>(url);
  }
}
```

---

### Environment Variables

Required in `.env.local`:

```bash
# Riot API Key (from https://developer.riotgames.com/)
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional: Enable debug logging
RIOT_API_DEBUG=true
```

---

### Testing Checklist

Before deploying changes:

- [ ] Test summoner search with valid Riot ID
- [ ] Test with invalid Riot ID (error handling)
- [ ] Test with different regions
- [ ] Test match history loading and filtering
- [ ] Test live game display (if player is in game)
- [ ] Test champion mastery display
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test URL parameters and sharing
- [ ] Test search history functionality
- [ ] Verify API rate limiting doesn't occur
- [ ] Check console for errors
- [ ] Test with empty/null states

---

### Performance Optimization Tips

1. **Use useMemo for expensive calculations**
   ```typescript
   const filteredMatches = useMemo(() =>
     filterMatches(matches, filters),
     [matches, filters]
   );
   ```

2. **Implement pagination for large datasets**
   - Match history: Load 10-20 at a time
   - Champion mastery: Show top 5-10

3. **Optimize images**
   - Use Next.js Image component
   - Lazy load images below fold
   - Use appropriate image sizes

4. **Cache champion data**
   - ChampionDataService caches for 1 hour
   - Reduces DataDragon API calls

5. **Debounce search input**
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce((term) => setSearchTerm(term), 300),
     []
   );
   ```

---

### Common Issues and Solutions

#### Issue: Rate Limiting (429 Error)

**Solution**: Implement exponential backoff or reduce request frequency.

```typescript
// In RiotAPIService
private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('429') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### Issue: PUUID Decryption Errors

**Solution**: These occur when PUUIDs expire or are invalid. Handle gracefully:

```typescript
// Already implemented in RiotAPIService
if (error.message.includes('decrypting')) {
  this.markPuuidAsFailed(puuid);
  return { matches: [] }; // Return empty instead of error
}
```

#### Issue: Champion Images Not Loading

**Solution**: Verify DataDragon version and champion ID mapping:

```typescript
// Use fallback image
onError={(e) => {
  e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
}}
```

---

## Future Enhancements

Potential improvements for the feature:

1. **Advanced Statistics**
   - Champion-specific win rates
   - Build path analysis
   - Rune/summoner spell statistics

2. **Social Features**
   - Compare with friends
   - Leaderboards
   - Team analysis

3. **Real-time Updates**
   - WebSocket for live game updates
   - Push notifications for game results

4. **Mobile App**
   - React Native version
   - Native notifications

5. **AI Analysis**
   - Match outcome prediction
   - Champion recommendations
   - Performance insights

---

## References

- [Riot Developer Portal](https://developer.riotgames.com/)
- [Riot API Documentation](https://developer.riotgames.com/apis)
- [DataDragon Documentation](https://developer.riotgames.com/docs/lol#data-dragon)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Changelog

### Version 1.2.0 (Current)
- Updated to PUUID-based Riot API endpoints (2025)
- Added advanced filtering system
- Improved error handling and caching
- Added live game display with auto-refresh
- Implemented match statistics and analysis

### Version 1.1.0
- Added champion mastery display
- Implemented search history
- Added keyboard shortcuts
- Improved responsive design

### Version 1.0.0
- Initial release
- Basic summoner search
- Match history display
- Champion database

---

## License

This feature is part of the Komplexaci website and follows the project's license terms.

---

**Last Updated**: 2025-01-30
**Maintained By**: Komplexaci Development Team
**Contact**: [Project Repository](https://github.com/komplexaci/komplexaci_js)
