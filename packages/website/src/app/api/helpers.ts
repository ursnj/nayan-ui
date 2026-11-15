import { NextRequest, NextResponse } from "next/server";

const KB = 1024;
const MB = 1024 * KB;

/**
 * What one tool accepts. Each limit fits the tool's real use and the memory its work takes:
 * decoded images cost 4 bytes per pixel and PDF and Office parsers hold several copies of a
 * document, so a few large requests at once used to run the server out of memory.
 */
export interface ToolLimit {
  /** Largest request body the tool reads (files plus form fields, or a JSON/text body). */
  requestBytes: number;
  /** Largest single uploaded file. */
  fileBytes?: number;
  /** Largest combined size of several uploaded files. */
  totalBytes?: number;
  /** Most files in one request. */
  maxFiles?: number;
  /** Most pages a PDF may have. */
  maxPages?: number;
  /** Most pixels an input image (or a rendered PDF page) may decode to. */
  maxPixels?: number;
  /** Longest side of an image the tool produces. */
  maxSide?: number;
  /** Largest uncompressed contents of an Office (zip) document. */
  maxUnzippedBytes?: number;
  /** Largest response read from a fetched URL. */
  responseBytes?: number;
  /** CPU- or memory-heavy: runs in one of the limited processing slots. */
  heavy: boolean;
}

// The tools share a 512 MB container with the website and games, which come first: every limit
// below keeps one tool job to roughly 100 MB, and only one runs at a time.

// No tool accepts more than 5 MB of files, single or combined.
export const MAX_UPLOAD = 5 * MB;
// Images: 12 MP (4000 × 3000) decodes to ~48 MB of RGBA.
export const MAX_IMAGE_PIXELS = 12_000_000;
// Multipart boundaries and the small form fields that travel with a file.
const FORM_OVERHEAD = 1 * MB;
const upload = (
  fileBytes: number,
  extra: Omit<ToolLimit, "requestBytes" | "fileBytes">,
): ToolLimit & { fileBytes: number } => ({
  ...extra,
  fileBytes,
  requestBytes: (extra.totalBytes ?? fileBytes) + FORM_OVERHEAD,
});

const IMAGE = upload(MAX_UPLOAD, { maxPixels: MAX_IMAGE_PIXELS, maxSide: 6000, heavy: true });
// PDF edits with pdf-lib (the whole document is parsed and rewritten).
const PDF_EDIT = upload(MAX_UPLOAD, { maxPages: 200, heavy: true });
// PDF text conversions with pdf.js (every page is laid out and its text extracted).
const PDF_TEXT = upload(MAX_UPLOAD, { maxPages: 100, heavy: true });
// Office documents are zips; their XML is inflated and parsed in memory.
const OFFICE = upload(MAX_UPLOAD, { maxUnzippedBytes: 20 * MB, heavy: true });

export const TOOL_LIMITS = {
  "image-tools/resize": IMAGE,
  "image-tools/compress": IMAGE,
  "image-tools/convert": IMAGE,
  "image-tools/crop": IMAGE,
  "image-tools/rotate": IMAGE,
  "image-tools/watermark": IMAGE,
  "image-tools/favicon": upload(5 * MB, { maxPixels: MAX_IMAGE_PIXELS, heavy: true }),

  "pdf-tools/image-to-pdf": upload(MAX_UPLOAD, {
    totalBytes: MAX_UPLOAD,
    maxFiles: 10,
    maxPixels: MAX_IMAGE_PIXELS,
    heavy: true,
  }),
  "pdf-tools/merge": upload(MAX_UPLOAD, {
    totalBytes: MAX_UPLOAD,
    maxFiles: 5,
    maxPages: 200,
    heavy: true,
  }),
  "pdf-tools/compress": PDF_EDIT,
  "pdf-tools/crop": PDF_EDIT,
  "pdf-tools/info": PDF_EDIT,
  "pdf-tools/metadata": PDF_EDIT,
  "pdf-tools/organize": PDF_EDIT,
  "pdf-tools/page-numbers": PDF_EDIT,
  "pdf-tools/protect": PDF_EDIT,
  "pdf-tools/unlock": PDF_EDIT,
  "pdf-tools/repair": PDF_EDIT,
  "pdf-tools/rotate": PDF_EDIT,
  "pdf-tools/sign": PDF_EDIT,
  "pdf-tools/split": PDF_EDIT,
  "pdf-tools/watermark": PDF_EDIT,

  "pdf-tools/info-stats": PDF_TEXT,
  "pdf-tools/pdf-to-text": PDF_TEXT,
  "pdf-tools/pdf-to-markdown": PDF_TEXT,
  "pdf-tools/pdf-to-word": PDF_TEXT,
  "pdf-tools/pdf-to-excel": PDF_TEXT,
  "pdf-tools/pdf-to-ppt": PDF_TEXT,
  // One page at up to 200 DPI, capped at 12 MP (A4 at 200 DPI is ~3.9 MP).
  "pdf-tools/pdf-to-image": upload(MAX_UPLOAD, {
    maxPages: 200,
    maxPixels: MAX_IMAGE_PIXELS,
    heavy: true,
  }),
  // Every embedded image is decoded; images over the pixel limit are skipped.
  "pdf-tools/extract-images": upload(MAX_UPLOAD, {
    maxPages: 30,
    maxPixels: MAX_IMAGE_PIXELS,
    heavy: true,
  }),

  "pdf-tools/word-to-pdf": OFFICE,
  "pdf-tools/ppt-to-pdf": OFFICE,
  // exceljs keeps every cell as an object, far larger than the XML it came from.
  "pdf-tools/excel-to-pdf": upload(MAX_UPLOAD, { maxUnzippedBytes: 10 * MB, heavy: true }),
  "pdf-tools/html-to-pdf": { requestBytes: 512 * KB, heavy: true },
  "pdf-tools/markdown-to-pdf": { requestBytes: 512 * KB, heavy: true },

  "json-tools/json-to-excel": { requestBytes: 2 * MB, heavy: true },

  "seo-tools/fetch-url": { requestBytes: 16 * KB, responseBytes: 1 * MB, heavy: false },
  "seo-tools/og-preview": { requestBytes: 16 * KB, responseBytes: 512 * KB, heavy: false },
  "seo-tools/sitemap-generate": { requestBytes: 16 * KB, responseBytes: 1 * MB, heavy: false },

  // Its own rules (2–120 PNG frames of at most 640 × 360, MAX_UPLOAD in all) are checked in the route.
  "examples/logo-webp": { requestBytes: MAX_UPLOAD + FORM_OVERHEAD, heavy: true },
} satisfies Record<string, ToolLimit>;

