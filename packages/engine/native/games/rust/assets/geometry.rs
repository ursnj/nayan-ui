//! Mesh-building passes for custom shapes, run in place on JS-owned buffers (11 floats per vertex:
//! position, normal, color, uv; u32 triangle indices). These are the loops that dominated building
//! fruit and other lathed / tubed shapes in JS: smoothing normals (hashing every vertex position),
//! turning triangles to face their normals, and baking merged parts.

use std::collections::HashMap;

pub const VERTEX_FLOATS: usize = 11;

/// Lossless cleanup at ratio 1, or attribute-aware simplification below 1. Input stays untouched.
/// The error limit is relative to the largest dimension; borders and all eight normal/color/UV
/// attributes participate, so separate materials, painted features and texture seams survive.
pub fn optimize(vertices: &[f32], indices: &[u32], ratio: f32, error: f32, lock_borders: bool) -> Result<super::modelling::Geometry, String> {
    if vertices.len() % VERTEX_FLOATS != 0 || indices.len() % 3 != 0 || vertices.iter().any(|x| !x.is_finite()) {
        return Err("geometry needs finite 11-float vertices and complete triangles".into());
    }
    if !ratio.is_finite() || !(0.0 < ratio && ratio <= 1.0) || !error.is_finite() || !(0.0..=1.0).contains(&error) {
        return Err("simplification ratio must be in (0, 1] and error in [0, 1]".into());
    }
    let count = vertices.len() / VERTEX_FLOATS;
    if indices.iter().any(|&i| i as usize >= count) {
        return Err("geometry index is outside the vertex buffer".into());
    }
    if indices.is_empty() {
        return Ok(super::modelling::Geometry::default());
    }
    let mut triangles = Vec::with_capacity(indices.len());
    for t in indices.chunks_exact(3) {
        let f = face_cross(vertices, t[0] as usize, t[1] as usize, t[2] as usize);
        if f.iter().any(|&x| x != 0.0) {
            triangles.extend_from_slice(t);
        }
    }
    if triangles.is_empty() {
        return Ok(super::modelling::Geometry::default());
    }
    let original = vertices.as_chunks::<VERTEX_FLOATS>().0;
    // Weld only identical complete vertices. A position-only weld would destroy hard edges/UVs.
    let (unique, remap) = meshopt::generate_vertex_remap(original, Some(&triangles));
    let compact = meshopt::remap_vertex_buffer(original, unique, &remap);
    let mut triangles = meshopt::remap_index_buffer(Some(&triangles), count, &remap);
    if ratio < 1.0 {
        let adapter = meshopt::VertexDataAdapter::new(meshopt::typed_to_bytes(&compact), VERTEX_FLOATS * 4, 0).map_err(|e| e.to_string())?;
        let attributes: Vec<f32> = compact.iter().flat_map(|v| v[3..].iter().copied()).collect();
        let weights = [0.25, 0.25, 0.25, 1.0, 1.0, 1.0, 1.0, 1.0];
        let locks = vec![false; compact.len()];
        let target = ((triangles.len() as f32 * ratio) as usize / 3 * 3).max(3);
        let flags = if lock_borders {
            meshopt::SimplifyOptions::LockBorder
        } else {
            meshopt::SimplifyOptions::None
        };
        triangles =
            meshopt::simplify_with_attributes_and_locks(&triangles, &adapter, &attributes, &weights, 8 * 4, &locks, target, error, flags, None);
    }
    meshopt::optimize_vertex_cache_in_place(&mut triangles, compact.len());
    let compact = meshopt::optimize_vertex_fetch(&mut triangles, &compact);
    Ok(super::modelling::Geometry {
        vertices: compact.into_iter().flatten().collect(),
        indices: triangles,
    })
}

/// Triangle targets for `lod_levels`, as shares of the original, and the error a level may reach.
const LOD_RATIOS: [f32; 3] = [0.35, 0.12, 0.04];
const LOD_MAX_ERROR: f32 = 0.05;

