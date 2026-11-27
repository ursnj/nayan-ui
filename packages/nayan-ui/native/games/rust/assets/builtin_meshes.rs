//! Procedural generation of the built-in shape meshes (cube, sphere, cylinder, cone, capsule,
//! torus, rounded box, plane, puff/flame sprite). These are registered with the renderer once.

use crate::render::{self, VERTEX_FLOATS};
use crate::shapes;

const TAU: f32 = std::f32::consts::TAU;

// ── Builder ─────────────────────────────────────────────────────────────

struct Builder {
    vertices: Vec<f32>,
    indices: Vec<u32>,
}

impl Builder {
    fn new() -> Self {
        Self {
            vertices: Vec::new(),
            indices: Vec::new(),
        }
    }

    fn vertex(&mut self, p: [f32; 3], n: [f32; 3], u: f32, v: f32) -> u32 {
        self.vertices.extend_from_slice(&p);
        self.vertices.extend_from_slice(&n);
        self.vertices.extend_from_slice(&[1.0, 1.0, 1.0, u, v]);
        (self.vertices.len() / VERTEX_FLOATS - 1) as u32
    }

    fn quad(&mut self, a: u32, b: u32, c: u32, d: u32) {
        self.indices.extend_from_slice(&[a, b, c, a, c, d]);
    }

    fn grid(&mut self, rows: usize, cols: usize, at: impl Fn(f32, f32) -> ([f32; 3], [f32; 3])) {
        let us: Vec<f32> = (0..=cols).map(|j| j as f32 / cols as f32).collect();
        let vs: Vec<f32> = (0..=rows).map(|i| i as f32 / rows as f32).collect();
        self.grid_at(&vs, &us, at);
    }

    /// A grid through the given parameter stops (each 0..1, ascending): rows along `vs`, columns along `us`.
    fn grid_at(&mut self, vs: &[f32], us: &[f32], at: impl Fn(f32, f32) -> ([f32; 3], [f32; 3])) {
        let first = (self.vertices.len() / VERTEX_FLOATS) as u32;
        for &v in vs {
            for &u in us {
                let (p, n) = at(u, v);
                self.vertex(p, n, u, v);
            }
        }
        let (rows, cols) = (vs.len() - 1, us.len() - 1);
        let cols1 = (cols + 1) as u32;
        for i in 0..rows as u32 {
            for j in 0..cols as u32 {
                let a = first + i * cols1 + j;
                let b = a + cols1;
                self.indices.extend_from_slice(&[a, b, a + 1, a + 1, b, b + 1]);
            }
        }
    }

    fn disc(&mut self, y: f32, radius: f32, facing: f32, segments: usize) {
        let center = self.vertex([0.0, y, 0.0], [0.0, facing, 0.0], 0.5, 0.5);
        let first = center + 1;
        for j in 0..=segments {
            let t = (j as f32 / segments as f32) * TAU;
            let (x, z) = (t.cos(), t.sin());
            self.vertex([x * radius, y, z * radius], [0.0, facing, 0.0], 0.5 + x / 2.0, 0.5 + z / 2.0);
        }
        for j in 0..segments as u32 {
            if facing > 0.0 {
                self.indices.extend_from_slice(&[center, first + j + 1, first + j]);
            } else {
                self.indices.extend_from_slice(&[center, first + j, first + j + 1]);
            }
        }
    }
}

// ── Shape generators ────────────────────────────────────────────────────

type V3 = [f32; 3];

const FACES: [[V3; 3]; 6] = [
    [[1.0, 0.0, 0.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]],
    [[-1.0, 0.0, 0.0], [0.0, 0.0, 1.0], [0.0, 1.0, 0.0]],
    [[0.0, 1.0, 0.0], [1.0, 0.0, 0.0], [0.0, 0.0, -1.0]],
    [[0.0, -1.0, 0.0], [1.0, 0.0, 0.0], [0.0, 0.0, 1.0]],
    [[0.0, 0.0, 1.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0]],
    [[0.0, 0.0, -1.0], [-1.0, 0.0, 0.0], [0.0, 1.0, 0.0]],
];

