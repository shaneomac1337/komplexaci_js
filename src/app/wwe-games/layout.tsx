import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WWE Games | Komplexáci",
  description: "Kompletní kolekce WWE/WWF wrestlingových her - od klasických arkádových her až po moderní WWE 2K série. Objevte historii wrestlingových videoher.",
  keywords: ["WWE", "WWF", "wrestling", "hry", "videohry", "2K", "SmackDown", "WrestleMania", "Komplexáci"],
  openGraph: {
    title: "WWE Games | Komplexáci",
    description: "Kompletní kolekce WWE/WWF wrestlingových her - od klasických arkádových her až po moderní WWE 2K série. Objevte historii wrestlingových videoher.",
    url: "https://www.komplexaci.cz/wwe-games",
    siteName: "Komplexáci",
    images: [
      {
        url: "/komplexaci/img/wwe-main.jpg",
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
    images: ["/komplexaci/img/wwe-main.jpg"],
  },
};

export default function WWEGamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