export type ToolName = keyof typeof TOOL_LIMITS;

// JSON to Excel: rows and columns of one sheet.
export const JSON_TO_EXCEL_MAX_ROWS = 10_000;
export const JSON_TO_EXCEL_MAX_COLUMNS = 100;
// Sitemap generator: most URLs one crawl collects.
export const SITEMAP_MAX_URLS = 1000;

export const mb = (bytes: number) => `${Math.round((bytes / MB) * 10) / 10} MB`;

export function errorResponse(status: number, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers });
}

/** Thrown for a request a tool won't process; answered with its status (413 by default). */
export class ToolLimitError extends Error {
  constructor(
    message: string,
    readonly status = 413,
  ) {
    super(message);
  }
  response() {
    return errorResponse(this.status, this.message);
  }
}

export function validateFileSize(file: File, maxBytes: number): NextResponse | null {
  if (file.size > maxBytes) {
    return errorResponse(413, `File too large. Maximum size is ${mb(maxBytes)}.`);
  }
  return null;
}

export function validateFileSizes(files: File[], limit: ToolLimit): NextResponse | null {
  if (limit.maxFiles && files.length > limit.maxFiles) {
    return errorResponse(413, `Too many files. The maximum is ${limit.maxFiles}.`);
  }
  for (const file of files) {
    if (limit.fileBytes && file.size > limit.fileBytes) {
      return errorResponse(
        413,
        `"${file.name}" is too large. Maximum size per file is ${mb(limit.fileBytes)}.`,
      );
    }
  }
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (limit.totalBytes && totalSize > limit.totalBytes) {
    return errorResponse(413, `Total file size too large. Maximum is ${mb(limit.totalBytes)}.`);
  }
  return null;
}

export function validatePageCount(
  pages: number,
  maxPages: number | undefined,
): NextResponse | null {
  if (maxPages && pages > maxPages) {
    return errorResponse(413, `This PDF has ${pages} pages. The maximum is ${maxPages}.`);
  }
  return null;
}

// ─── Concurrency ────────────────────────────────────────────────────────────

const env = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

class Slots {
  private active = 0;
  private waiting: Array<() => void> = [];
  constructor(
    private readonly size: number,
    private readonly queue: number,
    private readonly waitMs: number,
  ) {}

  /** Resolves with a release function, or null when the queue is full or the wait times out. */
  acquire(): Promise<(() => void) | null> {
    const release = () => {
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    };
    if (this.active < this.size) {
      this.active++;
      return Promise.resolve(release);
    }
    if (this.waiting.length >= this.queue) return Promise.resolve(null);
    return new Promise((resolve) => {
      const start = () => {
        clearTimeout(timer);
        resolve(release);
      };
      const timer = setTimeout(() => {
        this.waiting = this.waiting.filter((waiter) => waiter !== start);
        resolve(null);
      }, this.waitMs);
      this.waiting.push(start);
    });
  }
}

