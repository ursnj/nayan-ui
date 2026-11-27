//! Shared wgpu adapter, device, queue, and platform surfaces.
#[cfg(feature = "components")]
#[path = "../../../components/rust/render/components.rs"]
mod components;

#[cfg(feature = "drawing")]
#[path = "../../../drawing/rust/render/drawing.rs"]
mod drawing;

#[cfg(feature = "games")]
#[path = "../../../games/rust/render/game_gpu.rs"]
mod games;
#[cfg(all(test, feature = "games", not(target_arch = "wasm32")))]
pub use games::FRAME_LEN;
#[cfg(feature = "games")]
pub use games::Frame;
#[cfg(all(feature = "games", not(target_arch = "wasm32")))]
pub use games::view_projection;

use super::NativeWindow;
use std::sync::{Arc, Mutex};
use wgpu::*;

#[cfg(any(feature = "games", feature = "drawing"))]
fn bytes<T: Copy>(data: &[T]) -> &[u8] {
    // SAFETY: f32 / u32 / u16 slices: plain data, no padding.
    unsafe { std::slice::from_raw_parts(data.as_ptr().cast(), std::mem::size_of_val(data)) }
}

pub struct Gpu {
    instance: Instance,
    adapter: Adapter,
    device: Device,
    #[cfg(any(feature = "games", feature = "components", feature = "drawing"))]
    queue: Queue,
    pub backend: &'static str,
    #[cfg(feature = "games")]
    game: games::GameGpu,
    #[cfg(feature = "games")]
    error: Arc<Mutex<Option<String>>>,
}

/// Whether this is the Android emulator (goldfish / ranchu), whose Vulkan is unreliable.
#[cfg(target_os = "android")]
fn is_emulator() -> bool {
    unsafe extern "C" {
        fn __system_property_get(name: *const std::ffi::c_char, value: *mut std::ffi::c_char) -> i32;
    }
    let prop = |name: &std::ffi::CStr| {
        let mut buf = [0 as std::ffi::c_char; 92]; // PROP_VALUE_MAX
        let len = unsafe { __system_property_get(name.as_ptr(), buf.as_mut_ptr()) };
        if len <= 0 {
            return String::new();
        }
        unsafe { std::ffi::CStr::from_ptr(buf.as_ptr()) }.to_string_lossy().into_owned()
    };
    let hardware = prop(c"ro.hardware");
    prop(c"ro.kernel.qemu") == "1" || prop(c"ro.boot.qemu") == "1" || hardware.contains("goldfish") || hardware.contains("ranchu")
}

/// Backends to try, best first.
#[cfg(not(target_arch = "wasm32"))]
fn backends() -> &'static [Backends] {
    #[cfg(target_os = "android")]
    {
        // The emulator draws with GLES by default; Vulkan stays the fallback there
        if is_emulator() {
            &[Backends::GL, Backends::VULKAN]
        } else {
            &[Backends::VULKAN, Backends::GL]
        }
    }
    #[cfg(target_vendor = "apple")]
    {
        &[Backends::METAL]
    }
    #[cfg(not(any(target_os = "android", target_vendor = "apple")))]
    {
        &[Backends::all()]
    }
}

/// # Safety
/// `window` must outlive the surface.
#[cfg(not(target_arch = "wasm32"))]
unsafe fn create_surface(instance: &Instance, window: NativeWindow) -> Result<Surface<'static>, String> {
    #[cfg(target_os = "android")]
    let target = {
        use raw_window_handle::{AndroidDisplayHandle, AndroidNdkWindowHandle, RawDisplayHandle, RawWindowHandle};
        let ptr = std::ptr::NonNull::new(window.0).ok_or("no window")?;
        SurfaceTargetUnsafe::RawHandle {
            raw_display_handle: Some(RawDisplayHandle::Android(AndroidDisplayHandle::new())),
            raw_window_handle: RawWindowHandle::AndroidNdk(AndroidNdkWindowHandle::new(ptr)),
        }
    };
    #[cfg(target_vendor = "apple")]
    let target = {
        if window.0.is_null() {
            return Err("no layer".into());
        }
        SurfaceTargetUnsafe::CoreAnimationLayer(window.0)
    };
    #[cfg(not(any(target_os = "android", target_vendor = "apple")))]
    {
        let _ = (instance, window);
        return Err("no native surfaces on this platform".into());
    }
    #[cfg(any(target_os = "android", target_vendor = "apple"))]
    unsafe { instance.create_surface_unsafe(target) }.map_err(|e| format!("surface: {e}"))
}

