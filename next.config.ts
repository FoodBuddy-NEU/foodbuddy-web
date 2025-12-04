import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/logo.png',
        destination: 'https://res.cloudinary.com/dcbktxiuw/image/upload/v1764837933/logo_nobg_a1xei4.png',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
