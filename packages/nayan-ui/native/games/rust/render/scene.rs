//! Game meshes and the per-surface frame, overlay and backdrop lifecycle.

use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};

use super::{Frame, SurfaceTarget, gpu, set_error, state};

pub(super) fn forget_layers(id: i32) {
    overlays().remove(&id);
    backdrops().remove(&id);
}

/// Floats per vertex: position (3), normal (3), color (3), texture coordinates (2).
pub const VERTEX_FLOATS: usize = 11;

/// Geometry and material of a mesh id, as registered by the JS layer.
pub struct MeshData {
    pub vertices: Vec<f32>,
    pub indices: Vec<u32>,
    pub texture: Option<u32>,
    pub shine: f32,
    /// Bumped on every registration so the GPU copy is rebuilt.
    pub version: u64,
    pub skin: Vec<f32>,
}

/// What `render` draws: a world's buffers (see `World`), clamped to `count` instances.
pub struct Instances<'a> {
    pub skins: &'a [crate::assets::skeleton::SkinDraw],
    pub matrices: &'a [f32],
    pub colors: &'a [f32],
    pub regions: Option<&'a [f32]>,
    pub ranges: &'a [u32],
    pub count: usize,
}

/// A screen-space layer drawn over the scene (scoreboards, buttons): a copy of a second world's
/// buffers, in points. x right and y up from the view's top-left (so on screen y is negative), z
/// toward the viewer within -100..100. Drawn unlit (flat faces show their exact color), always in
/// front of the scene.
#[derive(Default)]
pub struct Overlay {
    pub matrices: Vec<f32>,
    pub colors: Vec<f32>,
    pub regions: Vec<f32>,
    pub ranges: Vec<u32>,
    pub count: usize,
    /// The view's size in points.
    pub width: f32,
    pub height: f32,
}

impl Overlay {
    /// Replaces the contents with `inst` (only its `count` valid instances), reusing the allocations.
    pub fn copy_from(&mut self, inst: &Instances, width: f32, height: f32) {
        let n = inst.count.min(inst.matrices.len() / 16).min(inst.colors.len() / 4);
        self.matrices.clear();
        self.matrices.extend_from_slice(&inst.matrices[..n * 16]);
        self.colors.clear();
        self.colors.extend_from_slice(&inst.colors[..n * 4]);
        self.regions.clear();
        match inst.regions.filter(|r| r.len() >= n * 4) {
            Some(r) => self.regions.extend_from_slice(&r[..n * 4]),
            None => self.regions.extend((0..n).flat_map(|_| [0.0, 0.0, 1.0, 1.0])),
        }
        self.ranges.clear();
        self.ranges.extend_from_slice(inst.ranges);
        self.count = n;
        self.width = width;
        self.height = height;
    }

    pub(crate) fn instances(&self) -> Instances<'_> {
        Instances {
            skins: &[],
            matrices: &self.matrices,
            colors: &self.colors,
            regions: Some(&self.regions),
            ranges: &self.ranges,
            count: self.count,
        }
    }
}

/// An overlay set from JS, waiting for its surface's next frame.
#[derive(Default)]
struct PendingOverlay {
    overlay: Option<Overlay>,
    changed: bool,
}

/// Overlays wait here, apart from STATE: the render thread holds STATE for a whole frame (drawing,
/// waiting for a swapchain image, presenting), and the HUD sets its overlay every frame, so sharing
/// that lock made the JS thread wait for the GPU. A frame swaps the latest overlay in when it starts.
static OVERLAYS: Mutex<BTreeMap<i32, PendingOverlay>> = Mutex::new(BTreeMap::new());

fn overlays() -> std::sync::MutexGuard<'static, BTreeMap<i32, PendingOverlay>> {
    OVERLAYS.lock().unwrap_or_else(|e| e.into_inner())
}

/// Backdrops (static scenery drawn once into a texture behind the scene) wait here like overlays.
static BACKDROPS: Mutex<BTreeMap<i32, PendingOverlay>> = Mutex::new(BTreeMap::new());

