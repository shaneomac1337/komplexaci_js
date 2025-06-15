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

// Optimized WWE 2K25 Screenshots from VGTimes (WebP format for better performance)
const wwe2k25Screenshots = [
  // High-quality WebP screenshots from VGTimes - much more optimized than PNG
  "https://files.vgtimes.com/gallery/main/206323/9344981705_ss_7adc40c010c02b60411cb69b7f28a94f43c61.webp",
  "https://files.vgtimes.com/gallery/main/206323/7512164258_ss_49b579cf1348f22f704c1e96aeec96db6111a.webp",
  "https://files.vgtimes.com/gallery/main/206323/83447946_ss_cd5d75da49b7c9fd0e2ce49b6a93f9f7d7aa5.webp",
  "https://files.vgtimes.com/gallery/main/206323/4457359374_ss_3f1b547e1a81ffed600e8f2bb1b8cb0c2e4f9.webp",
  "https://files.vgtimes.com/gallery/main/206323/4914032688_ss_9fd41962e47b65976bfce6cc3b452191e0c11.webp",
  "https://files.vgtimes.com/gallery/main/206323/5777564405_ss_8e4cddee3e1ae6d54a5a562053db657856ee7.webp",
  "https://files.vgtimes.com/gallery/main/206323/6034787668_ss_cc253c5f32a159138f2942dbe4f07c49e5826.webp",
  "https://files.vgtimes.com/gallery/main/206323/690796440_ss_4eb01e0ede11951b874306b62f3cf21594801.webp",
  "https://files.vgtimes.com/gallery/main/206323/393924380_ss_4bb721d03f9bc470cba3157d92abceb659c79.webp"
];



export default function WWEGamesPage() {
  const [eras, setEras] = useState<WWEEra[]>([]);
  const [gameInfo, setGameInfo] = useState<WWEGameInfo | null>(null);
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<string>('');

  // Function to get a random screenshot
  const getRandomWWEScreenshot = () => {
    const randomIndex = Math.floor(Math.random() * wwe2k25Screenshots.length);
    return wwe2k25Screenshots[randomIndex];
  };

  // Initialize random screenshot on component mount
  useEffect(() => {
    setCurrentScreenshot(getRandomWWEScreenshot());
  }, []);

  // Change screenshot every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreenshot(getRandomWWEScreenshot());
    }, 15000); // Change every 15 seconds

    return () => clearInterval(interval);
  }, []);

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
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 animate-pulse"></div>
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
        <div className="fixed bottom-8 right-8 bg-gray-800 rounded-full p-4 border border-blue-500/30 animate-pulse">
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
      <section className={`relative h-[80vh] min-h-[600px] flex items-center justify-center ${styles.heroSection} ${styles.parallaxBg} overflow-hidden`}>
        {/* Background Image using img element for better control */}
        {currentScreenshot && (
          <>
            {/* Blurred background layer */}
            <img
              src={currentScreenshot}
              alt="WWE 2K25 Screenshot Background"
              className="absolute inset-0 w-full h-full object-cover filter blur-xl brightness-30 scale-110"
              style={{ zIndex: 1 }}
            />

            {/* Main image layer - shows full image */}
            <img
              src={currentScreenshot}
              alt="WWE 2K25 Screenshot"
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
            {/* Clean WWE-style overlay */}
            <div className="bg-black/30 border-2 border-blue-500/50 rounded-2xl p-8 mx-8 relative overflow-hidden">
              {/* Static corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>

              {/* Static subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 rounded-2xl"></div>

              {/* Content */}
              <div className="relative z-10">
            <h1 className={`font-bold mb-4 ${styles.textShadow} ${styles.textGradient} ${styles.textGlow}`}>
              {gameInfo?.title}
            </h1>
            <AnimatedSection
              animation="fadeInUp"
              delay={0.3}
              className="text-xl font-light text-gray-200"
            >
              <span className={styles.textGlow}>
                Legendární kolekce wrestlingových klasik
              </span>
            </AnimatedSection>
            {currentScreenshot && (
              <div className="mt-4 text-sm text-blue-300 opacity-75"
                   style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6)' }}>
                <i className="fas fa-camera mr-2"></i>
                Od herních počátků až po současnost
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
                className={`bg-gray-800/50 rounded-lg p-8 border border-blue-500/30 ${styles.glowEffect} ${styles.cardHover}`}
              >
                <h3 className="text-2xl font-semibold mb-6 text-blue-400">Základní informace</h3>
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
                className={`bg-gray-800/50 rounded-lg p-8 border border-blue-500/30 ${styles.glowEffect} ${styles.cardHover}`}
              >
                <h3 className="text-2xl font-semibold mb-6 text-blue-400">{gameInfo.legacy.title}</h3>
                <p className="mb-4 text-gray-300">{gameInfo.legacy.description}</p>
                <ul className="space-y-2 text-sm">
                  {gameInfo.legacy.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
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
            <h3 className="text-blue-400 text-xl font-semibold mb-6 text-center">Filtrovat hry</h3>
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
                  <option value="golden">Golden Era</option>
                  <option value="new-generation">New Generation Era</option>
                  <option value="attitude">Attitude Era</option>
                  <option value="ruthless">Ruthless Aggression Era</option>
                  <option value="pg">PG Era</option>
                  <option value="reality">Reality Era</option>
                  <option value="new-era">New Era</option>
                  <option value="post-covid">Post-COVID Era</option>
                  <option value="renaissance">Renaissance Era</option>
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
                <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
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
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105"
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
                    <p className="text-blue-400 font-semibold">{era.subtitle}</p>
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
              className={`inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${styles.pulseGlow}`}
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