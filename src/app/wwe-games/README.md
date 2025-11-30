# WWE Games Feature Documentation

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Data Structure](#data-structure)
4. [Type Definitions](#type-definitions)
5. [Component Organization](#component-organization)
6. [API Endpoints](#api-endpoints)
7. [WWE Music Player](#wwe-music-player)
8. [Styling System](#styling-system)
9. [Adding New Games](#adding-new-games)
10. [SEO and Metadata](#seo-and-metadata)

---

## Feature Overview

The WWE Games feature is a comprehensive showcase of WWE/WWF wrestling game history on the Komplexaci gaming community website. It presents over 50 games spanning from 1987's MicroLeague Wrestling to 2025's WWE 2K25, organized chronologically by WWE eras.

**Key Features:**
- Interactive game collection with cover art and detailed information
- Era-based organization (Golden Era through Renaissance Era)
- Advanced filtering by era and game series
- Dedicated WWE music player with SmackDown! 2 theme soundtrack
- SmackDown!-inspired industrial 2000s visual design
- Responsive layout with smooth animations
- Dynamic hero section with rotating WWE 2K25 screenshots

**Location:** `C:\Users\Martin\Desktop\Projects\komplexaci_js\src\app\wwe-games\`

---

## Architecture

### Directory Structure

```
src/app/wwe-games/
├── page.tsx              # Main page component with game display logic
├── layout.tsx            # Layout with metadata and structured data
└── wwe.module.css        # SmackDown!-inspired styling

src/app/types/
└── wwe.ts                # TypeScript type definitions

src/app/api/wwe/
├── games/
│   └── route.ts          # Games data API endpoint with filtering
└── game-info/
    └── route.ts          # Game series information API endpoint

src/app/components/
└── WWEMusicPlayer.tsx    # Music player component
```

### Page Flow

1. **Initial Load:**
   - Page component fetches data from both API endpoints in parallel
   - Displays loading skeleton while data loads
   - Stops main KOMPG music player automatically
   - Initializes random WWE 2K25 screenshot for hero section

2. **User Interaction:**
   - First click anywhere on page triggers WWE music auto-start
   - Filter changes trigger new API requests
   - Screenshot rotates every 15 seconds
   - Music player shows/hides based on scroll and activity

3. **Data Display:**
   - Games grouped by WWE eras
   - Each era shows divider with description
   - Games rendered in responsive SmartGrid layout
   - Hover effects reveal holographic borders on game covers

---

## Data Structure

### WWE Eras

The feature organizes games into 9 distinct WWE eras:

1. **Golden Era** (1984-1993): Hulk Hogan, Ultimate Warrior
2. **New Generation Era** (1993-1997): Bret Hart, Shawn Michaels
3. **Attitude Era** (1997-2002): Stone Cold, The Rock
4. **Ruthless Aggression Era** (2002-2008): John Cena, Batista
5. **PG Era** (2008-2014): WWE Universe Mode introduction
6. **Reality Era** (2014-2016): Daniel Bryan, next-gen consoles
7. **New Era** (2016-2021): Brand Split return, Women's Evolution
8. **Post-COVID Era** (2021-2023): WWE 2K22 "It Hits Different"
9. **Renaissance Era** (2023-present): Triple H creative era

### Game Series Classification

Games are categorized into series:

- **smackdown**: SmackDown! series (1999-2003)
- **svr**: SmackDown vs. Raw series (2004-2011)
- **2k**: WWE 2K series (2013-present)
- **wrestlemania**: WrestleMania series (GameCube)
- **n64**: N64 Classics (War Zone, Attitude, No Mercy)
- **arcade**: Arcade Games (Superstars, WrestleFest, All Stars)
- **gamecube**: GameCube Era (Day of Reckoning series)
- **standalone**: Standalone titles

---

## Type Definitions

Location: `src/app/types/wwe.ts`

### WWEGame Interface

```typescript
interface WWEGame {
  id: string;              // Unique identifier (e.g., "wwf-no-mercy-2000")
  title: string;           // Game title
  year: number;            // Release year
  platform: string;        // Platform(s)
  description: string;     // Detailed game description
  features: string[];      // Key features array
  cover: string;           // Cover image path
  era: string;             // WWE era ID
  series: string;          // Game series classification
}
```

**Example:**
```typescript
{
  id: 'wwf-no-mercy-2000',
  title: 'WWF No Mercy',
  year: 2000,
  platform: 'Nintendo 64',
  description: 'Absolutní král wrestling her! Vyvinutá AKI Corporation...',
  features: ['Nejlepší wrestling hra ever', 'Dokonalý AKI engine', ...],
  cover: '/komplexaci/img/wwe-covers/wwf-no-mercy-2000.jpg',
  era: 'attitude',
  series: 'n64'
}
```

### WWEEra Interface

```typescript
interface WWEEra {
  id: string;              // Era identifier
  title: string;           // Era display name
  subtitle: string;        // Year range
  description: string;     // Era description
  years: string;           // Year range string
  games: WWEGame[];        // Array of games in this era
}
```

### WWEGameInfo Interface

```typescript
interface WWEGameInfo {
  title: string;           // "WWE Games"
  description: string;     // Overview description
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
```

### WWEFilters Interface

```typescript
interface WWEFilters {
  era: string;             // Era filter value
  series: string;          // Series filter value
  platform?: string;       // Optional platform filter (not implemented)
  year?: string;           // Optional year filter (not implemented)
}
```

---

## Component Organization

### Main Page Component (`page.tsx`)

**State Management:**

```typescript
const [eras, setEras] = useState<WWEEra[]>([]);                    // Game data by era
const [gameInfo, setGameInfo] = useState<WWEGameInfo | null>(null); // Series info
const [selectedEra, setSelectedEra] = useState<string>('all');      // Era filter
const [selectedSeries, setSelectedSeries] = useState<string>('all'); // Series filter
const [loading, setLoading] = useState(true);                       // Loading state
const [error, setError] = useState<string | null>(null);            // Error state
const [hasUserInteracted, setHasUserInteracted] = useState(false);  // Music trigger
const [currentScreenshot, setCurrentScreenshot] = useState<string>(''); // Hero bg
```

**Key Functions:**

- `handleFilterChange(filterType, value)`: Updates era or series filter
- `resetFilters()`: Resets both filters to 'all'
- `getTotalGamesCount()`: Calculates total games matching filters
- `handleFirstInteraction()`: Starts WWE music on first user click
- `getRandomWWEScreenshot()`: Returns random screenshot from array

**Hero Section:**

The hero uses a dual-layer image approach for optimal visual quality:
- Blurred background layer for atmosphere
- Main image layer with `object-fit: contain` to prevent cropping
- Screenshots rotate every 15 seconds
- Overlay with WWE-style border and corner accents

### Layout Component (`layout.tsx`)

Provides SEO metadata and structured data for:
- Page metadata (title, description, keywords)
- Open Graph tags for social sharing
- Twitter Card metadata
- JSON-LD structured data:
  - VideoGameSeries schema
  - WebPage schema with breadcrumbs
  - SportsTeam schema for Komplexaci

### Shared Components

**AnimatedSection:**
Wrapper component providing entrance animations:
- fadeInUp, fadeInLeft, fadeInRight
- Configurable duration and delay
- Used throughout page for staggered reveals

**SmartGrid:**
Responsive grid component that adapts columns based on item count:
- Single column: 1 item, centered
- Two columns: 2-4 items
- Three columns: 5+ items
- Supports stagger delays and animations

**Header:**
Reusable site header component

---

## API Endpoints

### GET /api/wwe/games

Returns WWE games data organized by eras with optional filtering.

**Query Parameters:**
- `era` (optional): Filter by era ID (e.g., "attitude", "ruthless")
- `series` (optional): Filter by series ID (e.g., "smackdown", "2k")

**Response Format:**
```typescript
WWEEra[] // Array of era objects containing filtered games
```

**Filtering Logic:**

```typescript
// Era filtering
if (era && era !== 'all') {
  filteredEras = filteredEras.filter(eraData => eraData.id === era);
}

// Series filtering
if (series && series !== 'all') {
  filteredEras = filteredEras.map(eraData => ({
    ...eraData,
    games: eraData.games.filter(game => game.series === series)
  })).filter(eraData => eraData.games.length > 0);
}
```

**Example Request:**
```
GET /api/wwe/games?era=attitude&series=smackdown
```

**Example Response:**
```json
[
  {
    "id": "attitude",
    "title": "Attitude Era",
    "subtitle": "1997 - 2002",
    "description": "Nejlegendárnější éra WWE/WWF historie!...",
    "years": "1997-2002",
    "games": [
      {
        "id": "wwf-smackdown-1999",
        "title": "WWF SmackDown!",
        "year": 1999,
        "platform": "PlayStation",
        "description": "Hra, která začala legendu!...",
        "features": ["První hra série SmackDown!", ...],
        "cover": "/komplexaci/img/wwe-covers/wwf-smackdown-1999.jpg",
        "era": "attitude",
        "series": "smackdown"
      }
    ]
  }
]
```

### GET /api/wwe/game-info

Returns general information about the WWE games series.

**Query Parameters:** None

**Response Format:**
```typescript
WWEGameInfo
```

**Response Example:**
```json
{
  "title": "WWE Games",
  "description": "Kompletní kolekce WWE/WWF her od legendárního SmackDown!...",
  "basicInfo": {
    "developer": "THQ, 2K Sports, Acclaim Entertainment",
    "publisher": "THQ, 2K Sports, Acclaim Entertainment",
    "firstGame": "MicroLeague Wrestling (1987)",
    "latestGame": "WWE 2K25 (2025)",
    "genre": "Sports/Wrestling",
    "platforms": "PlayStation, Xbox, Nintendo, PC",
    "totalGames": "50+"
  },
  "legacy": {
    "title": "WWE Games Legacy",
    "description": "WWE hry představují více než 35 let vývoje...",
    "highlights": [
      "Průkopnické arkádové hry WWF Superstars a WrestleFest",
      ...
    ]
  }
}
```

---

## WWE Music Player

Location: `src/app/components/WWEMusicPlayer.tsx`

### Overview

The WWEMusicPlayer is a dedicated music player component that plays the WWF SmackDown! 2 theme song exclusively on the WWE Games page. It features intelligent auto-hide behavior, cross-page music control, and a WWE-themed UI.

### Core Features

**1. Audio Playback:**
- Single track: WWF SmackDown! 2 Theme (`/komplexaci/audio/track14.mp3`)
- Volume control with visual slider
- Auto-play on first user interaction
- Demo mode fallback if audio file unavailable

**2. Intelligent Auto-Hide:**
- Shows for 5 seconds when music starts
- Auto-hides after scrolling down for 0.1 seconds
- Auto-hides after 15 seconds of inactivity (when paused)
- Manual toggle via mini icon
- Briefly shows on track change (3 seconds)

**3. Cross-Page Music Control:**
- Stops main page KOMPG music when WWE page loads
- Pauses WWE music if main page music starts
- Uses localStorage for cross-page communication
- Respects user's music preferences

**4. Visual States:**
- `active`: Widget is visible
- `pulsating`: Music is playing (visual effect)
- `auto-hidden`: Widget minimized to mini icon
- `show-briefly`: Temporary full visibility

### State Management

```typescript
const [isPlaying, setIsPlaying] = useState(false);              // Playback state
const [currentTrack, setCurrentTrack] = useState(0);            // Always 0 (single track)
const [volume, setVolume] = useState(0.5);                      // Volume level
const [isPlayerVisible, setIsPlayerVisible] = useState(false);  // Widget visibility
const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
const [isDemoMode, setIsDemoMode] = useState(false);            // Fallback mode
const [hasUserInteracted, setHasUserInteracted] = useState(false);
const [isPlayerAutoHidden, setIsPlayerAutoHidden] = useState(false);
const [showBriefly, setShowBriefly] = useState(false);          // Temporary show
const [lastScrollY, setLastScrollY] = useState(0);              // Scroll tracking
```

### Key Functions

**togglePlay():**
Handles play/pause with demo mode fallback:
```typescript
const togglePlay = async () => {
  if (!hasUserInteracted) {
    setHasUserInteracted(true);
    setIsPlayerVisible(true);
  }

  if (isDemoMode) {
    setIsPlaying(!isPlaying);
    return;
  }

  try {
    if (isPlaying) {
      audioElement.pause();
    } else {
      await audioElement.play();
      showPlayerBriefly();
    }
    setIsPlaying(!isPlaying);
  } catch (error) {
    setIsDemoMode(true);
    setIsPlaying(!isPlaying);
  }
};
```

**togglePlayerWidget():**
Manual show/hide toggle:
```typescript
const togglePlayerWidget = () => {
  if (isPlayerVisible && !isPlayerAutoHidden) {
    // Hide widget
    setIsPlayerVisible(false);
    setIsPlayerAutoHidden(false);
  } else {
    // Show widget and clear timeouts
    setIsPlayerVisible(true);
    setIsPlayerAutoHidden(false);
  }
};
```

**showPlayerBriefly():**
Temporarily shows player for track changes:
```typescript
const showPlayerBriefly = () => {
  setIsPlayerVisible(true);
  setIsPlayerAutoHidden(false);
  setShowBriefly(true);

  setTimeout(() => {
    setShowBriefly(false);
    setIsPlayerAutoHidden(true);
  }, 4000);
};
```

### localStorage Integration

**Storage Keys:**
- `wwe-music-state`: Current WWE music state
- `kompg-music-state`: Main page music state
- `stop-main-music`: Signal to stop main page music
- `stop-wwe-music`: Signal to stop WWE music

**State Format:**
```typescript
{
  isPlaying: boolean;
  track: string;      // Track title
  page: string;       // "wwe" or "main"
  autoStart?: boolean; // Trigger auto-start
}
```

### UI Components

**Main Widget:**
```jsx
<div className="trax-widget ${isPlayerVisible} ${isPlaying} ${isPlayerAutoHidden}">
  <button className="trax-close-button">✕</button>
  <div className="trax-title">WWE Trax</div>
  <div className="trax-content">
    <div className="trax-logo">W</div>
    <div className="trax-track-info">
      <ScrollingText text={title} />
      <p className="track-debug">🎵 Track: 1/1</p>
      <ScrollingText text={artist} />
    </div>
    <div className="trax-buttons">
      <button onClick={togglePlay}>⏸️/▶️</button>
    </div>
  </div>
  <div className="volume-control">
    <input type="range" />
  </div>
</div>
```

**Mini Icon:**
```jsx
<div className="trax-mini-icon" onClick={togglePlayerWidget}>
  🎵
</div>
```

**Auto-play Hint:**
```jsx
{!hasUserInteracted && (
  <div className="fixed bottom-24 right-6 animate-bounce">
    Klikni pro SmackDown! 2 hudbu
  </div>
)}
```

### ScrollingText Component

Automatically scrolls text that exceeds container width:

```typescript
const ScrollingText = ({ text, className, maxWidth = 150 }) => {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const textWidth = textRef.current.scrollWidth;
    setIsScrolling(textWidth > maxWidth);
  }, [text, maxWidth]);

  return (
    <div style={{ width: maxWidth, overflow: 'hidden' }}>
      <div style={{
        animation: isScrolling ? 'scroll-text 8s linear infinite' : 'none'
      }}>
        {text}
      </div>
    </div>
  );
};
```

---

## Styling System

Location: `src/app/wwe-games/wwe.module.css`

### Design Philosophy

The styling is inspired by **WWF SmackDown! 2** (2000) aesthetic:
- Industrial 2000s visual design
- Blue/cyan color scheme (Steel Blue, Cornflower Blue)
- Arena spotlight effects
- Holographic borders on hover
- Scanline effects
- Futuristic typography

### Color Palette

```css
/* Primary Colors */
Steel Blue:      #4682b4  /* Main theme color */
Cornflower Blue: #6495ed  /* Highlights */
Sky Blue:        #87ceeb  /* Accents */
Cyan:            #00ffff  /* Holographic effects */
Magenta:         #ff00ff  /* Holographic effects */

/* Background Gradients */
Dark backgrounds: rgba(15, 20, 30, 0.95) to rgba(45, 55, 80, 0.98)
```

### Key Style Classes

**Hero Section:**

```css
.heroSection {
  position: relative;
  background: linear-gradient(135deg,
    rgba(10, 10, 15, 0.95),
    rgba(20, 25, 35, 0.9)
  );
}

.heroSection::after {
  /* Arena spotlight effects */
  background: radial-gradient(
    ellipse 800px 400px at 20% 30%,
    rgba(70, 130, 180, 0.12) 0%,
    transparent 70%
  );
  animation: arenaLighting 15s ease-in-out infinite;
}

.heroSection::before {
  /* Industrial scanlines */
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(70, 130, 180, 0.02) 3px,
    rgba(70, 130, 180, 0.02) 4px
  );
  animation: industrialScan 0.2s linear infinite;
}
```

**Text Styling:**

```css
.textGradient {
  font-size: 1.8rem;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  color: #6495ed;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.textGlow {
  animation: simpleTextGlow 2.5s ease-in-out infinite;
  text-shadow:
    3px 3px 6px rgba(0,0,0,0.9),
    0 0 20px rgba(59, 130, 246, 0.6);
}
```

**Game Cards:**

```css
.gameCard {
  background: linear-gradient(145deg,
    rgba(15, 20, 30, 0.95) 0%,
    rgba(35, 45, 65, 0.95) 40%,
    rgba(45, 55, 80, 0.98) 60%
  );
  border-radius: 30px;
  border: 3px solid rgba(70, 130, 180, 0.3);
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.9),
    0 0 30px rgba(70, 130, 180, 0.2);
  backdrop-filter: blur(15px);
}

.gameCard::after {
  /* Diagonal pattern overlay */
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 18px,
    rgba(70, 130, 180, 0.02) 18px,
    rgba(70, 130, 180, 0.02) 19px
  );
  animation: cardPattern 25s linear infinite;
}

.cardHover:hover {
  transform: translateY(-15px) scale(1.03);
  box-shadow:
    0 25px 60px rgba(70, 130, 180, 0.3),
    0 0 40px rgba(70, 130, 180, 0.15);
  border-color: #4682b4;
}
```

**Game Cover Styling:**

```css
.gameCoverContainer {
  width: 210px;
  border-radius: 25px;
  border: 4px solid rgba(0, 255, 255, 0.5);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(0, 255, 255, 0.4),
    0 0 20px rgba(255, 0, 255, 0.3);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.gameCoverContainer::before {
  /* Holographic border - shown on hover */
  background: linear-gradient(45deg,
    #00ffff 0%, #0099ff 20%, #ff00ff 40%,
    #ff0099 60%, #00ffff 80%, #0099ff 100%
  );
  background-size: 400% 400%;
  animation: holoBorder 6s ease-in-out infinite;
  opacity: 0;
}

.imageReveal:hover .gameCoverContainer {
  transform: scale(1.2) rotateY(15deg) rotateX(10deg) translateZ(60px);
  box-shadow:
    0 50px 150px rgba(0, 255, 255, 0.7),
    0 0 80px rgba(255, 0, 255, 0.5);
}

.imageReveal:hover .gameCoverContainer::before {
  opacity: 1;
}
```

**Era Dividers:**

```css
.eraDivider::before {
  /* Glowing line through center */
  height: 4px;
  background: linear-gradient(90deg,
    transparent,
    rgba(0, 255, 255, 0.8),
    rgba(255, 0, 255, 0.8),
    rgba(0, 255, 255, 0.8),
    transparent
  );
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.6),
    0 0 40px rgba(255, 0, 255, 0.4);
  animation: lineGlow 3s ease-in-out infinite;
}

.eraTitle {
  display: inline-block;
  background: linear-gradient(145deg,
    rgba(15, 20, 30, 0.98) 0%,
    rgba(45, 55, 80, 1) 45%
  );
  padding: 15px 30px;
  border-radius: 20px;
  border: 2px solid rgba(70, 130, 180, 0.5);
  backdrop-filter: blur(20px);
  z-index: 2;
}
```

**Filter Section:**

```css
.filterSelect {
  background: linear-gradient(145deg, #0f1419 0%, #1a1a2e 100%);
  border: 1px solid rgba(110, 79, 246, 0.3);
  border-radius: 8px;
  padding: 12px 15px;
  color: #e0e0e0;
  transition: all 0.3s ease;
}

.filterSelect:hover {
  border-color: #6e4ff6;
  box-shadow: 0 0 10px rgba(110, 79, 246, 0.3);
}

.filterResetBtn {
  background: linear-gradient(145deg, #ff4757 0%, #ff3742 100%);
  border-radius: 8px;
  padding: 12px 20px;
  transition: all 0.3s ease;
}

.filterResetBtn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 71, 87, 0.4);
}
```

### Animations

**Arena Lighting:**
```css
@keyframes arenaLighting {
  0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
  25% { opacity: 0.8; transform: scale(1.1) rotate(1deg); }
  50% { opacity: 0.7; transform: scale(0.95) rotate(-1deg); }
  75% { opacity: 0.9; transform: scale(1.05) rotate(0.5deg); }
}
```

**Holographic Border:**
```css
@keyframes holoBorder {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

**Card Pattern:**
```css
@keyframes cardPattern {
  0% { transform: translate(0, 0); }
  100% { transform: translate(15px, 15px); }
}
```

**Text Glow:**
```css
@keyframes simpleTextGlow {
  0%, 100% {
    text-shadow:
      3px 3px 6px rgba(0,0,0,0.9),
      0 0 20px rgba(59, 130, 246, 0.6);
  }
  50% {
    text-shadow:
      3px 3px 6px rgba(0,0,0,0.9),
      0 0 35px rgba(59, 130, 246, 0.9),
      0 0 50px rgba(147, 51, 234, 0.5);
  }
}
```

### Responsive Breakpoints

```css
/* Mobile (max-width: 768px) */
- Font sizes reduced (1.8rem → 1.5rem)
- Game covers: 210px → 160px
- Grid gap: 2rem → 1.5rem

/* Small mobile (max-width: 480px) */
- Font sizes further reduced (1.5rem → 1.3rem)
- Game covers: 160px → 140px
- Grid gap: 1.5rem → 1rem
- Letter spacing reduced

/* Tablet (min-width: 768px) */
- Double/triple grids: 1 column → 2 columns

/* Desktop (min-width: 1024px) */
- Triple grid: 2 columns → 3 columns
```

---

## Adding New Games

### Step 1: Prepare Game Assets

1. **Cover Image:**
   - Format: JPG or WebP
   - Recommended size: 300x450px (cover art aspect ratio)
   - Location: `/public/komplexaci/img/wwe-covers/`
   - Naming: `game-name-year.jpg` (e.g., `wwe-2k26-2026.jpg`)

2. **Game Information:**
   - Title, year, platform
   - Detailed description (2-3 sentences)
   - 4-6 key features
   - Era classification
   - Series classification

### Step 2: Edit API Endpoint

Location: `src/app/api/wwe/games/route.ts`

1. **Find the appropriate era** in `wweErasData` array
2. **Add new game object** to the `games` array:

```typescript
{
  id: 'wwe-2k26-2026',  // Unique ID: lowercase, hyphenated
  title: 'WWE 2K26',     // Display title
  year: 2026,            // Release year
  platform: 'Multi-Platform', // Platform(s)
  description: 'Game description highlighting key features and context...',
  features: [
    'Feature 1',
    'Feature 2',
    'Feature 3',
    'Feature 4'
  ],
  cover: '/komplexaci/img/wwe-covers/wwe-2k26-2026.jpg', // Path to cover
  era: 'renaissance',    // Era ID (must match parent era)
  series: '2k'           // Series classification
}
```

### Step 3: Update Era if Needed

If adding a new era:

```typescript
{
  id: 'new-era-id',      // Unique era ID
  title: 'New Era Name', // Display name
  subtitle: '2026 - present', // Year range
  description: 'Detailed era description...',
  years: '2026-present',
  games: [
    // Game objects here
  ]
}
```

### Step 4: Update Filters (if needed)

If adding a new era or series, update filter options in `page.tsx`:

```tsx
{/* Era filter */}
<option value="new-era-id">New Era Name</option>

{/* Series filter */}
<option value="new-series">New Series Name</option>
```

### Step 5: Update Game Info

Location: `src/app/api/wwe/game-info/route.ts`

Update basic info:

```typescript
basicInfo: {
  latestGame: "WWE 2K26 (2026)",  // Update latest game
  totalGames: "51+",              // Update total count
  // ... other fields
}
```

### Example: Adding WWE 2K26

**File: `src/app/api/wwe/games/route.ts`**

```typescript
{
  id: 'renaissance',
  title: 'Renaissance Era',
  subtitle: '2023 - present',
  description: 'Renaissance Era with Triple H as Head of Creative!...',
  years: '2023-present',
  games: [
    // ... existing games
    {
      id: 'wwe-2k26-2026',
      title: 'WWE 2K26',
      year: 2026,
      platform: 'Multi-Platform',
      description: 'The next evolution of WWE gaming with revolutionary new features including enhanced MyRISE storylines, expanded MyFACTION modes, and the most realistic wrestling simulation ever created. Features CM Punk\'s return and the new era of WWE programming.',
      features: [
        'CM Punk cover star',
        'Enhanced MyRISE mode',
        'Expanded MyFACTION',
        'Most realistic simulation',
        'New WWE programming era',
        'Revolutionary features'
      ],
      cover: '/komplexaci/img/wwe-covers/wwe-2k26-2026.jpg',
      era: 'renaissance',
      series: '2k'
    }
  ]
}
```

### Step 6: Test

1. Start development server: `npm run dev`
2. Navigate to `/wwe-games`
3. Verify new game appears in correct era
4. Test filters to ensure game appears correctly
5. Check responsive layout on mobile
6. Verify cover image loads properly

### Best Practices

1. **Descriptions:**
   - First sentence: Game's significance
   - Second sentence: Current era context
   - Third sentence: Key features/innovations

2. **Features:**
   - Keep to 4-6 features
   - Mix factual and historical information
   - Include cover star, era context, and key innovations

3. **Era Classification:**
   - Golden: 1984-1993
   - New Generation: 1993-1997
   - Attitude: 1997-2002
   - Ruthless: 2002-2008
   - PG: 2008-2014
   - Reality: 2014-2016
   - New Era: 2016-2021
   - Post-COVID: 2021-2023
   - Renaissance: 2023-present

4. **Series Classification:**
   - Use existing series when possible
   - Create new series only for genuinely distinct game lines
   - Update filter UI if adding new series

---

## SEO and Metadata

### Page Metadata

Location: `src/app/wwe-games/layout.tsx`

**Title:** "WWE Games | Komplexaci"

**Description:** "Kompletní kolekce WWE/WWF wrestlingových her - od klasických arkádových her až po moderní WWE 2K série. Objevte historii wrestlingových videoher."

**Keywords:** WWE, WWF, wrestling, hry, videohry, 2K, SmackDown, WrestleMania, Komplexaci

### Open Graph Tags

```typescript
openGraph: {
  title: "WWE Games | Komplexaci",
  description: "Kompletní kolekce WWE/WWF wrestlingových her...",
  url: "https://www.komplexaci.cz/wwe-games",
  siteName: "Komplexáci",
  images: [
    {
      url: "/komplexaci/img/wwe-main.jpg",
      width: 1200,
      height: 630,
      alt: "WWE Games Collection",
    },
  ],
  locale: "cs_CZ",
  type: "website",
}
```

### Twitter Card

```typescript
twitter: {
  card: "summary_large_image",
  title: "WWE Games | Komplexaci",
  description: "Kompletní kolekce WWE/WWF wrestlingových her...",
  images: ["/komplexaci/img/wwe-main.jpg"],
}
```

### Structured Data (JSON-LD)

**1. VideoGameSeries Schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "VideoGameSeries",
  "name": "WWE Games Collection",
  "description": "Kompletní kolekce WWE/WWF wrestlingových her...",
  "url": "https://www.komplexaci.cz/wwe-games",
  "genre": ["Sports", "Wrestling", "Fighting", "Simulation"],
  "gamePlatform": ["PlayStation", "Xbox", "PC", "Nintendo"],
  "publisher": [
    { "@type": "Organization", "name": "2K Sports" },
    { "@type": "Organization", "name": "THQ" },
    { "@type": "Organization", "name": "Acclaim Entertainment" }
  ],
  "gameItem": [
    { "@type": "VideoGame", "name": "WWE SmackDown! Here Comes the Pain" },
    { "@type": "VideoGame", "name": "WWE No Mercy" },
    // ... more games
  ]
}
```

**2. WebPage Schema with Breadcrumbs:**

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "WWE Games | Komplexaci",
  "url": "https://www.komplexaci.cz/wwe-games",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Domů",
        "item": "https://www.komplexaci.cz"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "WWE Games",
        "item": "https://www.komplexaci.cz/wwe-games"
      }
    ]
  }
}
```

**3. SportsTeam Schema:**

```json
{
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  "name": "Komplexáci",
  "description": "Česká herní komunita specializující se na wrestling hry...",
  "url": "https://www.komplexaci.cz",
  "sport": ["Video Gaming", "Esports", "Wrestling Games"]
}
```

---

## Technical Notes

### Performance Optimizations

1. **Parallel API Requests:**
   - Games and game info fetched simultaneously using `Promise.all()`
   - Reduces initial load time

2. **Image Optimization:**
   - Next.js Image component with `unoptimized` flag for external images
   - WebP format for hero screenshots (VGTimes CDN)
   - Lazy loading for game covers

3. **CSS Animations:**
   - GPU-accelerated transforms
   - RequestAnimationFrame for smooth scrolling
   - Optimized keyframe animations

4. **Audio Management:**
   - Single audio element reused across tracks
   - Preload set to 'auto'
   - Demo mode fallback prevents errors

### Browser Compatibility

- **Modern browsers:** Full support (Chrome, Firefox, Safari, Edge)
- **Audio autoplay:** Requires user interaction (handled via click detection)
- **CSS features:** Grid, Flexbox, CSS variables, backdrop-filter
- **JavaScript:** ES6+ features, async/await, localStorage

### Accessibility Considerations

1. **Semantic HTML:** Proper heading hierarchy, section elements
2. **Alt text:** All images include descriptive alt attributes
3. **Keyboard navigation:** All interactive elements keyboard accessible
4. **Color contrast:** Text meets WCAG AA standards
5. **Screen readers:** Structured data aids navigation

### Known Limitations

1. **Single Track:** Music player currently supports only one track
2. **Filter Persistence:** Filters reset on page reload
3. **Mobile Hover:** Some hover effects disabled on touch devices
4. **Audio Autoplay:** Browsers require user gesture for audio playback

---

## Troubleshooting

### Games Not Displaying

**Check:**
1. API endpoint returning data: `http://localhost:3000/api/wwe/games`
2. Console for errors in network tab
3. Era/series filters match data structure
4. Image paths are correct

**Solution:**
```bash
# Verify API response
curl http://localhost:3000/api/wwe/games

# Check for TypeScript errors
npm run type-check
```

### Music Player Not Working

**Check:**
1. Audio file exists at `/public/komplexaci/audio/track14.mp3`
2. Console for audio playback errors
3. Browser autoplay policy (requires user interaction)
4. Volume is not muted

**Solution:**
- Player automatically falls back to demo mode if audio unavailable
- Click anywhere on page to trigger autoplay
- Check browser console for specific error messages

### Styling Issues

**Check:**
1. CSS module imported correctly in component
2. Class names use camelCase (not kebab-case)
3. CSS variables defined in parent scope
4. No conflicting global styles

**Solution:**
```tsx
// Correct CSS module usage
import styles from './wwe.module.css';

<div className={styles.gameCard}>...</div>
```

### Filter Not Working

**Check:**
1. Filter state updating correctly
2. API endpoint receives correct query parameters
3. Response contains expected data
4. Era/series IDs match exactly (case-sensitive)

**Solution:**
```typescript
// Debug filter state
console.log('Selected era:', selectedEra);
console.log('Selected series:', selectedSeries);
console.log('API URL:', `/api/wwe/games?era=${selectedEra}&series=${selectedSeries}`);
```

---

## Future Enhancements

### Potential Features

1. **Game Detail Pages:**
   - Individual pages for each game
   - Screenshots gallery
   - Video trailers
   - User reviews

2. **Advanced Filtering:**
   - Platform filter
   - Year range filter
   - Search functionality
   - Sort options (by year, rating, alphabetical)

3. **User Features:**
   - Favorite games
   - Personal collection tracking
   - User ratings and reviews
   - Comment system

4. **Music Player Enhancements:**
   - Full WWE game soundtrack playlist
   - Track selection menu
   - Playlist management
   - Shuffle and repeat modes

5. **Visual Enhancements:**
   - Video backgrounds
   - Parallax scrolling effects
   - 3D card flips
   - Timeline view of game history

6. **Data Enhancements:**
   - Roster information
   - Match types available
   - Create-a-wrestler features
   - Achievement/trophy lists

### Technical Improvements

1. **Performance:**
   - Image CDN integration
   - Virtual scrolling for large lists
   - Progressive image loading
   - Service worker caching

2. **SEO:**
   - Individual game schema markup
   - Sitemap generation
   - Canonical URLs for filters
   - Rich snippets

3. **Accessibility:**
   - ARIA labels for all interactive elements
   - Keyboard shortcuts
   - High contrast mode
   - Screen reader optimizations

---

## Developer Reference

### File Locations Quick Reference

```
Component Files:
├── src/app/wwe-games/page.tsx
├── src/app/wwe-games/layout.tsx
├── src/app/wwe-games/wwe.module.css
└── src/app/wwe-games/README.md (this file)

Type Definitions:
└── src/app/types/wwe.ts

API Endpoints:
├── src/app/api/wwe/games/route.ts
└── src/app/api/wwe/game-info/route.ts

Components:
├── src/app/components/WWEMusicPlayer.tsx
├── src/app/components/AnimatedSection.tsx
├── src/app/components/SmartGrid.tsx
└── src/app/components/Header.tsx

Assets:
├── public/komplexaci/img/wwe-covers/
├── public/komplexaci/audio/track14.mp3
└── public/komplexaci/img/wwe-main.jpg
```

### Command Reference

```bash
# Development
npm run dev              # Start development server
npm run build            # Build production bundle
npm run type-check       # Check TypeScript types
npm run lint             # Run ESLint

# Testing
curl http://localhost:3000/api/wwe/games
curl http://localhost:3000/api/wwe/game-info
curl "http://localhost:3000/api/wwe/games?era=attitude&series=smackdown"
```

### Code Style Guidelines

1. **TypeScript:**
   - Use interfaces for data structures
   - Explicit return types for functions
   - Avoid `any` type

2. **React:**
   - Functional components with hooks
   - Props destructuring
   - Clear component names

3. **CSS:**
   - CSS Modules for scoped styles
   - BEM-like naming for global styles
   - Mobile-first responsive design

4. **Comments:**
   - JSDoc for functions
   - Inline comments for complex logic
   - Section headers for organization

---

## Version History

**Current Version:** 1.0.0

### Changelog

**v1.0.0 (2025-01-30)**
- Initial release
- 50+ games across 9 WWE eras
- Era and series filtering
- WWE Music Player with SmackDown! 2 theme
- SmackDown!-inspired styling
- Responsive layout
- SEO optimization with structured data

---

## Contact & Support

For questions or issues related to the WWE Games feature:

**Documentation Author:** Claude (Anthropic)
**Created:** January 30, 2025
**Project:** Komplexaci Gaming Community Website
**Repository:** komplexaci_js

---

## License & Credits

**WWE/WWF Trademarks:**
All WWE/WWF game titles, logos, and related content are trademarks of World Wrestling Entertainment, Inc.

**Game Publishers:**
- THQ (1999-2013)
- 2K Sports (2013-present)
- Acclaim Entertainment (1989-2002)
- AKI Corporation (1998-2005)

**Music:**
WWF SmackDown! 2 Theme - © THQ/Yuke's

**Development:**
- Next.js Framework
- React
- TypeScript
- CSS Modules

This documentation is part of the Komplexaci project and intended for developer reference.
