"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../summoner.module.css';
import { LiveGameProps, CurrentGame } from '../types/summoner-ui';
import { championDataService } from '../../api/lol/utils/championUtils';

export default function LiveGame({ currentGame, summonerPuuid }: LiveGameProps) {
  const [gameData, setGameData] = useState<CurrentGame | null>(currentGame);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gameTimer, setGameTimer] = useState(0);
  const [championData, setChampionData] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    setGameData(currentGame);
    if (currentGame) {
      // Calculate game duration
      const startTime = currentGame.gameStartTime;
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
  }, [currentGame]);

  // Load champion data when component mounts
  useEffect(() => {
    const loadChampionData = async () => {
      try {
        const champData = await championDataService.getChampionData();
        console.log('Loaded champion data:', champData.size, 'champions');
        setChampionData(champData);
      } catch (error) {
        console.error('Failed to load champion data:', error);
      }
    };

    loadChampionData();
  }, []);

  // Format game duration
  const formatGameDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get game mode display name
  const getGameModeDisplay = (queueId: number) => {
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo/Duo',
      440: 'Ranked Flex 5v5',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind',
      700: 'Clash',
      1700: 'Arena',
      1900: 'URF',
      900: 'URF',
      1020: 'One for All',
      1300: 'Nexus Blitz',
      1400: 'Ultimate Spellbook'
    };
    
    return queueMap[queueId] || 'Custom Game';
  };

  // Get map name
  const getMapName = (mapId: number) => {
    const mapNames: Record<number, string> = {
      11: "Summoner's Rift",
      12: "Howling Abyss",
      21: "Nexus Blitz",
      22: "Teamfight Tactics",
      30: "Arena"
    };
    
    return mapNames[mapId] || 'Unknown Map';
  };

  // Get champion image URL using actual champion data
  const getChampionImageUrl = (championId: number) => {
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

  // Get champion name
  const getChampionName = (championId: number) => {
    const champion = championData.get(championId);
    return champion ? champion.name : `Champion ${championId}`;
  };

  // Get spell image URL
  const getSpellImageUrl = (spellId: number) => {
    const spellMap: Record<number, string> = {
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
      32: 'SummonerSnowball'
    };
    
    const spellName = spellMap[spellId] || 'SummonerFlash';
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/spell/${spellName}.png`;
  };

  // Get profile icon URL
  const getProfileIconUrl = (iconId: number) => {
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/profileicon/${iconId}.png`;
  };

  // Find the searched summoner in participants
  const findSummoner = () => {
    return gameData?.participants.find(p => p.puuid === summonerPuuid);
  };

  // Separate teams
  const getTeams = () => {
    if (!gameData) return { team1: [], team2: [] };
    
    const team1 = gameData.participants.filter(p => p.teamId === 100);
    const team2 = gameData.participants.filter(p => p.teamId === 200);
    
    return { team1, team2 };
  };

  // Get banned champions for a team
  const getBannedChampions = (teamId: number) => {
    if (!gameData) return [];
    return gameData.bannedChampions.filter(ban => ban.teamId === teamId);
  };

  if (!gameData) {
    return null;
  }

  const { team1, team2 } = getTeams();
  const currentSummoner = findSummoner();
  const team1Bans = getBannedChampions(100);
  const team2Bans = getBannedChampions(200);

  return (
    <div className={styles.matchHistorySection}>
      <h3 className={styles.matchHistoryTitle}>
        🔴 Live Game
        <span style={{ 
          fontSize: '1rem', 
          fontWeight: 'normal', 
          color: '#10b981',
          marginLeft: '0.5rem'
        }}>
          ({formatGameDuration(gameTimer)})
        </span>
      </h3>

      {/* Game Info Header */}
      <div className={styles.liveGameContainer}>
        <div className={styles.liveGameHeader}>
          <div className={styles.liveGameTitle}>
            {getGameModeDisplay(gameData.gameQueueConfigId)}
          </div>
          <div className={styles.liveGameSubtitle}>
            {getMapName(gameData.mapId)}
          </div>
          <div className={styles.liveGameTimer}>
            Hra probíhá • {formatGameDuration(gameTimer)}
          </div>
        </div>
      </div>

      {/* Teams Display */}
      <div className={styles.teamsContainer}>
        {/* Team 1 (Blue Side) */}
        <div className={`${styles.teamContainer} ${styles.teamBlue}`}>
          <h4 className={`${styles.teamTitle} ${styles.teamTitleBlue}`}>
            Modrý Tým
          </h4>

          {/* Team 1 Bans */}
          {team1Bans.length > 0 && (
            <div className={styles.bansContainer}>
              <div className={styles.bansTitle}>
                Zakázaní championové:
              </div>
              <div className={styles.bansGrid}>
                {team1Bans.map((ban, index) => (
                  <div key={index} className={styles.banItem} title={getChampionName(ban.championId)}>
                    <Image
                      src={getChampionImageUrl(ban.championId)}
                      alt={`Banned: ${getChampionName(ban.championId)}`}
                      width={24}
                      height={24}
                      style={{ borderRadius: '4px', opacity: 0.6 }}
                      onError={(e) => {
                        // Fallback to a default image if champion image fails to load
                        e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                      }}
                    />
                    <div className={styles.banOverlay}>
                      ✕
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team 1 Players */}
          <div className={styles.participantsList}>
            {team1.map((participant, index) => (
              <div
                key={participant.puuid}
                className={`${styles.participantCard} ${participant.puuid === summonerPuuid ? styles.highlighted : ''}`}
              >
                {/* Champion */}
                <Image
                  src={getChampionImageUrl(participant.championId)}
                  alt={getChampionName(participant.championId)}
                  width={32}
                  height={32}
                  className={styles.participantChampion}
                  title={getChampionName(participant.championId)}
                  onError={(e) => {
                    e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                  }}
                />

                {/* Spells */}
                <div className={styles.participantSpells}>
                  <Image
                    src={getSpellImageUrl(participant.spell1Id)}
                    alt="Spell 1"
                    width={14}
                    height={14}
                    className={styles.participantSpell}
                  />
                  <Image
                    src={getSpellImageUrl(participant.spell2Id)}
                    alt="Spell 2"
                    width={14}
                    height={14}
                    className={styles.participantSpell}
                  />
                </div>

                {/* Profile Icon */}
                <Image
                  src={getProfileIconUrl(participant.profileIconId)}
                  alt="Profile Icon"
                  width={20}
                  height={20}
                  className={styles.participantIcon}
                />

                {/* Summoner Name */}
                <div className={`${styles.participantName} ${participant.puuid === summonerPuuid ? styles.highlighted : ''}`}>
                  {participant.summonerName}
                  {participant.puuid === summonerPuuid && (
                    <span className={styles.participantIndicator}>●</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 (Red Side) */}
        <div className={`${styles.teamContainer} ${styles.teamRed}`}>
          <h4 className={`${styles.teamTitle} ${styles.teamTitleRed}`}>
            Červený Tým
          </h4>

          {/* Team 2 Bans */}
          {team2Bans.length > 0 && (
            <div className={styles.bansContainer}>
              <div className={styles.bansTitle}>
                Zakázaní championové:
              </div>
              <div className={styles.bansGrid}>
                {team2Bans.map((ban, index) => (
                  <div key={index} className={styles.banItem} title={getChampionName(ban.championId)}>
                    <Image
                      src={getChampionImageUrl(ban.championId)}
                      alt={`Banned: ${getChampionName(ban.championId)}`}
                      width={24}
                      height={24}
                      style={{ borderRadius: '4px', opacity: 0.6 }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                      }}
                    />
                    <div className={styles.banOverlay}>
                      ✕
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team 2 Players */}
          <div className={styles.participantsList}>
            {team2.map((participant, index) => (
              <div
                key={participant.puuid}
                className={`${styles.participantCard} ${participant.puuid === summonerPuuid ? styles.highlighted : ''}`}
              >
                {/* Champion */}
                <Image
                  src={getChampionImageUrl(participant.championId)}
                  alt={getChampionName(participant.championId)}
                  width={32}
                  height={32}
                  className={styles.participantChampion}
                  title={getChampionName(participant.championId)}
                  onError={(e) => {
                    e.currentTarget.src = 'https://ddragon.leagueoflegends.com/cdn/15.10.1/img/champion/Aatrox.png';
                  }}
                />

                {/* Spells */}
                <div className={styles.participantSpells}>
                  <Image
                    src={getSpellImageUrl(participant.spell1Id)}
                    alt="Spell 1"
                    width={14}
                    height={14}
                    className={styles.participantSpell}
                  />
                  <Image
                    src={getSpellImageUrl(participant.spell2Id)}
                    alt="Spell 2"
                    width={14}
                    height={14}
                    className={styles.participantSpell}
                  />
                </div>

                {/* Profile Icon */}
                <Image
                  src={getProfileIconUrl(participant.profileIconId)}
                  alt="Profile Icon"
                  width={20}
                  height={20}
                  className={styles.participantIcon}
                />

                {/* Summoner Name */}
                <div className={`${styles.participantName} ${participant.puuid === summonerPuuid ? styles.highlighted : ''}`}>
                  {participant.summonerName}
                  {participant.puuid === summonerPuuid && (
                    <span className={styles.participantIndicator}>●</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className={styles.liveGameRefresh}>
        <button
          onClick={() => window.location.reload()}
          className={styles.refreshButton}
        >
          🔄 Aktualizovat Live Game
        </button>
      </div>
    </div>
  );
}
