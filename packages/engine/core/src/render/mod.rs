//! Renderer: draws a world's instance buffers into a native surface with wgpu. Android uses Vulkan
//! and falls back to OpenGL ES 3.0 when there's no usable Vulkan device; iOS uses Metal.
//!
//! One GPU device is shared by every surface (geometry and textures are uploaded once). Surfaces are
//! attached and detached from the UI thread and drawn from the JS thread; one lock covers both.

mod gpu;

use std::collections::BTreeMap;
use std::ffi::c_void;
use std::sync::{Arc, Mutex};

pub use gpu::Frame;

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
}

/// What `render` draws: a world's buffers (see `World`), clamped to `count` instances.
pub struct Instances<'a> {
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
        Instances { matrices: &self.matrices, colors: &self.colors, regions: Some(&self.regions), ranges: &self.ranges, count: self.count }
    }
}

/// What to draw into: an Android `ANativeWindow*` or an Apple `CAMetalLayer*`.
#[derive(Clone, Copy)]
pub struct NativeWindow(pub *mut c_void);
// SAFETY: the pointer is only handed to wgpu while the caller keeps the window alive (attach..detach).
unsafe impl Send for NativeWindow {}

struct State {
    gpu: Option<gpu::Gpu>,
    targets: BTreeMap<i32, gpu::Target>,
    meshes: BTreeMap<u8, Arc<MeshData>>,
    version: u64,
}

static STATE: Mutex<State> = Mutex::new(State { gpu: None, targets: BTreeMap::new(), meshes: BTreeMap::new(), version: 0 });
static ERROR: Mutex<String> = Mutex::new(String::new());

fn state() -> std::sync::MutexGuard<'static, State> {
    STATE.lock().unwrap_or_else(|e| e.into_inner())
}

/// Why the last render call failed (empty if it didn't).
pub fn last_error() -> String {
    ERROR.lock().map(|e| e.clone()).unwrap_or_default()
}

pub(crate) fn set_error(message: String) {
    if let Ok(mut error) = ERROR.lock() {
        *error = message;
    }
}

/// Registers (or replaces) the geometry drawn for a mesh id.
pub fn register_mesh(id: u8, vertices: &[f32], indices: &[u32], texture: Option<u32>, shine: f32) {
    let mut s = state();
    s.version += 1;
    let mesh = MeshData { vertices: vertices.to_vec(), indices: indices.to_vec(), texture, shine: shine.clamp(0.0, 1.0), version: s.version };
    s.meshes.insert(id, Arc::new(mesh));
}

/// Attaches (or resizes) surface `id`, drawing into `window` at `width` x `height` pixels.
///
/// # Safety
/// `window` must stay valid until `detach(id)` returns.
pub unsafe fn attach(id: i32, window: NativeWindow, width: u32, height: u32) -> Result<(), String> {
    let mut guard = state();
    let s = &mut *guard;
    if let Some(target) = s.targets.get_mut(&id) {
        if target.window.0 == window.0 {
            if let Some(gpu) = &s.gpu {
                target.resize(gpu, width, height);
            }
            return Ok(());
        }
        s.targets.remove(&id); // a new window: drop the old surface first
    }
    let result = match &s.gpu {
        Some(gpu) => unsafe { gpu.create_surface(window) }.map(|surface| (None, surface)),
        None => unsafe { gpu::Gpu::new(window) }.map(|(gpu, surface)| (Some(gpu), surface)),
    };
    let (new_gpu, surface) = result.inspect_err(|e| set_error(e.clone()))?;
    if let Some(gpu) = new_gpu {
        s.gpu = Some(gpu);
    }
    let gpu = s.gpu.as_ref().expect("gpu initialized above");
    let target = gpu.create_target(surface, window, width, height);
    s.targets.insert(id, target);
    Ok(())
}

/// Detaches surface `id`; after this returns its window may be released.
pub fn detach(id: i32) {
    state().targets.remove(&id);
}

/// The backend surfaces draw with ("vulkan", "gl", "metal"), or "" before the first attach.
pub fn backend() -> &'static str {
    state().gpu.as_ref().map(|g| g.backend).unwrap_or("")
}

/// Sets (or with None, removes) the overlay drawn over surface `id` from its next frame on. `width` and
/// `height` are the view's size in points.
pub fn set_overlay(id: i32, inst: Option<&Instances>, width: f32, height: f32) {
    let mut guard = state();
    let Some(target) = guard.targets.get_mut(&id) else { return };
    match inst {
        Some(inst) if width > 0.0 && height > 0.0 => target.overlay.get_or_insert_with(Overlay::default).copy_from(inst, width, height),
        _ => target.overlay = None,
    }
}

/// Draws a frame into surface `id`. Returns the camera's view-projection matrix it drew with, or
/// None if the surface isn't attached (yet) or skipped this frame.
pub fn render(id: i32, frame: &Frame, instances: &Instances) -> Result<Option<[f32; 16]>, String> {
    let mut guard = state();
    let s = &mut *guard;
    let (Some(gpu), Some(target)) = (s.gpu.as_mut(), s.targets.get_mut(&id)) else {
        return Ok(None);
    };
    let result = gpu.render(target, &s.meshes, frame, instances);
    if let Some(error) = gpu.take_error() {
        set_error(error.clone());
        return Err(error);
    }
    result.inspect_err(|e| set_error(e.clone()))
}

#[cfg(test)]
mod tests {

    /// The shader parses, validates, and translates for every backend we ship (GLES 3.0 included).
    #[test]
    fn shader_compiles_for_every_backend() {
        let module = naga::front::wgsl::parse_str(include_str!("shader.wgsl")).expect("WGSL parses");
        let info = naga::valid::Validator::new(naga::valid::ValidationFlags::all(), naga::valid::Capabilities::empty())
            .validate(&module)
            .expect("WGSL validates");
        for entry in ["vs", "vs_shadow", "fs_opaque", "fs_cutout", "fs_blend"] {
            let stage = if entry.starts_with("vs") { naga::ShaderStage::Vertex } else { naga::ShaderStage::Fragment };
            let options = naga::back::glsl::Options { version: naga::back::glsl::Version::Embedded { version: 300, is_webgl: false }, ..Default::default() };
            let pipeline = naga::back::glsl::PipelineOptions { shader_stage: stage, entry_point: entry.into(), multiview: None };
            let mut out = String::new();
            naga::back::glsl::Writer::new(&mut out, &module, &info, &options, &pipeline, naga::proc::BoundsCheckPolicies::default())
                .and_then(|mut w| w.write())
                .unwrap_or_else(|e| panic!("GLSL ES 3.0 for {entry}: {e}"));
        }
    }
}
