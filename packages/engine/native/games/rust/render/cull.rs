//! Frustum culling. Before a frame is uploaded, the renderer keeps only the instances whose bounding
//! sphere touches the camera's view (and, for the shadow pass, the light's box), so off-screen
//! scenery costs no vertex work, triangle setup or upload bandwidth. Open levels and long tracks
//! draw a fraction of their triangles; phone GPUs (Android's above all) are mostly limited by that.
//!
//! Every test is conservative: a sphere that might touch the view is drawn. Bounds come from the
//! mesh's own vertices; camera-facing sprites (zero normals), which the shader turns around their
//! origin, get a sphere around the origin; skinned meshes, which animation can move anywhere, are
//! never culled.

use glamx::{Mat4, Vec3, Vec4};

use super::VERTEX_FLOATS;

/// A mesh's bounds in its own space.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Sphere {
    pub center: Vec3,
    pub radius: f32,
}

impl Sphere {
    /// Bounds nothing can fall outside of: never culled.
    pub const EVERYWHERE: Sphere = Sphere {
        center: Vec3::ZERO,
        radius: f32::INFINITY,
    };
}

/// The sphere around a mesh's vertices (interleaved, `VERTEX_FLOATS` each): centred on their box,
/// or on the origin when any vertex is a sprite corner (a zero normal), as the shader turns those.
pub fn mesh_bounds(vertices: &[f32]) -> Sphere {
    let points = || vertices.chunks_exact(VERTEX_FLOATS);
    if vertices.len() < VERTEX_FLOATS {
        return Sphere::EVERYWHERE;
    }
    let mut lo = Vec3::splat(f32::INFINITY);
    let mut hi = Vec3::splat(f32::NEG_INFINITY);
    let mut sprite = false;
    for v in points() {
        let p = Vec3::new(v[0], v[1], v[2]);
        lo = lo.min(p);
        hi = hi.max(p);
        sprite |= v[3] * v[3] + v[4] * v[4] + v[5] * v[5] < 0.5;
    }
    let center = if sprite { Vec3::ZERO } else { (lo + hi) * 0.5 };
    let radius = points().map(|v| Vec3::new(v[0], v[1], v[2]).distance(center)).fold(0.0f32, f32::max);
    if !radius.is_finite() || !center.is_finite() {
        return Sphere::EVERYWHERE;
    }
    Sphere { center, radius }
}

/// The six planes of a view-projection's clip volume (x and y in -w..w, depth 0..w, as wgpu uses),
/// pointing inward and normalized so a plane test gives distances; and what it takes to tell how
/// big something looks (the clip w row, and how much the projection stretches a length vertically).
pub struct Frustum {
    planes: [Vec4; 6],
    w: Vec4,
    z: Vec4,
    height: f32,
}

impl Frustum {
    pub fn new(view_proj: Mat4) -> Self {
        let r = |i| view_proj.row(i);
        let planes = [r(3) + r(0), r(3) - r(0), r(3) + r(1), r(3) - r(1), r(2), r(3) - r(2)].map(|p| {
            let length = p.truncate().length();
            if length > 0.0 && length.is_finite() { p / length } else { Vec4::ZERO }
        });
        Frustum {
            planes,
            w: r(3),
            z: r(2),
            height: r(1).truncate().length(),
        }
    }

    /// Whether a world-space sphere may touch the volume.
    pub fn touches(&self, center: Vec3, radius: f32) -> bool {
        if !radius.is_finite() || !center.is_finite() {
            return true;
        }
        self.planes.iter().all(|p| p.truncate().dot(center) + p.w >= -radius)
    }

    /// Whether an instance (a column-major model matrix, 16 floats) of a mesh with `bounds` may be seen.
    /// One scaled to nothing (how games hide pooled pieces) never is: all its triangles meet in a point.
    pub fn sees(&self, matrix: &[f32], bounds: Sphere) -> bool {
        match placed(matrix, bounds) {
            Some((_, 0.0)) => false,
            Some((center, radius)) => self.touches(center, radius),
            None => true,
        }
    }

    /// How far off an instance's centre is, as clip depth (growing away from the eye, perspective or
    /// orthographic alike): for drawing opaque things front to back.
    pub fn depth(&self, matrix: &[f32], bounds: Sphere) -> f32 {
        match placed(matrix, bounds) {
            Some((center, _)) if center.is_finite() => self.z.truncate().dot(center) + self.z.w,
            _ => 0.0,
        }
    }

    /// How big an instance looks: its bounding sphere's radius in clip units of the view's height (the
    /// view is 2 tall), so `radius * height_in_pixels / 2` is its radius on screen. Infinite when
    /// that can't be told (unbounded, or reaching behind the eye).
    pub fn screen_radius(&self, matrix: &[f32], bounds: Sphere) -> f32 {
        let Some((center, radius)) = placed(matrix, bounds) else {
            return f32::INFINITY;
        };
        let w = self.w.truncate().dot(center) + self.w.w;
        if w <= radius * self.w.truncate().length() || !w.is_finite() {
            return f32::INFINITY;
        }
        radius * self.height / w
    }
}

