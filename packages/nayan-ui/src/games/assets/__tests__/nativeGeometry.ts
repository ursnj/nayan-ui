import { dlopen, ptr, toArrayBuffer } from 'bun:ffi';
// Optional native test harness; never imported by application code.
export function createNativeGeometryHost(library: string) {
  const f = dlopen(library, {
    engine_geometry_solid: { args: ['ptr', 'usize'], returns: 'ptr' },
    engine_geometry_optimize: {
      args: ['ptr', 'usize', 'ptr', 'usize', 'f32', 'f32', 'i32'],
      returns: 'ptr'
    },
    engine_geometry_data: { args: ['ptr'], returns: 'ptr' },
    engine_geometry_size: { args: ['ptr'], returns: 'usize' },
    engine_geometry_error: { args: ['ptr'], returns: 'cstring' },
    engine_geometry_free: { args: ['ptr'], returns: 'void' },
    engine_geometry_smooth_normals: {
      args: ['ptr', 'usize', 'ptr', 'usize'],
      returns: 'void'
    },
    engine_geometry_face_outward: {
      args: ['ptr', 'usize', 'ptr', 'usize'],
      returns: 'void'
    },
    engine_geometry_place: {
      args: ['ptr', 'usize', 'ptr', 'usize', 'ptr', 'u32', 'ptr', 'ptr'],
      returns: 'void'
    }
  }).symbols;
  const unpack = (r: ReturnType<typeof f.engine_geometry_solid>) => {
    try {
      const error = String(f.engine_geometry_error(r));
      if (error) throw Error(error);
      const data = f.engine_geometry_data(r),
        size = Number(f.engine_geometry_size(r));
      const bytes = toArrayBuffer(data!, 0, size);
      const head = new Uint32Array(bytes, 0, 2);
      return {
        vertices: new Float32Array(bytes, 8, head[0]! * 11).slice().buffer,
        indices: new Uint32Array(bytes, 8 + head[0]! * 44, head[1]).slice().buffer
      };
    } finally {
      f.engine_geometry_free(r);
    }
  };
  return {
    geometrySolid: (recipe: string) => {
      const b = new TextEncoder().encode(recipe);
      return unpack(f.engine_geometry_solid(ptr(b), b.length));
    },
    geometryOptimize: (v: ArrayBuffer, i: ArrayBuffer, r: number, e: number, l: boolean) =>
      unpack(
        f.engine_geometry_optimize(
          v.byteLength ? ptr(new Float32Array(v)) : null,
          v.byteLength / 4,
          i.byteLength ? ptr(new Uint32Array(i)) : null,
          i.byteLength / 4,
          r,
          e,
          l ? 1 : 0
        )
      ),
    geometrySmoothNormals: (v: ArrayBuffer, i: ArrayBuffer) =>
      f.engine_geometry_smooth_normals(ptr(new Float32Array(v)), v.byteLength / 44, ptr(new Uint32Array(i)), i.byteLength / 4),
    geometryFaceOutward: (v: ArrayBuffer, i: ArrayBuffer) =>
      f.engine_geometry_face_outward(ptr(new Float32Array(v)), v.byteLength / 44, ptr(new Uint32Array(i)), i.byteLength / 4),
    geometryPlace: (v: ArrayBuffer, i: ArrayBuffer, p: number[], first: number, ov: ArrayBuffer, vo: number, oi: ArrayBuffer, io: number) =>
      f.engine_geometry_place(
        ptr(new Float32Array(v)),
        v.byteLength / 44,
        i.byteLength ? ptr(new Uint32Array(i)) : null,
        i.byteLength / 4,
        ptr(new Float32Array(p)),
        first,
        ptr(new Float32Array(ov), vo * 4),
        oi.byteLength ? ptr(new Uint32Array(oi), io * 4) : null
      )
  };
}
