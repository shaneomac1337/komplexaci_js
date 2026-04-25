import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle at .next/standalone so the Docker
  // runtime stage can ship only the traced deps (not the full node_modules).
  // See Dockerfile: the runner copies .next/standalone + .next/static + public.
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ddragon.leagueoflegends.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/icons/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/embed/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/attachments/**',
      },
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'steamuserimages-a.akamaihd.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'community.cloudflare.steamstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shared.cloudflare.steamstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.komplexaci.cz',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Keep native / Discord-side modules out of the client/Edge bundles. These
  // are resolved from node_modules at runtime on the server.
  serverExternalPackages: [
    'discord.js',
    'zlib-sync',
    'bufferutil',
    'utf-8-validate',
    '@discordjs/ws',
    '@discordjs/rest',
    '@discordjs/voice',
    'sodium-native',
    'libsodium-wrappers',
    'erlpack',
    'node-opus',
    'opusscript',
    'tweetnacl',
    'ws',
    // Native SQLite bindings — must stay external so their .node binaries are
    // loaded from node_modules rather than bundled by webpack/turbopack.
    'better-sqlite3',
    'sqlite3',
  ],
};

export default nextConfig;