/// Coarser versions of a mesh for drawing it small, finest first: each an index buffer over the
/// mesh's own vertices (so the GPU keeps one vertex buffer) with the error meshoptimizer measured,
/// relative to the mesh's largest extent. Identical vertices are welded to their first copy first,
/// so seams and hard edges stay put; a level that doesn't shrink the previous one by 30% is dropped.
/// Disconnected parts smaller than a level's error are pruned (a car's vents and bolts, far away).
/// Meshes built largely of two-sided surfaces (leaves, cards: each triangle also drawn facing the
/// other way) get none: such a surface has no open edge to hold its outline, and folding it flat
/// within its own plane measures as no error at all, so whole leaves would vanish up close.
pub fn lod_levels(vertices: &[f32], indices: &[u32]) -> Vec<(f32, Vec<u32>)> {
    let count = vertices.len() / VERTEX_FLOATS;
    if vertices.len() % VERTEX_FLOATS != 0 || indices.len() % 3 != 0 || indices.iter().any(|&i| i as usize >= count) {
        return Vec::new();
    }
    if vertices.iter().any(|x| !x.is_finite()) {
        return Vec::new();
    }
    let original = vertices.as_chunks::<VERTEX_FLOATS>().0;
    if two_sided_share(original, indices) > TWO_SIDED_LIMIT {
        return Vec::new();
    }
    let (unique, remap) = meshopt::generate_vertex_remap(original, Some(indices));
    // Each welded vertex is represented by its first copy in the original buffer
    let mut first = vec![u32::MAX; unique];
    for (i, &slot) in remap.iter().enumerate() {
        if slot != u32::MAX && first[slot as usize] == u32::MAX {
            first[slot as usize] = i as u32;
        }
    }
    let welded: Vec<u32> = indices.iter().map(|&i| first[remap[i as usize] as usize]).collect();
    let Ok(adapter) = meshopt::VertexDataAdapter::new(meshopt::typed_to_bytes(original), VERTEX_FLOATS * 4, 0) else {
        return Vec::new();
    };
    let attributes: Vec<f32> = original.iter().flat_map(|v| v[3..].iter().copied()).collect();
    let weights = [0.25, 0.25, 0.25, 1.0, 1.0, 1.0, 1.0, 1.0];
    let locks = vec![false; count];
    let mut levels: Vec<(f32, Vec<u32>)> = Vec::new();
    let mut last = welded.len();
    for ratio in LOD_RATIOS {
        let target = ((welded.len() as f32 * ratio) as usize / 3 * 3).max(3);
        let mut error = 0.0f32;
        let mut level = meshopt::simplify_with_attributes_and_locks(
            &welded,
            &adapter,
            &attributes,
            &weights,
            8 * 4,
            &locks,
            target,
            LOD_MAX_ERROR,
            // Small separate parts (vents, bolts, lamps) may vanish once their size is within the error
            meshopt::SimplifyOptions::Prune,
            Some(&mut error),
        );
        if level.is_empty() || level.len() as f32 > last as f32 * 0.7 {
            continue;
        }
        meshopt::optimize_vertex_cache_in_place(&mut level, count);
        last = level.len();
        levels.push((error, level));
    }
    levels
}

/// The share of a mesh's triangles above which it counts as two-sided foliage (see `lod_levels`).
const TWO_SIDED_LIMIT: f32 = 0.1;

/// The share of triangles drawn both ways: another triangle covers the same three corners (by
/// position, whatever their normals) in the opposite winding.
fn two_sided_share(vertices: &[[f32; VERTEX_FLOATS]], indices: &[u32]) -> f32 {
    let positions: Vec<[f32; 3]> = vertices.iter().map(|v| [v[0], v[1], v[2]]).collect();
    let (_, remap) = meshopt::generate_vertex_remap(&positions, Some(indices));
    // A triangle's corners rotated to start at the lowest: equal keys share winding, a reversed one is its back
    let key = |a: u32, b: u32, c: u32| {
        if a <= b && a <= c {
            (a, b, c)
        } else if b <= a && b <= c {
            (b, c, a)
        } else {
            (c, a, b)
        }
    };
    let triangles: Vec<(u32, u32, u32)> = indices
        .chunks_exact(3)
        .map(|t| key(remap[t[0] as usize], remap[t[1] as usize], remap[t[2] as usize]))
        .collect();
    let set: std::collections::HashSet<(u32, u32, u32)> = triangles.iter().copied().collect();
    let backed = triangles.iter().filter(|&&(a, b, c)| set.contains(&key(a, c, b))).count();
    backed as f32 / triangles.len().max(1) as f32
}

