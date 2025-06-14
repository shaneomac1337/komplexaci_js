import { NextResponse } from 'next/server';

export interface GameInfo {
  title: string;
  description: string;
  basicInfo: {
    developer: string;
    releaseDate: string;
    genre: string;
    platform: string;
    model: string;
    engine: string;
    esport: string;
  };
  mechanics: {
    title: string;
    description: string;
    features: string[];
  };
  screenshots: string[];
  schema: {
    name: string;
    description: string;
    url: string;
    image: string;
    genre: string;
    operatingSystem: string;
    applicationCategory: string;
    publisher: {
      name: string;
    };
    aggregateRating: {
      ratingValue: string;
      reviewCount: string;
    };
    playMode: string[];
    gamePlatform: string[];
  };
}

const gameInfo: GameInfo = {
  title: 'Counter-Strike 2',
  description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive. Hra staví proti sobě dva týmy - teroristy a protiteroristickou jednotku - v různých herních režimech. CS2 přináší vylepšenou grafiku, fyziku, zvuky a nový systém kouřových granátů díky přechodu na Source 2 engine.',
  basicInfo: {
    developer: 'Valve Corporation',
    releaseDate: '27. září 2023',
    genre: 'FPS (First-Person Shooter), Taktická střílečka',
    platform: 'PC (Steam)',
    model: 'Free-to-play',
    engine: 'Source 2',
    esport: 'Jedna z největších esportových her na světě'
  },
  mechanics: {
    title: 'Herní mechaniky',
    description: 'Counter-Strike 2 je známý svou hloubkou a vysokým stropem dovedností. Klíčové herní mechaniky zahrnují:',
    features: [
      'Ekonomický systém - nakupování zbraní a vybavení na začátku každého kola',
      'Přesná střelba a kontrola zpětného rázu',
      'Taktické využití granátů (kouřové, zábleskové, výbušné, molotovy)',
      'Týmová komunikace a strategie',
      'Map control a informační hra',
      'Sub-tick aktualizace - přesnější registrace zásahů a pohybu'
    ]
  },
  screenshots: [
    'https://developer.valvesoftware.com/w/images/4/43/Software_Cover_-_Counter-Strike_2.png',
    'https://developer.valvesoftware.com/w/images/4/4b/Counter-Strike_2_-_ar_baggage.png',
    'https://developer.valvesoftware.com/w/images/2/21/Counter-Strike_2_-_ar_shoots.png',
    'https://developer.valvesoftware.com/w/images/d/dd/Cs_italy_png.png',
    'https://developer.valvesoftware.com/w/images/1/12/Cs_office_png.png',
    'https://developer.valvesoftware.com/w/images/4/4d/Counter-Strike_2_-_de_ancient.png',
    'https://developer.valvesoftware.com/w/images/9/9f/Counter-Strike_2_-_de_ancient_1.png',
    'https://developer.valvesoftware.com/w/images/1/1d/Counter-Strike_2_-_de_ancient_2.png',
    'https://developer.valvesoftware.com/w/images/d/d4/De_anubis_png.png',
    'https://developer.valvesoftware.com/w/images/4/49/De_anubis_1_png.png',
    'https://developer.valvesoftware.com/w/images/0/0c/Counter-Strike_2_-_de_dust2.png',
    'https://developer.valvesoftware.com/w/images/f/ff/Counter-Strike_2_-_de_dust2_1.png',
    'https://developer.valvesoftware.com/w/images/0/07/Counter-Strike_2_-_de_dust2_2.png',
    'https://developer.valvesoftware.com/w/images/a/ad/De_inferno_png.png',
    'https://developer.valvesoftware.com/w/images/6/61/De_inferno_1_png.png',
    'https://developer.valvesoftware.com/w/images/6/6f/Counter-Strike_2_-_de_mirage.png',
    'https://developer.valvesoftware.com/w/images/4/42/Counter-Strike_2_-_de_mirage_1.png',
    'https://developer.valvesoftware.com/w/images/6/64/Counter-Strike_2_-_de_mirage_2.png',
    'https://developer.valvesoftware.com/w/images/e/e9/Counter-Strike_2_-_de_nuke.png',
    'https://developer.valvesoftware.com/w/images/c/c6/Counter-Strike_2_-_de_nuke_1.png',
    'https://developer.valvesoftware.com/w/images/f/fc/Counter-Strike_2_-_de_overpass_2.png',
    'https://developer.valvesoftware.com/w/images/8/8a/Counter-Strike_2_-_de_train.png',
    'https://developer.valvesoftware.com/w/images/c/ca/Counter-Strike_2_-_de_vertigo_0.png',
    'https://developer.valvesoftware.com/w/images/f/f9/Counter-Strike_2_-_de_vertigo_1.png'
  ],
  schema: {
    name: 'Counter-Strike 2',
    description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive. Hra staví proti sobě dva týmy - teroristy a protiteroristickou jednotku - v různých herních režimech.',
    url: 'https://www.komplexaci.cz/cs2',
    image: 'https://www.komplexaci.cz/cs2/cs2.jpg',
    genre: 'FPS',
    operatingSystem: 'Windows',
    applicationCategory: 'Game',
    publisher: {
      name: 'Valve Corporation'
    },
    aggregateRating: {
      ratingValue: '4.7',
      reviewCount: '5000000'
    },
    playMode: ['MultiPlayer'],
    gamePlatform: ['PCGamePlatform']
  }
};

export async function GET() {
  try {
    return NextResponse.json(gameInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
