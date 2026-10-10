import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Serve build A (burgundy 3D landing) at the site root while keeping
      // the Next.js app alive. The classic cream landing now lives at /classic.
      {
        source: "/",
        destination: "/home/index.html",
      },
    ];
  },
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
      {
        source: "/v1",
        destination: "/v1/index.html",
        permanent: false,
      },
      {
        source: "/v1/",
        destination: "/v1/index.html",
        permanent: false,
      },
      {
        source: "/v2",
        destination: "/v2/index.html",
        permanent: false,
      },
      {
        source: "/v2/",
        destination: "/v2/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
