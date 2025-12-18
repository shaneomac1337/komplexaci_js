import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Counter-Strike 2 | Komplexáci',
  description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive. Hra staví proti sobě dva týmy - teroristy a protiteroristickou jednotku - v různých herních režimech.',
  keywords: ['Counter-Strike 2', 'CS2', 'FPS', 'střílečka', 'Valve', 'esport', 'Komplexáci'],
  alternates: {
    canonical: "/cs2",
  },
  openGraph: {
    title: 'Counter-Strike 2 | Komplexáci',
    description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive.',
    url: 'https://www.komplexaci.cz/cs2',
    siteName: 'Komplexáci',
    images: [
      {
        url: 'https://cdn.komplexaci.cz/komplexaci/img/cs2.jpg',
        width: 1200,
        height: 630,
        alt: 'Counter-Strike 2',
      },
    ],
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Counter-Strike 2 | Komplexáci',
    description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive.',
    images: ['https://cdn.komplexaci.cz/komplexaci/img/cs2.jpg'],
  },
};

export default function CS2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Enhanced Structured Data for CS2 VideoGame */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": "Counter-Strike 2",
            "alternateName": ["CS2", "Counter Strike 2"],
            "description": "Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby od Valve Corporation. Hra staví proti sobě dva týmy - teroristy a protiteroristickou jednotku v kompetitivních zápasech.",
            "url": "https://store.steampowered.com/app/730/CounterStrike_2/",
            "image": "https://cdn.komplexaci.cz/komplexaci/img/cs2.jpg",
            "genre": ["FPS", "Tactical Shooter", "Multiplayer", "Esports", "Competitive"],
            "operatingSystem": ["Windows", "macOS", "Linux"],
            "applicationCategory": "Game",
            "gamePlatform": "PC",
            "publisher": {
              "@type": "Organization",
              "name": "Valve Corporation",
              "url": "https://www.valvesoftware.com"
            },
            "developer": {
              "@type": "Organization",
              "name": "Valve Corporation"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.5",
              "reviewCount": "1000000",
              "bestRating": "5",
              "worstRating": "1"
            },
            "playMode": ["MultiPlayer", "CoOp"],
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "gameItem": [
              {"@type": "Thing", "name": "AK-47"},
              {"@type": "Thing", "name": "M4A4"},
              {"@type": "Thing", "name": "AWP"},
              {"@type": "Thing", "name": "Dust2"},
              {"@type": "Thing", "name": "Mirage"},
              {"@type": "Thing", "name": "Inferno"}
            ]
          })
        }}
      />
      
      {/* Enhanced WebPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Counter-Strike 2 | Komplexáci",
            "url": "https://www.komplexaci.cz/cs2",
            "description": "Counter-Strike 2 stránka klanu Komplexáci. Objevte zbraně, mapy, taktiky a naše herní strategie v této legendární FPS hře.",
            "inLanguage": "cs-CZ",
            "isPartOf": {
              "@type": "WebSite",
              "name": "Komplexáci",
              "url": "https://www.komplexaci.cz"
            },
            "about": {
              "@type": "VideoGame",
              "name": "Counter-Strike 2"
            },
            "mainEntity": {
              "@type": "Organization",
              "name": "Komplexáci",
              "url": "https://www.komplexaci.cz"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Domů",
                  "item": "https://www.komplexaci.cz"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Counter-Strike 2",
                  "item": "https://www.komplexaci.cz/cs2"
                }
              ]
            }
          })
        }}
      />
      
      {children}
    </>
  );
}
