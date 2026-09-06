import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@neiist/ui"],
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
      {
        protocol: "https",
        hostname: "neiist.tecnico.ulisboa.pt",
        pathname: "/api/shop/photo/:path*",
      },
    ],
    localPatterns: [
      { pathname: "/api/user/photo/**" },
      { pathname: "/api/shop/photo/**" },
      { pathname: "/**/**" },
    ],
  },
};

export default nextConfig;
