import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  // distDir: 'dist',
  basePath: isProd ? '/zarr-vis' : '',
  // assetPrefix: '/zarr-vis/static', // <- change from _next to static
  images: { unoptimized: true }
};

export default nextConfig;
