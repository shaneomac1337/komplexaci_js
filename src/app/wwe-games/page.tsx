'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WWEEra, WWEGameInfo, WWEGame } from '../types/wwe';
import styles from './wwe.module.css';
import '../komplexaci.css'; // Import main page CSS for music player

import AnimatedSection from '../components/AnimatedSection';
import SmartGrid from '../components/SmartGrid';
import WWEMusicPlayer from '../components/WWEMusicPlayer';
import Header from '../components/Header';



export default function WWEGamesPage() {
  const [eras, setEras] = useState<WWEEra[]>([]);
  const [gameInfo, setGameInfo] = useState<WWEGameInfo | null>(null);
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [gamesRes, gameInfoRes] = await Promise.all([
          fetch(`/api/wwe/games?era=${selectedEra}&series=${selectedSeries}`),
          fetch('/api/wwe/game-info')
        ]);

        if (!gamesRes.ok || !gameInfoRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [gamesData, gameInfoData] = await Promise.all([
          gamesRes.json(),
          gameInfoRes.json()
        ]);

        setEras(gamesData);
        setGameInfo(gameInfoData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEra, selectedSeries]);

  const handleFilterChange = (filterType: 'era' | 'series', value: string) => {
    if (filterType === 'era') {
      setSelectedEra(value);
    } else {
      setSelectedSeries(value);
    }
  };

  const resetFilters = () => {
    setSelectedEra('all');
    setSelectedSeries('all');
  };

  const getTotalGamesCount = () => {
    return eras.reduce((total, era) => total + era.games.length, 0);
  };

  // Handle first user interaction to stop main music and start WWE music
  const handleFirstInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      
      // Stop main page music by clearing its localStorage state
      localStorage.removeItem('kompg-music-state');
      
      // Signal to main page that it should stop playing
      localStorage.setItem('stop-main-music', 'true');
      
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
      
      console.log('WWE page interaction: Stopping main music and starting WWE music');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Hero Section Skeleton */}
        <section className="relative h-[60vh] bg-gray-800 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-red-600/20 animate-pulse"></div>
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

            {/* Games Skeleton */}
            <div className="py-20">
              <div className="h-12 bg-gray-700 rounded mb-8 w-64 mx-auto animate-pulse"></div>
              <SmartGrid animation="scaleIn">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 animate-pulse">
                    <div className="h-48 bg-gray-600 rounded mb-4"></div>
                    <div className="h-6 bg-gray-600 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-600 rounded mb-4 w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-600 rounded w-full"></div>
                      <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </SmartGrid>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="fixed bottom-8 right-8 bg-gray-800 rounded-full p-4 border border-yellow-500/30 animate-pulse">
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
    <div
      className="min-h-screen bg-gray-900 text-white"
      onClick={handleFirstInteraction}
    >
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className={`relative h-[60vh] flex items-center justify-center ${styles.heroSection} ${styles.parallaxBg}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-red-600/30"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <AnimatedSection
          className="relative z-10 text-center max-w-4xl px-4"
          animation="fadeInUp"
          duration={1.2}
        >
          <div className={`${styles.heroGlow} rounded-2xl p-8 backdrop-blur-sm`}>
            <h1 className={`font-bold mb-4 ${styles.textShadow} ${styles.textGradient}`}>
              {gameInfo?.title}
            </h1>
            <AnimatedSection
              animation="fadeInUp"
              delay={0.3}
              className="text-xl font-light text-gray-200"
            >
              Legendární kolekce wrestlingových klasik
            </AnimatedSection>
          </div>
        </AnimatedSection>
      </section>

      {/* Game Info Section */}
      {gameInfo && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection animation="fadeInUp" className="text-center mb-12">
              <h2 className={`text-2xl font-bold mb-6 ${styles.textGradient}`}>O WWE hrách</h2>
              <p className="text-lg text-gray-300 max-w-4xl mx-auto">
                {gameInfo.description}
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <AnimatedSection
                animation="fadeInLeft"
                delay={0.2}
                className={`bg-gray-800/50 rounded-lg p-8 border border-yellow-500/30 ${styles.glowEffect} ${styles.cardHover}`}
              >
                <h3 className="text-2xl font-semibold mb-6 text-yellow-400">Základní informace</h3>
                <ul className="space-y-3">
                  <li><strong>Vývojář:</strong> {gameInfo.basicInfo.developer}</li>
                  <li><strong>Vydavatel:</strong> {gameInfo.basicInfo.publisher}</li>
                  <li><strong>První hra:</strong> {gameInfo.basicInfo.firstGame}</li>
                  <li><strong>Nejnovější hra:</strong> {gameInfo.basicInfo.latestGame}</li>
                  <li><strong>Žánr:</strong> {gameInfo.basicInfo.genre}</li>
                  <li><strong>Platformy:</strong> {gameInfo.basicInfo.platforms}</li>
                  <li><strong>Celkem her:</strong> {gameInfo.basicInfo.totalGames}</li>
                </ul>
              </AnimatedSection>

              {/* Legacy */}
              <AnimatedSection
                animation="fadeInRight"
                delay={0.4}
                className={`bg-gray-800/50 rounded-lg p-8 border border-yellow-500/30 ${styles.glowEffect} ${styles.cardHover}`}
              >
                <h3 className="text-2xl font-semibold mb-6 text-yellow-400">{gameInfo.legacy.title}</h3>
                <p className="mb-4 text-gray-300">{gameInfo.legacy.description}</p>
                <ul className="space-y-2 text-sm">
                  {gameInfo.legacy.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
            </div>
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="py-10 px-4 bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp" className={styles.filterSection}>
            <h3 className="text-yellow-400 text-xl font-semibold mb-6 text-center">Filtrovat hry</h3>
            <div className="grid md:grid-cols-3 gap-6 items-end">
              <div className="flex flex-col gap-2">
                <label htmlFor="era-filter" className="text-gray-300 font-medium">Éra:</label>
                <select
                  id="era-filter"
                  value={selectedEra}
                  onChange={(e) => handleFilterChange('era', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">Všechny éry</option>
                  <option value="golden">Golden Era (1984-1993)</option>
                  <option value="new-generation">New Generation Era (1993-1997)</option>
                  <option value="attitude">Attitude Era (1997-2002)</option>
                  <option value="ruthless">Ruthless Aggression Era (2002-2008)</option>
                  <option value="pg">PG Era (2008-2014)</option>
                  <option value="reality">Reality Era (2014-2016)</option>
                  <option value="new-era">New Era (2016-2021)</option>
                  <option value="post-covid">Post-COVID Era (2021-2023)</option>
                  <option value="renaissance">Renaissance Era (2023-present)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="series-filter" className="text-gray-300 font-medium">Série:</label>
                <select
                  id="series-filter"
                  value={selectedSeries}
                  onChange={(e) => handleFilterChange('series', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">Všechny série</option>
                  <option value="smackdown">SmackDown!</option>
                  <option value="svr">SmackDown vs. Raw</option>
                  <option value="2k">WWE 2K</option>
                  <option value="wrestlemania">WrestleMania</option>
                  <option value="n64">N64 Classics</option>
                  <option value="arcade">Arcade Games</option>
                  <option value="gamecube">GameCube Era</option>
                  <option value="standalone">Standalone</option>
                </select>
              </div>

              <button
                onClick={resetFilters}
                className={styles.filterResetBtn}
              >
                <i className="fas fa-undo"></i> Reset filtrů
              </button>
            </div>

            {(selectedEra !== 'all' || selectedSeries !== 'all') && (
              <div className="mt-4 text-center">
                <span className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold">
                  Zobrazeno {getTotalGamesCount()} her
                </span>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp" className="text-center mb-12">
            <h2 className={`text-2xl font-bold mb-6 ${styles.textGradient}`}>Legendární Kolekce WWE/WWF Her</h2>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              Objevte kompletní historii wrestlingových klasik - od prvních arkádových her až po moderní 2K série
            </p>
          </AnimatedSection>

          {eras.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-300">Žádné hry neodpovídají vybraným filtrům</h3>
              <p className="text-gray-400 mb-8">Zkuste změnit kritéria filtru nebo resetovat filtry.</p>
              <button
                onClick={resetFilters}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105"
              >
                <i className="fas fa-undo mr-2"></i> Resetovat filtry
              </button>
            </div>
          ) : (
            eras.map((era, eraIndex) => (
              <div key={era.id} className="mb-20">
                {/* Era Divider */}
                <AnimatedSection
                  animation="fadeInUp"
                  delay={eraIndex * 0.1}
                  className={styles.eraDivider}
                >
                  <div className={styles.eraTitle}>
                    <h2 className={`text-xl font-bold mb-2 ${styles.textGradient}`}>{era.title}</h2>
                    <p className="text-yellow-400 font-semibold">{era.subtitle}</p>
                  </div>
                  <p className="text-gray-300 max-w-4xl mx-auto mt-6 text-lg leading-relaxed">
                    {era.description}
                  </p>
                </AnimatedSection>

                {/* Games Grid */}
                <SmartGrid
                  staggerDelay={0.1}
                  animation="scaleIn"
                  maxColumns={3}
                >
                  {era.games.map((game: WWEGame) => (
                    <div
                      key={game.id}
                      className={`${styles.gameCard} ${styles.cardHover} ${styles.imageReveal} rounded-3xl p-8`}
                    >
                      {/* Game Cover */}
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <Image
                            src={game.cover}
                            alt={game.title}
                            width={210}
                            height={260}
                            className={`${styles.gameCover} rounded-2xl object-cover`}
                            unoptimized
                            onError={(e) => {
                              console.error('Game cover failed to load:', game.cover, e);
                            }}
                          />
                        </div>
                      </div>

                      {/* Game Info */}
                      <div className="text-center relative z-10">
                        <h3 className={`text-xl font-bold mb-2 ${styles.textGradient} uppercase tracking-wide`}>
                          {game.title}
                        </h3>
                        <p className="text-blue-300 font-bold text-lg mb-2 uppercase tracking-wider">
                          {game.year}
                        </p>
                        <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4 uppercase tracking-wide">
                          {game.platform}
                        </div>
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                          {game.description}
                        </p>

                        {/* Features */}
                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl p-4 border border-blue-500/20">
                          <div className="grid grid-cols-2 gap-2">
                            {game.features.map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center text-xs text-gray-300"
                              >
                                <span className="text-blue-400 mr-2 text-sm">◆</span>
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </SmartGrid>
              </div>
            ))
          )}

          <AnimatedSection animation="fadeInUp" delay={0.5} className="text-center mt-12">
            <Link
              href="/"
              className={`inline-block bg-gradient-to-r from-yellow-500 to-red-500 hover:from-red-500 hover:to-yellow-500 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${styles.pulseGlow}`}
            >
              Zpět na hlavní stránku
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* WWE Music Player */}
      <WWEMusicPlayer />
    </div>
  );
}