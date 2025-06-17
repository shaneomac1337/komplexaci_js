"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../summoner.module.css';
import { SummonerProfile, Region, SummonerSearchState } from '../types/summoner-ui';
import SummonerCard from './SummonerCard';
import RankDisplay from './RankDisplay';
import ChampionMastery from './ChampionMastery';
import MatchHistory from './MatchHistory';
import MatchStatistics from './MatchStatistics';
import LiveGame from './LiveGame';

interface SummonerSearchProps {
  onProfileFound?: (profile: SummonerProfile) => void;
}

export default function SummonerSearch({ onProfileFound }: SummonerSearchProps) {
  const [searchState, setSearchState] = useState<SummonerSearchState>({
    isLoading: false,
    error: null,
    profile: null,
    matchHistory: [],
    selectedRegion: 'euw1'
  });

  const [riotId, setRiotId] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);

  // Load regions on component mount
  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const response = await fetch('/api/lol/regions');
      if (response.ok) {
        const data = await response.json();
        setRegions(data.regions);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!riotId.trim()) {
      setSearchState(prev => ({ ...prev, error: 'Please enter a Riot ID' }));
      return;
    }

    // Validate Riot ID format
    if (!riotId.includes('#')) {
      setSearchState(prev => ({ 
        ...prev, 
        error: 'Invalid Riot ID format. Use: gameName#tagLine (e.g., Faker#T1)' 
      }));
      return;
    }

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      profile: null
    }));

    try {
      const response = await fetch(
        `/api/lol/summoner?riotId=${encodeURIComponent(riotId)}&region=${searchState.selectedRegion}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch summoner data');
      }

      const profile: SummonerProfile = await response.json();

      // Load match history
      const matches = await loadMatchHistory(profile.account.puuid, 10);

      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        profile,
        matchHistory: matches,
        error: null
      }));

      // Notify parent component
      if (onProfileFound) {
        onProfileFound(profile);
      }

    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));
    }
  };

  const handleRegionChange = (region: string) => {
    setSearchState(prev => ({ ...prev, selectedRegion: region }));
  };

  const handleRefresh = async () => {
    if (searchState.profile && riotId) {
      await handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const loadMatchHistory = async (puuid: string, count: number = 10) => {
    try {
      const response = await fetch(
        `/api/lol/matches?puuid=${puuid}&region=${searchState.selectedRegion}&count=${count}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch match history');
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error('Error loading match history:', error);
      return [];
    }
  };

  const handleLoadMoreMatches = async () => {
    if (searchState.profile) {
      const newMatches = await loadMatchHistory(
        searchState.profile.account.puuid,
        searchState.matchHistory.length + 10
      );
      setSearchState(prev => ({
        ...prev,
        matchHistory: newMatches
      }));
    }
  };

  const refreshLiveGame = async () => {
    if (searchState.profile) {
      try {
        const response = await fetch(
          `/api/lol/live-game?puuid=${searchState.profile.account.puuid}&region=${searchState.selectedRegion}`
        );

        if (response.ok) {
          const data = await response.json();
          setSearchState(prev => ({
            ...prev,
            profile: prev.profile ? {
              ...prev.profile,
              isInGame: data.inGame,
              currentGame: data.gameInfo || undefined
            } : null
          }));
        }
      } catch (error) {
        console.error('Error refreshing live game:', error);
      }
    }
  };

  // Auto-refresh live game every 30 seconds if in game
  useEffect(() => {
    if (searchState.profile?.isInGame) {
      const interval = setInterval(refreshLiveGame, 30000);
      return () => clearInterval(interval);
    }
  }, [searchState.profile?.isInGame]);

  return (
    <section className={styles.summonerSearchSection}>
      <div className={styles.searchContainer}>
        <h2 className={styles.searchTitle}>Hledat Summoner</h2>
        <p className={styles.searchSubtitle}>
          Zadejte Riot ID pro zobrazení statistik, ranku a historie zápasů
        </p>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="gameName#tagLine (např. Faker#T1)"
            className={styles.searchInput}
            disabled={searchState.isLoading}
          />
          
          <select
            value={searchState.selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className={styles.regionSelect}
            disabled={searchState.isLoading}
          >
            {regions.map(region => (
              <option key={region.code} value={region.code}>
                {region.flag} {region.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={searchState.isLoading}
            className={styles.searchButton}
          >
            {searchState.isLoading ? 'Hledám...' : 'Hledat'}
          </button>
        </form>

        {/* Loading State */}
        {searchState.isLoading && (
          <div className={styles.loadingSpinner}></div>
        )}

        {/* Error State */}
        {searchState.error && (
          <div className={styles.errorMessage}>
            <strong>Chyba:</strong> {searchState.error}
          </div>
        )}

        {/* Success State - Summoner Profile */}
        {searchState.profile && (
          <div className={styles.summonerCard}>
            <div className={styles.summonerCardContent}>
              <SummonerCard 
                profile={searchState.profile}
                onRefresh={handleRefresh}
                isRefreshing={searchState.isLoading}
              />
              
              <RankDisplay rankedStats={searchState.profile.rankedStats} />

              {/* Live Game - Show prominently if in game */}
              {searchState.profile.isInGame && searchState.profile.currentGame && (
                <LiveGame
                  currentGame={searchState.profile.currentGame}
                  summonerPuuid={searchState.profile.account.puuid}
                />
              )}

              <ChampionMastery
                championMastery={searchState.profile.championMastery}
                maxDisplay={5}
              />

              {/* Match Statistics */}
              {searchState.matchHistory.length > 0 && (
                <MatchStatistics
                  matches={searchState.matchHistory}
                  summonerPuuid={searchState.profile.account.puuid}
                />
              )}

              {/* Match History */}
              {searchState.matchHistory.length > 0 && (
                <MatchHistory
                  matches={searchState.matchHistory}
                  summonerPuuid={searchState.profile.account.puuid}
                  onLoadMore={handleLoadMoreMatches}
                  isLoading={searchState.isLoading}
                />
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#c9aa71', fontSize: '0.9rem' }}>
            💡 <strong>Tip:</strong> Riot ID se skládá z herního jména a tagu oddělených #<br/>
            Například: <code style={{ color: '#6e4ff6' }}>Faker#T1</code> nebo <code style={{ color: '#6e4ff6' }}>YourName#EUW</code>
          </p>
        </div>
      </div>
    </section>
  );
}
