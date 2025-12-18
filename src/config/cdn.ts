// CDN Configuration for media files
// All media files are served from Cloudflare R2 via custom domain

export const CDN_BASE_URL = 'https://cdn.komplexaci.cz';

// Helper function to get CDN URL for a path
export function getCdnUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${CDN_BASE_URL}/${cleanPath}`;
}

// Common CDN paths
export const CDN = {
  // Hero section
  heroVideo: `${CDN_BASE_URL}/hero_video.mp4`,
  logo: `${CDN_BASE_URL}/komplexaci/img/logo.png`,
  neonBg: `${CDN_BASE_URL}/komplexaci/img/neon.jpg`,
  discordBg: `${CDN_BASE_URL}/komplexaci/img/discord-bg.jpg`,

  // Game backgrounds
  cs2Bg: `${CDN_BASE_URL}/cs2/cs2.jpg`,
  lolBg: `${CDN_BASE_URL}/komplexaci/img/lol.jpg`,
  wweBg: `${CDN_BASE_URL}/komplexaci/img/wwe-main.jpg`,

  // CS2 images base paths
  cs2: {
    weapons: (name: string) => `${CDN_BASE_URL}/cs2/weapons/${name}`,
    maps: (name: string) => `${CDN_BASE_URL}/cs2/maps/${name}`,
  },

  // Member images
  members: (filename: string) => `${CDN_BASE_URL}/komplexaci/img/${filename}`,

  // WWE covers
  wweCovers: (filename: string) => `${CDN_BASE_URL}/komplexaci/img/wwe-covers/${filename}`,

  // LoL images
  lol: {
    summonersRift: `${CDN_BASE_URL}/komplexaci/img/lol-summoners-rift-artwork.jpg`,
    bridgeOfProgress: `${CDN_BASE_URL}/komplexaci/img/lol-bridge-of-progress.jpg`,
    tft: `${CDN_BASE_URL}/komplexaci/img/lol-tft-artwork.jpg`,
    howlingAbyss: `${CDN_BASE_URL}/komplexaci/img/lol-howling-abyss-artwork.png`,
  },
} as const;
