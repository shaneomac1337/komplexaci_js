'use client';

interface HeroProps {
  totalGames: number;
  erasCount: number;
  yearsActive?: number;
  onStart: () => void;
}

export default function Hero({ totalGames, erasCount, yearsActive = 38, onStart }: HeroProps) {
  return (
    <section className="wwe-hero" aria-label="WWE Games Collection">
      <div className="wwe-hero-noise" />
      <div className="wwe-hero-spotlights">
        <div className="wwe-spotlight wwe-spotlight-1" />
        <div className="wwe-spotlight wwe-spotlight-2" />
        <div className="wwe-spotlight wwe-spotlight-3" />
      </div>
      <div className="wwe-hero-grid" />

      <div className="wwe-hero-top">
        <div className="wwe-hero-eyebrow">
          <span className="wwe-live-dot" />
          KOMPLEXÁCI · WRESTLING COLLECTION
        </div>
        <div className="wwe-hero-meta-line">EST. 1987 — PRESENT</div>
      </div>

      <div className="wwe-hero-main">
        <div className="wwe-hero-presents">A LEGENDARY COLLECTION OF</div>
        <h1 className="wwe-hero-title">
          <span className="wwe-hero-title-line line-1">WWE</span>
          <span className="wwe-hero-title-line line-2">GAMES</span>
        </h1>
        <div className="wwe-hero-tagline">— LIVE ON PAY-PER-VIEW SINCE 1987 —</div>
      </div>

      <div className="wwe-hero-bottom">
        <div className="wwe-hero-stats">
          <div className="wwe-hero-stat">
            <span className="wwe-stat-num">{totalGames}</span>
            <span className="wwe-stat-lbl">TITLES</span>
          </div>
          <div className="wwe-hero-divider-v" />
          <div className="wwe-hero-stat">
            <span className="wwe-stat-num">{erasCount}</span>
            <span className="wwe-stat-lbl">ERAS</span>
          </div>
          <div className="wwe-hero-divider-v" />
          <div className="wwe-hero-stat">
            <span className="wwe-stat-num">{yearsActive}</span>
            <span className="wwe-stat-lbl">YEARS</span>
          </div>
        </div>

        <button type="button" className="wwe-hero-cta" onClick={onStart}>
          <span>RING THE BELL</span>
          <span className="wwe-hero-cta-arrow">↓</span>
        </button>
      </div>

      <div className="wwe-hero-corner wwe-hero-corner-tl">◤</div>
      <div className="wwe-hero-corner wwe-hero-corner-tr">◥</div>
      <div className="wwe-hero-corner wwe-hero-corner-bl">◣</div>
      <div className="wwe-hero-corner wwe-hero-corner-br">◢</div>
    </section>
  );
}
