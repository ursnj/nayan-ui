//! Shared wgpu device and surface lifecycle. Android uses Vulkan with an OpenGL ES fallback.
//! iOS uses Metal. Browser canvases use WebGPU or per-canvas WebGL adapters.
//!
//! One lock coordinates device and surface changes with rendering. Compatible surfaces share
//! the same device and GPU resources.

#[cfg(feature = "games")]
#[path = "../../../games/rust/render/cache.rs"]
mod cache;
#[cfg(feature = "games")]
#[path = "../../../games/rust/render/cull.rs"]
mod cull;
pub(crate) mod document;
mod gpu;
#[cfg(feature = "games")]
#[path = "../../../games/rust/render/scene.rs"]
mod scene;
#[cfg(all(feature = "games", not(target_arch = "wasm32")))]
#[path = "../../../games/rust/render/thread.rs"]
pub mod thread;

use std::collections::BTreeMap;
use std::ffi::c_void;
#[cfg(feature = "games")]
use std::sync::Arc;
#[cfg(not(target_arch = "wasm32"))]
use std::sync::Condvar;
use std::sync::Mutex;

#[cfg(feature = "games")]
pub use gpu::Frame;
#[cfg(feature = "games")]
pub use scene::{Instances, MeshData, Overlay, VERTEX_FLOATS, mesh_data, register_mesh, render, set_backdrop, set_overlay};

/// What to draw into: an Android `ANativeWindow*` or an Apple `CAMetalLayer*`.
#[derive(Clone, Copy)]
pub struct NativeWindow(pub *mut c_void);
// SAFETY: the pointer is only handed to wgpu while the caller keeps the window alive (attach..detach).
unsafe impl Send for NativeWindow {}

struct State {
    gpu: Option<gpu::Gpu>,
    // WebGL adapters belong to one canvas. Other backends keep sharing the primary device.
    #[cfg(target_arch = "wasm32")]
    canvas_gpus: BTreeMap<i32, gpu::Gpu>,
    targets: BTreeMap<i32, gpu::Target>,
    #[cfg(feature = "games")]
    meshes: BTreeMap<crate::MeshId, Arc<MeshData>>,
    #[cfg(feature = "games")]
    version: u64,
}

#[cfg(any(feature = "games", feature = "drawing", feature = "components"))]
struct SurfaceTarget<'a> {
    gpu: &'a mut gpu::Gpu,
    target: &'a mut gpu::Target,
    #[cfg(feature = "games")]
    meshes: &'a BTreeMap<crate::MeshId, Arc<MeshData>>,
}

impl State {
    #[cfg(any(feature = "games", feature = "drawing", feature = "components"))]
    fn target(&mut self, id: i32) -> Option<SurfaceTarget<'_>> {
        #[cfg(target_arch = "wasm32")]
        let gpu = self.canvas_gpus.get_mut(&id).or(self.gpu.as_mut())?;
        #[cfg(not(target_arch = "wasm32"))]
        let gpu = self.gpu.as_mut()?;
        Some(SurfaceTarget {
            gpu,
            target: self.targets.get_mut(&id)?,
            #[cfg(feature = "games")]
            meshes: &self.meshes,
        })
    }
}

static STATE: Mutex<State> = Mutex::new(State {
    gpu: None,
    #[cfg(target_arch = "wasm32")]
    canvas_gpus: BTreeMap::new(),
    targets: BTreeMap::new(),
    #[cfg(feature = "games")]
    meshes: BTreeMap::new(),
    #[cfg(feature = "games")]
    version: 0,
});
static ERROR: Mutex<String> = Mutex::new(String::new());

fn state() -> std::sync::MutexGuard<'static, State> {
    STATE.lock().unwrap_or_else(|e| e.into_inner())
}

/// The backend's name, readable without STATE (stats ask for it while a frame may be drawing).
static BACKEND: Mutex<&'static str> = Mutex::new("");

