'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { WWEEra, WWEGame } from '../types/wwe';
import '../komplexaci.css'; // Import main page CSS for music player
import './wwe-redesign.css';

import WWEMusicPlayer from '../components/WWEMusicPlayer';
import Header from '../components/Header';
import { ERA_THEME, themedEra, type ThemedEra } from './eraTheme';
import Hero from './components/Hero';
import EraNav from './components/EraNav';
import EraSection from './components/EraSection';
import GameModal from './components/GameModal';

const ERA_ORDER = Object.keys(ERA_THEME);

function sortEras(eras: WWEEra[]): WWEEra[] {
  return [...eras].sort((a, b) => {
    const ai = ERA_ORDER.indexOf(a.id);
    const bi = ERA_ORDER.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function WWEGamesPage() {
  const [eras, setEras] = useState<ThemedEra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [activeEra, setActiveEra] = useState<string>('');
  const [modalData, setModalData] = useState<{ game: WWEGame; era: ThemedEra } | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Fetch eras
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/wwe/games');
        if (!res.ok) throw new Error('Failed to fetch WWE games');
        const data: WWEEra[] = await res.json();
        const ordered = sortEras(data).map(themedEra);
        setEras(ordered);
        if (ordered.length > 0) setActiveEra(ordered[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stop KOMPG Trax immediately when WWE page loads
  useEffect(() => {
    // Stop main page music immediately when WWE page loads
    console.log('WWE page loaded: Stopping KOMPG Trax immediately');

    // Stop main page music by clearing its localStorage state
    localStorage.removeItem('kompg-music-state');

    // Signal to main page that it should stop playing
    localStorage.setItem('stop-main-music', 'true');

    // Trigger a storage event for cross-page communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'stop-main-music',
      newValue: 'true'
    }));

    console.log('WWE page: KOMPG Trax stopped immediately on page load');
  }, []); // Run once on mount

  // Handle first user interaction to start WWE music
  const handleFirstInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);

      // Start WWE music by setting its state
      localStorage.setItem('wwe-music-state', JSON.stringify({
        isPlaying: true,
        track: 'WWF SmackDown! 2 Theme',
        page: 'wwe',
        autoStart: true
      }));

      // Trigger a storage event for cross-page communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'wwe-music-state',
        newValue: JSON.stringify({
          isPlaying: true,
          track: 'WWF SmackDown! 2 Theme',
          page: 'wwe',
          autoStart: true
        })
      }));

      console.log('WWE page interaction: Starting WWE music');
    }
  };

  // Scroll-spy: observe each era section
  useEffect(() => {
    if (eras.length === 0) return;
    const observers: IntersectionObserver[] = [];
    eras.forEach((era) => {
      const el = sectionRefs.current[era.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveEra(era.id);
        },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [eras]);

  // Honor #era-... hash on initial load
  useEffect(() => {
    if (loading || eras.length === 0) return;
    const hash = window.location.hash;
    if (!hash.startsWith('#era-')) return;
    const eraId = hash.slice(5);
    const el = sectionRefs.current[eraId];
    if (el) {
      // Defer to next paint so layout is ready
      requestAnimationFrame(() => {
        const headerOffset = 64;
        window.scrollTo({ top: el.offsetTop - headerOffset, behavior: 'smooth' });
      });
    }
  }, [loading, eras]);

  const scrollToEra = useCallback((eraId: string) => {
    const el = sectionRefs.current[eraId];
    if (!el) return;
    const headerOffset = 64;
    window.scrollTo({ top: el.offsetTop - headerOffset, behavior: 'smooth' });
  }, []);

  const handleStart = useCallback(() => {
    if (eras.length > 0) scrollToEra(eras[0].id);
  }, [eras, scrollToEra]);

  const handleGameClick = useCallback((game: WWEGame, era: ThemedEra) => {
    setModalData({ game, era });
  }, []);

  const totalGames = useMemo(() => eras.reduce((s, e) => s + e.games.length, 0), [eras]);

  if (loading) {
    return (
      <div
        className="wwe-redesign section-heading-redesign min-h-screen text-white"
        onClick={handleFirstInteraction}
      >
        <Header />
        <section className="wwe-loading-hero">
          <div className="wwe-loading-kicker">// LOADING BROADCAST</div>
          <h1 className="wwe-loading-title">WWE GAMES</h1>
          <div className="wwe-loading-lede">Tuning the broadcast frequency...</div>
          <div className="wwe-spinner" aria-hidden="true" />
        </section>
        <WWEMusicPlayer />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="wwe-redesign section-heading-redesign min-h-screen text-white"
        onClick={handleFirstInteraction}
      >
        <Header />
        <section className="wwe-error-hero">
          <div className="wwe-error-kicker">// BROADCAST INTERRUPTED</div>
          <h1 className="wwe-error-title">SIGNAL LOST</h1>
          <div className="wwe-error-lede">{error}</div>
          <button
            type="button"
            className="wwe-error-retry"
            onClick={() => window.location.reload()}
          >
            <span>RETRY BROADCAST</span>
            <span aria-hidden="true">↻</span>
          </button>
        </section>
        <WWEMusicPlayer />
      </div>
    );
  }

  return (
    <div
      className="wwe-redesign section-heading-redesign min-h-screen text-white"
      onClick={handleFirstInteraction}
    >
      <Header />

      <Hero totalGames={totalGames} erasCount={eras.length} onStart={handleStart} />

      <EraNav eras={eras} activeEra={activeEra} onJump={scrollToEra} />

      <main>
        {eras.map((era, i) => (
          <EraSection
            key={era.id}
            ref={(el) => {
              sectionRefs.current[era.id] = el;
            }}
            era={era}
            index={i}
            onGameClick={handleGameClick}
          />
        ))}
      </main>

      <footer className="wwe-page-footer">
        <div className="wwe-footer-stripe">
          <span className="wwe-footer-star">★</span>
          <span>KOMPLEXÁCI</span>
          <span>·</span>
          <span>WWE GAMES ARCHIVE</span>
          <span>·</span>
          <span>SINCE 1987</span>
          <span className="wwe-footer-star">★</span>
        </div>
        <Link href="/" className="wwe-footer-back">
          ← ZPĚT NA HLAVNÍ STRÁNKU
        </Link>
      </footer>

      {modalData && (
        <GameModal
          game={modalData.game}
          era={modalData.era}
          onClose={() => setModalData(null)}
        />
      )}

      <WWEMusicPlayer />
    </div>
  );
}
