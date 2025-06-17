"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../summoner.module.css';
import { MatchHistoryEntry, MatchHistoryProps } from '../types/summoner-ui';

export default function MatchHistory({ matches, summonerPuuid, onLoadMore, isLoading }: MatchHistoryProps) {
  const [displayedMatches, setDisplayedMatches] = useState<MatchHistoryEntry[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);


  useEffect(() => {
    setDisplayedMatches(matches);
  }, [matches]);

  // Get summoner's participant data from match
  const getSummonerParticipant = (match: MatchHistoryEntry) => {
    return match.info.participants.find(p => p.puuid === summonerPuuid);
  };

  // Format game duration
  const formatGameDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format time ago
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

  // Get game mode display name
  const getGameModeDisplay = (queueId: number) => {
    const queueMap: Record<number, string> = {
      420: 'Ranked Solo',
      440: 'Ranked Flex',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind',
      700: 'Clash',
      1700: 'Arena',
      1900: 'URF',
      900: 'URF',
      1020: 'One for All'
    };
    
    return queueMap[queueId] || 'Custom';
  };

  // Get KDA ratio
  const getKDADisplay = (kills: number, deaths: number, assists: number) => {
    const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
    return {
      text: `${kills}/${deaths}/${assists}`,
      ratio: kda.toFixed(2),
      color: kda >= 3 ? '#10b981' : kda >= 2 ? '#f59e0b' : kda >= 1 ? '#6b7280' : '#ef4444'
    };
  };

  // Get item image URL
  const getItemImageUrl = (itemId: number) => {
    if (itemId === 0) return null;
    return `https://ddragon.leagueoflegends.com/cdn/15.10.1/img/item/${itemId}.png`;
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

  // Load more matches
  const handleLoadMore = async () => {
    if (onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true);
      await onLoadMore();
      setIsLoadingMore(false);
    }
  };



  if (!matches || matches.length === 0) {
    return (
      <div className={styles.matchHistorySection}>
        <h3 className={styles.matchHistoryTitle}>Historie Zápasů</h3>
        <p style={{ color: '#c9aa71', textAlign: 'center', padding: '2rem' }}>
          Žádná historie zápasů není k dispozici.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.matchHistorySection}>
      <h3 className={styles.matchHistoryTitle}>
        Historie Zápasů 
        <span style={{ 
          fontSize: '1rem', 
          fontWeight: 'normal', 
          color: '#c9aa71',
          marginLeft: '0.5rem'
        }}>
          ({displayedMatches.length} zápasů)
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {displayedMatches.map((match, index) => {
          const participant = getSummonerParticipant(match);
          if (!participant) return null;

          const kdaInfo = getKDADisplay(participant.kills, participant.deaths, participant.assists);
          const items = [
            participant.item0, participant.item1, participant.item2,
            participant.item3, participant.item4, participant.item5, participant.item6
          ];

          return (
            <div 
              key={match.metadata.matchId} 
              className={`${styles.matchCard} ${participant.win ? styles.win : styles.loss}`}
            >
              {/* Match Result & Time */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                <div className={`${styles.matchResult} ${participant.win ? styles.win : styles.loss}`}>
                  {participant.win ? 'Výhra' : 'Prohra'}
                </div>
                <div className={styles.matchDuration}>
                  {formatGameDuration(match.info.gameDuration)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                  {formatTimeAgo(match.info.gameEndTimestamp)}
                </div>
              </div>

              {/* Champion & Spells */}
              <div className={styles.matchChampion}>
                {participant.championImage && (
                  <Image
                    src={participant.championImage}
                    alt={participant.championName}
                    width={48}
                    height={48}
                    className={styles.matchChampionImage}
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Image
                    src={getSpellImageUrl(participant.summoner1Id)}
                    alt="Spell 1"
                    width={20}
                    height={20}
                    style={{ borderRadius: '2px', cursor: 'pointer' }}
                    title={`Summoner Spell ${participant.summoner1Id}`}
                  />
                  <Image
                    src={getSpellImageUrl(participant.summoner2Id)}
                    alt="Spell 2"
                    width={20}
                    height={20}
                    style={{ borderRadius: '2px', cursor: 'pointer' }}
                    title={`Summoner Spell ${participant.summoner2Id}`}
                  />
                </div>
              </div>

              {/* KDA */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                <div className={styles.matchKDA} style={{ color: kdaInfo.color }}>
                  {kdaInfo.text}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c9aa71' }}>
                  {kdaInfo.ratio} KDA
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                  Level {participant.champLevel}
                </div>
              </div>

              {/* Items */}
              <div className={styles.itemGrid}>
                {items.map((itemId, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`${styles.itemSlot} ${itemId === 0 ? styles.empty : ''}`}
                  >
                    {itemId !== 0 && getItemImageUrl(itemId) && (
                      <Image
                        src={getItemImageUrl(itemId)!}
                        alt={`Item ${itemId}`}
                        width={24}
                        height={24}
                        style={{ borderRadius: '2px' }}
                        title={`Item ${itemId}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Game Mode & Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '120px' }}>
                <div style={{ fontSize: '0.9rem', color: '#f0e6d2', fontWeight: '600' }}>
                  {getGameModeDisplay(match.info.queueId)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c9aa71' }}>
                  {participant.totalMinionsKilled + participant.neutralMinionsKilled} CS
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                  {Math.round(participant.totalDamageDealtToChampions / 1000)}k DMG
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {onLoadMore && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore || isLoading}
            style={{
              background: 'linear-gradient(135deg, #6e4ff6, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '0.75rem 2rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: isLoadingMore || isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoadingMore || isLoading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {isLoadingMore ? 'Načítám...' : 'Načíst více zápasů'}
          </button>
        </div>
      )}
    </div>
  );
}
