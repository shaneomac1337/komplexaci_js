'use client';

import { useState, useEffect, useRef, useId } from 'react';
import SafeImage from './SafeImage';
import type {
  UserStatsModalProps,
  UserStats,
} from './userStats/types';
import OverviewTab from './userStats/OverviewTab';
import SpotifyTab from './userStats/SpotifyTab';
import GamingTab from './userStats/GamingTab';
import VoiceTab from './userStats/VoiceTab';
import AchievementsTab from './userStats/AchievementsTab';
import './user-stats-modal.css';

const TABS: Array<{
  id: 'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements';
  label: string;
  icon: string;
}> = [
  { id: 'overview', label: 'Přehled', icon: '📊' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
  { id: 'gaming', label: 'Hry', icon: '🎮' },
  { id: 'voice', label: 'Voice', icon: '🎤' },
  { id: 'achievements', label: 'Úspěchy', icon: '🏆' },
];

export default function UserStatsModal({ isOpen, onClose, userId, displayName, avatar }: UserStatsModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements'>('overview');
  const prevDataRef = useRef<string>('');

  const headingId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Focus management: capture previously-focused element, focus close button on open, restore on close
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  // Escape to close + focus trap (Tab / Shift+Tab cycles within the panel)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + dir + TABS.length) % TABS.length;
    setActiveTab(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserStats(true);

      // 🔄 REAL-TIME UPDATES: Refresh every 30 seconds while modal is open
      const interval = setInterval(() => {
        fetchUserStats(false);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen, userId]);

  const fetchUserStats = async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    }
    setError(null);

    try {
      // Fetch today's stats (1d timeRange for daily data)
      const response = await fetch(`/api/analytics/user/${userId}?timeRange=1d`);

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();

      if (data.success) {
        // Only update state if data actually changed
        const dataStr = JSON.stringify(data);
        if (dataStr !== prevDataRef.current) {
          prevDataRef.current = dataStr;
          setStats(data);
        }
      } else {
        throw new Error(data.message || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const todayLabel = new Date().toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
  });

  const liveState: 'is-loading' | 'is-live' | 'is-error' =
    initialLoading ? 'is-loading' : error ? 'is-error' : 'is-live';
  const liveLabel =
    liveState === 'is-loading' ? 'Načítání' : liveState === 'is-error' ? 'Offline' : 'Live';

  return (
    <div className="user-stats-lounge scrim" onClick={onClose}>
      <div
        ref={panelRef}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drag-handle" aria-hidden="true"><i /></div>

        <div className="header">
          <div className="avatar-wrap">
            <SafeImage
              src={avatar}
              alt={displayName}
              width={40}
              height={40}
              fallback={
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)' }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{displayName.charAt(0).toUpperCase()}</span>
                </div>
              }
            />
          </div>
          <div className="meta">
            <span id={headingId} className="name">{displayName}</span>
            <span className="sub">Dnešní aktivita · {todayLabel}</span>
          </div>
          <span className={`live-pill ${liveState}`} aria-live="polite">
            <i />
            {liveLabel}
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Zavřít"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="tabs" role="tablist" aria-label="Statistiky">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`stats-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`stats-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
            >
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div
          className="body"
          role="tabpanel"
          id={`stats-panel-${activeTab}`}
          aria-labelledby={`stats-tab-${activeTab}`}
        >
          {initialLoading && (
            <div aria-busy="true" aria-label="Načítání statistik">
              <div className="skeleton skeleton-headline" />
              <div className="skeleton-tiles">
                <div className="skeleton skeleton-tile" />
                <div className="skeleton skeleton-tile" />
                <div className="skeleton skeleton-tile" />
                <div className="skeleton skeleton-tile" />
              </div>
              <div className="skeleton skeleton-strip" />
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
            </div>
          )}

          {error && !initialLoading && (
            <div className="error-card">
              <p className="error-msg">❌ {error}</p>
              <button type="button" className="lounge-button" onClick={() => fetchUserStats(true)}>
                Zkusit znovu
              </button>
            </div>
          )}

          {stats && !initialLoading && (
            <div className="space-y-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && <OverviewTab stats={stats} />}

              {/* Spotify Tab */}
              {activeTab === 'spotify' && <SpotifyTab stats={stats} />}

              {/* Gaming Tab */}
              {activeTab === 'gaming' && <GamingTab stats={stats} />}

              {/* Voice Tab */}
              {activeTab === 'voice' && <VoiceTab stats={stats} />}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && <AchievementsTab stats={stats} />}
            </div>
          )}
        </div>

        <div className="footer">Data se resetují každý den o půlnoci (CET)</div>
      </div>
    </div>
  );
}
