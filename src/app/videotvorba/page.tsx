"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import '../komplexaci.css';
import './videotvorba.css';

type Video = {
  id: string;
  title: string;
  description: string;
  views?: string;
  featured?: boolean;
  platform?: string;
};

type CategoryKey = 'all' | 'latest' | 'retro' | 'gaming';

const VIDEO_CATEGORIES: Record<Exclude<CategoryKey, 'all'>, { label: string; videos: Video[] }> = {
  latest: {
    label: 'Nejnovější',
    videos: [
      {
        id: '5CnFK-7bRQc',
        title: 'Best way to play Retro Wrestling Games on Windows',
        description: 'Návod jak hrát retro wrestlingové hry na Windows',
        views: '118',
        featured: true,
      },
    ],
  },
  retro: {
    label: 'Retro Gaming',
    videos: [
      {
        id: '5UwzVCNvFvE',
        title: 'WWF Smackdown! Just Bring It - Royal Rumble',
        description: 'Retro wrestling gameplay v 1440p — epický Royal Rumble match',
        platform: 'PS2',
      },
      {
        id: 'C4oJaAkDE4U',
        title: 'WWF Smackdown! 2 Know Your Role - Royal Rumble',
        description: 'PSX retro klasika s 3.2K views — Royal Rumble v 1440p',
        platform: 'PSX',
      },
    ],
  },
  gaming: {
    label: 'Modern Gaming',
    videos: [
      {
        id: 'i3KL5t-EXPw',
        title: 'Komplexáci Gaming Intro (2025)',
        description: 'Nové intro našeho herního klanu pro rok 2025',
      },
      {
        id: 'danDl9fUwAM',
        title: 'Trackmania Epic Battle',
        description: 'Napínavé závodní souboje v Trackmania',
      },
      {
        id: '2l-ZlM1rixM',
        title: 'KompG - Rocket League 2023',
        description: 'Rocket League highlights našeho klanu v 1440p',
      },
      {
        id: 'yQCLwKLRGWg',
        title: 'KompG - U.R.F Montage',
        description: 'League of Legends montáž s nejlepšími momenty',
      },
    ],
  },
};

const CATEGORY_FILTERS: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'All Channels' },
  { key: 'latest', label: 'Nejnovější' },
  { key: 'retro', label: 'Retro' },
  { key: 'gaming', label: 'Modern' },
];

const CATEGORY_TAG_LABEL: Record<Exclude<CategoryKey, 'all'>, string> = {
  latest: 'LATEST',
  retro: 'RETRO',
  gaming: 'MODERN',
};

const TAGS = ['Gaming', 'League of Legends', 'CS2', 'WWE Games', 'Retro', 'Komplexáci'];

const allVideosWithCategory = (
  Object.entries(VIDEO_CATEGORIES) as [Exclude<CategoryKey, 'all'>, typeof VIDEO_CATEGORIES['retro']][]
).flatMap(([key, cat]) =>
  cat.videos.map((v) => ({ ...v, category: key }))
);

const featuredVideo = VIDEO_CATEGORIES.latest.videos[0];

