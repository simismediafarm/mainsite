const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@simis/shared', '@prisma/client'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config) => {
    config.resolve.alias['.prisma/client'] = path.resolve(__dirname, '../../node_modules/.prisma/client');
    return config;
  },
  async rewrites() {
    const apiDest = process.env.NEXT_PUBLIC_KERNEL_API_URL 
      || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:4000');
    return [
      {
        source: '/api/:path*',
        destination: `${apiDest}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
