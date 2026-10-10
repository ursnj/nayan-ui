use glam::{Mat4, Quat, Vec3};

/// Handle to an entity. Stable for the life of the world (entities are never moved).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Entity(pub u32);

/// Entities live in structure-of-arrays storage; index == `Entity.0`.
/// `matrices` holds one column-major mat4 (16 f32) per entity, ready for a GPU storage buffer.
#[derive(Default)]
pub struct World {
    position: Vec<Vec3>,
    rotation: Vec<Quat>,
    scale: Vec<Vec3>,
    angular_velocity: Vec<Vec3>,
    dirty: Vec<bool>,
    matrices: Vec<f32>,
}

impl World {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_capacity(n: usize) -> Self {
        Self {
            position: Vec::with_capacity(n),
            rotation: Vec::with_capacity(n),
            scale: Vec::with_capacity(n),
            angular_velocity: Vec::with_capacity(n),
            dirty: Vec::with_capacity(n),
            matrices: Vec::with_capacity(n * 16),
        }
    }

    pub fn len(&self) -> usize {
        self.position.len()
    }

    pub fn is_empty(&self) -> bool {
        self.position.is_empty()
    }

    /// True if one more `spawn` will not reallocate the matrix buffer, i.e. pointers into
    /// `matrices()` stay valid.
    pub fn has_room(&self) -> bool {
        (self.len() + 1) * 16 <= self.matrices.capacity()
    }

    /// Adds an entity. Its matrix is valid immediately.
    pub fn spawn(&mut self, position: Vec3, scale: Vec3) -> Entity {
        let id = self.len() as u32;
        self.position.push(position);
        self.rotation.push(Quat::IDENTITY);
        self.scale.push(scale);
        self.angular_velocity.push(Vec3::ZERO);
        self.dirty.push(false);
        let m = Mat4::from_scale_rotation_translation(scale, Quat::IDENTITY, position);
        self.matrices.extend_from_slice(&m.to_cols_array());
        Entity(id)
    }

    pub fn set_position(&mut self, e: Entity, position: Vec3) {
        if let Some(i) = self.index(e) {
            self.position[i] = position;
            self.dirty[i] = true;
        }
    }

    /// `rotation` is a quaternion (x, y, z, w); it is normalized.
    pub fn set_rotation(&mut self, e: Entity, rotation: Quat) {
        if let Some(i) = self.index(e) {
            self.rotation[i] = rotation.normalize();
            self.dirty[i] = true;
        }
    }

    pub fn set_scale(&mut self, e: Entity, scale: Vec3) {
        if let Some(i) = self.index(e) {
            self.scale[i] = scale;
            self.dirty[i] = true;
        }
    }

    /// World-space angular velocity in radians per second (axis * speed).
    pub fn set_angular_velocity(&mut self, e: Entity, velocity: Vec3) {
        if let Some(i) = self.index(e) {
            self.angular_velocity[i] = velocity;
        }
    }

    pub fn position(&self, e: Entity) -> Option<Vec3> {
        self.index(e).map(|i| self.position[i])
    }

    /// Advances the simulation and refreshes the matrices of everything that changed.
    pub fn update(&mut self, dt: f32) {
        for i in 0..self.len() {
            let w = self.angular_velocity[i];
            if w != Vec3::ZERO {
                self.rotation[i] = (Quat::from_scaled_axis(w * dt) * self.rotation[i]).normalize();
                self.dirty[i] = true;
            }
            if self.dirty[i] {
                let m = Mat4::from_scale_rotation_translation(
                    self.scale[i],
                    self.rotation[i],
                    self.position[i],
                );
                self.matrices[i * 16..i * 16 + 16].copy_from_slice(&m.to_cols_array());
                self.dirty[i] = false;
            }
        }
    }

    /// `len() * 16` floats. The slice is invalidated by `spawn`.
    pub fn matrices(&self) -> &[f32] {
        &self.matrices
    }

    fn index(&self, e: Entity) -> Option<usize> {
        let i = e.0 as usize;
        (i < self.len()).then_some(i)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::FRAC_PI_2;

    fn close(a: f32, b: f32) -> bool {
        (a - b).abs() < 1e-5
    }

    #[test]
    fn spawn_writes_translation_and_scale() {
        let mut w = World::new();
        let e = w.spawn(Vec3::new(1.0, 2.0, 3.0), Vec3::splat(2.0));
        assert_eq!(e, Entity(0));
        let m = w.matrices();
        assert_eq!(m.len(), 16);
        assert_eq!([m[0], m[5], m[10]], [2.0, 2.0, 2.0]);
        assert_eq!([m[12], m[13], m[14], m[15]], [1.0, 2.0, 3.0, 1.0]);
    }

    #[test]
    fn spin_rotates_about_y() {
        let mut w = World::new();
        let e = w.spawn(Vec3::ZERO, Vec3::ONE);
        w.set_angular_velocity(e, Vec3::new(0.0, FRAC_PI_2, 0.0));
        w.update(1.0); // quarter turn about Y: +X axis maps to -Z
        let m = w.matrices();
        assert!(close(m[0], 0.0) && close(m[2], -1.0), "x axis: {:?}", &m[0..3]);
        assert!(close(m[8], 1.0) && close(m[10], 0.0), "z axis: {:?}", &m[8..11]);
    }

    #[test]
    fn static_entities_are_not_recomputed() {
        let mut w = World::new();
        let e = w.spawn(Vec3::ZERO, Vec3::ONE);
        w.update(1.0);
        w.set_position(e, Vec3::new(5.0, 0.0, 0.0));
        assert_eq!(w.matrices()[12], 0.0); // not applied until update
        w.update(0.0);
        assert_eq!(w.matrices()[12], 5.0);
    }

    #[test]
    fn has_room_tracks_reserved_capacity() {
        let mut w = World::with_capacity(2);
        assert!(w.has_room());
        w.spawn(Vec3::ZERO, Vec3::ONE);
        let ptr = w.matrices().as_ptr();
        assert!(w.has_room());
        w.spawn(Vec3::ZERO, Vec3::ONE);
        assert!(!w.has_room());
        assert_eq!(w.matrices().as_ptr(), ptr, "no reallocation within capacity");
    }

    #[test]
    fn invalid_handles_are_ignored() {
        let mut w = World::new();
        w.set_position(Entity(7), Vec3::ONE);
        w.set_angular_velocity(Entity(7), Vec3::ONE);
        assert_eq!(w.position(Entity(7)), None);
    }
}
