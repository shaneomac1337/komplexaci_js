"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './lol.module.css';
import '../komplexaci.css';
import Header from '../components/Header';
import SummonerSearch from './components/SummonerSearch';
import KomplexaciStatus from './components/KomplexaciStatus';

// Types
interface Champion {
  id: string;
  key: string;
  name: string;
  title: string;
  description: string;
  splash: string;
  square: string;
  difficulty: string;
  damage: string;
  survivability: string;
  roles: string[];
  rangeType: string;
  championClass: string;
  region: string;
}

interface ChampionDetails {
  id: string;
  name: string;
  title: string;
  lore: string;
  splash: string;
  square: string;
  passive: {
    name: string;
    description: string;
    image: string;
  };
  spells: Array<{
    id: string;
    name: string;
    description: string;
    image: string;
    cooldown: number[];
    cost: number[];
    range: number[];
    key: string;
  }>;
  skins: Array<{
    id: string;
    name: string;
    num: number;
    splash: string;
    loading: string;
  }>;
  stats: {
    hp: number;
    hpperlevel: number;
    mp: number;
    mpperlevel: number;
    movespeed: number;
    armor: number;
    armorperlevel: number;
    spellblock: number;
    spellblockperlevel: number;
    attackrange: number;
    hpregen: number;
    hpregenperlevel: number;
    mpregen: number;
    mpregenperlevel: number;
    crit: number;
    critperlevel: number;
    attackdamage: number;
    attackdamageperlevel: number;
    attackspeedperlevel: number;
    attackspeed: number;
  };
  roles: string[];
  allytips: string[];
  enemytips: string[];
}

// Map data
const maps = [
  {
    id: 'summoners-rift',
    name: "Summoner's Rift",
    description: 'Klasická 5v5 mapa s třemi linkami a džunglí. Hlavní kompetitivní mapa League of Legends.',
    image: '/komplexaci/img/lol-summoners-rift-artwork.jpg',
    gameMode: '5v5 Ranked'
  },
  {
    id: 'bridge-of-progress',
    name: 'Bridge of Progress',
    description: 'Nová mapa s unikátním designem a strategickými možnostmi. Moderní prostředí pro kompetitivní hru.',
    image: '/komplexaci/img/lol-bridge-of-progress.jpg',
    gameMode: 'ARAM'
  },
  {
    id: 'teamfight-tactics',
    name: 'Teamfight Tactics: Convergence',
    description: 'Auto-battler herní mód s strategickým umisťováním jednotek. Sbírejte šampiony a vytvářejte mocné týmy.',
    image: '/komplexaci/img/lol-tft-artwork.jpg',
    gameMode: 'TFT'
  }
];

// Position data
const positions = [
  { id: 'ALL', name: 'Všechny', icon: '🎮', count: 0 },
  { id: 'TOP', name: 'Top', icon: '⚔️', count: 0 },
  { id: 'JUNGLE', name: 'Jungle', icon: '🌲', count: 0 },
  { id: 'MID', name: 'Mid', icon: '🔮', count: 0 },
  { id: 'ADC', name: 'ADC', icon: '🏹', count: 0 },
  { id: 'SUPPORT', name: 'Support', icon: '🛡️', count: 0 }
];

// Available locales for DataDragon API
const AVAILABLE_LOCALES = [
  { code: 'cs_CZ', name: 'Čeština', flag: '🇨🇿' },
  { code: 'en_US', name: 'English', flag: '🇺🇸' },
  { code: 'de_DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es_ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr_FR', name: 'Français', flag: '🇫🇷' },
  { code: 'it_IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pl_PL', name: 'Polski', flag: '🇵🇱' },
  { code: 'pt_BR', name: 'Português', flag: '🇧🇷' },
  { code: 'ru_RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'tr_TR', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ja_JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko_KR', name: '한국어', flag: '🇰🇷' },
  { code: 'zh_CN', name: '中文', flag: '🇨🇳' }
];

