"use client";

import { useState, useEffect } from 'react';
import styles from '../summoner.module.css';

interface EnhancedLoadingProps {
  message?: string;
  submessage?: string;
  progress?: number;
  showProgress?: boolean;
}

export default function EnhancedLoading({ 
  message = "Načítám data...", 
  submessage,
  progress,
  showProgress = false 
}: EnhancedLoadingProps) {
  const [dots, setDots] = useState('');
  const [currentTip, setCurrentTip] = useState(0);

  const loadingTips = [
    "💡 Tip: Můžete hledat hráče z různých regionů",
    "🎮 Tip: Live game zobrazuje aktuální zápas v reálném čase",
    "📊 Tip: Statistiky ukazují výkon za posledních 10 zápasů",
    "👥 Tip: Sekce 'Často hraje s' ukazuje vaše nejčastější spoluhráče",
    "🏆 Tip: Klikněte na jména hráčů v live game pro jejich profily",
    "📋 Tip: Můžete kopírovat informace o live game do schránky"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.enhancedLoading}>
      {/* Main Loading Animation */}
      <div className={styles.loadingAnimation}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingRipple}>
          <div></div>
          <div></div>
        </div>
      </div>

      {/* Loading Text */}
      <div className={styles.loadingText}>
        <h3 style={{ 
          color: '#f0e6d2', 
          margin: '1rem 0 0.5rem 0',
          fontSize: '1.2rem',
          fontWeight: '600'
        }}>
          {message}{dots}
        </h3>
        
        {submessage && (
          <p style={{ 
            color: '#c9aa71', 
            margin: '0 0 1rem 0',
            fontSize: '0.9rem'
          }}>
            {submessage}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && typeof progress === 'number' && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          <span className={styles.progressText}>
            {Math.round(progress)}%
          </span>
        </div>
      )}

      {/* Loading Tips */}
      <div className={styles.loadingTips}>
        <div 
          key={currentTip}
          className={styles.loadingTip}
          style={{
            animation: 'fadeInOut 3s ease-in-out'
          }}
        >
          {loadingTips[currentTip]}
        </div>
      </div>

      {/* Loading Steps */}
      <div className={styles.loadingSteps}>
        <div className={styles.loadingStep}>
          <div className={`${styles.stepIndicator} ${styles.active}`}>1</div>
          <span>Ověřuji Riot ID</span>
        </div>
        <div className={styles.loadingStep}>
          <div className={`${styles.stepIndicator} ${progress && progress > 25 ? styles.active : ''}`}>2</div>
          <span>Načítám profil</span>
        </div>
        <div className={styles.loadingStep}>
          <div className={`${styles.stepIndicator} ${progress && progress > 50 ? styles.active : ''}`}>3</div>
          <span>Získávám statistiky</span>
        </div>
        <div className={styles.loadingStep}>
          <div className={`${styles.stepIndicator} ${progress && progress > 75 ? styles.active : ''}`}>4</div>
          <span>Načítám zápasy</span>
        </div>
      </div>
    </div>
  );
}