impl Gpu {
    /// Picks a backend that can draw into `window` (Vulkan, else GLES, on Android).
    ///
    /// # Safety
    /// `window` must outlive the returned surface.
    #[cfg(not(target_arch = "wasm32"))]
    pub unsafe fn new(window: NativeWindow) -> Result<(Gpu, Surface<'static>), String> {
        let mut last = String::from("no graphics backend");
        for &backends in backends() {
            let mut desc = InstanceDescriptor::new_without_display_handle();
            desc.backends = backends;
            let instance = Instance::new(desc);
            // Dropped before the next backend tries: a window takes one producer at a time.
            let surface = match unsafe { create_surface(&instance, window) } {
                Ok(s) => s,
                Err(e) => {
                    last = e;
                    continue;
                }
            };
            match Gpu::open(instance, backends, Some(&surface)) {
                Ok(gpu) => return Ok((gpu, surface)),
                Err(e) => last = e,
            }
        }
        Err(last)
    }

    /// The device and pipelines before any surface exists, on the backend `new` tries first, so the
    /// first game doesn't pay for them (run off the main thread; see `render::warm_up`). GLES needs a
    /// window to make its context, so it's left to `new`.
    #[cfg(not(target_arch = "wasm32"))]
    pub fn headless() -> Result<Gpu, String> {
        let backends = *backends().first().ok_or("no graphics backend")?;
        if backends == Backends::GL {
            return Err("GLES needs a window".into());
        }
        let mut desc = InstanceDescriptor::new_without_display_handle();
        desc.backends = backends;
        let gpu = Gpu::open(Instance::new(desc), backends, None)?;
        #[cfg(feature = "games")]
        let gpu = gpu.warm_game_pipelines();
        Ok(gpu)
    }

    /// An adapter and device on `backends`; with a surface, one that can present to it.
    async fn open_async(instance: Instance, backends: Backends, surface: Option<&Surface<'static>>) -> Result<Gpu, String> {
        let options = RequestAdapterOptions {
            power_preference: PowerPreference::HighPerformance,
            force_fallback_adapter: false,
            compatible_surface: surface,
            ..Default::default()
        };
        let adapter = instance.request_adapter(&options).await.map_err(|e| format!("{backends:?}: {e}"))?;
        // PowerVR's Android Vulkan drivers (e.g. the GE8322 in Unisoc SC9863A phones) crash inside
        // vkQueueSubmit; those GPUs draw with GLES instead.
        let info = adapter.get_info();
        if backends == Backends::VULKAN && (info.vendor == 0x1010 || info.name.contains("PowerVR")) {
            return Err(format!("{backends:?}: {} is blocklisted", info.name));
        }
        let desc = DeviceDescriptor {
            label: Some("nayan"),
            required_features: Features::empty(),
            required_limits: Limits::downlevel_webgl2_defaults().using_resolution(adapter.limits()),
            ..Default::default()
        };
        let (device, queue) = adapter.request_device(&desc).await.map_err(|e| format!("{backends:?}: {e}"))?;
        let backend = match info.backend {
            Backend::Vulkan => "vulkan",
            Backend::Gl => "gl",
            Backend::Metal => "metal",
            Backend::BrowserWebGpu => "webgpu",
            _ => "other",
        };
        Ok(Gpu::build(instance, adapter, device, queue, backend))
    }

    #[cfg(not(target_arch = "wasm32"))]
    fn open(instance: Instance, backends: Backends, surface: Option<&Surface<'static>>) -> Result<Gpu, String> {
        pollster::block_on(Self::open_async(instance, backends, surface))
    }

    #[cfg(target_arch = "wasm32")]
    pub async fn web(canvas: web_sys::HtmlCanvasElement) -> Result<(Gpu, Surface<'static>), String> {
        let mut error = String::from("WebGPU and WebGL2 are unavailable");
        for backend in [Backends::BROWSER_WEBGPU, Backends::GL] {
            let mut desc = InstanceDescriptor::new_without_display_handle();
            desc.backends = backend;
            let instance = Instance::new(desc);
            let surface = match instance.create_surface(SurfaceTarget::Canvas(canvas.clone())) {
                Ok(surface) => surface,
                Err(e) => {
                    error = e.to_string();
                    continue;
                }
            };
            match Self::open_async(instance, backend, Some(&surface)).await {
                Ok(gpu) => return Ok((gpu, surface)),
                Err(e) => error = e,
            }
        }
        Err(error)
    }