/// Recomputes corner-angle-weighted normals, welded across positions (UV seams and poles).
/// Unlike area weighting, changing the size or triangulation of a neighbouring patch does not
/// pull the normal toward that patch. Unused vertices and degenerate faces keep their normals.
pub fn smooth_normals(vertices: &mut [f32], indices: &[u32]) {
    let count = vertices.len() / VERTEX_FLOATS;
    if count == 0 {
        return;
    }
    // Vertices at the same place (to 1e-5) share one sum.
    let mut slot_of = Vec::with_capacity(count);
    let mut slots: HashMap<[i64; 3], usize> = HashMap::with_capacity(count);
    for i in 0..count {
        let o = i * VERTEX_FLOATS;
        let key = [quantize(vertices[o]), quantize(vertices[o + 1]), quantize(vertices[o + 2])];
        let next = slots.len();
        slot_of.push(*slots.entry(key).or_insert(next));
    }
    let mut sums = vec![[0f64; 3]; slots.len()];
    for t in indices.chunks_exact(3) {
        let [a, b, c] = [t[0] as usize, t[1] as usize, t[2] as usize];
        if a >= count || b >= count || c >= count {
            continue;
        }
        let f = face_cross(vertices, a, b, c);
        let length = (f[0] * f[0] + f[1] * f[1] + f[2] * f[2]).sqrt();
        if length == 0.0 || !length.is_finite() {
            continue;
        }
        for (v, next, previous) in [(a, b, c), (b, c, a), (c, a, b)] {
            let dot: f64 = (0..3)
                .map(|k| {
                    let origin = vertices[v * VERTEX_FLOATS + k] as f64;
                    (vertices[next * VERTEX_FLOATS + k] as f64 - origin) * (vertices[previous * VERTEX_FLOATS + k] as f64 - origin)
                })
                .sum();
            let weight = length.atan2(dot) / length;
            let s = &mut sums[slot_of[v]];
            s[0] += f[0] * weight;
            s[1] += f[1] * weight;
            s[2] += f[2] * weight;
        }
    }
    for i in 0..count {
        let n = sums[slot_of[i]];
        let len = (n[0] * n[0] + n[1] * n[1] + n[2] * n[2]).sqrt();
        if len > 1e-12 {
            let o = i * VERTEX_FLOATS + 3;
            vertices[o] = (n[0] / len) as f32;
            vertices[o + 1] = (n[1] / len) as f32;
            vertices[o + 2] = (n[2] / len) as f32;
        }
    }
}

/// Flips triangles whose winding disagrees with their vertex normals (so back-face culling keeps them).
pub fn face_outward(vertices: &[f32], indices: &mut [u32]) {
    let count = vertices.len() / VERTEX_FLOATS;
    for t in indices.chunks_exact_mut(3) {
        let [a, b, c] = [t[0] as usize, t[1] as usize, t[2] as usize];
        if a >= count || b >= count || c >= count {
            continue;
        }
        let f = face_cross(vertices, a, b, c);
        let mut d = 0.0;
        for k in 0..3 {
            let n =
                vertices[a * VERTEX_FLOATS + 3 + k] as f64 + vertices[b * VERTEX_FLOATS + 3 + k] as f64 + vertices[c * VERTEX_FLOATS + 3 + k] as f64;
            d += f[k] * n;
        }
        if d < 0.0 {
            t.swap(1, 2);
        }
    }
}

/// How a part is placed when merged: scale, then rotate (quaternion x, y, z, w), then move; its
/// vertex colors multiplied by `color`.
#[derive(Clone, Copy, Debug)]
pub struct Placement {
    pub position: [f32; 3],
    pub rotation: [f32; 4],
    pub scale: [f32; 3],
    pub color: [f32; 3],
}

impl Default for Placement {
    fn default() -> Self {
        Self {
            position: [0.0; 3],
            rotation: [0.0, 0.0, 0.0, 1.0],
            scale: [1.0; 3],
            color: [1.0; 3],
        }
    }
}

