// Static member data for Komplexáci clan
// This data is server-rendered for SEO visibility

export interface MemberStat {
  label: string;
  value: string;
}

export interface Member {
  id: string;
  name: string;
  realName: string;
  role: string;
  image: string;
  bio: string;
  stats: MemberStat[];
}

export const members: Member[] = [
  {
    id: 'barber',
    name: 'Barber',
    realName: 'Lukáš Čechura',
    role: 'CS2 Expert',
    image: '/komplexaci/img/barber.gif',
    bio: 'CS2 expert s neuvěřitelnou přesností a reflexy. Když není na serveru, trénuje své dovednosti v aim labu.',
    stats: [
      { label: 'Oblíbený interpret', value: 'Viktor Sheen' },
      { label: 'Oblíbená hra', value: 'CS2' },
      { label: 'KD Ratio', value: '1.8' }
    ]
  },
  {
    id: 'zander',
    name: 'Zander',
    realName: 'Petr Jakša',
    role: 'Pařmen',
    image: '/komplexaci/img/zander.gif',
    bio: 'Týpeček, co nikdy nepohrdne kvalitním hraním, má bohatou knihovnu her jak na PC tak na konzoli.',
    stats: [
      { label: 'Herní role', value: 'Pařmen' },
      { label: 'Oblíbená hra', value: 'Všechny' },
      { label: 'Hláška', value: 'Kokot zaprcanej' }
    ]
  },
  {
    id: 'shane',
    name: 'shaneomac',
    realName: 'Martin Pěnkava',
    role: 'WebMaster',
    image: '/komplexaci/img/shane.gif',
    bio: 'Digitální mág zodpovědný za webové stránky klanu. Moc skillu ve hře nepobral. Má rád wrestling',
    stats: [
      { label: 'Tech stack', value: 'HTML, CSS, JavaScript, PHP, React' },
      { label: 'Oblíbená hra', value: 'Retro pářky' },
      { label: 'Hodiny ve hře', value: '2500+' }
    ]
  },
  {
    id: 'jugyna',
    name: 'Jugyna',
    realName: 'Jan Šváb',
    role: 'Hasič',
    image: '/komplexaci/img/jugyna.gif',
    bio: 'Jugec jako správný požárník hasí každou vypjatou situaci ve hře, posléze žízeň.',
    stats: [
      { label: 'Oblíbená zbraň', value: 'Proudnice typu C' },
      { label: 'Oblíbená mapa', value: 'Inferno' },
      { label: 'Uspěšnost hašení', value: '100%' }
    ]
  },
  {
    id: 'pipa',
    name: 'Pípa',
    realName: 'Josef Pech',
    role: 'NPC',
    image: '/komplexaci/img/pipa.gif',
    bio: 'Pípa je takovej divnej pokémon ze Vstiše, kdysi generátor random hlášek.',
    stats: [
      { label: 'Status', value: 'Dead na midu na Cache' },
      { label: 'Oblíbená aktivita', value: 'LAN Party' },
      { label: 'Citát', value: '"Je ve ventilaci, Pípí bajzn,"' }
    ]
  },
  {
    id: 'strix',
    name: 'MartinStrix',
    realName: 'Martin Poláček',
    role: 'Strix prostě',
    image: '/komplexaci/img/martin-strix.gif',
    bio: 'Záhadný hráč s nevyzpytatelným herním stylem. Nikdy nevíte, co udělá - ani on sám.',
    stats: [
      { label: 'Herní styl', value: 'Chaotické dobro' },
      { label: 'Specialita', value: 'Překvapivé tahy' },
      { label: 'Hlášky', value: '"Hej čím, whooo booost"' }
    ]
  },
  {
    id: 'azarin',
    name: 'Azarin',
    realName: 'Adam Soukup',
    role: 'Rapper',
    image: '/komplexaci/img/azarin.gif',
    bio: 'Nadějný Rapper, nejčernější běloch v KompG skupině.',
    stats: [
      { label: 'Hudební styl', value: 'Mumble rap' },
      { label: 'Herní role', value: 'Entry Fragger' },
      { label: 'Informace', value: 'Shen je v latu od lvl 3' }
    ]
  },
  {
    id: 'podri',
    name: 'Podri',
    realName: 'David Podroužek',
    role: 'Tryharder',
    image: '/komplexaci/img/podri.gif',
    bio: 'Největší naděje KompG skupiny za posledních 100 let.',
    stats: [
      { label: 'Oblíbená činnost', value: 'Jízda na skůtru' },
      { label: 'Specialita', value: 'Chodil do třídy s Azarinem' },
      { label: 'Vybavení', value: 'Na Hollywoodech měl dlažební kostku' }
    ]
  },
  {
    id: 'zdravicko',
    name: 'Zdravíčko',
    realName: 'Václav Průcha',
    role: 'Žolík',
    image: '/komplexaci/img/zdravicko.gif',
    bio: 'Zdravíčko je takové eso v rukávu Komplexácké komunity, do akce bývá povolán zpravidla v případě největší potřeby. Nejnovější přírůstek v KompG klanu. Milovník zlevněného zboží.',
    stats: [
      { label: 'Oblíbená činnost', value: 'Scrollovat 9gag' },
      { label: 'Zaměstnání', value: 'Šťouchač brambor' },
      { label: 'Motto', value: 'Život dává a bere' }
    ]
  },
  {
    id: 'roseck',
    name: 'Roseck',
    realName: 'Vladimír Rathouský',
    role: 'Stratég',
    image: '/komplexaci/img/roseck.gif',
    bio: 'Někdejší stratég komplexácké skupiny, Roseck měl vždy plné kapsy plánů od A až do Z a dokázal predikovat, jakým směrem se hra bude ubírat, na kontě má několik strategický zářezů včetně legendárního divu na topu v Night Cupu.',
    stats: [
      { label: 'Label', value: 'TNKDLBL' },
      { label: 'Umístění', value: 'Ostrava pyčo' },
      { label: 'Hobby', value: 'Poslech kvalitního zvuku' }
    ]
  }
];

// Games data
export const games = [
  {
    title: 'League of Legends',
    description: 'MOBA hra od Riot Games, ve které se specializujeme na týmové strategie a kompetitivní hraní.',
    image: '/komplexaci/img/lol.jpg',
    link: '/league-of-legends'
  },
  {
    title: 'Counter Strike 2',
    description: 'FPS střílečka od Valve, ve které zdokonalujeme naše týmové taktiky, reflexy a přesnost.',
    image: '/komplexaci/img/cs2.jpg',
    link: '/cs2'
  },
  {
    title: 'WWE Games',
    description: 'Kolekce wrestlingových her od legendárního SmackDown! až po moderní série. Zažijte nostalgii a epické zápasy.',
    image: '/komplexaci/img/wwe-main.jpg',
    link: '/wwe-games'
  }
];
