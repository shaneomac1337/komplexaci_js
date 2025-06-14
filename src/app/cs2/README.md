# Counter-Strike 2 API Documentation

This document describes the API-driven CS2 page implementation for the Komplexáci website.

## Overview

The CS2 page has been converted from a static HTML page to a modern Next.js application with API-driven content. This approach provides better maintainability, performance, and scalability.

## API Endpoints

### 1. Weapons API (`/api/cs2/weapons`)

Returns weapon data organized by categories.

**Endpoint:** `GET /api/cs2/weapons`

**Query Parameters:**
- `category` (optional): Filter by specific weapon category (pistole, smg, pusky, odstrelova, tezke, granaty)

**Response Structure:**
```typescript
interface WeaponCategory {
  id: string;
  title: string;
  description: string;
  weapons: Weapon[];
}

interface Weapon {
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
```

**Examples:**
- `GET /api/cs2/weapons` - Returns all weapon categories
- `GET /api/cs2/weapons?category=pistole` - Returns only pistol category

### 2. Maps API (`/api/cs2/maps`)

Returns information about CS2 maps.

**Endpoint:** `GET /api/cs2/maps`

**Query Parameters:**
- `active` (optional): Filter by active maps only (`true`/`false`)
- `type` (optional): Filter by map type (`defusal`, `hostage`, `wingman`)

**Response Structure:**
```typescript
interface GameMap {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'defusal' | 'hostage' | 'wingman';
  active: boolean;
  releaseDate?: string;
  features: string[];
}
```

**Examples:**
- `GET /api/cs2/maps` - Returns all maps
- `GET /api/cs2/maps?active=true` - Returns only active maps
- `GET /api/cs2/maps?type=defusal` - Returns only defusal maps

### 3. Game Info API (`/api/cs2/game-info`)

Returns general information about Counter-Strike 2.

**Endpoint:** `GET /api/cs2/game-info`

**Response Structure:**
```typescript
interface GameInfo {
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
    // Schema.org structured data
  };
}
```

## Features

### 1. Modern React Architecture
- **Client-side rendering** with React hooks
- **TypeScript** for type safety
- **CSS Modules** for scoped styling
- **Error boundaries** for graceful error handling

### 2. Performance Optimizations
- **Parallel API calls** for faster loading
- **Image optimization** with Next.js Image component
- **Lazy loading** and animations
- **Responsive design** for all devices

### 3. User Experience
- **Loading states** with custom spinners
- **Error handling** with retry functionality
- **Smooth animations** and transitions
- **Interactive weapon filtering**
- **Accessibility** features (reduced motion support)

### 4. SEO & Metadata
- **Structured data** (Schema.org) for search engines
- **Open Graph** and Twitter meta tags
- **Proper HTML semantics**
- **Dynamic metadata** generation

## File Structure

```
src/app/cs2/
├── page.tsx              # Main CS2 page component
├── layout.tsx            # Layout with metadata and structured data
├── loading.tsx           # Loading component
├── error.tsx             # Error boundary component
├── cs2.module.css        # CSS modules for styling
└── README.md             # This documentation

src/app/api/cs2/
├── weapons/
│   └── route.ts          # Weapons API endpoint
├── maps/
│   └── route.ts          # Maps API endpoint
└── game-info/
    └── route.ts          # Game info API endpoint

src/app/types/
└── cs2.ts                # TypeScript type definitions
```

## Benefits of API Approach

### 1. Maintainability
- **Centralized data management** - All weapon/map data in one place
- **Easy updates** - Change data without touching UI code
- **Type safety** - TypeScript prevents runtime errors
- **Modular structure** - Each API endpoint is independent

### 2. Performance
- **Faster loading** - Only fetch needed data
- **Caching** - API responses can be cached
- **Parallel requests** - Multiple APIs load simultaneously
- **Optimized images** - Next.js Image component optimization

### 3. Scalability
- **Easy to extend** - Add new weapon categories or maps
- **API versioning** - Can add v2 endpoints without breaking existing
- **External consumption** - APIs can be used by other applications
- **Database ready** - Easy to switch from static data to database

### 4. Developer Experience
- **Hot reloading** - Changes reflect immediately
- **TypeScript intellisense** - Better code completion
- **Error handling** - Clear error messages and recovery
- **Testing** - APIs can be tested independently

## Migration from Static HTML

The original static HTML page has been successfully converted to this API-driven approach while maintaining:

- **All original content** and information
- **Visual design** and styling
- **Functionality** like weapon filtering
- **SEO benefits** with improved structured data
- **Performance** with modern optimizations

## Future Enhancements

Potential improvements that can be easily added:

1. **Database integration** - Replace static data with database
2. **Admin panel** - UI for managing weapons and maps
3. **Search functionality** - Search weapons by name or stats
4. **Favorites system** - Let users save favorite weapons
5. **Comparison tool** - Compare weapon statistics
6. **Real-time updates** - Live data from Steam API
7. **Internationalization** - Multiple language support
8. **Analytics** - Track popular weapons and maps
