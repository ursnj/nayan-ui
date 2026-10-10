// External 3D models: glTF 2.0 (.glb, or .gltf with embedded buffers), parsed by the Rust core.
import { assetUri, loadAssetBytes, type AssetSource } from "./source";
import NativeEngine from "../native/NativeNayanEngine";
import { registerMesh } from "../render/meshes";
import type { Vec3 } from "../types";

export type ModelOptions = {
  /** Move the model's bounding box center to the origin, so `position` is its middle. Default true. */
  center?: boolean;
  /** Scale it so its largest side is this long (e.g. 1 to match the built-in shapes). Default: keep its size. */
  fit?: number;
};

/** A loaded model: pass it as an entity's `mesh`. Colliders sized from the mesh fit its bounding box. */
export type Model = {
  /** Bounding box size [x, y, z] at scale 1 (after `fit`). */
  readonly size: Vec3;
  /** Mesh id in the core. */
  readonly id: number;
};

const loads = new Map<string, Promise<Model>>();

/** A registered mesh's geometry, aliasing native memory. */
export function nativeGeometry(mesh: number) {
  return {
    vertices: new Float32Array(NativeEngine!.modelVertices(mesh) as ArrayBuffer),
    indices: new Uint32Array(NativeEngine!.modelIndices(mesh) as ArrayBuffer),
  };
}

/**
 * Loads a glTF model once; pass it as an entity's `mesh`. Meshes, node transforms, material colors
 * and the base color texture are kept (one texture per model); skins and animations are ignored.
 * Every entity using the model is drawn in one instanced draw call.
 *
 * ```ts
 * const tree = await loadModel(require("./assets/tree.glb"), { fit: 2 });
 * world.spawn({ mesh: tree, position: [0, 1, 0], physics: "fixed" });
 * ```
 */
export function loadModel(source: AssetSource, options: ModelOptions = {}): Promise<Model> {
  const native = NativeEngine;
  if (!native) return Promise.reject(new Error("loadModel: the native core is not linked into this build"));
  const uri = assetUri(source);
  const center = options.center ?? true;
  const fit = options.fit ?? 0;
  const key = `${uri}|${center}|${fit}`;
  let pending = loads.get(key);
  if (!pending) {
    pending = loadAssetBytes(source)
      .then(({ bytes }) => {
        const mesh = native.modelLoad(bytes, center, fit);
        if (mesh < 0) throw new Error(native.loadError() || "not a glTF model");
        const texture = native.modelTexture(mesh);
        registerMesh(mesh, { geometry: nativeGeometry(mesh), texture: texture >= 0 ? texture : undefined });
        const [x, y, z] = native.modelSize(mesh);
        return { id: mesh, size: [x!, y!, z!] as Vec3 };
      })
      .catch((error: unknown) => {
        loads.delete(key); // allow a retry
        throw new Error(`loadModel: couldn't load ${uri}: ${error instanceof Error ? error.message : String(error)}`);
      });
    loads.set(key, pending);
  }
  return pending;
}
