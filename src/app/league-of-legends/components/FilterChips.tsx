'use client';

import { FilterState } from './FilterPanel';
import styles from './FilterChips.module.css';

interface FilterChipsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onTogglePanel: () => void;
}

const GAME_MODE_NAMES: { [key: string]: string } = {
  'RANKED_SOLO_5x5': 'Ranked Solo/Duo',
  'RANKED_FLEX_SR': 'Ranked Flex',
  'NORMAL_DRAFT': 'Normal Draft',
  'NORMAL_BLIND': 'Normal Blind',
  'ARAM': 'ARAM',
  'URF': 'URF',
  'ONE_FOR_ALL': 'One for All'
};

const ROLE_NAMES: { [key: string]: string } = {
  'TOP': 'Top',
  'JUNGLE': 'Jungle',
  'MIDDLE': 'Mid',
  'BOTTOM': 'ADC',
  'UTILITY': 'Support',
  'NONE': 'Neznámá'
};

const ROLE_ICONS: { [key: string]: string } = {
  'TOP': '🛡️',
  'JUNGLE': '🌲',
  'MIDDLE': '⚡',
  'BOTTOM': '🏹',
  'UTILITY': '💚',
  'NONE': '❓'
};

export default function FilterChips({ filters, onFiltersChange, onTogglePanel }: FilterChipsProps) {
  const removeChampion = (champion: string) => {
    const newChampions = filters.champions.filter(c => c !== champion);
    onFiltersChange({ ...filters, champions: newChampions });
  };

  const removeGameMode = (gameMode: string) => {
    const newGameModes = filters.gameModes.filter(g => g !== gameMode);
    onFiltersChange({ ...filters, gameModes: newGameModes });
  };

  const removeRole = (role: string) => {
    const newRoles = filters.roles.filter(r => r !== role);
    onFiltersChange({ ...filters, roles: newRoles });
  };

  const clearResult = () => {
    onFiltersChange({ ...filters, results: 'all' });
  };

  const clearDateRange = () => {
    onFiltersChange({ ...filters, dateRange: 'all' });
  };

  const clearGameDuration = () => {
    onFiltersChange({ ...filters, gameDuration: 'all' });
  };

  const clearMasteryLevels = () => {
    onFiltersChange({ ...filters, masteryLevels: [] });
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

  const clearAllFilters = () => {
    onFiltersChange({
      champions: [],
      gameModes: [],
      results: 'all',
      dateRange: 'all',
      roles: [],
      masteryLevels: [],
      gameDuration: 'all'
    });
  };

  if (!hasActiveFilters()) {
    return (
      <div className={styles.filterChipsContainer}>
        <button onClick={onTogglePanel} className={styles.filterToggle}>
          <span>🔍</span>
          <span>Filtry</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.filterChipsContainer}>
      <div className={styles.filterChipsHeader}>
        <button onClick={onTogglePanel} className={styles.filterToggle}>
          <span>🔍</span>
          <span>Filtry</span>
        </button>
        <span className={styles.activeFiltersText}>Aktivní filtry:</span>
        <button onClick={clearAllFilters} className={styles.clearAllButton}>
          Vymazat vše
        </button>
      </div>

      <div className={styles.chipsContainer}>
        {/* Champion Chips */}
        {filters.champions.map(champion => (
          <div key={`champion-${champion}`} className={styles.chip} data-chip-type="champion">
            <span className={styles.chipIcon}>🏆</span>
            <span className={styles.chipText}>{champion}</span>
            <button
              onClick={() => removeChampion(champion)}
              className={styles.chipRemove}
              title={`Odstranit ${champion}`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Game Mode Chips */}
        {filters.gameModes.map(gameMode => (
          <div key={`gamemode-${gameMode}`} className={styles.chip} data-chip-type="gamemode">
            <span className={styles.chipIcon}>🎮</span>
            <span className={styles.chipText}>{GAME_MODE_NAMES[gameMode] || gameMode}</span>
            <button
              onClick={() => removeGameMode(gameMode)}
              className={styles.chipRemove}
              title={`Odstranit ${GAME_MODE_NAMES[gameMode] || gameMode}`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Role Chips */}
        {filters.roles.map(role => (
          <div key={`role-${role}`} className={styles.chip}>
            <span className={styles.chipIcon}>{ROLE_ICONS[role] || '⚔️'}</span>
            <span className={styles.chipText}>{ROLE_NAMES[role] || role}</span>
            <button
              onClick={() => removeRole(role)}
              className={styles.chipRemove}
              title={`Odstranit ${ROLE_NAMES[role] || role}`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Result Chip */}
        {filters.results !== 'all' && (
          <div className={styles.chip} data-chip-type={filters.results === 'wins' ? 'result-win' : 'result-loss'}>
            <span className={styles.chipIcon}>
              {filters.results === 'wins' ? '✅' : '❌'}
            </span>
            <span className={styles.chipText}>
              {filters.results === 'wins' ? 'Pouze výhry' : 'Pouze prohry'}
            </span>
            <button
              onClick={clearResult}
              className={styles.chipRemove}
              title="Odstranit filtr výsledků"
            >
              ✕
            </button>
          </div>
        )}

        {/* Date Range Chip */}
        {filters.dateRange !== 'all' && (
          <div className={styles.chip} data-chip-type="date">
            <span className={styles.chipIcon}>📅</span>
            <span className={styles.chipText}>
              {filters.dateRange === '7days' ? 'Posledních 7 dní' :
               filters.dateRange === '30days' ? 'Posledních 30 dní' :
               'Vlastní období'}
            </span>
            <button
              onClick={clearDateRange}
              className={styles.chipRemove}
              title="Odstranit filtr období"
            >
              ✕
            </button>
          </div>
        )}

        {/* Game Duration Chip */}
        {filters.gameDuration !== 'all' && (
          <div className={styles.chip} data-chip-type="duration">
            <span className={styles.chipIcon}>⏱️</span>
            <span className={styles.chipText}>
              {filters.gameDuration === 'short' ? 'Krátké hry' :
               filters.gameDuration === 'normal' ? 'Normální hry' :
               'Dlouhé hry'}
            </span>
            <button
              onClick={clearGameDuration}
              className={styles.chipRemove}
              title="Odstranit filtr délky hry"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mastery Level Chips */}
        {filters.masteryLevels.length > 0 && (
          <div className={styles.chip}>
            <span className={styles.chipIcon}>⭐</span>
            <span className={styles.chipText}>
              Mastery {filters.masteryLevels.join(', ')}
            </span>
            <button
              onClick={clearMasteryLevels}
              className={styles.chipRemove}
              title="Odstranit filtr mastery úrovní"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
