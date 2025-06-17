"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../summoner.module.css';
import { MatchHistoryEntry } from '../types/summoner-ui';

interface PlayedWithPlayer {
  summonerName: string;
  puuid: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  lastPlayedTogether: number;
  champions: {
    championId: number;
    championName: string;
    championImage?: string;
    games: number;
  }[];
  averageKDA: {
    kills: number;
    deaths: number;
    assists: number;
  };
}

interface PlayedWithAnalysisProps {
  matches: MatchHistoryEntry[];
  summonerPuuid: string;
}

export default function PlayedWithAnalysis({ matches, summonerPuuid }: PlayedWithAnalysisProps) {
  const [playedWithData, setPlayedWithData] = useState<PlayedWithPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nameCache, setNameCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (matches && matches.length > 0) {
      analyzePlayedWith();
    }
  }, [matches, summonerPuuid]);

  // Function to fetch summoner name by PUUID with caching
  const fetchSummonerName = async (puuid: string): Promise<string> => {
    // Check cache first
    if (nameCache.has(puuid)) {
      return nameCache.get(puuid)!;
    }

    try {
      // Get current URL to determine region
      const currentUrl = new URL(window.location.href);
      const region = currentUrl.searchParams.get('region') || 'euw1';

      const response = await fetch(`/api/lol/summoner-by-puuid?puuid=${puuid}&region=${region}`);
      if (response.ok) {
        const data = await response.json();
        const name = data.gameName && data.tagLine ? `${data.gameName}#${data.tagLine}` : `Player${puuid.slice(-4)}`;

        // Cache the result
        setNameCache(prev => new Map(prev).set(puuid, name));
        return name;
      }
    } catch (error) {
      console.warn(`Failed to fetch summoner name for PUUID ${puuid}:`, error);
    }

    const fallbackName = `Player${puuid.slice(-4)}`;
    setNameCache(prev => new Map(prev).set(puuid, fallbackName));
    return fallbackName;
  };

  const analyzePlayedWith = async () => {
    setIsLoading(true);

    const playerMap = new Map<string, PlayedWithPlayer>();

    // First pass: collect all player data
    matches.forEach(match => {
      // Find the summoner's team
      const summonerParticipant = match.info.participants.find(p => p.puuid === summonerPuuid);
      if (!summonerParticipant) return;

      const summonerTeamId = summonerParticipant.teamId;
      const matchWon = summonerParticipant.win;

      // Find teammates (same team, different PUUID)
      const teammates = match.info.participants.filter(
        p => p.teamId === summonerTeamId && p.puuid !== summonerPuuid
      );

      teammates.forEach(teammate => {
        const playerId = teammate.puuid;

        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            summonerName: `Player${playerId.slice(-4)}`, // Better fallback name
            puuid: playerId,
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            lastPlayedTogether: 0,
            champions: [],
            averageKDA: { kills: 0, deaths: 0, assists: 0 }
          });
        }

        const player = playerMap.get(playerId)!;
        player.gamesPlayed++;
        if (matchWon) player.gamesWon++;

        // Update last played together
        if (match.info.gameEndTimestamp > player.lastPlayedTogether) {
          player.lastPlayedTogether = match.info.gameEndTimestamp;
        }

        // Track champion usage
        const championIndex = player.champions.findIndex(c => c.championId === teammate.championId);
        if (championIndex >= 0) {
          player.champions[championIndex].games++;
        } else {
          player.champions.push({
            championId: teammate.championId,
            championName: teammate.championName,
            championImage: teammate.championImage,
            games: 1
          });
        }

        // Update KDA
        player.averageKDA.kills += teammate.kills;
        player.averageKDA.deaths += teammate.deaths;
        player.averageKDA.assists += teammate.assists;
      });
    });

    // Calculate final statistics
    const playedWithArray = Array.from(playerMap.values()).map(player => {
      player.winRate = (player.gamesWon / player.gamesPlayed) * 100;

      // Calculate average KDA
      player.averageKDA.kills = player.averageKDA.kills / player.gamesPlayed;
      player.averageKDA.deaths = player.averageKDA.deaths / player.gamesPlayed;
      player.averageKDA.assists = player.averageKDA.assists / player.gamesPlayed;

      // Sort champions by games played
      player.champions.sort((a, b) => b.games - a.games);

      return player;
    });

    // Sort by games played (most frequent teammates first)
    playedWithArray.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

    // Set initial data with fallback names
    setPlayedWithData(playedWithArray);

    // Update displayed players to show "Loading..." temporarily
    const playersToUpdate = playedWithArray.slice(0, 8).map(player => ({
      ...player,
      summonerName: 'Loading...'
    }));
    setPlayedWithData([
      ...playersToUpdate,
      ...playedWithArray.slice(8)
    ]);

    // Second pass: fetch real summoner names for all displayed players with rate limiting
    const displayedPlayers = playedWithArray.slice(0, 8); // Fetch names for all 8 displayed players

    try {
      // Fetch names with delays to avoid rate limiting
      const nameResults: { puuid: string; name: string }[] = [];

      for (let i = 0; i < displayedPlayers.length; i++) {
        const player = displayedPlayers[i];

        try {
          const realName = await fetchSummonerName(player.puuid);
          nameResults.push({ puuid: player.puuid, name: realName });

          // Update UI progressively as names are fetched
          const updatedData = playedWithArray.map(p => {
            const nameResult = nameResults.find(nr => nr.puuid === p.puuid);
            if (nameResult) {
              return { ...p, summonerName: nameResult.name };
            }
            return p;
          });
          setPlayedWithData(updatedData);

          // Add delay between requests to avoid rate limiting
          if (i < displayedPlayers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 150)); // Slightly reduced delay
          }
        } catch (error) {
          console.warn(`Failed to fetch name for player ${i + 1}:`, error);
          // Add fallback name for failed fetch
          nameResults.push({ puuid: player.puuid, name: `Player${player.puuid.slice(-4)}` });

          // Update UI with fallback name
          const updatedData = playedWithArray.map(p => {
            const nameResult = nameResults.find(nr => nr.puuid === p.puuid);
            if (nameResult) {
              return { ...p, summonerName: nameResult.name };
            }
            return p;
          });
          setPlayedWithData(updatedData);
        }
      }
    } catch (error) {
      console.error('Error fetching summoner names:', error);
      // Fallback: replace any remaining "Loading..." with fallback names
      const fallbackData = playedWithArray.map(player => ({
        ...player,
        summonerName: player.summonerName === 'Loading...' ? `Player${player.puuid.slice(-4)}` : player.summonerName
      }));
      setPlayedWithData(fallbackData);
    }

    setIsLoading(false);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Před chvílí';
    } else if (diffInHours < 24) {
      return `Před ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Před ${diffInDays}d`;
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return '#10b981';
    if (winRate >= 60) return '#22c55e';
    if (winRate >= 50) return '#eab308';
    if (winRate >= 40) return '#f97316';
    return '#ef4444';
  };

  const getKDADisplay = (kda: { kills: number; deaths: number; assists: number }) => {
    const ratio = kda.deaths === 0 ? kda.kills + kda.assists : (kda.kills + kda.assists) / kda.deaths;
    return {
      text: `${kda.kills.toFixed(1)}/${kda.deaths.toFixed(1)}/${kda.assists.toFixed(1)}`,
      ratio: ratio.toFixed(2),
      color: ratio >= 3 ? '#10b981' : ratio >= 2 ? '#f59e0b' : ratio >= 1 ? '#6b7280' : '#ef4444'
    };
  };

  if (isLoading) {
    return (
      <div className={styles.matchHistorySection}>
        <h3 className={styles.matchHistoryTitle}>Často Hraje S</h3>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (playedWithData.length === 0) {
    return (
      <div className={styles.matchHistorySection}>
        <h3 className={styles.matchHistoryTitle}>Často Hraje S</h3>
        <p style={{ color: '#c9aa71', textAlign: 'center', padding: '2rem' }}>
          Žádní společní spoluhráči nebyli nalezeni v nedávných zápasech.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.matchHistorySection}>
      <h3 className={styles.matchHistoryTitle}>
        Často Hraje S
        <span style={{ 
          fontSize: '1rem', 
          fontWeight: 'normal', 
          color: '#c9aa71',
          marginLeft: '0.5rem'
        }}>
          (Top {Math.min(playedWithData.length, 8)})
        </span>
      </h3>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '0.75rem' 
      }}>
        {playedWithData.slice(0, 8).map((player, index) => {
          const kdaInfo = getKDADisplay(player.averageKDA);
          const mostPlayedChampion = player.champions[0];

          return (
            <div 
              key={player.puuid}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(110, 79, 246, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6e4ff6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(110, 79, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {/* Rank Badge */}
                <div style={{
                  background: 'linear-gradient(135deg, #6e4ff6, #8b5cf6)',
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

                {/* Most Played Champion */}
                {mostPlayedChampion && mostPlayedChampion.championImage && (
                  <Image
                    src={mostPlayedChampion.championImage}
                    alt={mostPlayedChampion.championName}
                    width={32}
                    height={32}
                    style={{ borderRadius: '50%' }}
                  />
                )}

                {/* Player Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f0e6d2', fontWeight: '600', fontSize: '0.9rem' }}>
                    {player.summonerName}
                  </div>
                  <div style={{ color: '#c9aa71', fontSize: '0.8rem' }}>
                    {player.gamesPlayed} zápasů společně
                  </div>
                </div>

                {/* Win Rate */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: getWinRateColor(player.winRate), 
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {player.winRate.toFixed(0)}%
                  </div>
                  <div style={{ color: '#888', fontSize: '0.7rem' }}>
                    {player.gamesWon}W {player.gamesPlayed - player.gamesWon}L
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '0.8rem'
              }}>
                {/* Average KDA */}
                <div>
                  <span style={{ color: '#c9aa71' }}>Průměrná KDA: </span>
                  <span style={{ color: kdaInfo.color, fontWeight: '600' }}>
                    {kdaInfo.ratio}
                  </span>
                </div>

                {/* Last Played */}
                <div style={{ color: '#888' }}>
                  {formatTimeAgo(player.lastPlayedTogether)}
                </div>
              </div>

              {/* Most Played Champions */}
              {player.champions.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ color: '#c9aa71', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                    Nejčastější championové:
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {player.champions.slice(0, 3).map((champion, champIndex) => (
                      <div key={champion.championId} style={{ position: 'relative' }}>
                        {champion.championImage && (
                          <Image
                            src={champion.championImage}
                            alt={champion.championName}
                            width={20}
                            height={20}
                            style={{ borderRadius: '2px' }}
                            title={`${champion.championName} (${champion.games} her)`}
                          />
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          background: '#6e4ff6',
                          color: 'white',
                          borderRadius: '50%',
                          width: '12px',
                          height: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 'bold'
                        }}>
                          {champion.games}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {playedWithData.length > 8 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1rem',
          color: '#c9aa71',
          fontSize: '0.9rem'
        }}>
          ... a dalších {playedWithData.length - 8} spoluhráčů
        </div>
      )}
    </div>
  );
}
