import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "neiist.tecnico.ulisboa.pt",
        pathname: "/api/user/photo/:path*",
      },
    ],
    localPatterns: [
      { pathname: "/api/user/photo/**" },
      { pathname: "/events/**" },
      { pathname: "/products/**" },
    ],
  },
};

export default nextConfig;
