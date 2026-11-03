// Renders a 1200×630 social banner (Open Graph / Twitter card) for every page in pages.ts, writes it
// to public/seo/<path>.png, and records the URLs in src/services/seo-banners.json for seo.ts.
//
//   bun scripts/seo-banners/generate.ts            # every page
//   bun scripts/seo-banners/generate.ts /react/button /games   # only these pages
//
// Compression is lossless: each banner is re-encoded several ways and only an encoding whose
// decoded pixels are identical to the render is kept (the smallest one).
import {
  createCanvas,
  GlobalFonts,
  loadImage,
  type Image,
  type SKRSContext2D,
} from "@napi-rs/canvas";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import type { LucideIcon } from "lucide-react";
import { getMenuItemByTag } from "../../src/services/Utils";
import { buildSpecs, type BannerSpec, type Visual } from "./pages";

const W = 1200;
const H = 630;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const OUT_DIR = join(ROOT, "public/seo");
const MANIFEST = join(ROOT, "src/services/seo-banners.json");
/** WhatsApp drops link previews whose image is larger than about 300 KB. */
const MAX_BYTES = 300 * 1024;
/** Pages that show another page's banner (their metadata passes `bannerFor`). */
const SHARED: Record<string, string> = { "/video-editor/start": "/video-editor" };

const FONT = "Inter";
for (const weight of ["Bold", "SemiBold", "Medium"])
  GlobalFonts.registerFromPath(join(HERE, `fonts/Inter-${weight}.ttf`), FONT);

const BG = "#0b1020";
const TEXT = "#f8fafc";
const MUTED = "#b4c0d6";
const FAINT = "#7d8aa5";

/** Banner path for a page: /seo/home.png for the home page, /seo/<path>.png otherwise. */
export const bannerFile = (path: string) => (path === "/" ? "/seo/home.png" : `/seo${path}.png`);

// ---------------------------------------------------------------------------------------------
// Drawing helpers

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const rgba = (hex: string, a: number) => `rgba(${hexToRgb(hex).join(",")},${a})`;
/** Mix a colour toward white, for text on the dark ground. */
const tint = (hex: string, amount: number) => {
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c + (255 - c) * amount));
  return `rgb(${r},${g},${b})`;
};

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function font(weight: 500 | 600 | 700, size: number) {
  return `${weight} ${size}px ${FONT}`;
}

/** Greedy word wrap. Returns null if the text needs more than maxLines lines. */
function wrap(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] | null {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) line = next;
    else {
      if (!line) return null; // One word wider than the line.
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length <= maxLines ? lines : null;
}

/**
 * The largest size at which the text fits in at most maxLines lines. One line is preferred; when it
 * needs two, the words are split where the lines come out most even (no single-word orphan).
 */
function fit(
  ctx: SKRSContext2D,
  text: string,
  weight: 500 | 600 | 700,
  sizes: number[],
  maxWidth: number,
  maxLines: number,
) {
  for (const size of sizes) {
    ctx.font = font(weight, size);
    if (ctx.measureText(text).width <= maxWidth) return { size, lines: [text] };
  }
  for (const size of sizes) {
    ctx.font = font(weight, size);
    if (maxLines >= 2) {
      const balanced = balance(ctx, text, maxWidth);
      if (balanced) return { size, lines: balanced };
    }
    const lines = wrap(ctx, text, maxWidth, maxLines);
    if (lines) return { size, lines };
  }
  return null;
}

/** Split into two lines where the longer of the two is as short as possible. */
function balance(ctx: SKRSContext2D, text: string, maxWidth: number): string[] | null {
  const words = text.split(/\s+/);
  let best: string[] | null = null;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const width = Math.max(...lines.map((line) => ctx.measureText(line).width));
    if (width <= maxWidth && width < bestWidth) {
      best = lines;
      bestWidth = width;
    }
  }
  return best;
}

