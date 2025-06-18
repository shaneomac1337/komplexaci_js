'use client';

import { useState } from 'react';
import styles from './FilterPanel.module.css';

export interface FilterState {
  // Match History Filters
  champions: string[];
  gameModes: string[];
  results: 'all' | 'wins' | 'losses';
  dateRange: 'all' | '7days' | '30days' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  roles: string[];
  
  // Performance Filters
  minKDA?: number;
  maxKDA?: number;
  minDamage?: number;
  maxDamage?: number;
  
  // Champion Mastery Filters
  masteryLevels: number[];
  minMasteryPoints?: number;
  maxMasteryPoints?: number;
  
  // Game Duration Filters
  gameDuration: 'all' | 'short' | 'normal' | 'long';
}

export const defaultFilterState: FilterState = {
  champions: [],
  gameModes: [],
  results: 'all',
  dateRange: 'all',
  roles: [],
  masteryLevels: [],
  gameDuration: 'all'
};

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableChampions: string[];
  availableGameModes: string[];
  isVisible: boolean;
  onToggle: () => void;
  matchCount?: number;
  totalMatches?: number;
}

const GAME_MODES = [
  { id: 'RANKED_SOLO_5x5', name: 'Ranked Solo/Duo' },
  { id: 'RANKED_FLEX_SR', name: 'Ranked Flex' },
  { id: 'NORMAL_DRAFT', name: 'Normal Draft' },
  { id: 'NORMAL_BLIND', name: 'Normal Blind' },
  { id: 'ARAM', name: 'ARAM' },
  { id: 'URF', name: 'URF' },
  { id: 'ONE_FOR_ALL', name: 'One for All' }
];

const ROLES = [
  { id: 'TOP', name: 'Top', icon: '🛡️' },
  { id: 'JUNGLE', name: 'Jungle', icon: '🌲' },
  { id: 'MIDDLE', name: 'Mid', icon: '⚡' },
  { id: 'BOTTOM', name: 'ADC', icon: '🏹' },
  { id: 'UTILITY', name: 'Support', icon: '💚' },
  { id: 'NONE', name: 'Neznámá', icon: '❓' }
];

export default function FilterPanel({
  filters,
  onFiltersChange,
  availableChampions,
  availableGameModes,
  isVisible,
  onToggle,
  matchCount = 0,
  totalMatches = 0
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['matches']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleChampion = (champion: string) => {
    const newChampions = filters.champions.includes(champion)
      ? filters.champions.filter(c => c !== champion)
      : [...filters.champions, champion];
    updateFilters({ champions: newChampions });
  };

  const toggleGameMode = (gameMode: string) => {
    const newGameModes = filters.gameModes.includes(gameMode)
      ? filters.gameModes.filter(g => g !== gameMode)
      : [...filters.gameModes, gameMode];
    updateFilters({ gameModes: newGameModes });
  };

  const toggleRole = (role: string) => {
    const newRoles = filters.roles.includes(role)
      ? filters.roles.filter(r => r !== role)
      : [...filters.roles, role];
    updateFilters({ roles: newRoles });
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilterState);
  };

  const hasActiveFilters = () => {
    return filters.champions.length > 0 ||
           filters.gameModes.length > 0 ||
           filters.results !== 'all' ||
           filters.dateRange !== 'all' ||
           filters.roles.length > 0 ||
           filters.gameDuration !== 'all' ||
           filters.masteryLevels.length > 0;
  };

  return (
    <div className={`${styles.filterPanel} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.filterHeader}>
        <div className={styles.filterTitle}>
          <span>🔍 Filtry</span>
          <button onClick={onToggle} className={styles.toggleButton}>
            {isVisible ? '✕' : '☰'}
          </button>
        </div>
        
        {matchCount !== undefined && totalMatches !== undefined && (
          <div className={styles.resultCount}>
            Zobrazeno: {matchCount} z {totalMatches}
          </div>
        )}
        
        {hasActiveFilters() && (
          <button onClick={clearAllFilters} className={styles.clearButton}>
            Vymazat vše
          </button>
        )}
      </div>

      <div className={styles.filterContent}>
        {/* Match History Filters */}
        <div className={styles.filterSection}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('matches')}
          >
            <span>📊 Historie zápasů</span>
            <span className={`${styles.arrow} ${expandedSections.has('matches') ? styles.expanded : ''}`}>
              ▼
            </span>
          </button>
          
          {expandedSections.has('matches') && (
            <div className={styles.sectionContent}>
              {/* Result Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Výsledek:</label>
                <div className={styles.buttonGroup}>
                  {[
                    { id: 'all', name: 'Vše' },
                    { id: 'wins', name: 'Výhry' },
                    { id: 'losses', name: 'Prohry' }
                  ].map(result => (
                    <button
                      key={result.id}
                      className={`${styles.filterButton} ${filters.results === result.id ? styles.active : ''}`}
                      onClick={() => updateFilters({ results: result.id as any })}
                    >
                      {result.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Období:</label>
                <div className={styles.buttonGroup}>
                  {[
                    { id: 'all', name: 'Vše' },
                    { id: '7days', name: '7 dní' },
                    { id: '30days', name: '30 dní' }
                  ].map(range => (
                    <button
                      key={range.id}
                      className={`${styles.filterButton} ${filters.dateRange === range.id ? styles.active : ''}`}
                      onClick={() => updateFilters({ dateRange: range.id as any })}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Role:</label>
                <div className={styles.roleGrid}>
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      className={`${styles.roleButton} ${filters.roles.includes(role.id) ? styles.active : ''}`}
                      onClick={() => toggleRole(role.id)}
                      title={role.name}
                    >
                      <span className={styles.roleIcon}>{role.icon}</span>
                      <span className={styles.roleName}>{role.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Duration Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Délka hry:</label>
                <div className={styles.buttonGroup}>
                  {[
                    { id: 'all', name: 'Vše' },
                    { id: 'short', name: 'Krátké (<20min)' },
                    { id: 'normal', name: 'Normální (20-35min)' },
                    { id: 'long', name: 'Dlouhé (35min+)' }
                  ].map(duration => (
                    <button
                      key={duration.id}
                      className={`${styles.filterButton} ${filters.gameDuration === duration.id ? styles.active : ''}`}
                      onClick={() => updateFilters({ gameDuration: duration.id as any })}
                    >
                      {duration.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Champion Filter */}
        {availableChampions.length > 0 && (
          <div className={styles.filterSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('champions')}
            >
              <span>🏆 Championové ({filters.champions.length})</span>
              <span className={`${styles.arrow} ${expandedSections.has('champions') ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.has('champions') && (
              <div className={styles.sectionContent}>
                <div className={styles.championGrid}>
                  {availableChampions.slice(0, 20).map(champion => (
                    <button
                      key={champion}
                      className={`${styles.championButton} ${filters.champions.includes(champion) ? styles.active : ''}`}
                      onClick={() => toggleChampion(champion)}
                      title={champion}
                    >
                      {champion}
                    </button>
                  ))}
                </div>
                {availableChampions.length > 20 && (
                  <div className={styles.moreChampions}>
                    +{availableChampions.length - 20} dalších...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
