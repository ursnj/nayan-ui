// Textures: PNG / JPEG images, decoded by the Rust core, drawn on built-in shapes or models.
import { meshInfo, registerMesh } from "../render/meshes";
import NativeEngine from "../native/NativeNayanEngine";
import { assetUri, loadAssetBytes, type AssetSource } from "./source";

/** A loaded image. Pass it as an entity's `texture`. */
export type Texture = {
  readonly id: number;
  readonly width: number;
  readonly height: number;
};

export type TextureImage = { width: number; height: number; pixels: Uint8Array };

const loads = new Map<string, Promise<Texture>>();

/**
 * Loads a PNG or JPEG once (up to 4096 x 4096). Use it on any entity: `{ mesh: "cube", texture }`.
 * The entity's `color` tints it; `textureRegion` shows part of it (sprite sheets, card atlases).
 *
 * ```ts
 * const crate = await loadTexture(require("./assets/crate.png"));
 * world.spawn({ mesh: "cube", texture: crate });
 * ```
 */
export function loadTexture(source: AssetSource): Promise<Texture> {
  const native = NativeEngine;
  if (!native) return Promise.reject(new Error("loadTexture: the native core is not linked into this build"));
  const uri = assetUri(source) ?? String(source);
  let pending = loads.get(uri);
  if (!pending) {
    pending = loadAssetBytes(source)
      .then(({ bytes }) => {
        const id = native.textureLoad(bytes);
        if (id < 0) throw new Error(native.loadError() || "not a PNG or JPEG image");
        const [width, height] = native.textureSize(id);
        return { id, width: width!, height: height! };
      })
      .catch((error: unknown) => {
        loads.delete(uri); // allow a retry
        throw new Error(`loadTexture: couldn't load ${uri}: ${error instanceof Error ? error.message : String(error)}`);
      });
    loads.set(uri, pending);
  }
  return pending;
}

/** Pixels of a texture id (aliasing native memory), for the renderer. */
export function textureImage(id: number): TextureImage {
  const [width, height] = NativeEngine!.textureSize(id);
  return { width: width!, height: height!, pixels: new Uint8Array(NativeEngine!.texturePixels(id) as ArrayBuffer) };
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
    if (!base) throw new Error("texture: this mesh has nothing to draw");
    id = NativeEngine!.meshAlias(mesh);
    if (id < 0) throw new Error(`texture: ${NativeEngine!.loadError()}`);
    registerMesh(id, { geometry: base.geometry, texture: texture.id });
    variants.set(key, id);
  }
  return id;
}
