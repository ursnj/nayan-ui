import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nayan-ui/react'],
  images: {
    unoptimized: true
  },
  output: 'standalone',
  async rewrites() {
    // The video editor is a static Vite bundle living in public/editor, so
    // Next serves its files by exact path. The bare route has no file of its
    // own and needs pointing at the bundle's entry point.
    return [
      { source: '/editor', destination: '/editor/index.html' },
      { source: '/editor/', destination: '/editor/index.html' }
    ];
  }
};

export default nextConfig;
