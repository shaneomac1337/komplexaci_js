# Contributing to Komplexaci

Thank you for your interest in contributing to the Komplexaci gaming community website. This document provides guidelines and standards for contributing to the project.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Architecture](#project-architecture)
- [Code Style Guidelines](#code-style-guidelines)
- [Git Workflow](#git-workflow)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)
- [Documentation Standards](#documentation-standards)
- [Common Patterns](#common-patterns)

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest stable version
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shaneomac1337/komplexaci_js.git
   cd komplexaci_js
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with required credentials:
   ```bash
   # Required - Riot Games API
   RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

   # Required - Discord Bot
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_SERVER_ID=your_server_id

   # Required - NextAuth
   NEXTAUTH_SECRET=random_32_char_string
   NEXTAUTH_URL=http://localhost:3000

   # Optional - Supabase
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=your_anon_key

   # Optional - Debug
   RIOT_API_DEBUG=true
   ENABLE_DISCORD_GATEWAY=true
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

5. **Verify setup:**
   - Check that the homepage loads correctly
   - Verify Discord integration is working (if credentials provided)
   - Run linting: `npm run lint`

## Project Architecture

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (50+ endpoints)
│   │   ├── discord/         # Discord server stats
│   │   ├── lol/             # Riot Games API integration
│   │   ├── cs2/             # CS2 game data
│   │   ├── wwe/             # WWE games data
│   │   ├── analytics/       # Analytics endpoints
│   │   ├── music/           # Audio management
│   │   └── auth/            # NextAuth handlers
│   │
│   ├── league-of-legends/   # LoL section with components
│   ├── cs2/                 # CS2 section
│   ├── wwe-games/           # WWE section
│   ├── videotvorba/         # YouTube content
│   ├── admin/               # Admin dashboard
│   │
│   ├── components/          # Shared components
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── contexts/            # React Context providers
│
├── lib/                     # Server-side utilities
│   ├── discord-gateway.ts   # Discord WebSocket service
│   ├── analytics/           # Analytics system
│   │   ├── database.ts     # SQLite operations
│   │   └── service.ts      # Business logic
│   └── supabase.ts         # Supabase client
│
└── data/                    # Static data files
    └── playlist.json       # Audio tracks

data/                        # Runtime data (gitignored)
└── analytics.db            # SQLite database
```

### Key Architectural Principles

1. **Server Components First**: Default to React Server Components. Only use Client Components when necessary.
2. **API Route Handlers**: All external API calls go through Next.js API routes, never directly from client.
3. **Type Safety**: Strict TypeScript mode enforced throughout.
4. **Path Aliases**: Use `@/` imports for cleaner module resolution.
5. **Singleton Services**: Discord Gateway and Analytics Database use singleton pattern.

## Code Style Guidelines

### TypeScript Standards

#### Type Definitions

**DO:**
```typescript
// Use explicit return types for functions
export async function getSummonerProfile(
  gameName: string,
  tagLine: string,
  region: string
): Promise<SummonerProfile> {
  // implementation
}

// Use interfaces for object shapes
interface SummonerProfile {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerLevel: number;
}

// Use type for unions and utility types
type Region = 'euw1' | 'eun1' | 'na1' | 'kr';
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
```

**DON'T:**
```typescript
// Don't use 'any'
function processData(data: any) { }

// Don't omit return types on exported functions
export async function getData() { }

// Don't use enums (prefer string unions)
enum Region { EUW1, NA1 }
```

#### Strict Mode Compliance

The project uses `"strict": true` in `tsconfig.json`. All code must:
- Not use implicit `any` types
- Handle null/undefined explicitly
- Use proper type guards for narrowing
- Define all properties in interfaces/types

#### Import Organization

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. Internal absolute imports (using @/ alias)
import { Header } from '@/app/components/Header';
import { getDiscordGateway } from '@/lib/discord-gateway';

// 3. Relative imports (if needed)
import { GameCard } from './components/GameCard';

// 4. Type imports (separate)
import type { NextRequest } from 'next/server';
import type { SummonerProfile } from '@/app/api/lol/types/summoner';

// 5. Styles
import styles from './page.module.css';
```

### React Component Standards

#### Server vs Client Components

**Server Components (default):**
```typescript
// No directive needed - server component by default
import { getServerSession } from 'next-auth';

export default async function ProfilePage() {
  const session = await getServerSession();

  return (
    <div>
      <h1>Profile</h1>
      {/* ... */}
    </div>
  );
}
```

**Client Components (when needed):**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function InteractiveCard() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Browser API usage
  }, []);

  return (
    <div onClick={() => setIsOpen(!isOpen)}>
      {/* ... */}
    </div>
  );
}
```

**Use Client Components only when you need:**
- React hooks (`useState`, `useEffect`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Event handlers (`onClick`, `onChange`, etc.)
- Third-party libraries that require client-side rendering

#### Component Structure

```typescript
'use client'; // Only if needed

import { useState } from 'react';
import type { ComponentProps } from './types';

// 1. Type definitions
interface CardProps {
  title: string;
  description?: string;
  onClick?: () => void;
}

// 2. Component definition
export function Card({ title, description, onClick }: CardProps) {
  // 3. Hooks
  const [isHovered, setIsHovered] = useState(false);

  // 4. Event handlers
  const handleClick = () => {
    onClick?.();
  };

  // 5. Render helpers (if complex)
  const renderDescription = () => {
    if (!description) return null;
    return <p>{description}</p>;
  };

  // 6. JSX return
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2>{title}</h2>
      {renderDescription()}
    </div>
  );
}
```

#### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile`, `GameCard`)
- **Files**: Match component name (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useIntersectionObserver`)
- **Utilities**: camelCase (e.g., `formatDate`, `calculateWinRate`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `SummonerProfile`, `ApiResponse`)

### API Route Standards

#### Route Handler Structure

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/app/types/api';

// GET handler
export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // 2. Fetch data
    const data = await fetchUserData(userId);

    // 3. Return response
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process request
    const result = await createUser(body);

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Error Handling

```typescript
// Always use try-catch in API routes
export async function GET(request: NextRequest) {
  try {
    // API logic
  } catch (error) {
    // Log the full error for debugging
    console.error('Detailed error:', error);

    // Return user-friendly error message
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// Handle specific error cases
try {
  const response = await fetch(externalApi);

  if (!response.ok) {
    if (response.status === 404) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }
    throw new Error(`API error: ${response.status}`);
  }

} catch (error) {
  // Handle error
}
```

### CSS and Styling Standards

#### Tailwind CSS Usage

**DO:**
```tsx
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
  <h2 className="text-xl font-bold text-white">Title</h2>
</div>

// Group related utilities logically
<button className="
  px-4 py-2
  bg-blue-600 hover:bg-blue-700
  text-white font-semibold
  rounded-md
  transition-colors duration-200
">
  Click me
</button>
```

**DON'T:**
```tsx
// Don't use inline styles (except for dynamic values)
<div style={{ padding: '16px' }}>Content</div>

// Don't create unnecessary wrapper divs
<div className="flex">
  <div className="items-center">
    <span>Text</span>
  </div>
</div>
```

#### CSS Modules

When Tailwind is insufficient, use CSS Modules:

```typescript
// Component.module.css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

```typescript
// Component.tsx
import styles from './Component.module.css';

export function Component() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Content */}
      </div>
    </div>
  );
}
```

### Performance Best Practices

#### Image Optimization

```typescript
import Image from 'next/image';

// Always use Next.js Image component
<Image
  src="/images/logo.png"
  alt="Komplexaci Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>

// For remote images (configured in next.config.ts)
<Image
  src="https://cdn.discordapp.com/avatars/..."
  alt="User Avatar"
  width={48}
  height={48}
  loading="lazy"
/>
```

#### Dynamic Imports

```typescript
// For heavy client components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // Disable SSR if component uses browser APIs
});

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
    </div>
  );
}
```

#### Memoization

```typescript
'use client';

import { useMemo, useCallback } from 'react';

export function DataTable({ data }: { data: Item[] }) {
  // Memoize expensive calculations
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.score - b.score);
  }, [data]);

  // Memoize callbacks passed to children
  const handleItemClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <div>
      {sortedData.map(item => (
        <ItemRow key={item.id} item={item} onClick={handleItemClick} />
      ))}
    </div>
  );
}
```

## Git Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `style/` - CSS/styling changes
- `perf/` - Performance improvements
- `test/` - Adding or updating tests

**Examples:**
```bash
feature/discord-rich-presence
fix/analytics-session-tracking
refactor/riot-api-service
docs/contributing-guidelines
style/responsive-navigation
perf/image-lazy-loading
```

### Commit Message Guidelines

#### Format

```
<type>: <subject>

[optional body]

[optional footer]
```

#### Types

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `style` - Styling changes
- `docs` - Documentation
- `perf` - Performance improvement
- `test` - Tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes

#### Examples

**Good:**
```
feat: Add live game detection for League of Legends

Implement real-time game tracking using Riot API's spectator endpoint.
Includes participant info, champion data, and game duration.

Closes #42
```

```
fix: Resolve Discord gateway connection timeout

Increase WebSocket connection timeout from 30s to 60s to prevent
premature disconnections on slower networks.
```

```
refactor: Extract champion mastery logic to separate service

Move champion mastery calculations from component to dedicated
service for better reusability and testability.
```

**Bad:**
```
fixed stuff
```

```
updates
```

```
cleanup
```

### Workflow Steps

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "feat: Add new feature"
   ```

3. **Keep your branch updated:**
   ```bash
   git fetch origin
   git rebase origin/master
   ```

4. **Push to remote:**
   ```bash
   git push origin feature/new-feature
   ```

5. **Create a Pull Request** via GitHub

### Before Committing

Always run these checks:

```bash
# Lint your code
npm run lint

# Build to check for errors
npm run build

# Verify the app runs
npm run dev
```

## Testing Requirements

### Manual Testing Checklist

Since the project currently uses manual testing, ensure the following before submitting a PR:

#### General
- [ ] Application builds without errors (`npm run build`)
- [ ] No ESLint errors or warnings (`npm run lint`)
- [ ] No TypeScript errors
- [ ] Application runs in development mode (`npm run dev`)
- [ ] All environment variables documented if added

#### Functionality
- [ ] New features work as expected
- [ ] Existing features not broken by changes
- [ ] Edge cases considered and handled
- [ ] Error states display appropriate messages

#### UI/UX
- [ ] Changes look correct on desktop (1920x1080, 1366x768)
- [ ] Changes look correct on tablet (768px width)
- [ ] Changes look correct on mobile (375px width)
- [ ] Animations are smooth (60fps)
- [ ] Loading states implemented for async operations
- [ ] Hover/focus states work correctly

#### Performance
- [ ] No console errors in browser
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Images optimized and properly sized
- [ ] No unnecessary re-renders (React DevTools Profiler)

#### Accessibility
- [ ] Semantic HTML used
- [ ] Images have alt text
- [ ] Interactive elements keyboard accessible
- [ ] Color contrast meets WCAG AA standards

#### API Routes
- [ ] All endpoints return proper status codes
- [ ] Error responses include meaningful messages
- [ ] Request validation implemented
- [ ] No sensitive data exposed in responses

### Browser Testing

Test in the following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest, if available)
- Edge (latest)

### API Testing

Use tools like Postman or curl to verify API endpoints:

```bash
# Test GET endpoint
curl http://localhost:3000/api/discord/server-stats

# Test POST endpoint
curl -X POST http://localhost:3000/api/analytics/reset-daily \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

## Pull Request Process

### Before Creating a PR

1. **Update your branch with latest master:**
   ```bash
   git fetch origin
   git rebase origin/master
   ```

2. **Run all checks:**
   ```bash
   npm run lint
   npm run build
   ```

3. **Test thoroughly** following the manual testing checklist

4. **Review your own changes:**
   ```bash
   git diff origin/master
   ```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Performance improvement
- [ ] Style/UI change

## Changes Made
- List specific changes
- Include component/file names
- Mention any breaking changes

## Testing Done
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] API endpoints verified
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots or videos demonstrating the changes.

## Related Issues
Closes #issue_number
Related to #issue_number

## Additional Notes
Any additional context, considerations, or follow-up needed.
```

### PR Title Format

Use the same format as commit messages:

```
feat: Add real-time Discord voice channel status
fix: Resolve analytics session duplication issue
refactor: Simplify Riot API error handling
```

## Code Review Checklist

### For Reviewers

#### Code Quality
- [ ] Code follows project style guidelines
- [ ] TypeScript types are properly defined
- [ ] No `any` types used (unless absolutely necessary with comment)
- [ ] Functions have clear, single responsibilities
- [ ] Complex logic is commented
- [ ] No commented-out code blocks
- [ ] No console.log statements (except in API routes for errors)

#### Architecture
- [ ] Changes fit within existing architecture
- [ ] Server/Client component usage appropriate
- [ ] Path aliases (`@/`) used consistently
- [ ] No circular dependencies introduced
- [ ] Singleton patterns respected (Discord Gateway, Analytics DB)

#### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized with Next.js Image component
- [ ] Heavy components dynamically imported if needed
- [ ] API calls properly cached or memoized
- [ ] Database queries optimized (if applicable)

#### Security
- [ ] No sensitive data exposed in client code
- [ ] API routes validate inputs
- [ ] Environment variables used for secrets
- [ ] No SQL injection vulnerabilities (if applicable)
- [ ] External URLs properly validated

#### Testing
- [ ] Manual testing checklist completed
- [ ] Edge cases considered
- [ ] Error states handled gracefully
- [ ] Browser compatibility verified

#### Documentation
- [ ] README updated if needed
- [ ] API.md updated for new endpoints
- [ ] Comments added for complex logic
- [ ] Type definitions documented with JSDoc if complex

### Review Response Expectations

- Address all reviewer comments
- Mark conversations as resolved when fixed
- Explain if you disagree with a suggestion
- Update PR description if scope changes
- Request re-review when ready

## Documentation Standards

### Code Comments

#### When to Comment

**DO comment:**
```typescript
// Calculate win rate percentage, handling division by zero
const winRate = totalGames > 0
  ? Math.round((wins / totalGames) * 100)
  : 0;

// Discord API requires snowflake IDs to be strings
const userId: string = member.id.toString();

/**
 * Fetches live game data from Riot API with retry logic.
 *
 * @param puuid - Player's unique identifier
 * @param region - Game server region (e.g., 'euw1')
 * @returns Live game data or null if not in game
 * @throws {Error} If API is unavailable after retries
 */
export async function getLiveGame(puuid: string, region: string) {
  // implementation
}
```

**DON'T comment:**
```typescript
// Set the count to zero
const count = 0;

// Loop through users
users.forEach(user => {
  // Process user
  processUser(user);
});
```

#### JSDoc for Exported Functions

```typescript
/**
 * Calculates the player's average KDA across recent matches.
 *
 * @param matches - Array of match data objects
 * @param count - Number of recent matches to analyze (default: 10)
 * @returns Average KDA ratio or null if no valid matches
 *
 * @example
 * const kda = calculateAverageKDA(matches, 20);
 * console.log(`Average KDA: ${kda.toFixed(2)}`);
 */
export function calculateAverageKDA(
  matches: MatchData[],
  count: number = 10
): number | null {
  // implementation
}
```

### README Files

Update relevant README files when making structural changes:

- **Root README.md**: High-level project overview
- **src/README.md**: Source code organization
- **data/README.md**: Database schema and data structures
- **ARCHITECTURE.md**: System architecture and data flows
- **API.md**: API endpoint documentation
- **DEPLOYMENT.md**: Deployment procedures

### API Documentation

When adding/modifying API endpoints, update `API.md`:

```markdown
### POST /api/analytics/reset-daily

Triggers daily analytics reset, archiving current day's data.

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "confirm": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "snapshotsCreated": 50,
    "resetTime": "2024-01-15T00:00:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Confirmation required"
}
```

**Notes:**
- Should be called via cron job at midnight UTC
- Creates daily_snapshots entries for all active users
- Resets daily_* counters in user_stats table
```

## Common Patterns

### Fetching Data in Server Components

```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { getDiscordGateway } from '@/lib/discord-gateway';

export default async function DashboardPage() {
  // Fetch data directly in server component
  const session = await getServerSession();
  const gateway = getDiscordGateway();
  const stats = gateway.getServerStats();

  return (
    <div>
      <h1>Dashboard</h1>
      <ServerStats stats={stats} />
    </div>
  );
}
```

### Fetching Data in Client Components

```typescript
'use client';

import { useState, useEffect } from 'react';

interface Stats {
  online: number;
  total: number;
}

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/discord/server-stats');

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <p>Online: {stats.online}/{stats.total}</p>
    </div>
  );
}
```

### Using Discord Gateway Singleton

```typescript
import { getDiscordGateway } from '@/lib/discord-gateway';

export async function GET() {
  try {
    const gateway = getDiscordGateway();

    // Check if gateway is ready
    if (!gateway.isReady()) {
      return NextResponse.json(
        { success: false, error: 'Discord gateway not ready' },
        { status: 503 }
      );
    }

    const onlineMembers = gateway.getOnlineMembers();

    return NextResponse.json({
      success: true,
      data: { members: onlineMembers }
    });
  } catch (error) {
    console.error('Error accessing Discord gateway:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Using Analytics Database

```typescript
import { getAnalyticsDatabase } from '@/lib/analytics/database';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const db = getAnalyticsDatabase();
    const stats = db.getUserStats(userId);

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Environment Variables

```typescript
// Reading environment variables
const apiKey = process.env.RIOT_API_KEY;
const isDebug = process.env.RIOT_API_DEBUG === 'true';

// Validating required env vars at startup
if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN environment variable is required');
}

// Using with defaults
const port = parseInt(process.env.PORT || '3000', 10);
const enableGateway = process.env.ENABLE_DISCORD_GATEWAY !== 'false';
```

### Error Boundaries (React 19)

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Getting Help

- Check existing documentation in `/docs` and root README files
- Review similar implementations in the codebase
- Ask questions in pull request comments
- Contact project maintainer: [@shaneomac1337](https://github.com/shaneomac1337)

## License

By contributing to Komplexaci, you agree that your contributions will be part of the private and proprietary codebase owned by the Komplexaci gaming clan.
