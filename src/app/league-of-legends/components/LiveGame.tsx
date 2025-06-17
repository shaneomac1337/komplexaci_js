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

  // Debug: Log the game data to see what we're receiving
  useEffect(() => {
    if (currentGame) {
      console.log('🔍 Live Game Debug - Full game data:', currentGame);
      console.log('🔍 Live Game Debug - Participants:', currentGame.participants);
      currentGame.participants.forEach((participant, index) => {
        console.log(`🔍 Participant ${index}:`, {
          summonerName: participant.summonerName,
          championId: participant.championId,
          puuid: participant.puuid
        });
      });
    }
  }, [currentGame]);

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
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        onClick={() => {
                          const currentUrl = new URL(window.location.href);
                          const region = currentUrl.searchParams.get('region') || 'eun1';
                          const summonerUrl = `/league-of-legends?summoner=${encodeURIComponent(participant.summonerName)}&region=${region}`;
                          window.open(summonerUrl, '_blank');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: participant.puuid === summonerPuuid ? '#6e4ff6' : '#f0e6d2',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: participant.puuid === summonerPuuid ? 'bold' : 'normal',
                          textDecoration: 'underline',
                          padding: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = participant.puuid === summonerPuuid ? '#6e4ff6' : '#f0e6d2';
                        }}
                        title={`Klikněte pro zobrazení profilu ${participant.summonerName}`}
                      >
                        {participant.summonerName}
                      </button>
                      {participant.puuid === summonerPuuid && (
                        <span className={styles.participantIndicator}>●</span>
                      )}
                    </div>
                    {/* Champion Name */}
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#c9aa71',
                      marginTop: '1px'
                    }}>
                      {getChampionName(participant.championId)}
                    </div>
                  </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        onClick={() => {
                          const currentUrl = new URL(window.location.href);
                          const region = currentUrl.searchParams.get('region') || 'eun1';
                          const summonerUrl = `/league-of-legends?summoner=${encodeURIComponent(participant.summonerName)}&region=${region}`;
                          window.open(summonerUrl, '_blank');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: participant.puuid === summonerPuuid ? '#6e4ff6' : '#f0e6d2',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: participant.puuid === summonerPuuid ? 'bold' : 'normal',
                          textDecoration: 'underline',
                          padding: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = participant.puuid === summonerPuuid ? '#6e4ff6' : '#f0e6d2';
                        }}
                        title={`Klikněte pro zobrazení profilu ${participant.summonerName}`}
                      >
                        {participant.summonerName}
                      </button>
                      {participant.puuid === summonerPuuid && (
                        <span className={styles.participantIndicator}>●</span>
                      )}
                    </div>
                    {/* Champion Name */}
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#c9aa71',
                      marginTop: '1px'
                    }}>
                      {getChampionName(participant.championId)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.liveGameRefresh}>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            className={styles.refreshButton}
          >
            🔄 Aktualizovat
          </button>

          <button
            onClick={() => {
              const gameInfo = `
🔴 Live Game - ${getGameModeDisplay(gameData.gameQueueConfigId)}
📍 ${getMapName(gameData.mapId)}
⏱️ ${formatGameDuration(gameTimer)}

🔵 Modrý Tým:
${team1.map(p => `• ${p.summonerName} (${getChampionName(p.championId)})`).join('\n')}

🔴 Červený Tým:
${team2.map(p => `• ${p.summonerName} (${getChampionName(p.championId)})`).join('\n')}

${team1Bans.length > 0 ? `\n🚫 Bany Modrý: ${team1Bans.map(b => getChampionName(b.championId)).join(', ')}` : ''}
${team2Bans.length > 0 ? `🚫 Bany Červený: ${team2Bans.map(b => getChampionName(b.championId)).join(', ')}` : ''}
              `.trim();

              navigator.clipboard.writeText(gameInfo).then(() => {
                // Show temporary success message
                const button = document.activeElement as HTMLButtonElement;
                const originalText = button.textContent;
                button.textContent = '✅ Zkopírováno!';
                button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                setTimeout(() => {
                  button.textContent = originalText;
                  button.style.background = 'linear-gradient(135deg, #6e4ff6, #8b5cf6)';
                }, 2000);
              }).catch(() => {
                alert('Nepodařilo se zkopírovat do schránky');
              });
            }}
            style={{
              background: 'linear-gradient(135deg, #6e4ff6, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(110, 79, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            📋 Kopírovat Info
          </button>
        </div>
      </div>
    </div>
  );
}
