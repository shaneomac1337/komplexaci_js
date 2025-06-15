import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Komplexáci",
  description: "Oficiální webové stránky klanu Komplexáci - Gaming komunita specializující se na League of Legends, CS2, WWE hry a další.",
  keywords: ["Komplexáci", "gaming", "klan", "League of Legends", "CS2", "WWE", "esports", "komunita"],
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
    title: "Komplexáci",
    description: "Oficiální webové stránky klanu Komplexáci - Gaming komunita specializující se na League of Legends, CS2, WWE hry a další.",
    url: "https://www.komplexaci.cz",
    siteName: "Komplexáci",
    images: [
      {
        url: "/komplexaci/img/logo.png",
        width: 1200,
        height: 630,
        alt: "Komplexáci Logo",
      },
    ],
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Komplexáci",
    description: "Oficiální webové stránky klanu Komplexáci - Gaming komunita specializující se na League of Legends, CS2, WWE hry a další.",
    images: ["/komplexaci/img/logo.png"],
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
              "url": "https://www.komplexaci.cz",
              "logo": "https://www.komplexaci.cz/komplexaci/img/logo.png",
              "description": "Komplexáci je česká herní komunita specializující se na League of Legends a Counter Strike 2. Vzpomínáme na staré dobré časy a sdílíme herní obsah.",
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
