import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://streamsplice.bambamthetanman.com',
      'http://streamsplice.bambamthetanman.com',
      'streamsplice.bambamthetanman.com',
      'http://localhost:9002', // For local development
    ],
  },
};

export default nextConfig;