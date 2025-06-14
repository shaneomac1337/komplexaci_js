# Komplexáci Gaming Clan Website

> **🚀 Migration Project**: Modernizing legacy HTML/CSS/JS website to Next.js 15 with TypeScript

Komplexáci je česká herní komunita specializující se na **League of Legends** a **Counter Strike 2**. Tato webová stránka slouží jako centrální hub pro členy klanu a fanoušky.

## 🎯 Project Status

### ✅ Successfully Migrated
- **Homepage (/)** - Kompletní Komplexáci zážitek s 3D member cards a Trax přehrávačem
- **CS2 Page (/cs2)** - Interaktivní weapon database a mapy
- **Komplexáci Page (/komplexaci)** - Dedikovaná klan stránka

### 🔄 Currently Migrating
- **League of Legends Page** - Champion database s filtry (Priority 1)
- **Videotvorba Page** - YouTube kanál integrace (Priority 2)
- **WWE Games Page** - Wrestling games kolekce (Priority 3)

## 🛠️ Tech Stack

### Current (Next.js)
- **Framework**: Next.js 15.3.3 s App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + CSS Modules
- **UI**: React 19.0.0 s moderními hooks
- **Performance**: Turbopack pro development
- **Deployment**: Vercel (doporučeno)

### Legacy (current_page/)
- HTML5, CSS3, Vanilla JavaScript
- Firebase Authentication
- Custom CSS animations

## 🚀 Getting Started

### Development Server
```bash
npm run dev          # Start development server s Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
```

### Project Structure
```
src/app/
├── page.tsx                 # Homepage (migrated)
├── cs2/                     # CS2 page (migrated)
├── komplexaci/              # Komplexaci page (migrated)
├── components/              # Reusable React components
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript definitions
└── globals.css              # Global styles

current_page/                # Legacy HTML files (migration source)
├── league-of-legends.html   # 🔄 Next to migrate
├── videotvorba.html         # 🔄 Next to migrate
├── wwe-games.html           # 🔄 Next to migrate
└── ...

public/
├── komplexaci/              # Migrated assets
│   ├── audio/              # Trax music files
│   └── img/                # Images, GIFs, backgrounds
└── ...
```
## 🎮 Features

### Homepage Highlights
- **3D Member Cards**: Flip animations s unikátními barvami pro každého člena
- **Komplexáci Trax**: Plně funkční audio přehrávač (13 tracků)
- **Discord & Music Dashboard**: Immersive sekce s glassmorphism efekty
- **Responsive Design**: Optimalizováno pro všechna zařízení

### CS2 Page Features
- **Interactive Weapon Categories**: Pistols, Rifles, SMGs, Snipers
- **Detailed Stats**: Damage, accuracy, range pro každou zbraň
- **Map Gallery**: CS2 mapy s hover efekty
- **Performance Optimized**: Lazy loading a GPU acceleration

### Audio System
- **Smart Playback**: Auto-advance s shuffle mode
- **Demo Mode**: Fallback pro missing audio files
- **Loading States**: Prevents rapid clicking issues
- **Mobile Optimized**: Touch-friendly controls

## 🔧 Development Guidelines

### Code Standards
- **File Size**: Max 500 lines per file
- **TypeScript**: Strict typing pro všechny komponenty
- **Performance**: React.memo, useMemo, useCallback kde potřeba
- **CSS**: Tailwind utilities + CSS modules pro custom styling

### Migration Process
1. **Analyze** legacy HTML/CSS/JS structure
2. **Extract** components a data structures
3. **Convert** to React/TypeScript
4. **Optimize** performance a responsiveness
5. **Test** feature parity s legacy verzí

## 📋 Migration Tasks

### Current Priority (2025-06-14)
- [ ] **League of Legends Page** - Champion database migration
- [ ] **Videotvorba Page** - YouTube integration
- [ ] **WWE Games Page** - Game collection s filtry

### Future Enhancements
- [ ] **Firebase Auth** - User authentication system
- [ ] **API Integration** - League/Steam API pro real-time data
- [ ] **Member Section** - Exclusive content pro přihlášené členy

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Automatic deployment on push to main branch
# Environment variables configured in Vercel dashboard
```

### Manual Build
```bash
npm run build
npm run start
```

## 📚 Documentation

- **PLANNING.md** - Detailed migration architecture a requirements (in `current_page/`)
- **TASK.md** - Current tasks, progress tracking a milestones (root directory)
- **Legacy Code** - Reference implementation v `current_page/`

## 🤝 Contributing

1. Check `TASK.md` pro current priorities
2. Follow TypeScript a ESLint guidelines
3. Test na mobile, tablet, desktop
4. Maintain feature parity s legacy verzí

---

**Live Preview**: [http://localhost:3000](http://localhost:3000) (development)
**Legacy Reference**: `current_page/index.html` (original implementation)
