'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SafeImage from './SafeImage';
import './daily-awards-redesign.css';

interface DailyAward {
  id: string;
  title: string;
  icon: string;
  description: string;
  winner: {
    userId: string;
    displayName: string;
    avatar: string | null;
    value: number;
    unit: string;
  } | null;
  participantCount: number;
}

interface StandingsEntry {
  userId: string;
  displayName: string;
  avatar: string | null;
  value: number;
  unit: string;
  rank: number;
}

interface StandingsStatistics {
  totalParticipants: number;
  totalValue: number;
  averageValue: number;
  unit: string;
}

export default function DailyAwards() {
  const [awards, setAwards] = useState<DailyAward[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAward, setSelectedAward] = useState<DailyAward | null>(null);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [statistics, setStatistics] = useState<StandingsStatistics | null>(null);
  const [mounted, setMounted] = useState(false);
  const prevDataRef = useRef<string>('');

  const fetchAwards = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      }
      setError(null);

      const response = await fetch('/api/daily-awards');
      const data = await response.json();

      if (data.success) {
        // Only update state if data actually changed
        const dataStr = JSON.stringify(data.awards);
        if (dataStr !== prevDataRef.current) {
          prevDataRef.current = dataStr;
          setAwards(data.awards);
        }
      } else {
        setError(data.message || 'Failed to load awards');
      }
    } catch (err) {
      console.error('Error fetching daily awards:', err);
      setError('Failed to load awards');
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const fetchStandings = async (award: DailyAward) => {
    try {
      setStandingsLoading(true);
      const response = await fetch(`/api/daily-awards/standings?category=${award.id}`);
      const data = await response.json();

      if (data.success) {
        setStandings(data.standings);
        setStatistics(data.statistics);
      } else {
        console.error('Failed to load standings:', data.message);
        setStandings([]);
        setStatistics(null);
      }
    } catch (err) {
      console.error('Error fetching standings:', err);
      setStandings([]);
      setStatistics(null);
    } finally {
      setStandingsLoading(false);
    }
  };

  const handleAwardClick = async (award: DailyAward) => {
    setSelectedAward(award);
    await fetchStandings(award);
  };

  const closeModal = () => {
    setSelectedAward(null);
    setStandings([]);
    setStatistics(null);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAwards(true);

    // 🔄 REAL-TIME UPDATES: Refresh every minute for live competition tracking
    const interval = setInterval(() => fetchAwards(false), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <div className="daily-awards-lounge">
        <div className="awards-widget-head">
          <div className="awards-title">
            <span className="awards-title-icon">★</span>
            <div>
              <h4>Ocenění dne</h4>
              <p>Žebříčky se právě načítají</p>
            </div>
          </div>
        </div>
        <div className="awards-state">
          <div className="awards-spinner" aria-hidden="true" />
          <span>Načítání ocenění...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-awards-lounge is-error">
        <div className="awards-widget-head">
          <div className="awards-title">
            <span className="awards-title-icon">!</span>
            <div>
              <h4>Ocenění dne</h4>
              <p>Data se nepovedlo načíst</p>
            </div>
          </div>
        </div>
        <div className="awards-state">
          <span className="awards-error-text">{error}</span>
          <button
            type="button"
            onClick={() => fetchAwards(true)}
            className="awards-retry"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-awards-lounge">
      <div className="awards-widget-head">
        <div className="awards-title">
          <span className="awards-title-icon">★</span>
          <div>
            <h4>Ocenění dne</h4>
            <p>Klikni na kategorii pro detailní žebříček</p>
          </div>
        </div>
        <span className="awards-live-pill">
          <i />
          Live
        </span>
      </div>

      <div className="awards-list">
        {awards.map((award) => (
          <div
            key={award.id}
            role="button"
            tabIndex={0}
            onClick={() => handleAwardClick(award)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAwardClick(award);
              }
            }}
            className="award-row"
          >
            <div className="award-info">
              <span className="award-icon">{award.icon}</span>
              <div className="award-copy">
                <strong>{award.title}</strong>
                <span>{award.participantCount} účastníků</span>
              </div>
            </div>

            <div className="award-winner">
              {award.winner ? (
                <>
                  <SafeImage
                    src={award.winner.avatar}
                    alt={award.winner.displayName}
                    width={40}
                    height={40}
                    className="award-avatar"
                    fallback={
                      <div className="award-avatar award-avatar-fallback">
                        {award.winner.displayName.charAt(0).toUpperCase()}
                      </div>
                    }
                  />
                  <div className="award-winner-copy">
                    <strong>{award.winner.displayName}</strong>
                    <span>{award.winner.value} {award.winner.unit}</span>
                  </div>
                </>
              ) : (
                <span className="award-empty">Nikdo</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Standings Modal */}
      {selectedAward && mounted && createPortal(
        <div className="daily-awards-lounge awards-modal-scrim" onClick={closeModal}>
          <div
            className="awards-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-awards-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="awards-drag-handle" aria-hidden="true"><i /></div>

            <div className="awards-modal-header">
              <div className="awards-modal-title-row">
                <span className="awards-modal-icon">{selectedAward.icon}</span>
                <div className="awards-modal-title-copy">
                  <h3 id="daily-awards-modal-title">{selectedAward.title}</h3>
                  <p>{selectedAward.description}</p>
                  <span className="awards-modal-kicker">Dnešní pořadí · live tracking</span>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="awards-close-btn"
                  aria-label="Zavřít"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="awards-date-strip">
                <div className="awards-date-label">
                  <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                  </svg>
                  <span>
                    {new Date().toLocaleDateString('cs-CZ', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {statistics && (
                  <div className="awards-stat-grid">
                    <div>
                      <strong>{statistics.totalParticipants}</strong>
                      <span>účastníků</span>
                    </div>
                    <div>
                      <strong>{statistics.totalValue}</strong>
                      <span>celkem {statistics.unit}</span>
                    </div>
                    <div>
                      <strong>{statistics.averageValue}</strong>
                      <span>průměr {statistics.unit}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="awards-modal-body">
              {standingsLoading ? (
                <div className="awards-state">
                  <div className="awards-spinner" aria-hidden="true" />
                  <span>Načítání žebříčku...</span>
                </div>
              ) : standings.length > 0 ? (
                <div className="standings-list">
                  {standings.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`standing-row standing-rank-${Math.min(index + 1, 4)}`}
                    >
                      <div className="standing-rank">#{entry.rank || index + 1}</div>

                      <SafeImage
                        src={entry.avatar}
                        alt={entry.displayName}
                        width={40}
                        height={40}
                        className="standing-avatar"
                        fallback={
                          <div className="standing-avatar standing-avatar-fallback">
                            {entry.displayName.charAt(0).toUpperCase()}
                          </div>
                        }
                      />

                      <div className="standing-name">
                        <strong>{entry.displayName}</strong>
                      </div>

                      <div className="standing-score">
                        <strong>{entry.value}</strong>
                        <span>{entry.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="awards-empty-state">
                  Žádní účastníci v této kategorii
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
