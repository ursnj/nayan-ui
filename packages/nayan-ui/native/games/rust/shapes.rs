//! Built-in shapes: their mesh ids and sizes. The renderer generates the geometry; the core only
//! needs sizes, for default colliders and picking.

use crate::MeshId;
#[cfg(feature = "games")]
use crate::Vec3;

pub const CUBE: MeshId = 0;
pub const SPHERE: MeshId = 1;
pub const PLANE: MeshId = 2;
/// Radius 0.5, height 1, along Y.
pub const CYLINDER: MeshId = 3;
/// Base radius 0.5 at y = -0.5, tip at y = 0.5.
pub const CONE: MeshId = 4;
/// Radius 0.25, total height 1, along Y.
pub const CAPSULE: MeshId = 5;
/// Lying flat: outer radius 0.5, tube radius 0.15.
pub const TORUS: MeshId = 6;
/// A unit cube with rounded edges.
pub const ROUNDED_BOX: MeshId = 7;
/// A soft sprite facing the camera (fire, smoke, dust): always drawn see-through.
pub const PUFF: MeshId = 8;
/// The same sprite, drawn additively (fire, sparks, glows): always see-through.
pub const FLAME: MeshId = 9;
/// Coarser spheres the renderer draws in place of `SPHERE` where one looks small (never spawned by
/// id): sixteen sides for up to ~26 pixels of radius, twelve for up to ~14, eight for up to ~6.
pub const SPHERE_SMALL: MeshId = 10;
pub const SPHERE_TINY: MeshId = 11;
pub const SPHERE_MEDIUM: MeshId = 12;
/// Not drawn: groups, pivots, text roots, invisible trigger zones.
pub const NONE: MeshId = 15;

/// Half the bounding box of a mesh at scale 1 (following aliases; models know their own).
#[cfg(feature = "games")]
pub fn half_extents(mesh: MeshId) -> Vec3 {
    let mesh = crate::assets::model::resolve(mesh);
    if let Some(model) = crate::assets::model::get(mesh) {
        return model.half_extents;
    }
    match mesh {
        PLANE => Vec3::new(0.5, 0.0, 0.5),
        CAPSULE => Vec3::new(0.25, 0.5, 0.25),
        TORUS => Vec3::new(0.5, 0.15, 0.5),
        _ => Vec3::splat(0.5),
    }
}
