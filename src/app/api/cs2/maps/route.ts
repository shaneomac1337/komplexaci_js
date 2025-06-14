import { NextResponse } from 'next/server';

export interface GameMap {
  id: string;
  name: string;
  description: string;
  image: string;
  type: 'defusal' | 'hostage' | 'wingman';
  active: boolean;
  releaseDate?: string;
  features: string[];
}

const maps: GameMap[] = [
  {
    id: 'ancient',
    name: 'Ancient',
    description: 'Modern jungle-themed map with tight corridors and open bombsites, requiring strategic utility use and map control.',
    image: '/cs2/maps/ancient.jpg',
    type: 'defusal',
    active: true,
    releaseDate: '2020-12-03',
    features: ['Jungle theme', 'Vertical gameplay', 'Water features', 'Tight corridors']
  },
  {
    id: 'anubis',
    name: 'Anubis',
    description: 'Egyptian-themed map with water features, vertical gameplay, and unique rotations between bombsites.',
    image: '/cs2/maps/anubis.jpg',
    type: 'defusal',
    active: true,
    releaseDate: '2021-05-21',
    features: ['Egyptian theme', 'Water elements', 'Complex rotations', 'Multiple levels']
  },
  {
    id: 'dust2',
    name: 'Dust II',
    description: 'Nejpopulárnější mapa v historii Counter-Strike. Pouštní prostředí s dvěma bombsity, známé pro své dlouhé linie pohledu a vyváženost pro obě strany.',
    image: '/cs2/maps/dust2.jpg',
    type: 'defusal',
    active: true,
    releaseDate: '2001-03-13',
    features: ['Iconic design', 'Long sightlines', 'Balanced gameplay', 'Desert theme']
  },
  {
    id: 'inferno',
    name: 'Inferno',
    description: 'Mapa zasazená v italském městečku s úzkými uličkami a dvěma bombsity. Známá pro svou "banana" a intenzivní boje o kontrolu klíčových bodů.',
    image: '/cs2/maps/inferno.jpg',
    type: 'defusal',
    active: true,
    releaseDate: '1999-08-19',
    features: ['Italian village', 'Narrow passages', 'Banana control', 'Close quarters']
  },
  {
    id: 'mirage',
    name: 'Mirage',
    description: 'Mapa inspirovaná marockým městem s otevřeným středem a dvěma bombsity. Nabízí mnoho možností pro kreativní využití kouřových granátů a flashek.',
    image: '/cs2/maps/mirage.jpg',
    type: 'defusal',
    active: true,
    releaseDate: '2013-06-11',
    features: ['Moroccan theme', 'Open mid area', 'Utility-heavy', 'Balanced rotations']
  },
  {
    id: 'nuke',
    name: 'Nuke',
    description: 'Jaderná elektrárna s několika úrovněmi a možnostmi vertikálního pohybu. Vyžaduje precizní týmovou práci a znalost mapy.',
    image: '/cs2/maps/nuke.jpg',
    type: 'defusal',
    active: true,
    releaseDate: '2000-05-01',
    features: ['Nuclear plant', 'Vertical gameplay', 'Multiple levels', 'CT-sided']
  },
  {
    id: 'train',
    name: 'Train',
    description: 'Průmyslová mapa s vlaky a otevřenými prostory, vhodná pro dlouhé linie pohledu a rychlé rotace mezi bombsity.',
    image: '/cs2/maps/train.jpg',
    type: 'defusal',
    active: true,
    releaseDate: '2000-05-01',
    features: ['Industrial theme', 'Train cars', 'Long sightlines', 'Fast rotations']
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active');
  const type = searchParams.get('type');

  try {
    let filteredMaps = maps;

    if (active === 'true') {
      filteredMaps = filteredMaps.filter(map => map.active);
    }

    if (type) {
      filteredMaps = filteredMaps.filter(map => map.type === type);
    }

    return NextResponse.json(filteredMaps);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
