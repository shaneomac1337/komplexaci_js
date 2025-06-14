import { NextResponse } from 'next/server';

export interface Weapon {
  id: string;
  name: string;
  price: string;
  stats: string;
  damage: string;
  accuracy: string;
  team: string;
  image: string;
  category: string;
}

export interface WeaponCategory {
  id: string;
  title: string;
  description: string;
  weapons: Weapon[];
}

const weaponCategories: WeaponCategory[] = [
  {
    id: 'pistole',
    title: 'Pistole',
    description: 'Pistole jsou základní zbraně, které každý hráč dostane na začátku hry. Jsou také důležité pro eco kola, kdy tým nemá dostatek peněz na plný nákup.',
    weapons: [
      {
        id: 'desert-eagle',
        name: 'Desert Eagle',
        price: '$700',
        stats: 'Vysoké poškození, přesná na první ránu',
        damage: '231 (hlava s helmou), 58 (tělo s vestou)',
        accuracy: 'Vysoká u prvé ránu, následně klesá',
        team: 'CT i T',
        image: '/cs2/weapons/desert-eagle.jpg',
        category: 'pistole'
      },
      {
        id: 'usp-s',
        name: 'USP-S',
        price: 'CT Startovní',
        stats: 'Tichá, přesná na střední vzdálenost',
        damage: '70 (hlava s helmou), 17 (tělo s vestou)',
        accuracy: 'Vysoká přesnost, malý zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/usp-s.jpg',
        category: 'pistole'
      },
      {
        id: 'glock-18',
        name: 'Glock-18',
        price: 'T Startovní',
        stats: 'Rychlá kadence, nízký zpětný ráz',
        damage: '55 (hlava s helmou), 13 (tělo s vestou)',
        accuracy: 'Střední přesnost, dobrá na blízko',
        team: 'T',
        image: '/cs2/weapons/glock-18.jpg',
        category: 'pistole'
      },
      {
        id: 'p250',
        name: 'P250',
        price: '$300',
        stats: 'Dobrý poměr cena/výkon, dobrá proti neprátelům s helmou',
        damage: '96 (hlava s helmou), 24 (tělo s vestou)',
        accuracy: 'Střední přesnost, mírný zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/p250.jpg',
        category: 'pistole'
      },
      {
        id: 'five-seven',
        name: 'Five-SeveN',
        price: '$500',
        stats: 'Vysoká kapacita zásobníku, dobrá proti neprátelům s vestou',
        damage: '115 (hlava s helmou), 28 (tělo s vestou)',
        accuracy: 'Vysoká přesnost, nízký zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/five-seven.jpg',
        category: 'pistole'
      },
      {
        id: 'tec-9',
        name: 'Tec-9',
        price: '$500',
        stats: 'Vysoká kadence, dobrá na běh a střelbu',
        damage: '119 (hlava s helmou), 29 (tělo s vestou)',
        accuracy: 'Nízká přesnost, střední zpětný ráz',
        team: 'T',
        image: '/cs2/weapons/tec-9.jpg',
        category: 'pistole'
      }
    ]
  },
  {
    id: 'smg',
    title: 'SMG (Samopal)',
    description: 'SMG jsou levnější zbraně s vysokou kadencí střelby, které jsou efektivní na blízkou až střední vzdálenost. Jsou dobrou volbou po výhře pistolkového kola.',
    weapons: [
      {
        id: 'mp9',
        name: 'MP9',
        price: '$1250',
        stats: 'Vysoká kadence, dobrá mobilita, pouze pro CT',
        damage: '61 (hlava s helmou), 15 (tělo s vestou)',
        accuracy: 'Přesná na blízko, střední zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/mp9.jpg',
        category: 'smg'
      },
      {
        id: 'mac-10',
        name: 'MAC-10',
        price: '$1050',
        stats: 'Levný, vysoká kadence, pouze pro T',
        damage: '65 (hlava s helmou), 16 (tělo s vestou)',
        accuracy: 'Nízká přesnost, vysoký zpětný ráz',
        team: 'T',
        image: '/cs2/weapons/mac-10.jpg',
        category: 'smg'
      },
      {
        id: 'mp7',
        name: 'MP7',
        price: '$1500',
        stats: 'Vyvážený samopal s dobrou přesností',
        damage: '71 (hlava s helmou), 17 (tělo s vestou)',
        accuracy: 'Dobrá přesnost, nízký zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/mp7.jpg',
        category: 'smg'
      },
      {
        id: 'mp5-sd',
        name: 'MP5-SD',
        price: '$1500',
        stats: 'Tichá alternativa k MP7 s podobnými statistikami',
        damage: '66 (hlava s helmou), 16 (tělo s vestou)',
        accuracy: 'Dobrá přesnost, nízký zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/mp5-sd.jpg',
        category: 'smg'
      },
      {
        id: 'ump-45',
        name: 'UMP-45',
        price: '$1200',
        stats: 'Silný samopal s dobrým poškozením na střední vzdálenost',
        damage: '90 (hlava s helmou), 22 (tělo s vestou)',
        accuracy: 'Střední přesnost, střední zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/ump-45.jpg',
        category: 'smg'
      },
      {
        id: 'p90',
        name: 'P90',
        price: '$2350',
        stats: '50 nábojů v zásobníku, dobrá pro začátečníky',
        damage: '71 (hlava s helmou), 17 (tělo s vestou)',
        accuracy: 'Střední přesnost, nízký zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/p90.jpg',
        category: 'smg'
      },
      {
        id: 'pp-bizon',
        name: 'PP-Bizon',
        price: '$1400',
        stats: 'Zásobník na 64 nábojů, ideální proti nepřátelům bez vesty',
        damage: '61 (hlava s helmou), 15 (tělo s vestou)',
        accuracy: 'Nízká přesnost, nízký zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/pp-bizon.jpg',
        category: 'smg'
      }
    ]
  },
  {
    id: 'pusky',
    title: 'Pušky (Rifles)',
    description: 'Pušky jsou hlavní zbraně v CS2, které poskytují dobrý poměr mezi cenou a výkonem. Jsou efektivní na všechny vzdálenosti a tvoří základ většiny nákupů.',
    weapons: [
      {
        id: 'ak-47',
        name: 'AK-47',
        price: '$2700',
        stats: 'Vysoké poškození, zabijí na jednu ránu do hlavy, pouze pro T',
        damage: '109 (hlava s helmou), 27 (tělo s vestou)',
        accuracy: 'Střední přesnost, vysoký zpětný ráz',
        team: 'T',
        image: '/cs2/weapons/ak-47.jpg',
        category: 'pusky'
      },
      {
        id: 'm4a4',
        name: 'M4A4',
        price: '$3100',
        stats: 'Vyvážená puška s nízkým zpětným rázem, pouze pro CT',
        damage: '92 (hlava s helmou), 23 (tělo s vestou)',
        accuracy: 'Vysoká přesnost, střední zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/m4a4.jpg',
        category: 'pusky'
      },
      {
        id: 'm4a1-s',
        name: 'M4A1-S',
        price: '$2900',
        stats: 'Tichá alternativa k M4A4 s menším zásobníkem, pouze pro CT',
        damage: '92 (hlava s helmou), 26 (tělo s vestou)',
        accuracy: 'Velmi vysoká přesnost, nízký zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/m4a1-s.jpg',
        category: 'pusky'
      },
      {
        id: 'famas',
        name: 'FAMAS',
        price: '$2050',
        stats: 'Levnější CT automatická puška, má režim dávkové střelby',
        damage: '84 (hlava s helmou), 21 (tělo s vestou)',
        accuracy: 'Střední přesnost, střední zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/famas.jpg',
        category: 'pusky'
      },
      {
        id: 'galil-ar',
        name: 'Galil AR',
        price: '$1800',
        stats: 'Levnější T automatická puška s velkou kapacitou zásobníku',
        damage: '92 (hlava s helmou), 23 (tělo s vestou)',
        accuracy: 'Nízká přesnost, vysoký zpětný ráz',
        team: 'T',
        image: '/cs2/weapons/galil-ar.jpg',
        category: 'pusky'
      },
      {
        id: 'aug',
        name: 'AUG',
        price: '$3300',
        stats: 'CT puška s optickým hledím pro střelbu na větší vzdálenost',
        damage: '101 (hlava s helmou), 25 (tělo s vestou)',
        accuracy: 'Velmi vysoká přesnost s hledím, nízký zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/aug.jpg',
        category: 'pusky'
      },
      {
        id: 'sg-553',
        name: 'SG 553',
        price: '$3000',
        stats: 'T puška s optickým hledím, vyšší poškození než AUG',
        damage: '120 (hlava s helmou), 30 (tělo s vestou)',
        accuracy: 'Vysoká přesnost s hledím, střední zpětný ráz',
        team: 'T',
        image: '/cs2/weapons/sg-553.jpg',
        category: 'pusky'
      }
    ]
  },
  {
    id: 'odstrelova',
    title: 'Odstřelovačky (Sniper Rifles)',
    description: 'Odstřelovačky jsou specializované zbraně pro boj na dlouhé vzdálenosti. Jsou drahé, ale mohou změnit průběh hry jediným zásahem.',
    weapons: [
      {
        id: 'awp',
        name: 'AWP',
        price: '$4750',
        stats: 'Nejsilnější zbraň ve hře, zabijí na jednu ránu do těla',
        damage: '448 (hlava s helmou), 112 (tělo s vestou)',
        accuracy: 'Velmi vysoká přesnost, silný zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/awp.jpg',
        category: 'odstrelova'
      },
      {
        id: 'ssg08',
        name: 'SSG 08',
        price: '$1700',
        stats: 'Levná odstřelovačka, zabijí na jednu ránu do hlavy',
        damage: '299 (hlava s helmou), 74 (tělo s vestou)',
        accuracy: 'Vysoká přesnost, nízký zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/ssg08.png',
        category: 'odstrelova'
      },
      {
        id: 'scar20',
        name: 'SCAR-20',
        price: '$5000',
        stats: 'Poloautomatická odstřelovačka s vysokou kadencí (CT)',
        damage: '263 (hlava s helmou), 65 (tělo s vestou)',
        accuracy: 'Vysoká přesnost, střední zpětný ráz',
        team: 'CT',
        image: '/cs2/weapons/scar20.png',
        category: 'odstrelova'
      },
      {
        id: 'g3sg1',
        name: 'G3SG1',
        price: '$5000',
        stats: 'Poloautomatická odstřelovačka s vysokou kadencí (T)',
        damage: '263 (hlava s helmou), 65 (tělo s vestou)',
        accuracy: 'Vysoká přesnost, střední zpětný ráz',
        team: 'T',
        image: '/cs2/weapons/g3sg1.png',
        category: 'odstrelova'
      }
    ]
  },
  {
    id: 'tezke',
    title: 'Těžké zbraně (Shotguns & Machine Guns)',
    description: 'Těžké zbraně zahrnují brokovnice a kulomety. Brokovnice jsou devastující na blízkou vzdálenost, zatímco kulomety poskytují masivní pal při potlačení nepřátele.',
    weapons: [
      {
        id: 'nova',
        name: 'Nova',
        price: '$1050',
        stats: 'Brokovnice s dobrým poměrem cena/výkon, vysoké poškození na blízko',
        damage: '234 (hlava), 26 (tělo) na blízko',
        accuracy: 'Rozptyl kulí, účinná pouze na krátkou vzdálenost',
        team: 'CT i T',
        image: '/cs2/weapons/nova.png',
        category: 'tezke'
      },
      {
        id: 'xm1014',
        name: 'XM1014',
        price: '$2000',
        stats: 'Poloautomatická brokovnice s vysokou kadencí',
        damage: '120 (hlava), 20 (tělo) na blízko',
        accuracy: 'Větší rozptyl kulí, vysoká kadence střelby',
        team: 'CT i T',
        image: '/cs2/weapons/xm1014.png',
        category: 'tezke'
      },
      {
        id: 'mag7',
        name: 'MAG-7',
        price: '$1300',
        stats: 'Silná CT brokovnice s kompaktním designem',
        damage: '240 (hlava), 30 (tělo) na blízko',
        accuracy: 'Malý rozptyl kulí, vysoké poškození',
        team: 'CT',
        image: '/cs2/weapons/mag-7.jpg',
        category: 'tezke'
      },
      {
        id: 'sawed-off',
        name: 'Sawed-Off',
        price: '$1100',
        stats: 'T brokovnice s extrémním poškozením na velmi blízko',
        damage: '256 (hlava), 32 (tělo) na blízko',
        accuracy: 'Velmi velký rozptyl kulí, devastující na blízko',
        team: 'T',
        image: '/cs2/weapons/sawed-off.jpg',
        category: 'tezke'
      },
      {
        id: 'm249',
        name: 'M249',
        price: '$5200',
        stats: 'Těžký kulomet s velkým zásobníkem a vysokým poškozením',
        damage: '102 (hlava s helmou), 25 (tělo s vestou)',
        accuracy: 'Nízká přesnost, velmi vysoký zpětný ráz',
        team: 'CT i T',
        image: '/cs2/weapons/m249.png',
        category: 'tezke'
      },
      {
        id: 'negev',
        name: 'Negev',
        price: '$1700',
        stats: 'Levný kulomet s unikátním systémem přesnosti',
        damage: '96 (hlava s helmou), 26 (tělo s vestou)',
        accuracy: 'Zpočátku nepřesný, postupně se zlepšuje',
        team: 'CT i T',
        image: '/cs2/weapons/negev.jpg',
        category: 'tezke'
      }
    ]
  },
  {
    id: 'granaty',
    title: 'Granáty (Grenades)',
    description: 'Granáty jsou klíčové taktické nástroje v CS2. Každý typ granátu má specifické použití a může dramaticky ovlivnit průběh kola.',
    weapons: [
      {
        id: 'hegrenade',
        name: 'HE Granát',
        price: '$300',
        stats: 'Výbušný granát způsobující poškození v oblasti',
        damage: 'Až 98 poškození v epicentru',
        accuracy: 'Poškození klesá se vzdáleností od výbuchu',
        team: 'CT i T',
        image: '/cs2/weapons/hegrenade.png',
        category: 'granaty'
      },
      {
        id: 'flashbang',
        name: 'Zábleskový granát',
        price: '$200',
        stats: 'Oslepuje a ohlušuje nepřátele',
        damage: 'Žádné přímé poškození',
        accuracy: 'Efekt závisí na vzdálenosti a směru pohledu',
        team: 'CT i T',
        image: '/cs2/weapons/flashbang.png',
        category: 'granaty'
      },
      {
        id: 'smoke',
        name: 'Kouřový granát',
        price: '$300',
        stats: 'Vytváří kouřovou clonu blokující výhled',
        damage: 'Žádné poškození',
        accuracy: 'Pokrývá velkou oblast po dobu 18 sekund',
        team: 'CT i T',
        image: '/cs2/weapons/smoke.png',
        category: 'granaty'
      },
      {
        id: 'molotov',
        name: 'Molotov',
        price: '$400',
        stats: 'Zápalný granát vytvářející ohnivou bariéru (T)',
        damage: 'Kontinuální poškození v oblasti ohně',
        accuracy: 'Pokrývá oblast po dobu 7 sekund',
        team: 'T',
        image: '/cs2/weapons/molotov.png',
        category: 'granaty'
      },
      {
        id: 'incgrenade',
        name: 'Zápalný granát',
        price: '$600',
        stats: 'Zápalný granát vytvářející ohnivou bariéru (CT)',
        damage: 'Kontinuální poškození v oblasti ohně',
        accuracy: 'Pokrývá oblast po dobu 7 sekund',
        team: 'CT',
        image: '/cs2/weapons/molotov.png',
        category: 'granaty'
      },
      {
        id: 'decoy',
        name: 'Návnadový granát',
        price: '$50',
        stats: 'Napodobuje zvuky střelby a zobrazuje falešný bod na radaru',
        damage: 'Minimální poškození při výbuchu',
        accuracy: 'Vytváří audio a vizuální klamání',
        team: 'CT i T',
        image: '/cs2/weapons/decoy.png',
        category: 'granaty'
      }
    ]
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    if (category) {
      const categoryData = weaponCategories.find(cat => cat.id === category.toLowerCase());
      if (!categoryData) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      return NextResponse.json(categoryData);
    }

    return NextResponse.json(weaponCategories);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
