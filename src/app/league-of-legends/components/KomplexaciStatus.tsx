'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './KomplexaciStatus.module.css';
import { championDataService } from '../../api/lol/utils/championUtils';

interface KomplexaciMember {
  name: string;
  riotId: string;
  region: string;
  displayName: string;
  gameName: string;
}

interface MemberStatus {
  member: KomplexaciMember;
  isInGame: boolean;
  currentGame?: any;
  lastSeen?: string;
  lastGameTime?: number;
  lastGameResult?: 'win' | 'loss';
  loading: boolean;
  error?: string;
}

const KOMPLEXACI_MEMBERS: KomplexaciMember[] = [
  {
    name: 'shaneomac',
    riotId: 'Shane McClane#EUNE',
    region: 'eun1',
    displayName: 'shaneomac',
    gameName: 'Shane McClane'
  },
  {
    name: 'Zander',
    riotId: 'ZanderOconner#EUNE',
    region: 'eun1',
    displayName: 'Zander',
    gameName: 'ZanderOconner'
  },
  {
    name: 'Barber',
    riotId: 'Barbers#EUNE',
    region: 'eun1',
    displayName: 'Barber',
    gameName: 'Barbers'
  },
  {
    name: 'Roseck',
    riotId: 'TNKDLBL Roseck#EUNE',
    region: 'eun1',
    displayName: 'Roseck',
    gameName: 'TNKDLBL Roseck'
  },
  {
    name: 'Podri',
    riotId: 'Podri#piwko',
    region: 'eun1',
    displayName: 'Podri',
    gameName: 'Podri'
  },
  {
    name: 'Azarin',
    riotId: 'TheAzarin#EUNE',
    region: 'eun1',
    displayName: 'Azarin',
    gameName: 'TheAzarin'
  },
  {
    name: 'Jugyna',
    riotId: 'Jugyna#EUNE',
    region: 'eun1',
    displayName: 'Jugyna',
    gameName: 'Jugyna'
  },
  {
    name: 'Zdravicko',
    riotId: 'Zdravicko#EUNE',
    region: 'eun1',
    displayName: 'Zdravicko',
    gameName: 'Zdravicko'
  },
  {
    name: 'MartinStrix',
    riotId: 'MartinStrix#EUNE',
    region: 'eun1',
    displayName: 'MartinStrix',
    gameName: 'MartinStrix'
  }
];

// Game Details Modal Component
interface GameDetailsModalProps {
  game: any;
  onClose: () => void;
  championData: Map<number, any>;
  getChampionName: (championId: number) => string;
  getChampionImageUrl: (championId: number) => string;
  getSpellImageUrl: (spellId: number) => string;
  getProfileIconUrl: (iconId: number) => string;
  getGameModeDisplay: (queueId: number) => string;
  getMapName: (mapId: number) => string;
}

