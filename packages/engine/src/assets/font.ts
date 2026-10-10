// Fonts for 3D text: each character becomes an extruded mesh, built by the Rust core.
import { registerMesh } from "../render/meshes";
import NativeEngine from "../native/NativeNayanEngine";
import { nativeGeometry } from "./model";
import { assetUri, loadAssetBytes, type AssetSource } from "./source";

/** Digits, letters and common punctuation. */
export const DEFAULT_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,:;!?+-×÷=/%#*()'\"&@$";

export type FontOptions = {
  /** How deep letters are extruded, as a fraction of the font size. 0 = flat. Default 0.2. */
  depth?: number;
  /** Characters to build (space is always included). Fewer = faster load and fewer meshes (each uses a mesh id). Default: DEFAULT_CHARS. */
  chars?: string;
};

type Glyph = { mesh: number; advance: number };

/** A loaded font. Use it on an entity with `text`: `{ text: "2048", font }`. */
export type Font = {
  readonly id: number;
  /** Height of capital letters at scale 1. */
  readonly capHeight: number;
  /** Mesh (-1 = nothing drawn, e.g. space) and advance per character. */
  readonly glyphs: ReadonlyMap<string, Glyph>;
};

const loads = new Map<string, Promise<Font>>();

/**
 * Loads a TrueType / OpenType font (.ttf / .otf) for 3D text. Letters are real meshes: lit, shadowed,
 * and every copy of a letter on screen is drawn in one call. At scale 1, letters are 1 unit tall (em).
 *
 * ```ts
 * const font = await loadFont(require("./assets/Inter-Bold.ttf"), { chars: "0123456789" });
 * world.spawn({ text: "2048", font, scale: 0.5, color: [1, 1, 1] });
 * ```
 */
export function loadFont(source: AssetSource, options: FontOptions = {}): Promise<Font> {
  const native = NativeEngine;
  if (!native) return Promise.reject(new Error("loadFont: the native core is not linked into this build"));
  const depth = options.depth ?? 0.2;
  const chars = `${options.chars ?? DEFAULT_CHARS} `; // the space is always there (it has no mesh)
  const uri = assetUri(source) ?? String(source);
  const key = `${uri}|${depth}|${chars}`;
  let pending = loads.get(key);
  if (!pending) {
    pending = loadAssetBytes(source)
      .then(({ bytes }) => {
        const id = native.fontLoad(bytes, depth, chars);
        if (id < 0) throw new Error(native.loadError() || "not a TrueType / OpenType font");
        const data = native.fontGlyphs(id);
        const glyphs = new Map<string, Glyph>();
        for (let i = 0; i + 3 <= data.length - 1; i += 3) {
          const mesh = data[i + 1]!;
          if (mesh >= 0) registerMesh(mesh, { geometry: nativeGeometry(mesh) });
          glyphs.set(String.fromCodePoint(data[i]!), { mesh, advance: data[i + 2]! });
        }
        return { id, capHeight: data[data.length - 1]!, glyphs };
      })
      .catch((error: unknown) => {
        loads.delete(key); // allow a retry
        throw new Error(`loadFont: couldn't load ${uri}: ${error instanceof Error ? error.message : String(error)}`);
      });
    loads.set(key, pending);
  }
  return pending;
}

export type TextAlign = "left" | "center" | "right";

/** Glyph placements for a line of text: centered vertically on capitals, aligned horizontally. */
export function layoutText(font: Font, text: string, align: TextAlign): { mesh: number; x: number; y: number }[] {
  let width = 0;
  const placed: { mesh: number; x: number; y: number }[] = [];
  for (const ch of text) {
    const glyph = font.glyphs.get(ch) ?? font.glyphs.get("?");
    if (!glyph) continue;
    if (glyph.mesh >= 0) placed.push({ mesh: glyph.mesh, x: width, y: 0 });
    width += glyph.advance;
  }
  const shift = align === "left" ? 0 : align === "right" ? -width : -width / 2;
  const lift = -font.capHeight / 2;
  for (const p of placed) {
    p.x += shift;
    p.y = lift;
  }
  return placed;
}
