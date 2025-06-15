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
  icons: {
    icon: "/komplexaci/img/logo.png",
    shortcut: "/komplexaci/img/logo.png",
    apple: "/komplexaci/img/logo.png",
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
