//! Instance buffers for the renderer, interpolated between simulation steps; picking; camera math.

use super::*;
use rapier3d::glamx::{Mat4, Vec4};

impl World {
    /// Writes matrices/colors/regions bucketed so each (opacity, mesh) pair is one contiguous
    /// instance range: every opaque mesh first, then every transparent one (alpha < 1).
    /// `alpha` in 0..1 blends from the previous step's transform to the current one.
    pub(super) fn write_outputs(&mut self, alpha: f32) {
        self.alpha = alpha;
        let n = self.len();
        // Only ids handed out so far can be drawn; the ranges past them stay zero.
        let used = crate::assets::model::mesh_count().min(MAX_MESHES);
        // See-through instances, and sprites (puffs and flames), go in the second half: drawn blended, last.
        // Nothing to draw (no mesh, an id never handed out, or fully transparent): left out, so it costs no upload or overdraw.
        let bucket = |i: usize, mesh: &[MeshId], color: &[[f32; 4]], scale: &[Vec3]| {
            if mesh[i] == shapes::NONE || mesh[i] as usize >= used || color[i][3] <= 0.0 || scale[i] == Vec3::ZERO {
                return None;
            }
            let sprite = mesh[i] == shapes::PUFF || mesh[i] == shapes::FLAME;
            Some(mesh[i] as usize + if color[i][3] < 1.0 || sprite { MAX_MESHES } else { 0 })
        };
        let mut counts = std::mem::take(&mut self.bucket_counts);
        counts.clear();
        counts.resize(MAX_MESHES * 2, 0);
        let mut attached = false;
        for i in 0..n {
            if let Some(b) = bucket(i, &self.mesh, &self.color, &self.scale) {
                counts[b] += 1;
            }
            attached |= self.parent[i] != NO_ENTITY;
        }
        // Ancestors' world matrices are computed once per frame and reused by every descendant.
        let mut cache = std::mem::take(&mut self.world_cache);
        if attached {
            cache.done.clear();
            cache.done.resize(n, false);
            if cache.matrices.len() < n {
                cache.matrices.resize(n, Mat4::IDENTITY);
            }
        }
        let mut first = 0;
        for half in [0, MAX_MESHES] {
            for b in half..half + used {
                self.ranges[b * 2] = first;
                self.ranges[b * 2 + 1] = counts[b];
                counts[b] = first; // now the bucket's write cursor
                first += self.ranges[b * 2 + 1];
            }
        }
        let mut cursor = counts;

        let mut skins = 0;
        let skinned = self.has_skeletons();
        for i in 0..n {
            let Some(b) = bucket(i, &self.mesh, &self.color, &self.scale) else {
                continue;
            };
            let k = cursor[b] as usize;
            cursor[b] += 1;
            let matrix = self.cached_world_matrix(i, alpha, &mut cache, 0);
            self.out_matrices[k * 16..k * 16 + 16].copy_from_slice(&matrix.to_cols_array());
            self.out_colors[k * 4..k * 4 + 4].copy_from_slice(&self.color[i]);
            self.out_regions[k * 4..k * 4 + 4].copy_from_slice(&self.region[i]);
            if skinned && self.write_skin(self.entity_at(i), k, skins, alpha) {
                skins += 1;
            }
        }
        self.out_skins.truncate(skins);
        self.out_skins.sort_unstable_by_key(|s| s.instance);
        self.world_cache = cache;
        self.bucket_counts = cursor;
    }

    /// `world_matrix` for `write_outputs`: the parent's world matrix comes from `cache` (computed on
    /// first use), so a chain costs one local matrix per entity instead of one per ancestor.
    fn cached_world_matrix(&self, i: usize, alpha: f32, cache: &mut WorldCache, depth: usize) -> Mat4 {
        let local = self.local_matrix(i, alpha);
        let Some(p) = self.dense(Entity(self.parent[i])).filter(|_| depth < MAX_DEPTH) else {
            return local;
        };
        if !cache.done[p] {
            cache.matrices[p] = self.cached_world_matrix(p, alpha, cache, depth + 1);
            cache.done[p] = true;
        }
        cache.matrices[p] * local
    }

    /// Interpolated (and bobbing / shake offset) local pose used for rendering.
    pub(super) fn render_pose(&self, i: usize, alpha: f32) -> (Vec3, Quat) {
        let osc = self.oscillation[i];
        // Most entities don't bob: skip the sine.
        let bob = if osc.amplitude != Vec3::ZERO {
            osc.amplitude * osc.phase.sin()
        } else {
            Vec3::ZERO
        };
        (
            self.prev_position[i].lerp(self.position[i], alpha) + bob + self.shake_offset[i],
            self.prev_rotation[i].lerp(self.rotation[i], alpha),
        )
    }

