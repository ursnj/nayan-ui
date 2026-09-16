import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nayan-ui/react'],
  images: {
    unoptimized: true
  },
  output: 'standalone',
  async rewrites() {
    // The video editor is a static Vite bundle living in
    // public/video-editor/start, so Next serves its files by exact path. The
    // bare route has no file of its own and needs pointing at the bundle's
    // entry point.
    //
    // This resolves even though /video-editor is a Next route: rewrites run
    // after the filesystem, and /video-editor/start matches no page, so it
    // falls through to here rather than being shadowed.
    return [
      { source: '/video-editor/start', destination: '/video-editor/start/index.html' },
      { source: '/video-editor/start/', destination: '/video-editor/start/index.html' }
    ];
  }
};

export default nextConfig;