interface ToolState {
  jobs: Slots;
  crawls: Slots;
  uploadBytes: number;
  /** When each tool may start its next request (ms since epoch). */
  nextStart: Map<string, number>;
}

// One state per process: route bundles may each load this module.
const state: ToolState = ((globalThis as { __nayanTools?: ToolState }).__nayanTools ??= {
  // One heavy job at a time (each can use ~100 MB); a few may wait, up to 30 seconds, for it.
  jobs: new Slots(env("TOOLS_MAX_JOBS", 1), env("TOOLS_MAX_QUEUE", 3), 30_000),
  // A sitemap crawl runs for up to two minutes; one at a time, no queue.
  crawls: new Slots(env("TOOLS_MAX_CRAWLS", 1), 0, 0),
  uploadBytes: 0,
  nextStart: new Map(),
});
// Request bodies being received or waiting for a slot, all held in memory.
const UPLOAD_BUDGET = env("TOOLS_UPLOAD_BUDGET_MB", 25) * MB;
// Above this resident memory (the whole server, native libraries included) no new tool job
// starts, so pages and games always have room: 512 MB container − ~100 MB for one job − headroom.
const MAX_RSS = env("TOOLS_MAX_RSS_MB", 320) * MB;
let lastCollect = 0;
/**
 * Whether memory is too high for another tool job. Memory a finished job left behind is often
 * just uncollected garbage, so when over the limit it collects once (at most every two seconds;
 * the server runs with --expose-gc) and looks again before turning the job away.
 */
function memoryHigh(): boolean {
  if (process.memoryUsage.rss() <= MAX_RSS) return false;
  const collect = (globalThis as { gc?: () => void }).gc;
  if (!collect || Date.now() - lastCollect < 2000) return true;
  lastCollect = Date.now();
  collect();
  return process.memoryUsage.rss() > MAX_RSS;
}

const busy = () =>
  errorResponse(503, "The tools are busy right now. Please try again in a few seconds.", {
    "Retry-After": "10",
  });

// ─── Rate limit ─────────────────────────────────────────────────────────────

// Each tool starts at most one request per interval, whoever sends it.
const RATE_INTERVAL_MS = env("TOOLS_RATE_LIMIT_MS", 1000);
// Requests wait their turn; once a tool has this much waiting, more are turned away (429).
const RATE_MAX_WAIT_MS = env("TOOLS_RATE_MAX_WAIT_S", 10) * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gives the request the tool's next start time, one interval after the previous request's, and
 * waits for it (before the body is read, so waiting requests hold no upload in memory). Returns
 * a 429 instead when the tool's line is already longer than RATE_MAX_WAIT_MS.
 */
async function waitForTurn(name: ToolName): Promise<Response | null> {
  const now = Date.now();
  const start = Math.max(now, state.nextStart.get(name) ?? 0);
  const wait = start - now;
  if (wait > RATE_MAX_WAIT_MS) {
    return errorResponse(429, "This tool is busy right now. Please try again in a few seconds.", {
      "Retry-After": String(Math.ceil(wait / 1000)),
    });
  }
  state.nextStart.set(name, start + RATE_INTERVAL_MS);
  if (wait > 0) await sleep(wait);
  return null;
}

/** Runs `work` in one of the sitemap crawl slots, or answers busy. */
export async function withCrawlSlot(work: () => Promise<Response>): Promise<Response> {
  const release = await state.crawls.acquire();
  if (!release) return busy();
  try {
    return await work();
  } finally {
    release();
  }
}

/** Reads a stream into one buffer, stopping as soon as it passes `maxBytes` (then returns null). */
async function readStream(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; truncated: boolean }> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  if (stream) {
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > maxBytes) {
        chunks.push(value.subarray(0, maxBytes - size));
        size = maxBytes;
        truncated = true;
        await reader.cancel().catch(() => {});
        break;
      }
      chunks.push(value);
      size += value.byteLength;
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, truncated };
}

/**
 * Wraps a tool's handler with its limits. Each tool starts one request per second, a body
 * whose declared size is too large is refused before it is read (and any body is read with a
 * hard cap), bodies held in memory share a byte budget, and heavy tools run only a few at a time,
 * so no mix of requests can exhaust memory.
 */
