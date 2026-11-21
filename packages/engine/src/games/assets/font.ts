// Fonts for 3D text: each character becomes an extruded mesh, built by the Rust core.
import type { EngineBridge } from '../../native/EngineBridge';
import { AssetLoader } from '../../assets/AssetLoader';
import { registerCoreMesh } from './model';
import type { AssetSource } from '../../assets/source';

/** Printable ASCII plus common arithmetic and typography, prewarmed for ordinary labels. */
export const DEFAULT_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~×÷±−°·•–—…‘’“”';

export type FontOptions = {
  /** How deep letters are extruded, as a fraction of the font size. 0 = flat. Default 0.2. */
  depth?: number;
  /** Characters to prewarm (space and ? are always included). Other font-supported characters load
   * once when text is measured or laid out. Fewer = faster startup and fewer unused meshes. Default: DEFAULT_CHARS. */
  chars?: string;
  /** Weight (e.g. 400, 600) for a variable font, such as the device's system font. Default: the font's own. */
  weight?: number;
};

type Glyph = { mesh: number; advance: number };

/** A loaded font. Use it on an entity with `text`: `{ text: "2048", font }`. */
export type Font = {
  readonly id: number;
  /** Height of capital letters at scale 1. */
  readonly capHeight: number;
  /** Cached mesh (-1 = nothing drawn, e.g. space) and advance per character. Grows as text is used. */
  readonly glyphs: ReadonlyMap<string, Glyph>;
};

const loader = /* @__PURE__ */ new AssetLoader<Font>('loadFont');
const extend = new WeakMap<Font, (text: string) => void>();

// Format controls affect presentation, not glyph count or spacing. In particular, a text/emoji
// variation selector must not append a second fallback question mark to a symbol.
function isInvisible(ch: string): boolean {
  const code = ch.codePointAt(0)!;
  return (
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2060 && code <= 0x206f) ||
    (code >= 0xfe00 && code <= 0xfe0f) ||
    code === 0xfeff ||
    (code >= 0xe0100 && code <= 0xe01ef)
  );
}
const WHITESPACE = /\s/u;

/**
 * Initializes the engine automatically. Loads a TrueType / OpenType font (.ttf / .otf) for 3D text. The source/depth/weight are cached independently of the requested prewarm characters. Letters are real meshes: lit, shadowed,
 * and every copy of a letter on screen is drawn in one call. At scale 1, letters are 1 unit tall (em).
 * Additional Unicode glyphs are built on demand from the same font and cached. The font must contain
 * an outline for the character; missing characters still use ?, including unsupported emoji.
 *
 * ```ts
 * const font = await loadFont(require("./assets/Inter-Bold.ttf"), { chars: "0123456789" });
 * world.spawn({ text: "2048", font, scale: 0.5, color: [1, 1, 1] });
 * ```
 */
export function loadFont(source: AssetSource, options: FontOptions = {}): Promise<Font> {
  const depth = options.depth ?? 0.2;
  const chars = [...new Set(`${options.chars ?? DEFAULT_CHARS} ?`.normalize('NFC'))].filter((ch) => !isInvisible(ch)).join('');
  const weight = options.weight ?? 0;
  const pending = loader.load(
    source,
    (native, bytes) => {
      // Outlines and glyph meshes are built on a background native thread where the app's build supports it.
      if (typeof native.fontLoadAsync === 'function')
        return native.fontLoadAsync(bytes, depth, chars, weight).then((id) => finish(native, bytes, id));
      return finish(native, bytes, native.fontLoad(bytes, depth, chars, weight));
    },
    [depth, weight]
  );
  /** The loaded font's glyphs, registered for drawing in Rust, and its on-demand extension. */
  function finish(native: EngineBridge, bytes: ArrayBuffer, id: number): Font {
    if (id < 0) throw new Error(native.loadError() || 'not a TrueType / OpenType font');
    const glyphs = new Map<string, Glyph>();
    const registered = new Set<number>();
    const read = (fontId: number) => {
      const data = native.fontGlyphs(fontId);
      for (let i = 0; i + 3 <= data.length - 1; i += 3) {
        const mesh = data[i + 1]!;
        if (mesh >= 0 && !registered.has(mesh)) {
          registerCoreMesh(mesh);
          registered.add(mesh);
        }
        glyphs.set(String.fromCodePoint(data[i]!), {
          mesh,
          advance: data[i + 2]!
        });
      }
      return data[data.length - 1]!;
    };
    const font: Font = { id, capHeight: read(id), glyphs };
    const attempted = new Set(chars);
    extend.set(font, (text) => {
      let missing = '';
      for (const ch of text) {
        if (isInvisible(ch) || attempted.has(ch)) continue;
        attempted.add(ch);
        missing += ch;
      }
      if (!missing) return;
      // One native call per group of new codepoints, never one per letter or repeated label.
      try {
        const extra = native.fontLoad(bytes, depth, missing, weight);
        if (extra < 0) throw new Error(native.loadError());
        read(extra);
      } catch (error: unknown) {
        for (const ch of missing) attempted.delete(ch);
        throw new Error(`loadFont: couldn't build additional glyphs: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    });
    return font;
  }
  return pending.then((font) => {
    extend.get(font)?.(chars);
    return font;
  });
}

export type TextAlign = 'left' | 'center' | 'right';

export type TextLayout = {
  /** Extra space between letters, in ems (at scale 1, letters are 1 em tall). Default 0. */
  letterSpacing?: number;
  /** Digits all as wide as the widest, so changing numbers (scores, timers) don't shift. Default false. */
  tabular?: boolean;
};

const DIGIT = /[0-9]/;
type Placement = { mesh: number; x: number; y: number };

/** Walk one normalized line for both measuring and placing, so fallback widths always agree. */
function walkText(font: Font, text: string, options: TextLayout, placed?: Placement[]): number {
  text = text.normalize('NFC');
  extend.get(font)?.(options.tabular ? `${text}0123456789` : text);
  const spacing = options.letterSpacing ?? 0;
  let digit = 0;
  if (options.tabular) for (const d of '0123456789') digit = Math.max(digit, font.glyphs.get(d)?.advance ?? 0);
  let width = 0;
  let letters = 0;
  for (const ch of text) {
    if (isInvisible(ch)) continue;
    const glyph = font.glyphs.get(ch) ?? (WHITESPACE.test(ch) ? font.glyphs.get(' ') : undefined) ?? font.glyphs.get('?');
    if (!glyph) continue;
    const advance = digit > 0 && DIGIT.test(ch) ? digit : glyph.advance;
    if (letters++ > 0) width += spacing;
    if (placed && glyph.mesh >= 0)
      placed.push({
        mesh: glyph.mesh,
        x: width + (advance - glyph.advance) / 2,
        y: 0
      });
    width += advance;
  }
  return width;
}

/** A line's advance in ems, with the same Unicode glyph loading, spacing and fallbacks as rendering. */
export function measureText(font: Font, text: string, options: TextLayout = {}): number {
  return walkText(font, text, options);
}

/** Glyph placements for a line of text: centered vertically on capitals, aligned horizontally. */
export function layoutText(font: Font, text: string, align: TextAlign, options: TextLayout = {}): { mesh: number; x: number; y: number }[] {
  const placed: Placement[] = [];
  const width = walkText(font, text, options, placed);
  const shift = align === 'left' ? 0 : align === 'right' ? -width : -width / 2;
  const lift = -font.capHeight / 2;
  for (const p of placed) {
    p.x += shift;
    p.y = lift;
  }
  return placed;
}