fn note_backend(gpu: &gpu::Gpu) {
    *BACKEND.lock().unwrap_or_else(|e| e.into_inner()) = gpu.backend;
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

/// Whether a warm-up is building the device, and its signal when done.
#[cfg(not(target_arch = "wasm32"))]
static WARMING: (Mutex<bool>, Condvar) = (Mutex::new(false), Condvar::new());

/// Builds the GPU device and its pipelines on a background thread, before any surface exists, so the
/// first surface attached (on the main thread) doesn't wait for them. Returns at once; repeat calls,
/// and calls once a device exists, do nothing. Where it can't (GLES, no adapter), `attach` makes it.
#[cfg(not(target_arch = "wasm32"))]
pub fn warm_up() {
    {
        let mut busy = WARMING.0.lock().unwrap_or_else(|e| e.into_inner());
        if *busy || state().gpu.is_some() {
            return;
        }
        *busy = true;
    }
    let spawned = std::thread::Builder::new().name("nayan-gpu-warm-up".into()).spawn(|| {
        // Built outside the state lock: rendering and mesh registration carry on meanwhile.
        if let Ok(gpu) = gpu::Gpu::headless() {
            let mut s = state();
            if s.gpu.is_none() {
                note_backend(&gpu);
                s.gpu = Some(gpu);
            }
        }
        finish_warm_up();
    });
    if spawned.is_err() {
        finish_warm_up();
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn finish_warm_up() {
    *WARMING.0.lock().unwrap_or_else(|e| e.into_inner()) = false;
    WARMING.1.notify_all();
}

/// Waits for a warm-up in progress (it's making the device this would otherwise make again).
#[cfg(not(target_arch = "wasm32"))]
fn wait_for_warm_up() {
    let mut busy = WARMING.0.lock().unwrap_or_else(|e| e.into_inner());
    while *busy {
        busy = WARMING.1.wait(busy).unwrap_or_else(|e| e.into_inner());
    }
}

/// Attaches (or resizes) surface `id`, drawing into `window` at `width` x `height` pixels.
///
/// # Safety
/// `window` must stay valid until `detach(id)` returns.
#[cfg(not(target_arch = "wasm32"))]
pub unsafe fn attach(id: i32, window: NativeWindow, width: u32, height: u32) -> Result<(), String> {
    wait_for_warm_up();
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
    let surface = match &s.gpu {
        Some(gpu) => {
            let surface = unsafe { gpu.create_surface(window) }.inspect_err(|e| set_error(e.clone()))?;
            // A warmed-up device whose adapter can't present here is made again for this window, while
            // no surface uses it yet.
            (gpu.supports(&surface) || !s.targets.is_empty()).then_some(surface)
        }
        None => None,
    };
    let surface = match surface {
        Some(surface) => surface,
        None => {
            s.gpu = None;
            let (gpu, surface) = unsafe { gpu::Gpu::new(window) }.inspect_err(|e| set_error(e.clone()))?;
            note_backend(&gpu);
            s.gpu = Some(gpu);
            surface
        }
    };
    let gpu = s.gpu.as_ref().expect("gpu initialized above");
    let target = gpu.create_target(surface, window, width, height);
    s.targets.insert(id, target);
    Ok(())
}

#[cfg(target_arch = "wasm32")]
pub fn warm_up() {}

#[cfg(target_arch = "wasm32")]
pub unsafe fn attach(_: i32, _: NativeWindow, _: u32, _: u32) -> Result<(), String> {
    Err("use the browser canvas binding".into())
}

/// No lock or mutable state borrow crosses an await. The JS bridge serializes attaches.
#[cfg(target_arch = "wasm32")]
pub async fn attach_canvas(id: i32, canvas: web_sys::HtmlCanvasElement) -> Result<(), String> {
    let existing = {
        let s = state();
        s.gpu
            .as_ref()
            .and_then(|gpu| gpu.canvas_surface(canvas.clone()).ok().filter(|surface| gpu.supports(surface)))
    };
    let surface = match existing {
        Some(surface) => surface,
        None => {
            let (gpu, surface) = gpu::Gpu::web(canvas.clone()).await?;
            note_backend(&gpu);
            let mut s = state();
            if s.gpu.is_none() || s.targets.is_empty() {
                s.gpu = Some(gpu);
            } else {
                s.canvas_gpus.insert(id, gpu);
            }
            surface
        }
    };
    let mut s = state();
    let gpu = s.canvas_gpus.get(&id).or(s.gpu.as_ref()).ok_or("Browser GPU is unavailable")?;
    if !gpu.supports(&surface) {
        return Err("The GPU adapter cannot present to this canvas".into());
    }
    let target = gpu.create_target(surface, NativeWindow(std::ptr::null_mut()), canvas.width(), canvas.height());
    s.targets.insert(id, target);
    Ok(())
}

/// Detaches surface `id`; after this returns its window may be released.
pub fn detach(id: i32) {
    {
        let mut s = state();
        s.targets.remove(&id);
        #[cfg(target_arch = "wasm32")]
        {
            s.canvas_gpus.remove(&id);
            if s.targets.is_empty() && s.gpu.as_ref().is_some_and(|gpu| gpu.backend == "gl") {
                s.gpu = None;
            }
        }
    }
    #[cfg(feature = "games")]
    scene::forget_layers(id);
    #[cfg(all(feature = "games", not(target_arch = "wasm32")))]
    thread::forget(id);
}

/// The backend surfaces draw with ("vulkan", "gl", "metal"), or "" before the first attach.
pub fn backend() -> &'static str {
    *BACKEND.lock().unwrap_or_else(|e| e.into_inner())
}

/// Present a native drawing using the same GPU and surface lifecycle as games.
#[cfg(feature = "drawing")]
pub fn draw_art(id: i32, doc: &crate::drawing::Document) -> Result<bool, String> {
    let mut guard = state();
    let s = &mut *guard;
    let Some(SurfaceTarget { gpu, target, .. }) = s.target(id) else {
        return Ok(false);
    };
    gpu.draw_art(target, doc)
}

/// Browser canvas pixel dimensions may change independently of document coordinates.
#[cfg(any(feature = "drawing", feature = "components"))]
pub fn resize_art_target(id: i32, width: u32, height: u32) -> bool {
    if width == 0 || height == 0 || width > 16384 || height > 16384 {
        return false;
    }
    let mut guard = state();
    let s = &mut *guard;
    if let Some(SurfaceTarget { gpu, target, .. }) = s.target(id) {
        return target.resize(gpu, width, height);
    }
    false
}

/// Presents UI on the existing engine surface, without simulation or game mesh registries.
#[cfg(feature = "components")]
pub fn draw_components(id: i32, ui: &mut crate::components::ComponentDocument, width: f32, height: f32) -> Result<bool, String> {
    let mut guard = state();
    let s = &mut *guard;
    let Some(SurfaceTarget { gpu, target, .. }) = s.target(id) else {
        return Ok(false);
    };
    gpu.draw_components(target, ui, width, height)
}
