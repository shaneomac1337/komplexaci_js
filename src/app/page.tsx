"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import './komplexaci.css';
import Header from './components/Header';
import ServerStatus from './components/ServerStatus';
import DiscordServerStats from './components/DiscordServerStats';
import MostActiveMembers from './components/MostActiveMembers';
import DailyAwards from './components/DailyAwards';

import PerformanceStatus from '../components/PerformanceStatus';


// Import exact fonts from original
if (typeof window !== 'undefined') {
  const link1 = document.createElement('link');
  link1.href = 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800&family=Roboto:wght@300;400;500&display=swap';
  link1.rel = 'stylesheet';
  document.head.appendChild(link1);
}

// Complete member data (converted from your HTML)
const members = [
  {
    id: 'barber',
    name: 'Barber',
    realName: 'Lukáš Čechura',
    role: 'CS2 Expert',
    image: '/komplexaci/img/barber.gif',
    bio: 'CS2 expert s neuvěřitelnou přesností a reflexy. Když není na serveru, trénuje své dovednosti v aim labu.',
    stats: [
      { label: 'Oblíbený interpret', value: 'Viktor Sheen' },
      { label: 'Oblíbená hra', value: 'CS2' },
      { label: 'KD Ratio', value: '1.8' }
    ]
  },
  {
    id: 'zander',
    name: 'Zander',
    realName: 'Petr Jakša',
    role: 'Pařmen',
    image: '/komplexaci/img/zander.gif',
    bio: 'Týpeček, co nikdy nepohrdne kvalitním hraním, má bohatou knihovnu her jak na PC tak na konzoli.',
    stats: [
      { label: 'Herní role', value: 'Pařmen' },
      { label: 'Oblíbená hra', value: 'Všechny' },
      { label: 'Hláška', value: 'Kokot zaprcanej' }
    ]
  },
  {
    id: 'shane',
    name: 'shaneomac',
    realName: 'Martin Pěnkava',
    role: 'WebMaster',
    image: '/komplexaci/img/shane.gif',
    bio: 'Digitální mág zodpovědný za webové stránky klanu. Moc skillu ve hře nepobral. Má rád wrestling',
    stats: [
      { label: 'Tech stack', value: 'HTML, CSS, JavaScript, PHP, React' },
      { label: 'Oblíbená hra', value: 'Retro pářky' },
      { label: 'Hodiny ve hře', value: '2500+' }
    ]
  },
  {
    id: 'jugyna',
    name: 'Jugyna',
    realName: 'Jan Šváb',
    role: 'Hasič',
    image: '/komplexaci/img/jugyna.gif',
    bio: 'Jugec jako správný požárník hasí každou vypjatou situaci ve hře, posléze žízeň.',
    stats: [
      { label: 'Oblíbená zbraň', value: 'Proudnice typu C' },
      { label: 'Oblíbená mapa', value: 'Inferno' },
      { label: 'Uspěšnost hašení', value: '100%' }
    ]
  },
  {
    id: 'pipa',
    name: 'Pípa',
    realName: 'Josef Pech',
    role: 'NPC',
    image: '/komplexaci/img/pipa.gif',
    bio: 'Pípa je takovej divnej pokémon ze Vstiše, kdysi generátor random hlášek.',
    stats: [
      { label: 'Status', value: 'Dead na midu na Cache' },
      { label: 'Oblíbená aktivita', value: 'LAN Party' },
      { label: 'Citát', value: '"Je ve ventilaci, Pípí bajzn,"' }
    ]
  },
  {
    id: 'strix',
    name: 'MartinStrix',
    realName: 'Martin Poláček',
    role: 'Strix prostě',
    image: '/komplexaci/img/martin-strix.gif',
    bio: 'Záhadný hráč s nevyzpytatelným herním stylem. Nikdy nevíte, co udělá - ani on sám.',
    stats: [
      { label: 'Herní styl', value: 'Chaotické dobro' },
      { label: 'Specialita', value: 'Překvapivé tahy' },
      { label: 'Hlášky', value: '"Hej čím, whooo booost"' }
    ]
  },
  {
    id: 'azarin',
    name: 'Azarin',
    realName: 'Adam Soukup',
    role: 'Rapper',
    image: '/komplexaci/img/azarin.gif',
    bio: 'Nadějný Rapper, nejčernější běloch v KompG skupině.',
    stats: [
      { label: 'Hudební styl', value: 'Mumble rap' },
      { label: 'Herní role', value: 'Entry Fragger' },
      { label: 'Informace', value: 'Shen je v latu od lvl 3' }
    ]
  },
  {
    id: 'podri',
    name: 'Podri',
    realName: 'David Podroužek',
    role: 'Tryharder',
    image: '/komplexaci/img/podri.gif',
    bio: 'Největší naděje KompG skupiny za posledních 100 let.',
    stats: [
      { label: 'Oblíbená činnost', value: 'Jízda na skůtru' },
      { label: 'Specialita', value: 'Chodil do třídy s Azarinem' },
      { label: 'Vybavení', value: 'Na Hollywoodech měl dlažební kostku' }
    ]
  },
  {
    id: 'zdravicko',
    name: 'Zdravíčko',
    realName: 'Václav Průcha',
    role: 'Žolík',
    image: '/komplexaci/img/zdravicko.gif',
    bio: 'Zdravíčko je takové eso v rukávu Komplexácké komunity, do akce bývá povolán zpravidla v případě největší potřeby. Nejnovější přírůstek v KompG klanu. Milovník zlevněného zboží.',
    stats: [
      { label: 'Oblíbená činnost', value: 'Scrollovat 9gag' },
      { label: 'Zaměstnání', value: 'Šťouchač brambor' },
      { label: 'Motto', value: 'Život dává a bere' }
    ]
  },
  {
    id: 'roseck',
    name: 'Roseck',
    realName: 'Vladimír Rathouský',
    role: 'Stratég',
    image: '/komplexaci/img/roseck.gif',
    bio: 'Někdejší stratég komplexácké skupiny, Roseck měl vždy plné kapsy plánů od A až do Z a dokázal predikovat, jakým směrem se hra bude ubírat, na kontě má několik strategický zářezů včetně legendárního divu na topu v Night Cupu.',
    stats: [
      { label: 'Label', value: 'TNKDLBL' },
      { label: 'Umístění', value: 'Ostrava pyčo' },
      { label: 'Hobby', value: 'Poslech kvalitního zvuku' }
    ]
  }
];

import { usePlaylist } from '@/hooks/usePlaylist';

