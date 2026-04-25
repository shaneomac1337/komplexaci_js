import HomePageClient from './HomePageClient';
import { members, games } from '@/data/members';

export default function HomePage() {
  return <HomePageClient members={members} games={games} />;
}
