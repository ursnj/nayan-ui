import path from 'node:path';
import type { NextConfig } from 'next';
import { componentReferences } from './src/services/nayan-ui/component-reference';
import { moduleReferences } from './src/services/nayan-ui/module-reference';

// The games module already used its prefixed route. /games is the playable game catalog.
const legacyReferences = [...componentReferences, ...moduleReferences.filter(({ slug }) => slug !== 'games')];

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
  // Some browsers still have the original permanent redirect from /playground cached.
  async rewrites() {
    return [{ source: '/game-engine/playground/:path*', destination: '/playground/:path*' }];
  },
  // Keep published documentation, shared games and saved playground links working.
  async redirects() {
    return [
      { source: '/examples/:path*', destination: '/game-engine/examples/:path*', permanent: true },
      { source: '/:legacy(engine|nayan-game-engine)/playground/:path*', destination: '/playground/:path*', permanent: true },
      { source: '/engine/:path*', destination: '/game-engine/:path*', permanent: true },
      { source: '/nayan-components', destination: '/components', permanent: true },
      { source: '/nayan-modules/:path*', destination: '/modules/:path*', permanent: true },
      { source: '/user-interface', destination: '/components', permanent: true },
      ...legacyReferences.map(({ slug, path }) => ({ source: `/${slug}`, destination: path, permanent: true })),
      { source: '/nayan-game-engine/:path*', destination: '/game-engine/:path*', permanent: true },
      { source: '/nayan-playground/:path*', destination: '/playground/:path*', permanent: true },
      { source: '/nayan-video-editor/:path*', destination: '/video-editor/:path*', permanent: true },
      { source: '/react/tags/:tag*', destination: '/tags/:tag*', permanent: true },
      { source: '/react-native/tags/:tag*', destination: '/tags/:tag*', permanent: true },
      // Play With Tua was renamed Talking Tua.
      { source: '/games/play-with-tua', destination: '/games/talking-tua', permanent: true },
      { source: '/nayan-games/play-with-tua', destination: '/games/talking-tua', permanent: true },
      { source: '/nayan-games/:path*', destination: '/games/:path*', permanent: true },
      { source: '/engine-ui/:path*', destination: '/nayan-ui/:path*', permanent: true },
      { source: '/engine.json', destination: '/nayan-game-engine.json', permanent: true },
      { source: '/seo/game-engine/playground.png', destination: '/seo/nayan-playground.png', permanent: true },
      { source: '/seo/artwork/pages/game-engine/playground.jpg', destination: '/seo/artwork/pages/nayan-playground.jpg', permanent: true },
      { source: '/seo/artwork/games.jpg', destination: '/seo/artwork/nayan-games.jpg', permanent: true },
      { source: '/seo/:product(game-engine|games|video-editor).png', destination: '/seo/nayan-:product.png', permanent: true },
      { source: '/seo/:product(game-engine|games|video-editor)/:path*', destination: '/seo/nayan-:product/:path*', permanent: true },
      { source: '/seo/artwork/pages/:product(game-engine|games|video-editor)/:path*', destination: '/seo/artwork/pages/nayan-:product/:path*', permanent: true }
    ];
  }
};

export default nextConfig;
