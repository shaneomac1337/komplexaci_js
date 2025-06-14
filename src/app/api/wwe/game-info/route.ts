import { NextResponse } from 'next/server';
import { WWEGameInfo } from '@/app/types/wwe';

// WWE Games Information
const wweGameInfo: WWEGameInfo = {
  title: "WWE Games",
  description: "Kompletní kolekce WWE/WWF her od legendárního SmackDown! na PlayStation až po moderní série. Zažijte nostalgii wrestlingových klasik a epických zápasů, které definovaly žánr wrestlingových her.",
  basicInfo: {
    developer: "THQ, 2K Sports, Acclaim Entertainment",
    publisher: "THQ, 2K Sports, Acclaim Entertainment",
    firstGame: "MicroLeague Wrestling (1987)",
    latestGame: "WWE 2K25 (2025)",
    genre: "Sports/Wrestling",
    platforms: "PlayStation, Xbox, Nintendo, PC",
    totalGames: "50+"
  },
  legacy: {
    title: "WWE Games Legacy",
    description: "WWE hry představují více než 35 let vývoje wrestlingových her, od prvních arkádových klasik až po moderní simulace s nejpokročilejšími funkcemi.",
    highlights: [
      "Průkopnické arkádové hry WWF Superstars a WrestleFest",
      "Legendární série SmackDown! na PlayStation",
      "Revolučních AKI engine v No Mercy",
      "Moderní 2K série s MyCareer módem",
      "Více než 50 her napříč všemi platformami",
      "Ikonické momenty z historie wrestlingu"
    ]
  }
};

export async function GET() {
  try {
    return NextResponse.json(wweGameInfo);
  } catch (error) {
    console.error('Error fetching WWE game info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WWE game info' },
      { status: 500 }
    );
  }
}