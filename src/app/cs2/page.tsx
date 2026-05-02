'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WeaponCategory, GameMap, GameInfo } from '../types/cs2';
import styles from './cs2.module.css';
import '../komplexaci.css';
import './cs2-redesign.css';
import '../section-headings-redesign.css';

import AnimatedSection from '../components/AnimatedSection';
import WeaponCardSkeleton from '../components/WeaponCardSkeleton';
import MapCardSkeleton from '../components/MapCardSkeleton';
import Header from '../components/Header';
import { Icon } from '../components/Icon';

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
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState<number>(0);

  // Initialize random screenshot on component mount
  useEffect(() => {
    const idx = Math.floor(Math.random() * cs2Screenshots.length);
    setCurrentScreenshotIndex(idx);
    setCurrentScreenshot(cs2Screenshots[idx]);
  }, []);

  // Change screenshot every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * cs2Screenshots.length);
      setCurrentScreenshotIndex(idx);
      setCurrentScreenshot(cs2Screenshots[idx]);
    }, 12000);

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
    <div className="cs2-redesign section-heading-redesign min-h-screen text-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="cs2-hero">
        {currentScreenshot && (
          <div
            className="bg"
            style={{ backgroundImage: `url(${currentScreenshot})` }}
          />
        )}
        <div className="wash" />
        <div className="grid-overlay" />
        <div className="live-badge">// LIVE FEED</div>

        <div className="content">
          <div className="kicker">
            // CHAPTER 03<span className="dot" />TACTICAL FPS
          </div>
          <h1>
            <span>{gameInfo?.title ?? 'COUNTER-STRIKE 2'}</span>
          </h1>
          <p className="lede">
            Legendární taktická FPS od Valve. Pokračování CS:GO na enginu Source 2 přináší nové kouřové granáty, sub-tick a vylepšenou fyziku.
          </p>
          <div className="data-strip">
            <div className="cell">
              <span className="label">Engine</span>
              <span className="val cyan">{gameInfo?.basicInfo.engine ?? 'Source 2'}</span>
            </div>
            <div className="cell">
              <span className="label">Released</span>
              <span className="val">{gameInfo?.basicInfo.releaseDate ?? '—'}</span>
            </div>
            <div className="cell">
              <span className="label">Mode</span>
              <span className="val">{gameInfo?.basicInfo.model ?? '—'}</span>
            </div>
            <div className="cell">
              <span className="label">Esport</span>
              <span className="val cyan">Tier · S</span>
            </div>
          </div>
        </div>

        <div className="indicator">
          {cs2Screenshots.map((_, i) => (
            <span key={i} className={i === currentScreenshotIndex ? 'active' : ''} />
          ))}
        </div>
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
      <section className="cs2-section">
        <div className="cs2-shell">
          <div className="cs2-section-header">
            <div className="cs2-section-kicker">// SECTION 01 · BATTLEGROUNDS</div>
            <h2 className="section-title"><span>MAPY V CS2</span></h2>
            <p className="cs2-section-sub">
              Aktivní competitive pool. Ikonické mapy přepracované pro Source 2.
            </p>
          </div>

          <div className="cs2-grid-cards">
            {maps.map((map, idx) => {
              const indexLabel = String(idx + 1).padStart(2, '0');
              const releasedYear = map.releaseDate
                ? new Date(map.releaseDate).getFullYear()
                : '—';
              const modeLabel = map.type.charAt(0).toUpperCase() + map.type.slice(1);
              return (
                <article key={map.id} className="cs2-card">
                  <div className="ix-bar">
                    <span className="index">// MAP · {indexLabel}</span>
                    <span className="ix-tag">{modeLabel.toUpperCase()}</span>
                  </div>
                  <div className="img-frame">
                    <Image
                      src={map.image}
                      alt={map.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                  <div className="body">
                    <h3>{map.name}</h3>
                    <p className="desc">{map.description}</p>
                    <div className="stats">
                      <div className="s">
                        <span className="lbl">Released</span>
                        <span className="val">{releasedYear}</span>
                      </div>
                      <div className="s">
                        <span className="lbl">Theme</span>
                        <span className="val">{map.theme ?? '—'}</span>
                      </div>
                      <div className="s">
                        <span className="lbl">Mode</span>
                        <span className="val cyan">{modeLabel}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Weapons Section */}
      <section className="cs2-section">
        <div className="cs2-shell">
          <div className="cs2-section-header">
            <div className="cs2-section-kicker">// SECTION 02 · ARMORY</div>
            <h2 className="section-title"><span>ZBRANĚ &amp; VYBAVENÍ</span></h2>
            <p className="cs2-section-sub">
              Široká škála zbraní pro každou ekonomickou situaci a strategii.
            </p>
          </div>

          <div className="cs2-weapon-tabs" role="tablist">
            {weaponCategories.map((category) => (
              <button
                key={category.id}
                role="tab"
                aria-pressed={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`cs2-weapon-tab ${activeCategory === category.id ? 'active' : ''}`}
              >
                {category.title}
                <span className="count">/ {String(category.weapons.length).padStart(2, '0')}</span>
              </button>
            ))}
          </div>

          {currentCategory && (
            <div className="cs2-grid-cards">
              {currentCategory.weapons.map((weapon, idx) => {
                const indexLabel = String(idx + 1).padStart(2, '0');
                const teamLabel = weapon.team.toUpperCase();
                return (
                  <article key={weapon.id} className="cs2-card">
                    <div className="ix-bar">
                      <span className="index">// WPN · {indexLabel}</span>
                      <span className="ix-tag">{currentCategory.title.toUpperCase()}</span>
                    </div>
                    <div className="img-frame weapon">
                      <Image
                        src={weapon.image}
                        alt={weapon.name}
                        width={160}
                        height={100}
                        unoptimized
                      />
                    </div>
                    <div className="body">
                      <h3>{weapon.name}</h3>
                      <p className="desc">{weapon.stats}</p>
                      <div className="stats">
                        <div className="s">
                          <span className="lbl">Price</span>
                          <span className="val cyan">{weapon.price}</span>
                        </div>
                        <div className="s">
                          <span className="lbl">Damage</span>
                          <span className="val">{weapon.damage}</span>
                        </div>
                        <div className="s">
                          <span className="lbl">Team</span>
                          <span className="val pink">{teamLabel}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AnimatedSection animation="fadeInUp" delay={0.5} className="text-center mt-12">
        <Link
          href="/"
          className={`inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${styles.pulseGlow}`}
        >
          Zpět na hlavní stránku
        </Link>
      </AnimatedSection>
    </div>
  );
}
