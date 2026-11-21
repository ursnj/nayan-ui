//! Prepared geometry is keyed, normalized, optimized, restored and registered entirely in Rust.
use super::{
    cache, geometry, model,
    modelling::{self, Geometry},
    shape,
};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{collections::HashMap, sync::Mutex};

#[derive(Deserialize)]
#[serde(default, deny_unknown_fields)]
struct Options {
    center: bool,
    fit: f32,
    shine: f32,
    optimize: Option<Optimization>,
}
impl Default for Options {
    fn default() -> Self {
        Self {
            center: true,
            fit: 0.0,
            shine: 0.0,
            optimize: None,
        }
    }
}
#[derive(Deserialize)]
#[serde(default, deny_unknown_fields, rename_all = "camelCase")]
struct Optimization {
    ratio: f32,
    error: f32,
    lock_borders: bool,
}
impl Default for Optimization {
    fn default() -> Self {
        Self {
            ratio: 1.0,
            error: 0.001,
            lock_borders: true,
        }
    }
}
#[derive(Default)]
struct Registered {
    models: HashMap<String, crate::MeshId>,
    materials: HashMap<(crate::MeshId, u32), crate::MeshId>,
}
static REGISTERED: Mutex<Option<Registered>> = Mutex::new(None);

fn pack(g: &Geometry) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(8 + (g.vertices.len() + g.indices.len()) * 4);
    bytes.extend_from_slice(&(g.vertices.len() as u32).to_le_bytes());
    bytes.extend_from_slice(&(g.indices.len() as u32).to_le_bytes());
    for value in &g.vertices {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    for value in &g.indices {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    bytes
}
fn unpack(bytes: &[u8]) -> Option<Geometry> {
    if bytes.len() < 8 {
        return None;
    }
    let floats = u32::from_le_bytes(bytes[..4].try_into().ok()?) as usize;
    let count = u32::from_le_bytes(bytes[4..8].try_into().ok()?) as usize;
    let end = 8usize.checked_add(floats.checked_add(count)?.checked_mul(4)?)?;
    if end != bytes.len() || floats == 0 || floats % 11 != 0 || count == 0 || count % 3 != 0 {
        return None;
    }
    let vertices: Vec<f32> = bytes[8..8 + floats * 4]
        .chunks_exact(4)
        .map(|v| f32::from_le_bytes(v.try_into().unwrap()))
        .collect();
    let indices: Vec<u32> = bytes[8 + floats * 4..]
        .chunks_exact(4)
        .map(|v| u32::from_le_bytes(v.try_into().unwrap()))
        .collect();
    if vertices.iter().any(|v| !v.is_finite()) || indices.iter().any(|&i| i as usize >= floats / 11) {
        return None;
    }
    Some(Geometry { vertices, indices })
}
fn canonical(bytes: &[u8]) -> Result<Vec<u8>, String> {
    serde_json::to_vec(&serde_json::from_slice::<serde_json::Value>(bytes).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}
fn prepare(mut g: Geometry, options: &Options) -> Result<Geometry, String> {
    if let Some(opt) = &options.optimize {
        g = geometry::optimize(&g.vertices, &g.indices, opt.ratio, opt.error, opt.lock_borders)?;
    }
    if g.vertices.is_empty() || !g.vertices.len().is_multiple_of(11) {
        return Err("empty or invalid geometry".into());
    }
    let mut lo = [f32::INFINITY; 3];
    let mut hi = [f32::NEG_INFINITY; 3];
    for vertex in g.vertices.chunks_exact(11) {
        for k in 0..3 {
            lo[k] = lo[k].min(vertex[k]);
            hi[k] = hi[k].max(vertex[k]);
        }
    }
    let largest = (hi[0] - lo[0]).max(hi[1] - lo[1]).max(hi[2] - lo[2]);
    let scale = if options.fit > 0.0 && largest > 0.0 {
        options.fit / largest
    } else {
        1.0
    };
    for vertex in g.vertices.chunks_exact_mut(11) {
        for k in 0..3 {
            vertex[k] = (vertex[k] - if options.center { (lo[k] + hi[k]) / 2.0 } else { 0.0 }) * scale;
        }
    }
    Ok(g)
}
fn get(key: String, options: &Options, build: impl FnOnce() -> Result<Geometry, String>) -> Result<crate::MeshId, String> {
    let mut registered = REGISTERED.lock().map_err(|_| "prepared mesh registry unavailable")?;
    let registered = registered.get_or_insert_with(Registered::default);
    if let Some(&id) = registered.models.get(&key) {
        return Ok(id);
    }
    let restored = cache::read(&key).and_then(|bytes| unpack(&bytes));
    let (g, built) = match restored {
        Some(g) => (g, false),
        None => (prepare(build()?, options)?, true),
    };
    let base = shape::create(&g.vertices, &g.indices)?;
    let shine = options.shine.clamp(0.0, 1.0).to_bits();
    let material = (base, shine);
    let id = if let Some(&id) = registered.materials.get(&material) {
        id
    } else {
        let existing_material_differs = crate::render::mesh_data(base).is_some_and(|mesh| mesh.shine.to_bits() != shine);
        let id = if existing_material_differs || registered.materials.keys().any(|&(mesh, _)| mesh == base) {
            model::alias(base)?
        } else {
            base
        };
        registered.materials.insert(material, id);
        id
    };
    // The renderer already lives in this core. Never round-trip generated vertices through JS.
    crate::render::register_mesh(id, &g.vertices, &g.indices, None, options.shine);
    if built {
        let _ = cache::write(&key, &pack(&g));
    } // Storage failure never prevents rendering.
    registered.models.insert(key, id);
    Ok(id)
}
/// SHA-256 of the options, the vertex count and every value's little-endian bytes. Whole slices
/// are fed at once (the same byte stream, so the same digest as hashing value by value).
fn shape_hash(options: &[u8], vertices: &[f32], indices: &[u32]) -> impl std::fmt::LowerHex {
    let mut hash = Sha256::new();
    hash.update(options);
    hash.update((vertices.len() as u64).to_le_bytes());
    #[cfg(target_endian = "little")]
    {
        // SAFETY: f32 and u32 have no padding; on little-endian targets their memory is their
        // little-endian bytes.
        hash.update(unsafe { std::slice::from_raw_parts(vertices.as_ptr().cast::<u8>(), std::mem::size_of_val(vertices)) });
        hash.update(unsafe { std::slice::from_raw_parts(indices.as_ptr().cast::<u8>(), std::mem::size_of_val(indices)) });
    }
    #[cfg(not(target_endian = "little"))]
    {
        vertices.iter().for_each(|v| hash.update(v.to_le_bytes()));
        indices.iter().for_each(|i| hash.update(i.to_le_bytes()));
    }
    hash.finalize()
}
pub fn shape(vertices: &[f32], indices: &[u32], options: &[u8]) -> Result<crate::MeshId, String> {
    let settings: Options = serde_json::from_slice(options).map_err(|e| e.to_string())?;
    let options = canonical(options)?;
    // Stream the caller's floats directly into Rust's hash, without a JS snapshot or a temporary geometry copy.
    let key = format!("prepared-shape-v1:{:x}", shape_hash(&options, vertices, indices));
    get(key, &settings, || {
        Ok(Geometry {
            vertices: vertices.to_vec(),
            indices: indices.to_vec(),
        })
    })
}
pub fn solid(recipe: &[u8], options: &[u8]) -> Result<crate::MeshId, String> {
    let settings: Options = serde_json::from_slice(options).map_err(|e| e.to_string())?;
    let key = format!("prepared-solid-v1:{}", cache::fingerprint(&[&canonical(recipe)?, &canonical(options)?]));
    get(key, &settings, || modelling::generate(recipe))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn solids_reuse_registrations_and_materials_are_independent() {
        let recipe = br#"{"solid":{"kind":"sphere","radius":0.73},"resolution":16}"#;
        let matte = solid(recipe, br#"{"shine":0,"optimize":{}}"#).unwrap();
        assert_eq!(matte, solid(recipe, br#"{"optimize":{},"shine":0}"#).unwrap());
        let rendered = crate::render::mesh_data(matte).unwrap();
        assert_eq!(rendered.shine, 0.0);
        assert_eq!(matte, solid(recipe, br#"{"shine":0,"optimize":{}}"#).unwrap());
        assert!(
            std::sync::Arc::ptr_eq(&rendered, &crate::render::mesh_data(matte).unwrap()),
            "cache hit must not upload geometry again"
        );
        let glossy = solid(recipe, br#"{"shine":0.8,"optimize":{}}"#).unwrap();
        assert_ne!(matte, glossy);
        assert_eq!(model::get(matte).unwrap().vertices, model::get(glossy).unwrap().vertices);
        assert!(solid(recipe, br#"{"optimize":{"ratio":-1}}"#).is_err());
    }
    #[test]
    fn shape_hash_matches_value_by_value_hashing() {
        let vertices: Vec<f32> = (0..1000).map(|i| i as f32 * 0.37 - 50.0).chain([f32::NAN, -0.0, f32::INFINITY]).collect();
        let indices: Vec<u32> = (0..999).rev().collect();
        let options = br#"{"shine":0.5}"#;
        let mut expected = Sha256::new();
        expected.update(options);
        expected.update((vertices.len() as u64).to_le_bytes());
        for value in &vertices {
            expected.update(value.to_le_bytes());
        }
        for value in &indices {
            expected.update(value.to_le_bytes());
        }
        let expected = format!("{:x}", expected.finalize());
        assert_eq!(format!("{:x}", shape_hash(options, &vertices, &indices)), expected);
        // Pinned: persisted cache keys depend on this digest.
        assert_eq!(
            format!("{:x}", shape_hash(b"{}", &[1.0, 2.0, 3.0], &[0, 1, 2])),
            "a80e613d3799c651290db05e3bb9f62aba713235e0c19f81afb3572cdcfd95bd"
        );
    }
    #[test]
    fn malformed_saved_geometry_is_rejected() {
        assert!(unpack(&[]).is_none());
        let bytes = pack(&Geometry {
            vertices: vec![0.0; 33],
            indices: vec![0, 1, 9],
        });
        assert!(unpack(&bytes).is_none());
    }
}
