const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@simis/shared'],
  serverExternalPackages: ['@prisma/client', '@prisma/client-runtime-utils'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingIncludes: {
    '/**/*': [
      'node_modules/.prisma/client/**/*',
      'node_modules/@prisma/client-runtime-utils/**/*',
      'node_modules/@prisma/client/**/*'
    ]
  },
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
