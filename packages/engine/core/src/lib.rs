//! Engine core: entity state, Rapier physics, a realtime audio mixer and haptics, and the instance
//! buffers the renderer uploads once per frame. See `include/engine_core.h` for the C interface.

pub mod audio;
pub mod ffi;
pub mod haptics;
mod world;

pub use rapier3d::glamx::{Quat, Vec3};
pub use world::{
    BodyKind, EVENT_SENSOR, EVENT_STARTED, EVENT_STRIDE, Entity, FIXED_DT, ImpactFeedback, MAX_EVENTS, MAX_MESHES,
    NO_ENTITY, PhysicsDesc, Shape, World,
};
