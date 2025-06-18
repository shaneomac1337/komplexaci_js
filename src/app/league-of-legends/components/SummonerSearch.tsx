"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import styles from '../summoner.module.css';
import { SummonerProfile, Region, SummonerSearchState } from '../types/summoner-ui';
import SummonerCard from './SummonerCard';
import RankDisplay from './RankDisplay';
import ChampionMastery from './ChampionMastery';
import MatchHistory from './MatchHistory';
import MatchStatistics from './MatchStatistics';
import LiveGame from './LiveGame';
import PlayedWithAnalysis from './PlayedWithAnalysis';
import SearchHistory from './SearchHistory';
import EnhancedLoading from './EnhancedLoading';
import KeyboardShortcuts from './KeyboardShortcuts';
import FilterPanel, { FilterState, defaultFilterState } from './FilterPanel';
import FilterChips from './FilterChips';
import { filterMatches, filterChampionMastery, getUniqueChampions, getUniqueGameModes, calculateMatchStats, MatchData, ChampionMasteryData } from '../utils/filterUtils';

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

  // Filter state
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);

  // Memoized filtered data
  const filteredMatchHistory = useMemo(() => {
    if (!searchState.matchHistory.length || !searchState.profile) return searchState.matchHistory;

    // Convert match history to MatchData format for filtering
    const matchData: MatchData[] = searchState.matchHistory.map(match => {
      // Find the participant data for the current summoner
      const participant = match.info.participants.find(p => p.puuid === searchState.profile?.account.puuid);

      if (!participant) return null;

      return {
        ...participant,
        gameId: match.metadata.matchId,
        gameMode: match.info.gameMode,
        gameType: match.info.gameType,
        gameCreation: match.info.gameCreation,
        gameDuration: match.info.gameDuration,
        role: participant.teamPosition || participant.lane || participant.role,
        teamPosition: participant.teamPosition,
        lane: participant.lane
      };
    }).filter(Boolean) as MatchData[];

    const filteredData = filterMatches(matchData, filters);

    // Convert back to MatchHistoryEntry format by filtering original matches
    const filteredMatchIds = new Set(filteredData.map(match => match.gameId));
    return searchState.matchHistory.filter(match => filteredMatchIds.has(match.metadata.matchId));
  }, [searchState.matchHistory, searchState.profile, filters]);

  const filteredChampionMastery = useMemo(() => {
    if (!searchState.profile?.championMastery.length) return [];

    // Convert champion mastery to ChampionMasteryData format for filtering
    const masteryData: ChampionMasteryData[] = searchState.profile.championMastery.map(mastery => ({
      ...mastery,
      championId: mastery.championId.toString(),
      championName: mastery.championName || `Champion ${mastery.championId}`
    }));

    return filterChampionMastery(masteryData, filters);
  }, [searchState.profile?.championMastery, filters]);

  // Available filter options
  const availableChampions = useMemo(() => {
    if (!searchState.matchHistory.length || !searchState.profile) return [];

    const champions = new Set<string>();
    searchState.matchHistory.forEach(match => {
      const participant = match.info.participants.find(p => p.puuid === searchState.profile?.account.puuid);
      if (participant) {
        champions.add(participant.championName);
      }
    });

    return Array.from(champions).sort();
  }, [searchState.matchHistory, searchState.profile]);



  const availableGameModes = useMemo(() => {
    if (!searchState.matchHistory.length) return [];

    const gameModes = new Set<string>();
    searchState.matchHistory.forEach(match => {
      gameModes.add(match.info.gameMode);
    });

    return Array.from(gameModes).sort();
  }, [searchState.matchHistory]);

  // Load regions on component mount and check URL parameters
  useEffect(() => {
    loadRegions();
    checkUrlParameters();
  }, []);

  // Check URL parameters and auto-search if present
  const checkUrlParameters = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const summonerParam = urlParams.get('summoner');
      const regionParam = urlParams.get('region');

      // Check if we should scroll to summoner search section
      if (window.location.hash === '#summoner-search') {
        setTimeout(() => {
          const element = document.getElementById('summoner-search');
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      }

      if (summonerParam) {
        setRiotId(decodeURIComponent(summonerParam));

        if (regionParam) {
          setSearchState(prev => ({
            ...prev,
            selectedRegion: regionParam
          }));
        }

        // Auto-trigger search after a short delay to ensure state is set
        setTimeout(() => {
          performSearch(decodeURIComponent(summonerParam), regionParam || 'euw1');
        }, 100);
      }
    }
  };

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



  // Perform search with given parameters
  const performSearch = async (searchRiotId: string, searchRegion: string) => {
    if (!searchRiotId.trim()) {
      setSearchState(prev => ({ ...prev, error: 'Please enter a Riot ID' }));
      return;
    }

    // Validate Riot ID format
    if (!searchRiotId.includes('#')) {
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
      profile: null,
      selectedRegion: searchRegion
    }));

    try {
      const response = await fetch(
        `/api/lol/summoner?riotId=${encodeURIComponent(searchRiotId)}&region=${searchRegion}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch summoner data');
      }

      const profile: SummonerProfile = await response.json();

      // Load match history
      const matches = await loadMatchHistory(profile.account.puuid, 10, searchRegion);

      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        profile,
        matchHistory: matches,
        error: null
      }));

      // Add to search history
      if ((window as any).addToSearchHistory) {
        (window as any).addToSearchHistory(searchRiotId, searchRegion, {
          level: profile.summoner.summonerLevel,
          rank: profile.rankedStats.soloQueue?.tier ?
            `${profile.rankedStats.soloQueue.tier} ${profile.rankedStats.soloQueue.rank}` :
            'Unranked'
        });
      }

      // Update URL to reflect current search
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('summoner', searchRiotId);
        newUrl.searchParams.set('region', searchRegion);
        window.history.replaceState({}, '', newUrl.toString());
      }

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(riotId, searchState.selectedRegion);
  };

  const handleRegionChange = (region: string) => {
    setSearchState(prev => ({ ...prev, selectedRegion: region }));
  };



  const handleRefresh = async () => {
    if (searchState.profile && riotId) {
      await handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const loadMatchHistory = async (puuid: string, count: number = 10, region?: string) => {
    try {
      const targetRegion = region || searchState.selectedRegion;
      const response = await fetch(
        `/api/lol/matches?puuid=${puuid}&region=${targetRegion}&count=${count}`
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
    <section id="summoner-search" className={styles.summonerSearchSection}>
      <div className={styles.searchContainer}>
        <h2 className={styles.searchTitle}>Vyhledat vyvolávače</h2>
        <p className={styles.searchSubtitle}>
          Zadejte Riot ID pro zobrazení statistik, ranku a historie zápasů
        </p>

        {/* Search History */}
        <SearchHistory
          onSelectSummoner={(summonerName, region) => {
            setRiotId(summonerName);
            setSearchState(prev => ({
              ...prev,
              selectedRegion: region
            }));
            // Trigger search automatically
            setTimeout(() => {
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }, 100);
          }}
        />

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
          <EnhancedLoading
            message="Načítám summoner data"
            submessage="Získávám informace z Riot Games API..."
            showProgress={false}
          />
        )}

        {/* Error State */}
        {searchState.error && (
          <div className={styles.errorMessage}>
            <strong>Chyba:</strong> {searchState.error}

            {/* Helpful suggestions for common issues */}
            {searchState.error.includes('not found') && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                <h4 style={{ color: '#ffc107', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>💡 Tipy pro hledání:</h4>
                <ul style={{ color: '#c9aa71', fontSize: '0.8rem', margin: 0, paddingLeft: '1.2rem' }}>
                  <li>Zkontrolujte přesný formát: <code style={{ color: '#6e4ff6' }}>HerníJméno#Tag</code></li>
                  <li>Ověřte správný region (EUW, EUNE, NA, atd.)</li>
                  <li>Zkuste hledat na <a href="https://op.gg" target="_blank" style={{ color: '#10b981' }}>op.gg</a> pro ověření správného jména</li>
                  <li>Některé tagy mohou být case-sensitive (velká/malá písmena)</li>
                  <li>Zkuste jiný region, pokud si nejste jisti</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Filter Controls - Show only when profile is loaded */}
        {searchState.profile && (
          <>
            <FilterChips
              filters={filters}
              onFiltersChange={setFilters}
              onTogglePanel={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
            />



            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              availableChampions={availableChampions}
              availableGameModes={availableGameModes}
              isVisible={isFilterPanelVisible}
              onToggle={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
              matchCount={filteredMatchHistory.length}
              totalMatches={searchState.matchHistory.length}
            />
          </>
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
                  matches={filteredMatchHistory}
                  summonerPuuid={searchState.profile.account.puuid}
                />
              )}

              {/* Played With Analysis */}
              {searchState.matchHistory.length > 0 && (
                <PlayedWithAnalysis
                  matches={filteredMatchHistory}
                  summonerPuuid={searchState.profile.account.puuid}
                />
              )}

              {/* Match History */}
              {searchState.matchHistory.length > 0 && (
                <>
                  {filteredMatchHistory.length !== searchState.matchHistory.length && (
                    <div style={{
                      background: 'rgba(110, 79, 246, 0.1)',
                      border: '1px solid rgba(110, 79, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '1rem',
                      margin: '1rem 0',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#c9aa71', margin: 0 }}>
                        📊 Zobrazeno {filteredMatchHistory.length} z {searchState.matchHistory.length} zápasů na základě aktivních filtrů
                      </p>
                    </div>
                  )}
                  <MatchHistory
                    matches={filteredMatchHistory}
                    summonerPuuid={searchState.profile.account.puuid}
                    onLoadMore={handleLoadMoreMatches}
                    isLoading={searchState.isLoading}
                  />
                </>
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

          {/* Riot ID Helper */}
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary style={{ color: '#6e4ff6', cursor: 'pointer', fontSize: '0.9rem' }}>
              🔍 Jak najít svůj Riot ID?
            </summary>
            <div style={{
              marginTop: '0.5rem',
              padding: '1rem',
              background: 'rgba(110, 79, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(110, 79, 246, 0.3)'
            }}>
              <ol style={{ color: '#c9aa71', fontSize: '0.8rem', margin: 0, paddingLeft: '1.2rem' }}>
                <li>Otevřete League of Legends klienta</li>
                <li>V pravém horním rohu uvidíte své jméno a tag (např. "YourName#EUW")</li>
                <li>Nebo se podívejte do hry - vaše Riot ID je zobrazeno v profilu</li>
                <li>Můžete také zkontrolovat na <a href="https://op.gg" target="_blank" style={{ color: '#10b981' }}>op.gg</a></li>
                <li>Pokud máte starý účet, váš tag může být region (EUW, EUNE, NA1, atd.)</li>
              </ol>

              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '4px' }}>
                <strong style={{ color: '#ffc107', fontSize: '0.8rem' }}>⚠️ Poznámka:</strong>
                <span style={{ color: '#c9aa71', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  Některé uživatele s velmi specifickými tagy nemusí být dostupní přes API
                </span>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
    </section>
  );
}
