'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WeaponCategory, GameMap, GameInfo } from '../types/cs2';
import '../komplexaci.css';
import './cs2-redesign.css';
import '../section-headings-redesign.css';

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
      <div className="cs2-redesign section-heading-redesign min-h-screen text-white">
        <Header />
        <section className="cs2-hero">
          <div className="wash" />
          <div className="grid-overlay" />
          <div className="content">
            <div className="kicker">{'// CHAPTER 03 · TACTICAL FPS'}</div>
            <h1><span>COUNTER-STRIKE 2</span></h1>
            <p className="lede">&nbsp;</p>
          </div>
        </section>

        <section className="cs2-section">
          <div className="cs2-shell">
            <div className="cs2-section-header">
              <div className="cs2-section-kicker">{'// SECTION 01 · BATTLEGROUNDS'}</div>
              <h2 className="section-title"><span>MAPY V CS2</span></h2>
            </div>
            <div className="cs2-grid-cards">
              <MapCardSkeleton count={6} />
            </div>
          </div>
        </section>

        <section className="cs2-section">
          <div className="cs2-shell">
            <div className="cs2-section-header">
              <div className="cs2-section-kicker">{'// SECTION 02 · ARMORY'}</div>
              <h2 className="section-title"><span>ZBRANĚ &amp; VYBAVENÍ</span></h2>
            </div>
            <div className="cs2-grid-cards">
              <WeaponCardSkeleton count={6} />
            </div>
          </div>
        </section>

        <div style={{ position: 'fixed', bottom: 32, right: 32 }}>
          <div className="cs2-spinner" />
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
        <div className="live-badge">{'// LIVE FEED'}</div>

        <div className="content">
          <div className="kicker">
            {'// CHAPTER 03'}<span className="dot" />TACTICAL FPS
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

      {/* Maps Section */}
      <section className="cs2-section">
        <div className="cs2-shell">
          <div className="cs2-section-header">
            <div className="cs2-section-kicker">{'// SECTION 01 · BATTLEGROUNDS'}</div>
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
                    <span className="index">{'// MAP · '}{indexLabel}</span>
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
            <div className="cs2-section-kicker">{'// SECTION 02 · ARMORY'}</div>
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
                      <span className="index">{'// WPN · '}{indexLabel}</span>
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

      {gameInfo && (
        <section className="cs2-section cs2-mechanics">
          <div className="cs2-shell">
            <div className="cs2-section-header">
              <div className="cs2-section-kicker">{'// SECTION 03 · MECHANICS'}</div>
              <h2 className="section-title"><span>HERNÍ MECHANIKY</span></h2>
              <p className="cs2-section-sub">{gameInfo.mechanics.description}</p>
            </div>

            <div className="cs2-mech-grid">
              {gameInfo.mechanics.features.map((feature, idx) => {
                const dashIndex = feature.indexOf(' - ');
                const title = dashIndex >= 0 ? feature.slice(0, dashIndex) : feature;
                const body = dashIndex >= 0 ? feature.slice(dashIndex + 3) : '';
                const numLabel = String(idx + 1).padStart(2, '0');
                return (
                  <div key={idx} className="cs2-mech-block">
                    <div className="num">{'// '}{numLabel}</div>
                    <h3>{title}</h3>
                    {body && <p>{body}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="cs2-cta-strip">
        <div className="cta-kicker">{'// END · CHAPTER 03'}</div>
        <Link href="/" className="cta-link">
          Zpět na hlavní stránku <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
