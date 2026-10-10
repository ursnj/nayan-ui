//! Simulation core: owns entity state and Rapier physics, and produces the instance buffers the
//! renderer uploads once per frame. See `include/engine_core.h` for the C interface.

pub mod ffi;
mod world;

pub use rapier3d::glamx::{Quat, Vec3};
pub use world::{
    BodyKind, EVENT_SENSOR, EVENT_STARTED, EVENT_STRIDE, Entity, FIXED_DT, MAX_EVENTS, MAX_MESHES, NO_ENTITY,
    PhysicsDesc, Shape, World,
};
