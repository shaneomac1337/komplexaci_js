"use client";

import { useState, useEffect, useMemo, memo, useCallback, useDeferredValue, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './lol.module.css';
import '../komplexaci.css';
import './lol-redesign.css';
import '../section-headings-redesign.css';
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

// Map data — Battlegrounds in SECTION 02
const maps = [
  {
    id: 'summoners-rift',
    name: "Summoner's Rift",
    description: 'Klasická 5v5 mapa s třemi linkami a džunglí. Hlavní kompetitivní mapa League of Legends.',
    image: 'https://cdn.komplexaci.cz/komplexaci/img/lol-summoners-rift-artwork.jpg',
    mode: 'Ranked 5v5',
    players: '5v5',
    released: 2009
  },
  {
    id: 'bridge-of-progress',
    name: 'Bridge of Progress',
    description: 'Nová mapa s unikátním designem a strategickými možnostmi. Moderní prostředí pro kompetitivní hru.',
    image: 'https://cdn.komplexaci.cz/komplexaci/img/lol-bridge-of-progress.jpg',
    mode: 'ARAM',
    players: '5v5',
    released: 2024
  },
  {
    id: 'teamfight-tactics',
    name: 'Teamfight Tactics: Convergence',
    description: 'Auto-battler herní mód s strategickým umisťováním jednotek. Sbírejte šampiony a vytvářejte mocné týmy.',
    image: 'https://cdn.komplexaci.cz/komplexaci/img/lol-tft-artwork.jpg',
    mode: 'Auto Battler',
    players: '8 hráčů',
    released: 2019
  }
];

// Lanes & Objectives content — SECTION 03
const lanesAndObjectives = [
  {
    title: 'Top Lane',
    body: 'Izolovaný 1v1 souboj na horní lince. Tankové a fightery se škálují přes lategame, často klíčový teamfight initiator se split-push potenciálem.'
  },
  {
    title: 'Jungle',
    body: 'Kontrola objectives, ganky pro lanery, vize a lov dračích cílů. Pathing rozhoduje o tempu hry, prio kolem mapy.'
  },
  {
    title: 'Mid Lane',
    body: 'Mágové a assassini ve středu mapy. Krátké rotace, prio pro objectives, vlivový bod celého teamfight setupu.'
  },
  {
    title: 'Bot Lane',
    body: 'Marksmen v páru se Supportem. Hlavní damage carry v lategame, scaling přes farm, předměty a vize na drakovi.'
  },
  {
    title: 'Support',
    body: 'Vize, peel a engage pro ADC. Roam mezi linkami, kontrola výhledu, klíčový teamfight setup a wave management.'
  },
  {
    title: 'Objectives',
    body: 'Drak, Herald, Baron Nashor a věže. Kdo sbírá objectives, ten škáluje a tlačí. Win conditions vedou přes mapu, ne přes kills.'
  }
];

// Position data — SECTION 01 lane pills
const positions = [
  { id: 'ALL', name: 'Všichni', count: 0 },
  { id: 'TOP', name: 'Top', count: 0 },
  { id: 'JUNGLE', name: 'Jungle', count: 0 },
  { id: 'MID', name: 'Mid', count: 0 },
  { id: 'ADC', name: 'ADC', count: 0 },
  { id: 'SUPPORT', name: 'Support', count: 0 }
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

// Replace `/splash/` with `/loading/` to get DataDragon's portrait loading-screen image.
const loadingFromSplash = (splashUrl: string) =>
  splashUrl.replace('/champion/splash/', '/champion/loading/');

// Memoized mosaic card. Two layers of perf protection on the images:
//   1) IntersectionObserver — img elements are NOT mounted at all until the
//      card is within ~600px of the viewport. With 172 cards this keeps initial
//      image requests down to whatever's actually near visible (~30-40 instead
//      of 344). The `loading="lazy"` attribute alone wasn't enough because the
//      browser still triggers requests for images that are in the DOM.
//   2) `loading="lazy"` + `decoding="async"` as belt-and-suspenders on the
//      img tags themselves once they do mount.
// Cards stay in the DOM at all times (so search/filter doesn't reflow); the
// `content-visibility: auto` CSS rule on the card skips paint for off-screen
// ones, which is the bigger render-perf win.
type ChampionMosaicCardProps = {
  champion: Champion;
  index: number;
  onOpen: (champion: Champion) => void;
};
const ChampionMosaicCard = memo(function ChampionMosaicCard({ champion, index, onOpen }: ChampionMosaicCardProps) {
  const indexLabel = String(index + 1).padStart(3, '0');
  const tileUrl = champion.splash ? loadingFromSplash(champion.splash) : champion.square;
  const ref = useRef<HTMLButtonElement | null>(null);
  const [shouldMountImages, setShouldMountImages] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Once mounted, stay mounted — we don't want images flickering as the user
    // scrolls back and forth past a card.
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldMountImages(true);
            obs.disconnect();
            return;
          }
        }
      },
      { rootMargin: '600px 0px 600px 0px' }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className="lol-mosaic-card"
      onClick={() => onOpen(champion)}
      aria-label={`${champion.name} — ${champion.title}`}
    >
      {shouldMountImages && (
        <>
          <img
            className="layer tile"
            src={tileUrl}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            width={308}
            height={560}
          />
          <img
            className="layer splash"
            src={champion.splash}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            width={1215}
            height={717}
          />
        </>
      )}
      <div className="vignette" />
      <div className="ix">
        <span className="num">{'// CHAMP · '}{indexLabel}</span>
        {champion.difficulty && (
          <span className="diff">{champion.difficulty.slice(0, 3).toUpperCase()}</span>
        )}
      </div>
      <div className="meta">
        <h3 className="name">{champion.name}</h3>
        <p className="title">{champion.title}</p>
        <div className="roles">
          {champion.roles.map(r => (
            <span key={r} className="role-tag">{r}</span>
          ))}
        </div>
      </div>
    </button>
  );
});