fn box_faces(steps: usize, shape: impl Fn(V3, V3) -> (V3, V3)) -> Builder {
    let stops: Vec<f32> = (0..=steps).map(|i| i as f32 / steps as f32).collect();
    box_faces_at(&stops, shape)
}

/// A unit box whose faces are grids through `stops` (0..1 across each face), shaped by `shape`.
fn box_faces_at(stops: &[f32], shape: impl Fn(V3, V3) -> (V3, V3)) -> Builder {
    let mut b = Builder::new();
    for [n, u, v] in &FACES {
        b.grid_at(stops, stops, |a, bv| {
            let s = a - 0.5;
            let t = 0.5 - bv;
            let p = [
                n[0] * 0.5 + u[0] * s + v[0] * t,
                n[1] * 0.5 + u[1] * s + v[1] * t,
                n[2] * 0.5 + u[2] * s + v[2] * t,
            ];
            shape(p, *n)
        });
    }
    b
}

fn cube() -> Builder {
    box_faces(1, |p, n| (p, n))
}

fn rounded_box() -> Builder {
    let radius = 0.1_f32;
    let inner = 0.5 - radius;
    // The rounding lies in each face's outer sixth; inside it the face is flat, so its only stops are
    // the sixths either side (the vertices a uniform 6x6 grid would have there, the same surface and
    // UVs) instead of 4x4 coplanar cells: 108 triangles rather than 432, for every slab, kerb and card.
    box_faces_at(&[0.0, 1.0 / 6.0, 5.0 / 6.0, 1.0], move |p, n| {
        let c = [p[0].clamp(-inner, inner), p[1].clamp(-inner, inner), p[2].clamp(-inner, inner)];
        let d = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
        let len = (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]).sqrt();
        let dir = if len > 1e-6 { [d[0] / len, d[1] / len, d[2] / len] } else { n };
        ([c[0] + dir[0] * radius, c[1] + dir[1] * radius, c[2] + dir[2] * radius], dir)
    })
}

fn on_sphere(radius: f32, phi: f32, u: f32, y_offset: f32) -> (V3, V3) {
    let theta = -u * TAU;
    let n = [phi.sin() * theta.cos(), phi.cos(), phi.sin() * theta.sin()];
    ([n[0] * radius, n[1] * radius + y_offset, n[2] * radius], n)
}

fn sphere() -> Builder {
    sphere_of(16, 24)
}

fn sphere_of(rings: usize, segments: usize) -> Builder {
    let mut b = Builder::new();
    b.grid(rings, segments, |u, v| {
        let (p, n) = on_sphere(0.5, v * std::f32::consts::PI, u, 0.0);
        (p, n)
    });
    b
}

fn capsule() -> Builder {
    let (rings, segments) = (16, 24);
    let r = 0.25_f32;
    let half = rings / 2;
    let mut b = Builder::new();
    b.grid(rings + 1, segments, |u, v| {
        let row = (v * (rings + 1) as f32).round() as usize;
        let top = row <= half;
        let phi_row = if top { row } else { row - 1 };
        on_sphere(
            r,
            (phi_row as f32 / rings as f32) * std::f32::consts::PI,
            u,
            if top { 0.5 - r } else { r - 0.5 },
        )
    });
    b
}

fn cylinder() -> Builder {
    let segments = 24;
    let mut b = Builder::new();
    b.grid(1, segments, |u, v| {
        let t = -u * TAU;
        ([t.cos() * 0.5, 0.5 - v, t.sin() * 0.5], [t.cos(), 0.0, t.sin()])
    });
    b.disc(0.5, 0.5, 1.0, segments);
    b.disc(-0.5, 0.5, -1.0, segments);
    b
}

fn cone() -> Builder {
    let segments = 24;
    let ny = 0.5 / (1.0_f32 + 0.25).sqrt();
    let nr = 1.0 / (1.0_f32 + 0.25).sqrt();
    let mut b = Builder::new();
    b.grid(1, segments, |u, v| {
        let t = -u * TAU;
        let radius = v * 0.5;
        ([t.cos() * radius, 0.5 - v, t.sin() * radius], [t.cos() * nr, ny, t.sin() * nr])
    });
    b.disc(-0.5, 0.5, -1.0, segments);
    b
}

