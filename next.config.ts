import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'jsonwebtoken', 'pg'],

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
    ];
  },
};

export default nextConfig;
