import type { Achievement, UserStats } from './types';
import { formatOnlineTime } from './formatters';
import { ACHIEVEMENTS, calculateAchievementProgress } from './achievements';

interface AchievementsTabProps {
  stats: UserStats;
}

const CATEGORY_ORDER: Record<Achievement['category'], number> = {
  gaming: 0,
  voice: 1,
  spotify: 2,
  special: 3,
};

const isTimeBasedThreshold = (id: string): boolean =>
  id === 'marathon-gamer' || id === 'social-butterfly' || id === 'streamer';

const isSpecialNoCount = (id: string): boolean =>
  id === 'night-owl' || id === 'early-bird';

const SPECIAL_PENDING_TEXT: Record<string, string> = {
  'night-owl': 'Zkus to dnes po půlnoci',
  'early-bird': 'Zkus být aktivní brzy ráno',
};

export default function AchievementsTab({ stats }: AchievementsTabProps) {
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const pa = calculateAchievementProgress(a, stats);
    const pb = calculateAchievementProgress(b, stats);
    if (pa.unlocked !== pb.unlocked) return pa.unlocked ? -1 : 1;
    if (pa.unlocked && pb.unlocked) {
      return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    }
    return pb.progress - pa.progress;
  });

  const unlockedCount = sorted.filter(
    (a) => calculateAchievementProgress(a, stats).unlocked
  ).length;

  return (
    <section className="achievements-section">
      <div className="achievements-header">
        <h3>🏆 Úspěchy</h3>
        <span className="counter">
          {unlockedCount} / {ACHIEVEMENTS.length} odemčeno
        </span>
      </div>

      <div className="badge-grid">
        {sorted.map((achievement) => {
          const { current, unlocked, progress } = calculateAchievementProgress(achievement, stats);
          const cat = `cat-${achievement.category}`;
          return (
            <div
              key={achievement.id}
              className={`badge ${cat} ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="icon" aria-hidden="true">
                {achievement.icon}
              </div>
              <div className="title">{achievement.title}</div>
              <div className="desc">{achievement.description}</div>
              <div className="status">
                {unlocked ? (
                  <span className="done-pill">
                    <i />
                    Dokončeno
                  </span>
                ) : isSpecialNoCount(achievement.id) ? (
                  <div className="special-status">
                    {SPECIAL_PENDING_TEXT[achievement.id] ?? 'Zatím ne'}
                  </div>
                ) : (
                  <>
                    <div className="progressbar">
                      <i style={{ width: `${progress}%` }} />
                    </div>
                    <div className="progressmeta">
                      <span>
                        {isTimeBasedThreshold(achievement.id)
                          ? `${formatOnlineTime(current)} / ${formatOnlineTime(achievement.threshold)}`
                          : `${current} / ${achievement.threshold}`}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
