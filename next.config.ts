import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  typedRoutes: true,
  experimental: {
    typedEnv: true,
    optimizePackageImports: [
      "react-icons",
      "date-fns",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "sonner",
      "swiper",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "neiist.tecnico.ulisboa.pt",
        pathname: "/api/user/photo/:path*",
      },
    ],
    localPatterns: [{ pathname: "/api/user/photo/**" }, { pathname: "/**/**" }],
  },
};

export default nextConfig;