    /// Local transform: interpolated pose and scale, shrinking over the last 0.2 s of a lifetime.
    fn local_matrix(&self, i: usize, alpha: f32) -> Mat4 {
        let (position, rotation) = self.render_pose(i, alpha);
        let life = self.lifetime[i];
        let fade = if life < 0.2 { life / 0.2 } else { 1.0 };
        Mat4::from_scale_rotation_translation(self.scale[i] * fade, rotation, position)
    }

    /// World transform: the local one composed with every ancestor's (a scene graph).
    pub(super) fn world_matrix(&self, i: usize, alpha: f32) -> Mat4 {
        let mut m = self.local_matrix(i, alpha);
        let mut parent = self.parent[i];
        for _ in 0..MAX_DEPTH {
            let Some(p) = self.dense(Entity(parent)) else { break };
            m = self.local_matrix(p, alpha) * m;
            parent = self.parent[p];
        }
        m
    }

    /// The nearest pickable, visible entity along a ray (as last drawn), tested against each
    /// entity's bounding box. Fills the scratch buffer with `[distance, px, py, pz]`.
    pub fn pick(&mut self, origin: Vec3, direction: Vec3) -> Option<Entity> {
        let dir = direction.try_normalize().filter(|_| origin.is_finite())?;
        let mut best: Option<(f32, usize)> = None;
        for i in 0..self.len() {
            if !self.pickable[i] || self.mesh[i] == shapes::NONE {
                continue;
            }
            let inverse = self.world_matrix(i, self.alpha).inverse();
            if !inverse.is_finite() {
                continue; // scaled to zero
            }
            // The ray in the entity's own space: same parameter t, box centered at the origin.
            let (o, d) = (inverse.transform_point3(origin), inverse.transform_vector3(dir));
            let half = shapes::half_extents(self.mesh[i]).max(Vec3::splat(0.001));
            if let Some(t) = ray_box(o, d, half)
                && best.is_none_or(|(b, _)| t < b)
            {
                best = Some((t, i));
            }
        }
        let (t, i) = best?;
        let point = origin + dir * t;
        self.scratch[..4].copy_from_slice(&[t, point.x, point.y, point.z]);
        Some(self.entity_at(i))
    }

    // ── Camera math ──────────────────────────────────────────────────────

    /// Stores the view-projection matrix and view size (called after each rendered frame).
    pub fn set_view(&mut self, view_proj: &[f32; 16], width: f32, height: f32) {
        self.view_proj = *view_proj;
        self.view_proj_inverse_valid = false;
        self.view_width = width;
        self.view_height = height;
    }

    /// Returns a pointer to the stored viewProj (16 floats) so JS can read it.
    pub fn view_proj(&self) -> &[f32; 16] {
        &self.view_proj
    }

    /// Ensures the inverse is computed and returns it.
    fn ensure_inverse(&mut self) -> &[f32; 16] {
        if !self.view_proj_inverse_valid {
            let m = Mat4::from_cols_array(&self.view_proj);
            self.view_proj_inverse = m.inverse().to_cols_array();
            self.view_proj_inverse_valid = true;
        }
        &self.view_proj_inverse
    }

    /// World-space ray [origin xyz, direction xyz] through a view point (in points from top-left).
    /// Returns false if no view has been set.
    fn screen_ray_impl(&mut self, x: f32, y: f32) -> Option<(Vec3, Vec3)> {
        if self.view_width <= 0.0 || self.view_height <= 0.0 {
            return None;
        }
        let inv = Mat4::from_cols_array(self.ensure_inverse());
        let nx = (x / self.view_width) * 2.0 - 1.0;
        let ny = 1.0 - (y / self.view_height) * 2.0;
        let near = inv * Vec4::new(nx, ny, 0.0, 1.0);
        let far = inv * Vec4::new(nx, ny, 1.0, 1.0);
        if near.w.abs() < 1e-12 || far.w.abs() < 1e-12 {
            return None;
        }
        let o = Vec3::new(near.x / near.w, near.y / near.w, near.z / near.w);
        let f = Vec3::new(far.x / far.w, far.y / far.w, far.z / far.w);
        Some((o, f - o))
    }

    /// Writes the screen ray [origin xyz, direction xyz] into scratch[0..6]. Returns false if no view.
    pub fn screen_ray(&mut self, x: f32, y: f32) -> bool {
        if let Some((o, d)) = self.screen_ray_impl(x, y) {
            self.scratch[0..3].copy_from_slice(&o.to_array());
            self.scratch[3..6].copy_from_slice(&d.to_array());
            true
        } else {
            false
        }
    }

