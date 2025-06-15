'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WeaponCategory, GameMap, GameInfo } from '../types/cs2';
import styles from './cs2.module.css';
import '../komplexaci.css';

import AnimatedSection from '../components/AnimatedSection';
import StaggeredGrid from '../components/StaggeredGrid';
import WeaponCardSkeleton from '../components/WeaponCardSkeleton';
import MapCardSkeleton from '../components/MapCardSkeleton';
import Header from '../components/Header';

// CS2 Screenshots from SteamDB for random display
const cs2Screenshots = [
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_796601d9d67faf53486eeb26d0724347cea67ddc.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_d830cfd0550fbb64d80e803e93c929c3abb02056.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_13bb35638c0267759276f511ee97064773b37a51.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_0f8cf82d019c614760fd20801f2bb4001da7ea77.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_ef82850f036dac5772cb07dbc2d1116ea13eb163.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_76f6730dbb911650ba1f41c8e5b4bac638b5beea.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_808cdd373d78c3cf3a78e7026ebb1a15895e0670.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_ef98db5d5a4d877531a5567df082b0fb62d75c80.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_2254a50f27951fb9028bc00b93a7f2ed7aac1e13.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_54b9c26b028c84d5f8a5316f31ae6203953ed84d.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_1b3b5fd437939a7ed00a2155269e78994cb998d3.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_352666c1949ce3966bd966d6ea5a1afd532257bc.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_63d2733b9b4ace01a41d5ba8afd653245d05d54a.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_fe70d46859593aef623a0614f4686e2814405035.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_bb2af3e83ac0385ff2055f2ab9697cdd83e351b7.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_fb8e5e2ae29ce64e2898315c66b5db08989e8f91.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_0db84c628a798e38ca57d69abda119bee1358008.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_18e9ea2715f0407ee05e206073927a648db60d73.jpg',
  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/ss_2514675f364079b754b820cbc8b2e7c331d56a26.jpg'
];

