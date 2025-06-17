import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import "./low-performance.css";
import { PerformanceProvider } from "@/contexts/PerformanceContext";
import PerformanceControl from "@/components/PerformanceControl";
import SEOContent from "@/components/SEOContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Komplexáci - Komplexaci Gaming Klan | KompG Dobřany",
  description: "Oficiální webové stránky klanu Komplexáci (Komplexaci) - Gaming komunita z Dobřan specializující se na League of Legends, CS2, WWE hry a další. KompG gaming klan.",
  keywords: [
    "Komplexáci", "Komplexaci", "KompG", "Komplex gaming", "komplexaci cz",
    "gaming klan", "gaming komunita", "Dobřany", "Dobřany gaming",
    "League of Legends", "LoL", "CS2", "Counter Strike", "WWE hry",
    "esports", "český gaming", "česká komunita", "gaming tým",
    "komplexaci.cz", "www.komplexaci.cz", "komplexaci web"
  ],
  authors: [{ name: "Komplexáci" }],
  creator: "Komplexáci",
  publisher: "Komplexáci",
  metadataBase: new URL("https://www.komplexaci.cz"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Komplexáci - Česká Gaming Komunita | League of Legends & CS2",
    description: "🎮 Oficiální webové stránky klanu Komplexáci - Gaming komunita specializující se na League of Legends, CS2, WWE hry a další. Připoj se k nám! 🚀",
    url: "https://www.komplexaci.cz",
    siteName: "Komplexáci",
    images: [
      {
        url: "/komplexaci/img/logo.png",
        width: 1200,
        height: 630,
        alt: "Komplexáci - Česká Gaming Komunita",
        type: "image/png",
      },
      {
        url: "https://www.komplexaci.cz/komplexaci/img/discord-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Komplexáci Discord Server",
        type: "image/jpeg",
      },
    ],
    locale: "cs_CZ",
    type: "website",
    countryName: "Czech Republic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Komplexáci - Česká Gaming Komunita 🎮",
    description: "Gaming komunita specializující se na League of Legends, CS2, WWE hry a další. Připoj se k nám! 🚀",
    images: ["https://www.komplexaci.cz/komplexaci/img/logo.png"],
    site: "@komplexaci",
    creator: "@mpenkava1337",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <head>
        {/* Enhanced Social Media Meta Tags */}
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:secure_url" content="https://www.komplexaci.cz/komplexaci/img/logo.png" />
        <meta name="theme-color" content="#6e4ff6" />
        <meta name="msapplication-TileColor" content="#6e4ff6" />
        <meta name="apple-mobile-web-app-title" content="Komplexáci" />
        <meta name="application-name" content="Komplexáci" />

        {/* WhatsApp specific meta tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Telegram specific */}
        <meta name="telegram:channel" content="@komplexaci" />

        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Komplexáci",
              "alternateName": ["Komplexaci", "KompG", "Komplex Gaming", "Komplexaci Gaming"],
              "url": "https://www.komplexaci.cz",
              "logo": "https://www.komplexaci.cz/komplexaci/img/logo.png",
              "description": "Komplexáci (také známí jako KompG nebo Komplex Gaming) je česká herní komunita z Dobřan specializující se na League of Legends a Counter Strike 2. KompG gaming klan vzpomíná na staré dobré časy a sdílí herní obsah.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dobřany",
                "addressCountry": "CZ"
              },
              "sameAs": [
                "https://www.facebook.com/penkava.martin",
                "https://x.com/mpenkava1337",
                "https://www.instagram.com/m_penkava/",
                "https://www.twitch.tv/shanemc1337",
                "https://www.youtube.com/user/Mercin1000",
                "https://discord.gg/e6BEQpQRBA"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "info@komplexaci.cz",
                "contactType": "customer service"
              }
            })
          }}
        />

        {/* FAQ Structured Data for Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Co je Komplexáci (Komplexaci)?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Komplexáci (také známí jako Komplexaci, KompG nebo Komplex Gaming) je česká herní komunita a gaming klan z Dobřan specializující se na League of Legends, Counter-Strike 2, WWE hry a další. Sdílíme herní obsah, strategie a vzpomínky na staré dobré časy gamingu."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Jaké hry hrajeme?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Specializujeme se především na League of Legends a Counter-Strike 2. Máme také rozsáhlou kolekci WWE/WWF wrestlingových her a další retro tituly."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Jak se připojit ke klanu Komplexáci?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Můžete se připojit k našemu Discord serveru nebo nás kontaktovat přes naše sociální sítě. Vítáme všechny hráče, kteří sdílejí naši vášeň pro gaming."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Máte live status hráčů?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Ano! Naše webová stránka zobrazuje real-time status našich členů v League of Legends - můžete vidět, kdo právě hraje, jaký champion používá a jak dlouho už hra trvá."
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <PerformanceProvider>
            <SEOContent />
            {children}
            <PerformanceControl />
          </PerformanceProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
