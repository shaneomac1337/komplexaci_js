# Source Code Organization

This directory contains all source code for the Komplexaci application.

## Directory Structure

```
src/
├── app/                    # Next.js App Router (pages, API, components)
├── lib/                    # Server-side library code
├── hooks/                  # Shared React hooks
└── data/                   # Static data files
```

---

## app/

Next.js App Router directory. Contains all pages, API routes, and app-specific code.

### Pages (Route Segments)

| Directory | Route | Description |
|-----------|-------|-------------|
| `page.tsx` | `/` | Homepage with member cards, audio player |
| `league-of-legends/` | `/league-of-legends` | LoL champion database, summoner search |
| `cs2/` | `/cs2` | CS2 weapons and maps |
| `wwe-games/` | `/wwe-games` | WWE games collection |
| `videotvorba/` | `/videotvorba` | YouTube video gallery |
| `admin/` | `/admin` | Admin dashboard (protected) |
| `auth/signin/` | `/auth/signin` | Discord OAuth sign-in |

### API Routes

| Directory | Base Path | Description |
|-----------|-----------|-------------|
| `api/discord/` | `/api/discord/*` | Discord server integration |
| `api/lol/` | `/api/lol/*` | Riot Games API proxy |
| `api/cs2/` | `/api/cs2/*` | CS2 game data |
| `api/wwe/` | `/api/wwe/*` | WWE games data |
| `api/analytics/` | `/api/analytics/*` | Analytics system |
| `api/music/` | `/api/music/*` | Audio management |
| `api/auth/` | `/api/auth/*` | NextAuth handlers |
| `api/debug/` | `/api/debug/*` | Debug endpoints |
| `api/health*` | `/api/health*` | Health checks |

### Shared App Code

| Directory | Purpose |
|-----------|---------|
| `components/` | Shared React components |
| `hooks/` | App-specific React hooks |
| `types/` | TypeScript type definitions |
| `contexts/` | React Context providers |
| `utils/` | Utility functions |

---

## lib/

Server-side library code. Not bundled for client.

| File/Directory | Purpose |
|----------------|---------|
| `discord-gateway.ts` | Discord WebSocket service (singleton) |
| `discord-startup.ts` | Gateway initialization |
| `discord-avatar-utils.ts` | Avatar URL utilities |
| `supabase.ts` | Supabase client configuration |
| `analytics/` | Analytics system module |

### analytics/

SQLite-based analytics tracking system.

| File | Purpose |
|------|---------|
| `database.ts` | SQLite operations, schema, CRUD methods |
| `service.ts` | Business logic, session management |
| `index.ts` | Module exports, initialization |

---

## Import Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Usage Examples

```typescript
// From any file in the project
import { getDiscordGateway } from '@/lib/discord-gateway';
import { getAnalyticsDatabase } from '@/lib/analytics/database';
import { Header } from '@/app/components/Header';
import type { Weapon } from '@/app/types/cs2';
```

---

## Client vs Server Components

Next.js 15 uses React Server Components by default.

### Server Components (Default)

- Can access server-side resources directly
- Can use `async/await` at component level
- Cannot use React hooks or browser APIs
- Better for data fetching and static content

```typescript
// app/page.tsx (Server Component by default)
export default async function Page() {
  const data = await fetchData();  // Direct server fetch
  return <div>{data}</div>;
}
```

### Client Components

Add `"use client"` directive when you need:
- React hooks (useState, useEffect, useRef, etc.)
- Browser APIs (window, document, localStorage)
- Event handlers (onClick, onChange, etc.)
- Third-party client libraries

```typescript
// app/components/InteractiveWidget.tsx
"use client";

import { useState } from 'react';

export function InteractiveWidget() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

---

## Type Definitions

### Location Guide

| Types For | Location |
|-----------|----------|
| CS2 (weapons, maps) | `app/types/cs2.ts` |
| WWE (games, eras) | `app/types/wwe.ts` |
| Riot API responses | `app/api/lol/types/summoner.ts` |
| Champion data | `app/league-of-legends/types/lol.ts` |
| Analytics | `lib/analytics/database.ts` (exported interfaces) |
| Discord | `lib/discord-gateway.ts` (CachedMember, ServerStats) |

### Key Interfaces

```typescript
// Analytics types (from lib/analytics/database.ts)
interface UserStats {
  user_id: string;
  daily_online_minutes: number;
  daily_voice_minutes: number;
  // ... more fields
}

interface GameSession {
  id?: number;
  user_id: string;
  game_name: string;
  start_time: string;
  status: 'active' | 'ended' | 'stale';
  // ... more fields
}

// Discord types (from lib/discord-gateway.ts)
interface CachedMember {
  id: string;
  username: string;
  displayName: string;
  status: string;
  activities: Activity[];
  voice: { channel: {...} | null; streaming: boolean; } | null;
  // ... more fields
}
```

---

## Component Patterns

### Shared Components (`app/components/`)

General-purpose components used across multiple pages.

| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Navigation with scroll spy |
| `DiscordServerStats.tsx` | Real-time server statistics |
| `MostActiveMembers.tsx` | Activity leaderboard |
| `DailyAwards.tsx` | Achievement display |
| `AnimatedSection.tsx` | Scroll-triggered animations |
| `SafeImage.tsx`, `LazyImage.tsx` | Image loading utilities |

### Page-Specific Components

Located within page directories for encapsulation.

```
league-of-legends/
└── components/
    ├── SummonerSearch.tsx
    ├── ChampionMastery.tsx
    ├── LiveGame.tsx
    └── MatchHistory.tsx
```

---

## Data Flow Patterns

### Server Data Fetching

```typescript
// In Server Component or Route Handler
import { getAnalyticsDatabase } from '@/lib/analytics/database';

const db = getAnalyticsDatabase();
const stats = db.getUserStats(userId);
```

### Client Data Fetching

```typescript
// In Client Component
"use client";

import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/analytics/status')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{data ? 'Loaded' : 'Loading...'}</div>;
}
```

### Singleton Services

```typescript
// Discord Gateway (server-side only)
import { getDiscordGateway } from '@/lib/discord-gateway';

// Returns same instance across all calls
const gateway = getDiscordGateway();
```

---

## Styling Approach

### Global Styles

- `app/globals.css` - Base styles, CSS variables
- `komplexaci.css` - Legacy shared styles (large file)
- `low-performance.css` - Reduced animation mode

### CSS Modules

Page-specific scoped styles:

```
app/
├── league-of-legends/lol.module.css
├── cs2/cs2.module.css
└── wwe-games/wwe.module.css
```

Usage:
```typescript
import styles from './page.module.css';

<div className={styles.container}>
```

### Tailwind CSS

Utility classes for layout and common styling:

```typescript
<div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
```

---

## Related Documentation

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [API.md](../docs/API.md) - API reference
- [lib/analytics/README.md](./lib/analytics/README.md) - Analytics system