/// Bakes one part into merged buffers: writes its placed vertices to `out_vertices` (as long as
/// `src_vertices`) and its indices, offset by `first` (the part's first vertex in the merged mesh),
/// to `out_indices` (as long as `src_indices`). A mirroring scale flips the winding back.
pub fn place_part(src_vertices: &[f32], src_indices: &[u32], p: &Placement, first: u32, out_vertices: &mut [f32], out_indices: &mut [u32]) {
    let [sx, sy, sz] = p.scale;
    let [qx, qy, qz, qw] = p.rotation;
    let rotate = |x: f32, y: f32, z: f32| -> [f32; 3] {
        // v + 2w(q x v) + 2(q x (q x v))
        let tx = 2.0 * (qy * z - qz * y);
        let ty = 2.0 * (qz * x - qx * z);
        let tz = 2.0 * (qx * y - qy * x);
        [
            x + qw * tx + (qy * tz - qz * ty),
            y + qw * ty + (qz * tx - qx * tz),
            z + qw * tz + (qx * ty - qy * tx),
        ]
    };
    let n = src_vertices.len().min(out_vertices.len()) / VERTEX_FLOATS;
    for i in 0..n {
        let o = i * VERTEX_FLOATS;
        let s = &src_vertices[o..o + VERTEX_FLOATS];
        let pos = rotate(s[0] * sx, s[1] * sy, s[2] * sz);
        // Normals scale inversely (a squashed sphere's normals tilt toward its flat sides).
        let nr = rotate(s[3] / sx, s[4] / sy, s[5] / sz);
        let len = (nr[0] * nr[0] + nr[1] * nr[1] + nr[2] * nr[2]).sqrt();
        let d = &mut out_vertices[o..o + VERTEX_FLOATS];
        d[0] = pos[0] + p.position[0];
        d[1] = pos[1] + p.position[1];
        d[2] = pos[2] + p.position[2];
        // Zero normals (camera-facing sprites) stay zero; so do NaNs from a zero scale.
        let ok = len > 0.0 && len.is_finite();
        d[3] = if ok { nr[0] / len } else { 0.0 };
        d[4] = if ok { nr[1] / len } else { 0.0 };
        d[5] = if ok { nr[2] / len } else { 0.0 };
        d[6] = s[6] * p.color[0];
        d[7] = s[7] * p.color[1];
        d[8] = s[8] * p.color[2];
        d[9] = s[9];
        d[10] = s[10];
    }
    let mirrored = sx * sy * sz < 0.0;
    let m = src_indices.len().min(out_indices.len()) / 3 * 3;
    for t in (0..m).step_by(3) {
        out_indices[t] = src_indices[t] + first;
        out_indices[t + 1] = src_indices[t + if mirrored { 2 } else { 1 }] + first;
        out_indices[t + 2] = src_indices[t + if mirrored { 1 } else { 2 }] + first;
    }
}

fn quantize(x: f32) -> i64 {
    // Match Math.round in the JS fallback, including negative half-way values.
    (x as f64 * 1e5 + 0.5).floor() as i64
}

/// (b - a) x (c - a), in f64.
fn face_cross(v: &[f32], a: usize, b: usize, c: usize) -> [f64; 3] {
    let p = |i: usize, k: usize| v[i * VERTEX_FLOATS + k] as f64;
    let e1 = [p(b, 0) - p(a, 0), p(b, 1) - p(a, 1), p(b, 2) - p(a, 2)];
    let e2 = [p(c, 0) - p(a, 0), p(c, 1) - p(a, 1), p(c, 2) - p(a, 2)];
    [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
    ]
}

#[cfg(test)]
mod tests {
    #[test]
    fn lod_levels_shrink_a_dense_mesh_with_growing_error_over_its_own_vertices() {
        // A 64 x 64 bumpy sheet (8192 triangles)
        let n = 64;
        let mut vertices = Vec::new();
        for i in 0..=n {
            for j in 0..=n {
                let (x, z) = (j as f32 / n as f32, i as f32 / n as f32);
                let y = 0.05 * (x * 9.0).sin() * (z * 7.0).cos();
                vertices.extend_from_slice(&[x, y, z, 0.0, 1.0, 0.0, 0.5, 0.6, 0.4, x, z]);
            }
        }
        let mut indices = Vec::new();
        for i in 0..n as u32 {
            for j in 0..n as u32 {
                let a = i * (n as u32 + 1) + j;
                let b = a + n as u32 + 1;
                indices.extend_from_slice(&[a, b, a + 1, a + 1, b, b + 1]);
            }
        }
        let levels = super::lod_levels(&vertices, &indices);
        assert!(!levels.is_empty());
        let mut last = (0.0f32, indices.len());
        for (error, level) in &levels {
            assert!(level.len() as f32 <= last.1 as f32 * 0.7, "each level is markedly smaller");
            assert!(*error >= last.0 && *error <= super::LOD_MAX_ERROR + 1e-4);
            assert!(level.iter().all(|&i| (i as usize) < vertices.len() / super::VERTEX_FLOATS));
            last = (*error, level.len());
        }
        // Bad input gives no levels rather than failing
        assert!(super::lod_levels(&vertices[..5], &indices).is_empty());
    }

