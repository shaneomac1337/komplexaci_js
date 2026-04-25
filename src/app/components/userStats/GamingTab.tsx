import type { UserStats } from './types';
import { formatOnlineTime } from './formatters';

interface GamingTabProps {
  stats: UserStats;
}

const formatRank = (n: number) => `#${String(n).padStart(2, '0')}`;

export default function GamingTab({ stats }: GamingTabProps) {
  const t = stats.data.totals;
  const games = stats.data.gameSessions ?? [];
  const totalGames = t.gamesPlayed || games.length;

  return (
    <>
      <section className="lounge-section">
        <div className="tab-hero accent-game">
          <span className="tab-hero-eyebrow">celkem dnes</span>
          <h3 className="tab-hero-title">🎮 Hry</h3>
          <div className="tab-hero-stats">
            <div className="stat">
              <span className="stat-label">Celkový čas</span>
              <span className="stat-value">{formatOnlineTime(t.totalGameTime)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Různých her</span>
              <span className="stat-value">{totalGames}</span>
            </div>
          </div>
        </div>
      </section>

      {games.length === 0 && (
        <div className="empty-card">
          <div className="empty-icon">🎮</div>
          <div className="empty-text">Dnes nehrál žádné hry</div>
        </div>
      )}

      {games.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Jednotlivé hry</h4>
            <ul className="lounge-list">
              {games.map((game, i) => (
                <li
                  key={game.game_name}
                  className={`lounge-list-row accent-game ${i === 0 ? 'first' : ''}`}
                >
                  <span className="rank-pill accent-game">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{game.game_name}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{formatOnlineTime(game.total_minutes)}</div>
                    <div className="metric-sub">
                      {game.session_count} {game.session_count === 1 ? 'session' : 'sessions'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lounge-footnote">Časy kumulované ze všech dokončených session</p>
          </div>
        </section>
      )}
    </>
  );
}
