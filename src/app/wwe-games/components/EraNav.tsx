'use client';

import type { CSSProperties } from 'react';
import type { ThemedEra } from '../eraTheme';

interface EraNavProps {
  eras: ThemedEra[];
  activeEra: string;
  onJump: (eraId: string) => void;
}

export default function EraNav({ eras, activeEra, onJump }: EraNavProps) {
  return (
    <nav className="wwe-era-nav" aria-label="Era navigation">
      <div className="wwe-era-nav-rail">
        {eras.map((era, i) => (
          <button
            key={era.id}
            type="button"
            className={`wwe-era-nav-tick${activeEra === era.id ? ' active' : ''}`}
            onClick={() => onJump(era.id)}
            style={{ '--accent': era.accent } as CSSProperties}
            aria-current={activeEra === era.id ? 'true' : undefined}
          >
            <span className="wwe-era-nav-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="wwe-era-nav-dot" />
            <span className="wwe-era-nav-label">{era.title}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
