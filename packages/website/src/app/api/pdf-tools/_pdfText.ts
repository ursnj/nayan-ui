import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { MAX_IMAGE_PIXELS, ToolLimitError } from "../helpers";

// Resolved lazily, on first actual use, via `process.getBuiltinModule("module")`
// rather than `import { createRequire } from "node:module"` or
// `import.meta.resolve`.
//
// pdfjs-dist is listed in next.config.ts's serverExternalPackages (needed so
// Next doesn't try to bundle its WASM/worker internals). In Next's compiled
// standalone server output, any *statically recognizable* module-resolution
// call targeting an externalized package gets intercepted by Next's own
// require layer instead of reaching Node's real resolver — confirmed against
// the actual built standalone server (not just `next build`'s exit code),
// across three different attempts: a literal `require.resolve(...)` returned
// a Turbopack-internal module id (".lastIndexOf is not a function" when
// treated as a path), a dynamically-built specifier was flatly refused
// ("Cannot find module as expression is too dynamic"), and even native
// `import.meta.resolve` broke ("r.resolve is not a function" — Turbopack
// evidently shims that too). `process.getBuiltinModule("module")` reaches
// Node's `module` built-in via a plain property lookup on the `process`
// global rather than any import/require syntax, so it's invisible to all of
// that static analysis — this is the exact technique pdfjs-dist's own Node
// code (node_utils.js, see e.g. its NodeCanvasFactory) uses internally to
// load `@napi-rs/canvas` for the same reason, so it's proven to work in
// this exact bundling environment, not just a guess.
//
// In the standalone server there is no node_modules/pdfjs-dist to resolve: Next reaches the
// externalized package through a hashed link in .next/node_modules (pdfjs-dist-<hash>, kept by the
// file tracer), so that's where the fonts are found when the normal lookup fails.
let standardFontDataUrl: string | undefined;
function getStandardFontDataUrl(): string {
  if (!standardFontDataUrl) {
    let pdfjsRoot: string;
    try {
      const nodeRequire = process.getBuiltinModule("module").createRequire(import.meta.url);
      const pdfjsEntry = nodeRequire.resolve("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjsRoot = pdfjsEntry.slice(0, pdfjsEntry.lastIndexOf("/legacy/"));
    } catch (err) {
      const fs = process.getBuiltinModule("fs");
      const path = process.getBuiltinModule("path");
      const linked = path.join(process.cwd(), ".next", "node_modules");
      const name = fs.existsSync(linked)
        ? fs.readdirSync(linked).find((entry) => entry.startsWith("pdfjs-dist-"))
        : undefined;
      if (!name) throw err;
      pdfjsRoot = fs.realpathSync(path.join(linked, name));
    }
    standardFontDataUrl = `${pdfjsRoot}/standard_fonts/`;
  }
  return standardFontDataUrl;
}

// Reconstructs readable lines from pdf.js's flat, position-less text items by
// grouping items whose baseline y-coordinate is close together. Plain
// concatenation of items loses all line structure.
function itemsToLines(items: TextItem[]): string {
  const lines: string[] = [];
  let current: string[] = [];
  let lastY: number | null = null;

  for (const item of items) {
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > 2.5) {
      if (current.length) lines.push(current.join("").trimEnd());
      current = [];
    }
    current.push(item.str);
    lastY = y;
    if (item.hasEOL) {
      lines.push(current.join("").trimEnd());
      current = [];
      lastY = null;
    }
  }
  if (current.length) lines.push(current.join("").trimEnd());
  return lines.join("\n").trim();
}

// `useSystemFonts: false` is required here even though it reads backwards:
// pdfjs-dist's fetchStandardFontData() skips loading its bundled Foxit
// standard-font substitutes whenever useSystemFonts is true (it assumes a
// real @font-face will render text instead) — but disableFontFace:true (the
// correct setting for headless Node rendering) disables that path too,
// leaving non-embedded standard fonts (e.g. pdf-lib's StandardFonts.*, used
// throughout this app's own PDF generators) with no way to produce glyphs at
// all. Flipping useSystemFonts off restores the bundled-substitute path.
//
// `maxImageSize` makes pdf.js skip embedded images over the pixel limit instead of decoding them.
async function loadPdf(bytes: Uint8Array, maxImagePixels = MAX_IMAGE_PIXELS) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // pdf.js transfers the input buffer to its (same-thread, fake) worker via
  // postMessage, which detaches it — always hand it a private copy so the
  // caller's own buffer survives for any other use.
  const loadingTask = pdfjs.getDocument({
    data: bytes.slice(0),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: false,
    disableFontFace: true,
    standardFontDataUrl: getStandardFontDataUrl(),
    maxImageSize: maxImagePixels,
  });
  return loadingTask.promise;
}

function checkPages(pdf: { numPages: number }, maxPages: number | undefined) {
  if (maxPages && pdf.numPages > maxPages) {
    throw new ToolLimitError(`This PDF has ${pdf.numPages} pages. The maximum is ${maxPages}.`);
  }
}

export const NO_TEXT_FALLBACK = "No extractable text on this page (likely a scanned image).";

export async function extractPdfPageTexts(bytes: Uint8Array, maxPages?: number): Promise<string[]> {
  const pdf = await loadPdf(bytes);
  try {
    checkPages(pdf, maxPages);
    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      try {
        const content = await page.getTextContent();
        const items = content.items.filter((item): item is TextItem => "str" in item);
        const text = itemsToLines(items);
        pageTexts.push(text || NO_TEXT_FALLBACK);
      } finally {
        await page.cleanup();
      }
    }
    return pageTexts;
  } finally {
    await pdf.destroy();
  }
}

export async function renderPdfPageToImage(
  bytes: Uint8Array,
  pageNumber: number,
  options: { dpi?: number; format?: "png" | "jpeg"; maxPixels?: number } = {},
): Promise<Buffer> {
  const { createCanvas } = await import("@napi-rs/canvas");
  const dpi = options.dpi ?? 150;
  const format = options.format ?? "png";

  const pdf = await loadPdf(bytes);
  try {
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Page ${pageNumber} is out of bounds — this PDF has ${pdf.numPages} page(s)`);
    }
    const page = await pdf.getPage(pageNumber);
    try {
      // Lower the resolution of an unusually large page so its canvas stays within maxPixels.
      const base = page.getViewport({ scale: 1 });
      const maxScale = Math.sqrt((options.maxPixels ?? Infinity) / (base.width * base.height));
      const viewport = page.getViewport({ scale: Math.min(dpi / 72, maxScale) });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport })
        .promise;
      return format === "jpeg" ? await canvas.encode("jpeg") : await canvas.encode("png");
    } finally {
      await page.cleanup();
    }
  } finally {
    await pdf.destroy();
  }
}
