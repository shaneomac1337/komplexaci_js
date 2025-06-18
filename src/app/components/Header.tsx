'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthButton } from '@/components/AuthButton';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSubmenuOpen, setIsMobileSubmenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
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

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy functionality - only on main page
  useEffect(() => {
    if (pathname !== '/') return;

    // Disable scroll spy on mobile for better performance
    if (window.innerWidth <= 768) return;

    const sections = ['hero', 'o-nas', 'clenove', 'hry', 'discord', 'kontakt'];
    let currentIntersecting: { id: string; ratio: number }[] = [];
    
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -20% 0px', // More balanced detection
      threshold: [0, 0.25, 0.5, 0.75, 1.0] // More granular thresholds
    };

    // Special observer for the last section (kontakt) with different margins
    const lastSectionObserverOptions = {
      root: null,
      rootMargin: '-20% 0px -80% 0px', // More lenient bottom margin for last section
      threshold: [0, 0.1, 0.25, 0.5] // Lower thresholds for last section
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
        
        console.log('Active section changed to:', mostVisible.id);
        setActiveSection(mostVisible.id);
      }
    }, observerOptions);

    // Special observer for the last section
    const lastSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id === 'kontakt') {
          // For the last section, also check if we're near the bottom of the page
          const scrollPosition = window.scrollY + window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const isNearBottom = scrollPosition >= documentHeight - 100; // Within 100px of bottom
          
          if (isNearBottom || entry.intersectionRatio > 0.1) {
            console.log('Kontakt section activated (last section logic)');
            setActiveSection('kontakt');
          }
        }
      });
    }, lastSectionObserverOptions);

    // Observe all sections except the last one with regular observer
    sections.slice(0, -1).forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        console.log('Observing section:', sectionId, element);
        observer.observe(element);
      } else {
        console.log('Section not found:', sectionId);
      }
    });

    // Observe the last section with special observer
    const lastSection = document.getElementById('kontakt');
    if (lastSection) {
      console.log('Observing last section with special logic:', 'kontakt');
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

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="logo">
          <h1>Komplexáci</h1>
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