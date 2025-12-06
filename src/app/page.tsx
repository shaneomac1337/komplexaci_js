import { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import { members, games } from '@/data/members';

export const metadata: Metadata = {
  title: 'Komplexáci - Gaming Community',
  description: `Komplexáci je česká gaming komunita s ${members.length} aktivními členy. Hrajeme League of Legends, Counter Strike 2, WWE Games a další. Členové: ${members.map(m => m.name).join(', ')}.`,
  keywords: ['gaming', 'clan', 'komplexaci', 'CS2', 'League of Legends', 'WWE Games', ...members.map(m => m.name)],
  openGraph: {
    title: 'Komplexáci - Gaming Community',
    description: 'Česká gaming komunita zaměřená na týmové hry a soutěžní hraní.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      {/* Hidden SEO content - visible to crawlers in initial HTML */}
      <div className="sr-only" aria-hidden="true" suppressHydrationWarning>
        <h1>Komplexáci Gaming Clan</h1>
        <section>
          <h2>Naši členové</h2>
          <ul>
            {members.map((member) => (
              <li key={member.id}>
                <strong>{member.name}</strong> ({member.realName}) - {member.role}: {member.bio}
                <ul>
                  {member.stats.map((stat, idx) => (
                    <li key={idx}>{stat.label}: {stat.value}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Naše hry</h2>
          <ul>
            {games.map((game) => (
              <li key={game.title}>
                <strong>{game.title}</strong>: {game.description}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Client-side interactive homepage */}
      <HomePageClient members={members} games={games} />
    </>
  );
}
