import type { NextConfig } from "next";

// /articles, /en/articles, /kz/articles and their /<slug> article pages are route handlers
// (src/app/**/articles/**/route.ts) that render DB articles into the static pages in
// public/main/articles, which they read at runtime as templates.
const articlesTemplates = ["./public/main/articles/**/*.html"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/articles": articlesTemplates,
    "/en/articles": articlesTemplates,
    "/kz/articles": articlesTemplates,
    "/articles/[slug]": articlesTemplates,
    "/en/articles/[slug]": articlesTemplates,
    "/kz/articles/[slug]": articlesTemplates,
  },
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
      { source: "/main/articles", destination: "/articles", permanent: true },
      { source: "/main/articles/en", destination: "/en/articles", permanent: true },
      { source: "/main/articles/kk", destination: "/kz/articles", permanent: true },
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
