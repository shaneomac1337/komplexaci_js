import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videotvorba — gaming videa Komplexáků",
  description:
    "Videotvorba klanu Komplexáci — retro wrestling gameplay, League of Legends montáže, Trackmania, Rocket League a další gaming obsah ve 1440p.",
  alternates: {
    canonical: "/videotvorba",
  },
  openGraph: {
    title: "Videotvorba — gaming videa Komplexáků",
    description:
      "Retro wrestling gameplay, LoL montáže, Trackmania, Rocket League a další gaming videa od klanu Komplexáci.",
    url: "https://www.komplexaci.cz/videotvorba",
    siteName: "Komplexáci",
    images: [
      {
        url: "https://cdn.komplexaci.cz/komplexaci/img/logo.png",
        width: 1200,
        height: 630,
        alt: "Komplexáci Videotvorba",
      },
    ],
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Videotvorba — gaming videa Komplexáků",
    description:
      "Retro wrestling gameplay, LoL montáže, Trackmania, Rocket League a další gaming videa od klanu Komplexáci.",
    images: ["https://cdn.komplexaci.cz/komplexaci/img/logo.png"],
  },
};

export default function VideotvorbaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Videotvorba | Komplexáci",
            "url": "https://www.komplexaci.cz/videotvorba",
            "description":
              "Sbírka gaming videí klanu Komplexáci — retro wrestling, League of Legends, Trackmania, Rocket League.",
            "inLanguage": "cs-CZ",
            "isPartOf": {
              "@type": "WebSite",
              "name": "Komplexáci",
              "url": "https://www.komplexaci.cz",
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Domů",
                  "item": "https://www.komplexaci.cz",
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Videotvorba",
                  "item": "https://www.komplexaci.cz/videotvorba",
                },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  );
}
