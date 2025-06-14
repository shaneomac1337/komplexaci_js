'use client';

import { useState, useEffect, useRef } from 'react';

// WWE/SmackDown! 2 exclusive track - only track 14 is for WWE page
const wwePlaylist = [
  { title: "WWF SmackDown! 2 Theme", artist: "WWF SmackDown! 2 OST", file: "/komplexaci/audio/track14.mp3" }
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

interface WWEMusicPlayerProps {
  className?: string;
}

const WWEMusicPlayer: React.FC<WWEMusicPlayerProps> = ({ className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isShuffleMode, setIsShuffleMode] = useState(true);
  const [isPlayerAutoHidden, setIsPlayerAutoHidden] = useState(false);
  const [showBriefly, setShowBriefly] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Smart hide timeouts
  const [scrollDownTimeout, setScrollDownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activityTimeout, setActivityTimeout] = useState<NodeJS.Timeout | null>(null);
  const [musicStartTimeout, setMusicStartTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasShownMusicStart, setHasShownMusicStart] = useState(false);

  // Cross-page music control
  useEffect(() => {
    // Listen for main page music events, auto-start signals, and stop signals
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kompg-music-state') {
        const mainPageState = JSON.parse(e.newValue || '{}');
        if (mainPageState.isPlaying && isPlaying) {
          // Main page started playing, pause WWE music
          console.log('Main page music started, pausing WWE music');
          if (audioElement && !isDemoMode) {
            audioElement.pause();
          }
          setIsPlaying(false);
        }
      } else if (e.key === 'stop-wwe-music') {
        // Main page explicitly requested to stop WWE music
        console.log('Main page requested to stop WWE music');
        if (audioElement && !isDemoMode) {
          audioElement.pause();
        }
        setIsPlaying(false);
        // Clear the stop signal
        localStorage.removeItem('stop-wwe-music');
      } else if (e.key === 'wwe-music-state') {
        const wweState = JSON.parse(e.newValue || '{}');
        if (wweState.autoStart && !isPlaying) {
          // WWE page requested auto-start
          console.log('WWE page requested auto-start of WWE music');
          setHasUserInteracted(true);
          setIsPlayerVisible(true);
          
          if (!isDemoMode && audioElement) {
            audioElement.play()
              .then(() => {
                setIsPlaying(true);
                console.log('WWE music auto-started successfully');
              })
              .catch((error) => {
                console.log('WWE music auto-start failed, switching to demo mode:', error);
                setIsDemoMode(true);
                setIsPlaying(true);
              });
          } else {
            setIsPlaying(true);
            console.log('WWE music auto-started in demo mode');
          }
        }
      }
    };

    // Set WWE music state in localStorage when playing
    const updateMusicState = () => {
      if (isPlaying) {
        localStorage.setItem('wwe-music-state', JSON.stringify({
          isPlaying: true,
          track: wwePlaylist[currentTrack]?.title || 'WWE Track',
          page: 'wwe'
        }));
      } else {
        localStorage.removeItem('wwe-music-state');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    updateMusicState();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.removeItem('wwe-music-state');
    };
  }, [isPlaying, currentTrack, audioElement, isDemoMode]);

  // Check for main page music on mount
  useEffect(() => {
    const checkMainPageMusic = () => {
      const mainPageState = localStorage.getItem('kompg-music-state');
      if (mainPageState) {
        const state = JSON.parse(mainPageState);
        if (state.isPlaying) {
          console.log('Main page music is already playing, WWE music will not auto-start');
          return true;
        }
      }
      return false;
    };

    // Don't auto-start if main page is playing
    if (checkMainPageMusic()) {
      setHasUserInteracted(true); // Prevent auto-start
    }
  }, []);

  useEffect(() => {
    // Initialize audio
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = 'auto';

    const handleError = () => {
      console.log('WWE Audio file not found, switching to demo mode');
      setIsDemoMode(true);
    };

    const handleCanPlay = () => {
      console.log('WWE Audio file loaded successfully');
      setIsDemoMode(false);
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    setAudioElement(audio);

    // Load random initial track
    if (wwePlaylist.length > 0) {
      const initialTrack = Math.floor(Math.random() * wwePlaylist.length);
      setCurrentTrack(initialTrack);
      audio.src = wwePlaylist[initialTrack].file;
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, []);

  // Scroll-based auto-hide functionality
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!hasUserInteracted) {
        return; // Don't hide if user hasn't interacted yet
      }

      // Check if we're scrolling down by comparing with last position
      const isScrollingDown = currentScrollY > lastScrollY;

      // Clear any existing scroll down timeout
      if (scrollDownTimeout) {
        clearTimeout(scrollDownTimeout);
      }

      // If scrolling down and widget is visible, start 0.1-second timer to hide
      if (isScrollingDown && isPlayerVisible && !isPlayerAutoHidden && currentScrollY > 50) {
        const newScrollDownTimeout = setTimeout(() => {
          console.log('🔽 Hiding WWE Trax - scrolled down for 0.1 seconds:', currentScrollY);
          setIsPlayerAutoHidden(true);
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
  }, [isPlayerVisible, isPlayerAutoHidden, hasUserInteracted, scrollDownTimeout, lastScrollY]);

  // Handle track ended
  useEffect(() => {
    if (!audioElement) return;

    const handleEnded = () => {
      console.log('WWE Track ended, playing next');
      
      let next;
      if (isShuffleMode) {
        do {
          next = Math.floor(Math.random() * wwePlaylist.length);
        } while (next === currentTrack && wwePlaylist.length > 1);
      } else {
        next = (currentTrack + 1) % wwePlaylist.length;
      }

      setCurrentTrack(next);

      if (!isDemoMode && audioElement && wwePlaylist[next]) {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.src = wwePlaylist[next].file;
        audioElement.play()
          .then(() => {
            setIsPlaying(true);
            showPlayerBriefly();
          })
          .catch((error) => {
            console.error('Error auto-advancing WWE track:', error);
            setIsDemoMode(true);
          });
      } else if (isDemoMode) {
        showPlayerBriefly();
      }
    };

    audioElement.addEventListener('ended', handleEnded);
    return () => audioElement.removeEventListener('ended', handleEnded);
  }, [audioElement, isDemoMode, isShuffleMode, currentTrack]);

  // Inactivity-based auto-hide (only when music is paused)
  useEffect(() => {
    // Clear existing timeout
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }

    // Only auto-hide when music is paused and widget is visible
    if (!isPlaying && isPlayerVisible && !isPlayerAutoHidden) {
      const newActivityTimeout = setTimeout(() => {
        setIsPlayerAutoHidden(true);
        console.log('💤 Auto-hiding WWE Trax after 15s inactivity (music paused)');
      }, 15000);

      setActivityTimeout(newActivityTimeout);
    }

    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [isPlaying, isPlayerVisible, isPlayerAutoHidden]);

  // Music start notification - show for 5 seconds when music starts
  useEffect(() => {
    // Only trigger on transition from not playing to playing
    if (isPlaying && !hasShownMusicStart) {
      // Clear any existing timeout
      if (musicStartTimeout) {
        clearTimeout(musicStartTimeout);
      }

      // Show widget immediately when music starts (regardless of current state)
      setIsPlayerVisible(true);
      setIsPlayerAutoHidden(false);
      setShowBriefly(true);
      setHasShownMusicStart(true);
      console.log('🎵 WWE Music started - showing WWE Trax for 5 seconds');

      // Auto-minimize after 5 seconds - ALWAYS hide regardless of scroll position
      const newMusicTimeout = setTimeout(() => {
        setShowBriefly(false);
        setIsPlayerAutoHidden(true);
        console.log('⏰ Auto-minimizing WWE Trax after 5 seconds');
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
        setShowBriefly(false);
      }, 3000);

      return () => clearTimeout(briefTimer);
    }
  }, [currentTrack]);

  const showPlayerBriefly = () => {
    setIsPlayerVisible(true);
    setIsPlayerAutoHidden(false);
    setShowBriefly(true);
    
    setTimeout(() => {
      setShowBriefly(false);
      setIsPlayerAutoHidden(true);
    }, 4000);
  };

  const togglePlay = async () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      setIsPlayerVisible(true);
    }

    if (isDemoMode) {
      setIsPlaying(!isPlaying);
      console.log(isPlaying ? 'WWE Demo: Music paused' : `WWE Demo: Playing ${wwePlaylist[currentTrack]?.title}`);
      return;
    }

    if (!audioElement) {
      setIsDemoMode(true);
      setIsPlaying(!isPlaying);
      return;
    }

    try {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        const expectedSrc = wwePlaylist[currentTrack]?.file || '';
        if (audioElement.src !== expectedSrc && audioElement.src !== window.location.origin + expectedSrc) {
          audioElement.src = expectedSrc;
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        await audioElement.play();
        setIsPlaying(true);
        showPlayerBriefly();
      }
    } catch (error) {
      console.error('WWE Audio playback error:', error);
      setIsDemoMode(true);
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    const next = isShuffleMode 
      ? Math.floor(Math.random() * wwePlaylist.length)
      : (currentTrack + 1) % wwePlaylist.length;
    
    setCurrentTrack(next);
    
    if (!isDemoMode && audioElement) {
      loadTrack(next);
    }
  };

  const prevTrack = () => {
    const prev = isShuffleMode 
      ? Math.floor(Math.random() * wwePlaylist.length)
      : (currentTrack === 0 ? wwePlaylist.length - 1 : currentTrack - 1);
    
    setCurrentTrack(prev);
    
    if (!isDemoMode && audioElement) {
      loadTrack(prev);
    }
  };

  const loadTrack = async (trackIndex: number) => {
    if (!audioElement || !wwePlaylist[trackIndex]) return;

    const wasPlaying = isPlaying;
    const newSrc = wwePlaylist[trackIndex].file;

    try {
      audioElement.pause();
      setIsPlaying(false);
      audioElement.src = newSrc;
      audioElement.currentTime = 0;

      if (wasPlaying) {
        await audioElement.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error loading WWE track:', error);
      setIsDemoMode(true);
      if (wasPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioElement) {
      audioElement.volume = newVolume;
    }
  };

  const togglePlayerWidget = () => {
    // Check if widget is effectively hidden (either not visible or auto-hidden)
    if (isPlayerVisible && !isPlayerAutoHidden) {
      // Widget is currently visible - hide it
      setIsPlayerVisible(false);
      setIsPlayerAutoHidden(false);
      setShowBriefly(false);
      console.log('🔽 Manually hiding WWE Trax widget');
    } else {
      // Widget is hidden (either not visible or auto-hidden) - show it
      setIsPlayerVisible(true);
      setIsPlayerAutoHidden(false);
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

      console.log('🔼 Manually showing WWE Trax widget');
    }
  };

  return (
    <>
      {/* WWE Music Player Widget */}
      <div
        className={`trax-widget ${isPlayerVisible ? 'active' : ''} ${isPlaying ? 'pulsating' : ''} ${isPlayerAutoHidden ? 'auto-hidden' : ''} ${showBriefly ? 'show-briefly' : ''} ${className}`}
      >
        <button
          className="trax-close-button"
          onClick={() => setIsPlayerAutoHidden(true)}
        >
          ✕
        </button>

        <div className="trax-title">WWE Trax</div>

        <div className="trax-content">
          <div className="trax-logo">
            <span className="logo-text">W</span>
          </div>

          <div className="trax-track-info">
            <ScrollingText
              text={wwePlaylist[currentTrack]?.title || 'WWF SmackDown! 2 Theme'}
              className="track-name"
              maxWidth={120}
            />
            <p className="track-debug">
              {isDemoMode ? '🎮 DEMO' : '🎵'}
              {' '}
              Track: 1/1
            </p>
            <ScrollingText
              text={wwePlaylist[currentTrack]?.artist || 'WWF SmackDown! 2 OST'}
              className="track-artist"
              maxWidth={120}
            />
          </div>

          <div className="trax-buttons">
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

      {/* WWE Music Mini Icon */}
      <div
        className="trax-mini-icon"
        onClick={togglePlayerWidget}
        title="Toggle WWE Music Player"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>

      {/* Auto-play hint */}
      {!hasUserInteracted && (
        <div className="fixed bottom-24 right-6 z-30 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-500/30 animate-bounce">
          <p className="text-sm text-purple-300 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            Klikni pro SmackDown! 2 hudbu
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes scroll-text {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  );
};

export default WWEMusicPlayer;