const iconCache = new Map<string, Image>();
/** A Lucide icon as an image, drawn with the given stroke colour. */
async function iconImage(icon: LucideIcon, size: number, color: string, strokeWidth = 1.75) {
  const key = `${icon.displayName}|${size}|${color}|${strokeWidth}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const svg = renderToStaticMarkup(
    createElement(icon, { size, color, strokeWidth, absoluteStrokeWidth: false }),
  );
  const image = await loadImage(Buffer.from(svg));
  iconCache.set(key, image);
  return image;
}

const imageCache = new Map<string, Image>();
async function fileImage(file: string) {
  const cached = imageCache.get(file);
  if (cached) return cached;
  // Decode through sharp, so any format (webp, palette PNG) loads the same way.
  const image = await loadImage(await sharp(file).png().toBuffer());
  imageCache.set(file, image);
  return image;
}

/** Draw an image to cover the box (centre crop), clipped to a rounded rectangle. */
function drawCover(
  ctx: SKRSContext2D,
  img: Image,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  alignTop = false,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = alignTop ? 0 : (img.height - sh) / 2;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function glow(ctx: SKRSContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function gradient(
  ctx: SKRSContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  [a, b]: [string, string],
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

// ---------------------------------------------------------------------------------------------
// The right-hand visual, centred on (CX, CY)

const CX = 945;
const CY = 315;

async function drawVisual(ctx: SKRSContext2D, visual: Visual, theme: [string, string]) {
  switch (visual.kind) {
    case "icon": {
      const s = 270;
      const x = CX - s / 2;
      const y = CY - s / 2;
      // A tilted ghost tile behind, for depth.
      ctx.save();
      ctx.translate(CX + 26, CY - 14);
      ctx.rotate((10 * Math.PI) / 180);
      roundRect(ctx, -s / 2, -s / 2, s, s, 64);
      ctx.fillStyle = rgba(theme[1], 0.22);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.shadowColor = rgba(theme[0], 0.55);
      ctx.shadowBlur = 70;
      ctx.shadowOffsetY = 18;
      roundRect(ctx, x, y, s, s, 64);
      ctx.fillStyle = gradient(ctx, x, y, x + s, y + s, theme);
      ctx.fill();
      ctx.restore();
      // A soft top highlight on the tile.
      ctx.save();
      roundRect(ctx, x, y, s, s, 64);
      ctx.clip();
      const hl = ctx.createLinearGradient(0, y, 0, y + s);
      hl.addColorStop(0, "rgba(255,255,255,0.20)");
      hl.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.fillStyle = hl;
      ctx.fillRect(x, y, s, s);
      ctx.restore();
      const icon = await iconImage(visual.icon, 140, "#ffffff", 1.75);
      ctx.drawImage(icon, CX - 70, CY - 70, 140, 140);
      return;
    }
    case "iconGrid": {
      const tile = 104;
      const gap = 20;
      const rows = Math.ceil(visual.icons.length / visual.cols);
      const gw = visual.cols * tile + (visual.cols - 1) * gap;
      const gh = rows * tile + (rows - 1) * gap;
      const x0 = CX - gw / 2;
      const y0 = CY - gh / 2;
      const middle = Math.floor(visual.icons.length / 2) - (visual.icons.length % 2 === 0 ? 1 : 0);
      for (const [i, icon] of visual.icons.entries()) {
        const x = x0 + (i % visual.cols) * (tile + gap);
        const y = y0 + Math.floor(i / visual.cols) * (tile + gap);
        const featured = i === middle;
        ctx.save();
        if (featured) {
          ctx.shadowColor = rgba(theme[0], 0.55);
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 10;
        }
        roundRect(ctx, x, y, tile, tile, 26);
        ctx.fillStyle = featured
          ? gradient(ctx, x, y, x + tile, y + tile, theme)
          : "rgba(255,255,255,0.055)";
        ctx.fill();
        ctx.restore();
        if (!featured) {
          roundRect(ctx, x + 0.5, y + 0.5, tile - 1, tile - 1, 26);
          ctx.strokeStyle = "rgba(255,255,255,0.10)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        const img = await iconImage(
          icon,
          48,
          featured ? "#ffffff" : tint(theme[i % 2], 0.35),
          1.75,
        );
        ctx.drawImage(img, x + (tile - 48) / 2, y + (tile - 48) / 2, 48, 48);
      }
      return;
    }
    case "image": {
      // Screenshots are the costliest pixels in a lossless PNG; 316px keeps the largest under 250 KB.
      const s = 316;
      const x = CX - s / 2;
      const y = CY - s / 2;
      ctx.save();
      ctx.translate(CX + 22, CY - 10);
      ctx.rotate((8 * Math.PI) / 180);
      roundRect(ctx, -s / 2, -s / 2, s, s, 52);
      ctx.fillStyle = gradient(ctx, -s / 2, -s / 2, s / 2, s / 2, theme);
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 20;
      roundRect(ctx, x, y, s, s, 52);
      ctx.fillStyle = BG;
      ctx.fill();
      ctx.restore();
      drawCover(ctx, await fileImage(visual.src), x, y, s, s, 52);
      roundRect(ctx, x + 1, y + 1, s - 2, s - 2, 51);
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
    case "imageGrid": {
      const s = 156;
      const gap = 18;
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate((-6 * Math.PI) / 180);
      for (const [i, src] of visual.srcs.slice(0, 4).entries()) {
        const x = -s - gap / 2 + (i % 2) * (s + gap);
        const y = -s - gap / 2 + Math.floor(i / 2) * (s + gap);
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 36;
        ctx.shadowOffsetY = 14;
        roundRect(ctx, x, y, s, s, 34);
        ctx.fillStyle = BG;
        ctx.fill();
        ctx.restore();
        drawCover(ctx, await fileImage(src), x, y, s, s, 34);
        roundRect(ctx, x + 1, y + 1, s - 2, s - 2, 33);
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    case "screen": {
      // A wide app screenshot in a window frame, bleeding off the right edge.
      const x = 720;
      const w = 620;
      const bar = 30;
      const img = await fileImage(visual.src);
      const h = Math.round((w * img.height) / img.width) + bar;
      const y = CY - h / 2;
      ctx.save();
      ctx.shadowColor = rgba(theme[0], 0.45);
      ctx.shadowBlur = 70;
      ctx.shadowOffsetY = 18;
      roundRect(ctx, x, y, w, h, 18);
      ctx.fillStyle = "#131a2c";
      ctx.fill();
      ctx.restore();
      for (const [i, c] of ["#ff5f57", "#febc2e", "#28c840"].entries()) {
        ctx.beginPath();
        ctx.arc(x + 22 + i * 20, y + bar / 2, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      }
      ctx.save();
      roundRect(ctx, x, y, w, h, 18);
      ctx.clip();
      ctx.drawImage(img, x, y + bar, w, h - bar);
      ctx.restore();
      roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 18);
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// The banner

const LEFT = 80;
const TEXT_W = 600;

async function render(spec: BannerSpec) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const { theme } = spec;

  // Ground: navy with two soft accent glows.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  glow(ctx, CX, CY, 470, theme[0], 0.3);

  await drawVisual(ctx, spec.visual, theme);

  // Brand: logo mark and name.
  const logo = await fileImage(join(ROOT, "public/logo.webp"));
  const lh = 34;
  const lw = (logo.width / logo.height) * lh;
  ctx.drawImage(logo, LEFT, 62, lw, lh);
  ctx.font = font(700, 28);
  ctx.fillStyle = TEXT;
  ctx.textBaseline = "middle";
  ctx.fillText("Nayan UI", LEFT + lw + 14, 62 + lh / 2 + 1);

  // Eyebrow, title and tagline, centred as a block between the brand and the footer.
  ctx.font = font(700, 17);
  ctx.letterSpacing = "2px";
  const eyebrow = spec.eyebrow.toUpperCase();
  const ew = ctx.measureText(eyebrow).width + 36;
  ctx.letterSpacing = "0px";

  const title = fit(ctx, spec.title, 700, [80, 74, 68, 62, 56, 52], TEXT_W, 2);
  const tagline = fit(ctx, spec.tagline, 500, [31, 29, 27], TEXT_W + 30, 2);
  // Inter covers Latin text and common punctuation; anything else would render as a missing-glyph box.
  for (const text of [spec.eyebrow, spec.title, spec.tagline]) {
    const unsupported = text.match(/[^\x20-\x7E°·—–’×é]/u);
    if (unsupported)
      throw new Error(`"${unsupported[0]}" on ${spec.path} is not in the banner font: "${text}"`);
  }
  if (!title) throw new Error(`Title does not fit on ${spec.path}: "${spec.title}"`);
  if (!tagline) throw new Error(`Tagline does not fit on ${spec.path}: "${spec.tagline}"`);

  const titleLH = Math.round(title.size * 1.1);
  const tagLH = Math.round(tagline.size * 1.38);
  const eyebrowH = 40;
  const block = eyebrowH + 28 + title.lines.length * titleLH + 22 + tagline.lines.length * tagLH;
  let y = Math.round(130 + (530 - 130 - block) / 2);

  roundRect(ctx, LEFT, y, ew, eyebrowH, eyebrowH / 2);
  ctx.fillStyle = rgba(theme[0], 0.16);
  ctx.fill();
  roundRect(ctx, LEFT + 0.5, y + 0.5, ew - 1, eyebrowH - 1, eyebrowH / 2);
  ctx.strokeStyle = rgba(theme[0], 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = font(700, 17);
  ctx.letterSpacing = "2px";
  ctx.fillStyle = tint(theme[0], 0.55);
  ctx.fillText(eyebrow, LEFT + 18, y + eyebrowH / 2 + 1);
  ctx.letterSpacing = "0px";
  y += eyebrowH + 28;

  ctx.textBaseline = "alphabetic";
  ctx.font = font(700, title.size);
  ctx.fillStyle = TEXT;
  for (const line of title.lines) {
    ctx.fillText(line, LEFT - 3, y + title.size * 0.92);
    y += titleLH;
  }
  y += 22;
  ctx.font = font(500, tagline.size);
  ctx.fillStyle = MUTED;
  for (const line of tagline.lines) {
    ctx.fillText(line, LEFT, y + tagline.size * 0.95);
    y += tagLH;
  }

  // Footer: the page's address, and the accent bar along the bottom edge.
  ctx.font = font(600, 22);
  ctx.fillStyle = FAINT;
  ctx.textBaseline = "middle";
  const url = `nayanui.com${spec.path === "/" ? "" : spec.path}`;
  ctx.fillText(url, LEFT, 568);
  ctx.fillStyle = gradient(ctx, 0, 0, W, 0, theme);
  ctx.fillRect(0, H - 8, W, 8);

  return canvas;
}

// ---------------------------------------------------------------------------------------------
// Lossless compression

async function compress(rgba: Buffer): Promise<{ png: Buffer; method: string }> {
  // Every banner is opaque; drop the alpha channel so the PNG stores RGB only (exact: alpha is 255).
  const raw = { raw: { width: W, height: H, channels: 4 as const } };
  const rgb = await sharp(rgba, raw).removeAlpha().raw().toBuffer();
  const rgbRaw = { raw: { width: W, height: H, channels: 3 as const } };

  const unique = new Set<number>();
  for (let i = 0; i < rgb.length && unique.size <= 256; i += 3)
    unique.add((rgb[i]! << 16) | (rgb[i + 1]! << 8) | rgb[i + 2]!);

  const candidates: { method: string; make: () => Promise<Buffer> }[] = [
    {
      method: "rgb/adaptive",
      make: () =>
        sharp(rgb, rgbRaw).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(),
    },
    {
      method: "rgb/none",
      make: () =>
        sharp(rgb, rgbRaw).png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer(),
    },
  ];
  // A palette is lossless only when the image has 256 colours or fewer; verified below regardless.
  if (unique.size <= 256)
    candidates.push({
      method: "palette",
      make: () =>
        sharp(rgb, rgbRaw)
          .png({ compressionLevel: 9, palette: true, colours: unique.size, dither: 0, effort: 10 })
          .toBuffer(),
    });

  let best: { png: Buffer; method: string } | null = null;
  for (const candidate of candidates) {
    const png = await candidate.make();
    const decoded = await sharp(png).removeAlpha().raw().toBuffer();
    if (!decoded.equals(rgb)) continue; // Not lossless: discard.
    if (!best || png.length < best.png.length) best = { png, method: candidate.method };
  }
  if (!best) throw new Error("No lossless encoding reproduced the render");
  return best;
}

// ---------------------------------------------------------------------------------------------

async function main() {
  const only = process.argv.slice(2);
  const specs = buildSpecs();
  const paths = new Set<string>();
  for (const spec of specs) {
    if (paths.has(spec.path)) throw new Error(`Two banners for ${spec.path}`);
    paths.add(spec.path);
  }

  let manifest: Record<string, string> = {};
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch {}

  let rendered = 0;
  let before = 0;
  let after = 0;
  for (const spec of specs) {
    if (only.length && !only.includes(spec.path)) continue;
    const canvas = await render(spec);
    const original = canvas.toBuffer("image/png");
    const data = canvas.getContext("2d").getImageData(0, 0, W, H).data;
    const { png, method } = await compress(
      Buffer.from(data.buffer, data.byteOffset, data.byteLength),
    );
    const file = bannerFile(spec.path);
    mkdirSync(dirname(join(ROOT, "public", file)), { recursive: true });
    writeFileSync(join(ROOT, "public", file), png);
    const hash = createHash("sha1").update(png).digest("hex").slice(0, 8);
    manifest[spec.path] = `${file}?v=${hash}`;
    rendered++;
    before += original.length;
    after += png.length;
    if (only.length)
      console.log(`${spec.path} -> ${file} ${(png.length / 1024).toFixed(1)} KB (${method})`);
  }

  // Drop entries for pages that no longer exist; keep the file sorted for readable diffs.
  const sorted = Object.fromEntries(
    Object.entries(manifest)
      .filter(([path]) => paths.has(path))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
  if (rendered)
    console.log(
      `${rendered} banners: ${(before / 1024 / 1024).toFixed(2)} MB rendered -> ${(after / 1024 / 1024).toFixed(2)} MB lossless (${Math.round((1 - after / before) * 100)}% smaller)`,
    );
  checkCoverage(sorted);
}

/** The hub a tag page falls back to when no component has its tag (as its metadata does). */
const TAG_HUB: Record<string, string> = {
  react: "/react/tags",
  "react-native": "/react-native/tags",
  tools: "/tools",
};

/** Banner a page shows: its own, its component's (tag pages), or the page it shares one with. */
function bannerOf(
  path: string,
  manifest: Record<string, string>,
): { url?: string; stale?: boolean } {
  if (manifest[path]) return { url: manifest[path] };
  if (SHARED[path]) return { url: manifest[SHARED[path]] };
  const tag = path.match(/^\/(react|react-native|tools)\/tags\/([^/]+)$/);
  if (tag) {
    const owner = getMenuItemByTag(tag[2]!, path)?.link;
    return owner ? { url: manifest[owner] } : { url: manifest[TAG_HUB[tag[1]!]!], stale: true };
  }
  return {};
}

/** Every route in src/app and every URL in the sitemap must resolve to a banner under the size limit. */
function checkCoverage(manifest: Record<string, string>) {
  const appDir = join(ROOT, "src/app");
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === "page.tsx") {
        const route = `/${relative(appDir, dir)}`.replace(/\/$/, "") || "/";
        if (!route.includes("[")) routes.push(route); // Dynamic routes are checked through the sitemap.
      }
    }
  };
  walk(appDir);
  const sitemap = [
    ...readFileSync(join(ROOT, "public/sitemap.xml"), "utf8").matchAll(
      /<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g,
    ),
  ].map((m) => m[1]!.replace(/\/$/, "") || "/");
  const pages = [...new Set([...routes, ...sitemap])];
  const missing = pages.filter((path) => !bannerOf(path, manifest).url);
  // Tag URLs no component owns any more: the page says "Tag not found". They get the hub's banner.
  const stale = pages.filter((path) => bannerOf(path, manifest).stale);
  const heavy = Object.values(manifest)
    .map((url) => join(ROOT, "public", url.split("?")[0]!))
    .filter((file) => statSync(file).size > MAX_BYTES);

  console.log(
    `Coverage: ${pages.length - missing.length} of ${pages.length} pages (${routes.length} routes, ${sitemap.length} sitemap URLs) have a banner`,
  );
  if (stale.length)
    console.warn(
      `Warning: ${stale.length} sitemap tag URLs belong to no component (the page shows "Tag not found"):\n  ${stale.join("\n  ")}`,
    );
  if (missing.length) console.error(`No banner for:\n  ${missing.join("\n  ")}`);
  if (heavy.length) console.error(`Over ${MAX_BYTES / 1024} KB:\n  ${heavy.join("\n  ")}`);
  if (missing.length || heavy.length) process.exit(1);
}

await main();
