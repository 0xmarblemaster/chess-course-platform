import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Landing in 3 languages at short URLs; Russian is the default
      // (the root redirects to /ru). Since 2026-10-17 the main landing is the
      // v2 "Fusion" design (files in /main — not /v2, because Vercel serves a
      // public folder's index.html before rewrites run); the previous landing
      // moved to /v2 (noindex).
      { source: "/ru", destination: "/main/index.html" },
      { source: "/en", destination: "/main/en/index.html" },
      { source: "/kz", destination: "/main/kk/index.html" },
      { source: "/v2", destination: "/home/index.html" },
      { source: "/v2/en", destination: "/home/en/index.html" },
      { source: "/v2/kz", destination: "/home/kk/index.html" },
    ];
  },
  async redirects() {
    return [
      // Russian is the default language.
      { source: "/", destination: "/ru", permanent: false },
      // Old landing addresses (switcher links before the move, and the
      // /kk URL that the hreflang tags used to advertise).
      { source: "/home", destination: "/ru", permanent: true },
      { source: "/home/en", destination: "/en", permanent: true },
      { source: "/home/kk", destination: "/kz", permanent: true },
      { source: "/kk", destination: "/kz", permanent: true },
      // The main landing's file paths are not public URLs.
      { source: "/main", destination: "/ru", permanent: true },
      { source: "/main/en", destination: "/en", permanent: true },
      { source: "/main/kk", destination: "/kz", permanent: true },
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
    ];
  },
};

export default nextConfig;
