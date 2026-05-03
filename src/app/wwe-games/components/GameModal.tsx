'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import type { WWEGame } from '../../types/wwe';
import type { ThemedEra } from '../eraTheme';
import Cover from './Cover';

interface GameModalProps {
  game: WWEGame;
  era: ThemedEra;
  onClose: () => void;
}

export default function GameModal({ game, era, onClose }: GameModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const styleVars = {
    '--accent': era.accent,
    '--accent2': era.accent2,
    '--deep': era.deep,
  } as CSSProperties;

  return (
    <div
      className="wwe-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={styleVars}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wwe-modal-title"
    >
      <div className="wwe-modal">
        <div className="wwe-modal-bg" />
        <button
          ref={closeBtnRef}
          type="button"
          className="wwe-modal-close"
          onClick={onClose}
          aria-label="Close details"
        >
          <span>ESC</span>
          <span className="wwe-modal-close-x" aria-hidden="true">✕</span>
        </button>

        <div className="wwe-modal-inner">
          <div className="wwe-modal-cover-wrap">
            <Cover game={game} era={era} size="huge" />
            <div className="wwe-modal-cover-stripe">
              <span>{era.consoleBadge}</span>
              <span>·</span>
              <span>{game.year}</span>
            </div>
          </div>

          <div className="wwe-modal-content">
            <div className="wwe-modal-tagline">&ldquo;{era.tagline}&rdquo;</div>
            <div className="wwe-modal-era-label" style={{ color: era.accent }}>
              CHAPTER · {era.title.toUpperCase()}
            </div>
            <h3 id="wwe-modal-title" className="wwe-modal-title">{game.title}</h3>
            <div className="wwe-modal-meta">
              <span>{game.platform}</span>
            </div>

            <p className="wwe-modal-desc">{game.description}</p>

            <div className="wwe-modal-features-label">KEY FEATURES</div>
            <div className="wwe-modal-features">
              {game.features.map((f, i) => (
                <div key={i} className="wwe-modal-feature">
                  <span className="wwe-modal-feature-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="wwe-modal-feature-text">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
