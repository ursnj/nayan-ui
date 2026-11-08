import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nayan-ui/react", "@nayan-ui/tools"],
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      // The games bundle imports its engine peer; resolve it from this website so the
      // games and the page share one engine instance (one WASM core, one audio context).
      // The engine locates engine_core_bg.wasm and audio-worklet.js, and the games their
      // sounds/textures/models, with `new URL(..., import.meta.url)`, which Turbopack
      // emits as static assets — no extra copying or public/ files are needed.
      // Point at the browser build itself: aliasing the package folder makes Turbopack follow its
      // "main" field (the React Native build, which imports react-native and expo-modules-core).
      "@nayan-ui/engine": "./node_modules/@nayan-ui/engine/lib/web/index.js",
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
