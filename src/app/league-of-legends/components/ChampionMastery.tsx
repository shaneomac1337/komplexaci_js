"use client";

import Image from 'next/image';
import styles from '../summoner.module.css';
import { ChampionMasteryProps } from '../types/summoner-ui';

export default function ChampionMastery({ championMastery, maxDisplay = 10 }: ChampionMasteryProps) {
  // Format mastery points with commas
  const formatPoints = (points: number) => {
    return points.toLocaleString('cs-CZ');
  };

  // Get mastery level color
  const getMasteryLevelColor = (level: number) => {
    const colors: Record<number, string> = {
      1: '#8B4513',
      2: '#CD7F32',
      3: '#C0C0C0',
      4: '#FFD700',
      5: '#00CED1',
      6: '#9932CC',
      7: '#FF6347'
    };
    
    return colors[level] || '#C0C0C0';
  };

  // Get mastery level display
  const getMasteryLevelDisplay = (level: number) => {
    if (level >= 5) {
      return `Mastery ${level}`;
    }
    return `Level ${level}`;
  };

  // Get champion image URL
  const getChampionImageUrl = (championId: number) => {
    // This will be replaced with actual champion data from the enriched API response
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Champion${championId}.png`;
  };

  // Format last play time
  const formatLastPlayTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Dnes';
    } else if (diffInDays === 1) {
      return 'Včera';
    } else if (diffInDays < 7) {
      return `Před ${diffInDays} dny`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Před ${weeks} týdny`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `Před ${months} měsíci`;
    }
  };

  if (!championMastery || championMastery.length === 0) {
    return (
      <div className={styles.masterySection}>
        <h3 className={styles.masteryTitle}>Champion Mastery</h3>
        <p style={{ color: '#c9aa71', textAlign: 'center', padding: '2rem' }}>
          Žádná data o champion mastery nejsou k dispozici.
        </p>
      </div>
    );
  }

  const displayedMastery = championMastery.slice(0, maxDisplay);

  return (
    <div className={styles.masterySection}>
      <h3 className={styles.masteryTitle}>
        Champion Mastery 
        <span style={{ 
          fontSize: '1rem', 
          fontWeight: 'normal', 
          color: '#c9aa71',
          marginLeft: '0.5rem'
        }}>
          (Top {displayedMastery.length})
        </span>
      </h3>
      
      <div className={styles.masteryGrid}>
        {displayedMastery.map((mastery, index) => (
          <div key={mastery.championId} className={styles.masteryCard}>
            {/* Rank Badge */}
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              left: '0.5rem',
              background: 'rgba(110, 79, 246, 0.8)',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              #{index + 1}
            </div>

            {/* Champion Image */}
            {mastery.championImage ? (
              <Image
                src={mastery.championImage}
                alt={mastery.championName || `Champion ${mastery.championId}`}
                width={60}
                height={60}
                className={styles.championImage}
              />
            ) : (
              <div 
                className={styles.championImage}
                style={{
                  background: 'rgba(110, 79, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c9aa71',
                  fontSize: '0.8rem'
                }}
              >
                {mastery.championId}
              </div>
            )}

            {/* Champion Name */}
            <div className={styles.championName}>
              {mastery.championName || `Champion ${mastery.championId}`}
            </div>

            {/* Mastery Level */}
            <div 
              className={styles.masteryLevel}
              style={{ color: getMasteryLevelColor(mastery.championLevel) }}
            >
              {getMasteryLevelDisplay(mastery.championLevel)}
            </div>

            {/* Mastery Points */}
            <div className={styles.masteryPoints}>
              {formatPoints(mastery.championPoints)} bodů
            </div>

            {/* Last Played */}
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#888', 
              marginTop: '0.25rem' 
            }}>
              {formatLastPlayTime(mastery.lastPlayTime)}
            </div>

            {/* Progress to Next Level */}
            {mastery.championLevel < 7 && mastery.championPointsUntilNextLevel > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: '#c9aa71', 
                  marginBottom: '0.25rem' 
                }}>
                  Do dalšího levelu:
                </div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '10px',
                  height: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #6e4ff6, #8b5cf6)',
                    height: '100%',
                    width: `${(mastery.championPointsSinceLastLevel / (mastery.championPointsSinceLastLevel + mastery.championPointsUntilNextLevel)) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: '#888', 
                  marginTop: '0.25rem',
                  textAlign: 'center'
                }}>
                  {formatPoints(mastery.championPointsUntilNextLevel)} zbývá
                </div>
              </div>
            )}

            {/* Mastery 7 Badge */}
            {mastery.championLevel === 7 && (
              <div style={{
                background: 'linear-gradient(135deg, #ff6347, #ff4500)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: '600',
                marginTop: '0.5rem'
              }}>
                ⭐ Mastery 7
              </div>
            )}
          </div>
        ))}
      </div>

      {championMastery.length > maxDisplay && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1rem',
          color: '#c9aa71',
          fontSize: '0.9rem'
        }}>
          ... a dalších {championMastery.length - maxDisplay} championů
        </div>
      )}
    </div>
  );
}
