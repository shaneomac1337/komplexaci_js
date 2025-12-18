import { NextResponse } from 'next/server';
import { WWEEra } from '@/app/types/wwe';

// WWE Games Data - Complete Collection
const wweErasData: WWEEra[] = [
  {
    id: 'golden',
    title: 'Golden Era',
    subtitle: '1984 - 1993',
    description: 'Éra Hulkamanie! Doba Hulk Hogana, Ultimate Warriora a prvních WWF her. Období, které položilo základy pro všechny budoucí wrestling hry a definovalo populární kulturu 80. a začátku 90. let.',
    years: '1984-1993',
    games: [
      {
        id: 'microleague-1987',
        title: 'MicroLeague Wrestling',
        year: 1987,
        platform: 'Commodore 64, Atari ST',
        description: 'Historicky první oficiální WWF licencovaná hra! Vyvinutá MicroLeague jako součást jejich sportovní série, tato průkopnická simulace nabízela strategický gameplay založený na výběru tahů. Obsahovala legendární souboje Hulk Hogan vs. "Macho Man" Randy Savage a Hulk Hogan vs. "Mr. Wonderful" Paul Orndorff.',
        features: ['První oficiální WWF hra', 'Golden Era debut', 'Historický význam', 'Retro klasika'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/microleague-wrestling-1987.jpg',
        era: 'golden',
        series: 'standalone'
      },
      {
        id: 'wwf-superstars-1989',
        title: 'WWF Superstars',
        year: 1989,
        platform: 'Arcade',
        description: 'První arkádová WWF hra od Technōs Japan (tvůrci Double Dragon)! Postavená na upraveném Double Dragon II enginu, nabízela tag-team akční gameplay s šesti wrestlery včetně Hulk Hogana, Ultimate Warriora, Big Boss Mana a Hacksaw Jim Duggana.',
        features: ['První arkádová WWF hra', 'Hulk Hogan, Ultimate Warrior', 'Rychlý akční gameplay', 'Golden Era roster'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-superstars-1989.jpg',
        era: 'golden',
        series: 'arcade'
      },
      {
        id: 'wwf-wrestlefest-1991',
        title: 'WWF WrestleFest',
        year: 1991,
        platform: 'Arcade',
        description: 'Absolutní arkádová legenda od Technōs Japan! Pokračování WWF Superstars s revolučními herními módy: "Saturday Night\'s Main Event" (tag-team turnaj) a "Royal Rumble" (battle royal). Obsahovala 10 wrestlerů včetně Hulk Hogana, Ultimate Warriora, Earthquake a Legion of Doom.',
        features: ['Arkádová legenda', 'Royal Rumble mód', 'Tag Team Championship', 'Ikonický soundtrack', 'Legion of Doom, Big Boss Man', 'Dokonalý arkádový gameplay'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-wrestlefest-1991.jpg',
        era: 'golden',
        series: 'arcade'
      },
      {
        id: 'wwf-royal-rumble-1993',
        title: 'WWF Royal Rumble',
        year: 1993,
        platform: 'SNES, Genesis',
        description: 'Průkopnická konzolová hra na přelomu ér! První domácí hra s plnohodnotným Royal Rumble módem pro až 4 hráče. Obsahovala 12 wrestlerů z přechodného období včetně Yokozuny, Bret Harta, Razor Ramona a Lex Lugera.',
        features: ['První konzolový Royal Rumble', 'Yokozuna, Bret Hart', '16-bit grafika', 'Multiplayer podpora', 'Authentic WWF experience', 'Golden Era finale'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-royal-rumble-1993.jpg',
        era: 'golden',
        series: 'standalone'
      }
    ]
  },
  {
    id: 'new-generation',
    title: 'New Generation Era',
    subtitle: '1993 - 1997',
    description: 'Éra nové generace! Doba Bret Harta, Shawn Michaelse a Undertakera. Přechod od Hulkamanie k mladším, atletičtějším wrestlerům, který připravil půdu pro nadcházející Attitude Era.',
    years: '1993-1997',
    games: [
      {
        id: 'wwf-raw-1994',
        title: 'WWF Raw',
        year: 1994,
        platform: 'SNES, Genesis, 32X, Game Boy',
        description: 'První hra pojmenovaná podle Monday Night Raw! Vydaná během vrcholu New Generation Era s Bret Hartem, Yokozunou a Undertakerem. Přinesla realistický wrestling gameplay s authentic WWF atmosférou a roster z přechodného období mezi Golden Era a Attitude Era.',
        features: ['První Raw branded hra', 'New Generation Era roster', 'Bret Hart, Yokozuna, Undertaker', 'Multi-platform release', '16-bit wrestling action', 'Authentic WWF experience'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-raw-1994.jpg',
        era: 'new-generation',
        series: 'standalone'
      },
      {
        id: 'wwf-in-your-house-1996',
        title: 'WWF In Your House',
        year: 1996,
        platform: 'PlayStation, Sega Saturn, PC',
        description: 'Pojmenovaná podle populárních In Your House Pay-Per-View eventů! Vydaná na konci New Generation Era s Shawn Michaelsem, Bret Hartem a začínajícím Stone Cold Stevem Austinem. První WWF hra na 32-bit konzolích s vylepšenou grafikou a gameplay mechanikami.',
        features: ['In Your House PPV theme', 'První 32-bit WWF hra', 'Shawn Michaels, Bret Hart', 'Stone Cold debut', 'Enhanced graphics', 'New Generation finale'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-in-your-house-1996.jpg',
        era: 'new-generation',
        series: 'standalone'
      }
    ]
  },
  {
    id: 'attitude',
    title: 'Attitude Era',
    subtitle: '1997 - 2002',
    description: 'Nejlegendárnější éra WWE/WWF historie! Doba Stone Cold Steve Austina, The Rocka, DX a Monday Night Wars. Hry z této éry zachycují surovou energii a rebelský duch, který definoval wrestling na přelomu tisíciletí.',
    years: '1997-2002',
    games: [
      {
        id: 'wwf-war-zone-1998',
        title: 'WWF War Zone',
        year: 1998,
        platform: 'Nintendo 64, PlayStation',
        description: 'Herní debut Attitude Era! Vyvinutá Acclaim Entertainment, testa hra představila Stone Cold Steve Austina jako hlavní hvězdu a přinesla realistický wrestling gameplay s motion capture technologií. Obsahovala 18 wrestlerů z vrcholu Attitude Era včetně The Rocka, Mankinda a DX.',
        features: ['Attitude Era debut', 'Stone Cold Steve Austin', 'Realistický wrestling', 'Create-a-Wrestler', 'Hardcore matches', 'Multiplayer battles'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-war-zone-1998.jpg',
        era: 'attitude',
        series: 'n64'
      },
      {
        id: 'wwf-attitude-1999',
        title: 'WWF Attitude',
        year: 1999,
        platform: 'Nintendo 64, PlayStation',
        description: 'Vylepšené pokračování War Zone s rozšířeným rosterem 40 wrestlerů! Přineslo vylepšený engine, lepší animace a autentickou Attitude Era atmosféru s The Rockem, Mankinem a Stone Cold Stevem Austinem.',
        features: ['Vylepšený War Zone engine', 'The Rock, Mankind', 'Expanded roster', 'Better animations', 'Hardcore Championship', 'Attitude Era storylines'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-attitude-1999.jpg',
        era: 'attitude',
        series: 'n64'
      },
      {
        id: 'wwf-wrestlemania-2000',
        title: 'WWF WrestleMania 2000',
        year: 1999,
        platform: 'Nintendo 64',
        description: 'První hra od AKI Corporation! Přinesla revoluční AKI engine, který se stal standardem pro wrestling hry. Začátek legendy s Triple H, The Rockem a dokonalým 4-player multiplayer gameplay.',
        features: ['Revoluční AKI engine', 'Triple H, The Rock', '4-player multiplayer', 'Road to WrestleMania', 'Create-a-Wrestler', 'Smooth gameplay'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-wrestlemania-2000-1999.jpg',
        era: 'attitude',
        series: 'n64'
      },
      {
        id: 'wwf-no-mercy-2000',
        title: 'WWF No Mercy',
        year: 2000,
        platform: 'Nintendo 64',
        description: 'Absolutní král wrestling her! Vyvinutá AKI Corporation jako vrchol jejich legendárního enginu, tato hra je dodnes považována za nejlepší wrestling hru všech dob. Obsahovala 65+ wrestlerů z vrcholu Attitude Era, včetně Chris Jericha, Kurt Angla a The Rocka.',
        features: ['Nejlepší wrestling hra ever', 'Dokonalý AKI engine', 'Chris Jericho, Kurt Angle', 'Championship mode', 'Ladder matches', 'Nekonečná zábava'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-no-mercy-2000.jpg',
        era: 'attitude',
        series: 'n64'
      },
      {
        id: 'wwf-smackdown-1999',
        title: 'WWF SmackDown!',
        year: 1999,
        platform: 'PlayStation',
        description: 'Hra, která začala legendu! Vydaná v době vrcholu Attitude Ery, kdy WWE dominovali Stone Cold Steve Austin, The Rock a DX. První WWF SmackDown! přinesla revoluci do wrestlingových her s intuitivním ovládáním a autentickou atmosférou WWE.',
        features: ['První hra série SmackDown!', 'Revoluční ovládání pro PlayStation', 'Roster z vrcholu Attitude Ery', 'Stone Cold, The Rock, Mankind', 'Season Mode s storylinami', 'Create-a-Wrestler mód'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-smackdown-1999.jpg',
        era: 'attitude',
        series: 'smackdown'
      },
      {
        id: 'wwf-smackdown-2-kyr-2000',
        title: 'WWF SmackDown! 2: Know Your Role',
        year: 2000,
        platform: 'PlayStation',
        description: 'Pokračování v době vrcholu Attitude Ery s Triple H jako šampionem a vzestupem The Rock. Zdokonalilo originál s více wrestlery, vylepšenými animacemi a hlubším Season Mode.',
        features: ['Rozšířený roster z Attitude Ery', 'Triple H, The Rock, Undertaker', 'Vylepšený Season Mode', 'Nové zápasové typy', 'Lepší grafika a animace', 'Hardcore Championship'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-smackdown-2-kyr-2000.jpg',
        era: 'attitude',
        series: 'smackdown'
      },
      {
        id: 'wwf-smackdown-jbi-2001',
        title: 'WWF SmackDown! Just Bring It',
        year: 2001,
        platform: 'PlayStation 2',
        description: 'První SmackDown! na PlayStation 2 během WCW/ECW Invasion! Přechod na novou generaci konzolí přinesl dramatické vylepšení grafiky a nové možnosti během jednoho z nejdůležitějších období WWE.',
        features: ['První SmackDown! na PS2', 'WCW/ECW Invasion era', 'Výrazně vylepšená grafika', 'Nové arény a prostředí', 'Rozšířené customizace', 'Alliance vs. WWE storylines'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-smackdown-jbi-2001.jpg',
        era: 'attitude',
        series: 'smackdown'
      },
      {
        id: 'wwf-raw-2002',
        title: 'WWF Raw',
        year: 2002,
        platform: 'Xbox, PC',
        description: 'Konec Attitude Era s posledním WWF brandingem! Vydaná těsně před přechodem na WWE branding, tato hra zachycuje závěr legendární éry s Stone Cold Stevem Austinem, The Rockem a Undertakerem. První wrestling hra exkluzivně pro Xbox.',
        features: ['Poslední WWF branded hra', 'Attitude Era finale', 'Xbox exclusive debut', 'Stone Cold, The Rock', 'Enhanced graphics', 'Realistic animations'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwf-raw-2002.jpg',
        era: 'attitude',
        series: 'standalone'
      }
    ]
  },
  {
    id: 'ruthless',
    title: 'Ruthless Aggression Era',
    subtitle: '2002 - 2008',
    description: 'Éra nových hvězd jako John Cena, Batista, Randy Orton a Eddie Guerrero. Období inovací a experimentů, které přineslo některé z nejlepších wrestlingových her všech dob, včetně legendárního "Here Comes the Pain".',
    years: '2002-2008',
    games: [
      {
        id: 'wwe-smackdown-sym-2002',
        title: 'WWE SmackDown! Shut Your Mouth',
        year: 2002,
        platform: 'PlayStation 2',
        description: 'První hra pod značkou WWE během začátku Ruthless Aggression Ery! Přinesla kompletně přepracovaný Season Mode s branching storylines a více než 50 wrestlerů v době, kdy WWE představilo nové hvězdy.',
        features: ['První hra pod značkou WWE', 'Ruthless Aggression Era debut', 'Revoluční Season Mode', 'Více než 50 wrestlerů', 'Branching storylines', 'Brand Extension začátky'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-sym-2002.jpg',
        era: 'ruthless',
        series: 'smackdown'
      },
      {
        id: 'wwe-wrestlemania-x8-2002',
        title: 'WWE WrestleMania X8',
        year: 2002,
        platform: 'GameCube',
        description: 'První WWE hra na GameCube! Oslava WrestleMania X8 s The Rock vs. Hulk Hogan a začátkem Ruthless Aggression Era.',
        features: ['První WWE na GameCube', 'WrestleMania X8 theme', 'The Rock vs. Hulk Hogan', 'Ruthless Aggression debut', 'Unique GameCube features', 'Enhanced graphics'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-wrestlemania-x8-2002.jpg',
        era: 'ruthless',
        series: 'wrestlemania'
      },
      {
        id: 'wwe-smackdown-hctp-2003',
        title: 'WWE SmackDown! Here Comes the Pain',
        year: 2003,
        platform: 'PlayStation 2',
        description: 'Považovaná za nejlepší hru SmackDown! série! První WWE hra s novým brandingem, vydaná během zlatého období Ruthless Aggression Era s Brockem Lesnarem, Kurtem Anglem a Eddie Guerrerem. Přinesla revoluční location-specific damage systém a dokonale vyvážený gameplay.',
        features: ['Nejlepší hra série všech dob', 'Brock Lesnar, Kurt Angle, Eddie Guerrero', 'Perfektní gameplay balance', 'Legendární roster z RA Era', 'Ikonický Season Mode', 'Backstage brawling areas'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-hctp-2003.jpg',
        era: 'ruthless',
        series: 'smackdown'
      },
      {
        id: 'wwe-raw-2-2003',
        title: 'WWE Raw 2',
        year: 2003,
        platform: 'Xbox',
        description: 'Pokračování Xbox exkluzivní Raw série během vrcholu Ruthless Aggression Era! Vydaná v roce Brock Lesnar vs. Kurt Angle rivalit a Eddie Guerrero\'s rise to prominence. Přinesla vylepšený gameplay engine, rozšířený roster a enhanced Season Mode.',
        features: ['Xbox exclusive sequel', 'Ruthless Aggression Era peak', 'Brock Lesnar, Kurt Angle era', 'Enhanced Season Mode', 'Brand Extension gameplay', 'Improved graphics engine'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-raw-2-2003.jpg',
        era: 'ruthless',
        series: 'standalone'
      },
      {
        id: 'wwe-wrestlemania-xix-2003',
        title: 'WWE WrestleMania XIX',
        year: 2003,
        platform: 'GameCube',
        description: 'Pokračování GameCube série s vylepšeným gameplay! Doba Stone Cold vs. The Rock a Kurt Angle jako šampiona.',
        features: ['Vylepšený GameCube engine', 'Stone Cold vs. The Rock', 'Kurt Angle era', 'Enhanced career mode', 'Better animations', 'Exclusive GameCube content'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-wrestlemania-xix-2003.jpg',
        era: 'ruthless',
        series: 'wrestlemania'
      },
      {
        id: 'wwe-crush-hour-2003',
        title: 'WWE Crush Hour',
        year: 2003,
        platform: 'PS2, Xbox, GameCube',
        description: 'Nejbizarnější WWE hra! Twisted Metal styl s WWE wrestlery v autech. Experimentální titul, který se odvážil být jiný.',
        features: ['Vehicular combat', 'Twisted Metal style', 'WWE wrestlers in cars', 'Experimentální gameplay', 'Unique concept', 'Cult classic status'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-crush-hour-2003.jpg',
        era: 'ruthless',
        series: 'standalone'
      },
      {
        id: 'wwe-smackdown-vs-raw-2004',
        title: 'WWE SmackDown vs. Raw',
        year: 2004,
        platform: 'PlayStation 2',
        description: 'Začátek nové éry her! První hra pod názvem "vs. Raw" přinesla brand split během vrcholu Ruthless Aggression Ery s JBL jako WWE Championem a možnost hrát za obě značky WWE.',
        features: ['První hra "vs. Raw" série', 'WWE Brand Split implementation', 'JBL, John Cena, Batista era', 'Dual storylines pro obě brandy', 'Vylepšené grafické engine', 'Voice acting debut'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-vs-raw-2004.jpg',
        era: 'ruthless',
        series: 'svr'
      },
      {
        id: 'wwe-day-of-reckoning-2004',
        title: 'WWE Day of Reckoning',
        year: 2004,
        platform: 'GameCube',
        description: 'Návrat AKI Corporation! Duchovní nástupce No Mercy s moderní grafikou a klasickým AKI gameplay na GameCube během Ruthless Aggression Era.',
        features: ['AKI Corporation návrat', 'No Mercy spiritual successor', 'Classic AKI gameplay', 'Modern graphics', 'Story mode', 'GameCube exclusive'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-day-of-reckoning-2004.jpg',
        era: 'ruthless',
        series: 'gamecube'
      },
      {
        id: 'wwe-day-of-reckoning-2-2005',
        title: 'WWE Day of Reckoning 2',
        year: 2005,
        platform: 'GameCube',
        description: 'Poslední AKI wrestling hra! Zdokonalila originál s lepším story módem a rozšířeným rosterem. Konec legendární éry.',
        features: ['Poslední AKI hra', 'Vylepšený story mode', 'Rozšířený roster', 'Enhanced AKI engine', 'GameCube swan song', 'Konec legendy'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-day-of-reckoning-2-2005.jpg',
        era: 'ruthless',
        series: 'gamecube'
      },
      {
        id: 'wwe-smackdown-vs-raw-2006',
        title: 'WWE SmackDown vs. Raw 2006',
        year: 2005,
        platform: 'PlayStation 2, PSP',
        description: 'Přinesla General Manager Mode a možnost řídit celou značku WWE. První hra série také na PSP konzoli.',
        features: ['General Manager Mode', 'První na PSP', 'Vylepšené online funkce', 'Rozšířené customizace', 'Brand management', 'Portable wrestling'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-vs-raw-2006.jpg',
        era: 'ruthless',
        series: 'svr'
      },
      {
        id: 'wwe-smackdown-vs-raw-2007',
        title: 'WWE SmackDown vs. Raw 2007',
        year: 2006,
        platform: 'PS2, PSP, Xbox 360',
        description: 'Debut na Xbox 360 s HD grafikou. Přinesla vylepšený physics engine a realistické pohyby wrestlerů.',
        features: ['První na Xbox 360', 'HD grafika', 'Vylepšený physics', 'Realistické animace', 'Next-gen debut', 'Enhanced gameplay'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-vs-raw-2007.jpg',
        era: 'ruthless',
        series: 'svr'
      }
    ]
  },
  {
    id: 'pg',
    title: 'PG Era',
    subtitle: '2008 - 2014',
    description: 'Období přechodu na family-friendly obsah, zavedení ECW jako třetí značky a revoluce s WWE Universe Mode. Konec legendární série SmackDown vs. Raw a příprava na novou generaci WWE her.',
    years: '2008-2014',
    games: [
      {
        id: 'wwe-smackdown-vs-raw-2008',
        title: 'WWE SmackDown vs. Raw 2008',
        year: 2007,
        platform: 'Multi-Platform',
        description: 'ECW brand byl přidán do hry! První hra s třemi značkami WWE a novými Extreme Rules matches.',
        features: ['ECW brand přidán', 'Extreme Rules matches', 'Fighting styles systém', '24/7 Mode', 'Three brands', 'Enhanced customization'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-vs-raw-2008.jpg',
        era: 'pg',
        series: 'svr'
      },
      {
        id: 'wwe-smackdown-vs-raw-2009',
        title: 'WWE SmackDown vs. Raw 2009',
        year: 2008,
        platform: 'Multi-Platform',
        description: 'Přechod na PG rating. Tag team wrestling dostal nový rozměr s kooperativními finishery a Road to WrestleMania.',
        features: ['PG rating debut', 'Kooperativní finishery', 'Road to WrestleMania', 'Create-a-Finisher', 'Tag team focus', 'Story-driven modes'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-vs-raw-2009.jpg',
        era: 'pg',
        series: 'svr'
      },
      {
        id: 'wwe-smackdown-vs-raw-2010',
        title: 'WWE SmackDown vs. Raw 2010',
        year: 2009,
        platform: 'Multi-Platform',
        description: 'Revoluce s WWE Universe Mode - dynamický systém, který vytváří nekonečné storylines a rivalries.',
        features: ['WWE Universe Mode debut', 'Dynamické storylines', 'Vylepšené online', 'Story Designer', 'Infinite replayability', 'Dynamic rivalries'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-vs-raw-2010.jpg',
        era: 'pg',
        series: 'svr'
      },
      {
        id: 'wwe-smackdown-vs-raw-2011',
        title: 'WWE SmackDown vs. Raw 2011',
        year: 2010,
        platform: 'Multi-Platform',
        description: 'Poslední hra legendární série SmackDown vs. Raw. Physics-based gameplay a WWE Universe 2.0.',
        features: ['Poslední SvR hra', 'Physics-based gameplay', 'WWE Universe 2.0', 'Konec legendární série', 'Enhanced physics', 'Improved Universe Mode'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-smackdown-vs-raw-2011.jpg',
        era: 'pg',
        series: 'svr'
      },
      {
        id: 'wwe-12-2011',
        title: 'WWE \'12',
        year: 2011,
        platform: 'Multi-Platform',
        description: 'Poslední hra od THQ! Přechod na nový herní engine s "Bigger, Badder, Better" sloganem a revolucí v gameplay.',
        features: ['Poslední THQ hra', 'Nový herní engine', 'Predator Technology', 'Road to WrestleMania', 'Bigger Badder Better', 'Engine overhaul'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-12-2011.jpg',
        era: 'pg',
        series: 'standalone'
      },
      {
        id: 'wwe-all-stars-2011',
        title: 'WWE All Stars',
        year: 2011,
        platform: 'Multi-Platform',
        description: 'Arkádový comeback! Over-the-top akční gameplay s legendami vs. současnými hvězdami. Návrat k arkádovým kořenům wrestling her.',
        features: ['Arkádový gameplay', 'Legends vs. Superstars', 'Over-the-top action', 'Stylized graphics', 'Fast-paced matches', 'Arcade revival'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-all-stars-2011.jpg',
        era: 'pg',
        series: 'arcade'
      },
      {
        id: 'wwe-13-2012',
        title: 'WWE \'13',
        year: 2012,
        platform: 'Multi-Platform',
        description: 'CM Punk na obalu! Oslava Attitude Era s "Attitude Era Mode" a legendárními wrestlery z nejlepší éry WWE.',
        features: ['Attitude Era Mode', 'CM Punk cover star', 'Legendární roster', 'Vylepšený Universe Mode', 'Attitude Era nostalgia', 'Classic matches'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-13-2012.jpg',
        era: 'pg',
        series: 'standalone'
      },
      {
        id: 'wwe-2k14-2013',
        title: 'WWE 2K14',
        year: 2013,
        platform: 'Multi-Platform',
        description: 'První hra pod značkou 2K Sports s CM Punkem na obalu! Obsahuje revoluční "30 Years of WrestleMania" mód, který revisituje klíčové momenty ze všech WrestleManii od roku 1985.',
        features: ['První hra od 2K Sports', '30 Years of WrestleMania Mode', 'Hulk Hogan, Ultimate Warrior', 'Vylepšená grafika', 'Legendární roster z historie', 'Konec PG Era'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k14-2013.jpg',
        era: 'pg',
        series: '2k'
      }
    ]
  },
  {
    id: 'reality',
    title: 'Reality Era',
    subtitle: '2014 - 2016',
    description: 'Začátek Reality Era s Daniel Bryan Yes Movement! Přechod na next-gen konzole s WWE 2K15 a 2K16, které přinesly revoluční MyCareer mód a nejrealističtější wrestling gameplay.',
    years: '2014-2016',
    games: [
      {
        id: 'wwe-2k15-2014',
        title: 'WWE 2K15',
        year: 2014,
        platform: 'PS4, Xbox One, PC',
        description: 'Začátek Reality Era s Johnem Cenou na obalu! První hra na next-gen konzolích (PS4, Xbox One) s kompletně novým herním enginem a motion capture technologií. Představuje revoluční MyCareer mód, kde vytvoříte vlastního wrestlera a projdete cestu od NXT tryouts až po WWE Pay-Per-View zápasy. Obsahuje dva showcase módy: John Cena vs. CM Punk a Triple H vs. Shawn Michaels rivalries.',
        features: ['První next-gen WWE hra', 'Revoluční MyCareer mód', 'Motion capture technologie', 'John Cena vs. CM Punk Showcase', 'Triple H vs. Shawn Michaels', 'Daniel Bryan era'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k15-2014.jpg',
        era: 'reality',
        series: '2k'
      },
      {
        id: 'wwe-2k16-2015',
        title: 'WWE 2K16',
        year: 2015,
        platform: 'Multi-Platform',
        description: 'Stone Cold Steve Austin na obalu s největším rosterem v historii série! Obsahuje více než 120 unikátních wrestlerů a "Steve Austin 3:16" 2K Showcase mód, který pokrývá celou Austinovu kariéru od WCW přes ECW až po WWF/WWE. Showcase zahrnuje ikonické zápasy jako Austin vs. Jake Roberts (King of the Ring 1996) a Austin vs. The Rock. Vylepšený Creation Suite a MyCareer mód během Seth Rollins éry jako šampiona.',
        features: ['Stone Cold Steve Austin cover', 'Největší roster v historii', 'Steve Austin 3:16 Showcase', 'Více než 120 wrestlerů', 'Vylepšený Creation Suite', 'Seth Rollins era'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k16-2015.jpg',
        era: 'reality',
        series: '2k'
      }
    ]
  },
  {
    id: 'new-era',
    title: 'New Era',
    subtitle: '2016 - 2021',
    description: 'New Era s Brand Split návratem! Doba WWE 2K17-2K20 s vylepšenými funkcemi, Nintendo Switch debutem a Women\'s Evolution.',
    years: '2016-2021',
    games: [
      {
        id: 'wwe-2k17-2016',
        title: 'WWE 2K17',
        year: 2016,
        platform: 'Multi-Platform',
        description: 'Brock Lesnar na obalu během začátku New Era a návratu Brand Split! Hra vyšla v době Goldberg vs. Brock Lesnar rivality a jejich historického Survivor Series 2016 zápasu. Obsahuje vylepšený gameplay s novými submission systémy, promo engine pro realistické rozhovory a backstage brawling areas. První hra, která zachytila atmosféru nového Brand Split s Raw a SmackDown jako samostatnými značkami.',
        features: ['Brock Lesnar cover star', 'Brand Split návrat', 'Goldberg vs. Lesnar rivalry', 'Nové submission systémy', 'Promo engine', 'Backstage brawling'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k17-2016.jpg',
        era: 'new-era',
        series: '2k'
      },
      {
        id: 'wwe-2k18-2017',
        title: 'WWE 2K18',
        year: 2017,
        platform: 'Multi-Platform',
        description: 'Seth Rollins na obalu s historickým debutem na Nintendo Switch! První WWE hra na Switch konzoli přinesla portabilní wrestling gaming. Obsahuje vylepšený MyCareer mód s hlubším storytelling a nový Road to Glory online mód, kde soutěžíte s hráči po celém světě. Hra vyšla během AJ Styles éry jako WWE Champion a zachycuje atmosféru New Era s Mixed Match Challenge a dalšími inovacemi.',
        features: ['Seth Rollins cover star', 'Nintendo Switch debut', 'Portabilní wrestling gaming', 'Vylepšený MyCareer', 'Road to Glory online', 'Mixed Match Challenge'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k18-2017.jpg',
        era: 'new-era',
        series: '2k'
      },
      {
        id: 'wwe-2k19-2018',
        title: 'WWE 2K19',
        year: 2018,
        platform: 'Multi-Platform',
        description: 'AJ Styles na obalu s nejlepším gameplay v sérii! Obsahuje "The Return of Daniel Bryan" 2K Showcase mód, který sleduje neuvěřitelnou cestu Daniela Bryana od jeho career-defining momentu na WrestleManii 30 až po jeho comeback po zranění. Hra vyšla během Bryanovy emocionální návrat story a obsahuje vylepšené animace, Towers mód a Million Dollar Challenge. Považovaná za vrchol WWE 2K série před problémy 2K20.',
        features: ['AJ Styles cover star', 'Nejlepší gameplay v sérii', 'Daniel Bryan Showcase', 'Vylepšené animace', 'Towers mód', 'Million Dollar Challenge'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k19-2018.jpg',
        era: 'new-era',
        series: '2k'
      },
      {
        id: 'wwe-2k20-2019',
        title: 'WWE 2K20',
        year: 2019,
        platform: 'Multi-Platform',
        description: 'Historická hra s dvojitými cover stars - Becky Lynch a Roman Reigns! První WWE hra s plnohodnotným ženským MyCareer módem a "Women\'s Evolution" 2K Showcase oslavujícím Four Horsewomen (Becky Lynch, Charlotte Flair, Sasha Banks, Bayley). Obsahuje diversifikovaný MyCareer s možností hrát jako muž nebo žena, streamlined controls a debut WWE 2K20 Originals. Bohužel známá pro technické problémy při vydání.',
        features: ['Dual cover stars', 'Women\'s MyCareer', 'Women\'s Evolution', 'Four Horsewomen', 'WWE 2K20 Originals', 'Streamlined controls'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k20-2019.jpg',
        era: 'new-era',
        series: '2k'
      },
      {
        id: 'wwe-2k-battlegrounds-2020',
        title: 'WWE 2K Battlegrounds',
        year: 2020,
        platform: 'Multi-Platform',
        description: 'Moderní arkádový revival! Cartoon styl s over-the-top akcí a zábavným gameplay. Odpověď na problémy WWE 2K20.',
        features: ['Cartoon art style', 'Arkádový gameplay', 'Over-the-top moves', 'Zábavný styl', 'Moderní revival', 'Alternativa k 2K20'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k-battlegrounds-2020.jpg',
        era: 'new-era',
        series: 'arcade'
      }
    ]
  },
  {
    id: 'post-covid',
    title: 'Post-COVID Era',
    subtitle: '2021 - 2023',
    description: 'Post-COVID Era s návratem plných arén! WWE 2K22 "It Hits Different" a začátek Renaissance Era s WWE 2K23.',
    years: '2021-2023',
    games: [
      {
        id: 'wwe-2k22-2022',
        title: 'WWE 2K22',
        year: 2022,
        platform: 'Multi-Platform',
        description: 'Rey Mysterio na obalu oslavující jeho 20. výročí v WWE! Návrat série po dvouletém přerušení s "It Hits Different" sloganem a kompletně přepracovaným gameplay enginem. Obsahuje Rey Mysterio 2K Showcase sledující jeho legendární kariéru, návrat MyGM módu po 14 letech a MyRise s dvěma originálními storylines. Hra vyšla během Post-COVID Era s návratem plných arén a představuje fresh start pro sérii.',
        features: ['Rey Mysterio cover star', 'It Hits Different', 'Návrat po dvouletém přerušení', 'MyGM mód návrat', 'Přepracovaný gameplay engine', 'Plné arény návrat'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k22-2022.jpg',
        era: 'post-covid',
        series: '2k'
      },
      {
        id: 'wwe-2k23-2023',
        title: 'WWE 2K23',
        year: 2023,
        platform: 'Multi-Platform',
        description: 'John Cena na obalu během začátku Renaissance Era s Triple H jako Head of Creative! Obsahuje revoluční "John Cena Showcase" zaměřený na jeho 14 největších porážek, kde hrajete jako jeho soupeři a snažíte se ho porazit. Přinesla WarGames match type po letech, vylepšený MyGM mód, dva nové MyRise storylines a největší roster v historii série. Hra zachycuje atmosféru nové WWE éry pod vedením Triple H s důrazem na in-ring kvalitu.',
        features: ['John Cena cover star', 'John Cena Showcase', 'WarGames match type', 'Největší roster v historii', 'Triple H era začátek', 'Vylepšený MyGM'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k23-2023.jpg',
        era: 'post-covid',
        series: '2k'
      }
    ]
  },
  {
    id: 'renaissance',
    title: 'Renaissance Era',
    subtitle: '2023 - present',
    description: 'Renaissance Era s Triple H jako Head of Creative! WWE 2K23-2K25 s nejpokročilejšími funkcemi a návratem k in-ring kvalitě.',
    years: '2023-present',
    games: [
      {
        id: 'wwe-2k24-2024',
        title: 'WWE 2K24',
        year: 2024,
        platform: 'Multi-Platform',
        description: 'Oslava 40 let WrestleManie s Cody Rhodes na obalu! Obsahuje "Showcase of the Immortals" mód oslavující čtyři dekády WrestleManie, dva nové MyRise storylines a vylepšený MyFaction mód. Přinesla Ambulance Match, Guest Referee mód a nejrozsáhlejší roster v historii série s více než 200 wrestlery. "Finish Your Story" téma dokonale zachycuje Cody Rhodes\' cestu k titulu.',
        features: ['Cody Rhodes cover star', '40 let WrestleManie', 'Showcase of the Immortals', 'Ambulance Match', 'Guest Referee mód', 'WrestleMania XL showcase'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k24-2024.jpg',
        era: 'renaissance',
        series: '2k'
      },
      {
        id: 'wwe-2k25-2025',
        title: 'WWE 2K25',
        year: 2025,
        platform: 'Multi-Platform',
        description: 'Roman Reigns na obalu s revolučním "The Island" open-world zážitkem! Obsahuje "The Bloodline\'s Dynasty" showcase hostovaný Paulem Heymanem, který oslavuje legendární Anoa\'i wrestling dynastii včetně Roman Reigns, The Rock, Yokozuna a Jacob Fatu. Přinesla nové match types, vylepšené Faction Wars, interaktivní open-world prostředí a nejpokročilejší storytelling v historii série. Hra představuje budoucnost WWE gaming s důrazem na rodinné dědictví a moderní technologie.',
        features: ['Roman Reigns cover star', 'The Island open-world', 'Bloodline Dynasty showcase', 'Paul Heyman hosting', 'Anoa\'i family dynasty', 'Nejpokročilejší storytelling'],
        cover: 'https://cdn.komplexaci.cz/komplexaci/img/wwe-covers/wwe-2k25-2025.jpg',
        era: 'renaissance',
        series: '2k'
      }
    ]
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const era = searchParams.get('era');
    const series = searchParams.get('series');

    let filteredEras = [...wweErasData];

    // Filter by era if specified
    if (era && era !== 'all') {
      filteredEras = filteredEras.filter(eraData => eraData.id === era);
    }

    // Filter by series if specified
    if (series && series !== 'all') {
      filteredEras = filteredEras.map(eraData => ({
        ...eraData,
        games: eraData.games.filter(game => game.series === series)
      })).filter(eraData => eraData.games.length > 0);
    }

    return NextResponse.json(filteredEras);
  } catch (error) {
    console.error('Error fetching WWE games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WWE games data' },
      { status: 500 }
    );
  }
}