'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WeaponCategory, GameMap, GameInfo } from '../types/cs2';
import styles from './cs2.module.css';

export default function CS2Page() {
  const [weaponCategories, setWeaponCategories] = useState<WeaponCategory[]>([]);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('pistole');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <div className="text-white text-xl mt-4">Načítání Counter-Strike 2...</div>
          <div className="text-gray-400 text-sm mt-2">Připravujeme zbraně a mapy</div>
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
      {/* Hero Section */}
      <section className={`relative h-[60vh] flex items-center justify-center ${styles.heroSection}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-purple-600/30"></div>
        <div className={`relative z-10 text-center max-w-4xl px-4 ${styles.fadeInUp}`}>
          <h1 className={`text-6xl font-bold mb-4 ${styles.textShadow}`}>
            {gameInfo?.title}
          </h1>
          <p className={`text-xl font-light ${styles.staggered1}`}>
            Legendární taktická FPS střílečka od Valve
          </p>
        </div>
      </section>

      {/* Game Info Section */}
      {gameInfo && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">O hře Counter-Strike 2</h2>
            <p className="text-lg mb-12 text-center text-gray-300 max-w-4xl mx-auto">
              {gameInfo.description}
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className={`bg-gray-800/50 rounded-lg p-8 border border-red-500/30 ${styles.fadeInLeft} ${styles.glowEffect}`}>
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
              </div>

              {/* Game Mechanics */}
              <div className={`bg-gray-800/50 rounded-lg p-8 border border-red-500/30 ${styles.fadeInRight} ${styles.glowEffect}`}>
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
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Maps Section */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Mapy v Counter-Strike 2</h2>
          <p className="text-lg mb-12 text-center text-gray-300 max-w-4xl mx-auto">
            CS2 obsahuje řadu ikonických map, které byly vylepšeny pro Source 2 engine. 
            Každá mapa má své unikátní rozvržení a vyžaduje specifické strategie.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map, index) => (
              <div key={map.id} className={`bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-red-500/50 ${styles.mapCard} ${styles.fadeInUp} ${index % 3 === 0 ? styles.staggered1 : index % 3 === 1 ? styles.staggered2 : styles.staggered3}`}>
                <div className="h-48 relative">
                  <Image
                    src={map.image}
                    alt={map.name}
                    fill
                    className={`object-cover ${styles.mapImage}`}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{map.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{map.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {map.features.slice(0, 2).map((feature, index) => (
                      <span key={index} className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weapons Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Zbraně a vybavení</h2>
          <p className="text-lg mb-12 text-center text-gray-300 max-w-4xl mx-auto">
            CS2 nabízí širokou škálu zbraní a vybavení, které si hráči mohou zakoupit 
            na začátku každého kola podle své ekonomické situace a strategie.
          </p>

          {/* Weapon Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {weaponCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-full font-semibold ${styles.categoryButton} ${
                  activeCategory === category.id
                    ? `${styles.categoryButtonActive} text-white shadow-lg`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          {/* Current Category */}
          {currentCategory && (
            <div className="bg-gray-800/50 rounded-lg p-8 border border-red-500/30">
              <h3 className="text-2xl font-semibold mb-4">{currentCategory.title}</h3>
              <p className="text-gray-300 mb-8">{currentCategory.description}</p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentCategory.weapons.map((weapon, index) => (
                  <div key={weapon.id} className={`bg-gray-700/50 rounded-lg p-6 border border-gray-600 hover:border-red-500/50 ${styles.weaponCard} ${styles.fadeInUp} ${index % 3 === 0 ? styles.staggered1 : index % 3 === 1 ? styles.staggered2 : styles.staggered3}`}>
                    <div className="h-24 mb-4 flex items-center justify-center">
                      <Image
                        src={weapon.image}
                        alt={weapon.name}
                        width={120}
                        height={80}
                        className="object-contain"
                      />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{weapon.name}</h4>
                    <p className="text-red-400 font-semibold mb-2">{weapon.price}</p>
                    <p className="text-sm text-gray-300 mb-4">{weapon.stats}</p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p><strong>Poškození:</strong> {weapon.damage}</p>
                      <p><strong>Přesnost:</strong> {weapon.accuracy}</p>
                      <p><strong>Tým:</strong> {weapon.team}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-12">
            <Link 
              href="/komplexaci#hry" 
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300"
            >
              Zpět na přehled her
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
