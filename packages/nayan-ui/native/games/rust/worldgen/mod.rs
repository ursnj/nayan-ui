//! Data-driven procedural worlds for any game: field graphs describe terrain, materials, walkable
//! ground and placement rules; the core builds the terrain meshes, scatters and indexes scenery,
//! floods reachable ground, picks spaced spots and answers walker queries, on any thread.
//!
//! - `math.rs`    deterministic transcendental functions (same world on every platform)
//! - `rng.rs`     Mulberry32 seeded streams
//! - `field.rs`   field graphs and their evaluation
//! - `terrain.rs` heightfield meshing with contour-split materials and exact ground sampling
//! - `mesh.rs`    parametric surfaces and seeded cards (procedural models)
//! - `solids.rs`  walker collision prisms, convex hull templates and their spatial grid
//! - `world.rs`   recipes, generation steps and queries (ground, walkable, move, sight)
//! - `store.rs`   saved worlds, tied to their recipe

// `!(a > b)` deliberately treats NaN parameters as invalid.
#![allow(clippy::neg_cmp_op_on_partial_ord)]

pub mod field;
pub mod math;
pub mod mesh;
pub mod paint;
pub mod rng;
pub mod solids;
pub mod store;
pub mod sweep;
pub mod terrain;
pub mod world;

use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use world::{World, WorldSpec};

type Shared = Arc<RwLock<World>>;

static WORLDS: Mutex<Option<HashMap<u32, Shared>>> = Mutex::new(None);
static NEXT: AtomicU32 = AtomicU32::new(1);
static ERROR: Mutex<String> = Mutex::new(String::new());

pub(crate) fn set_error(error: String) {
    *ERROR.lock().unwrap_or_else(|e| e.into_inner()) = error;
}

pub fn last_error() -> String {
    ERROR.lock().unwrap_or_else(|e| e.into_inner()).clone()
}

fn kept_marker(key: &str) -> String {
    format!("{key}#kept")
}

/// Builds a world from `recipe` (JSON). With a `key`, a world saved under it from the same recipe is
/// restored instead of generated, and a generated one is saved there. Returns its handle (0 on error;
/// see `last_error`).
pub fn build(recipe: &str, key: &str, prepare_terrain: bool) -> u32 {
    match build_world(recipe, key, prepare_terrain) {
        Ok(world) => {
            let handle = NEXT.fetch_add(1, Ordering::Relaxed).max(1);
            WORLDS
                .lock()
                .unwrap_or_else(|e| e.into_inner())
                .get_or_insert_with(HashMap::new)
                .insert(handle, Arc::new(RwLock::new(world)));
            handle
        }
        Err(error) => {
            set_error(error);
            0
        }
    }
}

fn build_world(recipe: &str, key: &str, prepare_terrain: bool) -> Result<World, String> {
    if recipe.len() > 64 * 1024 * 1024 {
        return Err("world recipe is too large".into());
    }
    let spec: WorldSpec = serde_json::from_str(recipe).map_err(|e| format!("world recipe: {e}"))?;
    let mut world = World::new(spec)?;
    let saved = (!key.is_empty())
        .then(|| crate::assets::cache::read(key))
        .flatten()
        .and_then(|bytes| store::decode(&bytes, recipe).ok());
    match saved {
        Some(generated) => world.adopt(generated),
        None => {
            world.generate()?;
            if !key.is_empty() {
                // Storage failures only cost the next visit a regeneration.
                if crate::assets::cache::write(key, &store::encode(recipe, &world.generated)).is_ok() {
                    let _ = crate::assets::cache::write(&kept_marker(key), b"1");
                }
            }
        }
    }
    if prepare_terrain {
        world.prepare_terrain();
    }
    Ok(world)
}

/// Whether a world has been saved under `key` (cheap: reads a marker, not the world).
pub fn kept(key: &str) -> bool {
    !key.is_empty() && crate::assets::cache::read(&kept_marker(key)).is_some()
}

fn get(handle: u32) -> Option<Shared> {
    WORLDS.lock().unwrap_or_else(|e| e.into_inner()).as_ref()?.get(&handle).cloned()
}

/// Runs `f` with a world (read access), or returns None for an unknown handle.
pub fn with<R>(handle: u32, f: impl FnOnce(&World) -> R) -> Option<R> {
    let world = get(handle)?;
    let guard = world.read().unwrap_or_else(|e| e.into_inner());
    Some(f(&guard))
}

pub fn with_mut<R>(handle: u32, f: impl FnOnce(&mut World) -> R) -> Option<R> {
    let world = get(handle)?;
    let mut guard = world.write().unwrap_or_else(|e| e.into_inner());
    Some(f(&mut guard))
}

pub fn free(handle: u32) {
    if let Some(worlds) = WORLDS.lock().unwrap_or_else(|e| e.into_inner()).as_mut() {
        worlds.remove(&handle);
    }
}

/// Spawn, whether it was restored, layer sizes and the picked spots, as JSON.
pub fn info(world: &World) -> String {
    let g = &world.generated;
    let layers: serde_json::Map<String, serde_json::Value> = g
        .layers
        .iter()
        .map(|l| {
            (
                l.name.clone(),
                serde_json::json!({"stride": l.stride, "count": l.data.len() / l.stride.max(1) as usize}),
            )
        })
        .collect();
    let picks: serde_json::Map<String, serde_json::Value> = g.picks.iter().map(|(name, points)| (name.clone(), serde_json::json!(points))).collect();
    serde_json::json!({
        "spawn": g.spawn,
        "restored": world.restored,
        "layers": layers,
        "picks": picks,
        "reachable": g.reachable.len(),
        "materials": world.materials(),
    })
    .to_string()
}

#[cfg(test)]
mod tests;
