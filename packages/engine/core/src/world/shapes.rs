//! Built-in shapes: their mesh ids and sizes. The renderer generates the geometry; the core only
//! needs sizes, for default colliders and picking.

use rapier3d::glamx::Vec3;

pub const CUBE: u8 = 0;
pub const SPHERE: u8 = 1;
pub const PLANE: u8 = 2;
/// Radius 0.5, height 1, along Y.
pub const CYLINDER: u8 = 3;
/// Base radius 0.5 at y = -0.5, tip at y = 0.5.
pub const CONE: u8 = 4;
/// Radius 0.25, total height 1, along Y.
pub const CAPSULE: u8 = 5;
/// Lying flat: outer radius 0.5, tube radius 0.15.
pub const TORUS: u8 = 6;
/// A unit cube with rounded edges.
pub const ROUNDED_BOX: u8 = 7;
/// Not drawn: groups, pivots, text roots, invisible trigger zones.
pub const NONE: u8 = 15;

/// Half the bounding box of a mesh at scale 1 (following aliases; models know their own).
pub fn half_extents(mesh: u8) -> Vec3 {
    let mesh = crate::model::resolve(mesh);
    if let Some(model) = crate::model::get(mesh) {
        return model.half_extents;
    }
    match mesh {
        PLANE => Vec3::new(0.5, 0.0, 0.5),
        CAPSULE => Vec3::new(0.25, 0.5, 0.25),
        TORUS => Vec3::new(0.5, 0.15, 0.5),
        _ => Vec3::splat(0.5),
    }
}
