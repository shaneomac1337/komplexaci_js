"use client";

import styles from '../summoner.module.css';
import { RankDisplayProps } from '../types/summoner-ui';

export default function RankDisplay({ rankedStats }: RankDisplayProps) {
  // Get rank display information
  const getRankInfo = (tier: string, rank: string) => {
    const tierColors: Record<string, string> = {
      'IRON': '#8B4513',
      'BRONZE': '#CD7F32',
      'SILVER': '#C0C0C0',
      'GOLD': '#FFD700',
      'PLATINUM': '#00CED1',
      'EMERALD': '#50C878',
      'DIAMOND': '#B9F2FF',
      'MASTER': '#9932CC',
      'GRANDMASTER': '#FF6347',
      'CHALLENGER': '#F0E68C'
    };

    const tierNames: Record<string, string> = {
      'IRON': 'Železo',
      'BRONZE': 'Bronz',
      'SILVER': 'Stříbro',
      'GOLD': 'Zlato',
      'PLATINUM': 'Platina',
      'EMERALD': 'Smaragd',
      'DIAMOND': 'Diamant',
      'MASTER': 'Mistr',
      'GRANDMASTER': 'Velmistr',
      'CHALLENGER': 'Challenger'
    };

    const rankNumbers: Record<string, string> = {
      'I': 'I',
      'II': 'II',
      'III': 'III',
      'IV': 'IV'
    };

    return {
      color: tierColors[tier] || '#C0C0C0',
      name: tierNames[tier] || tier,
      rank: rankNumbers[rank] || rank
    };
  };

  // Get queue type display name
  const getQueueName = (queueType: string) => {
    const queueNames: Record<string, string> = {
      'RANKED_SOLO_5x5': 'Ranked Solo/Duo',
      'RANKED_FLEX_SR': 'Ranked Flex 5v5',
      'RANKED_FLEX_TT': 'Ranked Flex 3v3'
    };
    
    return queueNames[queueType] || queueType;
  };

  // Calculate win rate
  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  // Get win rate color class
  const getWinRateClass = (winRate: number) => {
    if (winRate >= 60) return 'positive';
    if (winRate <= 45) return 'negative';
    return '';
  };

  if (!rankedStats || rankedStats.length === 0) {
    return (
      <div className={styles.rankSection}>
        <div className={styles.rankCard}>
          <div className={styles.rankTitle}>Ranked Solo/Duo</div>
          <div className={styles.rankTier} style={{ color: '#666' }}>
            Unranked
          </div>
          <p style={{ color: '#c9aa71', fontSize: '0.9rem' }}>
            Žádné rankované zápasy v této sezóně
          </p>
        </div>
        <div className={styles.rankCard}>
          <div className={styles.rankTitle}>Ranked Flex 5v5</div>
          <div className={styles.rankTier} style={{ color: '#666' }}>
            Unranked
          </div>
          <p style={{ color: '#c9aa71', fontSize: '0.9rem' }}>
            Žádné rankované zápasy v této sezóně
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.rankSection}>
      {rankedStats.map((rank, index) => {
        const rankInfo = getRankInfo(rank.tier, rank.rank);
        const winRate = calculateWinRate(rank.wins, rank.losses);
        const winRateClass = getWinRateClass(winRate);

        return (
          <div key={index} className={styles.rankCard}>
            <div className={styles.rankTitle}>
              {getQueueName(rank.queueType)}
            </div>
            
            <div 
              className={styles.rankTier}
              style={{ color: rankInfo.color }}
            >
              {rankInfo.name} {rankInfo.rank}
            </div>
            
            <div className={styles.rankLP}>
              {rank.leaguePoints} LP
            </div>

            {/* Hot Streak Badge */}
            {rank.hotStreak && (
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: '600',
                margin: '0.5rem auto',
                display: 'inline-block'
              }}>
                🔥 Hot Streak
              </div>
            )}

            {/* Veteran Badge */}
            {rank.veteran && (
              <div style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: '600',
                margin: '0.5rem auto',
                display: 'inline-block'
              }}>
                ⭐ Veteran
              </div>
            )}

            <div className={styles.rankStats}>
              <span>{rank.wins}W {rank.losses}L</span>
              <span className={`${styles.winRate} ${styles[winRateClass]}`}>
                {winRate}% WR
              </span>
            </div>

            {/* Mini Series Progress */}
            {rank.miniSeries && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ 
                  color: '#c9aa71', 
                  fontSize: '0.8rem', 
                  marginBottom: '0.25rem' 
                }}>
                  Promotion Series:
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '2px', 
                  justifyContent: 'center' 
                }}>
                  {rank.miniSeries.progress.split('').map((result, i) => (
                    <div
                      key={i}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 
                          result === 'W' ? '#10b981' : 
                          result === 'L' ? '#ef4444' : 
                          '#374151'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