/** Live HH:MM:SS readout for the broadcast status bar. */
function useClock() {
  const [time, setTime] = useState<string>('');
  useEffect(() => {
    const fmt = (d: Date) =>
      [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
    setTime(fmt(new Date()));
    const id = window.setInterval(() => setTime(fmt(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

export default function VideotvorbaPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const rootRef = useRef<HTMLDivElement>(null);
  const time = useClock();

  const filteredVideos = useMemo(() => {
    const list = activeCategory === 'all'
      ? allVideosWithCategory
      : allVideosWithCategory.filter((v) => v.category === activeCategory);
    return list.filter((v) => !v.featured);
  }, [activeCategory]);

  // One IntersectionObserver for every .vt-reveal — adds `is-in` once.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('.vt-reveal'));
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filteredVideos.length, activeCategory]);

  return (
    <div ref={rootRef} className="videotvorba-page">
      <Header />

      {/* ============ BROADCAST STATUS BAR ============ */}
      <div className="vt-status" role="status" aria-label="Broadcast status">
        <div className="vt-status-left">
          <span className="vt-status-rec">
            <span className="vt-rec-dot" aria-hidden /> REC
          </span>
          <span className="vt-status-mono hide-sm">CH 01 · KOMPG TV</span>
          <span className="vt-status-mono">FREQ 89.2</span>
        </div>
        <div className="vt-status-right">
          <span className="vt-status-mono hide-sm">SIGNAL</span>
          <span className="vt-status-sig" aria-hidden>
            <span /><span /><span /><span />
          </span>
          <span className="vt-status-mono">{time || '--:--:--'}</span>
        </div>
      </div>

      <main>
        {/* ============ HERO ============ */}
        <section className="vt-hero">
          <div className="vt-hero-content">
            <div className="vt-channel vt-reveal" style={{ animationDelay: '60ms' }}>
              KOMPG · TV · CH 01
              <span className="vt-on-air">
                <span className="vt-rec-dot-sm" aria-hidden /> ON AIR
              </span>
            </div>

            <h1 className="vt-hero-headline vt-reveal" style={{ animationDelay: '140ms' }}>
              VIDEO<span className="vt-tv">TVORBA</span>
            </h1>

            <p className="vt-hero-subtitle vt-reveal" style={{ animationDelay: '220ms' }}>
              ▌ TUNED IN SINCE 2016
            </p>

            <p className="vt-hero-desc vt-reveal" style={{ animationDelay: '300ms' }}>
              Český YouTube kanál Komplexáků. Herní obsah, vtipné momenty a nostalgické vzpomínky —
              od League of Legends a CS přes Trackmanii až po retro wrestling.
            </p>

            <div className="vt-cta-row vt-reveal" style={{ animationDelay: '380ms' }}>
              <a
                className="vt-btn-primary"
                href="https://www.youtube.com/@MartinPenkava1337?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe ▸
              </a>
              <a
                className="vt-btn-ghost"
                href="https://www.youtube.com/@MartinPenkava1337/videos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Browse archive
              </a>
            </div>
          </div>
        </section>

        {/* ============ FEATURED — TAPE DECK ============ */}
        <section className="vt-section">
          <div className="vt-container">
            <header className="vt-section-head">
              <span className="vt-eyebrow">PLAYBACK · TAPE 01</span>
              <h2 className="vt-section-title">Aktuálně se přehrává</h2>
              <p className="vt-section-subtitle">Náš nejčerstvější obsah na kanálu</p>
            </header>

            <article className="vt-deck vt-reveal">
              <div className="vt-deck-spine">
                <span><span className="vt-deck-spine-id">№ 01</span> · TAPE-LATEST · KOMPG-TV</span>
                <span className="vt-bars" aria-hidden />
                <span>RUNTIME · {featuredVideo.views ?? '—'} VIEWS</span>
              </div>

              <div className="vt-deck-screen">
                <span className="vt-reel left" aria-hidden />
                <span className="vt-reel right" aria-hidden />
                <iframe
                  src={`https://www.youtube.com/embed/${featuredVideo.id}`}
                  title={featuredVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="vt-console">
                <div className="vt-console-row">
                  <span>Channel</span>
                  <span className="vt-console-val">KOMPG TV / 01</span>
                </div>
                <div className="vt-console-row">
                  <span>Signal</span>
                  <span className="vt-eq" aria-hidden>
                    <span /><span /><span /><span /><span /><span />
                  </span>
                </div>
                <div className="vt-console-row">
                  <span>Tape</span>
                  <span className="vt-console-val">A-SIDE / LATEST DROP</span>
                </div>

                <h3 className="vt-deck-title">{featuredVideo.title}</h3>
                <p className="vt-deck-desc">{featuredVideo.description}</p>

                <div className="vt-deck-actions">
                  <a
                    className="vt-btn-primary"
                    href={`https://youtu.be/${featuredVideo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ▶ Play on YouTube
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ============ STATS — broadcast readout ============ */}
        <section className="vt-section alt">
          <div className="vt-container">
            <div className="vt-readout vt-reveal" role="group" aria-label="Channel readout">
              <div className="vt-readout-cell">
                <span className="vt-readout-key">Tapes Archived</span>
                <span className="vt-readout-val">{allVideosWithCategory.length}+</span>
              </div>
              <div className="vt-readout-cell">
                <span className="vt-readout-key">Channels</span>
                <span className="vt-readout-val">03</span>
              </div>
              <div className="vt-readout-cell">
                <span className="vt-readout-key">Signal Strength</span>
                <span className="vt-readout-bars" aria-hidden>
                  <span /><span /><span /><span /><span />
                </span>
              </div>
              <div className="vt-readout-cell">
                <span className="vt-readout-key">On Air Since</span>
                <span className="vt-readout-val phosphor">2016</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ GALLERY — TAPE COVERS ============ */}
        <section className="vt-section">
          <div className="vt-container">
            <header className="vt-section-head">
              <span className="vt-eyebrow">VIDEOTÉKA · TAPE LIBRARY</span>
              <h2 className="vt-section-title">Archív vysílání</h2>
              <p className="vt-section-subtitle">Vyber kanál a nalaď se</p>
            </header>

            <div className="vt-cat-row" role="tablist" aria-label="Filtr kategorií">
              {CATEGORY_FILTERS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === c.key}
                  className={`vt-cat-pill${activeCategory === c.key ? ' is-active' : ''}`}
                  onClick={() => setActiveCategory(c.key)}
                >
                  <span className="vt-led" aria-hidden />
                  {c.label}
                </button>
              ))}
            </div>

            {filteredVideos.length > 0 ? (
              <div className="vt-grid">
                {filteredVideos.map((video, i) => {
                  const num = String(i + 2).padStart(2, '0');
                  const tag = CATEGORY_TAG_LABEL[video.category as Exclude<CategoryKey, 'all'>];
                  return (
                    <article
                      key={video.id}
                      className="vt-tape vt-reveal"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div className="vt-tape-spine">
                        <span><span className="vt-tape-no">№ {num}</span> · <span className="vt-tape-cat">{tag}</span></span>
                        {video.platform && <span className="vt-tape-platform">{video.platform}</span>}
                      </div>
                      <div className="vt-tape-screen">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.id}`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                      <div className="vt-tape-body">
                        <h3 className="vt-tape-title">{video.title}</h3>
                        <p className="vt-tape-desc">{video.description}</p>
                      </div>
                      <div className="vt-tape-foot">
                        <span className="vt-barcode" aria-hidden />
                        <a
                          className="vt-link"
                          href={`https://youtu.be/${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ▶ Play
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="vt-section-subtitle" style={{ textAlign: 'center' }}>
                V této kategorii zatím nejsou žádné záznamy.
              </p>
            )}
          </div>
        </section>

        {/* ============ ABOUT ============ */}
        <section className="vt-section alt">
          <div className="vt-container">
            <div className="vt-about-grid">
              <div className="vt-reveal">
                <span className="vt-eyebrow">CHANNEL INFO</span>
                <h2 className="vt-section-title" style={{ textAlign: 'left' }}>O kanálu</h2>
                <p className="vt-about-copy">
                  Vítej na YouTube kanálu Komplexáců. Najdeš tu herní obsah, vtipné momenty z našich
                  her, retro gaming vzpomínky a mnoho dalšího — od League of Legends přes
                  Counter Strike až po wrestlingové hry. Všechno, co se týká našeho klanu.
                </p>
              </div>

              <div className="vt-tags-grid vt-reveal" style={{ animationDelay: '120ms' }} aria-label="Žánry">
                {TAGS.map((t) => (
                  <span key={t} className="vt-chip">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA — TUNE IN ============ */}
        <section className="vt-tune">
          <div className="vt-tune-inner">
            <h2 className="vt-tune-title vt-reveal">
              TUNE <span className="vt-slash">//</span> IN
            </h2>
            <p className="vt-tune-desc vt-reveal" style={{ animationDelay: '120ms' }}>
              Odebírej náš kanál a zapni zvoneček, ať ti neunikne žádné nové vysílání.
            </p>

            <div className="vt-dial vt-reveal" aria-hidden style={{ animationDelay: '200ms' }}>
              <span className="vt-dial-freq">FM 89.2 · KOMPG TV</span>
              <div className="vt-dial-ticks" />
              <span className="vt-dial-needle" />
            </div>

            <div className="vt-cta-row vt-reveal" style={{ animationDelay: '260ms', justifyContent: 'center', display: 'flex' }}>
              <a
                className="vt-btn-primary"
                href="https://www.youtube.com/@MartinPenkava1337?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe ▸
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="vt-footer">
        <div className="vt-footer-inner">
          <Image
            src="https://cdn.komplexaci.cz/komplexaci/img/logo.png"
            alt="Komplexáci"
            width={72}
            height={72}
            unoptimized
            className="vt-footer-logo"
            style={{ height: 'auto', width: '72px' }}
          />
          <p className="vt-footer-copy">© 2025 Komplexáci · Všechna práva vyhrazena</p>
          <p className="vt-footer-credit">S láskou vytvořil Martin Pěnkava ⚡ Next.js</p>
          <div className="vt-footer-links">
            <Link href="/">Hlavní stránka</Link>
            <a href="https://www.youtube.com/@MartinPenkava1337" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href="https://discord.gg/e6BEQpQRBA" target="_blank" rel="noopener noreferrer">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
