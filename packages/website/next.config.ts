import path from 'node:path';
import type { NextConfig } from 'next';
import { pageRewrites } from './src/services/site-routes';

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
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/game-engine/playground/:path+', destination: '/playground/:path*' },
      ...pageRewrites,
      { source: '/engine-ui/:path*', destination: '/ui/:path*' },
      { source: '/nayan-ui/:path*', destination: '/ui/:path*' },
      { source: '/engine.json', destination: '/nayan-game-engine.json' },
      { source: '/seo/game-engine/playground.png', destination: '/seo/nayan-playground.png' },
      { source: '/seo/artwork/pages/game-engine/playground.jpg', destination: '/seo/artwork/pages/nayan-playground.jpg' },
      { source: '/seo/artwork/games.jpg', destination: '/seo/artwork/nayan-games.jpg' },
      { source: '/seo/:product(game-engine|games|video-editor).png', destination: '/seo/nayan-:product.png' },
      { source: '/seo/nayan-:product(game-engine|games)/:path*', destination: '/seo/:product/:path*' },
      { source: '/seo/artwork/pages/nayan-:product(game-engine|games|video-editor)/:path*', destination: '/seo/artwork/pages/:product/:path*' }
    ];
  }
};

export default nextConfig;