    /// Two-sided leaves (each drawn as a triangle pair facing both ways) scattered through a crown, as
    /// Boxing Arena's trees and ferns build them: 600 leaves, 4800 triangles.
    fn leaf_cloud() -> (Vec<f32>, Vec<u32>) {
        let (mut vertices, mut indices) = (Vec::new(), Vec::new());
        let mut seed = 7u32;
        let mut rand = || {
            seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
            seed as f32 / u32::MAX as f32
        };
        for _ in 0..600 {
            let (cx, cy, cz, yaw) = (rand() * 4.0 - 2.0, 4.0 + rand() * 3.0, rand() * 4.0 - 2.0, rand() * 6.3);
            let base = (vertices.len() / super::VERTEX_FLOATS) as u32;
            for (x, y) in [(0.0f32, 0.0f32), (-0.1, 0.12), (0.0, 0.2), (0.1, 0.12), (0.0, 0.35)] {
                vertices.extend_from_slice(&[
                    cx + x * yaw.cos(),
                    cy + y,
                    cz - x * yaw.sin() + y * 0.3,
                    0.0,
                    1.0,
                    0.0,
                    0.3,
                    0.45,
                    0.2,
                    0.0,
                    0.0,
                ]);
            }
            let front = [0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3].map(|i| base + i);
            indices.extend_from_slice(&front);
            indices.extend(front.iter().rev());
        }
        (vertices, indices)
    }

    #[test]
    fn lod_levels_keep_two_sided_leaves_whole() {
        // Simplified, the leaves folded away at almost no measured error (4800 -> 164 triangles at 0.0002)
        let (vertices, indices) = leaf_cloud();
        assert!(super::lod_levels(&vertices, &indices).is_empty());
        // The same leaves one-sided are an ordinary open mesh
        let front: Vec<u32> = indices.chunks_exact(24).flat_map(|leaf| leaf[..12].to_vec()).collect();
        assert!(super::two_sided_share(vertices.as_chunks::<{ super::VERTEX_FLOATS }>().0, &front) < 1e-6);
        assert!(super::two_sided_share(vertices.as_chunks::<{ super::VERTEX_FLOATS }>().0, &indices) > 0.99);
    }

    use super::*;

    fn vertex(p: [f32; 3], n: [f32; 3]) -> [f32; VERTEX_FLOATS] {
        [p[0], p[1], p[2], n[0], n[1], n[2], 1.0, 1.0, 1.0, 0.0, 0.0]
    }

    #[test]
    fn optimization_welds_complete_vertices_and_preserves_attribute_seams() {
        let a = vertex([0.0, 0.0, 0.0], [0.0, 0.0, 1.0]);
        let b = vertex([1.0, 0.0, 0.0], [0.0, 0.0, 1.0]);
        let c = vertex([0.0, 1.0, 0.0], [0.0, 0.0, 1.0]);
        let mut seam = a;
        seam[9] = 1.0;
        let v: Vec<f32> = [a, b, c, a, seam, vertex([10.0; 3], [0.0; 3])].into_iter().flatten().collect();
        let g = optimize(&v, &[0, 1, 2, 3, 1, 2, 4, 1, 2, 0, 0, 0], 1.0, 0.001, true).unwrap();
        assert_eq!(g.vertices.len() / 11, 4);
        assert_eq!(g.indices.len(), 9);
        assert!(g.vertices.chunks_exact(11).any(|p| p[0] == 0.0 && p[9] == 1.0));
        assert_eq!(v.len(), 66);
        assert!(optimize(&v, &[0, 1, 100], 1.0, 0.001, true).is_err());
        assert!(optimize(&v, &[0, 1, 2], f32::NAN, 0.001, true).is_err());
    }