function GameDetailsModal({
  game,
  onClose,
  championData,
  getChampionName,
  getChampionImageUrl,
  getSpellImageUrl,
  getProfileIconUrl,
  getGameModeDisplay,
  getMapName
}: GameDetailsModalProps) {
  const [gameTimer, setGameTimer] = useState(0);

  useEffect(() => {
    if (game) {
      // Calculate game duration
      const startTime = game.gameStartTime;
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      setGameTimer(duration);

      // Update timer every second
      const interval = setInterval(() => {
        const newDuration = Math.floor((Date.now() - startTime) / 1000);
        setGameTimer(newDuration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [game]);

  const formatGameDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Separate teams
  const team1 = game.participants?.filter((p: any) => p.teamId === 100) || [];
  const team2 = game.participants?.filter((p: any) => p.teamId === 200) || [];

  // Get bans
  const team1Bans = game.bannedChampions?.filter((ban: any) => ban.teamId === 100) || [];
  const team2Bans = game.bannedChampions?.filter((ban: any) => ban.teamId === 200) || [];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🔴 Live Game - {game.memberName}</h3>
          <button className={styles.modalCloseButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.gameInfoHeader}>
          <div className={styles.gameMode}>{getGameModeDisplay(game.gameQueueConfigId)}</div>
          <div className={styles.mapName}>{getMapName(game.mapId)}</div>
          <div className={styles.gameTimer}>⏱️ {formatGameDuration(gameTimer)}</div>
        </div>

        <div className={styles.teamsContainer}>
          {/* Team 1 (Blue Side) */}
          <div className={`${styles.teamSection} ${styles.blueTeam}`}>
            <h4 className={`${styles.teamTitle} ${styles.blueTeamTitle}`}>🔵 Modrý Tým</h4>

            {team1Bans.length > 0 && (
              <div className={styles.bansSection}>
                <div className={styles.bansTitle}>Zakázaní championové:</div>
                <div className={styles.bansGrid}>
                  {team1Bans.map((ban: any, index: number) => (
                    <div key={index} className={styles.banItem}>
                      <Image
                        src={getChampionImageUrl(ban.championId)}
                        alt={getChampionName(ban.championId)}
                        width={24}
                        height={24}
                        className={styles.banImage}
                        onError={(e) => {
                          e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                        }}
                      />
                      <div className={styles.banOverlay}>✕</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.participantsList}>
              {team1.map((participant: any, index: number) => (
                <div key={index} className={`${styles.participantCard} ${participant.puuid === game.memberPuuid ? styles.highlighted : ''}`}>
                  <Image
                    src={getChampionImageUrl(participant.championId)}
                    alt={getChampionName(participant.championId)}
                    width={32}
                    height={32}
                    className={styles.championImage}
                    onError={(e) => {
                      e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                    }}
                  />
                  <div className={styles.spells}>
                    <Image src={getSpellImageUrl(participant.spell1Id)} alt="Spell 1" width={14} height={14} />
                    <Image src={getSpellImageUrl(participant.spell2Id)} alt="Spell 2" width={14} height={14} />
                  </div>
                  <Image
                    src={getProfileIconUrl(participant.profileIconId)}
                    alt="Profile"
                    width={20}
                    height={20}
                    className={styles.profileIcon}
                  />
                  <div className={styles.participantInfo}>
                    <div className={`${styles.summonerName} ${participant.puuid === game.memberPuuid ? styles.highlighted : ''}`}>
                      <button
                        onClick={() => {
                          const summonerUrl = `/league-of-legends?summoner=${encodeURIComponent(participant.summonerName)}&region=${game.memberRegion}`;
                          window.open(summonerUrl, '_blank');
                        }}
                        className={styles.summonerButton}
                        title={`Klikněte pro zobrazení profilu ${participant.summonerName}`}
                      >
                        {participant.summonerName}
                      </button>
                      {participant.puuid === game.memberPuuid && <span className={styles.memberIndicator}> ●</span>}
                    </div>
                    <div className={styles.championName}>{getChampionName(participant.championId)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 (Red Side) */}
          <div className={`${styles.teamSection} ${styles.redTeam}`}>
            <h4 className={`${styles.teamTitle} ${styles.redTeamTitle}`}>🔴 Červený Tým</h4>

            {team2Bans.length > 0 && (
              <div className={styles.bansSection}>
                <div className={styles.bansTitle}>Zakázaní championové:</div>
                <div className={styles.bansGrid}>
                  {team2Bans.map((ban: any, index: number) => (
                    <div key={index} className={styles.banItem}>
                      <Image
                        src={getChampionImageUrl(ban.championId)}
                        alt={getChampionName(ban.championId)}
                        width={24}
                        height={24}
                        className={styles.banImage}
                        onError={(e) => {
                          e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                        }}
                      />
                      <div className={styles.banOverlay}>✕</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.participantsList}>
              {team2.map((participant: any, index: number) => (
                <div key={index} className={`${styles.participantCard} ${participant.puuid === game.memberPuuid ? styles.highlighted : ''}`}>
                  <Image
                    src={getChampionImageUrl(participant.championId)}
                    alt={getChampionName(participant.championId)}
                    width={32}
                    height={32}
                    className={styles.championImage}
                    onError={(e) => {
                      e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                    }}
                  />
                  <div className={styles.spells}>
                    <Image src={getSpellImageUrl(participant.spell1Id)} alt="Spell 1" width={14} height={14} />
                    <Image src={getSpellImageUrl(participant.spell2Id)} alt="Spell 2" width={14} height={14} />
                  </div>
                  <Image
                    src={getProfileIconUrl(participant.profileIconId)}
                    alt="Profile"
                    width={20}
                    height={20}
                    className={styles.profileIcon}
                  />
                  <div className={styles.participantInfo}>
                    <div className={`${styles.summonerName} ${participant.puuid === game.memberPuuid ? styles.highlighted : ''}`}>
                      <button
                        onClick={() => {
                          const summonerUrl = `/league-of-legends?summoner=${encodeURIComponent(participant.summonerName)}&region=${game.memberRegion}`;
                          window.open(summonerUrl, '_blank');
                        }}
                        className={styles.summonerButton}
                        title={`Klikněte pro zobrazení profilu ${participant.summonerName}`}
                      >
                        {participant.summonerName}
                      </button>
                      {participant.puuid === game.memberPuuid && <span className={styles.memberIndicator}> ●</span>}
                    </div>
                    <div className={styles.championName}>{getChampionName(participant.championId)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KomplexaciStatus() {
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [championData, setChampionData] = useState<Map<number, any>>(new Map());
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showGameModal, setShowGameModal] = useState(false);

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

        // If not in game, fetch last match info
        let lastGameTime = undefined;
        let lastGameResult = undefined;

        if (!isInGame) {
          try {
            const matchHistoryResponse = await fetch(
              `/api/lol/matches?puuid=${summonerData.account.puuid}&region=${member.region}&count=1`
            );

            if (matchHistoryResponse.ok) {
              const matchData = await matchHistoryResponse.json();
              if (matchData.matches && matchData.matches.length > 0) {
                const lastMatch = matchData.matches[0];
                lastGameTime = lastMatch.info.gameEndTimestamp;

                // Find the player's result in the match
                const playerParticipant = lastMatch.info.participants.find(
                  (p: any) => p.puuid === summonerData.account.puuid
                );
                if (playerParticipant) {
                  lastGameResult = playerParticipant.win ? 'win' as const : 'loss' as const;
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching last match for ${member.name}:`, error);
          }
        }

        return {
          member,
          isInGame,
          currentGame: currentGame ? {
            ...currentGame,
            playerPuuid: summonerData.account.puuid
          } : undefined,
          loading: false,
          lastSeen: new Date().toISOString(),
          lastGameTime,
          lastGameResult
        };

      } catch (error) {
        console.error(`Error checking status for ${member.name}:`, error);
        return {
          member,
          isInGame: false,
          loading: false,
          error: 'Connection error',
          lastSeen: new Date().toISOString()
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

  const formatTimeSinceLastGame = (timestamp: number) => {
    const now = Date.now();
    const diffInMs = now - timestamp;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays > 0) {
      return `před ${diffInDays} ${diffInDays === 1 ? 'dnem' : 'dny'}`;
    } else if (diffInHours > 0) {
      return `před ${diffInHours} ${diffInHours === 1 ? 'hodinou' : 'hodinami'}`;
    } else if (diffInMinutes > 0) {
      return `před ${diffInMinutes} ${diffInMinutes === 1 ? 'minutou' : 'minutami'}`;
    } else {
      return 'právě teď';
    }
  };

  // Get champion name from champion ID
  const getChampionName = (championId: number) => {
    const champion = championData.get(championId);
    return champion ? champion.name : `Champion ${championId}`;
  };

  // Helper functions for game details (similar to LiveGame component)
  const getChampionImageUrl = (championId: number): string => {
    const champion = championData.get(championId);
    console.log(`Getting image for champion ${championId}:`, champion);

    if (champion && champion.id) {
      const url = `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/${champion.id}.png`;
      console.log(`Champion ${championId} URL:`, url);
      return url;
    }

    // Fallback: try to load champion data if not available
    if (championData.size === 0) {
      console.log('Champion data not loaded yet, using fallback');
      return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png`;
    }

    // If champion data is loaded but this specific champion isn't found, use a placeholder
    console.log(`Champion ${championId} not found in data, using fallback`);
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png`;
  };

  const getSpellImageUrl = (spellId: number): string => {
    const spellMap: { [key: number]: string } = {
      1: 'SummonerBoost',
      3: 'SummonerExhaust',
      4: 'SummonerFlash',
      6: 'SummonerHaste',
      7: 'SummonerHeal',
      11: 'SummonerSmite',
      12: 'SummonerTeleport',
      13: 'SummonerMana',
      14: 'SummonerDot',
      21: 'SummonerBarrier',
      30: 'SummonerPoroRecall',
      31: 'SummonerPoroThrow',
      32: 'SummonerSnowball',
      39: 'SummonerSnowURFSnowball_Mark'
    };
    const spellKey = spellMap[spellId] || 'SummonerFlash';
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/spell/${spellKey}.png`;
  };

  const getProfileIconUrl = (iconId: number): string => {
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/profileicon/${iconId}.png`;
  };

  const getGameModeDisplay = (queueId: number): string => {
    const queueMap: { [key: number]: string } = {
      400: 'Normální Draft',
      420: 'Ranked Solo/Duo',
      430: 'Normální Blind',
      440: 'Ranked Flex',
      450: 'ARAM',
      700: 'Clash',
      830: 'Co-op vs AI Intro',
      840: 'Co-op vs AI Beginner',
      850: 'Co-op vs AI Intermediate',
      900: 'URF',
      1020: 'One for All',
      1300: 'Nexus Blitz',
      1400: 'Ultimate Spellbook'
    };
    return queueMap[queueId] || `Queue ${queueId}`;
  };

  const getMapName = (mapId: number): string => {
    const mapNames: { [key: number]: string } = {
      11: "Summoner's Rift",
      12: "Howling Abyss",
      21: "Nexus Blitz",
      22: "Convergence"
    };
    return mapNames[mapId] || `Map ${mapId}`;
  };

  const handleGameCardClick = (status: MemberStatus) => {
    if (status.isInGame && status.currentGame) {
      setSelectedGame({
        ...status.currentGame,
        memberName: status.member.displayName,
        memberPuuid: status.currentGame.playerPuuid,
        memberRegion: status.member.region
      });
      setShowGameModal(true);
    }
  };

  // Get players currently in game
  const playersInGame = memberStatuses.filter(status => status.isInGame);

  // Encouragement messages
  const encouragementMessages = [
    "Hodně štěstí v Riftu! 🍀",
    "Nakopej jim prdel! 💪",
    "Přejeme vítězství! 🏆",
    "Ukaž jim, jak se to dělá! ⚔️",
    "Komplexáci věří v tebe! 🔥",
    "Ať padnou nepřátelé! ⚡",
    "Bojuj za Komplexáky! 🛡️",
    "Vítězství je na dosah! 🎯"
  ];

  const getRandomEncouragement = () => {
    return encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
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

      {/* Encouragement Banner for Players in Game */}
      {playersInGame.length > 0 && (
        <div className={styles.encouragementBanner}>
          <div className={styles.bannerContent}>
            <div className={styles.bannerIcon}>🎮</div>
            <div className={styles.bannerText}>
              <div className={styles.bannerTitle}>
                {playersInGame.length === 1
                  ? `${playersInGame[0].member.displayName} právě hraje!`
                  : `${playersInGame.length} Komplexáci právě hrají!`
                }
              </div>
              <div className={styles.bannerMessage}>
                {getRandomEncouragement()}
              </div>
            </div>
            <div className={styles.bannerDecoration}>
              <span className={styles.sparkle}>✨</span>
              <span className={styles.sparkle}>⭐</span>
              <span className={styles.sparkle}>✨</span>
            </div>
          </div>
          <div className={styles.bannerRibbon}></div>
        </div>
      )}

      <div className={styles.membersGrid}>
        {memberStatuses.map((status, index) => (
          <div
            key={index}
            className={`${styles.memberCard} ${status.isInGame ? styles.inGame : ''} ${status.isInGame ? styles.clickable : ''}`}
            onClick={() => handleGameCardClick(status)}
            title={status.isInGame ? 'Klikněte pro zobrazení detailů hry' : ''}
          >
            <div className={styles.memberHeader}>
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{status.member.displayName}</h3>
                <span className={styles.memberTag}>@{status.member.gameName}</span>
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
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#6e4ff6',
                      marginTop: '0.25rem',
                      fontStyle: 'italic'
                    }}>
                      👆 Klikněte pro detaily
                    </div>
                  </div>
                </div>
              ) : (
                <span className={styles.offlineText}>💤 Nehraje</span>
              )}
            </div>

            {!status.isInGame && status.lastGameTime && (
              <div className={styles.lastSeen}>
                <div className={styles.lastGameInfo}>
                  <span className={styles.lastGameText}>
                    Poslední hra: {formatTimeSinceLastGame(status.lastGameTime)}
                  </span>
                  {status.lastGameResult && (
                    <span className={`${styles.lastGameResult} ${status.lastGameResult === 'win' ? styles.win : styles.loss}`}>
                      {status.lastGameResult === 'win' ? '🏆 Výhra' : '💀 Prohra'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          🎮 = Hraje právě teď (klikněte pro detaily) • 💤 = Nehraje • Status se obnovuje každé 2 minuty
        </p>
      </div>

      {/* Game Details Modal */}
      {showGameModal && selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setShowGameModal(false)}
          championData={championData}
          getChampionName={getChampionName}
          getChampionImageUrl={getChampionImageUrl}
          getSpellImageUrl={getSpellImageUrl}
          getProfileIconUrl={getProfileIconUrl}
          getGameModeDisplay={getGameModeDisplay}
          getMapName={getMapName}
        />
      )}
    </section>
  );
}
