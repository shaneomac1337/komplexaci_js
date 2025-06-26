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

// Constants for game validation - reduced for better real-time detection
const MAX_REASONABLE_GAME_DURATION_MINUTES = 90; // 1.5 hours - maximum reasonable game duration
const STALE_DATA_THRESHOLD_MINUTES = 60; // 1 hour - when to start suspecting stale data
const FORCE_REFRESH_THRESHOLD_MINUTES = 45; // 45 minutes - force API refresh for long games

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
    riotId: 'JESUS#KENCH',
    region: 'eun1',
    displayName: 'Barber',
    gameName: 'JESUS'
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
                          const summonerUrl = `/league-of-legends?summoner=${encodeURIComponent(participant.summonerName)}&region=${game.memberRegion}#summoner-search`;
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
                          const summonerUrl = `/league-of-legends?summoner=${encodeURIComponent(participant.summonerName)}&region=${game.memberRegion}#summoner-search`;
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

// Helper function to validate if game data is stale
const isGameDataStale = (gameStartTime: number): boolean => {
  const now = Date.now();
  const durationMinutes = Math.floor((now - gameStartTime) / 1000 / 60);
  return durationMinutes > MAX_REASONABLE_GAME_DURATION_MINUTES;
};

// Helper function to check if game duration is suspicious (but not necessarily stale)
const isGameDurationSuspicious = (gameStartTime: number): boolean => {
  const now = Date.now();
  const durationMinutes = Math.floor((now - gameStartTime) / 1000 / 60);
  return durationMinutes > STALE_DATA_THRESHOLD_MINUTES;
};

// Helper function to check if we should force refresh for long games
const shouldForceRefresh = (gameStartTime: number): boolean => {
  const now = Date.now();
  const durationMinutes = Math.floor((now - gameStartTime) / 1000 / 60);
  return durationMinutes > FORCE_REFRESH_THRESHOLD_MINUTES;
};

