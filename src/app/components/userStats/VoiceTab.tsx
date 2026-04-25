import type { UserStats } from './types';
import { formatOnlineTime } from './formatters';

interface VoiceTabProps {
  stats: UserStats;
}

const formatRank = (n: number) => `#${String(n).padStart(2, '0')}`;

export default function VoiceTab({ stats }: VoiceTabProps) {
  const t = stats.data.totals;
  const channels = stats.data.voiceActivity ?? [];

  return (
    <>
      <section className="lounge-section">
        <div className="tab-hero accent-voice">
          <span className="tab-hero-eyebrow">celkem dnes</span>
          <h3 className="tab-hero-title">🎤 Voice</h3>
          <div className="tab-hero-stats">
            <div className="stat">
              <span className="stat-label">Celkový čas</span>
              <span className="stat-value">{formatOnlineTime(t.totalVoiceTime)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Screen share</span>
              <span className="stat-value">{formatOnlineTime(t.totalScreenShareTime || 0)}</span>
            </div>
          </div>
        </div>
      </section>

      {channels.length === 0 && (
        <div className="empty-card">
          <div className="empty-icon">🎤</div>
          <div className="empty-text">Dnes nebyl v žádném kanálu</div>
        </div>
      )}

      {channels.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Kanály</h4>
            <ul className="lounge-list">
              {channels.map((ch, i) => (
                <li
                  key={ch.channel_name}
                  className={`lounge-list-row accent-voice ${i === 0 ? 'first' : ''}`}
                >
                  <span className="rank-pill accent-voice">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{ch.channel_name}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{formatOnlineTime(ch.total_minutes)}</div>
                    <div className="metric-sub">
                      {ch.session_count} {ch.session_count === 1 ? 'session' : 'sessions'}
                      {ch.screen_share_minutes > 0 && ` · ${formatOnlineTime(ch.screen_share_minutes)} share`}
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
