'use client';

import { useState, useEffect } from 'react';
import styles from './KomplexaciStatus.module.css';
import { championDataService } from '../../api/lol/utils/championUtils';

interface KomplexaciMember {
  name: string;
  riotId: string;
  region: string;
  displayName: string;
}

interface MemberStatus {
  member: KomplexaciMember;
  isInGame: boolean;
  currentGame?: any;
  lastSeen?: string;
  loading: boolean;
  error?: string;
}

const KOMPLEXACI_MEMBERS: KomplexaciMember[] = [
  {
    name: 'Shane',
    riotId: 'Shane McClane#EUNE',
    region: 'eun1',
    displayName: 'Shane McClane'
  },
  {
    name: 'Zander',
    riotId: 'ZanderOconner#EUNE',
    region: 'eun1',
    displayName: 'ZanderOconner'
  },
  {
    name: 'Jugyna',
    riotId: 'Jugyna#EUNE',
    region: 'eun1',
    displayName: 'Jugyna'
  }
];

export default function KomplexaciStatus() {
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [championData, setChampionData] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    // Load champion data
    const loadChampionData = async () => {
      try {
        const champData = await championDataService.getChampionData();
        setChampionData(champData);
      } catch (error) {
        console.error('Failed to load champion data:', error);
      }
    };

    // Initialize member statuses
    setMemberStatuses(
      KOMPLEXACI_MEMBERS.map(member => ({
        member,
        isInGame: false,
        loading: true
      }))
    );

    // Load champion data and check status for each member
    loadChampionData();
    checkAllMembersStatus();

    // Set up periodic refresh every 2 minutes
    const interval = setInterval(checkAllMembersStatus, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const checkAllMembersStatus = async () => {
    setIsLoading(true);

    const statusPromises = KOMPLEXACI_MEMBERS.map(async (member) => {
      try {
        // Check if player exists and get basic info
        const summonerResponse = await fetch(
          `/api/lol/summoner?riotId=${encodeURIComponent(member.riotId)}&region=${member.region}`
        );

        if (!summonerResponse.ok) {
          return {
            member,
            isInGame: false,
            loading: false,
            error: 'Player not found'
          };
        }

        const summonerData = await summonerResponse.json();
        
        // Check live game status
        const liveGameResponse = await fetch(
          `/api/lol/live-game?puuid=${summonerData.account.puuid}&region=${member.region}`
        );

        let isInGame = false;
        let currentGame = null;

        if (liveGameResponse.ok) {
          const liveGameData = await liveGameResponse.json();
          isInGame = liveGameData.inGame;
          currentGame = liveGameData.gameInfo;
        }

        return {
          member,
          isInGame,
          currentGame: currentGame ? {
            ...currentGame,
            playerPuuid: summonerData.account.puuid
          } : undefined,
          loading: false,
          lastSeen: new Date().toISOString()
        };

      } catch (error) {
        console.error(`Error checking status for ${member.name}:`, error);
        return {
          member,
          isInGame: false,
          loading: false,
          error: 'Connection error'
        };
      }
    });

    const statuses = await Promise.all(statusPromises);
    setMemberStatuses(statuses);
    setIsLoading(false);
  };

  const formatGameMode = (gameMode: string) => {
    const modes: { [key: string]: string } = {
      'CLASSIC': 'Summoner\'s Rift',
      'ARAM': 'ARAM',
      'URF': 'URF',
      'ONEFORALL': 'One for All',
      'NEXUSBLITZ': 'Nexus Blitz',
      'TUTORIAL': 'Tutorial',
      'PRACTICETOOL': 'Practice Tool'
    };
    return modes[gameMode] || gameMode;
  };

  const formatGameDuration = (gameStartTime: number) => {
    const now = Date.now();
    const duration = Math.floor((now - gameStartTime) / 1000 / 60);
    return `${duration} min`;
  };

  // Get champion name from champion ID
  const getChampionName = (championId: number) => {
    const champion = championData.get(championId);
    return champion ? champion.name : `Champion ${championId}`;
  };

  // Find the player's participant data in the current game
  const findPlayerInGame = (currentGame: any, memberPuuid: string) => {
    if (!currentGame || !currentGame.participants) return null;
    return currentGame.participants.find((p: any) => p.puuid === memberPuuid);
  };

  return (
    <section className={styles.komplexaciSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>👥</span>
          Paří teď Komplexáci?
        </h2>
        <button 
          onClick={checkAllMembersStatus}
          disabled={isLoading}
          className={styles.refreshButton}
        >
          {isLoading ? '🔄' : '↻'} Obnovit
        </button>
      </div>

      <div className={styles.membersGrid}>
        {memberStatuses.map((status, index) => (
          <div key={index} className={`${styles.memberCard} ${status.isInGame ? styles.inGame : ''}`}>
            <div className={styles.memberHeader}>
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{status.member.displayName}</h3>
                <span className={styles.memberTag}>@{status.member.name}</span>
              </div>
              <div className={`${styles.statusIndicator} ${
                status.loading ? styles.loading :
                status.isInGame ? styles.inGame : styles.offline
              }`}>
                {status.loading ? '⏳' :
                 status.isInGame ? '🎮' : '💤'}
              </div>
            </div>

            <div className={styles.statusText}>
              {status.loading ? (
                <span className={styles.loadingText}>Kontroluji status...</span>
              ) : status.error ? (
                <span className={styles.errorText}>{status.error}</span>
              ) : status.isInGame && status.currentGame ? (
                <div className={styles.gameInfo}>
                  <div className={styles.gameStatus}>
                    <span className={styles.gameMode}>
                      🎯 {formatGameMode(status.currentGame.gameMode)}
                    </span>
                    <span className={styles.gameDuration}>
                      ⏱️ {formatGameDuration(status.currentGame.gameStartTime)}
                    </span>
                  </div>
                  <div className={styles.gameDetails}>
                    <span className={styles.champion}>
                      🏆 {(() => {
                        const playerInGame = findPlayerInGame(status.currentGame, status.currentGame.playerPuuid);
                        return playerInGame ? getChampionName(playerInGame.championId) : 'Neznámý champion';
                      })()}
                    </span>
                  </div>
                </div>
              ) : (
                <span className={styles.offlineText}>💤 Nehraje</span>
              )}
            </div>

            {status.lastSeen && (
              <div className={styles.lastSeen}>
                Naposledy: {new Date(status.lastSeen).toLocaleTimeString('cs-CZ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          🎮 = Hraje právě teď • 💤 = Nehraje • Status se obnovuje každé 2 minuty
        </p>
      </div>
    </section>
  );
}
