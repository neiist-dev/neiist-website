import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/user/photo/**',
      },
      {
        protocol: 'https',
        hostname: 'https://neiist.tecnico.ulisboa.pt/',
        pathname: '/api/user/photo/**',
      }
    ],
  },
};

export default nextConfig;