export function guardTool(name: ToolName, handler: (req: NextRequest) => Promise<Response>) {
  const limit: ToolLimit = TOOL_LIMITS[name];
  return async function POST(req: NextRequest): Promise<Response> {
    const tooLarge = () =>
      errorResponse(413, `Request too large. Maximum size is ${mb(limit.requestBytes)}.`);
    const declared = Number(req.headers.get("content-length") ?? NaN);
    if (declared > limit.requestBytes) return tooLarge();
    const refused = await waitForTurn(name);
    if (refused) return refused;

    if (limit.heavy && memoryHigh()) return busy();
    const reserved = declared > 0 ? declared : limit.requestBytes;
    if (state.uploadBytes + reserved > UPLOAD_BUDGET) return busy();
    state.uploadBytes += reserved;
    let release: (() => void) | null = null;
    try {
      const body = await readStream(req.body, limit.requestBytes);
      if (body.truncated) return tooLarge();
      if (limit.heavy) {
        release = await state.jobs.acquire();
        if (!release || memoryHigh()) return busy();
      }
      const buffered = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: body.bytes.byteLength ? body.bytes : undefined,
      });
      return await handler(buffered);
    } catch (err) {
      if (err instanceof ToolLimitError) return err.response();
      throw err;
    } finally {
      release?.();
      state.uploadBytes -= reserved;
    }
  };
}

// ─── Images ─────────────────────────────────────────────────────────────────

type Sharp = Awaited<typeof import("sharp")>["default"];
let sharpReady: Promise<Sharp> | undefined;

/** sharp with its operation cache off, so decoded images are freed once a request ends. */
export function loadSharp(): Promise<Sharp> {
  sharpReady ??= import("sharp").then(({ default: sharp }) => {
    sharp.cache(false);
    return sharp;
  });
  return sharpReady;
}

/** sharp options for an input image: a second guard against decoding past the tool's limit. */
export const imageInput = (limit: ToolLimit) => ({ limitInputPixels: limit.maxPixels ?? false });

/**
 * Reads only an image's header and refuses one that would decode to more than the tool's pixel
 * limit, so a small, highly compressed file can't expand into gigabytes of pixels.
 */
export async function checkImage(buffer: Buffer, limit: ToolLimit, label = "The image") {
  const sharp = await loadSharp();
  let meta: Awaited<ReturnType<ReturnType<Sharp>["metadata"]>>;
  try {
    meta = await sharp(buffer, { limitInputPixels: false }).metadata();
  } catch {
    throw new ToolLimitError(`${label} is not a supported image.`, 415);
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new ToolLimitError(`${label} is not a supported image.`, 415);
  const maxPixels = limit.maxPixels ?? Infinity;
  if (width * height > maxPixels) {
    throw new ToolLimitError(
      `${label} is ${width} × ${height} (${((width * height) / 1e6).toFixed(1)} MP). The maximum is ${maxPixels / 1e6} megapixels.`,
    );
  }
  return { width, height, hasAlpha: meta.hasAlpha ?? false, format: meta.format };
}

/** Refuses an output image larger than the tool's side or pixel limit. */
export function checkOutputSize(width: number, height: number, limit: ToolLimit) {
  const maxSide = limit.maxSide ?? Infinity;
  const maxPixels = limit.maxPixels ?? Infinity;
  if (width > maxSide || height > maxSide || width * height > maxPixels) {
    throw new ToolLimitError(
      `The result would be ${Math.round(width)} × ${Math.round(height)}. The maximum is ${maxSide} px per side and ${maxPixels / 1e6} megapixels.`,
    );
  }
}

// ─── Office documents ───────────────────────────────────────────────────────

/**
 * Refuses a zip (docx, pptx, xlsx) whose files inflate past the tool's limit, reading only its
 * directory, so a small zip bomb is never decompressed. Returns false when it isn't a zip.
 */
export async function checkZip(buffer: Buffer, limit: ToolLimit): Promise<boolean> {
  const JSZip = (await import("jszip")).default;
  let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return false;
  }
  let total = 0;
  zip.forEach((_, entry) => {
    // JSZip reads sizes from the zip's directory without inflating anything.
    total +=
      (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
  });
  const maxBytes = limit.maxUnzippedBytes ?? Infinity;
  if (total > maxBytes) {
    throw new ToolLimitError(
      `This document unpacks to ${mb(total)}. The maximum is ${mb(maxBytes)}.`,
    );
  }
  return true;
}

// ─── Fetched pages ──────────────────────────────────────────────────────────

/**
 * Reads a fetched response as text, up to `maxBytes`. With `truncate`, a longer body is cut there
 * (enough for a page's head and links); otherwise it is refused.
 */
export async function readTextLimited(res: Response, maxBytes: number, truncate = false) {
  const declared = Number(res.headers.get("content-length") ?? NaN);
  if (!truncate && declared > maxBytes) {
    await res.body?.cancel().catch(() => {});
    throw new ToolLimitError(`The response is larger than ${mb(maxBytes)}.`);
  }
  const { bytes, truncated } = await readStream(res.body, maxBytes);
  if (truncated && !truncate)
    throw new ToolLimitError(`The response is larger than ${mb(maxBytes)}.`);
  return new TextDecoder().decode(bytes);
}