// CommunityDragon video CDN — webm clips of every champion ability.
// Pattern: https://d28xe8vt774jo5.cloudfront.net/champion-abilities/<paddedKey>/ability_<paddedKey>_<P|Q|W|E|R>1.webm
const getAbilityVideoUrl = (championKey: string | number, slot: string) => {
  const padded = String(championKey).padStart(4, '0');
  return `https://d28xe8vt774jo5.cloudfront.net/champion-abilities/${padded}/ability_${padded}_${slot}1.webm`;
};

// Radar chart — six-axis hexagon for champion stats. Pure SVG, no library.
function RadarChart({ stats }: { stats: ChampionDetails['stats'] }) {
  const axes = [
    { label: 'HP', value: Math.min(1, (stats.hp || 0) / 700) },
    { label: 'AD', value: Math.min(1, (stats.attackdamage || 0) / 80) },
    { label: 'AS', value: Math.min(1, (stats.attackspeed || 0) / 0.8) },
    { label: 'AR', value: Math.min(1, (stats.armor || 0) / 50) },
    { label: 'MR', value: Math.min(1, (stats.spellblock || 0) / 50) },
    { label: 'MP', value: Math.min(1, (stats.mp || 0) / 500) }
  ];
  const cx = 130;
  const cy = 130;
  const r = 88;
  const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const ringLevels = [0.25, 0.5, 0.75, 1];

  const ringPoints = (level: number) =>
    axes
      .map((_, i) => {
        const a = angle(i);
        return `${(cx + Math.cos(a) * r * level).toFixed(2)},${(cy + Math.sin(a) * r * level).toFixed(2)}`;
      })
      .join(' ');

  const dataPoints = axes.map((axis, i) => {
    const a = angle(i);
    const v = Math.max(0.05, axis.value);
    return { x: cx + Math.cos(a) * r * v, y: cy + Math.sin(a) * r * v };
  });
  const dataPath = dataPoints.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  const labels = axes.map((axis, i) => {
    const a = angle(i);
    const off = r + 18;
    return {
      x: cx + Math.cos(a) * off,
      y: cy + Math.sin(a) * off + 3,
      label: axis.label
    };
  });

  return (
    <svg viewBox="0 0 260 260" role="img" aria-label="Champion stats radar">
      {ringLevels.map(level => (
        <polygon key={level} className="grid-line" points={ringPoints(level)} />
      ))}
      {axes.map((_, i) => {
        const a = angle(i);
        return (
          <line
            key={i}
            className="axis-line"
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
          />
        );
      })}
      <polygon className="data-shape" points={dataPath} />
      {dataPoints.map((p, i) => (
        <circle key={i} className="data-point" cx={p.x} cy={p.y} r={3.5} />
      ))}
      {labels.map((l, i) => (
        <text key={i} className="axis-label" x={l.x} y={l.y}>
          {l.label}
        </text>
      ))}
    </svg>
  );
}

