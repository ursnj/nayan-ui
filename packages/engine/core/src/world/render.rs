//! Instance buffers for the renderer, interpolated between simulation steps; picking.

use super::*;
use rapier3d::glamx::Mat4;

impl World {
    /// Writes matrices/colors/regions bucketed so each (opacity, mesh) pair is one contiguous
    /// instance range: every opaque mesh first, then every transparent one (alpha < 1).
    /// `alpha` in 0..1 blends from the previous step's transform to the current one.
    pub(super) fn write_outputs(&mut self, alpha: f32) {
        self.alpha = alpha;
        let n = self.len();
        let bucket = |i: usize, mesh: &[u8], color: &[[f32; 4]]| mesh[i] as usize + if color[i][3] < 1.0 { MAX_MESHES } else { 0 };
        let mut counts = [0u32; MAX_MESHES * 2];
        for i in 0..n {
            counts[bucket(i, &self.mesh, &self.color)] += 1;
        }
        let mut cursor = [0u32; MAX_MESHES * 2];
        let mut first = 0;
        for b in 0..MAX_MESHES * 2 {
            cursor[b] = first;
            self.ranges[b * 2] = first;
            self.ranges[b * 2 + 1] = counts[b];
            first += counts[b];
        }

        for i in 0..n {
            let b = bucket(i, &self.mesh, &self.color);
            let k = cursor[b] as usize;
            cursor[b] += 1;
            let matrix = self.world_matrix(i, alpha);
            self.out_matrices[k * 16..k * 16 + 16].copy_from_slice(&matrix.to_cols_array());
            self.out_colors[k * 4..k * 4 + 4].copy_from_slice(&self.color[i]);
            self.out_regions[k * 4..k * 4 + 4].copy_from_slice(&self.region[i]);
        }
    }

    /// Interpolated (and bobbing-offset) local pose used for rendering.
    pub(super) fn render_pose(&self, i: usize, alpha: f32) -> (Vec3, Quat) {
        let osc = self.oscillation[i];
        (
            self.prev_position[i].lerp(self.position[i], alpha) + osc.amplitude * osc.phase.sin(),
            self.prev_rotation[i].lerp(self.rotation[i], alpha),
        )
    }

    /// Local transform: interpolated pose and scale, shrinking over the last 0.2 s of a lifetime.
    fn local_matrix(&self, i: usize, alpha: f32) -> Mat4 {
        let (position, rotation) = self.render_pose(i, alpha);
        let fade = (self.lifetime[i] / 0.2).min(1.0);
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
