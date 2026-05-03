'use client';

import { forwardRef, type CSSProperties } from 'react';
import type { WWEGame } from '../../types/wwe';
import type { ThemedEra } from '../eraTheme';
import UndercardPoster from './UndercardPoster';

interface EraSectionProps {
  era: ThemedEra;
  index: number;
  onGameClick: (game: WWEGame, era: ThemedEra) => void;
}

const EraSection = forwardRef<HTMLElement, EraSectionProps>(function EraSection(
  { era, index, onGameClick },
  ref
) {
  const games = era.games;
  const eraNum = String(index + 1).padStart(2, '0');
  const styleVars = {
    '--accent': era.accent,
    '--accent2': era.accent2,
    '--deep': era.deep,
  } as CSSProperties;

  return (
    <section
      ref={ref}
      id={`era-${era.id}`}
      className={`wwe-era wwe-era-${era.id}`}
      style={styleVars}
      data-era-id={era.id}
    >
      <div className="wwe-era-bg" />
      <div className="wwe-era-bg-vignette" />
      <div className="wwe-era-bg-grain" />
      <div className="wwe-era-bg-spots" />

      <div className="wwe-era-stripe">
        <span className="wwe-era-stripe-num">CHAPTER {eraNum}</span>
        <span className="wwe-era-stripe-dot">●</span>
        <span>{era.console}</span>
        <span className="wwe-era-stripe-dot">●</span>
        <span>{era.subtitle}</span>
      </div>

      <div className="wwe-era-header">
        <div className="wwe-era-num-display" aria-hidden="true">{eraNum}</div>
        <div className="wwe-era-header-text">
          <p className="wwe-era-tagline">&ldquo;{era.tagline}&rdquo;</p>
          <h2 className="wwe-era-title">{era.title}</h2>
          <div className="wwe-era-subtitle">
            <span className="wwe-era-badge" style={{ background: era.accent, color: era.deep }}>
              {era.consoleBadge}
            </span>
            {era.headliners.length > 0 && (
              <span className="wwe-era-headliners">feat. {era.headliners.join(' · ')}</span>
            )}
          </div>
        </div>
      </div>

      <p className="wwe-era-description">{era.description}</p>

      <div className="wwe-fight-card">
        <div className="wwe-fight-card-header">
          <div className="wwe-fc-label">
            <span className="wwe-fc-bracket">[</span>
            ROSTER
            <span className="wwe-fc-bracket">]</span>
          </div>
          <div className="wwe-fc-count">
            {games.length} {games.length === 1 ? 'TITLE' : 'TITLES'}
          </div>
        </div>

        <div className="wwe-games-grid">
          {games.map((g) => (
            <UndercardPoster
              key={g.id}
              game={g}
              era={era}
              onClick={onGameClick}
            />
          ))}
        </div>
      </div>

      <div className="wwe-era-footer">
        <div className="wwe-era-footer-line" />
        <div className="wwe-era-footer-text">
          END OF CHAPTER {eraNum} — {era.title.toUpperCase()}
        </div>
        <div className="wwe-era-footer-line" />
      </div>
    </section>
  );
});

export default EraSection;
