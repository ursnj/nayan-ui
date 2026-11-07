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
import { losslessCompressPng } from "@napi-rs/image";
import sharp from "sharp";
import type { LucideIcon } from "lucide-react";
import { getMenuItemByTag } from "../../src/services/Utils";
import { buildSpecs, type BannerSpec } from "./pages";

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
GlobalFonts.registerFromPath(join(HERE, "fonts/JetBrainsMono-Medium.ttf"), "JetBrains Mono");

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
  // A word that starts a line may itself be wider than the line.
  if ([...lines, line].some((l) => ctx.measureText(l).width > maxWidth)) return null;
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
/** An image file, optionally blurred and dimmed (background screenshots: depth, and far fewer bytes). */
async function fileImage(file: string, background = false) {
  const key = `${file}|${background}`;
  const cached = imageCache.get(key);
  if (cached) return cached;
  // Decode through sharp, so any format (webp, palette PNG) loads the same way.
  let pipeline = sharp(file);
  if (background) pipeline = pipeline.resize({ width: 300 }).blur(6).modulate({ brightness: 0.6 });
  const image = await loadImage(await pipeline.png().toBuffer());
  imageCache.set(key, image);
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
// The right-hand composition, centred on (CX, CY)

const CX = 925;
const CY = 322;
const PANEL = "#0d1324";
const MONO = "JetBrains Mono";

/** A small deterministic random source, so a page's banner is the same on every run. */
function seeded(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function bar(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, fill: string | CanvasGradient) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * A raised glass surface: a deep drop shadow, an accent glow, an opaque body (so nothing behind shows
 * through), a top sheen and a hairline border that is brighter at the top-left, where the light is.
 */
function panel(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  theme: [string, string],
  { glowAlpha = 0.4, fill = PANEL }: { glowAlpha?: number; fill?: string } = {},
) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 26;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  if (glowAlpha > 0) {
    ctx.save();
    ctx.shadowColor = rgba(theme[0], glowAlpha);
    ctx.shadowBlur = 90;
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, y, 0, y + h);
  sheen.addColorStop(0, "rgba(255,255,255,0.07)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.015)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  roundRect(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
  const edge = ctx.createLinearGradient(x, y, x + w, y + h);
  edge.addColorStop(0, "rgba(255,255,255,0.26)");
  edge.addColorStop(0.5, "rgba(255,255,255,0.08)");
  edge.addColorStop(1, rgba(theme[1], 0.25));
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** A gradient icon tile with a glow, a top highlight and the icon in white. */
async function badge(
  ctx: SKRSContext2D,
  cx: number,
  cy: number,
  size: number,
  icon: LucideIcon,
  theme: [string, string],
) {
  const x = cx - size / 2;
  const y = cy - size / 2;
  const r = size * 0.27;
  ctx.save();
  ctx.shadowColor = rgba(theme[0], 0.6);
  ctx.shadowBlur = size * 0.5;
  ctx.shadowOffsetY = size * 0.12;
  roundRect(ctx, x, y, size, size, r);
  ctx.fillStyle = gradient(ctx, x, y, x + size, y + size, theme);
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, size, size, r);
  ctx.clip();
  const hl = ctx.createLinearGradient(0, y, 0, y + size);
  hl.addColorStop(0, "rgba(255,255,255,0.28)");
  hl.addColorStop(0.55, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.fillRect(x, y, size, size);
  ctx.restore();
  roundRect(ctx, x + 0.75, y + 0.75, size - 1.5, size - 1.5, r);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const s = Math.round(size * 0.5);
  ctx.drawImage(await iconImage(icon, s, "#ffffff", 2), cx - s / 2, cy - s / 2, s, s);
}

type Chrome = { tab?: string; address?: string };

/** A window: panel, traffic lights, and a tab title or an address bar. Returns the body's top. */
function windowFrame(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: [string, string],
  chrome: Chrome,
  fill = PANEL,
) {
  panel(ctx, x, y, w, h, 20, theme, { fill });
  const barH = 46;
  for (const [i, c] of ["#ff5f57", "#febc2e", "#28c840"].entries()) {
    ctx.beginPath();
    ctx.arc(x + 24 + i * 19, y + barH / 2, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  }
  ctx.textBaseline = "middle";
  if (chrome.address) {
    const ax = x + 92;
    const aw = w - 92 - 22;
    roundRect(ctx, ax, y + 11, aw, barH - 22, 12);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.font = `500 14px ${MONO}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(ellipsize(ctx, chrome.address, aw - 40), ax + 30, y + barH / 2 + 1);
    // A padlock: a body and a shackle.
    roundRect(ctx, ax + 12, y + barH / 2 - 2, 10, 8, 2);
    ctx.fillStyle = tint(theme[0], 0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ax + 17, y + barH / 2 - 2, 3.2, Math.PI, 0);
    ctx.strokeStyle = tint(theme[0], 0.5);
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else if (chrome.tab) {
    ctx.font = `500 15px ${MONO}`;
    const tw = ctx.measureText(chrome.tab).width + 28;
    roundRect(ctx, x + 92, y + 10, tw, barH - 20, 9);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
    ctx.fillStyle = tint(theme[0], 0.6);
    ctx.fillText(chrome.tab, x + 106, y + barH / 2 + 1);
  }
  ctx.beginPath();
  ctx.moveTo(x + 1, y + barH + 0.5);
  ctx.lineTo(x + w - 1, y + barH + 0.5);
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.stroke();
  return y + barH;
}

function ellipsize(ctx: SKRSContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/** A dimmer, smaller panel behind the main one, offset up and right: depth without clutter. */
function backPanel(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, theme: [string, string]) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  panel(ctx, x + 46, y - 40, w * 0.9, h * 0.9, 22, theme, { glowAlpha: 0, fill: "#111830" });
  ctx.restore();
}

/** A phone: bezel, screen and dynamic island. Returns the screen box. */
function phoneFrame(ctx: SKRSContext2D, cx: number, cy: number, w: number, h: number, theme: [string, string]) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  panel(ctx, x, y, w, h, 44, theme, { fill: "#05070d" });
  const inset = 9;
  const screen = { x: x + inset, y: y + inset, w: w - inset * 2, h: h - inset * 2, r: 36 };
  roundRect(ctx, screen.x, screen.y, screen.w, screen.h, screen.r);
  ctx.fillStyle = PANEL;
  ctx.fill();
  return screen;
}

function island(ctx: SKRSContext2D, screen: { x: number; y: number; w: number }) {
  bar(ctx, screen.x + screen.w / 2 - 38, screen.y + 12, 76, 22, "#000000");
}

function phoneScreenEdge(ctx: SKRSContext2D, screen: { x: number; y: number; w: number; h: number; r: number }) {
  roundRect(ctx, screen.x + 0.5, screen.y + 0.5, screen.w - 1, screen.h - 1, screen.r);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

type Point = { x: number; y: number };

async function drawVisual(ctx: SKRSContext2D, spec: BannerSpec): Promise<Point> {
  const { theme, visual } = spec;
  const soft = "rgba(255,255,255,0.10)";
  const softer = "rgba(255,255,255,0.06)";
  const accent = gradient(ctx, CX - 200, 0, CX + 200, 0, theme);
  const random = seeded(spec.path);
  switch (visual.kind) {
    case "app": {
      const w = 480;
      const h = 340;
      const x = CX - w / 2 + 10;
      const y = CY - h / 2;
      backPanel(ctx, x, y, w, h, theme);
      const top = windowFrame(ctx, x, y, w, h, theme, { tab: visual.label });
      // Sidebar with one active item.
      const sx = x + 22;
      for (let i = 0; i < 5; i++) {
        const iy = top + 26 + i * 40;
        if (i === 1) {
          roundRect(ctx, sx - 8, iy - 9, 112, 32, 10);
          ctx.fillStyle = rgba(theme[0], 0.22);
          ctx.fill();
        }
        bar(ctx, sx, iy + 2, 10, 10, i === 1 ? tint(theme[0], 0.4) : soft);
        bar(ctx, sx + 20, iy + 3, 50 + random() * 30, 8, i === 1 ? tint(theme[0], 0.55) : softer);
      }
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x + 140, top + 1, 1, h - (top - y) - 2);
      // Main area: the component's icon, a heading, then two cards and the primary action.
      const mx = x + 166;
      await badge(ctx, mx + 42, top + 66, 84, visual.icon, theme);
      bar(ctx, mx + 104, top + 44, 150, 14, "rgba(255,255,255,0.22)");
      bar(ctx, mx + 104, top + 70, 110, 10, soft);
      for (let i = 0; i < 2; i++) {
        const cx0 = mx + i * 146;
        const cy0 = top + 134;
        roundRect(ctx, cx0, cy0, 132, 92, 14);
        ctx.fillStyle = "rgba(255,255,255,0.045)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        bar(ctx, cx0 + 16, cy0 + 18, 26, 26, i === 0 ? rgba(theme[1], 0.55) : soft);
        bar(ctx, cx0 + 16, cy0 + 56, 80 + random() * 20, 8, soft);
        bar(ctx, cx0 + 16, cy0 + 72, 50 + random() * 20, 8, softer);
      }
      // Toggle and button.
      const by = top + 246;
      bar(ctx, mx, by + 4, 44, 24, accent);
      ctx.beginPath();
      ctx.arc(mx + 32, by + 16, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      bar(ctx, mx + 168, by, 124, 32, accent);
      bar(ctx, mx + 196, by + 12, 68, 8, "rgba(255,255,255,0.85)");
      return { x: x - 34, y: y + h - 26 };
    }
    case "phone": {
      const w = 252;
      const h = 486;
      const cx = CX + 30;
      // A second phone behind, turned slightly: depth for the native family.
      ctx.save();
      ctx.translate(cx - 120, CY + 14);
      ctx.rotate((-9 * Math.PI) / 180);
      ctx.globalAlpha = 0.5;
      phoneFrame(ctx, 0, 0, w * 0.86, h * 0.86, theme);
      ctx.restore();
      const screen = phoneFrame(ctx, cx, CY, w, h, theme);
      ctx.save();
      roundRect(ctx, screen.x, screen.y, screen.w, screen.h, screen.r);
      ctx.clip();
      const wash = ctx.createLinearGradient(0, screen.y, 0, screen.y + 220);
      wash.addColorStop(0, rgba(theme[0], 0.35));
      wash.addColorStop(1, rgba(theme[0], 0));
      ctx.fillStyle = wash;
      ctx.fillRect(screen.x, screen.y, screen.w, 220);
      ctx.restore();
      island(ctx, screen);
      const left = screen.x + 22;
      await badge(ctx, cx, screen.y + 112, 92, visual.icon, theme);
      bar(ctx, cx - 70, screen.y + 180, 140, 13, "rgba(255,255,255,0.24)");
      bar(ctx, cx - 48, screen.y + 204, 96, 9, soft);
      for (let i = 0; i < 3; i++) {
        const ry = screen.y + 238 + i * 54;
        roundRect(ctx, left, ry, screen.w - 44, 44, 14);
        ctx.fillStyle = i === 0 ? rgba(theme[0], 0.2) : "rgba(255,255,255,0.05)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(left + 22, ry + 22, 9, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? tint(theme[0], 0.45) : soft;
        ctx.fill();
        bar(ctx, left + 42, ry + 18, 70 + random() * 40, 8, i === 0 ? tint(theme[0], 0.6) : soft);
      }
      bar(ctx, left, screen.y + screen.h - 66, screen.w - 44, 42, accent);
      bar(ctx, cx - 34, screen.y + screen.h - 49, 68, 8, "rgba(255,255,255,0.85)");
      phoneScreenEdge(ctx, screen);
      return { x: cx - w / 2 - 168, y: CY + h / 2 - 46 };
    }
    case "browser": {
      const w = 500;
      const h = 340;
      const x = CX - w / 2 + 10;
      const y = CY - h / 2;
      backPanel(ctx, x, y, w, h, theme);
      const top = windowFrame(ctx, x, y, w, h, theme, { address: visual.label });
      // A drop zone holding the tool's icon, then its actions.
      const zx = x + 26;
      const zy = top + 24;
      const zw = w - 52;
      const zh = 186;
      roundRect(ctx, zx, zy, zw, zh, 16);
      ctx.fillStyle = rgba(theme[0], 0.07);
      ctx.fill();
      ctx.setLineDash([9, 7]);
      ctx.strokeStyle = rgba(theme[0], 0.55);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);
      await badge(ctx, zx + zw / 2, zy + 78, 88, visual.icon, theme);
      bar(ctx, zx + zw / 2 - 80, zy + 140, 160, 10, soft);
      bar(ctx, zx + zw / 2 - 54, zy + 160, 108, 8, softer);
      const by = zy + zh + 24;
      bar(ctx, zx, by, 150, 12, softer);
      bar(ctx, zx + zw - 130, by - 10, 130, 34, accent);
      bar(ctx, zx + zw - 98, by + 3, 66, 8, "rgba(255,255,255,0.85)");
      bar(ctx, zx + zw - 236, by - 10, 94, 34, "rgba(255,255,255,0.07)");
      return { x: x - 34, y: y + h - 26 };
    }
    case "code": {
      const w = 500;
      const h = 336;
      const x = CX - w / 2;
      const y = CY - h / 2 + 12;
      backPanel(ctx, x, y, w, h, theme);
      const top = windowFrame(ctx, x, y, w, h, theme, { tab: visual.label }, "#0b1020");
      // Code: line numbers and token bars in a few syntax colours, indented like a real file.
      const palette = [tint(theme[0], 0.35), tint(theme[1], 0.3), "#7dd3fc", "#fcd34d", "rgba(255,255,255,0.32)"];
      const indents = [0, 0, 1, 2, 2, 1, 2, 3, 2, 1, 0];
      for (const [i, indent] of indents.entries()) {
        const ly = top + 26 + i * 25;
        ctx.font = `500 13px ${MONO}`;
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1).padStart(2, " "), x + 20, ly + 4);
        if (i === 1) continue; // A blank line between imports and code.
        let tx = x + 62 + indent * 22;
        const tokens = 1 + Math.floor(random() * 3);
        for (let t = 0; t < tokens; t++) {
          const tw = 28 + random() * 70;
          if (tx + tw > x + w - 30) break;
          bar(ctx, tx, ly, tw, 9, palette[Math.floor(random() * palette.length)]!);
          tx += tw + 10;
        }
      }
      // The highlighted line the guide is about.
      ctx.fillStyle = rgba(theme[0], 0.12);
      ctx.fillRect(x + 1, top + 26 + 4 * 25 - 8, w - 2, 25);
      ctx.fillStyle = gradient(ctx, 0, 0, 0, 1, theme);
      ctx.fillRect(x + 1, top + 26 + 4 * 25 - 8, 3, 25);
      await badge(ctx, x + w - 58, y - 8, 100, visual.icon, theme);
      return { x: x - 34, y: y + h - 26 };
    }
    case "terminal": {
      const w = 480;
      const h = 262;
      const x = CX - w / 2 - 10;
      const y = CY - h / 2 + 20;
      backPanel(ctx, x, y, w, h, theme);
      const top = windowFrame(ctx, x, y, w, h, theme, { tab: "zsh" }, "#080c18");
      ctx.textBaseline = "middle";
      ctx.font = `500 20px ${MONO}`;
      const lx = x + 28;
      let ly = top + 46;
      ctx.fillStyle = tint(theme[0], 0.45);
      ctx.fillText("$", lx, ly);
      ctx.fillStyle = TEXT;
      ctx.fillText(visual.command, lx + 24, ly);
      ly += 44;
      ctx.font = `500 17px ${MONO}`;
      ctx.fillStyle = "#4ade80";
      ctx.fillText("✓", lx, ly);
      ctx.fillStyle = FAINT;
      ctx.fillText("added 1 package, ready to go", lx + 24, ly);
      ly += 50;
      ctx.font = `500 21px ${MONO}`;
      ctx.fillStyle = tint(theme[0], 0.45);
      ctx.fillText("$", lx, ly);
      ctx.fillStyle = tint(theme[0], 0.55);
      ctx.fillRect(lx + 26, ly - 12, 12, 24);
      await badge(ctx, x + w - 40, y - 12, 96, visual.icon, theme);
      return { x: x - 34, y: y + h - 26 };
    }
    case "shot": {
      const w = 230;
      const h = 448;
      const cx = CX + 20;
      ctx.save();
      ctx.translate(cx + 16, CY - 8);
      ctx.rotate((7 * Math.PI) / 180);
      roundRect(ctx, -w / 2, -h / 2, w, h, 44);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = gradient(ctx, -w / 2, -h / 2, w / 2, h / 2, theme);
      ctx.fill();
      ctx.restore();
      const screen = phoneFrame(ctx, cx, CY, w, h, theme);
      drawCover(ctx, await fileImage(visual.src), screen.x, screen.y, screen.w, screen.h, screen.r);
      island(ctx, screen);
      phoneScreenEdge(ctx, screen);
      return { x: cx - w / 2 - 70, y: CY + h / 2 - 70 };
    }
    case "shots": {
      const w = 196;
      const h = 386;
      const images = await Promise.all(
        visual.srcs.map((src, i) => fileImage(src, i !== 1)), // the middle one is in front, in focus
      );
      const place = [
        { dx: -160, dy: 24, angle: -10, scale: 0.84 },
        { dx: 160, dy: 24, angle: 10, scale: 0.84 },
        { dx: 0, dy: 0, angle: 0, scale: 1 },
      ];
      const order = [0, 2, 1]; // side, side, then the front phone on top
      for (const [i, p] of place.entries()) {
        const img = images[order[i]!]!;
        ctx.save();
        ctx.translate(CX + p.dx, CY + p.dy);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.scale(p.scale, p.scale);
        const screen = phoneFrame(ctx, 0, 0, w, h, theme);
        drawCover(ctx, img, screen.x, screen.y, screen.w, screen.h, screen.r);
        island(ctx, screen);
        phoneScreenEdge(ctx, screen);
        ctx.restore();
      }
      return { x: CX - 300, y: CY + h / 2 - 40 };
    }
    case "bento": {
      const tile = 116;
      const gap = 18;
      const cols = 3;
      const gw = cols * tile + (cols - 1) * gap;
      const gh = 2 * tile + gap;
      const x0 = CX - gw / 2;
      const y0 = CY - gh / 2;
      const featured = 2;
      for (const [i, icon] of visual.icons.slice(0, 6).entries()) {
        const x = x0 + (i % cols) * (tile + gap);
        const y = y0 + Math.floor(i / cols) * (tile + gap);
        if (i === featured) {
          await badge(ctx, x + tile / 2, y + tile / 2, tile, icon, theme);
          continue;
        }
        panel(ctx, x, y, tile, tile, 28, theme, { glowAlpha: 0.12 });
        const s = 46;
        const img = await iconImage(icon, s, tint(theme[i % 2], 0.4), 1.75);
        ctx.drawImage(img, x + (tile - s) / 2, y + (tile - s) / 2, s, s);
      }
      return { x: x0 - 30, y: y0 + gh + 22 };
    }
    case "screen": {
      const x = 700;
      const w = 640;
      const img = await fileImage(visual.src);
      const bodyH = Math.round((w * img.height) / img.width);
      const h = bodyH + 46;
      const y = CY - h / 2;
      const top = windowFrame(ctx, x, y, w, h, theme, { address: visual.label });
      ctx.save();
      roundRect(ctx, x, y, w, h, 20);
      ctx.clip();
      ctx.drawImage(img, x, top, w, bodyH);
      ctx.restore();
      return { x: x - 20, y: y + h - 20 };
    }
  }
}

/** The package chip, floating over the visual's lower-left corner. */
function drawChip(ctx: SKRSContext2D, text: string, at: Point, theme: [string, string]) {
  ctx.font = `500 16px ${MONO}`;
  const w = ctx.measureText(text).width + 52;
  const h = 40;
  panel(ctx, at.x, at.y, w, h, h / 2, theme, { glowAlpha: 0.25, fill: "#121a30" });
  ctx.beginPath();
  ctx.arc(at.x + 21, at.y + h / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = gradient(ctx, at.x + 16, 0, at.x + 26, 0, theme);
  ctx.fill();
  ctx.fillStyle = TEXT;
  ctx.textBaseline = "middle";
  ctx.fillText(text, at.x + 36, at.y + h / 2 + 1);
}

// ---------------------------------------------------------------------------------------------
// The banner

const LEFT = 76;
const TEXT_W = 560;

/** Deep navy, two accent glows behind the visual, and a fine grid that fades out from it. */
function background(ctx: SKRSContext2D, theme: [string, string]) {
  const base = ctx.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, "#070a14");
  base.addColorStop(1, BG);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  glow(ctx, CX + 60, CY - 170, 520, theme[0], 0.3);
  glow(ctx, CX + 140, CY + 260, 460, theme[1], 0.22);
  glow(ctx, 80, H + 60, 420, theme[0], 0.1);

  const grid = createCanvas(W, H);
  const g = grid.getContext("2d");
  g.strokeStyle = "rgba(255,255,255,0.055)";
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 24; x < W; x += 48) {
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, H);
  }
  for (let y = 27; y < H; y += 48) {
    g.moveTo(0, y + 0.5);
    g.lineTo(W, y + 0.5);
  }
  g.stroke();
  g.globalCompositeOperation = "destination-in";
  const mask = g.createRadialGradient(CX, CY, 60, CX, CY, 600);
  mask.addColorStop(0, "rgba(0,0,0,1)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = mask;
  g.fillRect(0, 0, W, H);
  ctx.drawImage(grid, 0, 0);
}

async function render(spec: BannerSpec) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const { theme } = spec;

  background(ctx, theme);
  const chipAt = await drawVisual(ctx, spec);
  // A terminal already shows the package in its command.
  if (spec.chip && spec.visual.kind !== "terminal") drawChip(ctx, spec.chip, chipAt, theme);

  // Brand: logo mark and name.
  const logo = await fileImage(join(ROOT, "public/logo.webp"));
  const lh = 32;
  const lw = (logo.width / logo.height) * lh;
  ctx.drawImage(logo, LEFT, 60, lw, lh);
  ctx.font = font(700, 26);
  ctx.fillStyle = TEXT;
  ctx.textBaseline = "middle";
  ctx.fillText("Nayan UI", LEFT + lw + 13, 60 + lh / 2 + 1);

  // Inter covers Latin text and common punctuation; anything else would render as a missing-glyph box.
  for (const text of [spec.eyebrow, spec.title, spec.tagline]) {
    const unsupported = text.match(/[^\x20-\x7E°·—–’×é]/u);
    if (unsupported)
      throw new Error(`"${unsupported[0]}" on ${spec.path} is not in the banner font: "${text}"`);
  }
  const title = fit(ctx, spec.title, 700, [84, 78, 72, 66, 60, 56, 52], TEXT_W, 2);
  if (!title) throw new Error(`Title does not fit on ${spec.path}: "${spec.title}"`);
  // One line or nothing: a banner is read in a glance.
  const tagline = fit(ctx, spec.tagline, 500, [28, 26, 24], TEXT_W, 1);

  ctx.font = font(700, 15);
  ctx.letterSpacing = "1.6px";
  const eyebrow = spec.eyebrow.toUpperCase();
  const ew = ctx.measureText(eyebrow).width + 50;
  ctx.letterSpacing = "0px";

  const titleLH = Math.round(title.size * 1.08);
  const eyebrowH = 36;
  const block =
    eyebrowH + 30 + title.lines.length * titleLH + (tagline ? 26 + Math.round(tagline.size * 1.3) : 0);
  let y = Math.round(128 + (520 - 128 - block) / 2);

  roundRect(ctx, LEFT, y, ew, eyebrowH, eyebrowH / 2);
  ctx.fillStyle = rgba(theme[0], 0.14);
  ctx.fill();
  roundRect(ctx, LEFT + 0.5, y + 0.5, ew - 1, eyebrowH - 1, eyebrowH / 2);
  ctx.strokeStyle = rgba(theme[0], 0.45);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(LEFT + 19, y + eyebrowH / 2, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = gradient(ctx, LEFT + 14, 0, LEFT + 24, 0, theme);
  ctx.fill();
  ctx.font = font(700, 15);
  ctx.letterSpacing = "1.6px";
  ctx.fillStyle = tint(theme[0], 0.6);
  ctx.fillText(eyebrow, LEFT + 32, y + eyebrowH / 2 + 1);
  ctx.letterSpacing = "0px";
  y += eyebrowH + 30;

  ctx.textBaseline = "alphabetic";
  ctx.font = font(700, title.size);
  ctx.letterSpacing = `${-title.size * 0.02}px`;
  for (const [i, line] of title.lines.entries()) {
    // The last line carries a soft accent wash, the rest is white.
    const last = i === title.lines.length - 1;
    ctx.fillStyle = last
      ? gradient(ctx, LEFT, 0, LEFT + ctx.measureText(line).width, 0, [TEXT, tint(theme[0], 0.45)])
      : TEXT;
    ctx.fillText(line, LEFT - 3, y + title.size * 0.9);
    y += titleLH;
  }
  ctx.letterSpacing = "0px";
  if (tagline) {
    y += 26;
    ctx.font = font(500, tagline.size);
    ctx.fillStyle = MUTED;
    ctx.fillText(tagline.lines[0]!, LEFT, y + tagline.size * 0.95);
  }

  // Footer: the site, and a thin accent line along the bottom edge.
  ctx.font = font(600, 19);
  ctx.fillStyle = FAINT;
  ctx.textBaseline = "middle";
  ctx.fillText("nayanui.com", LEFT, 572);
  ctx.fillStyle = gradient(ctx, 0, 0, W, 0, theme);
  ctx.fillRect(0, H - 5, W, 5);

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

  // oxipng re-optimises the best zlib encoding (filters and deflate), typically 5-10% smaller.
  candidates.push({
    method: "oxipng",
    make: async () => {
      const png = await sharp(rgb, rgbRaw).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
      return Buffer.from(await losslessCompressPng(png));
    },
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