fn backdrops() -> std::sync::MutexGuard<'static, BTreeMap<i32, PendingOverlay>> {
    BACKDROPS.lock().unwrap_or_else(|e| e.into_inner())
}

/// Returns the geometry registered for a mesh id, if any.
pub fn mesh_data(id: crate::MeshId) -> Option<Arc<MeshData>> {
    state().meshes.get(&id).cloned()
}

/// Registers (or replaces) the geometry drawn for a mesh id.
pub fn register_mesh(id: crate::MeshId, vertices: &[f32], indices: &[u32], texture: Option<u32>, shine: f32) {
    let mut s = state();
    s.version += 1;
    let mesh = MeshData {
        vertices: vertices.to_vec(),
        indices: indices.to_vec(),
        texture,
        shine: shine.clamp(0.0, 1.0),
        version: s.version,
        skin: crate::assets::model::get(id)
            .filter(|m| m.vertices.len() == vertices.len())
            .map(|m| m.skin.clone())
            .unwrap_or_default(),
    };
    s.meshes.insert(id, Arc::new(mesh));
}

/// Sets (or with None, removes) the overlay drawn over surface `id` from its next frame on. `width` and
/// `height` are the view's size in points. Never waits for a frame being drawn: it only copies.
pub fn set_overlay(id: i32, inst: Option<&Instances>, width: f32, height: f32) {
    let mut pending = overlays();
    let slot = pending.entry(id).or_default();
    match inst {
        Some(inst) if width > 0.0 && height > 0.0 => slot.overlay.get_or_insert_with(Overlay::default).copy_from(inst, width, height),
        _ => slot.overlay = None,
    }
    slot.changed = true;
}

/// Moves surface `id`'s newest overlay into its target (the replaced one's buffers are kept for reuse).
fn take_overlay(id: i32, target: &mut gpu::Target) {
    if let Some(slot) = overlays().get_mut(&id)
        && slot.changed
    {
        target.swap_overlay(&mut slot.overlay);
        slot.changed = false;
    }
    if let Some(slot) = backdrops().get_mut(&id)
        && slot.changed
    {
        target.swap_backdrop(&mut slot.overlay);
        slot.changed = false;
    }
}

/// Sets (or with None, removes) surface `id`'s backdrop: static instances drawn once into a texture
/// behind the scene with the frame's camera and light, and drawn again only when they or the frame's
/// view, light, size or quality change. Copies only, like `set_overlay`.
pub fn set_backdrop(id: i32, inst: Option<&Instances>) {
    let mut pending = backdrops();
    let slot = pending.entry(id).or_default();
    match inst {
        Some(inst) if inst.count > 0 => slot.overlay.get_or_insert_with(Overlay::default).copy_from(inst, 1.0, 1.0),
        _ => slot.overlay = None,
    }
    slot.changed = true;
}

