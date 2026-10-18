//! Mesh-building passes for custom shapes, run in place on JS-owned buffers (11 floats per vertex:
//! position, normal, color, uv; u32 triangle indices). These are the loops that dominated building
//! fruit and other lathed / tubed shapes in JS: smoothing normals (hashing every vertex position),
//! turning triangles to face their normals, and baking merged parts.

use std::collections::HashMap;

pub const VERTEX_FLOATS: usize = 11;

/// Recomputes normals from the triangles (area-weighted), averaged across vertices at the same
/// place (seams, poles), so displaced surfaces catch the light. Vertices no triangle touches keep
/// their normal.
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
        for v in [a, b, c] {
            let s = &mut sums[slot_of[v]];
            s[0] += f[0];
            s[1] += f[1];
            s[2] += f[2];
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
            let n = vertices[a * VERTEX_FLOATS + 3 + k] as f64 + vertices[b * VERTEX_FLOATS + 3 + k] as f64 + vertices[c * VERTEX_FLOATS + 3 + k] as f64;
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
        Self { position: [0.0; 3], rotation: [0.0, 0.0, 0.0, 1.0], scale: [1.0; 3], color: [1.0; 3] }
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
        [x + qw * tx + (qy * tz - qz * ty), y + qw * ty + (qz * tx - qx * tz), z + qw * tz + (qx * ty - qy * tx)]
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
    (x as f64 * 1e5).round() as i64
}

/// (b - a) x (c - a), in f64.
fn face_cross(v: &[f32], a: usize, b: usize, c: usize) -> [f64; 3] {
    let p = |i: usize, k: usize| v[i * VERTEX_FLOATS + k] as f64;
    let e1 = [p(b, 0) - p(a, 0), p(b, 1) - p(a, 1), p(b, 2) - p(a, 2)];
    let e2 = [p(c, 0) - p(a, 0), p(c, 1) - p(a, 1), p(c, 2) - p(a, 2)];
    [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
}

#[cfg(test)]
mod tests {
    use super::*;

    fn vertex(p: [f32; 3], n: [f32; 3]) -> [f32; VERTEX_FLOATS] {
        [p[0], p[1], p[2], n[0], n[1], n[2], 1.0, 1.0, 1.0, 0.0, 0.0]
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
        let p = Placement { position: [0.0, 2.0, 0.0], rotation: [0.0, h, 0.0, h], scale: [-2.0, 1.0, 1.0], color: [0.5, 1.0, 1.0] };
        place_part(&src, &[0, 1, 2], &p, 10, &mut out, &mut idx);
        assert!((out[0]).abs() < 1e-5 && (out[1] - 2.0).abs() < 1e-5 && (out[2] - 2.0).abs() < 1e-5, "{:?}", &out[..3]);
        assert!((out[5] - 1.0).abs() < 1e-5, "normal follows the mirrored scale");
        assert!((out[6] - 0.5).abs() < 1e-6);
        assert_eq!(idx, [10, 12, 11], "mirrored winding flipped back");
    }
}