export default function CS2Page() {
  const [weaponCategories, setWeaponCategories] = useState<WeaponCategory[]>([]);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('pistole');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string>('');

  // Function to get a random CS2 screenshot
  const getRandomCS2Screenshot = () => {
    const randomIndex = Math.floor(Math.random() * cs2Screenshots.length);
    return cs2Screenshots[randomIndex];
  };

  // Initialize random screenshot on component mount
  useEffect(() => {
    setCurrentScreenshot(getRandomCS2Screenshot());
  }, []);

  // Change screenshot every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreenshot(getRandomCS2Screenshot());
    }, 12000); // Change every 12 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [weaponsRes, mapsRes, gameInfoRes] = await Promise.all([
          fetch('/api/cs2/weapons'),
          fetch('/api/cs2/maps?active=true'),
          fetch('/api/cs2/game-info')
        ]);

        if (!weaponsRes.ok || !mapsRes.ok || !gameInfoRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [weaponsData, mapsData, gameInfoData] = await Promise.all([
          weaponsRes.json(),
          mapsRes.json(),
          gameInfoRes.json()
        ]);

        setWeaponCategories(weaponsData);
        setMaps(mapsData);
        setGameInfo(gameInfoData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentCategory = weaponCategories.find(cat => cat.id === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Hero Section Skeleton */}
        <section className="relative h-[60vh] bg-gray-800 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-purple-600/20 animate-pulse"></div>
          <div className="relative z-10 text-center max-w-4xl px-4">
            <div className="h-16 bg-gray-700 rounded-lg mb-4 w-96 mx-auto animate-pulse"></div>
            <div className="h-6 bg-gray-600 rounded w-64 mx-auto animate-pulse"></div>
          </div>
        </section>

        {/* Content Skeleton */}
        <div className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Game Info Skeleton */}
            <div className="h-12 bg-gray-700 rounded mb-8 w-80 mx-auto animate-pulse"></div>
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 animate-pulse">
                <div className="h-8 bg-gray-600 rounded mb-6 w-48"></div>
                <div className="space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-600 rounded w-full"></div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 animate-pulse">
                <div className="h-8 bg-gray-600 rounded mb-6 w-48"></div>
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-600 rounded w-full"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Maps Skeleton */}
            <div className="bg-gray-800/30 py-20">
              <div className="h-12 bg-gray-700 rounded mb-8 w-64 mx-auto animate-pulse"></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MapCardSkeleton count={7} />
              </div>
            </div>

            {/* Weapons Skeleton */}
            <div className="py-20">
              <div className="h-12 bg-gray-700 rounded mb-8 w-64 mx-auto animate-pulse"></div>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-700 rounded-full w-32 animate-pulse"></div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <WeaponCardSkeleton count={6} />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="fixed bottom-8 right-8 bg-gray-800 rounded-full p-4 border border-red-500/30 animate-pulse">
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">Chyba: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className={`relative h-[80vh] min-h-[600px] flex items-center justify-center ${styles.heroSection} ${styles.parallaxBg} overflow-hidden`}>
        {/* Background Image using img element for better control */}
        {currentScreenshot && (
          <>
            {/* Blurred background layer */}
            <img
              src={currentScreenshot}
              alt="CS2 Screenshot Background"
              className="absolute inset-0 w-full h-full object-cover filter blur-xl brightness-30 scale-110"
              style={{ zIndex: 1 }}
            />

            {/* Main image layer - shows full image */}
            <img
              src={currentScreenshot}
              alt="CS2 Screenshot"
              className="absolute inset-0 w-full h-full object-contain filter brightness-75"
              style={{ zIndex: 2 }}
            />
          </>
        )}

        <AnimatedSection
          className="relative z-10 text-center max-w-4xl px-4"
          animation="fadeInUp"
          duration={1.2}
        >
          <div className="relative">
            {/* Clean CS2-style overlay */}
            <div className="bg-black/30 border-2 border-red-500/50 rounded-2xl p-8 mx-8 relative overflow-hidden">
              {/* Static corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-400"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-400"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-400"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-400"></div>

              {/* Static subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10 rounded-2xl"></div>

              {/* Content */}
              <div className="relative z-10">
                <h1 className={`text-6xl font-bold mb-4 ${styles.textShadow} ${styles.textGradient}`}>
                  {gameInfo?.title}
                </h1>
                <AnimatedSection
                  animation="fadeInUp"
                  delay={0.3}
                  className="text-xl font-light text-gray-200"
                >
                  <span className={styles.textGlow}>
                    Legendární taktická FPS střílečka od Valve
                  </span>
                </AnimatedSection>
                {currentScreenshot && (
                  <div className="mt-4 text-sm text-red-300 opacity-75"
                       style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6)' }}>
                    <i className="fas fa-camera mr-2"></i>
                    Oficiální screenshoty ze hry
                  </div>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Game Info Section */}
      {gameInfo && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection animation="fadeInUp" className="text-center mb-12">
              <h2 className={`text-4xl font-bold mb-8 ${styles.textGradient}`}>O hře Counter-Strike 2</h2>
              <p className="text-lg text-gray-300 max-w-4xl mx-auto">
                {gameInfo.description}
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <AnimatedSection
                animation="fadeInLeft"
                delay={0.2}
                className={`bg-gray-800/50 rounded-lg p-8 border border-red-500/30 ${styles.glowEffect} ${styles.cardHover}`}
              >
                <h3 className="text-2xl font-semibold mb-6 text-red-400">Základní informace</h3>
                <ul className="space-y-3">
                  <li><strong>Vývojář:</strong> {gameInfo.basicInfo.developer}</li>
                  <li><strong>Vydáno:</strong> {gameInfo.basicInfo.releaseDate}</li>
                  <li><strong>Žánr:</strong> {gameInfo.basicInfo.genre}</li>
                  <li><strong>Platforma:</strong> {gameInfo.basicInfo.platform}</li>
                  <li><strong>Model:</strong> {gameInfo.basicInfo.model}</li>
                  <li><strong>Engine:</strong> {gameInfo.basicInfo.engine}</li>
                  <li><strong>Esport:</strong> {gameInfo.basicInfo.esport}</li>
                </ul>
              </AnimatedSection>

              {/* Game Mechanics */}
              <AnimatedSection
                animation="fadeInRight"
                delay={0.4}
                className={`bg-gray-800/50 rounded-lg p-8 border border-red-500/30 ${styles.glowEffect} ${styles.cardHover}`}
              >
                <h3 className="text-2xl font-semibold mb-6 text-red-400">{gameInfo.mechanics.title}</h3>
                <p className="mb-4 text-gray-300">{gameInfo.mechanics.description}</p>
                <ul className="space-y-2 text-sm">
                  {gameInfo.mechanics.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
            </div>
          </div>
        </section>
      )}

      {/* Maps Section */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp" className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-8 ${styles.textGradient}`}>Mapy v Counter-Strike 2</h2>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              CS2 obsahuje řadu ikonických map, které byly vylepšeny pro Source 2 engine.
              Každá mapa má své unikátní rozvržení a vyžaduje specifické strategie.
            </p>
          </AnimatedSection>

          <StaggeredGrid
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            staggerDelay={0.1}
            animation="scaleIn"
          >
            {maps.map((map) => {
              console.log('Rendering map:', map.name, 'with image:', map.image);
              return (
              <div
                key={map.id}
                className={`bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-red-500/50 ${styles.cardHover} ${styles.imageReveal}`}
              >
                <div className="h-48 relative overflow-hidden">
                  <Image
                    src={map.image}
                    alt={map.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                    onError={(e) => {
                      console.error('Map image failed to load:', map.image, e);
                    }}
                    onLoad={() => {
                      console.log('Map image loaded successfully:', map.image);
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{map.name}</h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{map.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {map.features.slice(0, 2).map((feature, index) => (
                      <span
                        key={index}
                        className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs transition-all duration-300 hover:bg-red-500/30"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              );
            })}
          </StaggeredGrid>
        </div>
      </section>

      {/* Weapons Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp" className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-8 ${styles.textGradient}`}>Zbraně a vybavení</h2>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              CS2 nabízí širokou škálu zbraní a vybavení, které si hráči mohou zakoupit
              na začátku každého kola podle své ekonomické situace a strategie.
            </p>
          </AnimatedSection>

          {/* Weapon Categories */}
          <AnimatedSection animation="fadeInUp" delay={0.2} className="mb-12">
            <div className="flex flex-wrap justify-center gap-4">
              {weaponCategories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${styles.categoryButton} ${
                    activeCategory === category.id
                      ? `${styles.categoryButtonActive} ${styles.pulseGlow} text-white shadow-lg transform scale-105`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {category.title}
                </button>
              ))}
            </div>
          </AnimatedSection>

          {/* Current Category */}
          {currentCategory && (
            <AnimatedSection
              animation="fadeInUp"
              delay={0.3}
              className={`bg-gray-800/50 rounded-lg p-8 border border-red-500/30 ${styles.glowEffect}`}
            >
              <div className="text-center mb-8">
                <h3 className={`text-2xl font-semibold mb-4 ${styles.textGradient}`}>{currentCategory.title}</h3>
                <p className="text-gray-300">{currentCategory.description}</p>
              </div>

              <StaggeredGrid
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                staggerDelay={0.1}
                animation="scaleIn"
              >
                {currentCategory.weapons.map((weapon) => (
                  <div
                    key={weapon.id}
                    className={`bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-red-500/50 ${styles.cardHover} ${styles.imageReveal}`}
                  >
                    <div className="h-24 mb-4 flex items-center justify-center bg-gray-600/20 rounded-lg overflow-hidden">
                      <Image
                        src={weapon.image}
                        alt={weapon.name}
                        width={120}
                        height={80}
                        className="object-contain transition-transform duration-300 hover:scale-110"
                        unoptimized
                      />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{weapon.name}</h4>
                    <p className={`font-semibold mb-2 ${styles.textGradient}`}>{weapon.price}</p>
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">{weapon.stats}</p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p><strong>Poškození:</strong> {weapon.damage}</p>
                      <p><strong>Přesnost:</strong> {weapon.accuracy}</p>
                      <p><strong>Tým:</strong> {weapon.team}</p>
                    </div>
                  </div>
                ))}
              </StaggeredGrid>
            </AnimatedSection>
          )}

          <AnimatedSection animation="fadeInUp" delay={0.5} className="text-center mt-12">
            <Link
              href="/komplexaci#hry"
              className={`inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${styles.pulseGlow}`}
            >
              Zpět na přehled her
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