fn torus() -> Builder {
    let (segments, sides) = (32, 12);
    let tube = 0.15_f32;
    let ring = 0.5 - tube;
    let mut b = Builder::new();
    b.grid(sides, segments, |u, v| {
        let t = -u * TAU;
        let s = -v * TAU;
        let n = [s.cos() * t.cos(), s.sin(), s.cos() * t.sin()];
        ([t.cos() * ring + n[0] * tube, n[1] * tube, t.sin() * ring + n[2] * tube], n)
    });
    b
}

fn plane() -> Builder {
    let mut b = Builder::new();
    let up = [0.0, 1.0, 0.0];
    let a = b.vertex([-0.5, 0.0, -0.5], up, 0.0, 0.0);
    let bv = b.vertex([-0.5, 0.0, 0.5], up, 0.0, 1.0);
    let c = b.vertex([0.5, 0.0, 0.5], up, 1.0, 1.0);
    let d = b.vertex([0.5, 0.0, -0.5], up, 1.0, 0.0);
    b.quad(a, bv, c, d);
    b
}

fn puff() -> Builder {
    let mut b = Builder::new();
    let billboard = [0.0, 0.0, 0.0];
    let a = b.vertex([-0.5, -0.5, 0.0], billboard, 0.0, 1.0);
    let bv = b.vertex([0.5, -0.5, 0.0], billboard, 1.0, 1.0);
    let c = b.vertex([0.5, 0.5, 0.0], billboard, 1.0, 0.0);
    let d = b.vertex([-0.5, 0.5, 0.0], billboard, 0.0, 0.0);
    b.quad(a, bv, c, d);
    b
}

// ── Registration ────────────────────────────────────────────────────────

fn register(id: crate::MeshId, b: Builder) {
    render::register_mesh(id, &b.vertices, &b.indices, None, 0.0);
}

/// Generates and registers all built-in shapes with the renderer (idempotent: skips shapes that
/// already have geometry).
pub fn generate_builtin_meshes() {
    register(shapes::CUBE, cube());
    register(shapes::SPHERE, sphere());
    register(shapes::SPHERE_MEDIUM, sphere_of(10, 16));
    register(shapes::SPHERE_SMALL, sphere_of(6, 12));
    register(shapes::SPHERE_TINY, sphere_of(4, 8));
    register(shapes::PLANE, plane());
    register(shapes::CYLINDER, cylinder());
    register(shapes::CONE, cone());
    register(shapes::CAPSULE, capsule());
    register(shapes::TORUS, torus());
    register(shapes::ROUNDED_BOX, rounded_box());
    register(shapes::PUFF, puff());
    register(shapes::FLAME, puff()); // same sprite, renderer draws it additively
}

#[cfg(test)]
mod tests {
    use super::*;

    fn all_builders() -> Vec<(&'static str, Builder)> {
        vec![
            ("cube", cube()),
            ("sphere", sphere()),
            ("medium sphere", sphere_of(10, 16)),
            ("small sphere", sphere_of(6, 12)),
            ("tiny sphere", sphere_of(4, 8)),
            ("plane", plane()),
            ("cylinder", cylinder()),
            ("cone", cone()),
            ("capsule", capsule()),
            ("torus", torus()),
            ("rounded_box", rounded_box()),
            ("puff", puff()),
        ]
    }

    #[test]
    fn all_shapes_have_valid_geometry() {
        for (name, b) in all_builders() {
            let vertex_count = b.vertices.len() / VERTEX_FLOATS;
            assert!(vertex_count > 0, "{name} has no vertices");
            assert!(b.indices.len() >= 3 && b.indices.len() % 3 == 0, "{name} indices not triangles");
            assert!(
                b.indices.iter().all(|&idx| (idx as usize) < vertex_count),
                "{name} has out-of-bounds index"
            );
            assert!(b.vertices.iter().all(|v| v.is_finite()), "{name} has non-finite vertex");
        }
    }