const games = [
  {
    title: 'League of Legends',
    description: 'MOBA hra od Riot Games, ve které se specializujeme na týmové strategie a kompetitivní hraní.',
    image: '/komplexaci/img/lol.jpg',
    link: '/league-of-legends'
  },
  {
    title: 'Counter Strike 2',
    description: 'FPS střílečka od Valve, ve které zdokonalujeme naše týmové taktiky, reflexy a přesnost.',
    image: '/komplexaci/img/cs2.jpg',
    link: '/cs2'
  },
  {
    title: 'WWE Games',
    description: 'Kolekce wrestlingových her od legendárního SmackDown! až po moderní série. Zažijte nostalgii a epické zápasy.',
    image: '/komplexaci/img/wwe-main.jpg',
    link: '/wwe-games'
  }
];

// ScrollingText component for long text
const ScrollingText = ({ text, className, maxWidth = 150 }: { text: string; className: string; maxWidth?: number }) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = maxWidth;
      setIsScrolling(textWidth > containerWidth);
    }
  }, [text, maxWidth]);

  return (
    <div
      className={className}
      style={{
        width: `${maxWidth}px`,
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}
    >
      <div
        ref={textRef}
        style={{
          display: 'inline-block',
          animation: isScrolling ? 'scroll-text 8s linear infinite' : 'none',
          paddingRight: isScrolling ? '20px' : '0'
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Function to shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Home() {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [membersVisible, setMembersVisible] = useState(false);
  const [shuffledMembers, setShuffledMembers] = useState<typeof members>([]);
  const membersRef = useRef<HTMLElement>(null);

  // Music player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0); // Will be set to random in useEffect
  const [volume, setVolume] = useState(0.5);
  const [isTraxVisible, setIsTraxVisible] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false); // Start by trying real audio first
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has clicked anywhere
  const [isShuffleMode, setIsShuffleMode] = useState(true); // Enable shuffle by default, like original
  const [isTraxAutoHidden, setIsTraxAutoHidden] = useState(false);
  const [showBriefly, setShowBriefly] = useState(false);

  // Cross-tab coordination state
  const [tabId] = useState(() => `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  const [isPlayingInOtherTab, setIsPlayingInOtherTab] = useState(false);
  const [otherTabInfo, setOtherTabInfo] = useState<{track: string, tabId: string} | null>(null);

  // Dynamic playlist
  const { tracks: playlist } = usePlaylist();
  const [lastScrollY, setLastScrollY] = useState(0);

  // Discord stats for Most Active Members
  const [discordStats, setDiscordStats] = useState<any>(null);



  const [scrollDownTimeout, setScrollDownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activityTimeout, setActivityTimeout] = useState<NodeJS.Timeout | null>(null);
  const [musicStartTimeout, setMusicStartTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasShownMusicStart, setHasShownMusicStart] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);

  // Add ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Shuffle members on component mount
  useEffect(() => {
    setShuffledMembers(shuffleArray(members));
  }, []);

  // Intersection Observer for members section
  useEffect(() => {
    // Detect if user is on mobile device
    const isMobile = window.innerWidth <= 768;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('👀 Members section intersection:', entry.isIntersecting, 'ratio:', entry.intersectionRatio, 'mobile:', isMobile);
          if (entry.isIntersecting && !membersVisible) {
            console.log('✅ Members section visible, triggering animations');
            setMembersVisible(true);
          }
        });
      },
      {
        threshold: isMobile ? 0.05 : 0.1, // Even lower threshold for mobile (5% vs 10%)
        rootMargin: isMobile ? '50px 0px 0px 0px' : '0px 0px -20px 0px' // Positive margin for mobile to trigger earlier
      }
    );

    if (membersRef.current) {
      observer.observe(membersRef.current);
    }

    // Fallback: Show members after timeout if intersection observer fails
    // Shorter timeout for mobile devices
    const fallbackDelay = isMobile ? 2000 : 3000;
    const fallbackTimer = setTimeout(() => {
      if (!membersVisible) {
        console.log('🔄 Fallback: Showing members after timeout (mobile:', isMobile, ')');
        setMembersVisible(true);
      }
    }, fallbackDelay);

    return () => {
      if (membersRef.current) {
        observer.unobserve(membersRef.current);
      }
      clearTimeout(fallbackTimer);
    };
  }, [membersVisible]);

  // Cross-page and cross-tab music control
  useEffect(() => {
    // Listen for WWE page music events, stop signals, and other tab events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wwe-music-state') {
        const wweState = JSON.parse(e.newValue || '{}');
        if (wweState.isPlaying && isPlaying) {
          // WWE page started playing, pause main music
          console.log('WWE music started, pausing main music');
          if (audioElement && !isDemoMode) {
            audioElement.pause();
          }
          setIsPlaying(false);
        }
      } else if (e.key === 'stop-main-music') {
        // WWE page explicitly requested to stop main music
        console.log('WWE page requested to stop main music');
        if (audioElement && !isDemoMode) {
          audioElement.pause();
        }
        setIsPlaying(false);
        // Clear the stop signal
        localStorage.removeItem('stop-main-music');
      } else if (e.key === 'kompg-music-state') {
        // Another KOMPG Trax tab state changed
        const state = JSON.parse(e.newValue || '{}');
        if (state.isPlaying && state.tabId !== tabId) {
          // Another tab started playing KOMPG Trax
          console.log(`🎵 KOMPG Trax started in another tab (${state.tabId}), pausing this tab`);
          if (audioElement && !isDemoMode && isPlaying) {
            audioElement.pause();
          }
          setIsPlaying(false);
          setIsPlayingInOtherTab(true);
          setOtherTabInfo({
            track: state.track || 'Unknown Track',
            tabId: state.tabId
          });
        } else if (!state.isPlaying || !e.newValue) {
          // Other tab stopped playing
          console.log('🎵 KOMPG Trax stopped in other tab');
          setIsPlayingInOtherTab(false);
          setOtherTabInfo(null);
        }
      }
    };

    // Set main music state in localStorage when playing
    const updateMusicState = () => {
      if (isPlaying) {
        localStorage.setItem('kompg-music-state', JSON.stringify({
          isPlaying: true,
          track: playlist[currentTrack]?.title || 'Main Track',
          page: 'main',
          tabId: tabId,
          timestamp: Date.now()
        }));
        setIsPlayingInOtherTab(false);
        setOtherTabInfo(null);
      } else {
        // Only remove if this tab was the one playing
        const currentState = localStorage.getItem('kompg-music-state');
        if (currentState) {
          const state = JSON.parse(currentState);
          if (state.tabId === tabId) {
            localStorage.removeItem('kompg-music-state');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    updateMusicState();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // Only remove if this tab was the one playing
      const currentState = localStorage.getItem('kompg-music-state');
      if (currentState) {
        const state = JSON.parse(currentState);
        if (state.tabId === tabId) {
          localStorage.removeItem('kompg-music-state');
        }
      }
    };
  }, [isPlaying, currentTrack, audioElement, isDemoMode, tabId]);

  // Check for existing KOMPG Trax playback in other tabs on mount
  useEffect(() => {
    const checkExistingPlayback = () => {
      const kompgState = localStorage.getItem('kompg-music-state');
      if (kompgState) {
        try {
          const state = JSON.parse(kompgState);
          if (state.isPlaying && state.tabId !== tabId) {
            // More aggressive timeout for Firefox - only 10 seconds instead of 30
            const isRecent = Date.now() - (state.timestamp || 0) < 10000;
            if (isRecent) {
              console.log(`🎵 KOMPG Trax is already playing in tab ${state.tabId}, preventing auto-start`);
              setIsPlayingInOtherTab(true);
              setOtherTabInfo({
                track: state.track || 'Unknown Track',
                tabId: state.tabId
              });
              setHasUserInteracted(true); // Prevent auto-start
              return true;
            } else {
              console.log('🎵 Found stale KOMPG Trax state (older than 10s), clearing it');
              localStorage.removeItem('kompg-music-state');
            }
          } else if (state.tabId !== tabId) {
            // If state shows not playing from another tab, clear it
            console.log('🎵 Found non-playing state from another tab, clearing it');
            localStorage.removeItem('kompg-music-state');
          }
        } catch (error) {
          console.error('Error parsing KOMPG music state:', error);
          localStorage.removeItem('kompg-music-state');
        }
      }
      return false;
    };

    const checkWWEMusic = () => {
      const wweState = localStorage.getItem('wwe-music-state');
      if (wweState) {
        try {
          const state = JSON.parse(wweState);
          // Only consider WWE music as playing if it's from the current session
          // Clear stale data from previous sessions
          if (state.isPlaying) {
            console.log('Found WWE music state in localStorage, checking if still valid...');
            // Clear the stale state since we're on the main page now
            localStorage.removeItem('wwe-music-state');
            console.log('Cleared stale WWE music state from localStorage');
            return false; // Don't prevent auto-start
          }
        } catch (error) {
          console.log('Error parsing WWE music state, clearing localStorage:', error);
          localStorage.removeItem('wwe-music-state');
        }
      }
      return false;
    };

    // Aggressive cleanup on page load for Firefox compatibility
    const aggressiveCleanup = () => {
      const kompgState = localStorage.getItem('kompg-music-state');
      if (kompgState) {
        try {
          const state = JSON.parse(kompgState);
          // On page refresh/load, be more aggressive about clearing old states
          const age = Date.now() - (state.timestamp || 0);
          if (age > 5000) { // Clear anything older than 5 seconds on page load
            console.log(`🧹 Page load: Clearing old KOMPG state (${age}ms old)`);
            localStorage.removeItem('kompg-music-state');
            return false;
          }
        } catch (error) {
          console.log('🧹 Page load: Clearing invalid KOMPG state');
          localStorage.removeItem('kompg-music-state');
          return false;
        }
      }
      return true;
    };

    // Perform aggressive cleanup first
    aggressiveCleanup();

    // Check for existing KOMPG Trax playback after cleanup
    const hasExistingPlayback = checkExistingPlayback();

    // Clean up any stale WWE music state
    checkWWEMusic();

    // Reset interaction state when returning to main page if music isn't playing
    // This ensures the ribbon always shows when visiting the main page
    if (!isPlaying && !hasExistingPlayback) {
      setHasUserInteracted(false);
      console.log('Reset hasUserInteracted to show auto-play ribbon on main page');
    }
  }, [tabId]);

  // Heartbeat system to detect stale tabs and update timestamps
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout;

    if (isPlaying) {
      // Update timestamp every 5 seconds while playing
      heartbeatInterval = setInterval(() => {
        const currentState = localStorage.getItem('kompg-music-state');
        if (currentState) {
          const state = JSON.parse(currentState);
          if (state.tabId === tabId && state.isPlaying) {
            localStorage.setItem('kompg-music-state', JSON.stringify({
              ...state,
              timestamp: Date.now()
            }));
          }
        }
      }, 5000);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [isPlaying, tabId]);

  // Cleanup stale states periodically - more aggressive for Firefox
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const kompgState = localStorage.getItem('kompg-music-state');
      if (kompgState) {
        try {
          const state = JSON.parse(kompgState);
          // Remove states older than 10 seconds (more aggressive for Firefox)
          if (Date.now() - (state.timestamp || 0) > 10000) {
            console.log('🧹 Cleaning up stale KOMPG Trax state (older than 10s)');
            localStorage.removeItem('kompg-music-state');
            setIsPlayingInOtherTab(false);
            setOtherTabInfo(null);
          }
          // Also clean up if state shows not playing
          else if (!state.isPlaying && state.tabId !== tabId) {
            console.log('🧹 Cleaning up non-playing state from another tab');
            localStorage.removeItem('kompg-music-state');
            setIsPlayingInOtherTab(false);
            setOtherTabInfo(null);
          }
        } catch (error) {
          console.error('Error cleaning up KOMPG state:', error);
          localStorage.removeItem('kompg-music-state');
          setIsPlayingInOtherTab(false);
          setOtherTabInfo(null);
        }
      }
    }, 5000); // Check every 5 seconds instead of 10

    return () => clearInterval(cleanupInterval);
  }, [tabId]);

  // Additional cleanup when page becomes visible (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check for stale states
        const kompgState = localStorage.getItem('kompg-music-state');
        if (kompgState) {
          try {
            const state = JSON.parse(kompgState);
            if (state.tabId !== tabId) {
              const age = Date.now() - (state.timestamp || 0);
              if (age > 8000) { // Clear if older than 8 seconds when tab becomes visible
                console.log('🧹 Tab visible: Clearing stale KOMPG state');
                localStorage.removeItem('kompg-music-state');
                setIsPlayingInOtherTab(false);
                setOtherTabInfo(null);
              }
            }
          } catch (error) {
            localStorage.removeItem('kompg-music-state');
            setIsPlayingInOtherTab(false);
            setOtherTabInfo(null);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tabId]);

  useEffect(() => {
    setIsLoaded(true);

    // Always try to initialize audio first
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = 'auto';

    // Define event handlers (without handleEnded to avoid stale closure issues)
    const handleError = () => {
      console.log('Audio file not found, switching to demo mode');
      setIsDemoMode(true);
    };

    const handleLoadStart = () => {
      console.log('Loading audio...');
    };

    const handleCanPlay = () => {
      console.log('Audio file loaded successfully - real audio mode active');
      setIsDemoMode(false);
    };

    // Add event listeners (skip 'ended' for now to avoid closure issues)
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    setAudioElement(audio);

    // Load the random initial track (not always track 0)
    if (playlist && playlist.length > 0) {
      const initialTrack = Math.floor(Math.random() * playlist.length);
      setCurrentTrack(initialTrack);
      audio.src = playlist[initialTrack].file;
      console.log('Attempting to load random initial track:', playlist[initialTrack].title, 'from:', playlist[initialTrack].file);
    }

    // No auto-start timer - music only starts when user explicitly clicks

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, [playlist]); // Add playlist dependency to reload when tracks change

  // Separate useEffect for click handler to avoid re-adding listeners
  useEffect(() => {
    const handleClick = () => {
      if (!hasUserInteracted) {
        handleFirstInteraction();
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [hasUserInteracted]); // Only depend on hasUserInteracted - handleFirstInteraction is stable

  // Separate useEffect for scroll listener with proper dependencies
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only handle scroll-based hiding, not interaction detection
      if (!hasUserInteracted) {
        return; // Don't trigger interaction on scroll
      }

      // Check if we're scrolling down by comparing with last position
      const isScrollingDown = currentScrollY > lastScrollY;

      // Clear any existing scroll down timeout
      if (scrollDownTimeout) {
        clearTimeout(scrollDownTimeout);
      }

      // If scrolling down and widget is visible, start 0.1-second timer to hide
      if (isScrollingDown && isTraxVisible && !isTraxAutoHidden && currentScrollY > 50) {
        const newScrollDownTimeout = setTimeout(() => {
          if (isMountedRef.current) {
            console.log('🔽 Hiding Trax - scrolled down for 0.1 seconds:', currentScrollY);
            setIsTraxAutoHidden(true);
          }
        }, 100); // Hide after 0.1 seconds of scrolling down

        setScrollDownTimeout(newScrollDownTimeout);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Clean up scroll down timeout
      if (scrollDownTimeout) {
        clearTimeout(scrollDownTimeout);
      }
    };
  }, [isTraxVisible, isTraxAutoHidden, hasUserInteracted, lastScrollY]); // Dependencies for scroll handler

  // Separate useEffect for handling track ended event with current state
  useEffect(() => {
    if (!audioElement) return;

    const handleEnded = () => {
      console.log('Track ended, playing next');

      // Calculate next track
      let next;
      if (isShuffleMode && playlist && playlist.length > 0) {
        // Get random track different from current
        do {
          next = Math.floor(Math.random() * playlist.length);
        } while (next === currentTrack && playlist.length > 1);
      } else if (playlist && playlist.length > 0) {
        next = (currentTrack + 1) % playlist.length;
      } else {
        return; // No playlist available
      }

      console.log('Auto-advancing to track:', playlist[next]?.title);

      // Update the current track state
      setCurrentTrack(next);

      // Handle the audio source change directly to avoid conflicts
      if (!isDemoMode && audioElement && playlist && playlist[next]) {
        // Pause and reset current track
        audioElement.pause();
        audioElement.currentTime = 0;

        // Set new source and play
        audioElement.src = playlist[next].file;
        audioElement.play()
          .then(() => {
            // Ensure the playing state is maintained
            setIsPlaying(true);
            console.log('Auto-advanced and playing:', playlist[next].title);

            // Show Kompg Trax widget for auto-advance
            setIsTraxVisible(true);
            setIsTraxAutoHidden(false);
            setShowBriefly(true);
            console.log('🎵 Auto-advance - showing Kompg Trax for new track:', playlist[next].title);

            // Auto-hide after 4 seconds for auto-advance
            setTimeout(() => {
              if (isMountedRef.current) {
                setShowBriefly(false);
                setIsTraxAutoHidden(true);
                console.log('⏰ Auto-hiding Kompg Trax after auto-advance');
              }
            }, 4000);
          })
          .catch((error) => {
            console.error('Error auto-advancing to next track:', error);
            setIsDemoMode(true);
          });
      } else if (isDemoMode) {
        // In demo mode, just maintain the playing state and show widget
        console.log('Demo mode: Auto-advanced to', playlist[next]?.title);

        // Show Kompg Trax widget for demo mode auto-advance
        setIsTraxVisible(true);
        setIsTraxAutoHidden(false);
        setShowBriefly(true);
        console.log('🎮 Demo auto-advance - showing Kompg Trax for new track:', playlist[next]?.title);

        // Auto-hide after 4 seconds for demo auto-advance
        setTimeout(() => {
          if (isMountedRef.current) {
            setShowBriefly(false);
            setIsTraxAutoHidden(true);
            console.log('⏰ Auto-hiding Kompg Trax after demo auto-advance');
          }
        }, 4000);
      }
    };

    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement, isDemoMode, isShuffleMode, currentTrack, playlist]); // Include all dependencies

  // Watch for currentTrack changes and update audio source (only when not auto-advancing)
  useEffect(() => {
    if (audioElement && playlist && playlist[currentTrack] && !isDemoMode) {
      console.log('Current track changed to:', currentTrack, playlist[currentTrack].title);
      // Only update src if it's different to avoid interrupting playback
      const newSrc = playlist[currentTrack].file;
      if (audioElement.src !== window.location.origin + newSrc && audioElement.src !== newSrc) {
        audioElement.src = newSrc;
      }
    }
  }, [currentTrack, audioElement, isDemoMode, playlist]);

  // Fetch Discord stats for Most Active Members
  useEffect(() => {
    const fetchDiscordStats = async () => {
      try {
        const response = await fetch('/api/discord/server-stats');
        if (response.ok) {
          const data = await response.json();
          setDiscordStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch Discord stats:', error);
      }
    };

    fetchDiscordStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDiscordStats, 30000);

    return () => clearInterval(interval);
  }, []);



  // Inactivity-based auto-hide (only when music is paused)
  useEffect(() => {
    // Clear existing timeout
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }

    // Only auto-hide when music is paused and widget is visible
    if (!isPlaying && isTraxVisible && !isTraxAutoHidden) {
      const newActivityTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          setIsTraxAutoHidden(true);
          console.log('💤 Auto-hiding Trax after 15s inactivity (music paused)');
        }
      }, 15000);

      setActivityTimeout(newActivityTimeout);
    }

    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [isPlaying, isTraxVisible, isTraxAutoHidden]);

  // Music start notification - show for 5 seconds when music starts
  useEffect(() => {
    // Only trigger on transition from not playing to playing
    if (isPlaying && !hasShownMusicStart) {
      // Clear any existing timeout
      if (musicStartTimeout) {
        clearTimeout(musicStartTimeout);
      }

      // Show widget immediately when music starts (regardless of current state)
      setIsTraxVisible(true);
      setIsTraxAutoHidden(false);
      setShowBriefly(true);
      setHasShownMusicStart(true);
      console.log('🎵 Music started - showing Kompg Trax for 5 seconds');

      // Auto-minimize after 5 seconds - ALWAYS hide regardless of scroll position
      const newMusicTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          setShowBriefly(false);
          setIsTraxAutoHidden(true);
          console.log('⏰ Auto-minimizing Kompg Trax after 5 seconds');
        }
      }, 5000);

      setMusicStartTimeout(newMusicTimeout);
    }

    // Reset the flag when music stops
    if (!isPlaying) {
      setHasShownMusicStart(false);
    }

    return () => {
      if (musicStartTimeout) {
        clearTimeout(musicStartTimeout);
      }
    };
  }, [isPlaying]);

  // Show briefly on track change
  useEffect(() => {
    if (isPlaying) {
      setShowBriefly(true);

      // Hide the brief show after 3 seconds
      const briefTimer = setTimeout(() => {
        if (isMountedRef.current) {
          setShowBriefly(false);
        }
      }, 3000);

      return () => clearTimeout(briefTimer);
    }
  }, [currentTrack]);

  // Music player functions
  const togglePlay = async () => {
    setIsTraxVisible(true);

    // If music is playing in another tab, take over playback
    if (isPlayingInOtherTab && !isPlaying) {
      console.log('🎵 Taking over playback from another tab');
      setIsPlayingInOtherTab(false);
      setOtherTabInfo(null);
      // Continue with normal play logic
    }

    // Demo mode - just toggle UI state
    if (isDemoMode) {
      setIsPlaying(!isPlaying);
      console.log(isPlaying ? 'Demo: Music paused' : `Demo: Playing ${playlist?.[currentTrack]?.title || 'Unknown Track'}`);
      return;
    }

    if (!audioElement) {
      console.log('No audio element available, switching to demo mode');
      setIsDemoMode(true);
      setIsPlaying(!isPlaying);
      return;
    }

    try {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
        console.log('Real audio paused');
      } else {
        // Ensure we have a valid source and it matches the current track
        const expectedSrc = playlist?.[currentTrack]?.file || '';
        const currentSrc = audioElement.src;
        const isValidSrc = currentSrc &&
                          currentSrc !== window.location.href &&
                          (currentSrc === expectedSrc || currentSrc === window.location.origin + expectedSrc);

        if (!isValidSrc && expectedSrc) {
          console.log('Setting audio source to:', expectedSrc);
          audioElement.src = expectedSrc;
          // Wait a bit for the source to be set
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (expectedSrc) {
          await audioElement.play();
          setIsPlaying(true);
          console.log('Real audio playing:', playlist?.[currentTrack]?.title || 'Unknown Track');
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);

      // Only switch to demo mode for actual file loading errors, not autoplay restrictions
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.log('Autoplay blocked by browser - this is normal, user needs to interact with play button');
        // Don't switch to demo mode for autoplay restrictions
        return;
      } else {
        // Switch to demo mode only for actual audio loading/file errors
        console.log('Actual audio error detected, switching to demo mode:', error);
        setIsDemoMode(true);
        setIsPlaying(!isPlaying);
      }
    }
  };

  const getRandomTrack = (excludeCurrent = true) => {
    if (!playlist || playlist.length === 0) return 0;
    let randomTrack;
    do {
      randomTrack = Math.floor(Math.random() * playlist.length);
    } while (excludeCurrent && randomTrack === currentTrack && playlist.length > 1);
    return randomTrack;
  };

  const nextTrack = () => {
    if (isLoadingTrack || !playlist || playlist.length === 0) {
      console.log('Already loading a track or no playlist available, ignoring next track request');
      return;
    }

    const next = isShuffleMode ? getRandomTrack() : (currentTrack + 1) % playlist.length;
    setCurrentTrack(next);
    console.log(isShuffleMode ? 'Random next track:' : 'Next track:', playlist[next]?.title);

    if (!isDemoMode && audioElement) {
      loadTrack(next);
    }
  };

  const prevTrack = () => {
    if (isLoadingTrack || !playlist || playlist.length === 0) {
      console.log('Already loading a track or no playlist available, ignoring previous track request');
      return;
    }

    const prev = isShuffleMode ? getRandomTrack() : (currentTrack === 0 ? playlist.length - 1 : currentTrack - 1);
    setCurrentTrack(prev);
    console.log(isShuffleMode ? 'Random previous track:' : 'Previous track:', playlist[prev]?.title);

    if (!isDemoMode && audioElement) {
      loadTrack(prev);
    }
  };

  const loadTrack = async (trackIndex: number) => {
    if (!audioElement || !playlist || !playlist[trackIndex] || isLoadingTrack) return;

    setIsLoadingTrack(true);
    const wasPlaying = isPlaying;
    const newSrc = playlist[trackIndex].file;

    console.log('Loading track:', playlist[trackIndex].title, 'from:', newSrc);

    try {
      // Pause current playback and reset
      audioElement.pause();
      setIsPlaying(false);

      // Clear the current source to stop any ongoing fetch
      audioElement.src = '';
      audioElement.load(); // This will abort any ongoing fetch

      // Wait a bit to ensure the previous audio is properly stopped
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set new source and reset position
      audioElement.src = newSrc;
      audioElement.currentTime = 0;

      // Load the new track with timeout and proper cleanup
      await new Promise((resolve, reject) => {
        let isResolved = false;

        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Load timeout'));
          }
        }, 8000); // 8 second timeout

        const handleLoad = () => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve(true);
          }
        };

        const handleError = (error: Event) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(error);
          }
        };

        const cleanup = () => {
          clearTimeout(timeout);
          audioElement.removeEventListener('canplaythrough', handleLoad);
          audioElement.removeEventListener('error', handleError);
          audioElement.removeEventListener('loadeddata', handleLoad);
        };

        audioElement.addEventListener('canplaythrough', handleLoad);
        audioElement.addEventListener('loadeddata', handleLoad); // Alternative event
        audioElement.addEventListener('error', handleError);
        audioElement.load();
      });

      // If it was playing before, start playing the new track
      if (wasPlaying) {
        await audioElement.play();
        setIsPlaying(true);
      }

      console.log('Successfully loaded track:', playlist[trackIndex].title);
    } catch (error) {
      console.error('Error loading/playing new track:', error);
      // Switch to demo mode if audio fails
      setIsDemoMode(true);
      if (wasPlaying) {
        setIsPlaying(true); // Keep playing in demo mode
      }
    } finally {
      setIsLoadingTrack(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioElement) {
      audioElement.volume = newVolume;
    }
  };

  const toggleTraxWidget = () => {
    // Check if widget is effectively hidden (either not visible or auto-hidden)
    if (isTraxVisible && !isTraxAutoHidden) {
      // Widget is currently visible - hide it
      setIsTraxVisible(false);
      setIsTraxAutoHidden(false);
      setShowBriefly(false);
      console.log('🔽 Manually hiding Trax widget');
    } else {
      // Widget is hidden (either not visible or auto-hidden) - show it
      setIsTraxVisible(true);
      setIsTraxAutoHidden(false);
      setShowBriefly(false);

      // Clear any existing timeouts
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      if (musicStartTimeout) {
        clearTimeout(musicStartTimeout);
      }

      if (scrollDownTimeout) {
        clearTimeout(scrollDownTimeout);
      }

      console.log('🔼 Manually showing Trax widget');
    }
  };

  // Handle first user interaction to start music automatically
  const handleFirstInteraction = async () => {
    // Only run once when user hasn't interacted yet
    if (hasUserInteracted) {
      return; // Already handled, don't run again
    }

    console.log('🎵 First user click detected, starting music...');
    setHasUserInteracted(true);
    setIsTraxVisible(true);

    // Stop WWE music when main music starts
    localStorage.removeItem('wwe-music-state');
    localStorage.setItem('stop-wwe-music', 'true');
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'stop-wwe-music',
      newValue: 'true'
    }));

    // Check if music is already playing in another tab
    if (isPlayingInOtherTab) {
      console.log('🎵 Music is playing in another tab, not auto-starting here');
      return;
    }

    // Start playing a random track automatically
    if (playlist && playlist.length > 0) {
      const randomTrack = Math.floor(Math.random() * playlist.length);
      setCurrentTrack(randomTrack);
      console.log('🎵 Auto-starting random track:', playlist[randomTrack]?.title);

      // Start playing the track
      if (audioElement && !isDemoMode) {
        try {
          audioElement.src = playlist[randomTrack].file;
          await audioElement.play();
          setIsPlaying(true);
          console.log('✅ Successfully auto-started music:', playlist[randomTrack]?.title);
        } catch (error) {
          console.log('❌ Could not auto-start music, user needs to click play button:', error);
          // Don't switch to demo mode for autoplay restrictions
          // Just show the widget and let user click play
        }
      } else if (isDemoMode) {
        console.log('🎮 Starting in demo mode...');
        setIsPlaying(true);
      }
    }
  };

  // Card flip functionality
  const handleCardFlip = (memberId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };



  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden" onClick={handleFirstInteraction}>
        {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="particles-bg"></div>
      </div>

      {/* Header with Scroll Spy */}
      <Header />

      {/* Hero Section - EXACT Recreation */}
      <section id="hero" className="hero-exact">
        <div className="hero-content-exact">
          {/* Large Logo Display */}
          <div className="hero-logo-container mb-8">
            <Image
              src="/komplexaci/img/logo.png"
              alt="Komplexáci Logo"
              width={300}
              height={300}
              className="hero-logo mx-auto"
              quality={100}
              priority={true}
              unoptimized={true}
            />
          </div>
          <h2 className="hero-title-exact">
            Komplexáci
          </h2>
          <p className="hero-subtitle-exact">
            Česká herní komunita (v důchodu)
          </p>
          <p className="hero-desc-exact">
            Specializovali jsme se na League of Legends a Counter Strike: GO
          </p>
          <a
            href="#discord"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            Připoj se k nám
          </a>

          {/* Minimalistic Performance Status */}
          <div className="mt-6">
            <PerformanceStatus showMusicHint={!hasUserInteracted && isLoaded} />
          </div>


        </div>
      </section>

      {/* About Section - EXACT Recreation */}
      <section id="o-nas" className="relative z-10 py-20" style={{ backgroundColor: 'var(--darker-bg)' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '2.5rem',
            color: 'var(--light-text)'
          }}>
            O našem klanu
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
              <p className="text-lg leading-relaxed" style={{ color: 'var(--medium-text)' }}>
                Jsme Komplexáci, herní klan z České republiky, který se specializoval na hry League of Legends a Counter Strike 2.
                Zandavali jsme solidní bomby a pecky, teď už bohužel nezahrajeme a pouze vzpomínáme na staré dobré časy.
              </p>
              <br />
              <p className="text-lg leading-relaxed" style={{ color: 'var(--medium-text)' }}>
                Náš klan vznikl z lásky ke kompetitivnímu hraní a přátelství, které se utvořilo během dlouhých hodin strávených
                ve virtuálních světech. Každý člen přinesl svou jedinečnou osobnost a herní styl, což z nás udělalo nezapomenutelný tým.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Members Section - EXACT Recreation */}
      <section ref={membersRef} id="clenove" className="relative z-10 py-20" style={{ backgroundColor: 'var(--dark-bg)' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '2.5rem',
            color: 'var(--light-text)'
          }}>
            Naši členové
          </h2>
          <div className="members-grid-exact">
            {shuffledMembers.map((member, index) => (
              <div
                key={member.id}
                className={`member-card-exact member-${member.id}-exact ${
                  membersVisible ? 'animate-in' : ''
                } ${flippedCards.has(member.id) ? 'flipped' : ''}`}
                style={{ animationDelay: `${index * 150}ms` }}
                onClick={() => handleCardFlip(member.id)}
              >
                <div className="member-card-inner">
                  {/* Front of the card */}
                  <div className="member-card-front">
                    <div className="member-avatar-exact">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <h3 className="member-name-exact">{member.name}</h3>
                    <p className="member-real-name-exact">{member.realName}</p>
                    <p className="member-role-exact">{member.role}</p>
                  </div>

                  {/* Back of the card */}
                  <div className="member-card-back">
                    <button
                      className="member-card-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardFlip(member.id);
                      }}
                    >
                      ✕
                    </button>

                    <div className="member-name-back" style={{ marginBottom: '15px', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--light-text)' }}>
                      {member.name}
                    </div>

                    <p className="member-bio-text">
                      {member.bio}
                    </p>

                    <div className="member-stats-list">
                      {member.stats.map((stat, statIndex) => (
                        <div key={statIndex} className="member-stat-item">
                          <span className="member-stat-label">{stat.label}:</span>
                          <span className="member-stat-value">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Games Section */}
      <section id="hry" className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Naše hry
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game, index) => (
              <a
                key={game.title}
                href={game.link}
                target={game.title === 'WWE Games' ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className={`group bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-500/20 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 hover:border-purple-400/50 cursor-pointer block ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 300}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">
                    {game.description}
                  </p>
                  <div className="inline-flex items-center text-purple-400 group-hover:text-purple-300 font-semibold transition-colors">
                    Více informací
                    <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* Discord & Music Section - Enhanced Immersive with Discord Background */}
      <section
        id="discord"
        className="relative z-10 py-12 overflow-hidden"
        style={{
          background: `
            linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
            url('/komplexaci/img/discord-bg.jpg'),
            linear-gradient(135deg,
              rgba(15, 15, 25, 0.95) 0%,
              rgba(25, 15, 35, 0.95) 25%,
              rgba(20, 25, 40, 0.95) 50%,
              rgba(30, 20, 45, 0.95) 75%,
              rgba(15, 15, 25, 0.95) 100%
            )
          `,
          backgroundAttachment: 'scroll',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          minHeight: '600px'
        }}
      >
        {/* Simplified Background Layers - Performance Optimized */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `
              linear-gradient(45deg,
                transparent 0%,
                rgba(114, 137, 218, 0.03) 25%,
                transparent 50%,
                rgba(114, 137, 218, 0.05) 75%,
                transparent 100%
              )
            `,
            animation: 'discordWave 20s ease-in-out infinite',
            transform: 'translateZ(0)'
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <h2
            className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '2.2rem',
              textShadow: '0 0 20px rgba(138, 43, 226, 0.5)'
            }}
          >
            Discord & Music
          </h2>

          {/* Discord Main Content - More compact */}
          <div className="max-w-2xl mx-auto text-center mb-6">
            <div
              className="backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(114, 137, 218, 0.2)'
              }}
            >
              <div className="mb-4">
                <div
                  className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transform transition-transform duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                    boxShadow: '0 6px 12px rgba(88, 101, 242, 0.3)',
                    transform: 'translateZ(0)'
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
              </div>
              <p
                className="text-lg mb-5 leading-relaxed text-white"
                style={{
                  fontSize: '1.1rem',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
              >
                Staň se součástí naší komunity na Discordu(která bohužel také upadá). Vlastně ani nevím, co zde najdeš
              </p>
              <a
                href="https://discord.gg/e6BEQpQRBA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-full text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(88, 101, 242, 0.4)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <svg className="w-5 h-5 mr-2 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="relative z-10">Připojit se</span>
              </a>
            </div>
          </div>

          {/* Music Dashboard Content - More compact with original spacing */}
          <div className="max-w-4xl mx-auto" style={{ marginTop: '30px' }}>
            <div
              className="relative overflow-hidden rounded-2xl border border-purple-500/30 hover:border-purple-400/60 transition-all duration-500 group"
              style={{
                background: `
                  linear-gradient(135deg,
                    rgba(255, 255, 255, 0.08) 0%,
                    rgba(255, 255, 255, 0.03) 100%
                  )
                `,
                backdropFilter: 'blur(20px)',
                boxShadow: `
                  0 20px 40px rgba(0, 0, 0, 0.3),
                  0 0 25px rgba(110, 79, 246, 0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              {/* Simplified Background Overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'linear-gradient(45deg, transparent 0%, rgba(138, 43, 226, 0.05) 50%, transparent 100%)',
                  transform: 'translateZ(0)'
                }}
              />

              {/* Music Dashboard Card with improved layout */}
              <div className="relative z-10 p-6">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                  {/* Music Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #6e4ff6, #00d2ff)',
                        boxShadow: '0 8px 16px rgba(110, 79, 246, 0.3)',
                        transform: 'translateZ(0)'
                      }}
                    >
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Music Info - Expanded to take more space */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
                          style={{
                            fontSize: '1.6rem',
                            fontWeight: '700',
                            textShadow: '0 0 15px rgba(138, 43, 226, 0.5)'
                          }}
                        >
                          🎵 Discord Music Bot Dashboard
                        </h3>
                        <p
                          className="text-base leading-relaxed mb-4 text-gray-200"
                          style={{
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          Ovládej náš Discord music bot přímo z webového rozhraní. Přidávej skladby, spravuj frontu, poslouchej rádio stanice a kontroluj přehrávání v reálném čase.
                        </p>

                        {/* Compact Feature tags */}
                        <div className="grid grid-cols-2 gap-2 mb-4 lg:mb-0">
                          {[
                            { icon: "M8 5v14l11-7z", text: "Ovládání" },
                            { icon: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z", text: "Fronta" },
                            { icon: "M3.24 6.15C2.51 6.43 2 7.17 2 8v8c0 .83.51 1.57 1.24 1.85L12 21.5l8.76-3.65C21.49 17.57 22 16.83 22 16V8c0-.83-.51-1.57-1.24-1.85L12 2.5 3.24 6.15zM12 9L8.5 7.5 12 6l3.5 1.5L12 9z", text: "Rádio" },
                            { icon: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z", text: "Vyhledávání" }
                          ].map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-center px-3 py-2 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 group/feature"
                              style={{
                                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(0, 210, 255, 0.05))',
                                backdropFilter: 'blur(10px)',
                                animationDelay: `${index * 0.1}s`
                              }}
                            >
                              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mr-2 group-hover/feature:scale-110 transition-transform duration-300">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d={feature.icon}/>
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-purple-200 group-hover/feature:text-white transition-colors duration-300">
                                {feature.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button - Better positioned and sized */}
                      <div className="flex-shrink-0 text-center lg:text-right">
                        <a
                          href="https://music.komplexaci.cz/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg text-white text-sm"
                          style={{
                            background: 'linear-gradient(135deg, #ff4655, #ff6b7a)',
                            boxShadow: '0 4px 12px rgba(255, 70, 85, 0.3)',
                            transform: 'translateZ(0)'
                          }}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/>
                          </svg>
                          <span>Otevřít Dashboard</span>
                        </a>
                        <p className="text-xs mt-1.5 text-purple-300" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                          Vyžaduje Discord přihlášení
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Server Information & Community Guidelines */}
      <section className="relative z-10 py-20" style={{ backgroundColor: 'var(--darker-bg)' }}>
        <div className="container mx-auto px-6">
          {/* Server Information & Community Guidelines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Server Information */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                🖥️ Server Information
              </h3>
              
              <div className="space-y-6">
                {/* Discord Server - Live Members */}
                <DiscordServerStats />

                {/* Daily Awards */}
                <DailyAwards />

                {/* Activity Times */}
                <div className="bg-gray-700/30 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 mr-3 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <h4 className="text-lg font-semibold text-white">Nejaktivnější časy</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="text-gray-300">🕕 18:00 - 23:00 (všední dny)</div>
                    <div className="text-gray-300">🕐 13:00 - 01:00 (víkendy)</div>
                    <div className="text-gray-400 text-xs mt-2">* Časy v CET/CEST timezone</div>
                  </div>
                </div>



              </div>
            </div>

            {/* Community Guidelines & Most Active Members */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                📋 Community Guidelines
              </h3>

              <div className="space-y-6">
                {/* Most Active Members */}
                <MostActiveMembers
                  members={discordStats?.mostActiveMembers || []}
                  dataSource={discordStats?.dataSource}
                  totalMemberCount={discordStats?.memberCount}
                />

                {/* Basic Rules */}
                <div className="bg-gray-700/30 rounded-xl p-4 border border-purple-500/20">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Základní pravidla
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      Respektuj ostatní členy
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      Žádný spam nebo toxicita
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      Používej správné kanály
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      Bavte se a užívejte si to!
                    </li>
                  </ul>
                </div>


                {/* Server Status - Website Health */}
                <ServerStatus />

                {/* Current Status */}
                <div className="bg-gray-700/30 rounded-xl p-4 border border-yellow-500/20">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Aktuální stav
                  </h4>
                  <div className="text-sm text-gray-300">
                    <p className="mb-2">🏖️ <strong>Status:</strong> Klan v důchodu</p>
                    <p className="mb-2">💬 <strong>Discord:</strong> Stále aktivní pro povídání</p>
                    <p>🎵 <strong>Music Bot:</strong> Hraje nostalgické pecky</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontakt" className="relative z-10 py-20" style={{ backgroundColor: 'var(--darker-bg)' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12" style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '2.5rem',
            color: 'var(--light-text)'
          }}>
            Kontakt
          </h2>
          <div className="max-w-6xl mx-auto">
            {/* Main Contact Info */}
            <div className="text-center mb-12">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
              <p className="text-lg mb-6 leading-relaxed" style={{ color: 'var(--medium-text)' }}>
                Máš zájem stát se součástí našeho týmu nebo máš nějaké otázky? Neváhej nás kontaktovat!
              </p>

              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 mr-3" style={{ color: 'var(--accent-color)' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <a
                    href="mailto:info@komplexaci.cz"
                    className="text-lg font-semibold hover:underline transition-colors"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    info@komplexaci.cz
                  </a>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <a href="https://www.facebook.com/penkava.martin" target="_blank" rel="noopener noreferrer"
                   className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://x.com/mpenkava1337" target="_blank" rel="noopener noreferrer"
                   className="w-12 h-12 bg-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/m_penkava/" target="_blank" rel="noopener noreferrer"
                   className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://www.twitch.tv/shanemc1337" target="_blank" rel="noopener noreferrer"
                   className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/user/Mercin1000" target="_blank" rel="noopener noreferrer"
                   className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-purple-500/20" style={{ backgroundColor: 'var(--darker-bg)' }}>
        <div className="container mx-auto px-6 text-center">
          <p style={{ color: 'var(--medium-text)' }}>
            © 2025 Komplexáci | Všechna práva vyhrazena
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--medium-text)', fontSize: '0.95em' }}>
            S láskou vytvořil Martin Pěnkava • Běží na Next.js 15.3.3 ⚡
          </p>
        </div>
      </footer>

      {/* KOMPG Trax Widget - Enhanced with Smart Features */}
      <div
        className={`trax-widget ${isTraxVisible ? 'active' : ''} ${isPlaying ? 'pulsating' : ''} ${isTraxAutoHidden ? 'auto-hidden' : ''} ${showBriefly ? 'show-briefly' : ''}`}
      >
        <button
          className="trax-close-button"
          onClick={() => {
            // Use auto-hidden instead of just hiding to keep mini icon glowing
            setIsTraxAutoHidden(true);
            console.log('❌ Manually closing Trax widget with X');
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid rgba(255, 0, 0, 0.5)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        <div className="trax-title">KOMPG Trax</div>

        <div className="trax-content">
          <div className="trax-logo">
            <span className="logo-text">K</span>
          </div>

          <div className="trax-track-info">
            {isPlayingInOtherTab && otherTabInfo ? (
              <>
                <ScrollingText
                  text={`🔗 ${otherTabInfo.track}`}
                  className="track-name"
                  maxWidth={120}
                />
                <p className="track-debug" style={{ color: '#ff9500' }}>
                  🎵 Playing in another tab
                </p>
                <p className="track-artist" style={{ color: '#ff9500' }}>
                  Click to take over playback
                </p>
              </>
            ) : (
              <>
                <ScrollingText
                  text={playlist?.[currentTrack]?.title || 'Komplexáci Anthem'}
                  className="track-name"
                  maxWidth={120}
                />
                <p className="track-debug">
                  {isDemoMode ? '🎮 DEMO' : '🎵'}
                  {isShuffleMode ? ' 🔀' : ''}
                  {' '}
                  {currentTrack + 1}/{playlist?.length || 0}
                </p>
                <ScrollingText
                  text={playlist?.[currentTrack]?.artist || 'Komplexáci Gaming Clan'}
                  className="track-artist"
                  maxWidth={120}
                />
              </>
            )}
          </div>

          <div className="trax-buttons">
            <button className="trax-button" onClick={prevTrack}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button
              className={`trax-button ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <button className="trax-button" onClick={nextTrack}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            <button
              className={`trax-button ${isShuffleMode ? 'playing' : ''}`}
              onClick={() => setIsShuffleMode(!isShuffleMode)}
              title={isShuffleMode ? 'Shuffle ON' : 'Shuffle OFF'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="volume-control">
          <svg className="w-4 h-4" style={{ color: 'var(--medium-text)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              width: '80px',
              height: '4px',
              background: 'rgba(0, 255, 255, 0.3)',
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* Trax Mini Icon - Always Visible */}
      <div
        className={`trax-mini-icon ${isPlayingInOtherTab ? 'other-tab-playing' : ''}`}
        onClick={toggleTraxWidget}
        title={isPlayingInOtherTab ? `KOMPG Trax playing in another tab: ${otherTabInfo?.track || 'Unknown'}` : "Toggle KOMPG Trax"}
        style={isPlayingInOtherTab ? {
          background: 'linear-gradient(135deg, #ff9500, #ff6b00)',
          animation: 'pulse 2s infinite'
        } : {}}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        {isPlayingInOtherTab && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            background: '#ff0000',
            borderRadius: '50%',
            border: '2px solid white',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            🔗
          </div>
        )}
      </div>


      </div>
    </>
  );
}
