import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WWE Games | Komplexáci",
  description: "Kompletní kolekce WWE/WWF wrestlingových her - od klasických arkádových her až po moderní WWE 2K série. Objevte historii wrestlingových videoher.",
  keywords: ["WWE", "WWF", "wrestling", "hry", "videohry", "2K", "SmackDown", "WrestleMania", "Komplexáci"],
  alternates: {
    canonical: "/wwe-games",
  },
  openGraph: {
    title: "WWE Games | Komplexáci",
    description: "Kompletní kolekce WWE/WWF wrestlingových her - od klasických arkádových her až po moderní WWE 2K série. Objevte historii wrestlingových videoher.",
    url: "https://www.komplexaci.cz/wwe-games",
    siteName: "Komplexáci",
    images: [
      {
        url: "https://cdn.komplexaci.cz/komplexaci/img/wwe-main.jpg",
        width: 1200,
        height: 630,
        alt: "WWE Games Collection",
      },
    ],
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WWE Games | Komplexáci",
    description: "Kompletní kolekce WWE/WWF wrestlingových her - od klasických arkádových her až po moderní WWE 2K série.",
    images: ["https://cdn.komplexaci.cz/komplexaci/img/wwe-main.jpg"],
  },
};

export default function WWEGamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Structured Data for WWE Games Collection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGameSeries",
            "name": "WWE Games Collection",
            "description": "Kompletní kolekce WWE/WWF wrestlingových her od klasických arkádových her až po moderní WWE 2K série. Objevte historii wrestlingových videoher.",
            "url": "https://www.komplexaci.cz/wwe-games",
            "image": "https://cdn.komplexaci.cz/komplexaci/img/wwe-main.jpg",
            "genre": ["Sports", "Wrestling", "Fighting", "Simulation"],
            "gamePlatform": ["PlayStation", "Xbox", "PC", "Nintendo"],
            "publisher": [
              {
                "@type": "Organization",
                "name": "2K Sports"
              },
              {
                "@type": "Organization",
                "name": "THQ"
              },
              {
                "@type": "Organization",
                "name": "Acclaim Entertainment"
              }
            ],
            "gameItem": [
              {"@type": "VideoGame", "name": "WWE SmackDown! Here Comes the Pain"},
              {"@type": "VideoGame", "name": "WWE No Mercy"},
              {"@type": "VideoGame", "name": "WWE 2K24"},
              {"@type": "VideoGame", "name": "WWE WrestleMania 2000"},
              {"@type": "VideoGame", "name": "WWF Attitude"},
              {"@type": "VideoGame", "name": "WWE Day of Reckoning"}
            ],
            "about": {
              "@type": "SportsOrganization",
              "name": "WWE",
              "url": "https://www.wwe.com"
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
            "name": "WWE Games | Komplexáci",
            "url": "https://www.komplexaci.cz/wwe-games",
            "description": "WWE Games stránka klanu Komplexáci. Kompletní kolekce wrestlingových her od klasických titulů až po moderní WWE 2K série.",
            "inLanguage": "cs-CZ",
            "isPartOf": {
              "@type": "WebSite",
              "name": "Komplexáci",
              "url": "https://www.komplexaci.cz"
            },
            "about": {
              "@type": "VideoGameSeries",
              "name": "WWE Games Collection"
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
                  "name": "WWE Games",
                  "item": "https://www.komplexaci.cz/wwe-games"
                }
              ]
            }
          })
        }}
      />

      {/* Structured Data for Gaming Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            "name": "Komplexáci",
            "description": "Česká herní komunita specializující se na wrestling hry, League of Legends a Counter Strike 2.",
            "url": "https://www.komplexaci.cz",
            "sport": ["Video Gaming", "Esports", "Wrestling Games"],
            "memberOf": {
              "@type": "SportsOrganization",
              "name": "Czech Gaming Community"
            },
            "location": {
              "@type": "Country",
              "name": "Czech Republic"
            }
          })
        }}
      />

      {children}
    </>
  );
}