/// An instance's bounding sphere in world space, if it has one.
fn placed(matrix: &[f32], bounds: Sphere) -> Option<(Vec3, f32)> {
    if !bounds.radius.is_finite() || matrix.len() < 16 {
        return None;
    }
    let m = matrix;
    let c = bounds.center;
    let center = Vec3::new(
        m[0] * c.x + m[4] * c.y + m[8] * c.z + m[12],
        m[1] * c.x + m[5] * c.y + m[9] * c.z + m[13],
        m[2] * c.x + m[6] * c.y + m[10] * c.z + m[14],
    );
    // The largest axis scale covers non-uniform scaling and rotation alike.
    let scale = Vec3::new(m[0], m[1], m[2])
        .length_squared()
        .max(Vec3::new(m[4], m[5], m[6]).length_squared())
        .max(Vec3::new(m[8], m[9], m[10]).length_squared())
        .sqrt();
    Some((center, bounds.radius * scale))
}

#[cfg(test)]
#[allow(deprecated)] // glam's older camera helpers, as the renderer uses
mod tests {
    use super::*;

    fn vertex(p: [f32; 3], n: [f32; 3]) -> [f32; VERTEX_FLOATS] {
        [p[0], p[1], p[2], n[0], n[1], n[2], 1.0, 1.0, 1.0, 0.0, 0.0]
    }

    fn mesh(points: &[([f32; 3], [f32; 3])]) -> Vec<f32> {
        points.iter().flat_map(|&(p, n)| vertex(p, n)).collect()
    }

    fn translate(x: f32, y: f32, z: f32, scale: f32) -> [f32; 16] {
        Mat4::from_scale_rotation_translation(Vec3::splat(scale), Default::default(), Vec3::new(x, y, z)).to_cols_array()
    }

    /// A camera at z = 10 looking down -z, 90 degrees across, square.
    fn camera() -> Frustum {
        let view = Mat4::look_at_rh(Vec3::new(0.0, 0.0, 10.0), Vec3::ZERO, Vec3::Y);
        Frustum::new(Mat4::perspective_rh(std::f32::consts::FRAC_PI_2, 1.0, 0.1, 500.0) * view)
    }

    #[test]
    fn bounds_wrap_every_vertex_and_sprites_turn_around_their_origin() {
        let up = [0.0, 1.0, 0.0];
        let b = mesh_bounds(&mesh(&[([1.0, 0.0, 0.0], up), ([3.0, 0.0, 0.0], up), ([2.0, 1.0, 0.0], up)]));
        assert_eq!(b.center, Vec3::new(2.0, 0.5, 0.0));
        assert!((b.radius - (1.0f32 + 0.25).sqrt()).abs() < 1e-6);
        // A sprite quad off-centre: the sphere is around the origin it's turned about.
        let none = [0.0, 0.0, 0.0];
        let s = mesh_bounds(&mesh(&[([1.0, 1.0, 0.0], none), ([2.0, 1.0, 0.0], none)]));
        assert_eq!(s.center, Vec3::ZERO);
        assert!((s.radius - 5.0f32.sqrt()).abs() < 1e-6);
        assert_eq!(mesh_bounds(&[]), Sphere::EVERYWHERE);
    }

    #[test]
    fn keeps_what_the_camera_sees_and_drops_what_is_behind_or_beside_it() {
        let f = camera();
        let unit = Sphere {
            center: Vec3::ZERO,
            radius: 0.5,
        };
        assert!(f.sees(&translate(0.0, 0.0, 0.0, 1.0), unit), "straight ahead");
        assert!(f.sees(&translate(0.0, 0.0, -400.0, 1.0), unit), "far, still inside the far plane");
        assert!(!f.sees(&translate(0.0, 0.0, 20.0, 1.0), unit), "behind the camera");
        assert!(!f.sees(&translate(0.0, 0.0, -600.0, 1.0), unit), "beyond the far plane");
        assert!(!f.sees(&translate(30.0, 0.0, 0.0, 1.0), unit), "far to the side");
        // At z = 0 the view spans x in -10..10: a sphere just outside the edge is dropped, one
        // overlapping it is kept, and scaling grows the sphere with the instance.
        assert!(!f.sees(&translate(11.0, 0.0, 0.0, 1.0), unit));
        assert!(f.sees(&translate(10.3, 0.0, 0.0, 1.0), unit));
        assert!(f.sees(&translate(11.0, 0.0, 0.0, 4.0), unit));
        // Stretching along one axis only still counts that axis.
        let mut stretched = translate(14.0, 0.0, 0.0, 1.0);
        stretched[0] = 12.0;
        assert!(f.sees(&stretched, unit));
        // Hidden by scaling to nothing: dropped, in view or not; flattened on one axis only: kept.
        assert!(!f.sees(&translate(0.0, 0.0, 0.0, 0.0), unit));
        let mut flat = translate(0.0, 0.0, 0.0, 1.0);
        flat[5] = 0.0;
        assert!(f.sees(&flat, unit));
    }