    #[cfg(target_arch = "wasm32")]
    pub fn canvas_surface(&self, canvas: web_sys::HtmlCanvasElement) -> Result<Surface<'static>, String> {
        self.instance.create_surface(SurfaceTarget::Canvas(canvas)).map_err(|e| e.to_string())
    }

    /// Whether this device's adapter can present to `surface` (a headless device may have picked another).
    pub fn supports(&self, surface: &Surface<'static>) -> bool {
        self.adapter.is_surface_supported(surface)
    }

    fn build(instance: Instance, adapter: Adapter, device: Device, queue: Queue, backend: &'static str) -> Gpu {
        let error: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
        let sink = error.clone();
        device.on_uncaptured_error(Arc::new(move |e: Error| {
            if let Ok(mut slot) = sink.lock() {
                slot.get_or_insert_with(|| format!("wgpu: {e}"));
            }
        }));
        #[cfg(not(any(feature = "games", feature = "components", feature = "drawing")))]
        let _ = queue;
        Gpu {
            #[cfg(feature = "games")]
            game: games::GameGpu::new(&adapter, &device, &queue),
            instance,
            adapter,
            device,
            #[cfg(any(feature = "games", feature = "components", feature = "drawing"))]
            queue,
            backend,
            #[cfg(feature = "games")]
            error,
        }
    }

    #[cfg(feature = "games")]
    pub fn take_error(&self) -> Option<String> {
        self.error.lock().ok()?.take()
    }

    /// # Safety
    /// `window` must outlive the surface.
    #[cfg(not(target_arch = "wasm32"))]
    pub unsafe fn create_surface(&self, window: NativeWindow) -> Result<Surface<'static>, String> {
        unsafe { create_surface(&self.instance, window) }
    }

    pub fn create_target(&self, surface: Surface<'static>, window: NativeWindow, width: u32, height: u32) -> Target {
        let caps = surface.get_capabilities(&self.adapter);
        // Colors are authored for a non-sRGB target, as on WebGPU.
        let format = caps
            .formats
            .iter()
            .copied()
            .find(|f| !f.is_srgb())
            .or(caps.formats.first().copied())
            .unwrap_or(TextureFormat::Rgba8Unorm);
        let mut config = surface
            .get_default_config(&self.adapter, width.max(1), height.max(1))
            .expect("surface supported by the adapter");
        config.format = format;
        // Frames are drawn from the JS thread: Mailbox never blocks it waiting for vsync (the frame loop
        // is already paced by requestAnimationFrame). Fifo (always available) where it isn't supported.
        config.present_mode = if caps.present_modes.contains(&PresentMode::Mailbox) {
            PresentMode::Mailbox
        } else {
            PresentMode::Fifo
        };
        config.alpha_mode = if caps.alpha_modes.contains(&CompositeAlphaMode::Opaque) {
            CompositeAlphaMode::Opaque
        } else {
            caps.alpha_modes[0]
        };
        config.desired_maximum_frame_latency = 2;
        config.view_formats = Vec::new();
        surface.configure(&self.device, &config);
        Target {
            #[cfg(feature = "games")]
            game: games::GameTarget::new(self),
            surface,
            window,
            #[cfg(any(feature = "games", feature = "components", feature = "drawing"))]
            srgb: format.is_srgb(),
            config,
            #[cfg(feature = "drawing")]
            art: None,
            #[cfg(feature = "components")]
            ui: None,
        }
    }

    #[cfg(any(feature = "games", feature = "drawing"))]
    /// Uploads the rectangle whose texels start at `pixels[0]`, rows `stride` texels apart.
    pub(super) fn write_pixels(&self, texture: &Texture, [x, y, width, height]: [u32; 4], pixels: &[u8], stride: u32) {
        self.queue.write_texture(
            TexelCopyTextureInfo {
                texture,
                mip_level: 0,
                origin: Origin3d { x, y, z: 0 },
                aspect: TextureAspect::All,
            },
            pixels,
            TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(stride * 4),
                rows_per_image: Some(height),
            },
            Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
        );
    }
}

/// Shared surface state. Each renderer owns its own render targets.
pub struct Target {
    surface: Surface<'static>,
    #[cfg_attr(target_arch = "wasm32", allow(dead_code))]
    pub window: NativeWindow,
    config: SurfaceConfiguration,
    #[cfg(any(feature = "games", feature = "components", feature = "drawing"))]
    srgb: bool,
    #[cfg(feature = "games")]
    game: games::GameTarget,
    #[cfg(feature = "drawing")]
    art: Option<drawing::ArtSurface>,
    #[cfg(feature = "components")]
    ui: Option<components::ComponentRenderer>,
}

impl Target {
    /// Reconfigures the surface for a new drawing size.
    pub fn resize(&mut self, gpu: &Gpu, width: u32, height: u32) -> bool {
        let (width, height) = (width.max(1), height.max(1));
        if self.config.width != width || self.config.height != height {
            self.config.width = width;
            self.config.height = height;
            self.surface.configure(&gpu.device, &self.config);
            return true;
        }
        false
    }
}
