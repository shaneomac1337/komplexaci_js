'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthButton } from '@/components/AuthButton';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSubmenuOpen, setIsMobileSubmenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [sectionTheme, setSectionTheme] = useState('cyan');
  const headerRef = useRef<HTMLElement>(null);
  const lastActiveSectionRef = useRef<string>(''); // Track last section to prevent unnecessary updates
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Reset submenu when closing main menu
    if (isMobileMenuOpen) {
      setIsMobileSubmenuOpen(false);
    }
  };

  const toggleMobileSubmenu = () => {
    setIsMobileSubmenuOpen(!isMobileSubmenuOpen);
  };

  // Map sections to their theme colors
  const sectionColorMap: Record<string, string> = {
    'hero': 'cyan',
    'o-nas': 'magenta',
    'clenove': 'magenta',
    'hry': 'orange',
    'discord': 'purple',
    'kontakt': 'purple'
  };

  // Scroll effect for header with throttling
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const scrollTop = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(scrollTop > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy functionality - only on main page
  useEffect(() => {
    if (pathname !== '/') return;

    // Disable scroll spy on mobile for better performance
    if (window.innerWidth <= 768) return;

    const sections = ['hero', 'o-nas', 'clenove', 'hry', 'discord', 'kontakt'];
    let currentIntersecting: { id: string; ratio: number }[] = [];
    
    // Reduced threshold granularity for better performance
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: [0.1, 0.5] // Reduced from 5 thresholds to 2 for performance
    };

    // Special observer for the last section (kontakt) with different margins
    const lastSectionObserverOptions = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: [0.1, 0.3] // Reduced thresholds for performance
    };

    const observer = new IntersectionObserver((entries) => {
      // Update the list of currently intersecting sections
      entries.forEach((entry) => {
        const sectionId = entry.target.id;
        const existingIndex = currentIntersecting.findIndex(item => item.id === sectionId);
        
        if (entry.isIntersecting) {
          // Add or update the intersecting section
          if (existingIndex >= 0) {
            currentIntersecting[existingIndex].ratio = entry.intersectionRatio;
          } else {
            currentIntersecting.push({ id: sectionId, ratio: entry.intersectionRatio });
          }
        } else {
          // Remove the section if it's no longer intersecting
          if (existingIndex >= 0) {
            currentIntersecting.splice(existingIndex, 1);
          }
        }
      });

      // Find the section with the highest intersection ratio
      if (currentIntersecting.length > 0) {
        const mostVisible = currentIntersecting.reduce((prev, current) =>
          current.ratio > prev.ratio ? current : prev
        );

        // Only update state if the section actually changed (prevents unnecessary re-renders)
        if (mostVisible.id !== lastActiveSectionRef.current) {
          lastActiveSectionRef.current = mostVisible.id;
          setActiveSection(mostVisible.id);

          // Update section theme based on active section
          const newTheme = sectionColorMap[mostVisible.id] || 'cyan';
          setSectionTheme(newTheme);
        }
      }
    }, observerOptions);

    // Special observer for the last section
    const lastSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id === 'kontakt') {
          // For the last section, also check if we're near the bottom of the page
          const scrollPosition = window.scrollY + window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const isNearBottom = scrollPosition >= documentHeight - 100;

          if ((isNearBottom || entry.intersectionRatio > 0.1) && lastActiveSectionRef.current !== 'kontakt') {
            lastActiveSectionRef.current = 'kontakt';
            setActiveSection('kontakt');
            setSectionTheme('purple');
          }
        }
      });
    }, lastSectionObserverOptions);

    // Observe all sections except the last one with regular observer
    sections.slice(0, -1).forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    // Observe the last section with special observer
    const lastSection = document.getElementById('kontakt');
    if (lastSection) {
      lastSectionObserver.observe(lastSection);
      // Also observe with regular observer for consistency
      observer.observe(lastSection);
    }

    return () => {
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          observer.unobserve(element);
          if (sectionId === 'kontakt') {
            lastSectionObserver.unobserve(element);
          }
        }
      });
      currentIntersecting = [];
    };
  }, [pathname]);

  const isActive = (sectionId: string) => {
    if (pathname !== '/') return false;
    return activeSection === sectionId;
  };

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (pathname === '/') {
      // Smooth scroll to section on same page
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  const handleHomeNavigation = (sectionId: string = 'hero') => {
    setIsMobileMenuOpen(false);
    if (pathname === '/') {
      // Already on homepage, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    } else {
      // Navigate to homepage, then scroll to section after a brief delay
      window.location.href = '/';
      // Note: We use window.location.href instead of router.push to ensure clean navigation
      // The scroll will happen when the homepage loads
    }
  };

  // Ripple effect removed - was causing visual bugs

  return (
    <header
      ref={headerRef}
      className={`header ${isScrolled ? 'scrolled' : ''} gradient-morph-header`}
      data-theme={sectionTheme}
    >
      <div className="container">
        <div className="logo">
          <div className="logo-text">Komplexáci</div>
        </div>
        <nav className="main-nav">
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
          <ul className={`nav-list ${isMobileMenuOpen ? 'active' : ''}`}>
            <li className="mobile-menu-header">
              <button
                className="mobile-menu-close"
                onClick={toggleMobileMenu}
                aria-label="Close mobile menu"
              >
                <i className="fas fa-times"></i>
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${isActive('hero') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleHomeNavigation('hero');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Domů
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${isActive('o-nas') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleHomeNavigation('o-nas');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                O nás
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${isActive('clenove') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleHomeNavigation('clenove');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Členové
              </button>
            </li>
            <li className={`has-submenu ${isMobileSubmenuOpen ? 'mobile-submenu-open' : ''}`}>
              <button
                className={`nav-link ${isActive('hry') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  // On mobile, toggle submenu instead of navigating
                  if (window.innerWidth <= 768) {
                    toggleMobileSubmenu();
                  } else {
                    handleHomeNavigation('hry');
                  }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span>Hry</span>
                <i className={`fas fa-chevron-down submenu-arrow ${isMobileSubmenuOpen ? 'rotated' : ''}`}></i>
              </button>
              <ul className="submenu">
                <li><Link href="/league-of-legends" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>League of Legends</Link></li>
                <li><Link href="/cs2" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>CS2</Link></li>
                <li><Link href="/wwe-games" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>WWE Games</Link></li>
              </ul>
            </li>
            <li>
              <button
                className={`nav-link ${isActive('discord') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleHomeNavigation('discord');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Discord
              </button>
            </li>
            <li>
              <Link 
                href="/videotvorba" 
                className={`nav-link ${pathname === '/videotvorba' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🎬 Videotvorba
              </Link>
            </li>
            <li>
              <button
                className={`nav-link ${isActive('kontakt') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleHomeNavigation('kontakt');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Kontakt
              </button>
            </li>
          </ul>
        </nav>

        {/* Auth Button */}
        <div className="auth-section">
          <AuthButton />
        </div>
      </div>
    </header>
  );
};

export default Header;