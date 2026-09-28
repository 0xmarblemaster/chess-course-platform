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
