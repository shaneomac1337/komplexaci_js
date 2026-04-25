import type { UserStats } from './types';

interface SpotifyTabProps {
  stats: UserStats;
}

const formatRank = (n: number) => `#${String(n).padStart(2, '0')}`;

export default function SpotifyTab({ stats }: SpotifyTabProps) {
  const t = stats.data.totals;
  const artists = stats.data.spotifyActivity ?? [];
  const tracks = stats.data.topTracks ?? [];
  const totalArtists = t.artistsListened || artists.length;

  const noActivity = artists.length === 0 && tracks.length === 0;

  return (
    <>
      <section className="lounge-section">
        <div className="tab-hero accent-spotify">
          <span className="tab-hero-eyebrow">celkem dnes</span>
          <h3 className="tab-hero-title">🎵 Spotify</h3>
          <div className="tab-hero-stats">
            <div className="stat">
              <span className="stat-label">Celkem písní</span>
              <span className="stat-value">{t.totalSongsPlayed}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Různých interpretů</span>
              <span className="stat-value">{totalArtists}</span>
            </div>
          </div>
        </div>
      </section>

      {noActivity && (
        <div className="empty-card">
          <div className="empty-icon">🎵</div>
          <div className="empty-text">Dnes ještě žádná hudba</div>
        </div>
      )}

      {artists.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Top interpreti</h4>
            <ul className="lounge-list">
              {artists.map((artist, i) => (
                <li
                  key={artist.artist}
                  className={`lounge-list-row accent-spotify ${i === 0 ? 'first' : ''}`}
                >
                  <span className="rank-pill accent-spotify">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{artist.artist}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{artist.plays_count}</div>
                    <div className="metric-sub">{artist.plays_count === 1 ? 'píseň' : 'písní'}</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lounge-footnote">Počty kumulované za celý den</p>
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section className="lounge-section">
          <div className="lounge-panel-card">
            <h4 className="panel-title">Top písně</h4>
            <ul className="lounge-list">
              {tracks.map((track, i) => (
                <li
                  key={`${track.track_name}-${track.artist}`}
                  className={`lounge-list-row accent-spotify ${i === 0 ? 'first' : ''}`}
                >
                  <span className="rank-pill accent-spotify">{formatRank(i + 1)}</span>
                  <div className="row-body">
                    <div className="row-name">{track.track_name}</div>
                    <div className="row-sub">{track.artist}</div>
                  </div>
                  <div className="row-metric">
                    <div className="metric-primary">{track.play_count}×</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="lounge-footnote">Přehrání kumulovaná za celý den</p>
          </div>
        </section>
      )}
    </>
  );
}