    #[test]
    fn unbounded_and_degenerate_input_is_always_drawn() {
        let f = camera();
        assert!(f.sees(&translate(0.0, 0.0, 99.0, 1.0), Sphere::EVERYWHERE));
        assert!(f.sees(
            &[f32::NAN; 16],
            Sphere {
                center: Vec3::ZERO,
                radius: 1.0
            }
        ));
        assert!(f.sees(
            &[0.0; 4],
            Sphere {
                center: Vec3::ZERO,
                radius: 1.0
            }
        ));
        // A zero matrix (a degenerate camera) culls nothing.
        let flat = Frustum::new(Mat4::ZERO);
        assert!(flat.sees(
            &translate(1e6, 0.0, 0.0, 1.0),
            Sphere {
                center: Vec3::ZERO,
                radius: 1.0
            }
        ));
    }

    #[test]
    fn screen_radius_follows_distance_and_scale_and_is_unbounded_reaching_behind_the_eye() {
        // 90 degrees across: at distance d a sphere of radius r spans r / d of the view's half-height.
        let f = camera();
        let unit = Sphere {
            center: Vec3::ZERO,
            radius: 0.5,
        };
        assert!((f.screen_radius(&translate(0.0, 0.0, 0.0, 1.0), unit) - 0.05).abs() < 1e-5);
        assert!((f.screen_radius(&translate(3.0, 0.0, -90.0, 1.0), unit) - 0.005).abs() < 1e-5);
        assert!((f.screen_radius(&translate(0.0, 0.0, 0.0, 2.0), unit) - 0.1).abs() < 1e-5);
        assert_eq!(f.screen_radius(&translate(0.0, 0.0, 9.8, 1.0), unit), f32::INFINITY);
        assert_eq!(f.screen_radius(&translate(0.0, 0.0, 20.0, 1.0), unit), f32::INFINITY);
        assert_eq!(f.screen_radius(&translate(0.0, 0.0, 0.0, 1.0), Sphere::EVERYWHERE), f32::INFINITY);
        // Orthographic: the same size at any depth, the box's height being 2.
        let view = Mat4::look_at_rh(Vec3::new(0.0, 60.0, 0.0), Vec3::ZERO, Vec3::Z);
        let light = Frustum::new(Mat4::orthographic_rh(-30.0, 30.0, -30.0, 30.0, 1.0, 140.0) * view);
        let one = Sphere {
            center: Vec3::ZERO,
            radius: 1.0,
        };
        assert!((light.screen_radius(&translate(5.0, -20.0, 5.0, 1.0), one) - 1.0 / 30.0).abs() < 1e-5);
    }

    #[test]
    fn depth_grows_away_from_the_eye_in_either_projection() {
        let f = camera();
        let unit = Sphere {
            center: Vec3::ZERO,
            radius: 0.5,
        };
        let near = f.depth(&translate(0.0, 0.0, 5.0, 1.0), unit);
        let mid = f.depth(&translate(4.0, 0.0, 0.0, 1.0), unit);
        let far = f.depth(&translate(0.0, 0.0, -200.0, 1.0), unit);
        assert!(near < mid && mid < far);
        let view = Mat4::look_at_rh(Vec3::new(0.0, 60.0, 0.0), Vec3::ZERO, Vec3::Z);
        let light = Frustum::new(Mat4::orthographic_rh(-30.0, 30.0, -30.0, 30.0, 1.0, 140.0) * view);
        assert!(light.depth(&translate(0.0, 20.0, 0.0, 1.0), unit) < light.depth(&translate(0.0, -20.0, 0.0, 1.0), unit));
    }

    #[test]
    fn an_orthographic_light_box_culls_by_its_extent() {
        let view = Mat4::look_at_rh(Vec3::new(0.0, 60.0, 0.0), Vec3::ZERO, Vec3::Z);
        let f = Frustum::new(Mat4::orthographic_rh(-30.0, 30.0, -30.0, 30.0, 1.0, 140.0) * view);
        let unit = Sphere {
            center: Vec3::ZERO,
            radius: 1.0,
        };
        assert!(f.sees(&translate(25.0, 0.0, 25.0, 1.0), unit));
        assert!(!f.sees(&translate(40.0, 0.0, 0.0, 1.0), unit));
        assert!(!f.sees(&translate(0.0, 0.0, -40.0, 1.0), unit));
    }
}
