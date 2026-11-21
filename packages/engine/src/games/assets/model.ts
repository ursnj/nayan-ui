import type { EngineBridge } from '../../native/EngineBridge';
import NativeEngine from '../../native/NativeNayanEngine';
import { type MeshGeometry, meshInfo, registerMesh } from '../render/meshes';
import type { Vec3 } from '../types';
import { AssetLoader } from '../../assets/AssetLoader';
// External 3D models: glTF 2.0 (.glb, or .gltf with embedded buffers), parsed by the Rust core.
import type { AssetSource } from '../../assets/source';

export type ModelOptions = {
  /** Move the model's bounding box center to the origin, so `position` is its middle. Default true. */
  center?: boolean;
  /** Scale it so its largest side is this long (e.g. 1 to match the built-in shapes). Default: keep its size. */
  fit?: number;
  /**
   * How glossy, 0..1: a sharp sun highlight and a reflection of the sky that grows at grazing angles.
   * 0 is matte; around 0.8 reads as car paint or glass. Default 0.
   */
  shine?: number;
};

/** A loaded model: pass it as an entity's `mesh`. Colliders sized from the mesh fit its bounding box. */
export type Model = {
  /** Bounding box size [x, y, z] at scale 1 (after `fit`). */
  readonly size: Vec3;
  /** Mesh id in the core. */
  readonly id: number;
};

/** An animation embedded in a loaded GLB. */
export type ModelClip = { readonly name: string; readonly duration: number };
export type LoadedModel = Model & {
  readonly animations: readonly ModelClip[];
  readonly jointCount: number;
};

const loader = /* @__PURE__ */ new AssetLoader<LoadedModel>('loadModel');

/** A registered mesh's geometry, aliasing native memory. */
export function nativeGeometry(mesh: number) {
  return {
    vertices: new Float32Array(NativeEngine!.modelVertices(mesh)),
    indices: new Uint32Array(NativeEngine!.modelIndices(mesh))
  };
}

/**
 * Registers a mesh the core already holds (a created, cached or loaded model, a glyph, an alias):
 * the renderer copies it inside Rust, and JS reads its geometry only if something asks for it
 * (merging, caching). Apps built before `renderModel` upload it through JS as before.
 */
export function registerCoreMesh(
  mesh: number,
  info: { texture?: number; shine?: number } = {},
  geometry: () => MeshGeometry = () => nativeGeometry(mesh)
) {
  const native = NativeEngine!;
  let cached: MeshGeometry | undefined;
  const inRust = typeof native.renderModel === 'function' && native.renderModel(mesh, info.texture ?? -1, info.shine ?? 0);
  registerMesh(
    mesh,
    {
      get geometry() {
        return (cached ??= geometry());
      },
      texture: info.texture,
      shine: info.shine
    },
    !inRust
  );
}

const materials = new Map<string, number>();

/** Independent materials share core geometry without overwriting an existing model's appearance. */
export function registerModelMesh(mesh: number, shine: number): number {
  const info = meshInfo(mesh);
  if (info && (info.shine ?? 0) === shine) return mesh;
  const key = `${mesh}:${shine}`;
  const cached = materials.get(key);
  if (cached !== undefined) return cached;
  const id = info ? NativeEngine!.meshAlias(mesh) : mesh;
  if (id < 0) throw new Error(NativeEngine!.loadError() || "couldn't register a material variant");
  registerCoreMesh(id, { texture: info?.texture, shine }, info ? () => info.geometry : undefined);
  materials.set(key, id);
  return id;
}

/**
 * Initializes the engine automatically. Loads a glTF model once; pass it as an entity's `mesh`. Meshes, node transforms, material colors
 * and the base color texture are kept (one texture per model); skeletal animation clips are available through `animations` and `World.playClip`.
 * Every entity using the model is drawn in one instanced draw call.
 *
 * ```ts
 * const tree = await loadModel(require("./assets/tree.glb"), { fit: 2 });
 * world.spawn({ mesh: tree, position: [0, 1, 0], physics: "fixed" });
 * ```
 */
export function loadModel(source: AssetSource, options: ModelOptions = {}): Promise<LoadedModel> {
  const center = options.center ?? true;
  const fit = options.fit ?? 0;
  const shine = Math.max(0, Math.min(1, options.shine ?? 0));
  return loader.load(
    source,
    (native, bytes) => {
      // Parsed on a background native thread where the app's build supports it.
      if (typeof native.modelLoadAsync === 'function')
        return native.modelLoadAsync(bytes, center, fit).then((mesh) => finishModel(native, mesh, shine));
      return finishModel(native, native.modelLoad(bytes, center, fit), shine);
    },
    [center, fit, shine]
  );
}

/** A parsed glTF's handle: registered for drawing (in Rust) with its rig's clips. */
function finishModel(native: EngineBridge, mesh: number, shine: number): LoadedModel {
  if (mesh < 0) throw new Error(native.loadError() || 'not a glTF model');
  const texture = native.modelTexture(mesh);
  registerCoreMesh(mesh, { texture: texture >= 0 ? texture : undefined, shine });
  const [x, y, z] = native.modelSize(mesh);
  const rig = JSON.parse(native.modelRig(mesh)) as {
    joints: number;
    clips: ModelClip[];
  };
  return {
    animations: rig.clips,
    jointCount: rig.joints,
    id: mesh,
    size: [x, y, z]
  };
}
