import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "League of Legends | Komplexáci",
  description: "League of Legends - MOBA hra od Riot Games, ve které se specializuje klan Komplexáci. Objevte více než 160 unikátních šampionů a jejich schopnosti.",
  keywords: ["League of Legends", "LoL", "MOBA", "Riot Games", "šampioni", "champions", "esports", "Komplexáci"],
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
  return <>{children}</>;
}
