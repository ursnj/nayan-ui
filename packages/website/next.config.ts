import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No in-memory copy of rendered pages: the server reads its prerendered pages from disk, which
  // the OS caches anyway. Browsing every page took the server to 344 MB with the default 50 MB
  // cache and 231 MB without it, with no slower pages, which matters in a 512 MB container.
  cacheMaxMemorySize: 0,
  images: {
    unoptimized: true
  },
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  turbopack: {
    root: path.resolve(__dirname, '../..')
  },
  output: 'standalone',
  // The engine docs moved from /engine to /game-engine; keep old links (npm README, search results) working.
  async redirects() {
    return [
      { source: '/examples', destination: '/game-engine/examples', permanent: true },
      { source: '/examples/:path+', destination: '/game-engine/examples/:path+', permanent: true },
      { source: '/engine', destination: '/game-engine', permanent: true },
      { source: '/engine/:slug', destination: '/game-engine/:slug', permanent: true },
      { source: '/react/tags/:tag*', destination: '/tags/:tag*', permanent: true },
      { source: '/react-native/tags/:tag*', destination: '/tags/:tag*', permanent: true },
      // Play With Tua was renamed Talking Tua.
      { source: '/games/play-with-tua', destination: '/games/talking-tua', permanent: true }
    ];
  }
};

export default nextConfig;
