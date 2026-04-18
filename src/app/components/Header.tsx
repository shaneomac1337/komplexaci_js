'use client';

import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthButton } from '@/components/AuthButton';

type NavItem = {
  id: string;
  label: string;
  children?: { href: string; label: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { id: 'hero', label: 'Domů' },
  { id: 'o-nas', label: 'O nás' },
  { id: 'clenove', label: 'Členové' },
  {
    id: 'hry',
    label: 'Hry',
    children: [
      { href: '/league-of-legends', label: 'League of Legends' },
      { href: '/cs2', label: 'CS2' },
      { href: '/wwe-games', label: 'WWE Games' },
    ],
  },
  { id: 'discord', label: 'Discord' },
  { id: 'kontakt', label: 'Kontakt' },
];

const SECTION_COLOR_MAP: Record<string, string> = {
  'hero': 'var(--synthwave-cyan)',
  'o-nas': 'var(--synthwave-magenta)',
  'clenove': 'var(--synthwave-magenta)',
  'hry': 'var(--synthwave-orange)',
  'discord': 'var(--synthwave-purple)',
  'kontakt': 'var(--synthwave-purple)',
};

const Header = () => {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState('hero');
  const [indicator, setIndicator] = useState({ x: 0, w: 0, show: false });
  const [submenuOpen, setSubmenuOpen] = useState(false);
  // Sub-pages have no #hero to float over, so dock immediately there.
  const [isDocked, setIsDocked] = useState(() => pathname !== '/');
  const itemsRef = useRef<HTMLDivElement>(null);
  const hrySubmenuCloseTimer = useRef<number | null>(null);
  const lastActiveSectionRef = useRef<string>('');

  const accent = SECTION_COLOR_MAP[activeSection] || 'var(--synthwave-cyan)';

  const updateIndicator = useCallback(() => {
    const wrap = itemsRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector<HTMLElement>(`[data-id="${activeSection}"]`);
    if (!btn) {
      setIndicator((i) => ({ ...i, show: false }));
      return;
    }
    // Use getBoundingClientRect so the offset is correct even when the button
    // is nested inside a positioned wrapper (e.g. the Hry dropdown wrap).
    const wrapRect = wrap.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      x: btnRect.left - wrapRect.left + wrap.scrollLeft,
      w: btnRect.width,
      show: true,
    });
  }, [activeSection]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const wrap = itemsRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(wrap);
    window.addEventListener('resize', updateIndicator);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  useEffect(() => {
    // Anchor the dock trigger on the hero headline — the first piece of text
    // the nav would actually obscure. While the headline is fully below the
    // reserved 64px band, stay floating. The moment it crosses up into the
    // band, dock.
    const headline =
      document.querySelector<HTMLElement>('.hero-redesign .hero-headline') ||
      document.querySelector<HTMLElement>('.hero-headline');
    if (!headline) {
      // No headline on this page (sub-pages) — keep the bar docked.
      setIsDocked(true);
      return;
    }
    // rootMargin shrinks the top of the root viewport by 64px; threshold: 1
    // means "fully contained inside the observable area". Fires intersecting
    // = false the instant any part of the headline slips above the band.
    const obs = new IntersectionObserver(
      ([entry]) => setIsDocked(!entry.isIntersecting),
      { root: null, rootMargin: '-64px 0px 0px 0px', threshold: 1 }
    );
    obs.observe(headline);
    return () => obs.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setActiveSection('hero');
      return;
    }

    const sections = NAV_ITEMS.map((n) => n.id);
    let currentIntersecting: { id: string; ratio: number }[] = [];

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: [0.1, 0.5],
    };

    const lastSectionObserverOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: [0.1, 0.3],
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.id;
        const existingIndex = currentIntersecting.findIndex((item) => item.id === sectionId);
        if (entry.isIntersecting) {
          if (existingIndex >= 0) {
            currentIntersecting[existingIndex].ratio = entry.intersectionRatio;
          } else {
            currentIntersecting.push({ id: sectionId, ratio: entry.intersectionRatio });
          }
        } else if (existingIndex >= 0) {
          currentIntersecting.splice(existingIndex, 1);
        }
      });

      if (currentIntersecting.length > 0) {
        const mostVisible = currentIntersecting.reduce((prev, current) =>
          current.ratio > prev.ratio ? current : prev
        );
        if (mostVisible.id !== lastActiveSectionRef.current) {
          lastActiveSectionRef.current = mostVisible.id;
          setActiveSection(mostVisible.id);
        }
      }
    }, observerOptions);

    const lastSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id === 'kontakt') {
          const scrollPosition = window.scrollY + window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const isNearBottom = scrollPosition >= documentHeight - 100;
          if ((isNearBottom || entry.intersectionRatio > 0.1) && lastActiveSectionRef.current !== 'kontakt') {
            lastActiveSectionRef.current = 'kontakt';
            setActiveSection('kontakt');
          }
        }
      });
    }, lastSectionObserverOptions);

    sections.slice(0, -1).forEach((sectionId) => {
      const el = document.getElementById(sectionId);
      if (el) observer.observe(el);
    });
    const lastSection = document.getElementById('kontakt');
    if (lastSection) {
      lastSectionObserver.observe(lastSection);
      observer.observe(lastSection);
    }

    return () => {
      sections.forEach((sectionId) => {
        const el = document.getElementById(sectionId);
        if (el) {
          observer.unobserve(el);
          if (sectionId === 'kontakt') lastSectionObserver.unobserve(el);
        }
      });
      currentIntersecting = [];
    };
  }, [pathname]);

  const navigateToSection = (sectionId: string) => {
    setSubmenuOpen(false);
    if (pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  const isActive = (id: string) => pathname === '/' && activeSection === id;

  const openSubmenu = () => {
    if (hrySubmenuCloseTimer.current) {
      window.clearTimeout(hrySubmenuCloseTimer.current);
      hrySubmenuCloseTimer.current = null;
    }
    setSubmenuOpen(true);
  };
  const scheduleSubmenuClose = () => {
    if (hrySubmenuCloseTimer.current) window.clearTimeout(hrySubmenuCloseTimer.current);
    hrySubmenuCloseTimer.current = window.setTimeout(() => setSubmenuOpen(false), 160);
  };

  const navStyle: CSSProperties = { '--pill-accent': accent } as CSSProperties;
  const navClasses = [
    'pill-nav',
    isDocked ? 'is-docked' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
    <nav
      className={navClasses}
      style={navStyle}
      aria-label="Main navigation"
    >
      <button
        type="button"
        className="pill-nav-brand"
        onClick={() => navigateToSection('hero')}
      >
        KOMPLEXÁCI
      </button>

      <div className="pill-nav-items" ref={itemsRef}>
        <span
          className="pill-nav-indicator"
          style={{
            transform: `translateX(${indicator.x}px)`,
            width: indicator.w,
            opacity: indicator.show ? 1 : 0,
          }}
          aria-hidden="true"
        />
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            return (
              <div
                key={item.id}
                className={`pill-nav-item-wrap ${submenuOpen ? 'submenu-open' : ''}`}
                onMouseEnter={openSubmenu}
                onMouseLeave={scheduleSubmenuClose}
              >
                <button
                  type="button"
                  data-id={item.id}
                  className={`pill-nav-item has-submenu ${isActive(item.id) ? 'on' : ''}`}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                      setSubmenuOpen((v) => !v);
                    } else {
                      navigateToSection(item.id);
                    }
                  }}
                  aria-haspopup="menu"
                  aria-expanded={submenuOpen}
                >
                  <span>{item.label}</span>
                  <svg
                    className={`pill-nav-caret ${submenuOpen ? 'rotated' : ''}`}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    aria-hidden="true"
                  >
                    <path d="M2 3.5 L5 6.5 L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="pill-nav-submenu" role="menu">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="pill-nav-submenu-item"
                      role="menuitem"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSubmenuOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <button
              key={item.id}
              type="button"
              data-id={item.id}
              className={`pill-nav-item ${isActive(item.id) ? 'on' : ''}`}
              onClick={() => navigateToSection(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <span className="pill-nav-divider" aria-hidden="true" />

      <AuthButton variant="pill" />
    </nav>
    <div className="pill-nav-spacer" aria-hidden="true" />
    </>
  );
};

export default Header;
