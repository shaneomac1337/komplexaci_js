import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "League of Legends | Komplexáci",
  description: "League of Legends - MOBA hra od Riot Games, ve které se specializuje klan Komplexáci. Objevte více než 160 unikátních šampionů a jejich schopnosti.",
  keywords: ["League of Legends", "LoL", "MOBA", "Riot Games", "šampioni", "champions", "esports", "Komplexáci"],
  alternates: {
    canonical: "/league-of-legends",
  },
  openGraph: {
    title: "League of Legends | Komplexáci",
    description: "League of Legends - MOBA hra od Riot Games, ve které se specializuje klan Komplexáci. Objevte více než 160 unikátních šampionů a jejich schopnosti.",
    url: "https://www.komplexaci.cz/league-of-legends",
    siteName: "Komplexáci",
    images: [
      {
        url: "/komplexaci/img/lol.jpg",
        width: 1200,
        height: 630,
        alt: "League of Legends",
      },
    ],
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "League of Legends | Komplexáci",
    description: "League of Legends - MOBA hra od Riot Games, ve které se specializuje klan Komplexáci.",
    images: ["/komplexaci/img/lol.jpg"],
  },
};

export default function LeagueOfLegendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Structured Data for League of Legends VideoGame */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            "name": "League of Legends",
            "alternateName": "LoL",
            "description": "League of Legends je MOBA hra od Riot Games s více než 160 unikátními šampiony. Komplexáci se specializuje na týmové strategie a kompetitivní hraní.",
            "genre": ["MOBA", "Strategy", "Multiplayer", "Esports"],
            "gamePlatform": "PC",
            "publisher": {
              "@type": "Organization",
              "name": "Riot Games"
            },
            "developer": {
              "@type": "Organization",
              "name": "Riot Games"
            },
            "url": "https://www.leagueoflegends.com",
            "image": "https://www.komplexaci.cz/komplexaci/img/lol.jpg",
            "applicationCategory": "Game",
            "operatingSystem": "Windows, macOS",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }
          })
        }}
      />

      {/* Structured Data for WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "League of Legends | Komplexáci",
            "url": "https://www.komplexaci.cz/league-of-legends",
            "description": "League of Legends stránka klanu Komplexáci. Objevte více než 160 šampionů, jejich schopnosti a naše herní strategie. Kompletní databáze šampionů s filtry a detailními informacemi.",
            "inLanguage": "cs-CZ",
            "keywords": ["League of Legends", "LoL", "šampioni", "champions", "Komplexáci", "MOBA", "Riot Games", "herní strategie"],
            "isPartOf": {
              "@type": "WebSite",
              "name": "Komplexáci",
              "url": "https://www.komplexaci.cz"
            },
            "about": {
              "@type": "VideoGame",
              "name": "League of Legends",
              "description": "MOBA hra s více než 160 unikátními šampiony",
              "publisher": {
                "@type": "Organization",
                "name": "Riot Games"
              }
            },
            "mainEntity": {
              "@type": "ItemList",
              "name": "League of Legends Champions",
              "description": "Kompletní seznam více než 160 šampionů v League of Legends",
              "numberOfItems": "160+"
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
                  "name": "League of Legends",
                  "item": "https://www.komplexaci.cz/league-of-legends"
                }
              ]
            },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.komplexaci.cz/league-of-legends?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />

      {children}
    </>
  );
}
