# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.3 gaming community website for "Komplexáci" clan, focused on **League of Legends** and **Counter Strike 2**. The project is currently migrating from legacy HTML/CSS/JS to modern Next.js with TypeScript.

## Common Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Production build  
npm run start        # Start production server
npm run lint         # ESLint check

# No test suite configured yet
# Always run lint after making changes to ensure code quality
```

## Architecture Overview

### Tech Stack
- **Next.js 15.3.3** with App Router and React 19
- **TypeScript 5** with strict configuration
- **Tailwind CSS 4** + CSS Modules for styling
- **Turbopack** for fast development builds

### Directory Structure
```
src/app/
├── api/                    # API Routes
│   ├── cs2/               # CS2 endpoints (weapons, maps, game-info)
│   └── lol/               # League of Legends endpoints (champions)
├── components/            # Shared UI components (AnimatedSection, LazyImage, etc.)
├── cs2/                   # CS2 section (migrated)
├── league-of-legends/     # LoL section (partially migrated)
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── komplexaci.css         # Main custom styles with CSS variables

current_page/              # Legacy HTML source files (reference only)
public/komplexaci/         # Gaming assets (audio, images, backgrounds)
```

### Key Architecture Patterns

**Route Organization**: Game sections organized as route groups (`/cs2`, `/league-of-legends`)

**API Design**: RESTful structure with game-specific endpoints, external API integration (Riot DataDragon), query parameter filtering

**Component Architecture**: 
- Shared animation system (`AnimatedSection`) with Intersection Observer
- Feature-specific components co-located with routes
- Comprehensive skeleton loading states
- Reusable UI patterns (StaggeredGrid, LazyImage)

**Styling Strategy**: 
- CSS custom properties for theming (`--primary-color`, `--dark-bg`, etc.)
- Multi-layer approach: Tailwind utilities + CSS Modules + global custom CSS
- Advanced animations (3D card flips, scroll-triggered effects, particle systems)

**Performance Optimizations**:
- Intersection Observer for efficient scroll animations
- GPU-accelerated transforms and animations
- Next.js Image optimization with lazy loading
- Reduced motion support for accessibility

## Migration Status

### ✅ Completed
- Homepage (/) - Complete Komplexáci experience with 3D member cards and Trax audio player
- CS2 Page (/cs2) - Interactive weapon database and maps
- Core infrastructure and asset migration

### 🔄 Currently Migrating  
- **League of Legends Page** - Champion database with comprehensive filtering (Priority 1)
- **Videotvorba Page** - YouTube integration (Priority 2)
- **WWE Games Page** - Wrestling games collection (Priority 3)

## Development Guidelines

### Code Standards
- **File Size**: Maximum 500 lines per file
- **TypeScript**: Strict typing required for all components
- **Performance**: Use React.memo, useMemo, useCallback where needed
- **Components**: Feature parity with legacy versions is required

### Migration Process
1. Analyze legacy HTML/CSS/JS structure in `current_page/`
2. Extract components and data structures
3. Convert to React/TypeScript with proper typing
4. Optimize performance and responsiveness
5. Test feature parity with legacy version

### Styling Notes
- Use Tailwind utilities for rapid development
- CSS Modules for component-scoped styles (`.module.css`)
- Global custom properties in `komplexaci.css` for theming
- Mobile-first responsive design approach
- GPU acceleration for smooth animations (`transform3d`, `backface-visibility`)

## Data Structures

### TypeScript Interfaces
- **CS2**: Comprehensive weapon and map types with stats, categories, images
- **League of Legends**: Champion data with roles, difficulty, abilities
- **Audio System**: Track metadata, playback state, player controls

### API Integration
- **Static Data**: Local JSON-like structures for CS2 content
- **External APIs**: Riot Games DataDragon for LoL champion data
- **Error Handling**: Proper HTTP status codes and fallback states

## Audio System

The Komplexáci Trax player includes:
- 13 custom tracks in `/public/komplexaci/audio/`
- Smart playback with auto-advance and shuffle
- Loading states and timeout protection
- Demo mode fallback for missing files
- Mobile-optimized touch controls

## Performance Considerations

- **Animations**: Disabled on mobile for performance
- **Images**: Next.js Image component with proper sizing
- **State Management**: Local component state with useEffect for data fetching
- **Bundle Size**: Route-based code splitting with App Router
- **Core Web Vitals**: Optimized for Lighthouse scores 90+

## Legacy Reference

The `current_page/` directory contains the original HTML implementation for reference. When migrating new pages:
1. Compare feature sets between legacy and new versions
2. Ensure 100% feature parity
3. Maintain original design aesthetics while modernizing code
4. Test responsiveness on mobile, tablet, and desktop

## Future Enhancements

Planned features include Firebase authentication, real-time API integrations (League/Steam), member-exclusive content, and Discord API integration.