    #[test]
    fn simplification_reduces_a_dense_sphere_and_only_reuses_authored_vertices() {
        let g = super::super::modelling::generate(br#"{"solid":{"kind":"sphere","radius":1},"resolution":32}"#).unwrap();
        let small = optimize(&g.vertices, &g.indices, 0.25, 0.02, true).unwrap();
        assert!(small.indices.len() < g.indices.len() / 2);
        assert!(small.vertices.len() < g.vertices.len() / 2);
        for v in small.vertices.chunks_exact(11) {
            assert!(g.vertices.chunks_exact(11).any(|original| original == v));
        }
    }

    #[test]
    fn smooth_normals_average_shared_positions() {
        // Two triangles folded along x = 0 (a roof), with the ridge vertices duplicated (a seam).
        let vs = [
            vertex([0.0, 1.0, 0.0], [0.0; 3]),
            vertex([0.0, 1.0, 1.0], [0.0; 3]),
            vertex([-1.0, 0.0, 0.0], [0.0; 3]),
            vertex([0.0, 1.0, 0.0], [0.0; 3]),
            vertex([1.0, 0.0, 0.0], [0.0; 3]),
            vertex([0.0, 1.0, 1.0], [0.0; 3]),
        ];
        let mut v: Vec<f32> = vs.iter().flatten().copied().collect();
        smooth_normals(&mut v, &[0, 2, 1, 3, 5, 4]);
        // Both ridge copies point straight up.
        for i in [0usize, 3] {
            let n = &v[i * VERTEX_FLOATS + 3..i * VERTEX_FLOATS + 6];
            assert!(n[0].abs() < 1e-5 && (n[1] - 1.0).abs() < 1e-5 && n[2].abs() < 1e-5, "{n:?}");
        }
        // A lower corner keeps its own face's normal (tilted out to -x).
        assert!(v[2 * VERTEX_FLOATS + 3] < -0.5);
    }

    #[test]
    fn smooth_normals_are_not_biased_by_patch_area() {
        let vs = [
            vertex([0.0, 0.0, 0.0], [1.0, 0.0, 0.0]),
            vertex([1.0, 0.0, 0.0], [1.0, 0.0, 0.0]),
            vertex([0.0, 1.0, 0.0], [1.0, 0.0, 0.0]),
            vertex([0.0, 0.0, 0.0], [1.0, 0.0, 0.0]),
            vertex([0.0, 0.0, 10.0], [1.0, 0.0, 0.0]),
            vertex([10.0, 0.0, 0.0], [1.0, 0.0, 0.0]),
        ];
        let mut v: Vec<f32> = vs.iter().flatten().copied().collect();
        smooth_normals(&mut v, &[0, 1, 2, 3, 4, 5]);
        for i in [0, 3] {
            let n = &v[i * VERTEX_FLOATS + 3..i * VERTEX_FLOATS + 6];
            assert!(n[0].abs() < 1e-6);
            assert!((n[1] - std::f32::consts::FRAC_1_SQRT_2).abs() < 1e-6);
            assert!((n[2] - std::f32::consts::FRAC_1_SQRT_2).abs() < 1e-6);
        }
    }

    #[test]
    fn smooth_normals_preserve_unused_and_degenerate_vertices() {
        let mut v: Vec<f32> = [vertex([0.0; 3], [0.0, 1.0, 0.0]), vertex([1.0; 3], [0.0, 0.0, 1.0])]
            .into_iter()
            .flatten()
            .collect();
        let original = v.clone();
        smooth_normals(&mut v, &[0, 0, 1, 0, 1, 20]);
        assert_eq!(v, original);
    }

    #[test]
    fn face_outward_flips_only_inward_triangles() {
        let up = [0.0, 0.0, 1.0];
        let vs = [vertex([0.0, 0.0, 0.0], up), vertex([1.0, 0.0, 0.0], up), vertex([0.0, 1.0, 0.0], up)];
        let v: Vec<f32> = vs.iter().flatten().copied().collect();
        let mut good = [0u32, 1, 2];
        face_outward(&v, &mut good);
        assert_eq!(good, [0, 1, 2]);
        let mut bad = [0u32, 2, 1];
        face_outward(&v, &mut bad);
        assert_eq!(bad, [0, 1, 2]);
    }

    #[test]
    fn place_part_scales_rotates_moves_colors_and_unmirrors() {
        let src: Vec<f32> = vertex([1.0, 0.0, 0.0], [1.0, 0.0, 0.0]).to_vec();
        let mut out = vec![0f32; VERTEX_FLOATS];
        let mut idx = [0u32; 3];
        // A quarter turn about y: +x goes to -z.
        let h = std::f32::consts::FRAC_1_SQRT_2;
        let p = Placement {
            position: [0.0, 2.0, 0.0],
            rotation: [0.0, h, 0.0, h],
            scale: [-2.0, 1.0, 1.0],
            color: [0.5, 1.0, 1.0],
        };
        place_part(&src, &[0, 1, 2], &p, 10, &mut out, &mut idx);
        assert!(
            (out[0]).abs() < 1e-5 && (out[1] - 2.0).abs() < 1e-5 && (out[2] - 2.0).abs() < 1e-5,
            "{:?}",
            &out[..3]
        );
        assert!((out[5] - 1.0).abs() < 1e-5, "normal follows the mirrored scale");
        assert!((out[6] - 0.5).abs() < 1e-6);
        assert_eq!(idx, [10, 12, 11], "mirrored winding flipped back");
    }
}
