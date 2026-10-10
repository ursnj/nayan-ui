//! Simulation core: owns entity state and produces the instance buffers the renderer uploads
//! once per frame. See `include/engine_core.h` for the C interface.

pub mod ffi;
mod world;

pub use world::{Entity, MAX_EVENT_PAIRS, MAX_MESHES, NO_ENTITY, World};
