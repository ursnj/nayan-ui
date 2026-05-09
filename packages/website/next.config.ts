import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nayan-ui/react'],
  images: {
    unoptimized: true
  },
  output: 'standalone'
};

export default nextConfig;
