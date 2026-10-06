import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nayan-ui/react", "@nayan-ui/tools"],
  images: {
    unoptimized: true,
  },
  output: "standalone",
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
