'use client';

import { useState, useEffect, useRef } from 'react';

// WWE/SmackDown! 2 exclusive track - only track 14 is for WWE page
const wwePlaylist = [
  { title: "WWF SmackDown! 2 Theme", artist: "WWF SmackDown! 2 OST", file: "https://cdn.komplexaci.cz/komplexaci/audio/track14.mp3" }
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
  const [muted, setMuted] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isShuffleMode, setIsShuffleMode] = useState(true);
  const [isPlayerAutoHidden, setIsPlayerAutoHidden] = useState(false);
  const [showBriefly, setShowBriefly] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  // Panel mount + reveal gates so enter/exit CSS transitions play cleanly
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelRevealed, setPanelRevealed] = useState(false);
  const panelExitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const panelRevealRafRef = useRef<number | null>(null);
  const wweMountedRef = useRef(true);
  // Shared timer for the auto-hide-after-N-seconds behavior so rapid
  // skips/toggles don't leave a stale timeout closing the panel early
  const showBrieflyTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const handleTimeUpdate = () => {
      const d = audio.duration || 0;
      setElapsed(audio.currentTime || 0);
      setDuration(d);
      setProgress(d ? (audio.currentTime / d) * 100 : 0);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setElapsed(0);
      setProgress(0);
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

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
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, []);

  // Sync volume + muted to audio
  useEffect(() => {
    if (audioElement) audioElement.volume = muted ? 0 : volume;
  }, [audioElement, volume, muted]);

  // Track unmount so timers can no-op safely
  useEffect(() => {
    wweMountedRef.current = true;
    return () => {
      wweMountedRef.current = false;
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

    if (showBrieflyTimerRef.current) clearTimeout(showBrieflyTimerRef.current);
    showBrieflyTimerRef.current = setTimeout(() => {
      if (wweMountedRef.current) {
        setShowBriefly(false);
        setIsPlayerAutoHidden(true);
      }
      showBrieflyTimerRef.current = null;
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

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioElement || !audioElement.duration || isDemoMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioElement.currentTime = pct * audioElement.duration;
    setProgress(pct * 100);
    setElapsed(pct * audioElement.duration);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const panelOpen = (isPlayerVisible && !isPlayerAutoHidden) || showBriefly;

  // Gate panel mount + reveal so enter/exit CSS transitions fire cleanly.
  useEffect(() => {
    if (panelOpen) {
      if (panelExitTimerRef.current) {
        clearTimeout(panelExitTimerRef.current);
        panelExitTimerRef.current = null;
      }
      setPanelMounted(true);
      if (panelRevealRafRef.current != null) cancelAnimationFrame(panelRevealRafRef.current);
      panelRevealRafRef.current = requestAnimationFrame(() => {
        panelRevealRafRef.current = requestAnimationFrame(() => {
          if (wweMountedRef.current) setPanelRevealed(true);
        });
      });
    } else {
      if (panelRevealRafRef.current != null) cancelAnimationFrame(panelRevealRafRef.current);
      setPanelRevealed(false);
      if (panelExitTimerRef.current) clearTimeout(panelExitTimerRef.current);
      panelExitTimerRef.current = setTimeout(() => {
        if (wweMountedRef.current) setPanelMounted(false);
      }, 320);
    }
    return () => {
      if (panelExitTimerRef.current) clearTimeout(panelExitTimerRef.current);
      if (panelRevealRafRef.current != null) cancelAnimationFrame(panelRevealRafRef.current);
    };
  }, [panelOpen]);

  return (
    <>
      <div className="trax-root">
        {/* WWE Music Player Widget */}
        {panelMounted && (
        <div className={`trax-widget ${panelRevealed ? 'open' : ''} ${className}`}>
          {/* Header */}
          <div className="trax-header">
            <div className="trax-header-left">
              <div className="trax-logo">W</div>
              <div>
                <div className="trax-label"><span>WWE</span> Trax</div>
                <div className="trax-count">
                  {currentTrack + 1} / {wwePlaylist.length} · SmackDown! 2
                </div>
              </div>
            </div>
            <button
              className="trax-close"
              onClick={() => setIsPlayerAutoHidden(true)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Now playing */}
          <div className="trax-now">
            <div className="trax-now-label">
              {isPlaying && <span className="dot" />}
              {isPlaying ? (isDemoMode ? 'Now playing · DEMO' : 'Now playing') : 'Paused'}
            </div>
            <div className="trax-title-row">
              <div className="trax-title-text">
                <div
                  className="trax-track-title"
                  title={wwePlaylist[currentTrack]?.title || 'WWF SmackDown! 2 Theme'}
                >
                  {wwePlaylist[currentTrack]?.title || 'WWF SmackDown! 2 Theme'}
                </div>
                <div className="trax-track-artist">
                  {wwePlaylist[currentTrack]?.artist || 'WWF SmackDown! 2 OST'}
                </div>
              </div>
              <span className="trax-tag">WWE</span>
            </div>
          </div>

          {/* Progress */}
          <div className="trax-progress">
            <div className="trax-progress-track" onClick={seekTo}>
              <div className="trax-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="trax-progress-times">
              <span>{fmt(elapsed)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="trax-controls">
            <div className="trax-btn-group">
              <button className="trax-btn" onClick={prevTrack} title="Previous">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
              </button>
              <button
                className={`trax-btn play ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                title="Play / Pause"
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button className="trax-btn" onClick={nextTrack} title="Next">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            <div className="trax-volume">
              <button
                type="button"
                className="trax-vol-icon"
                onClick={() => setMuted((m) => !m)}
                title={muted ? 'Unmute' : 'Mute'}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMuted(false);
                  setVolume(v);
                  if (audioElement) audioElement.volume = v;
                }}
              />
            </div>
          </div>

          {isDemoMode && (
            <div className="trax-demo">
              <span>DEMO</span> — audio files not reachable
            </div>
          )}
        </div>
        )}

        {/* WWE Music Mini Icon */}
        <div
          className={`trax-mini-icon ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayerWidget}
          title="Toggle WWE Music Player"
        >
          <div className="trax-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
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