export default function LeagueOfLegendsNextJS() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    difficulty: [] as string[],
    damage: [] as string[],
    survivability: [] as string[],
    rangeType: [] as string[],
    championClass: [] as string[],
    region: [] as string[],
    roles: [] as string[]
  });
  const [activePosition, setActivePosition] = useState('ALL');
  const [positionCounts, setPositionCounts] = useState(positions);
  
  // Modal state
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [championDetails, setChampionDetails] = useState<ChampionDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'abilities' | 'skins' | 'tips'>('overview');
  
  // Background rotation state
  const [currentChampionSplash, setCurrentChampionSplash] = useState<string | null>(null);
  const [currentChampionName, setCurrentChampionName] = useState<string>('');
  
  // DataDragon API state
  const [currentVersion, setCurrentVersion] = useState<string>('15.10.1');
  const [currentLocale, setCurrentLocale] = useState<string>('cs_CZ');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [showApiInfo, setShowApiInfo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Toggle state for Champions vs Summoner Search
  const [showChampions, setShowChampions] = useState(false);

  // Background rotation functions
  const getRandomChampionSplash = () => {
    if (champions.length === 0) return null;
    const randomChampion = champions[Math.floor(Math.random() * champions.length)];
    setCurrentChampionName(randomChampion.name);
    return randomChampion.splash;
  };

  // Initialize random champion splash on component mount
  useEffect(() => {
    if (champions.length > 0) {
      const randomChampion = champions[Math.floor(Math.random() * champions.length)];
      setCurrentChampionSplash(randomChampion.splash);
      setCurrentChampionName(randomChampion.name);
    }
  }, [champions.length]); // Only depend on length, not the entire array

  // Change champion splash every 8 seconds
  useEffect(() => {
    if (champions.length === 0) return;

    const interval = setInterval(() => {
      const randomChampion = champions[Math.floor(Math.random() * champions.length)];
      setCurrentChampionSplash(randomChampion.splash);
      setCurrentChampionName(randomChampion.name);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [champions.length]); // Only depend on length, not the entire array

  // DataDragon API functions
  const getLatestVersion = async () => {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      if (!response.ok) throw new Error('Failed to fetch version');
      const versions = await response.json();
      setAvailableVersions(versions.slice(0, 10)); // Store top 10 versions
      return versions[0];
    } catch (error) {
      console.error('Failed to fetch version:', error);
      return '15.10.1'; // Fallback version
    }
  };

  const handleLocaleChange = async (newLocale: string) => {
    setCurrentLocale(newLocale);
    // Smoothly refresh champions with new locale without full page loading
    await refreshChampionsData(newLocale, currentVersion);
  };

  const handleVersionChange = async (newVersion: string) => {
    setCurrentVersion(newVersion);
    // Smoothly refresh champions with new version without full page loading
    await refreshChampionsData(currentLocale, newVersion);
  };

  const refreshChampionsData = async (locale: string, version: string) => {
    try {
      setIsRefreshing(true);
      // Use our API endpoint with locale and version parameters
      const params = new URLSearchParams();
      if (locale) params.append('locale', locale);
      if (version) params.append('version', version);

      const response = await fetch(`/api/lol/champions?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let championList = await response.json();

      // Force alphabetical sorting and fix Wukong positioning
      championList = championList.map((champion: any) => ({
        ...champion,
        // Force MonkeyKing to be displayed as Wukong for proper alphabetical sorting
        name: champion.name === 'MonkeyKing' ? 'Wukong' : champion.name
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));

      setChampions(championList);
      setFilteredChampions(championList);
      
      // Update position counts
      const newCounts = positions.map(pos => ({
        ...pos,
        count: pos.id === 'ALL' ? championList.length : championList.filter((champ: Champion) => champ.roles.includes(pos.id)).length
      }));
      setPositionCounts(newCounts);
      
      // Show success indicator briefly
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
      
    } catch (err) {
      console.error('Failed to refresh champions:', err);
      // Show a subtle error message instead of full error state
      setError('Failed to update language. Please try again.');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };




  const fetchChampions = async (locale?: string, version?: string) => {
    try {
      setLoading(true);
      const apiVersion = version || await getLatestVersion();
      const apiLocale = locale || currentLocale;

      if (!version) {
        setCurrentVersion(apiVersion);
      }

      // Use our API endpoint with locale and version parameters
      const params = new URLSearchParams();
      if (apiLocale) params.append('locale', apiLocale);
      if (apiVersion) params.append('version', apiVersion);

      const response = await fetch(`/api/lol/champions?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let championList = await response.json();

      // Force alphabetical sorting and fix Wukong positioning
      championList = championList.map((champion: any) => ({
        ...champion,
        // Force MonkeyKing to be displayed as Wukong for proper alphabetical sorting
        name: champion.name === 'MonkeyKing' ? 'Wukong' : champion.name
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));

      setChampions(championList);
      setFilteredChampions(championList);
      
      // Update position counts
      const newCounts = positions.map(pos => ({
        ...pos,
        count: pos.id === 'ALL' ? championList.length : championList.filter((champ: Champion) => champ.roles.includes(pos.id)).length
      }));
      setPositionCounts(newCounts);
      
    } catch (err) {
      console.error('Failed to fetch champions:', err);
      setError('Failed to load champions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChampionDetails = async (championId: string) => {
    try {
      setModalLoading(true);
      setModalError(null);

      const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/${currentLocale}/champion/${championId}.json`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const champion = data.data[championId];

      if (!champion) {
        throw new Error('Champion not found');
      }

      // Process spells with keys
      const spells = champion.spells.map((spell: any, index: number) => ({
        id: spell.id,
        name: spell.name,
        description: spell.description,
        image: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${spell.image.full}`,
        cooldown: spell.cooldown,
        cost: spell.cost,
        range: spell.range,
        key: ['Q', 'W', 'E', 'R'][index]
      }));

      // Process skins
      const skins = champion.skins.map((skin: any) => ({
        id: skin.id,
        name: skin.name === 'default' ? champion.name : skin.name,
        num: skin.num,
        splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_${skin.num}.jpg`,
        loading: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion.id}_${skin.num}.jpg`
      }));

      const championDetails: ChampionDetails = {
        id: champion.id,
        name: champion.name,
        title: champion.title,
        lore: champion.lore,
        splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`,
        square: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champion.id}.png`,
        passive: {
          name: champion.passive.name,
          description: champion.passive.description,
          image: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${champion.passive.image.full}`
        },
        spells,
        skins,
        stats: champion.stats,
        roles: champion.roles || ['MID'],
        allytips: champion.allytips || [],
        enemytips: champion.enemytips || []
      };

      setChampionDetails(championDetails);
      
    } catch (err) {
      console.error('Failed to fetch champion details:', err);
      setModalError('Failed to load champion details. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };



  useEffect(() => {
    fetchChampions();
  }, []);

  useEffect(() => {
    // Filter champions based on position, search, and advanced filters
    let filtered = champions;

    // Filter by position
    if (activePosition !== 'ALL') {
      filtered = filtered.filter(champion => champion.roles.includes(activePosition));
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(champion =>
        champion.name.toLowerCase().includes(searchLower) ||
        champion.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply advanced filters
    if (advancedFilters.difficulty.length > 0) {
      filtered = filtered.filter(champion => advancedFilters.difficulty.includes(champion.difficulty));
    }

    if (advancedFilters.damage.length > 0) {
      filtered = filtered.filter(champion => advancedFilters.damage.includes(champion.damage));
    }

    if (advancedFilters.survivability.length > 0) {
      filtered = filtered.filter(champion => advancedFilters.survivability.includes(champion.survivability));
    }

    if (advancedFilters.rangeType.length > 0) {
      filtered = filtered.filter(champion => advancedFilters.rangeType.includes(champion.rangeType));
    }

    if (advancedFilters.championClass.length > 0) {
      filtered = filtered.filter(champion => advancedFilters.championClass.includes(champion.championClass));
    }

    if (advancedFilters.region.length > 0) {
      filtered = filtered.filter(champion => advancedFilters.region.includes(champion.region));
    }

    if (advancedFilters.roles.length > 0) {
      filtered = filtered.filter(champion =>
        champion.roles.some(role => advancedFilters.roles.includes(role))
      );
    }

    setFilteredChampions(filtered);
  }, [champions, activePosition, searchTerm, advancedFilters]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedChampion) {
        closeChampionModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedChampion]);

  const handlePositionFilter = (positionId: string) => {
    setActivePosition(positionId);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const openChampionModal = (champion: Champion) => {
    setSelectedChampion(champion);
    setActiveTab('overview');
    setChampionDetails(null);
    setModalError(null);
    fetchChampionDetails(champion.id);
    document.body.style.overflow = 'hidden';
  };

  const closeChampionModal = () => {
    setSelectedChampion(null);
    setChampionDetails(null);
    setModalError(null);
    setActiveTab('overview');
    document.body.style.overflow = 'auto';
  };

  const handleTabChange = (tab: 'overview' | 'abilities' | 'skins' | 'tips') => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />

        {/* Static content that Google can see */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center">
          <div className="text-center max-w-4xl px-4">
            <h1 className="text-6xl font-bold mb-4 text-white">League of Legends</h1>
            <p className="text-xl text-gray-200 mb-4">
              Nejpopulárnější MOBA hra na světě od Riot Games
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Komplexáci se specializuje na League of Legends. Objevte více než 160 unikátních šampionů,
              jejich schopnosti, role a herní strategie.
            </p>

            {/* Loading indicator */}
            <div className="mt-8">
              <div className={styles.loadingSpinner}></div>
              <p className="text-xl text-gray-300 mt-4">Načítání šampionů...</p>
            </div>
          </div>
        </section>

        {/* Static game info that's always visible */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">O hře League of Legends</h2>
            <p className="text-xl text-gray-200 max-w-4xl mx-auto">
              League of Legends (LoL) je týmová strategická hra, ve které dva týmy po pěti hráčích
              bojují proti sobě s cílem zničit nepřátelskou základnu. Každý hráč ovládá jedinečného
              šampiona s unikátními schopnostmi a rolí v týmu.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />

        {/* Static content that Google can see even with errors */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center">
          <div className="text-center max-w-4xl px-4">
            <h1 className="text-6xl font-bold mb-4 text-white">League of Legends</h1>
            <p className="text-xl text-gray-200 mb-4">
              Nejpopulárnější MOBA hra na světě od Riot Games
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Komplexáci se specializuje na League of Legends. Objevte více než 160 unikátních šampionů,
              jejich schopnosti, role a herní strategie.
            </p>

            {/* Error message */}
            <div className="mt-8 bg-red-900/20 border border-red-500/50 rounded-lg p-6">
              <p className="text-xl text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchChampions()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zkusit znovu
              </button>
            </div>
          </div>
        </section>

        {/* Static game info that's always visible */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">O hře League of Legends</h2>
            <p className="text-xl text-gray-200 max-w-4xl mx-auto mb-8">
              League of Legends (LoL) je týmová strategická hra, ve které dva týmy po pěti hráčích
              bojují proti sobě s cílem zničit nepřátelskou základnu. Každý hráč ovládá jedinečného
              šampiona s unikátními schopnostmi a rolí v týmu.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-black/30 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Herní módy</h3>
                <p className="text-gray-300">
                  LoL nabízí různé herní módy od klasického 5v5 Ranked po rychlé ARAM zápasy
                  a strategické Teamfight Tactics.
                </p>
              </div>
              <div className="bg-black/30 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Šampioni</h3>
                <p className="text-gray-300">
                  Více než 160 unikátních šampionů s různými schopnostmi, rolemi a herními styly.
                  Každý šampion nabízí jiný způsob hry.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900" style={{ fontFamily: "'Exo 2', 'Roboto', sans-serif" }}>

        {/* NoScript fallback for crawlers and users without JavaScript */}
        <noscript>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-6xl font-bold text-white text-center mb-8">League of Legends | Komplexáci</h1>
              <p className="text-2xl text-gray-200 text-center mb-12">
                Nejpopulárnější MOBA hra na světě od Riot Games
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-black/30 border border-blue-500/30 rounded-lg p-8">
                  <h2 className="text-3xl font-bold text-white mb-4">O hře</h2>
                  <p className="text-lg text-gray-300 mb-4">
                    League of Legends (LoL) je týmová strategická hra, ve které dva týmy po pěti hráčích
                    bojují proti sobě s cílem zničit nepřátelskou základnu.
                  </p>
                  <p className="text-lg text-gray-300">
                    Každý hráč ovládá jedinečného šampiona s unikátními schopnostmi a rolí v týmu.
                  </p>
                </div>

                <div className="bg-black/30 border border-blue-500/30 rounded-lg p-8">
                  <h2 className="text-3xl font-bold text-white mb-4">Šampioni</h2>
                  <p className="text-lg text-gray-300 mb-4">
                    Více než 160 unikátních šampionů s různými schopnostmi, rolemi a herními styly.
                  </p>
                  <p className="text-lg text-gray-300">
                    Pro zobrazení interaktivního seznamu šampionů povolte JavaScript.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Komplexáci a League of Legends</h3>
                <p className="text-lg text-gray-300 max-w-4xl mx-auto">
                  Klan Komplexáci se specializuje na League of Legends a sdílí herní strategie,
                  tipy a zážitky z této populární MOBA hry. Připojte se k naší komunitě!
                </p>
              </div>
            </div>
          </div>
        </noscript>

        {/* Header */}
        <Header />
        
        {/* Hero Section */}
        <section className={`relative h-[80vh] min-h-[600px] flex items-center justify-center ${styles.heroSection} ${styles.parallaxBg} overflow-hidden`}>
          {/* Background Image using champion splash art */}
          {currentChampionSplash && (
            <>
              {/* Blurred background layer */}
              <img
                src={currentChampionSplash}
                alt="Champion Splash Background"
                className="absolute inset-0 w-full h-full object-cover filter blur-xl brightness-30 scale-110"
                style={{ zIndex: 1 }}
              />

              {/* Main image layer - shows full champion splash */}
              <img
                src={currentChampionSplash}
                alt="Champion Splash"
                className="absolute inset-0 w-full h-full object-contain filter brightness-75"
                style={{ zIndex: 2 }}
              />
            </>
          )}

          <div className="relative z-10 text-center max-w-4xl px-4">
            <div className="relative">
              {/* LoL-style overlay */}
              <div className="bg-black/30 border-2 border-blue-500/50 rounded-2xl p-8 mx-8 relative overflow-hidden">
                {/* LoL-style corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>

                {/* Animated border effect */}
                <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl opacity-50"></div>

                {/* Content */}
                <div className="relative z-10">
                  <h1 className={`text-6xl font-bold mb-4 ${styles.textShadow} ${styles.textGradient}`}>
                    League of Legends
                  </h1>
                  <p className="text-xl font-light text-gray-200 mb-4">
                    <span className={styles.textGlow}>
                      Nejpopulárnější MOBA hra na světě od Riot Games
                    </span>
                  </p>
                  {currentChampionSplash && currentChampionName && (
                    <div className="mt-4 text-sm text-blue-300 opacity-75"
                         style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6)' }}>
                      <i className="fas fa-star mr-2"></i>
                      Aktuální šampion: {currentChampionName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Game Info Section */}
        <section className={`${styles.gameInfoSection} ${styles.section}`}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>O hře League of Legends</h2>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#f0e6d2', maxWidth: '800px', margin: '0 auto 50px' }}>
              League of Legends (LoL) je týmová strategická hra, ve které dva týmy po pěti hráčích bojují proti sobě s cílem zničit nepřátelskou základnu. Každý hráč ovládá jedinečného šampiona s unikátními schopnostmi a rolí v týmu.
            </p>
            
            <div className={styles.gameInfoGrid}>
              <div className={styles.gameInfoCard}>
                <h3>Herní módy</h3>
                <p>LoL nabízí různé herní módy od klasického 5v5 Ranked po rychlé ARAM zápasy a strategické Teamfight Tactics.</p>
              </div>
              <div className={styles.gameInfoCard}>
                <h3>Šampioni</h3>
                <p>Více než 160 unikátních šampionů s různými schopnostmi, rolemi a herními styly. Každý šampion nabízí jiný způsob hry.</p>
              </div>
            </div>

            {/* Maps Grid */}
            <div className={styles.gameMapGrid}>
              {maps.map((map) => (
                <div key={map.id} className={styles.gameMapCard}>
                  <div className={styles.gameMapImage}>
                    <Image
                      src={map.image}
                      alt={map.name}
                      width={400}
                      height={250}
                      className="object-cover"
                    />
                  </div>
                  <div className={styles.gameMapContent}>
                    <h3 className={styles.gameMapTitle}>{map.name}</h3>
                    <p style={{ color: '#bababa', marginBottom: '10px' }}>{map.description}</p>
                    <span style={{ 
                      background: 'rgba(110, 79, 246, 0.2)', 
                      color: '#6e4ff6', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {map.gameMode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Komplexáci Status Section */}
        <KomplexaciStatus />

        {/* Toggle Switch Section */}
        <section className={styles.toggleSection}>
          <div className={styles.container}>
            <div className={styles.toggleContainer}>
              <h3 className={styles.toggleTitle}>Vyberte sekci</h3>
              <div className={styles.toggleWrapper}>
                <span className={`${styles.toggleLabel} ${!showChampions ? styles.active : ''}`}>
                  🔍 Vyhledávání hráčů
                </span>
                <div className={styles.toggleSwitch} onClick={() => setShowChampions(!showChampions)}>
                  <div className={`${styles.toggleSlider} ${showChampions ? styles.right : styles.left}`}>
                    <div className={styles.toggleHandle}></div>
                  </div>
                </div>
                <span className={`${styles.toggleLabel} ${showChampions ? styles.active : ''}`}>
                  ⚔️ Championové
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Conditional Sections */}
        {!showChampions && (
          /* Summoner Search Section */
          <SummonerSearch />
        )}

        {showChampions && (
          /* Champions Section */
          <section className={`${styles.section}`} style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Champions</h2>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#f0e6d2', maxWidth: '800px', margin: '0 auto 50px' }}>
              Objevte více než 160 unikátních championů, každý s vlastními schopnostmi a herním stylem.
            </p>

            {/* Static content visible even before champions load */}
            {champions.length === 0 && !loading && !error && (
              <div className="text-center py-16">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-3xl font-bold text-white mb-6">League of Legends Champions</h3>
                  <p className="text-xl text-gray-300 mb-8">
                    League of Legends obsahuje více než 160 unikátních šampionů rozdělených do různých rolí:
                  </p>

                  <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4">
                      <div className="text-3xl mb-2">⚔️</div>
                      <h4 className="text-lg font-bold text-white mb-2">Top Lane</h4>
                      <p className="text-sm text-gray-300">Tanky a fighters pro horní linku</p>
                    </div>
                    <div className="bg-black/30 border border-green-500/30 rounded-lg p-4">
                      <div className="text-3xl mb-2">🌲</div>
                      <h4 className="text-lg font-bold text-white mb-2">Jungle</h4>
                      <p className="text-sm text-gray-300">Šampioni pro džungli a ganky</p>
                    </div>
                    <div className="bg-black/30 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-3xl mb-2">🔮</div>
                      <h4 className="text-lg font-bold text-white mb-2">Mid Lane</h4>
                      <p className="text-sm text-gray-300">Mágové a assassini pro střed</p>
                    </div>
                    <div className="bg-black/30 border border-red-500/30 rounded-lg p-4">
                      <div className="text-3xl mb-2">🏹</div>
                      <h4 className="text-lg font-bold text-white mb-2">ADC</h4>
                      <p className="text-sm text-gray-300">Střelci pro spodní linku</p>
                    </div>
                    <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-4">
                      <div className="text-3xl mb-2">🛡️</div>
                      <h4 className="text-lg font-bold text-white mb-2">Support</h4>
                      <p className="text-sm text-gray-300">Podpora pro ADC</p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-400">
                    Načítání detailních informací o šampionech...
                  </p>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Hledat šampiona..."
                value={searchTerm}
                onChange={handleSearch}
                className={styles.searchBar}
              />
            </div>

            {/* DataDragon API Info */}
            <div className={styles.apiInfoSection}>
              <div className={styles.apiInfoHeader}>
                <div className={styles.apiInfoTitle}>
                  <span className={styles.apiIcon}>🔗</span>
                  DataDragon API
                </div>
                <div className={styles.apiHeaderControls}>
                  <div className={styles.apiQuickControl}>
                    <span className={styles.apiQuickLabel}>Jazyk:</span>
                    <div className={styles.selectContainer}>
                      <select
                        value={currentLocale}
                        onChange={(e) => handleLocaleChange(e.target.value)}
                        className={`${styles.apiQuickSelect} ${isRefreshing ? styles.refreshing : ''}`}
                        disabled={isRefreshing}
                      >
                        {AVAILABLE_LOCALES.map(locale => (
                          <option key={locale.code} value={locale.code}>
                            {locale.flag} {locale.name}
                          </option>
                        ))}
                      </select>
                      {isRefreshing && (
                        <div className={styles.refreshSpinner}>
                          <div className={styles.miniSpinner}></div>
                        </div>
                      )}
                      {refreshSuccess && (
                        <div className={styles.successIndicator}>
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.apiToggleButton}
                    onClick={() => setShowApiInfo(!showApiInfo)}
                  >
                    {showApiInfo ? '▼' : '▶'} Více
                  </button>
                </div>
              </div>
              
              <div className={styles.apiInfoBasic}>
                <div className={styles.apiInfoItem}>
                  <span className={styles.apiLabel}>Verze:</span>
                  <span className={styles.apiValue}>{currentVersion}</span>
                </div>
                <div className={styles.apiInfoItem}>
                  <span className={styles.apiLabel}>Šampioni:</span>
                  <span className={styles.apiValue}>{champions.length}</span>
                </div>
                <div className={styles.apiInfoItem}>
                  <span className={styles.apiLabel}>Aktuální jazyk:</span>
                  <span className={styles.apiValue}>
                    {AVAILABLE_LOCALES.find(l => l.code === currentLocale)?.flag} {AVAILABLE_LOCALES.find(l => l.code === currentLocale)?.name}
                  </span>
                </div>
              </div>

              {showApiInfo && (
                <div className={styles.apiInfoExpanded}>
                  <div className={styles.apiControls}>
                    <div className={styles.apiControlGroup}>
                      <label className={styles.apiControlLabel}>Verze API:</label>
                      <select
                        value={currentVersion}
                        onChange={(e) => handleVersionChange(e.target.value)}
                        className={styles.apiSelect}
                      >
                        {availableVersions.map(version => (
                          <option key={version} value={version}>
                            {version}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.apiDescription}>
                    <p>
                      Data jsou načítána z oficiálního Riot Games DataDragon API.
                      Změna jazyka nebo verze automaticky aktualizuje všechny informace o šampionech.
                    </p>
                    <a
                      href="https://developer.riotgames.com/docs/lol#data-dragon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.apiLink}
                    >
                      📖 Dokumentace DataDragon API
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Position Filters */}
            <div className={styles.positionFilters}>
              {positionCounts.map((position) => (
                <div
                  key={position.id}
                  className={`${styles.positionFilterItem} ${activePosition === position.id ? styles.active : ''}`}
                  onClick={() => handlePositionFilter(position.id)}
                >
                  <div className={styles.positionIcon}>{position.icon}</div>
                  <div className={styles.positionLabel}>{position.name}</div>
                  <div className={styles.positionCount}>{position.count}</div>
                </div>
              ))}
            </div>

            {/* Advanced Filters */}
            <div className={styles.advancedFilters}>
              <button
                className={styles.toggleFiltersBtn}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Pokročilé filtry <span className={styles.toggleArrow}>{showAdvancedFilters ? '▲' : '▼'}</span>
                {Object.values(advancedFilters).flat().length > 0 && (
                  <span className={styles.filterCount}>
                    {Object.values(advancedFilters).flat().length}
                  </span>
                )}
              </button>

              {showAdvancedFilters && (
                <div className={styles.filtersPanel}>
                  <div className={styles.filtersGrid}>
                    {/* Difficulty Filter */}
                    <div className={styles.filterGroup}>
                      <label>Obtížnost:</label>
                      <div className={styles.filterCheckboxes}>
                        {['Nízká', 'Střední', 'Vysoká', 'Velmi vysoká'].map(difficulty => (
                          <label key={difficulty}>
                            <input
                              type="checkbox"
                              checked={advancedFilters.difficulty.includes(difficulty)}
                              onChange={(e) => {
                                const newDifficulty = e.target.checked
                                  ? [...advancedFilters.difficulty, difficulty]
                                  : advancedFilters.difficulty.filter(d => d !== difficulty);
                                setAdvancedFilters({...advancedFilters, difficulty: newDifficulty});
                              }}
                            />
                            <span>{difficulty}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Damage Type Filter */}
                    <div className={styles.filterGroup}>
                      <label>Typ poškození:</label>
                      <div className={styles.filterCheckboxes}>
                        {[{value: 'Physical', label: 'Fyzické'}, {value: 'Magic', label: 'Magické'}].map(damage => (
                          <label key={damage.value}>
                            <input
                              type="checkbox"
                              checked={advancedFilters.damage.includes(damage.value)}
                              onChange={(e) => {
                                const newDamage = e.target.checked
                                  ? [...advancedFilters.damage, damage.value]
                                  : advancedFilters.damage.filter(d => d !== damage.value);
                                setAdvancedFilters({...advancedFilters, damage: newDamage});
                              }}
                            />
                            <span>{damage.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Survivability Filter */}
                    <div className={styles.filterGroup}>
                      <label>Přežitelnost:</label>
                      <div className={styles.filterCheckboxes}>
                        {['Nízká', 'Střední', 'Vysoká', 'Velmi vysoká'].map(survivability => (
                          <label key={survivability}>
                            <input
                              type="checkbox"
                              checked={advancedFilters.survivability.includes(survivability)}
                              onChange={(e) => {
                                const newSurvivability = e.target.checked
                                  ? [...advancedFilters.survivability, survivability]
                                  : advancedFilters.survivability.filter(s => s !== survivability);
                                setAdvancedFilters({...advancedFilters, survivability: newSurvivability});
                              }}
                            />
                            <span>{survivability}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Range Type Filter */}
                    <div className={styles.filterGroup}>
                      <label>Typ dosahu:</label>
                      <div className={styles.filterCheckboxes}>
                        {['Melee', 'Ranged'].map(rangeType => (
                          <label key={rangeType}>
                            <input
                              type="checkbox"
                              checked={advancedFilters.rangeType.includes(rangeType)}
                              onChange={(e) => {
                                const newRangeType = e.target.checked
                                  ? [...advancedFilters.rangeType, rangeType]
                                  : advancedFilters.rangeType.filter(r => r !== rangeType);
                                setAdvancedFilters({...advancedFilters, rangeType: newRangeType});
                              }}
                            />
                            <span>{rangeType}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Champion Class Filter */}
                    <div className={styles.filterGroup}>
                      <label>Třída šampiona:</label>
                      <div className={styles.filterCheckboxes}>
                        {['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'].map(championClass => (
                          <label key={championClass}>
                            <input
                              type="checkbox"
                              checked={advancedFilters.championClass.includes(championClass)}
                              onChange={(e) => {
                                const newChampionClass = e.target.checked
                                  ? [...advancedFilters.championClass, championClass]
                                  : advancedFilters.championClass.filter(c => c !== championClass);
                                setAdvancedFilters({...advancedFilters, championClass: newChampionClass});
                              }}
                            />
                            <span>{championClass}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Region Filter */}
                    <div className={styles.filterGroup}>
                      <label>Region:</label>
                      <div className={styles.filterCheckboxes}>
                        {['Bandle City', 'Bilgewater', 'Demacia', 'Freljord', 'Ionia', 'Ixtal', 'Noxus', 'Piltover', 'Shadow Isles', 'Shurima', 'Targon', 'The Void', 'Zaun', 'Runeterra'].map(region => (
                          <label key={region}>
                            <input
                              type="checkbox"
                              checked={advancedFilters.region.includes(region)}
                              onChange={(e) => {
                                const newRegion = e.target.checked
                                  ? [...advancedFilters.region, region]
                                  : advancedFilters.region.filter(r => r !== region);
                                setAdvancedFilters({...advancedFilters, region: newRegion});
                              }}
                            />
                            <span>{region}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Role Filters */}
                  <div className={styles.roleFilters}>
                    <label>Role:</label>
                    <div className={styles.roleCheckboxes}>
                      {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(role => (
                        <label key={role}>
                          <input
                            type="checkbox"
                            checked={advancedFilters.roles.includes(role)}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...advancedFilters.roles, role]
                                : advancedFilters.roles.filter(r => r !== role);
                              setAdvancedFilters({...advancedFilters, roles: newRoles});
                            }}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className={styles.filterActions}>
                    <button
                      onClick={() => setAdvancedFilters({
                        difficulty: [],
                        damage: [],
                        survivability: [],
                        rangeType: [],
                        championClass: [],
                        region: [],
                        roles: []
                      })}
                      className={styles.clearFiltersBtn}
                    >
                      Vymazat filtry
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Champions Grid */}
            <div className={styles.championOverview}>
              {filteredChampions.map((champion) => (
                <div 
                  key={champion.id} 
                  className={styles.championCard}
                  onClick={() => openChampionModal(champion)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.championSplash}>
                    <Image
                      src={champion.splash}
                      alt={champion.name}
                      width={400}
                      height={300}
                      className={styles.championImage}
                      onError={(e) => {
                        // Fallback to square image if splash fails
                        e.currentTarget.src = champion.square;
                      }}
                    />
                    
                    {/* Position Badges */}
                    <div className={styles.championPositionBadges}>
                      {champion.roles.map((role, index) => (
                        <span 
                          key={index}
                          className={styles.championPositionBadge}
                          data-role={role}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.championInfo}>
                    <h3 className={styles.championName}>{champion.name}</h3>
                    <p className={styles.championTitle}>"{champion.title}"</p>
                    <p className={styles.championDescription}>{champion.description}</p>
                    
                    {/* Champion Stats */}
                    <div className={styles.championStats}>
                      <div className={styles.championStat}>
                        <span className={styles.statLabel}>OBTÍŽNOST</span>
                        <div className={styles.statProgressContainer}>
                          <div
                            className={styles.statProgressBar}
                            data-difficulty={champion.difficulty.toLowerCase()}
                            style={{
                              width: champion.difficulty === 'Nízká' ? '33%' :
                                     champion.difficulty === 'Střední' ? '66%' : '100%'
                            }}
                          ></div>
                        </div>
                        <span className={styles.statText} data-difficulty={champion.difficulty.toLowerCase()}>
                          {champion.difficulty}
                        </span>
                      </div>
                      <div className={styles.championStat}>
                        <span className={styles.statLabel}>TYP</span>
                        <div className={styles.statTextSpacer}></div>
                        <span className={styles.statText} data-damage={champion.damage.toLowerCase()}>
                          {champion.damage === 'Physical' ? 'Fyzické' : 'Magické'}
                        </span>
                      </div>
                      <div className={styles.championStat}>
                        <span className={styles.statLabel}>PŘEŽITELNOST</span>
                        <div className={styles.statProgressContainer}>
                          <div
                            className={styles.statProgressBar}
                            data-survivability={champion.survivability.toLowerCase()}
                            style={{
                              width: champion.survivability === 'Nízká' ? '25%' :
                                     champion.survivability === 'Střední' ? '50%' :
                                     champion.survivability === 'Vysoká' ? '75%' : '100%'
                            }}
                          ></div>
                        </div>
                        <span className={styles.statText} data-survivability={champion.survivability.toLowerCase()}>
                          {champion.survivability}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredChampions.length === 0 && !loading && (
              <div className={styles.noChampions}>
                <p>Žádní championové nenalezeni pro aktuální filtry.</p>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Back Button */}
        <section className={styles.backSection}>
          <Link href="/" className={styles.backButton}>
            ← Zpět na hlavní stránku
          </Link>
        </section>

        {/* Champion Modal */}
        {selectedChampion && (
          <div 
            className={styles.modal}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeChampionModal();
              }
            }}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalBackground}>
                {championDetails && (
                  <Image
                    src={championDetails.splash}
                    alt={championDetails.name}
                    fill
                    className="object-cover"
                    style={{ filter: 'blur(3px) brightness(0.4)' }}
                  />
                )}
              </div>
              
              <div className={styles.modalOverlay}></div>
              
              <button 
                className={styles.closeButton}
                onClick={closeChampionModal}
              >
                ×
              </button>

              <div className={styles.modalContentInner}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalChampionImage}>
                    {championDetails && (
                      <Image
                        src={championDetails.square}
                        alt={championDetails.name}
                        width={100}
                        height={100}
                        className="rounded-lg"
                      />
                    )}
                  </div>
                  <div className={styles.modalChampionInfo}>
                    <h2 className={styles.modalChampionName}>
                      {championDetails?.name || selectedChampion.name}
                    </h2>
                    <p className={styles.modalChampionTitle}>
                      {championDetails?.title || selectedChampion.title}
                    </p>
                    <div className={styles.modalRoles}>
                      {(championDetails?.roles || selectedChampion.roles).map((role, index) => (
                        <span key={index} className={styles.championPositionBadge}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.modalTabs}>
                  <button
                    className={`${styles.modalTab} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => handleTabChange('overview')}
                  >
                    Přehled
                  </button>
                  <button
                    className={`${styles.modalTab} ${activeTab === 'abilities' ? styles.active : ''}`}
                    onClick={() => handleTabChange('abilities')}
                  >
                    Schopnosti
                  </button>
                  <button
                    className={`${styles.modalTab} ${activeTab === 'skins' ? styles.active : ''}`}
                    onClick={() => handleTabChange('skins')}
                  >
                    Skiny
                  </button>
                  <button
                    className={`${styles.modalTab} ${activeTab === 'tips' ? styles.active : ''}`}
                    onClick={() => handleTabChange('tips')}
                  >
                    Tipy
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {modalLoading && (
                    <div className="text-center py-8">
                      <div className={styles.loadingSpinner}></div>
                      <p className="text-gray-300 mt-4">Načítání detailů...</p>
                    </div>
                  )}

                  {modalError && (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-4">{modalError}</p>
                      <button 
                        onClick={() => fetchChampionDetails(selectedChampion.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Zkusit znovu
                      </button>
                    </div>
                  )}

                  {championDetails && !modalLoading && (
                    <>
                      {/* Overview Tab */}
                      {activeTab === 'overview' && (
                        <div className={styles.modalTabContent}>
                          <div className={styles.championLoreSection}>
                            <h3>Příběh</h3>
                            <div className={styles.loreContainer}>
                              <div
                                className={styles.loreText}
                                dangerouslySetInnerHTML={{
                                  __html: championDetails.lore
                                    .replace(/\n/g, ' ')
                                    .trim()
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className={styles.championStatsDetailed}>
                            <h3>Detailní statistiky</h3>
                            <div className={styles.detailedStatsGrid}>
                              {/* Health */}
                              <div className={styles.detailedStatItem}>
                                <div className={styles.statHeader}>
                                  <span className={styles.statLabel}>Zdraví</span>
                                  <span className={styles.statValue}>{Math.round(championDetails.stats.hp)}</span>
                                </div>
                                <div className={styles.statStars}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`${styles.statStar} ${i < Math.min(5, Math.max(1, Math.round(championDetails.stats.hp / 200))) ? styles.filled : ''}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.statBarContainer}>
                                  <div
                                    className={styles.statBar}
                                    style={{
                                      width: `${Math.min(100, (championDetails.stats.hp / 1000) * 100)}%`,
                                      background: 'linear-gradient(90deg, #6bcf7f, #5bb36f)'
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.statPerLevel}>+{Math.round(championDetails.stats.hpperlevel)} za úroveň</div>
                              </div>

                              {/* Mana */}
                              <div className={styles.detailedStatItem}>
                                <div className={styles.statHeader}>
                                  <span className={styles.statLabel}>Mana</span>
                                  <span className={styles.statValue}>{Math.round(championDetails.stats.mp)}</span>
                                </div>
                                <div className={styles.statStars}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`${styles.statStar} ${championDetails.stats.mp > 0 && i < Math.min(5, Math.max(1, Math.round(championDetails.stats.mp / 120))) ? styles.filled : ''}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.statBarContainer}>
                                  <div
                                    className={styles.statBar}
                                    style={{
                                      width: `${Math.min(100, (championDetails.stats.mp / 600) * 100)}%`,
                                      background: 'linear-gradient(90deg, #4ecdc4, #3bb3b0)'
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.statPerLevel}>+{Math.round(championDetails.stats.mpperlevel)} za úroveň</div>
                              </div>

                              {/* Attack Damage */}
                              <div className={styles.detailedStatItem}>
                                <div className={styles.statHeader}>
                                  <span className={styles.statLabel}>Útok</span>
                                  <span className={styles.statValue}>{Math.round(championDetails.stats.attackdamage)}</span>
                                </div>
                                <div className={styles.statStars}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`${styles.statStar} ${i < Math.min(5, Math.max(1, Math.round(championDetails.stats.attackdamage / 20))) ? styles.filled : ''}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.statBarContainer}>
                                  <div
                                    className={styles.statBar}
                                    style={{
                                      width: `${Math.min(100, (championDetails.stats.attackdamage / 100) * 100)}%`,
                                      background: 'linear-gradient(90deg, #ff8c42, #e67e22)'
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.statPerLevel}>+{Math.round(championDetails.stats.attackdamageperlevel)} za úroveň</div>
                              </div>

                              {/* Attack Speed */}
                              <div className={styles.detailedStatItem}>
                                <div className={styles.statHeader}>
                                  <span className={styles.statLabel}>Rychlost útoku</span>
                                  <span className={styles.statValue}>{championDetails.stats.attackspeed.toFixed(2)}</span>
                                </div>
                                <div className={styles.statStars}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`${styles.statStar} ${i < Math.min(5, Math.max(1, Math.round(championDetails.stats.attackspeed * 5))) ? styles.filled : ''}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.statBarContainer}>
                                  <div
                                    className={styles.statBar}
                                    style={{
                                      width: `${Math.min(100, (championDetails.stats.attackspeed / 1.0) * 100)}%`,
                                      background: 'linear-gradient(90deg, #ffd93d, #e6c235)'
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.statPerLevel}>+{(championDetails.stats.attackspeedperlevel * 100).toFixed(1)}% za úroveň</div>
                              </div>

                              {/* Armor */}
                              <div className={styles.detailedStatItem}>
                                <div className={styles.statHeader}>
                                  <span className={styles.statLabel}>Brnění</span>
                                  <span className={styles.statValue}>{Math.round(championDetails.stats.armor)}</span>
                                </div>
                                <div className={styles.statStars}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`${styles.statStar} ${i < Math.min(5, Math.max(1, Math.round(championDetails.stats.armor / 16))) ? styles.filled : ''}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.statBarContainer}>
                                  <div
                                    className={styles.statBar}
                                    style={{
                                      width: `${Math.min(100, (championDetails.stats.armor / 80) * 100)}%`,
                                      background: 'linear-gradient(90deg, #95a5a6, #7f8c8d)'
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.statPerLevel}>+{championDetails.stats.armorperlevel.toFixed(1)} za úroveň</div>
                              </div>

                              {/* Magic Resistance */}
                              <div className={styles.detailedStatItem}>
                                <div className={styles.statHeader}>
                                  <span className={styles.statLabel}>Magická odolnost</span>
                                  <span className={styles.statValue}>{Math.round(championDetails.stats.spellblock)}</span>
                                </div>
                                <div className={styles.statStars}>
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`${styles.statStar} ${i < Math.min(5, Math.max(1, Math.round(championDetails.stats.spellblock / 16))) ? styles.filled : ''}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.statBarContainer}>
                                  <div
                                    className={styles.statBar}
                                    style={{
                                      width: `${Math.min(100, (championDetails.stats.spellblock / 80) * 100)}%`,
                                      background: 'linear-gradient(90deg, #9b59b6, #8e44ad)'
                                    }}
                                  ></div>
                                </div>
                                <div className={styles.statPerLevel}>+{championDetails.stats.spellblockperlevel.toFixed(2)} za úroveň</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Abilities Tab */}
                      {activeTab === 'abilities' && (
                        <div className={styles.modalTabContent}>
                          <div className={styles.abilitiesContainer}>
                            <div className={styles.passiveAbility}>
                              <h3>Pasivní schopnost</h3>
                              <div className={styles.abilityItem}>
                                <div className={styles.abilityIcon}>
                                  <Image
                                    src={championDetails.passive.image}
                                    alt={championDetails.passive.name}
                                    width={50}
                                    height={50}
                                    className="rounded"
                                  />
                                </div>
                                <div className={styles.abilityDetails}>
                                  <h4>{championDetails.passive.name}</h4>
                                  <div 
                                    className={styles.abilityDescription}
                                    dangerouslySetInnerHTML={{ __html: championDetails.passive.description }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className={styles.activeAbilities}>
                              <h3>Aktivní schopnosti</h3>
                              {championDetails.spells.map((spell, index) => (
                                <div key={spell.id} className={styles.abilityItem}>
                                  <div className={styles.abilityIconContainer}>
                                    <div className={styles.abilityKey}>{spell.key}</div>
                                    <div className={styles.abilityIcon}>
                                      <Image
                                        src={spell.image}
                                        alt={spell.name}
                                        width={50}
                                        height={50}
                                        className="rounded"
                                      />
                                    </div>
                                  </div>
                                  <div className={styles.abilityDetails}>
                                    <div className={styles.abilityHeader}>
                                      <h4>{spell.name}</h4>
                                      <div className={styles.abilityStats}>
                                        {spell.cooldown?.length > 0 && (
                                          <div className={styles.abilityStat}>
                                            <span className={styles.abilityStatLabel}>Cooldown:</span>
                                            <span>{spell.cooldown.join('/')}</span>
                                          </div>
                                        )}
                                        {spell.cost?.length > 0 && (
                                          <div className={styles.abilityStat}>
                                            <span className={styles.abilityStatLabel}>Cost:</span>
                                            <span>{spell.cost.join('/')}</span>
                                          </div>
                                        )}
                                        {spell.range?.length > 0 && (
                                          <div className={styles.abilityStat}>
                                            <span className={styles.abilityStatLabel}>Range:</span>
                                            <span>{spell.range.join('/')}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div 
                                      className={styles.abilityDescription}
                                      dangerouslySetInnerHTML={{ __html: spell.description }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Skins Tab */}
                      {activeTab === 'skins' && (
                        <div className={styles.modalTabContent}>
                          <div className={styles.skinsContainer}>
                            <h3>Dostupné skiny</h3>
                            <div className={styles.skinsGrid}>
                              {championDetails.skins.map((skin) => (
                                <div key={skin.id} className={styles.skinItem}>
                                  <Image
                                    src={skin.splash}
                                    alt={skin.name}
                                    width={300}
                                    height={200}
                                    className="object-cover rounded"
                                    onError={(e) => {
                                      // Fallback to loading image if splash fails
                                      e.currentTarget.src = skin.loading;
                                    }}
                                  />
                                  <h4>{skin.name}</h4>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tips Tab */}
                      {activeTab === 'tips' && (
                        <div className={styles.modalTabContent}>
                          <div className={styles.tipsContainer}>
                            {/* Ally Tips */}
                            {championDetails.allytips && championDetails.allytips.length > 0 && (
                              <div className={styles.tipsSection}>
                                <h3 className={styles.tipsSectionTitle}>
                                  <span className={styles.tipsIcon}>💡</span>
                                  Tipy pro hraní
                                </h3>
                                <div className={styles.tipsList}>
                                  {championDetails.allytips.map((tip, index) => (
                                    <div key={index} className={styles.tipItem}>
                                      <div className={styles.tipBullet}>•</div>
                                      <div className={styles.tipText}>{tip}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Enemy Tips */}
                            {championDetails.enemytips && championDetails.enemytips.length > 0 && (
                              <div className={styles.tipsSection}>
                                <h3 className={styles.tipsSectionTitle}>
                                  <span className={styles.tipsIcon}>🛡️</span>
                                  Jak hrát proti
                                </h3>
                                <div className={styles.tipsList}>
                                  {championDetails.enemytips.map((tip, index) => (
                                    <div key={index} className={styles.tipItem}>
                                      <div className={styles.tipBullet}>•</div>
                                      <div className={styles.tipText}>{tip}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* No tips available */}
                            {(!championDetails.allytips || championDetails.allytips.length === 0) &&
                             (!championDetails.enemytips || championDetails.enemytips.length === 0) && (
                              <div className={styles.noTips}>
                                <div className={styles.noTipsIcon}>📝</div>
                                <h3>Žádné tipy nejsou k dispozici</h3>
                                <p>Pro tohoto šampiona nejsou momentálně dostupné žádné tipy.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}