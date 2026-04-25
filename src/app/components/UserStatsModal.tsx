'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function UserStatsModal({ isOpen, onClose, userId, displayName, avatar }: UserStatsModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements'>('overview');
  const prevDataRef = useRef<string>('');

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

  const TABS: Array<{ id: 'overview' | 'spotify' | 'gaming' | 'voice' | 'achievements'; label: string; icon: string }> = [
    { id: 'overview', label: 'Přehled', icon: '📊' },
    { id: 'spotify', label: 'Spotify', icon: '🎵' },
    { id: 'gaming', label: 'Hry', icon: '🎮' },
    { id: 'voice', label: 'Voice', icon: '🎤' },
    { id: 'achievements', label: 'Úspěchy', icon: '🏆' },
  ];

  return (
    <div className="user-stats-lounge scrim" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
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
            <span className="name">{displayName}</span>
            <span className="sub">Dnešní aktivita · {todayLabel}</span>
          </div>
          <span className={`live-pill ${liveState}`} aria-live="polite">
            <i />
            {liveLabel}
          </span>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Zavřít">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="body">
          {initialLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Načítání statistik...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">❌ {error}</p>
              <button
                onClick={() => fetchUserStats(true)}
                className="mt-2 px-4 py-2 min-h-[44px] bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
              >
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