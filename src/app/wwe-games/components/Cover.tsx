'use client';

import { useState } from 'react';
import type { WWEGame } from '../../types/wwe';
import type { ThemedEra } from '../eraTheme';

type Size = 'normal' | 'large' | 'huge';

interface CoverProps {
  game: WWEGame;
  era: ThemedEra;
  size?: Size;
}

export default function Cover({ game, era, size = 'normal' }: CoverProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`wwe-cover wwe-cover-${size}`}>
      {!error && (
        <img
          src={game.cover}
          alt={game.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
      {(error || !loaded) && (
        <div
          className="wwe-cover-placeholder"
          style={{
            background: `linear-gradient(135deg, ${era.deep} 0%, #000 60%, ${era.accent}20 100%)`,
            borderColor: `${era.accent}60`,
            color: era.accent,
          }}
        >
          <div className="wwe-cover-placeholder-grid" />
          <div className="wwe-cover-placeholder-stamp" style={{ color: era.accent }}>
            {era.consoleBadge}
          </div>
          <div className="wwe-cover-placeholder-title" style={{ color: era.accent }}>
            {game.title}
          </div>
          <div className="wwe-cover-placeholder-year">{game.year}</div>
        </div>
      )}
      <div className="wwe-cover-shine" />
    </div>
  );
}
