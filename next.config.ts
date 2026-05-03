import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'jsonwebtoken', 'pg'],

  // Allow large file uploads (100MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  // Silence Turbopack warning
  turbopack: {},

  // Reduce memory usage for production builds
  productionBrowserSourceMaps: false,

  webpack(config, { dev, isServer }) {
    config.cache = {
      type: 'filesystem',
      allowCollectingMemory: false,
    };
    config.parallelism = 1;

    if (!dev) {
      config.devtool = false;
    }

    return config;
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
  },
};

export default nextConfig;
