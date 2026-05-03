'use client';

import type { CSSProperties } from 'react';
import type { WWEGame } from '../../types/wwe';
import type { ThemedEra } from '../eraTheme';
import Cover from './Cover';

interface UndercardPosterProps {
  game: WWEGame;
  era: ThemedEra;
  onClick: (game: WWEGame, era: ThemedEra) => void;
}

export default function UndercardPoster({ game, era, onClick }: UndercardPosterProps) {
  const styleVars = {
    '--era-accent': era.accent,
    '--era-accent2': era.accent2,
  } as CSSProperties;

  return (
    <button
      type="button"
      className="wwe-poster"
      onClick={() => onClick(game, era)}
      style={styleVars}
      aria-label={`${game.title}, ${game.year}, ${game.platform}`}
    >
      <div className="wwe-poster-cover-wrap">
        <Cover game={game} era={era} size="large" />
        <div className="wwe-poster-corner wwe-poster-corner-tl" aria-hidden="true">◤</div>
        <div className="wwe-poster-corner wwe-poster-corner-tr" aria-hidden="true">◥</div>
        <div className="wwe-poster-corner wwe-poster-corner-bl" aria-hidden="true">◣</div>
        <div className="wwe-poster-corner wwe-poster-corner-br" aria-hidden="true">◢</div>
        <div className="wwe-poster-overlay">
          <div className="wwe-poster-overlay-inner">
            <p className="wwe-poster-overlay-desc">{game.description}</p>
            <div className="wwe-poster-cta">
              <span>VIEW DETAILS</span>
              <span className="wwe-up-arrow">→</span>
            </div>
          </div>
        </div>
      </div>
      <div className="wwe-poster-info">
        <div className="wwe-poster-meta-row">
          <span className="wwe-poster-year">{game.year}</span>
          <span className="wwe-poster-dot">●</span>
          <span className="wwe-poster-platform">{game.platform}</span>
        </div>
        <h4 className="wwe-poster-title">{game.title}</h4>
      </div>
    </button>
  );
}
