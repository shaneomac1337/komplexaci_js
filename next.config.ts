import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
  // Exclude Discord.js and its native dependencies from client-side bundling
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
    'ws'
  ],
};

export default nextConfig;
