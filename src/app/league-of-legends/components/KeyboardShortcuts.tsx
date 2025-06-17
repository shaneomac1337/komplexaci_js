"use client";

import { useState, useEffect } from 'react';
import styles from '../summoner.module.css';

export default function KeyboardShortcuts() {
  const [isVisible, setIsVisible] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show/hide keyboard hints with Ctrl+?
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        setShowHints(prev => !prev);
        return;
      }

      // Focus search input with Ctrl+K or /
      if ((event.ctrlKey && event.key === 'k') || event.key === '/') {
        event.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Refresh current page with F5 or Ctrl+R
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        // Let browser handle this naturally
        return;
      }

      // Copy current URL with Ctrl+Shift+C
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        navigator.clipboard.writeText(window.location.href).then(() => {
          showTemporaryMessage('URL zkopírována do schránky!');
        });
        return;
      }

      // Toggle search history with Ctrl+H
      if (event.ctrlKey && event.key === 'h') {
        event.preventDefault();
        const historyButton = document.querySelector('[data-search-history]') as HTMLButtonElement;
        if (historyButton) {
          historyButton.click();
        }
        return;
      }

      // Escape to close modals/dropdowns
      if (event.key === 'Escape') {
        // Close any open dropdowns or modals
        const openDropdowns = document.querySelectorAll('[data-dropdown-open="true"]');
        openDropdowns.forEach(dropdown => {
          (dropdown as HTMLElement).click();
        });
        
        // Blur focused elements
        if (document.activeElement && document.activeElement !== document.body) {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Show hints briefly on first visit
    const hasSeenHints = localStorage.getItem('lol-keyboard-hints-seen');
    if (!hasSeenHints) {
      setTimeout(() => {
        setShowHints(true);
        localStorage.setItem('lol-keyboard-hints-seen', 'true');
        setTimeout(() => setShowHints(false), 5000);
      }, 2000);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showTemporaryMessage = (message: string) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => {
        document.body.removeChild(messageDiv);
      }, 300);
    }, 2000);
  };

  const shortcuts = [
    { key: 'Ctrl + K', description: 'Zaměřit vyhledávání' },
    { key: '/', description: 'Rychlé vyhledávání' },
    { key: 'Ctrl + H', description: 'Historie vyhledávání' },
    { key: 'Ctrl + Shift + C', description: 'Kopírovat URL' },
    { key: 'Ctrl + /', description: 'Zobrazit/skrýt nápovědu' },
    { key: 'Esc', description: 'Zavřít modály' },
    { key: 'F5', description: 'Obnovit stránku' }
  ];

  if (!showHints) {
    return null;
  }

  return (
    <div className={`${styles.keyboardHints} ${showHints ? styles.visible : ''}`}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <strong style={{ color: '#f0e6d2' }}>⌨️ Klávesové zkratky</strong>
        <button
          onClick={() => setShowHints(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: 0,
            lineHeight: 1
          }}
          title="Zavřít"
        >
          ×
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '0.25rem' }}>
        {shortcuts.map((shortcut, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '0.8rem' }}>{shortcut.description}</span>
            <kbd>{shortcut.key}</kbd>
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '0.5rem', 
        paddingTop: '0.5rem', 
        borderTop: '1px solid rgba(110, 79, 246, 0.2)',
        fontSize: '0.7rem',
        color: '#888',
        textAlign: 'center'
      }}>
        Stiskněte <kbd>Ctrl + /</kbd> pro zobrazení/skrytí
      </div>
    </div>
  );
}