export default function LeagueOfLegendsNextJS() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Deferred value keeps the input responsive: React renders the typed
  // character first, then re-runs the filter at lower priority. Without this,
  // every keystroke blocks paint while we re-filter 172 champions.
  const deferredSearchTerm = useDeferredValue(searchTerm);
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
  const [activeAbility, setActiveAbility] = useState(0);
  const [activeSkin, setActiveSkin] = useState(0);

  // Background rotation state
  const [currentChampionSplash, setCurrentChampionSplash] = useState<string | null>(null);
  const [currentChampionName, setCurrentChampionName] = useState<string>('');

  // DataDragon API state
  const [currentVersion, setCurrentVersion] = useState<string>('15.10.1');
  const [currentLocale, setCurrentLocale] = useState<string>('cs_CZ');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const modalShellRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Initialize random champion splash on component mount
  useEffect(() => {
    if (champions.length > 0) {
      const randomChampion = champions[Math.floor(Math.random() * champions.length)];
      setCurrentChampionSplash(randomChampion.splash);
      setCurrentChampionName(randomChampion.name);
    }
  }, [champions.length]);

  // Change champion splash every 8 seconds
  useEffect(() => {
    if (champions.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = setInterval(() => {
      const randomChampion = champions[Math.floor(Math.random() * champions.length)];
      setCurrentChampionSplash(randomChampion.splash);
      setCurrentChampionName(randomChampion.name);
    }, 8000);
    return () => clearInterval(interval);
  }, [champions.length]);

  const getLatestVersion = async () => {
    try {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      if (!response.ok) throw new Error('Failed to fetch version');
      const versions = await response.json();
      setAvailableVersions(versions.slice(0, 10));
      return versions[0];
    } catch (err) {
      console.error('Failed to fetch version:', err);
      return '15.10.1';
    }
  };

  const handleLocaleChange = async (newLocale: string) => {
    setCurrentLocale(newLocale);
    await refreshChampionsData(newLocale, currentVersion);
  };

  const handleVersionChange = async (newVersion: string) => {
    setCurrentVersion(newVersion);
    await refreshChampionsData(currentLocale, newVersion);
  };

  const refreshChampionsData = async (locale: string, version: string) => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      if (locale) params.append('locale', locale);
      if (version) params.append('version', version);

      const response = await fetch(`/api/lol/champions?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      let championList = await response.json();
      championList = championList.map((champion: any) => ({
        ...champion,
        name: champion.name === 'MonkeyKing' ? 'Wukong' : champion.name
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));

      setChampions(championList);

      const newCounts = positions.map(pos => ({
        ...pos,
        count: pos.id === 'ALL' ? championList.length : championList.filter((champ: Champion) => champ.roles.includes(pos.id)).length
      }));
      setPositionCounts(newCounts);

      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to refresh champions:', err);
      setError('Failed to update language. Please try again.');
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

      const params = new URLSearchParams();
      if (apiLocale) params.append('locale', apiLocale);
      if (apiVersion) params.append('version', apiVersion);

      const response = await fetch(`/api/lol/champions?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      let championList = await response.json();
      championList = championList.map((champion: any) => ({
        ...champion,
        name: champion.name === 'MonkeyKing' ? 'Wukong' : champion.name
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));

      setChampions(championList);

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
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const champion = data.data[championId];
      if (!champion) throw new Error('Champion not found');

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

      // Filter out chromas (color variants) — they're listed as separate skins in
      // DataDragon but share the parent skin's splash art (no own image file on CDN).
      // Riot marks chromas with a `parentSkin` field pointing at the parent skin's num.
      const skins = champion.skins
        .filter((skin: any) => skin.parentSkin === undefined)
        .map((skin: any) => ({
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

  // Filter is a derived value (useMemo) instead of a state-effect pair: this
  // removes one render per change and lets useDeferredValue actually defer the
  // expensive work. Inputs stay responsive while typing.
  const filteredChampions = useMemo(() => {
    let filtered = champions;

    if (activePosition !== 'ALL') {
      filtered = filtered.filter(champion => champion.roles.includes(activePosition));
    }

    if (deferredSearchTerm) {
      const searchLower = deferredSearchTerm.toLowerCase();
      filtered = filtered.filter(champion =>
        champion.name.toLowerCase().includes(searchLower) ||
        champion.title.toLowerCase().includes(searchLower)
      );
    }

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

    return filtered;
  }, [champions, activePosition, deferredSearchTerm, advancedFilters]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedChampion) {
        closeChampionModal();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChampion]);

  const handlePositionFilter = (positionId: string) => setActivePosition(positionId);

  // useCallback stabilizes the reference so the memoized ChampionMosaicCard
  // doesn't re-render every time this parent re-renders.
  const openChampionModal = useCallback((champion: Champion) => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setSelectedChampion(champion);
    setActiveTab('overview');
    setActiveAbility(0);
    setActiveSkin(0);
    setChampionDetails(null);
    setModalError(null);
    fetchChampionDetails(champion.id);
    document.body.style.overflow = 'hidden';
    // fetchChampionDetails closes over currentVersion/currentLocale, but those
    // change rarely (only when the user picks a new locale/version, at which
    // point we want a fresh callback anyway).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVersion, currentLocale]);

  const closeChampionModal = () => {
    setSelectedChampion(null);
    setChampionDetails(null);
    setModalError(null);
    setActiveTab('overview');
    document.body.style.overflow = 'auto';
    previousFocusRef.current?.focus();
  };

  useEffect(() => {
    if (!selectedChampion) return;
    modalShellRef.current?.focus();
  }, [selectedChampion]);

  const handleTabChange = (tab: 'overview' | 'abilities' | 'skins' | 'tips') => setActiveTab(tab);

  const clearAllFilters = () => {
    setSearchTerm('');
    setActivePosition('ALL');
    setAdvancedFilters({
      difficulty: [], damage: [], survivability: [],
      rangeType: [], championClass: [], region: [], roles: []
    });
  };

  const advancedActiveCount = Object.values(advancedFilters).flat().length;
  const currentLocaleObj = AVAILABLE_LOCALES.find(l => l.code === currentLocale);

  // ----- Loading branch -----
  if (loading) {
    return (
      <div className="lol-redesign section-heading-redesign min-h-screen text-white">
        <Header />
        <section className="lol-hero">
          <div className="wash" />
          <div className="grid-overlay" />
          <div className="content">
            <div className="kicker">{'// CHAPTER 04 · STRATEGIC MOBA'}</div>
            <h1><span>LEAGUE OF LEGENDS</span></h1>
            <p className="lede">Načítání šampionů z DataDragon API…</p>
          </div>
        </section>

        <section className="lol-section">
          <div className="lol-shell">
            <div className="lol-section-header">
              <div className="lol-section-kicker">{'// SECTION 01 · CHAMPIONS'}</div>
              <h2 className="section-title"><span>ŠAMPIONI</span></h2>
            </div>
            <div className="lol-mosaic">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="lol-mosaic-skel" />
              ))}
            </div>
          </div>
        </section>

        <div style={{ position: 'fixed', bottom: 32, right: 32 }}>
          <div className="lol-spinner" />
        </div>
      </div>
    );
  }

  // ----- Error branch -----
  if (error && champions.length === 0) {
    return (
      <div className="lol-redesign section-heading-redesign min-h-screen text-white">
        <Header />
        <section className="lol-hero">
          <div className="wash" />
          <div className="grid-overlay" />
          <div className="content">
            <div className="kicker">{'// CHAPTER 04 · STRATEGIC MOBA'}</div>
            <h1><span>LEAGUE OF LEGENDS</span></h1>
            <p className="lede">{error}</p>
            <button
              onClick={() => fetchChampions()}
              className="cta-link"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 24px',
                background: 'rgba(0,255,255,0.08)',
                border: '1px solid rgba(0,255,255,0.4)',
                borderRadius: 12,
                color: '#fff', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase'
              }}
            >
              {'// '}Zkusit znovu
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ----- Main render -----
  return (
    <div className="lol-redesign section-heading-redesign min-h-screen text-white">
      <Header />

      {/* Hero */}
      <section className="lol-hero">
        {currentChampionSplash && (
          <div
            className="bg"
            style={{ backgroundImage: `url(${currentChampionSplash})` }}
          />
        )}
        <div className="wash" />
        <div className="grid-overlay" />
        <div className="live-badge">{'// LIVE FEED'}</div>

        <div className="content">
          <div className="kicker">
            {'// CHAPTER 04'}<span className="dot" />STRATEGIC MOBA
          </div>
          <h1>
            <span>LEAGUE OF LEGENDS</span>
          </h1>
          <p className="lede">
            Týmová strategická MOBA od Riot Games. Více než 160 šampionů, pět rolí, jedna mapa a desítky objectives, které rozhodují zápas.
          </p>
          <div className="data-strip">
            <div className="cell">
              <span className="label">Released</span>
              <span className="val">2009</span>
            </div>
            <div className="cell">
              <span className="label">Genre</span>
              <span className="val cyan">MOBA</span>
            </div>
            <div className="cell">
              <span className="label">Players</span>
              <span className="val">5v5</span>
            </div>
            <div className="cell">
              <span className="label">Esport</span>
              <span className="val pink">Worlds</span>
            </div>
          </div>
        </div>

        {currentChampionName && (
          <div className="splash-tag">
            CURRENT<span className="name">{currentChampionName}</span>
          </div>
        )}
      </section>

      {/* SECTION 01 · CHAMPIONS */}
      <section className="lol-section">
        <div className="lol-shell">
          <div className="lol-section-header">
            <div className="lol-section-kicker">{'// SECTION 01 · CHAMPIONS'}</div>
            <h2 className="section-title"><span>ŠAMPIONI</span></h2>
            <p className="lol-section-sub">
              Více než 160 unikátních šampionů, každý s vlastní pasivkou, čtyřmi schopnostmi, lore a sadou skinů.
            </p>
          </div>

          {/* Status bar (DDragon version + locale + count) */}
          <div className="lol-status-bar">
            <div className="seg">
              <span className="lbl">{'// DDRAGON'}</span>
              <span className="val cyan">v{currentVersion}</span>
            </div>
            <div className="seg">
              <span className="lbl">Locale</span>
              <select
                value={currentLocale}
                onChange={(e) => handleLocaleChange(e.target.value)}
                disabled={isRefreshing}
                aria-label="Locale"
              >
                {AVAILABLE_LOCALES.map(locale => (
                  <option key={locale.code} value={locale.code}>
                    {locale.flag} {locale.code}
                  </option>
                ))}
              </select>
              {isRefreshing && <span className="spin" aria-hidden="true" />}
              {refreshSuccess && <span className="ok">✓</span>}
            </div>
            {availableVersions.length > 0 && (
              <div className="seg">
                <span className="lbl">Version</span>
                <select
                  value={currentVersion}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  disabled={isRefreshing}
                  aria-label="Version"
                >
                  {availableVersions.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="seg">
              <span className="lbl">Champions</span>
              <span className="val pink">{champions.length}</span>
            </div>
            <div className="seg">
              <span className="lbl">Showing</span>
              <span className="val cyan">{filteredChampions.length}</span>
            </div>
          </div>

          {/* Filter bar (sticky) */}
          <div className="lol-filter-bar">
            <div className="search">
              <span className="icon">⌕</span>
              <input
                type="text"
                placeholder="Hledat šampiona…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Hledat šampiona"
              />
            </div>

            <div className="pills" role="tablist" aria-label="Lane filter">
              {positionCounts.map(position => (
                <button
                  key={position.id}
                  role="tab"
                  aria-pressed={activePosition === position.id}
                  className={`pill ${activePosition === position.id ? 'active' : ''}`}
                  onClick={() => handlePositionFilter(position.id)}
                >
                  {position.name}
                  <span className="count">/ {position.count}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`adv-toggle ${showAdvancedFilters ? 'open' : ''}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              aria-expanded={showAdvancedFilters}
            >
              {'// ADV'}
              {advancedActiveCount > 0 && <span className="badge">{advancedActiveCount}</span>}
              <span aria-hidden="true">{showAdvancedFilters ? '▲' : '▼'}</span>
            </button>

            {(searchTerm || activePosition !== 'ALL' || advancedActiveCount > 0) && (
              <button type="button" className="clear" onClick={clearAllFilters}>
                Vymazat ✕
              </button>
            )}
          </div>

          {/* Advanced disclosure */}
          {showAdvancedFilters && (
            <div className="lol-advanced">
              <div className="grid">
                <div className="group">
                  <label className="head">{'// OBTÍŽNOST'}</label>
                  <div className="checks">
                    {['Nízká', 'Střední', 'Vysoká', 'Velmi vysoká'].map(difficulty => (
                      <label key={difficulty}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.difficulty.includes(difficulty)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...advancedFilters.difficulty, difficulty]
                              : advancedFilters.difficulty.filter(d => d !== difficulty);
                            setAdvancedFilters({ ...advancedFilters, difficulty: next });
                          }}
                        />
                        <span>{difficulty}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <label className="head">{'// TYP POŠKOZENÍ'}</label>
                  <div className="checks">
                    {[{ value: 'Physical', label: 'Fyzické' }, { value: 'Magic', label: 'Magické' }].map(damage => (
                      <label key={damage.value}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.damage.includes(damage.value)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...advancedFilters.damage, damage.value]
                              : advancedFilters.damage.filter(d => d !== damage.value);
                            setAdvancedFilters({ ...advancedFilters, damage: next });
                          }}
                        />
                        <span>{damage.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <label className="head">{'// PŘEŽITELNOST'}</label>
                  <div className="checks">
                    {['Nízká', 'Střední', 'Vysoká', 'Velmi vysoká'].map(s => (
                      <label key={s}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.survivability.includes(s)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...advancedFilters.survivability, s]
                              : advancedFilters.survivability.filter(x => x !== s);
                            setAdvancedFilters({ ...advancedFilters, survivability: next });
                          }}
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <label className="head">{'// DOSAH'}</label>
                  <div className="checks">
                    {['Melee', 'Ranged'].map(r => (
                      <label key={r}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.rangeType.includes(r)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...advancedFilters.rangeType, r]
                              : advancedFilters.rangeType.filter(x => x !== r);
                            setAdvancedFilters({ ...advancedFilters, rangeType: next });
                          }}
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <label className="head">{'// TŘÍDA'}</label>
                  <div className="checks">
                    {['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'].map(c => (
                      <label key={c}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.championClass.includes(c)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...advancedFilters.championClass, c]
                              : advancedFilters.championClass.filter(x => x !== c);
                            setAdvancedFilters({ ...advancedFilters, championClass: next });
                          }}
                        />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <label className="head">{'// REGION'}</label>
                  <div className="checks">
                    {['Bandle City', 'Bilgewater', 'Demacia', 'Freljord', 'Ionia', 'Ixtal', 'Noxus', 'Piltover', 'Shadow Isles', 'Shurima', 'Targon', 'The Void', 'Zaun', 'Runeterra'].map(region => (
                      <label key={region}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.region.includes(region)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...advancedFilters.region, region]
                              : advancedFilters.region.filter(x => x !== region);
                            setAdvancedFilters({ ...advancedFilters, region: next });
                          }}
                        />
                        <span>{region}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="footer">
                <button
                  type="button"
                  className="reset"
                  onClick={() => setAdvancedFilters({
                    difficulty: [], damage: [], survivability: [],
                    rangeType: [], championClass: [], region: [], roles: []
                  })}
                >
                  Reset ADV
                </button>
              </div>
            </div>
          )}

          {/* Champion mosaic */}
          <div className="lol-mosaic">
            {filteredChampions.length === 0 && (
              <div className="empty">{'// NO MATCHES — UPRAVTE FILTRY'}</div>
            )}
            {filteredChampions.map((champion, idx) => (
              <ChampionMosaicCard
                key={champion.id}
                champion={champion}
                index={idx}
                onOpen={openChampionModal}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 02 · BATTLEGROUNDS */}
      <section className="lol-section">
        <div className="lol-shell">
          <div className="lol-section-header">
            <div className="lol-section-kicker">{'// SECTION 02 · BATTLEGROUNDS'}</div>
            <h2 className="section-title"><span>MAPY V LOL</span></h2>
            <p className="lol-section-sub">
              Tři aktivní mapy: klasická Summoner's Rift, ARAM Bridge of Progress a auto-battler Teamfight Tactics.
            </p>
          </div>

          <div className="lol-grid-cards">
            {maps.map((map, idx) => {
              const indexLabel = String(idx + 1).padStart(2, '0');
              return (
                <article key={map.id} className="lol-card">
                  <div className="ix-bar">
                    <span className="index">{'// MAP · '}{indexLabel}</span>
                    <span className="ix-tag">{map.mode.toUpperCase()}</span>
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
                        <span className="val">{map.released}</span>
                      </div>
                      <div className="s">
                        <span className="lbl">Players</span>
                        <span className="val">{map.players}</span>
                      </div>
                      <div className="s">
                        <span className="lbl">Mode</span>
                        <span className="val cyan">{map.mode}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 03 · LANES & OBJECTIVES */}
      <section className="lol-section lol-mech">
        <div className="lol-shell">
          <div className="lol-section-header">
            <div className="lol-section-kicker">{'// SECTION 03 · LANES & OBJECTIVES'}</div>
            <h2 className="section-title"><span>LINKY &amp; CÍLE</span></h2>
            <p className="lol-section-sub">
              Pět rolí na mapě plus objectives, které řídí tempo zápasu. Win conditions vedou přes mapu, ne přes kills.
            </p>
          </div>

          <div className="lol-mech-grid">
            {lanesAndObjectives.map((block, idx) => {
              const numLabel = String(idx + 1).padStart(2, '0');
              return (
                <div key={idx} className="lol-mech-block">
                  <div className="num">{'// '}{numLabel}<span className="glyph">·</span></div>
                  <h3>{block.title}</h3>
                  <p>{block.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 04 · SUMMONER LOOKUP */}
      <section className="lol-section lol-wrap-section">
        <div className="lol-wrap-shell">
          <div className="lol-section-header">
            <div className="lol-section-kicker">{'// SECTION 04 · SUMMONER LOOKUP'}</div>
            <h2 className="section-title"><span>VYHLEDÁNÍ HRÁČE</span></h2>
            <p className="lol-section-sub">
              Live Riot data — rank, match history, mastery a aktivní zápasy. Zadejte Riot ID nebo summoner name.
            </p>
          </div>
          <div className="lol-wrap-frame">
            <SummonerSearch />
          </div>
        </div>
      </section>

      {/* SECTION 05 · SERVER STATUS */}
      <section className="lol-section lol-wrap-section">
        <div className="lol-wrap-shell">
          <div className="lol-section-header">
            <div className="lol-section-kicker">{'// SECTION 05 · SERVER STATUS'}</div>
            <h2 className="section-title"><span>STATUS KOMPLEXÁCI</span></h2>
            <p className="lol-section-sub">
              Kdo z klanu je právě online a co hraje. Live Discord feed.
            </p>
          </div>
          <div className="lol-wrap-frame">
            <KomplexaciStatus />
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="lol-cta-strip">
        <div className="cta-kicker">{'// END · CHAPTER 04'}</div>
        <Link href="/" className="cta-link">
          Zpět na hlavní stránku <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Champion Modal */}
      {selectedChampion && (
        <div
          className="lol-redesign-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="champion-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeChampionModal();
          }}
        >
          <div className="shell" tabIndex={-1} ref={modalShellRef}>
            {/* Splash hero */}
            <div className="splash-hero">
              {championDetails && (
                <div
                  className="splash-bg"
                  style={{ backgroundImage: `url(${championDetails.splash})` }}
                />
              )}
              {!championDetails && selectedChampion.splash && (
                <div
                  className="splash-bg"
                  style={{ backgroundImage: `url(${selectedChampion.splash})` }}
                />
              )}
              <div className="wash" />
              <div className="grid" />
              <div className="ident">
                <div>
                  <div className="num">{'// CHAMP · '}{selectedChampion.name.toUpperCase()}</div>
                  <h2 id="champion-modal-title"><span>{championDetails?.name || selectedChampion.name}</span></h2>
                  <div className="title">"{championDetails?.title || selectedChampion.title}"</div>
                  <div className="roles">
                    {(championDetails?.roles || selectedChampion.roles).map((role, i) => (
                      <span key={i} className="role-tag">{role}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button className="close" onClick={closeChampionModal} aria-label="Zavřít">×</button>

            {/* Tabs */}
            <div className="tabs" role="tablist">
              {(['overview', 'abilities', 'skins', 'tips'] as const).map((tab, i) => {
                const labels = { overview: 'Přehled', abilities: 'Schopnosti', skins: 'Skiny', tips: 'Tipy' };
                const glyphs = ['01', '02', '03', '04'];
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={`tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab)}
                  >
                    <span className="glyph">{'// '}{glyphs[i]}</span>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="body">
              {modalLoading && (
                <div className="center">
                  <div className="lol-spinner" style={{ marginBottom: 16 }} />
                  Načítání detailů…
                </div>
              )}

              {modalError && !modalLoading && (
                <div className="center">
                  <div style={{ color: '#ff6ec7', marginBottom: 12 }}>{modalError}</div>
                  <button
                    onClick={() => fetchChampionDetails(selectedChampion.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(0,255,255,0.08)',
                      border: '1px solid rgba(0,255,255,0.4)',
                      borderRadius: 8, color: '#fff', cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      letterSpacing: '0.18em', textTransform: 'uppercase'
                    }}
                  >
                    Zkusit znovu
                  </button>
                </div>
              )}

              {championDetails && !modalLoading && (
                <>
                  {/* Overview */}
                  {activeTab === 'overview' && (
                    <>
                      <h3>Příběh</h3>
                      <div
                        className="lore"
                        dangerouslySetInnerHTML={{ __html: championDetails.lore.replace(/\n/g, ' ').trim() }}
                      />
                      <div className="overview-cols">
                        <div className="stat-list">
                          {[
                            { lbl: 'Zdraví', val: Math.round(championDetails.stats.hp), max: 700, per: `+${Math.round(championDetails.stats.hpperlevel)}` },
                            { lbl: 'Mana', val: Math.round(championDetails.stats.mp), max: 500, per: `+${Math.round(championDetails.stats.mpperlevel)}` },
                            { lbl: 'Útok', val: Math.round(championDetails.stats.attackdamage), max: 80, per: `+${Math.round(championDetails.stats.attackdamageperlevel)}` },
                            { lbl: 'Rych. útoku', val: championDetails.stats.attackspeed.toFixed(2), max: 0.8, per: `+${(championDetails.stats.attackspeedperlevel * 100).toFixed(1)}%` },
                            { lbl: 'Brnění', val: Math.round(championDetails.stats.armor), max: 50, per: `+${championDetails.stats.armorperlevel.toFixed(1)}` },
                            { lbl: 'Mag. odolnost', val: Math.round(championDetails.stats.spellblock), max: 50, per: `+${championDetails.stats.spellblockperlevel.toFixed(2)}` }
                          ].map((s, i) => {
                            const num = typeof s.val === 'string' ? parseFloat(s.val) : s.val;
                            const pct = Math.min(100, (num / s.max) * 100);
                            return (
                              <div key={i} className="row">
                                <span className="lbl">{s.lbl}</span>
                                <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                                <span className="v">
                                  {s.val}
                                  <small>{s.per} / lvl</small>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="radar">
                          <div className="heading">{'// COMBAT PROFILE'}</div>
                          <RadarChart stats={championDetails.stats} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Abilities */}
                  {activeTab === 'abilities' && (
                    <>
                      <h3>{'// PASSIVE & SPELLS'}</h3>
                      <div className="ability-keys">
                        {[
                          {
                            key: 'P',
                            name: championDetails.passive.name,
                            description: championDetails.passive.description,
                            image: championDetails.passive.image,
                            cooldown: [], cost: [], range: []
                          },
                          ...championDetails.spells
                        ].map((ab: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            className={`slot ${activeAbility === idx ? 'active' : ''}`}
                            onClick={() => setActiveAbility(idx)}
                            aria-pressed={activeAbility === idx}
                          >
                            <div className="key">{ab.key || ['P', 'Q', 'W', 'E', 'R'][idx]}</div>
                            <div className="icon">
                              <Image src={ab.image} alt={ab.name} width={44} height={44} unoptimized />
                            </div>
                          </button>
                        ))}
                      </div>

                      {(() => {
                        const all = [
                          { key: 'P', name: championDetails.passive.name, description: championDetails.passive.description, cooldown: [] as number[], cost: [] as number[], range: [] as number[] },
                          ...championDetails.spells
                        ];
                        const ab = all[activeAbility] || all[0];
                        const videoUrl = getAbilityVideoUrl(selectedChampion.key, ab.key);
                        return (
                          <div className="ability-panel">
                            <div
                              className="ability-video-frame"
                              key={`${selectedChampion.key}-${ab.key}`}
                            >
                              <video
                                src={videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                onError={(e) => {
                                  const frame = e.currentTarget.parentElement;
                                  if (frame) frame.classList.add('no-video');
                                }}
                              />
                              <div className="vfallback">
                                <span>{'// no preview available'}</span>
                                <span style={{ fontSize: 9, opacity: 0.6 }}>{ab.name}</span>
                              </div>
                              <div className="vlbl">
                                <span className="live" />
                                {'// '}{ab.key}{' · ABILITY · '}{selectedChampion.name.toUpperCase()}
                              </div>
                            </div>
                            <div className="body-pad">
                              <div className="head">
                                <h4>{ab.name}</h4>
                                <div className="meta">
                                  {ab.cooldown && ab.cooldown.length > 0 && (
                                    <div>CD <span className="v">{ab.cooldown.join('/')}</span></div>
                                  )}
                                  {ab.cost && ab.cost.length > 0 && (
                                    <div>Cost <span className="v">{ab.cost.join('/')}</span></div>
                                  )}
                                  {ab.range && ab.range.length > 0 && (
                                    <div>Range <span className="v">{ab.range.join('/')}</span></div>
                                  )}
                                </div>
                              </div>
                              <div
                                className="desc"
                                dangerouslySetInnerHTML={{ __html: ab.description }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* Skins */}
                  {activeTab === 'skins' && championDetails.skins.length > 0 && (
                    <div className="skin-carousel">
                      <div className="frame">
                        <Image
                          src={championDetails.skins[activeSkin].splash}
                          alt={championDetails.skins[activeSkin].name}
                          fill
                          sizes="(max-width: 1100px) 100vw, 1100px"
                          unoptimized
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = championDetails.skins[activeSkin].loading;
                          }}
                        />
                        {championDetails.skins.length > 1 && (
                          <>
                            <button
                              className="arrow prev"
                              type="button"
                              onClick={() => setActiveSkin((activeSkin - 1 + championDetails.skins.length) % championDetails.skins.length)}
                              aria-label="Předchozí skin"
                            >
                              ‹
                            </button>
                            <button
                              className="arrow next"
                              type="button"
                              onClick={() => setActiveSkin((activeSkin + 1) % championDetails.skins.length)}
                              aria-label="Další skin"
                            >
                              ›
                            </button>
                          </>
                        )}
                        <div className="caption">
                          <h3 className="name" style={{ color: '#fff' }}>{championDetails.skins[activeSkin].name}</h3>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span className="badge">{championDetails.skins[activeSkin].num === 0 ? 'Base' : 'Skin'}</span>
                            <span className="progress">
                              {String(activeSkin + 1).padStart(2, '0')} / {String(championDetails.skins.length).padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="skin-thumbs">
                        {championDetails.skins.map((skin, i) => (
                          <button
                            key={skin.id}
                            type="button"
                            className={i === activeSkin ? 'active' : ''}
                            onClick={() => setActiveSkin(i)}
                            aria-label={skin.name}
                            aria-pressed={i === activeSkin}
                          >
                            <Image
                              src={skin.loading}
                              alt={skin.name}
                              width={84}
                              height={47}
                              unoptimized
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {activeTab === 'tips' && (
                    <div className="tips-grid">
                      <div className="col">
                        <h3>Tipy pro hraní<span className="glyph"> · ALLY</span></h3>
                        {championDetails.allytips.length === 0 ? (
                          <p style={{ color: '#9b9bb0', fontSize: 13 }}>Žádné tipy nejsou k dispozici.</p>
                        ) : (
                          <ol>
                            {championDetails.allytips.map((tip, i) => (
                              <li key={i}>
                                <span className="badge">{String(i + 1).padStart(2, '0')}</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                      <div className="col enemy">
                        <h3>Jak hrát proti<span className="glyph"> · ENEMY</span></h3>
                        {championDetails.enemytips.length === 0 ? (
                          <p style={{ color: '#9b9bb0', fontSize: 13 }}>Žádné tipy nejsou k dispozici.</p>
                        ) : (
                          <ol>
                            {championDetails.enemytips.map((tip, i) => (
                              <li key={i}>
                                <span className="badge">{String(i + 1).padStart(2, '0')}</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