export default function KomplexaciStatus() {
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [championData, setChampionData] = useState<Map<number, any>>(new Map());

  // Local PUUID cache to avoid repeated lookups
  const [puuidCache, setPuuidCache] = useState<Map<string, string>>(new Map());
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

    // Load champion data and check status for each member (optimized)
    loadChampionData();
    checkAllMembersStatusOptimized();

    // Set up periodic refresh every 30 seconds for better real-time game end detection
    const interval = setInterval(checkAllMembersStatusOptimized, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Function to check status for a single member
  const checkMemberStatus = async (member: KomplexaciMember): Promise<MemberStatus> => {
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
        
        // Check live game status with cache busting for suspicious cases
        const cacheBuster = Date.now();
        const liveGameResponse = await fetch(
          `/api/lol/live-game?puuid=${summonerData.account.puuid}&region=${member.region}&_cb=${cacheBuster}`,
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );

        let isInGame = false;
        let currentGame = null;

        if (liveGameResponse.ok) {
          const liveGameData = await liveGameResponse.json();

          // Check if the API says player is in game
          if (liveGameData.inGame && liveGameData.gameInfo) {
            // Validate game duration to detect stale data
            const gameStartTime = liveGameData.gameInfo.gameStartTime;

            if (isGameDataStale(gameStartTime)) {
              // Game duration is unrealistic - treat as stale data
              console.warn(`🚨 Stale game data detected for ${member.name}: Game duration exceeds ${MAX_REASONABLE_GAME_DURATION_MINUTES} minutes`);
              isInGame = false;
              currentGame = null;
            } else if (isGameDurationSuspicious(gameStartTime)) {
              // Game duration is suspicious - cross-reference with match history
              const durationMinutes = Math.floor((Date.now() - gameStartTime) / 1000 / 60);
              console.warn(`⚠️ Suspicious game duration for ${member.name}: ${durationMinutes} minutes. Verifying with match history...`);

              try {
                // Check if player has completed any games after the supposed current game start time
                const matchHistoryResponse = await fetch(
                  `/api/lol/matches?puuid=${summonerData.account.puuid}&region=${member.region}&count=3`
                );

                if (matchHistoryResponse.ok) {
                  const matchData = await matchHistoryResponse.json();
                  if (matchData.matches && matchData.matches.length > 0) {
                    // Check if any recent match ended after the supposed current game started
                    const hasRecentCompletedGame = matchData.matches.some((match: any) =>
                      match.info.gameEndTimestamp > gameStartTime
                    );

                    if (hasRecentCompletedGame) {
                      console.warn(`🚨 Confirmed stale data for ${member.name}: Found completed games after supposed current game start`);
                      isInGame = false;
                      currentGame = null;
                    } else {
                      // No recent completed games - might be a very long game, trust the API but mark as suspicious
                      isInGame = true;
                      currentGame = liveGameData.gameInfo;
                    }
                  } else {
                    // No match history available - trust the API
                    isInGame = true;
                    currentGame = liveGameData.gameInfo;
                  }
                } else {
                  // Match history API failed - trust the live game API
                  isInGame = true;
                  currentGame = liveGameData.gameInfo;
                }
              } catch (error) {
                console.error(`Error verifying game data for ${member.name}:`, error);
                // On error, trust the live game API
                isInGame = true;
                currentGame = liveGameData.gameInfo;
              }
            } else {
              // Game duration is reasonable - trust the API
              isInGame = true;
              currentGame = liveGameData.gameInfo;
            }
          }
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
  };

  const checkAllMembersStatus = async () => {
    setIsLoading(true);

    const statusPromises = KOMPLEXACI_MEMBERS.map(checkMemberStatus);
    const statuses = await Promise.all(statusPromises);
    setMemberStatuses(statuses);
    setIsLoading(false);
  };

  // Optimized version with rate limiting protection and prioritized live game checks
  const checkAllMembersStatusOptimized = async () => {
    setIsLoading(true);
    console.log('🎮 Starting optimized Komplexáci status check...');

    const statuses: MemberStatus[] = [];

    // Process members in batches of 3 to avoid rate limiting
    const BATCH_SIZE = 3;
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
    const DELAY_BETWEEN_CALLS = 200; // 200ms delay between individual calls

    for (let i = 0; i < KOMPLEXACI_MEMBERS.length; i += BATCH_SIZE) {
      const batch = KOMPLEXACI_MEMBERS.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(KOMPLEXACI_MEMBERS.length / BATCH_SIZE)}`);

      // Process batch members sequentially with delays
      for (const member of batch) {
        try {
          const status = await checkMemberStatusOptimized(member);
          statuses.push(status);

          // Update UI immediately for each member (progressive loading)
          setMemberStatuses(prev => {
            const newStatuses = [...prev];
            const existingIndex = newStatuses.findIndex(s => s.member.name === member.name);
            if (existingIndex >= 0) {
              newStatuses[existingIndex] = status;
            } else {
              newStatuses.push(status);
            }
            return newStatuses;
          });

          // Small delay between individual calls
          if (batch.indexOf(member) < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CALLS));
          }
        } catch (error) {
          console.error(`Error checking ${member.name}:`, error);
          statuses.push({
            member,
            isInGame: false,
            loading: false,
            error: 'Rate limit or connection error'
          });
        }
      }

      // Delay between batches (except for the last batch)
      if (i + BATCH_SIZE < KOMPLEXACI_MEMBERS.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    setIsLoading(false);
    console.log('✅ Optimized status check completed');
  };

  // Optimized member status check - prioritizes live game status with minimal API calls
  const checkMemberStatusOptimized = async (member: KomplexaciMember): Promise<MemberStatus> => {
    try {
      console.log(`🔍 Checking ${member.name}...`);

      // Step 1: Try to get cached PUUID first (if we have it from previous calls)
      let puuid: string | null = null;

      // Check local PUUID cache first
      const cacheKey = `${member.riotId}-${member.region}`;
      if (puuidCache.has(cacheKey)) {
        puuid = puuidCache.get(cacheKey)!;
        console.log(`📋 Using locally cached PUUID for ${member.name}`);
      } else {
        // Check if we can get PUUID from previous status
        const cachedStatus = memberStatuses.find(s => s.member.name === member.name);
        if (cachedStatus?.currentGame?.playerPuuid) {
          puuid = cachedStatus.currentGame.playerPuuid;
          // Store in local cache for future use
          setPuuidCache(prev => new Map(prev).set(cacheKey, puuid!));
          console.log(`📋 Using status cached PUUID for ${member.name}`);
        }
      }

      // If no cached PUUID, get it with minimal API call
      if (!puuid) {
        console.log(`🔍 Fetching PUUID for ${member.name}...`);
        const puuidResponse = await fetch(
          `/api/lol/puuid-only?riotId=${encodeURIComponent(member.riotId)}&region=${member.region}`,
          {
            headers: {
              'Cache-Control': 'public, max-age=86400' // 24 hours cache for PUUID
            }
          }
        );

        if (!puuidResponse.ok) {
          if (puuidResponse.status === 429) {
            throw new Error('Rate limit exceeded');
          }
          return {
            member,
            isInGame: false,
            loading: false,
            error: 'Player not found'
          };
        }

        const puuidData = await puuidResponse.json();
        puuid = puuidData.puuid;

        // Store in local cache for future use
        setPuuidCache(prev => new Map(prev).set(cacheKey, puuid!));
      }

      // Step 2: Check live game status (PRIORITY - this is what we care about most)
      console.log(`🎮 Checking live game for ${member.name}...`);

      // Check if we should force refresh based on previous game data
      const cachedStatus = memberStatuses.find(s => s.member.name === member.name);
      const shouldBypassCache = cachedStatus?.currentGame?.gameStartTime &&
                               shouldForceRefresh(cachedStatus.currentGame.gameStartTime);

      const liveGameResponse = await fetch(
        `/api/lol/live-game-optimized?puuid=${puuid}&region=${member.region}&memberName=${encodeURIComponent(member.name)}`,
        {
          headers: {
            'Cache-Control': shouldBypassCache ? 'no-cache' : 'public, max-age=10' // Shorter cache for better real-time detection
          }
        }
      );

      let isInGame = false;
      let currentGame = null;

      if (liveGameResponse.ok) {
        const liveGameData = await liveGameResponse.json();

        if (liveGameData.inGame && liveGameData.gameInfo) {
          const gameStartTime = liveGameData.gameInfo.gameStartTime;

          // Quick validation - only reject obviously stale data
          if (!isGameDataStale(gameStartTime)) {
            isInGame = true;
            currentGame = {
              ...liveGameData.gameInfo,
              playerPuuid: puuid
            };
            console.log(`🎯 ${member.name} is IN GAME!`);
          } else {
            console.log(`⚠️ Stale game data detected for ${member.name}`);
          }
        }
      } else if (liveGameResponse.status === 429) {
        throw new Error('Rate limit exceeded');
      }

      // Step 3: Only fetch additional data if NOT in game and we have time/quota
      let lastGameTime = undefined;
      let lastGameResult = undefined;

      if (!isInGame) {
        console.log(`📊 ${member.name} not in game, checking last match...`);
        try {
          const matchHistoryResponse = await fetch(
            `/api/lol/matches?puuid=${puuid}&region=${member.region}&count=1`,
            {
              headers: {
                'Cache-Control': 'public, max-age=600' // 10 minutes cache for match history
              }
            }
          );

          if (matchHistoryResponse.ok) {
            const matchData = await matchHistoryResponse.json();
            if (matchData.matches && matchData.matches.length > 0) {
              const lastMatch = matchData.matches[0];
              lastGameTime = lastMatch.info.gameEndTimestamp;

              const playerParticipant = lastMatch.info.participants.find(
                (p: any) => p.puuid === puuid
              );
              if (playerParticipant) {
                lastGameResult = playerParticipant.win ? 'win' as const : 'loss' as const;
              }
            }
          } else if (matchHistoryResponse.status === 429) {
            console.log(`⚠️ Rate limit hit for match history of ${member.name}, skipping...`);
          }
        } catch (error) {
          console.log(`⚠️ Skipping match history for ${member.name} due to error:`, error);
        }
      }

      return {
        member,
        isInGame,
        currentGame,
        loading: false,
        lastSeen: new Date().toISOString(),
        lastGameTime,
        lastGameResult
      };

    } catch (error) {
      console.error(`❌ Error checking ${member.name}:`, error);

      if (error instanceof Error && error.message.includes('Rate limit')) {
        return {
          member,
          isInGame: false,
          loading: false,
          error: 'Rate limited - will retry later'
        };
      }

      return {
        member,
        isInGame: false,
        loading: false,
        error: 'Connection error',
        lastSeen: new Date().toISOString()
      };
    }
  };

  // Function to refresh a single member's status
  const refreshMemberStatus = async (memberIndex: number) => {
    const member = KOMPLEXACI_MEMBERS[memberIndex];

    // Set loading state for this specific member
    setMemberStatuses(prev => prev.map((status, index) =>
      index === memberIndex ? { ...status, loading: true } : status
    ));

    try {
      const newStatus = await checkMemberStatus(member);

      // Update only this member's status
      setMemberStatuses(prev => prev.map((status, index) =>
        index === memberIndex ? newStatus : status
      ));
    } catch (error) {
      console.error(`Error refreshing status for ${member.name}:`, error);

      // Set error state for this member
      setMemberStatuses(prev => prev.map((status, index) =>
        index === memberIndex ? {
          ...status,
          loading: false,
          error: 'Refresh failed'
        } : status
      ));
    }
  };

  // Force immediate refresh for a member (bypasses all caching for real-time game end detection)
  const forceRefreshMemberStatus = async (memberIndex: number) => {
    const member = KOMPLEXACI_MEMBERS[memberIndex];
    console.log(`🔴 Force refreshing ${member.name} (immediate check)...`);

    // Set loading state
    setMemberStatuses(prev => prev.map((status, index) =>
      index === memberIndex ? { ...status, loading: true } : status
    ));

    try {
      // Get PUUID first
      const cacheKey = `${member.riotId}-${member.region}`;
      let puuid = puuidCache.get(cacheKey);

      if (!puuid) {
        const puuidResponse = await fetch(
          `/api/lol/puuid-only?riotId=${encodeURIComponent(member.riotId)}&region=${member.region}`
        );
        if (puuidResponse.ok) {
          const puuidData = await puuidResponse.json();
          puuid = puuidData.puuid;
          setPuuidCache(prev => new Map(prev).set(cacheKey, puuid!));
        }
      }

      if (puuid) {
        // Use immediate endpoint for real-time check
        const immediateResponse = await fetch(
          `/api/lol/live-game-immediate?puuid=${puuid}&region=${member.region}&memberName=${encodeURIComponent(member.name)}`
        );

        if (immediateResponse.ok) {
          const immediateData = await immediateResponse.json();

          const updatedStatus: MemberStatus = {
            member,
            isInGame: immediateData.inGame,
            currentGame: immediateData.gameInfo ? {
              ...immediateData.gameInfo,
              playerPuuid: puuid
            } : null,
            loading: false,
            lastSeen: new Date().toISOString()
          };

          setMemberStatuses(prev => prev.map((status, index) =>
            index === memberIndex ? updatedStatus : status
          ));

          console.log(`🔴 Force refresh complete for ${member.name}: ${immediateData.inGame ? 'IN GAME' : 'NOT IN GAME'}`);
        } else {
          throw new Error('Failed to fetch immediate status');
        }
      } else {
        throw new Error('Failed to get PUUID');
      }
    } catch (error) {
      console.error(`Error force refreshing ${member.name}:`, error);
      setMemberStatuses(prev => prev.map((status, index) =>
        index === memberIndex ? {
          ...status,
          loading: false,
          error: 'Force refresh failed'
        } : status
      ));
    }
  };

  const formatGameMode = (gameMode: string, gameInfo?: any) => {
    // Use queue type name if available (from our new validation)
    if (gameInfo?.queueTypeName) {
      return gameInfo.queueTypeName;
    }

    // Fallback to game mode mapping
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

    // Add warning indicator for suspicious durations
    if (isGameDurationSuspicious(gameStartTime)) {
      return `${duration} min ⚠️`;
    }

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

  const handleMemberNameClick = (member: KomplexaciMember, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the game card click
    const summonerUrl = `/league-of-legends?summoner=${encodeURIComponent(member.riotId)}&region=${member.region}#summoner-search`;
    window.location.href = summonerUrl;
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
          onClick={checkAllMembersStatusOptimized}
          disabled={isLoading}
          className={styles.refreshButton}
          title="Obnovit status všech členů (optimalizováno pro rychlost)"
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
                <button
                  className={styles.memberNameButton}
                  onClick={(e) => handleMemberNameClick(status.member, e)}
                  title={`Klikněte pro zobrazení profilu ${status.member.riotId}`}
                >
                  <h3 className={styles.memberName}>{status.member.displayName}</h3>
                  <span className={styles.memberTag}>@{status.member.gameName}</span>
                </button>
              </div>
              <div className={styles.statusControls}>
                <div className={`${styles.statusIndicator} ${
                  status.loading ? styles.loading :
                  status.isInGame ? styles.inGame : styles.offline
                }`}>
                  {status.loading ? '⏳' :
                   status.isInGame ? '🎮' : '💤'}
                </div>
                <button
                  className={styles.refreshMemberButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshMemberStatus(index);
                  }}
                  disabled={status.loading}
                  title={`Obnovit status pro ${status.member.displayName}`}
                >
                  {status.loading ? '🔄' : '↻'}
                </button>
                {/* Force refresh button for immediate game end detection */}
                <button
                  className={`${styles.refreshMemberButton} ${styles.forceRefreshButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    forceRefreshMemberStatus(index);
                  }}
                  disabled={status.loading}
                  title={`Okamžitá kontrola pro ${status.member.displayName} (obchází cache)`}
                >
                  🔴
                </button>
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
                      🎯 {formatGameMode(status.currentGame.gameMode, status.currentGame)}
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
          🎮 = Hraje právě teď (klikněte pro detaily) • 💤 = Nehraje • 👤 Klikněte na jméno pro profil • ↻ = Obnovit jednotlivě
        </p>
        <p className={styles.footerSubtext}>
          Status se obnovuje každých 30 sekund • ⚠️ = Podezřelá délka hry • Rychlá detekce konce hry • Optimalizováno pro real-time
        </p>

        {/* Game Tracking Information */}
        <div className={styles.trackingInfo}>
          <details className={styles.trackingDetails}>
            <summary className={styles.trackingSummary}>
              ℹ️ Jaké hry jsou sledovány?
            </summary>
            <div className={styles.trackingContent}>
              <div className={styles.trackingSection}>
                <h4 className={styles.trackingTitle}>✅ Sledované herní módy:</h4>
                <ul className={styles.trackingList}>
                  <li><strong>🏆 Ranked Solo/Duo</strong> - Žebříčkové hry</li>
                  <li><strong>🏆 Ranked Flex</strong> - Flexibilní žebříček</li>
                  <li><strong>🎯 ARAM</strong> - All Random All Mid</li>
                  <li><strong>⚔️ Normal Draft</strong> - Normální draft</li>
                  <li><strong>⚔️ Normal Blind</strong> - Normální blind pick</li>
                  <li><strong>⚔️ Normal Quickplay</strong> - Rychlá hra</li>
                  <li><strong>🏅 Clash</strong> - Turnajové hry</li>
                  <li><strong>🎪 URF</strong> - Ultra Rapid Fire</li>
                  <li><strong>🎪 Arena</strong> - 2v2v2v2 Arena</li>
                  <li><strong>🎪 One for All</strong> - Všichni stejný champion</li>
                  <li><strong>🎪 Nexus Blitz</strong> - Rychlý herní mód</li>
                  <li><strong>🎪 Ultimate Spellbook</strong> - Ultimátní kouzla</li>
                  <li><strong>🤖 Co-op vs AI</strong> - Hry proti botům</li>
                  <li><strong>🎮 Všechny ostatní módy</strong> - Včetně rotujících módů</li>
                </ul>
              </div>

              <div className={styles.trackingSection}>
                <h4 className={styles.trackingTitle}>❌ Nesledované módy:</h4>
                <ul className={styles.trackingList}>
                  <li><strong>🔧 Practice Tool</strong> - Tréninková místnost</li>
                  <li><strong>🎮 Custom Games</strong> - Vlastní lobby hry</li>
                </ul>
              </div>

              <div className={styles.trackingNote}>
                <p><strong>💡 Proč?</strong> Sledujeme všechny oficiální herní módy včetně rotujících módů. Pouze Practice Tool a custom lobby hry jsou vyloučeny, protože často způsobují nepřesné údaje o stavu hráče (zůstávají "aktivní" i po opuštění).</p>
              </div>
            </div>
          </details>
        </div>
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
