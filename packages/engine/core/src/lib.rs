//! Simulation core: owns entity transforms and produces the model-matrix buffer
//! the renderer uploads once per frame.

pub mod ffi;
mod world;

pub use world::{Entity, World};
