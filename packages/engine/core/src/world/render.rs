//! Instance buffers for the renderer, interpolated between simulation steps.

use super::*;
use rapier3d::glamx::Mat4;

impl World {
    /// Writes matrices/colors bucketed by mesh so each mesh is one contiguous instance range.
    /// `alpha` in 0..1 blends from the previous step's transform to the current one.
    pub(super) fn write_outputs(&mut self, alpha: f32) {
        let n = self.len();
        let mut counts = [0u32; MAX_MESHES];
        for &m in &self.mesh {
            counts[m as usize] += 1;
        }
        let mut cursor = [0u32; MAX_MESHES];
        let mut first = 0;
        for m in 0..MAX_MESHES {
            cursor[m] = first;
            self.ranges[m * 2] = first;
            self.ranges[m * 2 + 1] = counts[m];
            first += counts[m];
        }

        for i in 0..n {
            let m = self.mesh[i] as usize;
            let k = cursor[m] as usize;
            cursor[m] += 1;
            let (mut position, mut rotation) = self.render_pose(i, alpha);
            if let Some(p) = self.dense(Entity(self.parent[i])) {
                let (parent_position, parent_rotation) = self.render_pose(p, alpha);
                position = parent_position + parent_rotation * position;
                rotation = parent_rotation * rotation;
            }
            let fade = (self.lifetime[i] / 0.2).min(1.0); // shrink away at the end of a lifetime
            let matrix = Mat4::from_scale_rotation_translation(self.scale[i] * fade, rotation, position);
            self.out_matrices[k * 16..k * 16 + 16].copy_from_slice(&matrix.to_cols_array());
            self.out_colors[k * 4..k * 4 + 4].copy_from_slice(&self.color[i]);
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
}