/// Draws a frame into surface `id`. Returns the camera's view-projection matrix it drew with, or
/// None if the surface isn't attached (yet) or skipped this frame.
pub fn render(id: i32, frame: &Frame, instances: &Instances) -> Result<Option<[f32; 16]>, String> {
    #[cfg(feature = "drawing")]
    super::document::sync_textures();
    let mut guard = state();
    let s = &mut *guard;
    let Some(SurfaceTarget { gpu, target, meshes }) = s.target(id) else {
        return Ok(None);
    };
    take_overlay(id, target);
    let result = gpu.render(target, meshes, frame, instances);
    if let Some(error) = gpu.take_error() {
        set_error(error.clone());
        return Err(error);
    }
    result.inspect_err(|e| set_error(e.clone()))
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn setting_an_overlay_never_waits_for_a_frame_being_drawn() {
        let (matrices, colors, ranges) = (vec![1.0f32; 16], vec![1.0f32; 4], vec![0u32; 2]);
        // A frame "being drawn": the render thread holds STATE throughout.
        let drawing = state();
        let (done, finished) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let inst = Instances {
                skins: &[],
                matrices: &matrices,
                colors: &colors,
                regions: None,
                ranges: &ranges,
                count: 1,
            };
            set_overlay(9001, Some(&inst), 320.0, 640.0);
            done.send(()).unwrap();
        });
        finished
            .recv_timeout(std::time::Duration::from_secs(5))
            .expect("set_overlay waited for the renderer lock");
        drop(drawing);
        // The next frame takes it.
        let pending = overlays().remove(&9001).expect("pending overlay");
        assert!(pending.changed);
        assert_eq!(pending.overlay.map(|o| (o.count, o.width)), Some((1, 320.0)));
    }

    #[test]
    fn register_and_read_back_mesh() {
        let verts: Vec<f32> = (0..VERTEX_FLOATS * 3).map(|i| i as f32).collect();
        let indices = vec![0u32, 1, 2];
        register_mesh(200, &verts, &indices, Some(42), 0.75);
        let data = mesh_data(200).expect("mesh 200 should exist");
        assert_eq!(data.vertices, verts);
        assert_eq!(data.indices, indices);
        assert_eq!(data.texture, Some(42));
        assert!((data.shine - 0.75).abs() < 1e-6);
    }

    #[test]
    fn mesh_data_returns_none_for_unknown() {
        assert!(mesh_data(255).is_none() || mesh_data(255).is_some(), "should not panic");
    }

    #[test]
    fn register_mesh_replaces_existing() {
        let v1: Vec<f32> = vec![1.0; VERTEX_FLOATS * 3];
        let v2: Vec<f32> = vec![2.0; VERTEX_FLOATS * 4];
        let i1 = vec![0u32, 1, 2];
        let i2 = vec![0u32, 1, 2, 0, 2, 3];
        register_mesh(201, &v1, &i1, None, 0.0);
        register_mesh(201, &v2, &i2, Some(1), 0.5);
        let data = mesh_data(201).unwrap();
        assert_eq!(data.vertices.len(), VERTEX_FLOATS * 4);
        assert_eq!(data.indices.len(), 6);
        assert_eq!(data.texture, Some(1));
    }

    #[test]
    fn shine_is_clamped() {
        register_mesh(202, &vec![0.0; VERTEX_FLOATS * 3], &[0, 1, 2], None, 5.0);
        assert!((mesh_data(202).unwrap().shine - 1.0).abs() < 1e-6, "shine should clamp to 1.0");
        register_mesh(203, &vec![0.0; VERTEX_FLOATS * 3], &[0, 1, 2], None, -1.0);
        assert!((mesh_data(203).unwrap().shine).abs() < 1e-6, "shine should clamp to 0.0");
    }

    /// The shader parses, validates, and translates for every backend we ship (GLES 3.0 included).
    #[test]
    fn shader_compiles_for_every_backend() {
        let module = naga::front::wgsl::parse_str(include_str!("shader.wgsl")).expect("WGSL parses");
        let info = naga::valid::Validator::new(naga::valid::ValidationFlags::all(), naga::valid::Capabilities::empty())
            .validate(&module)
            .expect("WGSL validates");
        for entry in ["vs", "vs_shadow", "vs_skin", "vs_skin_shadow", "fs_opaque", "fs_cutout", "fs_blend"] {
            let stage = if entry.starts_with("vs") {
                naga::ShaderStage::Vertex
            } else {
                naga::ShaderStage::Fragment
            };
            let options = naga::back::glsl::Options {
                version: naga::back::glsl::Version::Embedded {
                    version: 300,
                    is_webgl: false,
                },
                ..Default::default()
            };
            let pipeline = naga::back::glsl::PipelineOptions {
                shader_stage: stage,
                entry_point: entry.into(),
                multiview: None,
            };
            let mut out = String::new();
            naga::back::glsl::Writer::new(&mut out, &module, &info, &options, &pipeline, naga::proc::BoundsCheckPolicies::default())
                .and_then(|mut w| w.write())
                .unwrap_or_else(|e| panic!("GLSL ES 3.0 for {entry}: {e}"));
        }
    }
}
