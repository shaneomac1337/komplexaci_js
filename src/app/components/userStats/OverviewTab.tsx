import type { UserStats } from './types';
import { formatDate, formatOnlineTime } from './formatters';

interface OverviewTabProps {
  stats: UserStats;
}

const tonePillForPercentile = (p: number): string => {
  if (p >= 90) return 'top-90';
  if (p >= 75) return 'top-75';
  if (p >= 50) return 'top-50';
  return 'top-low';
};

const sessionTone = (type: string): 'tone-game' | 'tone-voice' | 'tone-spotify' | 'tone-default' => {
  if (type === 'game') return 'tone-game';
  if (type === 'voice') return 'tone-voice';
  if (type === 'spotify') return 'tone-spotify';
  return 'tone-default';
};

interface ComparisonPillProps {
  vsAverage?: number;
  percentile?: number;
  isTimeValue?: boolean;
  fallback?: string;
}

function ComparisonPill({ vsAverage, percentile, isTimeValue = true, fallback }: ComparisonPillProps) {
  if (vsAverage === undefined && percentile === undefined) {
    return fallback ? <span className="pill faint">{fallback}</span> : null;
  }
  if (percentile !== undefined) {
    return (
      <span className={`pill ${tonePillForPercentile(percentile)}`}>
        Top {Math.max(1, 100 - percentile)}%
      </span>
    );
  }
  if (vsAverage! > 0) {
    return (
      <span className="pill up">
        ↑ +{isTimeValue ? formatOnlineTime(vsAverage!) : Math.round(vsAverage!)} vs průměr
      </span>
    );
  }
  if (vsAverage! < 0) {
    return (
      <span className="pill down">
        ↓ {isTimeValue ? formatOnlineTime(Math.abs(vsAverage!)) : Math.round(Math.abs(vsAverage!))} vs průměr
      </span>
    );
  }
  return <span className="pill eq">= průměr</span>;
}

export default function OverviewTab({ stats }: OverviewTabProps) {
  const t = stats.data.totals;
  const sa = stats.data.serverAverages;
  const p = stats.data.percentiles;

  const recent = (stats.data.recentSessions ?? []).slice(0, 8);

  return (
    <>
      <div className="overview-hero">
        <div className="eyebrow">Dnes online</div>
        <p className="headline">{formatOnlineTime(t.totalOnlineTime)}</p>
        <p className="sub">online dnes</p>
        {sa && (
          <div className="compare-line">
            srovnání s {sa.totalActiveUsers} aktivními · live tracking
          </div>
        )}
      </div>

      <div className="hero-tiles">
        <div className="hero-tile tone-game">
          <span className="label">Hry</span>
          <span className="value">{formatOnlineTime(t.totalGameTime)}</span>
          <ComparisonPill
            vsAverage={sa ? t.totalGameTime - sa.avgGameTime : undefined}
            percentile={p?.gameTimePercentile}
          />
        </div>
        <div className="hero-tile tone-voice">
          <span className="label">Voice</span>
          <span className="value">{formatOnlineTime(t.totalVoiceTime)}</span>
          <ComparisonPill
            vsAverage={sa ? t.totalVoiceTime - sa.avgVoiceTime : undefined}
            percentile={p?.voiceTimePercentile}
          />
        </div>
        <div className="hero-tile tone-spotify">
          <span className="label">Spotify</span>
          <span className="value">{t.totalSongsPlayed}</span>
          <ComparisonPill
            vsAverage={sa ? t.totalSongsPlayed - sa.avgSongsPlayed : undefined}
            percentile={p?.songsPlayedPercentile}
            isTimeValue={false}
          />
        </div>
        <div className="hero-tile tone-stream">
          <span className="label">Stream</span>
          <span className="value">{formatOnlineTime(t.totalScreenShareTime || 0)}</span>
          <ComparisonPill fallback="bez srovnání" />
        </div>
      </div>

      <div className="micro-strip">
        <div className="item">
          <span className="micro-label">Různých her</span>
          <span className="micro-value">{t.gamesPlayed || 0}</span>
        </div>
        <div className="item">
          <span className="micro-label">Voice kanálů</span>
          <span className="micro-value">{t.voiceChannelsUsed || 0}</span>
        </div>
        <div className="item">
          <span className="micro-label">Různých interpretů</span>
          <span className="micro-value">{t.artistsListened || 0}</span>
        </div>
        <div className="item">
          <span className="micro-label">Screen share</span>
          <span className="micro-value">{formatOnlineTime(t.totalScreenShareTime || 0)}</span>
        </div>
      </div>

      {recent.length > 0 && (
        <>
          <p className="timeline-heading">Dnešní aktivita</p>
          <ul className="timeline-list">
            {recent.map((session, i) => (
              <li key={`${session.start_time}-${i}`} className={`timeline-row ${sessionTone(session.type)}`}>
                <span className="time">{formatDate(session.start_time)}</span>
                <div className="body">
                  <span className="dot" />
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{session.name}</div>
                    {session.details && <div className="details">{session.details}</div>}
                  </div>
                </div>
                <span className="duration">{formatOnlineTime(session.duration_minutes)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
