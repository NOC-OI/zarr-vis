import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // distDir: 'dist',
  // basePath: '/zarr-vis',
  // assetPrefix: '/zarr-vis/static', // <- change from _next to static
  images: { unoptimized: true }
};

export default nextConfig;