    /// Where a view point lands on a plane (defined by a point and normal), in world space.
    /// Writes the result into scratch[0..3]. Returns false if no view, behind camera, or edge-on.
    pub fn screen_to_world(&mut self, x: f32, y: f32, plane_point: Vec3, plane_normal: Vec3) -> bool {
        let Some((origin, direction)) = self.screen_ray_impl(x, y) else {
            return false;
        };
        let facing = direction.dot(plane_normal);
        if facing.abs() < 1e-9 {
            return false;
        }
        let t = (plane_point - origin).dot(plane_normal) / facing;
        if t < 0.0 {
            return false;
        }
        let point = origin + direction * t;
        self.scratch[0..3].copy_from_slice(&point.to_array());
        true
    }

    /// Where a world position appears on screen (points from the view's top-left).
    /// Writes the result into scratch[0..2]. Returns false if behind the camera or no view.
    pub fn to_screen(&mut self, position: Vec3) -> bool {
        if self.view_width <= 0.0 || self.view_height <= 0.0 {
            return false;
        }
        let m = Mat4::from_cols_array(&self.view_proj);
        let p = Vec4::new(position.x, position.y, position.z, 1.0);
        let clip = m * p;
        if clip.w <= 0.0 {
            return false;
        }
        let px = clip.x / clip.w;
        let py = clip.y / clip.w;
        self.scratch[0] = ((px + 1.0) / 2.0) * self.view_width;
        self.scratch[1] = ((1.0 - py) / 2.0) * self.view_height;
        true
    }

    /// Like `pick`, but takes a screen point (in points) instead of a world ray.
    /// The ray is unprojected from the view internally. Returns the hit entity or None.
    /// scratch[0..4] = distance, point xyz.
    pub fn pick_screen(&mut self, x: f32, y: f32) -> Option<Entity> {
        let (origin, direction) = self.screen_ray_impl(x, y)?;
        self.pick(origin, direction)
    }
}

/// Ancestors' world matrices for the frame being written, by dense index (kept to reuse the memory).
#[derive(Default)]
pub(super) struct WorldCache {
    matrices: Vec<Mat4>,
    done: Vec<bool>,
}

