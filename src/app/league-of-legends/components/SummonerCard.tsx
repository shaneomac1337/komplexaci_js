"use client";

import Image from 'next/image';
import styles from '../summoner.module.css';
import { SummonerCardProps } from '../types/summoner-ui';

export default function SummonerCard({ profile, onRefresh, isRefreshing }: SummonerCardProps) {
  const { account, summoner, isInGame, currentGame } = profile;

  // Get profile icon URL
  const getProfileIconUrl = (iconId: number) => {
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/profileicon/${iconId}.png`;
  };

  // Format last played time
  const formatLastPlayed = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Před chvílí';
    } else if (diffInHours < 24) {
      return `Před ${diffInHours} hodinami`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Před ${diffInDays} dny`;
    }
  };

  // Get game mode display name
  const getGameModeDisplay = (gameMode: string, queueId: number) => {
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo/Duo',
      440: 'Ranked Flex',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind',
      700: 'Clash',
      1700: 'Arena',
      1900: 'URF'
    };
    
    return queueMap[queueId] || gameMode;
  };

  return (
    <div className={styles.summonerHeader}>
      <Image
        src={getProfileIconUrl(summoner.profileIconId)}
        alt="Profile Icon"
        width={100}
        height={100}
        className={styles.summonerIcon}
      />
      
      <div className={styles.summonerInfo}>
        <h2>
          {account.gameName}
          <span style={{ color: '#c9aa71', fontWeight: 'normal' }}>
            #{account.tagLine}
          </span>
        </h2>
        <p className={styles.summonerLevel}>
          Level {summoner.summonerLevel}
        </p>
        <p style={{ color: '#c9aa71', fontSize: '0.9rem', margin: '0.5rem 0' }}>
          Naposledy aktivní: {formatLastPlayed(summoner.revisionDate)}
        </p>
        
        {/* Live Game Badge */}
        {isInGame && currentGame && (
          <div className={styles.liveGameBadge}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%',
              display: 'inline-block'
            }}></span>
            Ve hře - {getGameModeDisplay(currentGame.gameMode, currentGame.gameQueueConfigId)}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            background: 'rgba(110, 79, 246, 0.2)',
            border: '1px solid rgba(110, 79, 246, 0.5)',
            borderRadius: '8px',
            color: '#f0e6d2',
            padding: '0.5rem 1rem',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: isRefreshing ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.borderColor = '#6e4ff6';
              e.currentTarget.style.background = 'rgba(110, 79, 246, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.borderColor = 'rgba(110, 79, 246, 0.5)';
              e.currentTarget.style.background = 'rgba(110, 79, 246, 0.2)';
            }
          }}
        >
          {isRefreshing ? (
            <>
              <span style={{ 
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '2px solid rgba(240, 230, 210, 0.3)',
                borderTop: '2px solid #f0e6d2',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '0.5rem'
              }}></span>
              Aktualizuji...
            </>
          ) : (
            <>
              🔄 Aktualizovat
            </>
          )}
        </button>
      </div>
    </div>
  );
}
