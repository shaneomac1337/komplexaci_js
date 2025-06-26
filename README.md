# Komplexáci Gaming Clan Website

> **🎮 Modern Gaming Community Hub** - Czech gaming clan specializing in League of Legends and Counter-Strike 2

A fully modernized Next.js 15 website for the Komplexáci gaming community, featuring interactive member profiles, game databases, live status tracking, and immersive audio experiences.

## 🚀 Live Features

### 🏠 **Homepage**
- **3D Member Cards** - Interactive flip animations with unique colors for each member
- **Komplexáci Trax** - Full-featured audio player with 13 custom tracks
- **Discord Integration** - Live server stats and member activity
- **Performance Optimized** - GPU acceleration and responsive design

### 🎯 **Counter-Strike 2 (/cs2)**
- **Weapon Database** - Interactive categories (Pistols, Rifles, SMGs, Snipers)
- **Detailed Statistics** - Damage, accuracy, range for each weapon
- **Map Gallery** - CS2 maps with hover effects and information
- **API-Driven** - Dynamic content loading with caching

### 🏆 **League of Legends (/league-of-legends)**
- **Champion Database** - Complete champion roster with search and filters
- **Summoner Search** - Real-time player lookup with Riot API integration
- **Live Game Status** - Track Komplexáci members' current games
- **Champion Mastery** - Player statistics and champion proficiency

### 🎵 **WWE Games (/wwe-games)**
- **Game Collection** - Wrestling games database with filters
- **Industrial Design** - SmackDown 2 inspired aesthetic
- **Music Player** - WWE-themed audio experience

### 🔐 **Admin Panel (/admin)**
- **Content Management** - Track and music administration
- **Analytics Dashboard** - Usage statistics and monitoring
- **Member Management** - Clan member data administration

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript 5 (Strict mode)
- **Styling**: Tailwind CSS 4 + CSS Modules
- **UI Library**: React 19.0.0
- **Performance**: Turbopack for development
- **APIs**: Riot Games API, Discord API
- **Authentication**: NextAuth.js with Discord provider
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/shaneomac1337/komplexaci_js.git
cd komplexaci_js

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Environment Variables
```bash
# Required for League of Legends features
RIOT_API_KEY=your_riot_api_key

# Required for Discord integration
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_SERVER_ID=your_server_id

# Required for authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Required for database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
src/app/
├── page.tsx                    # Homepage with member cards & Trax player
├── cs2/                        # Counter-Strike 2 section
│   ├── page.tsx               # Weapons & maps database
│   └── cs2.module.css         # CS2-specific styling
├── league-of-legends/          # League of Legends section
│   ├── page.tsx               # Champions & summoner search
│   ├── components/            # LoL-specific components
│   └── lol.module.css         # LoL-specific styling
├── wwe-games/                  # WWE Games section
│   ├── page.tsx               # Games collection
│   └── wwe.module.css         # WWE-specific styling
├── admin/                      # Admin panel
├── api/                        # API routes
│   ├── cs2/                   # CS2 data endpoints
│   ├── lol/                   # League of Legends API integration
│   ├── discord/               # Discord server stats
│   └── music/                 # Audio management
├── components/                 # Shared UI components
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript definitions
└── globals.css                # Global styles

public/
├── komplexaci/                 # Gaming assets
│   ├── audio/                 # Trax music files
│   ├── img/                   # Member images & backgrounds
│   └── backgrounds/           # Section backgrounds
├── cs2/                       # CS2 weapon images
└── league-of-legends/         # LoL champion assets
```

## 🎮 Key Features

### Audio System
- **Smart Playback** - Auto-advance with shuffle mode
- **Loading States** - Prevents rapid clicking issues
- **Demo Mode** - Fallback for missing audio files
- **Mobile Optimized** - Touch-friendly controls

### Performance
- **GPU Acceleration** - Smooth animations and transitions
- **Lazy Loading** - Images and components load on demand
- **API Caching** - Optimized data fetching with appropriate cache headers
- **Responsive Design** - Perfect on mobile, tablet, and desktop

### Real-time Features
- **Live Game Status** - Track members' current League of Legends games
- **Discord Integration** - Live server statistics and member activity
- **Dynamic Content** - API-driven data that updates automatically

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Code Standards
- **TypeScript Strict Mode** - Full type safety
- **ESLint + Prettier** - Consistent code formatting
- **CSS Modules** - Scoped styling for components
- **Performance First** - React.memo, useMemo, useCallback where needed

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to the Komplexáci gaming clan.

## 🎯 Contact

- **Website**: [komplexaci.cz](https://komplexaci.cz)
- **Discord**: Join our gaming community
- **GitHub**: [@shaneomac1337](https://github.com/shaneomac1337)

---

**Built with ❤️ by the Komplexáci community**