/// Distance along the ray to an axis-aligned box `[-half, half]` (slab test), if it's hit ahead.
fn ray_box(origin: Vec3, dir: Vec3, half: Vec3) -> Option<f32> {
    let (mut near, mut far) = (f32::NEG_INFINITY, f32::INFINITY);
    for axis in 0..3 {
        let (o, d, h) = (origin[axis], dir[axis], half[axis]);
        if d.abs() < 1e-12 {
            if o.abs() > h {
                return None;
            }
            continue;
        }
        let (a, b) = ((-h - o) / d, (h - o) / d);
        near = near.max(a.min(b));
        far = far.min(a.max(b));
    }
    (near <= far && far >= 0.0).then_some(near.max(0.0))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A simple orthographic-like view-projection matrix looking down -Z.
    fn ortho_vp() -> [f32; 16] {
        // Maps [-1,1]^3 to clip space directly (identity-ish, but Z is reversed for depth).
        Mat4::IDENTITY.to_cols_array()
    }

    #[test]
    fn screen_ray_unprojects_center() {
        let mut w = World::new(4);
        w.set_view(&ortho_vp(), 100.0, 100.0);
        assert!(w.screen_ray(50.0, 50.0), "center should succeed");
        let s = w.scratch();
        // Center of the screen → NDC (0,0), unproject with identity → origin at (0,0,-1) near, direction toward (0,0,1) far
        // With identity inverse, near = (0,0,0)/1 = (0,0,0), far = (0,0,1)/1 = (0,0,1), direction = (0,0,1)
        assert!((s[0]).abs() < 1e-5, "origin x ~ 0: {}", s[0]);
        assert!((s[1]).abs() < 1e-5, "origin y ~ 0: {}", s[1]);
    }

    #[test]
    fn to_screen_projects_origin() {
        let mut w = World::new(4);
        w.set_view(&ortho_vp(), 200.0, 100.0);
        assert!(w.to_screen(Vec3::ZERO), "origin should project");
        let s = w.scratch();
        // NDC (0,0) → screen center
        assert!((s[0] - 100.0).abs() < 1e-3, "screen x ~ 100: {}", s[0]);
        assert!((s[1] - 50.0).abs() < 1e-3, "screen y ~ 50: {}", s[1]);
    }

    #[test]
    fn screen_to_world_hits_plane() {
        let mut w = World::new(4);
        w.set_view(&ortho_vp(), 100.0, 100.0);
        // With identity VP, screen center → ray origin (0,0,0), direction (0,0,1).
        // Use a Z-facing plane at z=0.5; the ray should hit it at (0,0,0.5).
        let hit = w.screen_to_world(50.0, 50.0, Vec3::new(0.0, 0.0, 0.5), Vec3::Z);
        assert!(hit, "should hit the Z plane");
        let s = w.scratch();
        assert!((s[0]).abs() < 1e-5, "x ~ 0: {}", s[0]);
        assert!((s[1]).abs() < 1e-5, "y ~ 0: {}", s[1]);
        assert!((s[2] - 0.5).abs() < 1e-5, "z ~ 0.5: {}", s[2]);
    }

    #[test]
    fn no_view_returns_false() {
        let mut w = World::new(4);
        assert!(!w.screen_ray(50.0, 50.0));
        assert!(!w.to_screen(Vec3::ZERO));
        assert!(!w.screen_to_world(50.0, 50.0, Vec3::ZERO, Vec3::Y));
        assert!(w.pick_screen(50.0, 50.0).is_none());
    }

    #[test]
    fn pick_screen_finds_entity() {
        let mut w = World::new(8);
        w.set_view(&ortho_vp(), 100.0, 100.0);
        w.spawn(shapes::CUBE, Vec3::new(0.0, 0.0, 0.5), Vec3::ONE, [1.0; 4]).unwrap();
        w.update(1.0 / 60.0);
        // Screen center should hit the cube at z=0.5.
        let hit = w.pick_screen(50.0, 50.0);
        assert!(hit.is_some(), "should hit the cube");
    }

    #[test]
    fn mesh_ids_past_255_are_drawn() {
        let ids: Vec<MeshId> = (0..300).map(|_| crate::assets::model::alias(shapes::CUBE).unwrap()).collect();
        let (low, high) = (ids[0], *ids.last().unwrap());
        assert!(high > 255, "300 more ids reach past a byte");
        assert!(crate::assets::model::mesh_count() > high as usize);
        let mut w = World::new(8);
        w.spawn(high, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
        w.spawn(low, Vec3::ZERO, Vec3::ONE, [1.0, 1.0, 1.0, 0.5]).unwrap();
        w.spawn(shapes::CUBE, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
        w.update(1.0 / 60.0);
        let r = w.ranges();
        assert_eq!(r[high as usize * 2 + 1], 1, "the opaque wide id has its range");
        assert_eq!(r[(MAX_MESHES + low as usize) * 2 + 1], 1, "and a see-through one, in the second half");
        let packed: u32 = r.chunks(2).map(|p| p[1]).sum();
        assert_eq!(packed, 3);
        // Ranges are contiguous and don't overlap: each starts where the last one drawn ended
        let mut starts: Vec<(u32, u32)> = r.chunks(2).filter(|p| p[1] > 0).map(|p| (p[0], p[1])).collect();
        starts.sort();
        assert_eq!(starts.iter().map(|p| p.0).collect::<Vec<_>>(), vec![0, 1, 2]);
    }

    #[test]
    fn hidden_instances_are_not_packed() {
        let mut w = World::new(8);
        let root = w.spawn(shapes::NONE, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
        let shade = w.spawn(shapes::CUBE, Vec3::ZERO, Vec3::ONE, [0.0, 0.0, 0.0, 0.0]).unwrap();
        w.spawn(shapes::CUBE, Vec3::new(1.0, 2.0, 3.0), Vec3::ONE, [1.0; 4]).unwrap();
        w.set_parent(shade, Some(root));
        w.update(1.0 / 60.0);
        let r = w.ranges();
        let packed: u32 = r.chunks(2).map(|p| p[1]).sum();
        assert_eq!(packed, 1, "only the visible cube");
        let cube = shapes::CUBE as usize;
        assert_eq!((r[cube * 2], r[cube * 2 + 1]), (0, 1));
        assert_eq!(r[(MAX_MESHES + cube) * 2 + 1], 0, "the clear shade isn't drawn");
        assert_eq!(&w.out_matrices[12..15], &[1.0, 2.0, 3.0]);
        w.set_color(shade, [0.0, 0.0, 0.0, 0.5]);
        w.update(1.0 / 60.0);
        assert_eq!(w.ranges()[(MAX_MESHES + cube) * 2 + 1], 1, "visible again once it has alpha");
    }

    #[test]
    fn zero_scale_is_skipped_but_flat_meshes_and_reappearing_entities_are_kept() {
        let mut w = World::new(8);
        let hidden = w.spawn(shapes::SPHERE, Vec3::ZERO, Vec3::ZERO, [1.0; 4]).unwrap();
        w.spawn(shapes::CUBE, Vec3::ZERO, Vec3::new(1.0, 1.0, 0.0), [1.0; 4]).unwrap();
        w.update(0.0);
        let packed = |w: &World| w.ranges().chunks_exact(2).map(|r| r[1]).sum::<u32>();
        assert_eq!(packed(&w), 1);
        w.set_scale(hidden, Vec3::ONE);
        w.update(0.0);
        assert_eq!(packed(&w), 2);
        w.set_scale(hidden, Vec3::ZERO);
        w.update(0.0);
        assert_eq!(packed(&w), 1);
    }
}
