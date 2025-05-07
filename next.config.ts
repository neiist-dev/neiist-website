import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fenix.tecnico.ulisboa.pt',
        pathname: '/user/photo/**',
      },
    ],
  },
};

export default nextConfig;
