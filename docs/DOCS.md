# Komplexaci Documentation Index

Central navigation hub for all technical documentation for the Komplexaci gaming community website.

**Project:** Next.js 15 gaming community platform with Discord integration, Riot Games API, and analytics tracking
**Live URL:** [komplexaci.cz](https://komplexaci.cz)
**Repository:** [github.com/shaneomac1337/komplexaci_js](https://github.com/shaneomac1337/komplexaci_js)

---

## Quick Navigation

| Category | Document | Purpose |
|----------|----------|---------|
| **Getting Started** | [README.md](../README.md) | Project overview and quick start guide |
| **Architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and data flows |
| **API Reference** | [API.md](./API.md) | Complete API endpoint documentation |
| **Deployment** | [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment procedures |
| **Contributing** | [CONTRIBUTING.md](./CONTRIBUTING.md) | Development guidelines and standards |

---

## Documentation by Category

### Project Overview

| Document | Description | Audience | Pages |
|----------|-------------|----------|-------|
| [README.md](../README.md) | Main project documentation with technology stack, quick start instructions, and core systems overview. Includes environment setup and basic usage. | All users | 12 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete system architecture including component hierarchy, data flow diagrams, database schema, and integration points. | Developers, Architects | 20 |

### Source Code Organization

| Document | Description | Audience | Pages |
|----------|-------------|----------|-------|
| [src/README.md](../src/README.md) | Source code directory structure, component patterns, client vs server components, and import conventions. | Developers | 5 |
| [src/app/api/README.md](../src/app/api/README.md) | API route organization, handler patterns, and endpoint conventions. | Backend Developers | 3 |
| [src/lib/README.md](../src/lib/README.md) | Server-side library code including Discord Gateway, Analytics, and utilities. | Backend Developers | 3 |
| [src/lib/analytics/README.md](../src/lib/analytics/README.md) | Complete technical reference for the analytics subsystem. Covers database schema, session management, Discord integration, and API usage. | Backend Developers | 65 |

### Feature Documentation

| Document | Description | Audience | Pages |
|----------|-------------|----------|-------|
| [src/app/league-of-legends/README.md](../src/app/league-of-legends/README.md) | League of Legends integration including Riot API usage, champion database, summoner search, and live game tracking. | Developers | 8 |
| [src/app/cs2/README.md](../src/app/cs2/README.md) | Counter-Strike 2 weapon database, map gallery, and game information management. | Developers | 4 |
| [src/app/wwe-games/README.md](../src/app/wwe-games/README.md) | WWE games collection organized by era, platform support, and music player integration. | Developers | 5 |
| [src/app/admin/README.md](../src/app/admin/README.md) | Admin dashboard features, authentication requirements, and management interfaces. | Developers, Administrators | 4 |
| [src/app/videotvorba/README.md](../src/app/videotvorba/README.md) | YouTube video gallery with immersive player and channel integration. | Developers, Content Managers | 3 |

### Infrastructure & Data

| Document | Description | Audience | Pages |
|----------|-------------|----------|-------|
| [data/README.md](../data/README.md) | SQLite database reference covering file structure, schema, backup procedures, Docker volume mounting, and maintenance. | DevOps, Database Administrators | 55 |
| [docker/README.md](../docker/README.md) | Docker containerization setup, docker-compose configuration, volume management, and container orchestration. | DevOps | 8 |
| [tests/README.md](../tests/README.md) | Testing strategies, manual test procedures, and quality assurance guidelines. | QA Engineers, Developers | 6 |

### Operations

| Document | Description | Audience | Pages |
|----------|-------------|----------|-------|
| [API.md](./API.md) | Complete API endpoint reference with request/response schemas, error codes, and usage examples for all 50+ endpoints. | Backend Developers, API Consumers | 45 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Comprehensive deployment guide covering Vercel, manual server setup, Nginx configuration, SSL, monitoring, and troubleshooting. | DevOps, System Administrators | 65 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow, code style guidelines, Git conventions, testing requirements, and pull request process. | Contributors, Developers | 45 |

---

## Documentation by Role

### For New Developers

**Recommended Reading Order:**

1. **Start Here:** [README.md](../README.md) - Understand what Komplexaci is and set up your development environment
2. **Project Structure:** [src/README.md](../src/README.md) - Learn the codebase organization
3. **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Grasp the system design and data flows
4. **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md) - Follow development standards and workflow
5. **API Reference:** [API.md](./API.md) - Understand available endpoints and data contracts

**Estimated Time:** 2-3 hours for initial onboarding

### For Backend Developers

**Focus Areas:**

| Topic | Documents | Key Concepts |
|-------|-----------|--------------|
| **API Development** | [API.md](./API.md), [src/app/api/README.md](../src/app/api/README.md) | Route handlers, validation, error handling |
| **Discord Integration** | [ARCHITECTURE.md](./ARCHITECTURE.md), [src/lib/README.md](../src/lib/README.md) | Gateway WebSocket, presence tracking, voice states |
| **Analytics System** | [src/lib/analytics/README.md](../src/lib/analytics/README.md), [data/README.md](../data/README.md) | SQLite operations, session management, real-time tracking |
| **Riot API** | [src/app/league-of-legends/README.md](../src/app/league-of-legends/README.md), [API.md](./API.md) | PUUID-based lookups, region routing, rate limiting |

### For Frontend Developers

**Focus Areas:**

| Topic | Documents | Key Concepts |
|-------|-----------|--------------|
| **Component Patterns** | [src/README.md](../src/README.md), [CONTRIBUTING.md](./CONTRIBUTING.md) | Server vs Client components, React patterns |
| **UI Features** | Feature READMEs in `src/app/*/README.md` | Page structure, interactive elements |
| **Styling** | [CONTRIBUTING.md](./CONTRIBUTING.md) | Tailwind CSS usage, CSS Modules |
| **API Integration** | [API.md](./API.md) | Fetching data, error handling |

### For DevOps Engineers

**Focus Areas:**

| Topic | Documents | Key Concepts |
|-------|-----------|--------------|
| **Deployment** | [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel, manual server, Nginx, SSL |
| **Database Management** | [data/README.md](../data/README.md) | Backup, recovery, retention policies |
| **Container Orchestration** | [docker/README.md](../docker/README.md) | Docker setup, volume mounting |
| **Monitoring** | [DEPLOYMENT.md](./DEPLOYMENT.md) | Health checks, logging, performance |

### For Contributors

**Essential Reading:**

1. [CONTRIBUTING.md](./CONTRIBUTING.md) - Code style, Git workflow, PR process
2. [README.md](../README.md) - Setup development environment
3. [tests/README.md](../tests/README.md) - Testing requirements
4. Feature-specific README for the area you're contributing to

**Before Your First PR:**

- Review code style guidelines in CONTRIBUTING.md
- Understand the Git workflow and commit message format
- Complete manual testing checklist
- Verify build passes with `npm run build`

---

## Technology Reference

### Core Technologies

| Technology | Version | Documentation Link | Purpose |
|------------|---------|-------------------|---------|
| Next.js | 15.3.3 | [nextjs.org/docs](https://nextjs.org/docs) | Full-stack React framework |
| React | 19.0.0 | [react.dev](https://react.dev) | UI library with Server Components |
| TypeScript | 5.x | [typescriptlang.org](https://www.typescriptlang.org) | Type safety (strict mode) |
| Tailwind CSS | 4.x | [tailwindcss.com](https://tailwindcss.com) | Utility-first CSS framework |
| SQLite | 3.x | [sqlite.org](https://www.sqlite.org) | Local analytics database |
| Discord.js | 14.20.0 | [discord.js.org](https://discord.js.org) | Discord bot integration |
| NextAuth.js | 4.24.11 | [next-auth.js.org](https://next-auth.js.org) | Discord OAuth authentication |

### Key Libraries

| Library | Purpose | Documentation |
|---------|---------|---------------|
| better-sqlite3 | SQLite driver (Node.js) | [Analytics README](../src/lib/analytics/README.md) |
| Riot Games API | League of Legends data | [LoL README](../src/app/league-of-legends/README.md) |
| Supabase | Optional PostgreSQL backend | [Architecture](./ARCHITECTURE.md) |

---

## Feature Overview

### Discord Integration

**Real-time tracking of:**
- Member presence (online/idle/dnd/offline)
- Voice channel participation
- Game activities
- Spotify listening
- Screen sharing/streaming

**Documentation:**
- System design: [ARCHITECTURE.md](./ARCHITECTURE.md) - Discord Gateway Integration
- Analytics tracking: [src/lib/analytics/README.md](../src/lib/analytics/README.md)
- API endpoints: [API.md](./API.md) - Discord Integration section

### League of Legends Integration

**Features:**
- Summoner profile lookup by Riot ID
- Champion mastery tracking
- Live game detection
- Match history
- Regional support (EUW, NA, KR, etc.)

**Documentation:**
- Feature guide: [src/app/league-of-legends/README.md](../src/app/league-of-legends/README.md)
- API reference: [API.md](./API.md) - League of Legends API section
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md) - Riot API flow

### Analytics System

**Capabilities:**
- Gaming session tracking (duration, game name)
- Voice channel usage statistics
- Spotify listening history
- Daily and monthly aggregates
- Historical snapshots for trends

**Documentation:**
- Complete reference: [src/lib/analytics/README.md](../src/lib/analytics/README.md)
- Database schema: [data/README.md](../data/README.md)
- API endpoints: [API.md](./API.md) - Analytics section

### Game Databases

**Counter-Strike 2:**
- Weapon statistics and images
- Map gallery with descriptions
- Game information and mechanics

**WWE Games:**
- Collection organized by era (1987-2025)
- Platform support and features
- Music player integration

**Documentation:**
- CS2: [src/app/cs2/README.md](../src/app/cs2/README.md)
- WWE: [src/app/wwe-games/README.md](../src/app/wwe-games/README.md)

---

## Common Tasks

### Setting Up Development Environment

1. **Prerequisites:** Node.js 18+, Discord Bot Token, Riot API Key
2. **Installation:** See [README.md](../README.md) - Quick Start section
3. **Configuration:** Copy `.env.example` to `.env.local` and fill in credentials
4. **Verification:** Run `npm run dev` and check `http://localhost:3000`

**Detailed Guide:** [README.md](../README.md) - Installation section

### Creating a New API Endpoint

1. **Structure:** Create file in `src/app/api/[category]/[endpoint]/route.ts`
2. **Implementation:** Follow patterns in [src/app/api/README.md](../src/app/api/README.md)
3. **Documentation:** Update [API.md](./API.md) with new endpoint
4. **Testing:** Verify with curl or Postman

**Style Guide:** [CONTRIBUTING.md](./CONTRIBUTING.md) - API Route Standards

### Adding a New Feature Page

1. **Directory:** Create `src/app/[feature-name]/page.tsx`
2. **Components:** Add feature-specific components in `src/app/[feature-name]/components/`
3. **Styling:** Use Tailwind CSS or CSS Modules
4. **Documentation:** Create `src/app/[feature-name]/README.md`

**Component Patterns:** [src/README.md](../src/README.md) - Component Patterns section

### Deploying to Production

**Vercel (Recommended):**
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push to master

**Manual Server:**
1. Build application: `npm run build`
2. Configure PM2 or systemd service
3. Set up Nginx reverse proxy
4. Configure SSL with Let's Encrypt

**Complete Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

### Database Backup and Recovery

**Backup:**
```bash
# Local backup
cp data/analytics.db analytics-backup-$(date +%Y%m%d).db

# Docker backup
docker exec komplexaci-web cp /app/data/analytics.db /app/data/backup/
```

**Recovery:**
```bash
# Stop application
docker-compose down

# Restore backup
cp analytics-backup.db data/analytics.db

# Restart
docker-compose up -d
```

**Full Guide:** [data/README.md](../data/README.md) - Backup and Recovery section

---

## Troubleshooting

### Common Issues

| Issue | Documentation | Section |
|-------|---------------|---------|
| Application won't start | [DEPLOYMENT.md](./DEPLOYMENT.md) | Troubleshooting - Application Not Starting |
| Discord bot offline | [DEPLOYMENT.md](./DEPLOYMENT.md) | Troubleshooting - Discord Bot Not Responding |
| Database errors | [data/README.md](../data/README.md) | Troubleshooting - Common Issues |
| API rate limiting | [API.md](./API.md) | Rate Limiting section |
| Build failures | [CONTRIBUTING.md](./CONTRIBUTING.md) | Testing Requirements |
| Slow queries | [data/README.md](../data/README.md) | Performance Characteristics |

### Debug Endpoints

Available debug endpoints for troubleshooting:

| Endpoint | Purpose | Documentation |
|----------|---------|---------------|
| `/api/health` | System health check | [API.md](./API.md) - Health Endpoints |
| `/api/debug/activities` | View member activities | [API.md](./API.md) - Debug Endpoints |
| `/api/debug/voice` | Voice channel status | [API.md](./API.md) - Debug Endpoints |
| `/api/analytics/status` | Analytics system status | [API.md](./API.md) - Analytics section |

---

## Project Metrics

### Codebase Statistics

| Metric | Count |
|--------|-------|
| API Endpoints | 50+ |
| Database Tables | 5 (analytics) |
| React Components | 100+ |
| TypeScript Files | 200+ |
| Documentation Pages | 300+ |

### Performance Benchmarks

| Operation | Target | Measured |
|-----------|--------|----------|
| API Response Time | < 200ms | 50-150ms avg |
| Database Queries | < 100ms | 20-80ms avg |
| Page Load (FCP) | < 1.5s | 800ms-1.2s |
| Build Time | < 2min | 60-90s |

**Source:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Performance Optimizations

---

## Development Workflow

### Git Workflow

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes

**Commit Message Format:**
```
<type>: <subject>

[optional body]
```

**Types:** feat, fix, refactor, style, docs, perf, test, chore

**Full Guide:** [CONTRIBUTING.md](./CONTRIBUTING.md) - Git Workflow section

### Pull Request Process

1. Create feature branch from master
2. Make changes following code style guidelines
3. Run tests: `npm run lint && npm run build`
4. Create PR with completed template
5. Address review comments
6. Merge after approval

**Checklist:** [CONTRIBUTING.md](./CONTRIBUTING.md) - Pull Request Process

---

## API Quick Reference

### Discord Endpoints

```bash
GET /api/discord/server-stats          # Server statistics
GET /api/discord/streaming-status      # Streaming users
```

### League of Legends Endpoints

```bash
GET /api/lol/summoner?riotId=Name%23TAG  # Summoner lookup
GET /api/lol/champions                   # Champion database
GET /api/lol/live-game?puuid=PUUID       # Live game check
```

### Analytics Endpoints

```bash
GET /api/analytics/status              # System status
GET /api/analytics/user/[userId]       # User statistics
POST /api/analytics/reset-daily        # Daily reset
```

**Complete Reference:** [API.md](./API.md)

---

## Environment Variables

### Required Variables

```bash
RIOT_API_KEY=RGAPI-xxxxx              # Riot Games API
DISCORD_BOT_TOKEN=xxxxx               # Discord bot authentication
DISCORD_SERVER_ID=xxxxx               # Target server ID
NEXTAUTH_SECRET=xxxxx                 # NextAuth encryption (32+ chars)
NEXTAUTH_URL=https://komplexaci.cz   # Application URL
```

### Optional Variables

```bash
SUPABASE_URL=https://xxx.supabase.co  # Supabase project
SUPABASE_ANON_KEY=xxxxx               # Supabase anonymous key
ENABLE_DISCORD_GATEWAY=true           # Enable WebSocket
RIOT_API_DEBUG=true                   # Debug Riot API calls
```

**Full Reference:** [DEPLOYMENT.md](./DEPLOYMENT.md) - Environment Variables section

---

## Security Considerations

### Authentication

- NextAuth.js with Discord OAuth
- Protected routes: `/admin`
- Session management via JWT

**Documentation:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Authentication section

### API Security

- Input validation on all endpoints
- Rate limiting (60 requests/min per IP)
- No sensitive data in client code
- Environment variables for secrets

**Guidelines:** [CONTRIBUTING.md](./CONTRIBUTING.md) - Code Review Checklist - Security

### Database Security

- SQLite file permissions (644)
- No direct SQL injection vulnerabilities
- Prepared statements for all queries
- Regular integrity checks

**Details:** [data/README.md](../data/README.md) - Troubleshooting

---

## Support and Contact

### Documentation Issues

If you find errors or gaps in documentation:
1. Check if information exists in related documents
2. Open an issue on GitHub with label `documentation`
3. Submit a PR with corrections

### Technical Support

- GitHub Issues: [github.com/shaneomac1337/komplexaci_js/issues](https://github.com/shaneomac1337/komplexaci_js/issues)
- Project Maintainer: [@shaneomac1337](https://github.com/shaneomac1337)
- Discord Community: [komplexaci.cz](https://komplexaci.cz)

---

## License

Private and proprietary to the Komplexaci gaming clan.

**Contributing:** By contributing to this project, you agree that your contributions will be part of the private and proprietary codebase. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## Document Maintenance

### Last Updated

**Date:** 2025-11-30
**Version:** 1.0.0

### Update Guidelines

This documentation index should be updated when:
- New documentation files are added
- Existing documents are relocated or renamed
- Major features are added or removed
- Project structure changes significantly

**Maintainer:** Update this file as part of documentation PRs

---

## Quick Links

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Discord.js Guide](https://discordjs.guide)
- [Riot Games API](https://developer.riotgames.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Project Resources

- **Live Site:** [komplexaci.cz](https://komplexaci.cz)
- **Repository:** [GitHub](https://github.com/shaneomac1337/komplexaci_js)
- **Issues:** [GitHub Issues](https://github.com/shaneomac1337/komplexaci_js/issues)
- **Discord:** [Join Community](https://komplexaci.cz)

---

**Navigation:** [Back to Top](#komplexaci-documentation-index)
