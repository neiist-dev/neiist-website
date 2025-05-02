import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
