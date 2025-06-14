import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Counter-Strike 2 | Komplexáci',
  description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive. Hra staví proti sobě dva týmy - teroristy a protiteroristickou jednotku - v různých herních režimech.',
  keywords: ['Counter-Strike 2', 'CS2', 'FPS', 'střílečka', 'Valve', 'esport', 'Komplexáci'],
  openGraph: {
    title: 'Counter-Strike 2 | Komplexáci',
    description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive.',
    images: ['/komplexaci/img/cs2.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Counter-Strike 2 | Komplexáci',
    description: 'Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive.',
    images: ['/komplexaci/img/cs2.jpg'],
  },
};

export default function CS2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Structured Data for Game */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": "Counter-Strike 2",
            "description": "Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive. Hra staví proti sobě dva týmy - teroristy a protiteroristickou jednotku - v různých herních režimech.",
            "url": "https://www.komplexaci.cz/cs2",
            "image": "https://www.komplexaci.cz/komplexaci/img/cs2.jpg",
            "genre": "FPS",
            "operatingSystem": "Windows",
            "applicationCategory": "Game",
            "publisher": {
              "@type": "Organization",
              "name": "Valve Corporation"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.7",
              "reviewCount": "5000000"
            },
            "playMode": ["MultiPlayer"],
            "gamePlatform": ["PCGamePlatform"],
            "characterAttribute": [
              {"@type": "Thing", "name": "Zbraně"},
              {"@type": "Thing", "name": "Mapy"}
            ]
          })
        }}
      />
      
      {/* WebPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Counter-Strike 2 | Komplexáci",
            "url": "https://www.komplexaci.cz/cs2",
            "description": "Counter-Strike 2 (CS2) je taktická střílečka z pohledu prvé osoby, která je pokračováním legendárního Counter-Strike: Global Offensive. Hra staví proti sobě dva týmy - teroristy a protiteroristickou jednotku - v různých herních režimech.",
            "isPartOf": {
              "@type": "WebSite",
              "name": "Komplexáci",
              "url": "https://www.komplexaci.cz"
            },
            "mainEntity": {
              "@type": "VideoGame",
              "name": "Counter-Strike 2",
              "url": "https://www.komplexaci.cz/cs2"
            }
          })
        }}
      />
      
      {children}
    </>
  );
}