    #[test]
    fn normals_are_unit_length() {
        for (name, b) in all_builders() {
            if name == "puff" {
                continue;
            } // billboard normals are zero (oriented at render time)
            let verts = &b.vertices;
            for i in (0..verts.len()).step_by(VERTEX_FLOATS) {
                let (nx, ny, nz) = (verts[i + 3], verts[i + 4], verts[i + 5]);
                let len = (nx * nx + ny * ny + nz * nz).sqrt();
                assert!((len - 1.0).abs() < 0.02, "{name} vertex {}: normal length {len}", i / VERTEX_FLOATS);
            }
        }
    }

    #[test]
    fn puff_billboard_has_zero_normals() {
        let b = puff();
        let verts = &b.vertices;
        for i in (0..verts.len()).step_by(VERTEX_FLOATS) {
            let (nx, ny, nz) = (verts[i + 3], verts[i + 4], verts[i + 5]);
            assert!(nx == 0.0 && ny == 0.0 && nz == 0.0, "puff billboard should have zero normals");
        }
    }

    #[test]
    fn uvs_are_in_zero_one_range() {
        for (name, b) in all_builders() {
            let verts = &b.vertices;
            for i in (0..verts.len()).step_by(VERTEX_FLOATS) {
                let (u, v) = (verts[i + 9], verts[i + 10]);
                assert!(u >= -0.01 && u <= 1.01, "{name} vertex {}: u={u}", i / VERTEX_FLOATS);
                assert!(v >= -0.01 && v <= 1.01, "{name} vertex {}: v={v}", i / VERTEX_FLOATS);
            }
        }
    }

    #[test]
    fn positions_fit_unit_bounding_box() {
        for (name, b) in all_builders() {
            let verts = &b.vertices;
            for i in (0..verts.len()).step_by(VERTEX_FLOATS) {
                let (px, py, pz) = (verts[i], verts[i + 1], verts[i + 2]);
                assert!(
                    px.abs() <= 0.51 && py.abs() <= 0.51 && pz.abs() <= 0.51,
                    "{name} vertex {} out of unit box: ({px}, {py}, {pz})",
                    i / VERTEX_FLOATS
                );
            }
        }
    }

    #[test]
    fn registration_roundtrip() {
        generate_builtin_meshes();
        let ids = [
            ("cube", shapes::CUBE),
            ("sphere", shapes::SPHERE),
            ("plane", shapes::PLANE),
            ("cylinder", shapes::CYLINDER),
            ("cone", shapes::CONE),
            ("capsule", shapes::CAPSULE),
            ("torus", shapes::TORUS),
            ("rounded_box", shapes::ROUNDED_BOX),
            ("puff", shapes::PUFF),
            ("flame", shapes::FLAME),
        ];
        for (name, id) in ids {
            let data = render::mesh_data(id);
            assert!(data.is_some(), "{name} (id={id}) not registered after generate_builtin_meshes");
            let data = data.unwrap();
            assert!(data.vertices.len() >= VERTEX_FLOATS, "{name} has too few vertex floats");
            assert!(data.indices.len() >= 3, "{name} has too few indices");
        }
    }

    #[test]
    fn puff_and_flame_share_geometry() {
        generate_builtin_meshes();
        let puff = render::mesh_data(shapes::PUFF).unwrap();
        let flame = render::mesh_data(shapes::FLAME).unwrap();
        assert_eq!(puff.vertices, flame.vertices, "puff and flame should share geometry");
        assert_eq!(puff.indices, flame.indices);
    }

    #[test]
    fn cube_has_expected_topology() {
        let b = cube();
        let vertex_count = b.vertices.len() / VERTEX_FLOATS;
        // A cube with separate normals per face: 6 faces × 4 vertices = 24
        assert_eq!(vertex_count, 24, "cube vertex count");
        // 6 faces × 2 triangles × 3 indices = 36
        assert_eq!(b.indices.len(), 36, "cube index count");
    }
}
