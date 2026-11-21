import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No in-memory copy of rendered pages: the server reads its prerendered pages from disk, which
  // the OS caches anyway. Browsing every page took the server to 344 MB with the default 50 MB
  // cache and 231 MB without it, with no slower pages, which matters in a 512 MB container.
  cacheMaxMemorySize: 0,
  transpilePackages: ["@nayan-ui/react", "@nayan-ui/tools"],
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  turbopack: {
    root: path.resolve(__dirname, "../.."),
    resolveAlias: {
      // Keep the website and the linked games on one engine instance.
      "@nayan-ui/engine": "./node_modules/@nayan-ui/engine",
    },
  },
  output: "standalone",
  // The engine docs moved from /engine to /game-engine; keep old links (npm README, search results) working.
  async redirects() {
    return [
      { source: "/examples", destination: "/game-engine/examples", permanent: true },
      { source: "/examples/:path+", destination: "/game-engine/examples/:path+", permanent: true },
      { source: "/engine", destination: "/game-engine", permanent: true },
      { source: "/engine/:slug", destination: "/game-engine/:slug", permanent: true },
      // Play With Tua was renamed Talking Tua.
      { source: "/games/play-with-tua", destination: "/games/talking-tua", permanent: true },
    ];
  },
  serverExternalPackages: [
    "docx",
    "exceljs",
    "pptxgenjs",
    "jszip",
    "sharp",
    "pdf-lib",
    "pdf-lib-encrypt",
    "pdfjs-dist",
    "@napi-rs/canvas",
  ],
  // pdfjs-dist loads its worker script (pdf.worker.mjs) and standard font
  // data dynamically at runtime, not via a statically-visible import/require
  // — Next's standalone-output file tracer only follows static references,
  // so without this, those files are silently missing from
  // `.next/standalone/node_modules/...` in production (confirmed by an
  // actual standalone-server run: "Cannot find module
  // '.../pdf.worker.mjs'"), even though the build itself succeeds.
  outputFileTracingIncludes: {
    "/api/pdf-tools/**/*": [
      "../../node_modules/pdfjs-dist/**/*",
      "../../node_modules/.bun/pdfjs-dist@*/node_modules/pdfjs-dist/**/*",
    ],
  },
};

export default nextConfig;
