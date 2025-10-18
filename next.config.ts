import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/landing",
        destination: "/landing/index.html",
        permanent: false,
      },
      {
        source: "/landing/",
        destination: "/landing/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
