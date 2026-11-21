import NativeEngine from '../../native/NativeNayanEngine';
// Textures: PNG / JPEG images, decoded by the Rust core, drawn on built-in shapes or models.
import { meshInfo } from '../render/meshes';
import type { Light } from '../types';
import { type ColorInput, resolveColor } from '../world/color';
import { AssetLoader } from '../../assets/AssetLoader';
import { registerCoreMesh } from './model';
import type { AssetSource } from '../../assets/source';

/** A loaded image. Pass it as an entity's `texture`. */
export type Texture = {
  readonly id: number;
  readonly width: number;
  readonly height: number;
};

export type TextureImage = {
  width: number;
  height: number;
  pixels: Uint8Array;
};

const loader = /* @__PURE__ */ new AssetLoader<Texture>('loadTexture');

/**
 * Initializes the engine automatically. Loads a PNG or JPEG once (up to 4096 x 4096). Use it on any entity: `{ mesh: "cube", texture }`.
 * The entity's `color` tints it; `textureRegion` shows part of it (sprite sheets, card atlases).
 *
 * ```ts
 * const crate = await loadTexture(require("./assets/crate.png"));
 * world.spawn({ mesh: "cube", texture: crate });
 * ```
 */
export function loadTexture(source: AssetSource): Promise<Texture> {
  return loader.load(source, (native, bytes) => {
    const finish = (id: number): Texture => {
      if (id < 0) throw new Error(native.loadError() || 'not a PNG or JPEG image');
      const [width, height] = native.textureSize(id);
      return { id, width, height };
    };
    // Decoded on a background native thread where the app's build supports it.
    return typeof native.textureLoadAsync === 'function' ? native.textureLoadAsync(bytes).then(finish) : finish(native.textureLoad(bytes));
  });
}

/** Pixels of a texture id (aliasing native memory), for the renderer. */
export function textureImage(id: number): TextureImage {
  const [width, height] = NativeEngine!.textureSize(id);
  return {
    width,
    height,
    pixels: new Uint8Array(NativeEngine!.texturePixels(id))
  };
}

const variants = new Map<string, number>();

/**
 * The mesh id that draws `mesh`'s geometry with `texture`: a textured variant made on first use
 * (it shares the geometry, colliders and picking of the original).
 */
export function texturedMesh(mesh: number, texture: Texture): number {
  const key = `${mesh}:${texture.id}`;
  let id = variants.get(key);
  if (id === undefined) {
    const base = meshInfo(mesh);
    if (!base) throw new Error('texture: this mesh has nothing to draw');
    id = NativeEngine!.meshAlias(mesh);
    if (id < 0) throw new Error(`texture: ${NativeEngine!.loadError()}`);
    registerCoreMesh(id, { texture: texture.id, shine: base.shine }, () => base.geometry);
    variants.set(key, id);
  }
  return id;
}

export type BakeOptions = {
  /** The picture's width and height in pixels: about the size it's shown at (textures have no mipmaps). */
  size: number;
  /** The scene's light, as passed to `GameView`: the picture is shaded as the model would be. */
  light: Light;
  /** The scene's background, which glossy models reflect. Default black. */
  background?: ColorInput;
  /** Glossiness 0..1. Default: the model's own (its `createShape` shine). */
  shine?: number;
  /** Samples per pixel along each side, for smooth edges. Default 4. */
  supersample?: number;
  /** Empty margin around the model, as a fraction of its larger side. Default 0.04. */
  padding?: number;
  /**
   * Draw several models together (a tile and the fruit on it) instead of `model` alone: each scaled
   * then moved (no rotation), tinted and glossy as an entity would be.
   */
  parts?: readonly BakePart[];
  /** The square of x/y to draw, instead of one around the models (with `padding`). */
  frame?: { center: [x: number, y: number]; extent: number };
  /**
   * Keep the picture in the engine's cache under this key (a `ProceduralCache.storageKey`, so app
   * updates rebake it), and restore it from there: check `isBakeKept(key)` to skip building the models.
   */
  key?: string;
};

/** One model in a bake. */
export type BakePart = {
  model: { readonly id: number } | number;
  position?: readonly [number, number, number];
  scale?: number | readonly [number, number, number];
  color?: ColorInput;
  /** Glossiness 0..1. Default: the model's own. */
  shine?: number;
};

/** A model's baked picture: its texture, and the square of the model's x/y it covers. */
export type BakedModel = {
  texture: Texture;
  /** The square's centre, in model units. */
  center: [x: number, y: number];
  /** Half the square's side, in model units. */
  extent: number;
};

/**
 * Draws a model once, in the native core, into an anti-aliased picture with a transparent
 * background: seen from +z (orthographic), shaded as the renderer shades it under `light`. Show it
 * instead of the model where it only ever faces the camera (icons, tiles, cards): on the built-in
 * `"plane"` turned to face +z, scaled to `2 * extent`, under a `frontLight` (which shows camera-facing
 * surfaces at exactly their color), with an alpha just below 1 so its soft edges blend. One quad
 * then draws what took thousands of triangles, with smooth edges at every quality level.
 */
export function bakeModel(model: { readonly id: number } | number | null, options: BakeOptions): BakedModel {
  const mesh = model == null ? -1 : typeof model === 'number' ? model : model.id;
  const native = NativeEngine!;
  if (typeof native.modelBake !== 'function') throw new Error("bakeModel: this app's native core predates baked models: rebuild it");
  const { light } = options;
  const lightColor = resolveColor(light.color ?? [1, 1, 1]);
  const sky = resolveColor(options.background ?? [0, 0, 0]);
  const spec = {
    size: Math.max(1, Math.min(1024, Math.round(options.size))),
    supersample: options.supersample ?? 4,
    light: light.direction,
    ambient: light.ambient,
    lightColor: [lightColor[0], lightColor[1], lightColor[2]],
    sky: [sky[0], sky[1], sky[2]],
    shine: options.shine ?? meshInfo(mesh)?.shine ?? 0,
    padding: options.padding ?? 0.04,
    parts: options.parts?.map((part) => {
      const id = typeof part.model === 'number' ? part.model : part.model.id;
      const scale = part.scale ?? 1;
      const color = resolveColor(part.color ?? [1, 1, 1]);
      return {
        mesh: id,
        position: part.position ?? [0, 0, 0],
        scale: typeof scale === 'number' ? [scale, scale, scale] : scale,
        color: [color[0], color[1], color[2]],
        shine: part.shine ?? meshInfo(id)?.shine ?? 0
      };
    }),
    frame: options.frame && [options.frame.center[0], options.frame.center[1], options.frame.extent],
    key: options.key
  };
  const baked = native.modelBake(Math.max(0, mesh), JSON.stringify(spec));
  if (baked.length !== 4) throw new Error(`bakeModel: ${native.loadError() || 'failed'}`);
  const [texture, x, y, extent] = baked;
  return { texture: { id: texture, width: spec.size, height: spec.size }, center: [x, y], extent };
}

/** Whether a picture was kept under `key` by `bakeModel` (so it can be restored without its models). */
export function isBakeKept(key: string): boolean {
  return typeof NativeEngine?.bakeKept === 'function' && NativeEngine.bakeKept(key);
}
