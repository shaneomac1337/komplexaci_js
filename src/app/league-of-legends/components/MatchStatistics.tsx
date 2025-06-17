"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../summoner.module.css';
import { MatchHistoryEntry } from '../types/summoner-ui';

interface MatchStatisticsProps {
  matches: MatchHistoryEntry[];
  summonerPuuid: string;
}

interface ChampionStats {
  championId: number;
  championName: string;
  championImage?: string;
  games: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  totalDamage: number;
  cs: number;
  winRate: number;
  avgKDA: number;
}

interface GameModeStats {
  queueId: number;
  queueName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

export default function MatchStatistics({ matches, summonerPuuid }: MatchStatisticsProps) {
  const [championStats, setChampionStats] = useState<ChampionStats[]>([]);
  const [gameModeStats, setGameModeStats] = useState<GameModeStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgKDA: 0,
    avgCS: 0,
    avgDamage: 0
  });

  useEffect(() => {
    if (matches && matches.length > 0) {
      calculateStatistics();
    }
  }, [matches, summonerPuuid]);

  const calculateStatistics = () => {
    const championMap = new Map<number, ChampionStats>();
    const gameModeMap = new Map<number, GameModeStats>();
    
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalCS = 0;
    let totalDamage = 0;
    let totalWins = 0;

    matches.forEach(match => {
      const participant = match.info.participants.find(p => p.puuid === summonerPuuid);
      if (!participant) return;

      // Champion statistics
      const championId = participant.championId;
      if (!championMap.has(championId)) {
        championMap.set(championId, {
          championId,
          championName: participant.championName,
          championImage: participant.championImage,
          games: 0,
          wins: 0,
          losses: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          totalDamage: 0,
          cs: 0,
          winRate: 0,
          avgKDA: 0
        });
      }

      const championStat = championMap.get(championId)!;
      championStat.games++;
      if (participant.win) {
        championStat.wins++;
        totalWins++;
      } else {
        championStat.losses++;
      }
      championStat.kills += participant.kills;
      championStat.deaths += participant.deaths;
      championStat.assists += participant.assists;
      championStat.totalDamage += participant.totalDamageDealtToChampions;
      championStat.cs += participant.totalMinionsKilled + participant.neutralMinionsKilled;

      // Game mode statistics
      const queueId = match.info.queueId;
      const queueName = getGameModeDisplay(queueId);
      
      if (!gameModeMap.has(queueId)) {
        gameModeMap.set(queueId, {
          queueId,
          queueName,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        });
      }

      const gameModeStat = gameModeMap.get(queueId)!;
      gameModeStat.games++;
      if (participant.win) {
        gameModeStat.wins++;
      } else {
        gameModeStat.losses++;
      }

      // Overall statistics
      totalKills += participant.kills;
      totalDeaths += participant.deaths;
      totalAssists += participant.assists;
      totalCS += participant.totalMinionsKilled + participant.neutralMinionsKilled;
      totalDamage += participant.totalDamageDealtToChampions;
    });

    // Calculate final champion statistics
    const championStatsArray = Array.from(championMap.values()).map(stat => {
      stat.winRate = (stat.wins / stat.games) * 100;
      stat.avgKDA = stat.deaths === 0 ? stat.kills + stat.assists : (stat.kills + stat.assists) / stat.deaths;
      return stat;
    }).sort((a, b) => b.games - a.games);

    // Calculate final game mode statistics
    const gameModeStatsArray = Array.from(gameModeMap.values()).map(stat => {
      stat.winRate = (stat.wins / stat.games) * 100;
      return stat;
    }).sort((a, b) => b.games - a.games);

    // Calculate overall statistics
    const totalGames = matches.length;
    const overallWinRate = (totalWins / totalGames) * 100;
    const overallKDA = totalDeaths === 0 ? totalKills + totalAssists : (totalKills + totalAssists) / totalDeaths;

    setChampionStats(championStatsArray);
    setGameModeStats(gameModeStatsArray);
    setOverallStats({
      totalGames,
      wins: totalWins,
      losses: totalGames - totalWins,
      winRate: overallWinRate,
      avgKDA: overallKDA,
      avgCS: totalCS / totalGames,
      avgDamage: totalDamage / totalGames
    });
  };

  const getGameModeDisplay = (queueId: number) => {
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo',
      440: 'Ranked Flex',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind',
      700: 'Clash',
      1700: 'Arena',
      1900: 'URF'
    };
    
    return queueMap[queueId] || 'Custom';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return '#10b981';
    if (winRate >= 60) return '#22c55e';
    if (winRate >= 50) return '#eab308';
    if (winRate >= 40) return '#f97316';
    return '#ef4444';
  };

  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <div className={styles.matchHistorySection}>
      <h3 className={styles.matchHistoryTitle}>Statistiky Výkonu</h3>

      {/* Overall Statistics */}
      <div className={styles.statsCard}>
        <h4 style={{ color: '#f0e6d2', marginBottom: '1rem', fontSize: '1.2rem' }}>
          Celkové Statistiky ({overallStats.totalGames} zápasů)
        </h4>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: getWinRateColor(overallStats.winRate) }}>
              {overallStats.winRate.toFixed(1)}%
            </div>
            <div className={styles.statLabel}>Win Rate</div>
            <div className={styles.statSubtext}>
              {overallStats.wins}W {overallStats.losses}L
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: '#6e4ff6' }}>
              {overallStats.avgKDA.toFixed(2)}
            </div>
            <div className={styles.statLabel}>Průměrná KDA</div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: '#f59e0b' }}>
              {overallStats.avgCS.toFixed(0)}
            </div>
            <div className={styles.statLabel}>Průměrné CS</div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: '#ef4444' }}>
              {Math.round(overallStats.avgDamage / 1000)}k
            </div>
            <div className={styles.statLabel}>Průměrné DMG</div>
          </div>
        </div>
      </div>

      {/* Champion Statistics */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: '#f0e6d2', marginBottom: '1rem', fontSize: '1.1rem' }}>
          Statistiky Championů
        </h4>
        
        <div className={styles.championPerformanceGrid}>
          {championStats.slice(0, 6).map(champion => (
            <div
              key={champion.championId}
              className={styles.championPerformanceCard}
            >
              {champion.championImage && (
                <Image
                  src={champion.championImage}
                  alt={champion.championName}
                  width={40}
                  height={40}
                  style={{ borderRadius: '50%' }}
                />
              )}
              
              <div className={styles.championPerformanceInfo}>
                <div style={{ color: '#f0e6d2', fontWeight: '600', fontSize: '0.9rem' }}>
                  {champion.championName}
                </div>
                <div style={{ color: '#c9aa71', fontSize: '0.8rem' }}>
                  {champion.games} zápasů • {champion.avgKDA.toFixed(2)} KDA
                </div>
              </div>

              <div className={styles.championPerformanceStats}>
                <div style={{
                  color: getWinRateColor(champion.winRate),
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {champion.winRate.toFixed(0)}%
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  {champion.wins}W {champion.losses}L
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Mode Statistics */}
      <div>
        <h4 style={{ color: '#f0e6d2', marginBottom: '1rem', fontSize: '1.1rem' }}>
          Statistiky Herních Módů
        </h4>
        
        <div className={styles.gameModeGrid}>
          {gameModeStats.map(gameMode => (
            <div
              key={gameMode.queueId}
              className={styles.gameModeCard}
            >
              <div>
                <div style={{ color: '#f0e6d2', fontWeight: '600', fontSize: '0.9rem' }}>
                  {gameMode.queueName}
                </div>
                <div style={{ color: '#c9aa71', fontSize: '0.8rem' }}>
                  {gameMode.games} zápasů
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  color: getWinRateColor(gameMode.winRate), 
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {gameMode.winRate.toFixed(0)}%
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  {gameMode.wins}W {gameMode.losses}L
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
