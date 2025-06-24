import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/zarr-vis',
  assetPrefix: '/zarr-vis/',
  images: { unoptimized: true }
};

export default nextConfig;
