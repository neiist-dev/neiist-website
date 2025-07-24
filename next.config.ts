import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/user/photo/**",
      },
      {
        protocol: "https",
        hostname: "neiist.tecnico.ulisboa.pt",
        pathname: "/api/user/photo/**",
      },
    ],
  },
  eslint: {
    dirs: ["src"],
  },
};

export default nextConfig;
