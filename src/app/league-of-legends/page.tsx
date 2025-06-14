"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import styles from './lol.module.css';
import '../komplexaci.css';

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
}

// Map data
const maps = [
  {
    id: 'summoners-rift',
    name: "Summoner's Rift",
    description: 'Klasická 5v5 mapa s třemi linkami a džunglí. Hlavní kompetitivní mapa League of Legends.',
    image: '/komplexaci/img/lol-summoners-rift.png',
    gameMode: '5v5 Ranked'
  },
  {
    id: 'howling-abyss',
    name: 'Howling Abyss',
    description: 'ARAM (All Random All Mid) mapa s jednou linkou. Rychlé a akční zápasy.',
    image: '/komplexaci/img/lol-howling-abyss.png',
    gameMode: 'ARAM'
  },
  {
    id: 'teamfight-tactics',
    name: 'Teamfight Tactics',
    description: 'Auto-battler herní mód s strategickým umisťováním jednotek.',
    image: '/komplexaci/img/lol-tft-logo.png',
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
  const [activePosition, setActivePosition] = useState('ALL');
  const [positionCounts, setPositionCounts] = useState(positions);
  
  // Modal state
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [championDetails, setChampionDetails] = useState<ChampionDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'abilities' | 'skins'>('overview');
  
  // DataDragon API state
  const [currentVersion, setCurrentVersion] = useState<string>('15.10.1');
  const [currentLocale, setCurrentLocale] = useState<string>('cs_CZ');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [showApiInfo, setShowApiInfo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

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
      // Don't show main loading spinner, just refresh data
      const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/${locale}/champion.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert to our format
      const championList = Object.values(data.data).map((champion: any) => ({
        id: champion.id,
        key: champion.key,
        name: champion.name,
        title: champion.title,
        description: champion.blurb,
        splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`,
        square: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`,
        difficulty: mapDifficulty(champion.info.difficulty),
        damage: mapDamageType(champion.id, champion.tags), // Use ID instead of translated name
        survivability: mapSurvivability(champion.info.defense),
        roles: mapRoles(champion.tags, champion.id), // Use ID instead of translated name
        rangeType: mapRangeType(champion.id, champion.tags), // Use ID instead of translated name
        championClass: champion.tags[0] || 'Fighter',
        region: 'Unknown'
      }));

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

  const mapDifficulty = (difficulty: number) => {
    if (difficulty <= 3) return 'Nízká';
    if (difficulty <= 6) return 'Střední';
    if (difficulty <= 8) return 'Vysoká';
    return 'Velmi vysoká';
  };

  const mapSurvivability = (defense: number) => {
    if (defense <= 3) return 'Nízká';
    if (defense <= 6) return 'Střední';
    if (defense <= 8) return 'Vysoká';
    return 'Velmi vysoká';
  };

  const mapDamageType = (championId: string, tags: string[]) => {
    const magicChampions = ['Ahri', 'Annie', 'Brand', 'Cassiopeia', 'Karthus', 'LeBlanc', 'Lux', 'Malzahar', 'Orianna', 'Ryze', 'Syndra', 'Veigar', 'Viktor', 'Xerath', 'Ziggs', 'Azir'];
    const physicalChampions = ['Caitlyn', 'Jinx', 'Lucian', 'Vayne', 'Graves', 'Draven', 'Ashe', 'Twitch', 'Tristana', 'Sivir'];
    
    if (magicChampions.includes(championId)) return 'Magic';
    if (physicalChampions.includes(championId)) return 'Physical';
    if (tags.includes('Mage')) return 'Magic';
    if (tags.includes('Marksman')) return 'Physical';
    return 'Mixed';
  };

  const mapRoles = (tags: string[], championId: string) => {
    // Official position mappings based on League of Legends Wiki data
    // Source: https://leagueoflegends.fandom.com/wiki/List_of_champions_by_draft_position
    // Using champion IDs (which are always in English) instead of translated names
    const championRoles: { [key: string]: string[] } = {
      'Aatrox': ['TOP'],
      'Ahri': ['MID'],
      'Akali': ['TOP', 'MID'],
      'Akshan': ['MID'],
      'Alistar': ['SUPPORT'],
      'Ambessa': ['MID'],
      'Amumu': ['JUNGLE', 'SUPPORT'],
      'Anivia': ['MID'],
      'Annie': ['MID'],
      'Aphelios': ['ADC'],
      'Ashe': ['ADC', 'SUPPORT'],
      'AurelionSol': ['MID'],
      'Aurora': ['TOP', 'MID'],
      'Azir': ['MID'],
      'Bard': ['SUPPORT'],
      'Belveth': ['JUNGLE'],
      'Blitzcrank': ['SUPPORT'],
      'Brand': ['JUNGLE', 'MID', 'SUPPORT'],
      'Braum': ['SUPPORT'],
      'Briar': ['JUNGLE'],
      'Caitlyn': ['ADC'],
      'Camille': ['TOP', 'SUPPORT'],
      'Cassiopeia': ['MID'],
      'Chogath': ['TOP'],
      'Corki': ['MID'],
      'Darius': ['TOP'],
      'Diana': ['JUNGLE', 'MID'],
      'DrMundo': ['TOP'],
      'Draven': ['ADC'],
      'Ekko': ['JUNGLE', 'MID'],
      'Elise': ['JUNGLE'],
      'Evelynn': ['JUNGLE'],
      'Ezreal': ['ADC'],
      'Fiddlesticks': ['JUNGLE'],
      'Fiora': ['TOP'],
      'Fizz': ['MID'],
      'Galio': ['MID', 'SUPPORT'],
      'Gangplank': ['TOP'],
      'Garen': ['TOP'],
      'Gnar': ['TOP'],
      'Gragas': ['TOP', 'JUNGLE', 'MID'],
      'Graves': ['JUNGLE'],
      'Gwen': ['TOP'],
      'Hecarim': ['JUNGLE'],
      'Heimerdinger': ['TOP', 'MID', 'SUPPORT'],
      'Hwei': ['MID', 'SUPPORT'],
      'Illaoi': ['TOP'],
      'Irelia': ['TOP', 'MID'],
      'Ivern': ['JUNGLE'],
      'Janna': ['SUPPORT'],
      'JarvanIV': ['JUNGLE'],
      'Jax': ['TOP', 'JUNGLE'],
      'Jayce': ['TOP', 'MID'],
      'Jhin': ['ADC'],
      'Jinx': ['ADC'],
      'KSante': ['TOP'],
      'Kaisa': ['ADC'],
      'Kalista': ['ADC'],
      'Karma': ['TOP', 'MID', 'SUPPORT'],
      'Karthus': ['JUNGLE'],
      'Kassadin': ['MID'],
      'Katarina': ['MID'],
      'Kayle': ['TOP'],
      'Kayn': ['JUNGLE'],
      'Kennen': ['TOP'],
      'Khazix': ['JUNGLE'],
      'Kindred': ['JUNGLE'],
      'Kled': ['TOP'],
      'KogMaw': ['ADC'],
      'Leblanc': ['MID'],
      'LeeSin': ['JUNGLE'],
      'Leona': ['SUPPORT'],
      'Lillia': ['JUNGLE'],
      'Lissandra': ['MID'],
      'Lucian': ['ADC'],
      'Lulu': ['SUPPORT'],
      'Lux': ['MID', 'SUPPORT'],
      'Malphite': ['TOP', 'MID', 'SUPPORT'],
      'Malzahar': ['MID'],
      'Maokai': ['JUNGLE', 'SUPPORT'],
      'MasterYi': ['JUNGLE'],
      'Mel': ['MID'],
      'Milio': ['SUPPORT'],
      'MissFortune': ['ADC'],
      'Mordekaiser': ['TOP'],
      'Morgana': ['SUPPORT'],
      'Naafiri': ['MID'],
      'Nami': ['SUPPORT'],
      'Nasus': ['TOP'],
      'Nautilus': ['SUPPORT'],
      'Neeko': ['MID', 'SUPPORT'],
      'Nidalee': ['JUNGLE'],
      'Nilah': ['ADC'],
      'Nocturne': ['JUNGLE'],
      'Nunu': ['JUNGLE'],
      'Olaf': ['TOP'],
      'Orianna': ['MID'],
      'Ornn': ['TOP'],
      'Pantheon': ['TOP', 'JUNGLE', 'MID', 'SUPPORT'],
      'Poppy': ['TOP', 'JUNGLE'],
      'Pyke': ['SUPPORT'],
      'Qiyana': ['MID'],
      'Quinn': ['TOP'],
      'Rakan': ['SUPPORT'],
      'Rammus': ['JUNGLE'],
      'RekSai': ['JUNGLE'],
      'Rell': ['SUPPORT'],
      'RenataGlasc': ['SUPPORT'],
      'Renekton': ['TOP'],
      'Rengar': ['TOP', 'JUNGLE'],
      'Riven': ['TOP'],
      'Rumble': ['TOP', 'MID'],
      'Ryze': ['MID'],
      'Samira': ['ADC'],
      'Sejuani': ['JUNGLE'],
      'Senna': ['ADC', 'SUPPORT'],
      'Seraphine': ['ADC', 'SUPPORT'],
      'Sett': ['TOP'],
      'Shaco': ['JUNGLE', 'SUPPORT'],
      'Shen': ['TOP', 'SUPPORT'],
      'Shyvana': ['JUNGLE'],
      'Singed': ['TOP'],
      'Sion': ['TOP'],
      'Sivir': ['ADC'],
      'Skarner': ['TOP', 'JUNGLE'],
      'Smolder': ['TOP', 'MID', 'ADC'],
      'Sona': ['SUPPORT'],
      'Soraka': ['SUPPORT'],
      'Swain': ['MID', 'SUPPORT'],
      'Sylas': ['TOP', 'MID'],
      'Syndra': ['MID'],
      'TahmKench': ['TOP', 'SUPPORT'],
      'Taliyah': ['JUNGLE', 'MID'],
      'Talon': ['JUNGLE', 'MID'],
      'Taric': ['MID', 'SUPPORT'],
      'Teemo': ['TOP', 'JUNGLE', 'SUPPORT'],
      'Thresh': ['SUPPORT'],
      'Tristana': ['MID', 'ADC'],
      'Trundle': ['TOP', 'JUNGLE'],
      'Tryndamere': ['TOP'],
      'TwistedFate': ['TOP', 'MID', 'ADC'],
      'Twitch': ['ADC', 'SUPPORT'],
      'Udyr': ['TOP', 'JUNGLE'],
      'Urgot': ['TOP'],
      'Varus': ['ADC'],
      'Vayne': ['TOP', 'ADC'],
      'Veigar': ['MID', 'SUPPORT'],
      'Velkoz': ['MID', 'SUPPORT'],
      'Vex': ['MID'],
      'Vi': ['JUNGLE'],
      'Viego': ['JUNGLE'],
      'Viktor': ['MID'],
      'Vladimir': ['TOP', 'MID'],
      'Volibear': ['TOP', 'JUNGLE'],
      'Warwick': ['TOP', 'JUNGLE'],
      'MonkeyKing': ['TOP', 'JUNGLE'],
      'Xayah': ['ADC'],
      'Xerath': ['MID', 'SUPPORT'],
      'XinZhao': ['JUNGLE'],
      'Yasuo': ['TOP', 'MID', 'ADC'],
      'Yone': ['TOP', 'MID'],
      'Yorick': ['TOP'],
      'Yuumi': ['SUPPORT'],
      'Zac': ['TOP', 'JUNGLE', 'SUPPORT'],
      'Zed': ['JUNGLE', 'MID'],
      'Zeri': ['ADC'],
      'Ziggs': ['MID', 'ADC'],
      'Zilean': ['SUPPORT'],
      'Zoe': ['MID'],
      'Zyra': ['SUPPORT'],
    };
    
    // Use official mappings if available, otherwise fall back to tag-based mapping
    if (championRoles[championId]) {
      return championRoles[championId];
    }
    
    // Fallback to tag-based mapping for champions not in the official list
    const roleMap: { [key: string]: string[] } = {
      'Assassin': ['MID'],
      'Fighter': ['TOP'],
      'Mage': ['MID'],
      'Marksman': ['ADC'],
      'Support': ['SUPPORT'],
      'Tank': ['TOP', 'SUPPORT']
    };
    
    const roles: string[] = [];
    tags.forEach(tag => {
      if (roleMap[tag]) {
        roles.push(...roleMap[tag]);
      }
    });
    
    return roles.length > 0 ? Array.from(new Set(roles)) : ['MID'];
  };

  const mapRangeType = (championId: string, tags: string[]) => {
    if (tags.includes('Marksman') || tags.includes('Mage')) return 'Ranged';
    return 'Melee';
  };

  const fetchChampions = async (locale?: string, version?: string) => {
    try {
      setLoading(true);
      const apiVersion = version || await getLatestVersion();
      const apiLocale = locale || currentLocale;
      
      if (!version) {
        setCurrentVersion(apiVersion);
      }
      
      const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${apiVersion}/data/${apiLocale}/champion.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert to our format
      const championList = Object.values(data.data).map((champion: any) => ({
        id: champion.id,
        key: champion.key,
        name: champion.name,
        title: champion.title,
        description: champion.blurb,
        splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`,
        square: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.id}.png`,
        difficulty: mapDifficulty(champion.info.difficulty),
        damage: mapDamageType(champion.id, champion.tags), // Use ID instead of translated name
        survivability: mapSurvivability(champion.info.defense),
        roles: mapRoles(champion.tags, champion.id), // Use ID instead of translated name
        rangeType: mapRangeType(champion.id, champion.tags), // Use ID instead of translated name
        championClass: champion.tags[0] || 'Fighter',
        region: 'Unknown'
      }));

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
        roles: mapRoles(champion.tags, champion.id)
      };

      setChampionDetails(championDetails);
      
    } catch (err) {
      console.error('Failed to fetch champion details:', err);
      setModalError('Failed to load champion details. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  // Filter champions based on position and search
  const filterChampions = () => {
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
    
    setFilteredChampions(filtered);
  };

  useEffect(() => {
    fetchChampions();
  }, []);

  useEffect(() => {
    filterChampions();
  }, [champions, activePosition, searchTerm]);

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

  const handleTabChange = (tab: 'overview' | 'abilities' | 'skins') => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className="text-xl text-gray-300">Loading Champions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className={styles.loadingContainer}>
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchChampions()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>League of Legends | Komplexáci</title>
        <meta name="description" content="League of Legends - MOBA hra od Riot Games, ve které se specializuje klan Komplexáci" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900" style={{ fontFamily: "'Exo 2', 'Roboto', sans-serif" }}>
        
        {/* Hero Section */}
        <section className={styles.gameHero}>
          <div className={styles.gameHeroContent}>
            <h1 className={styles.gameHeroTitle}>League of Legends</h1>
            <p className={styles.gameHeroSubtitle}>Nejpopulárnější MOBA hra na světě od Riot Games</p>
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

        {/* Champions Section */}
        <section className={`${styles.section}`} style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Champions</h2>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#f0e6d2', maxWidth: '800px', margin: '0 auto 50px' }}>
              Objevte více než 160 unikátních championů, každý s vlastními schopnostmi a herním stylem.
            </p>

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
                          <div className={styles.championDescription}>
                            <h3>Příběh</h3>
                            <p>{championDetails.lore}</p>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}