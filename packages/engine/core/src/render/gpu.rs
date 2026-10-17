//! wgpu device, pipelines, per-surface targets and the frame itself.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use rapier3d::glamx::{Mat4, Vec3};
use wgpu::*;

use super::{Instances, MeshData, NativeWindow, VERTEX_FLOATS};

const DEPTH_FORMAT: TextureFormat = TextureFormat::Depth24Plus;
// 16 bits cover the light's 1..140 depth range to ~0.002 units, well inside the depth bias.
const SHADOW_FORMAT: TextureFormat = TextureFormat::Depth16Unorm;
const GLOBALS_FLOATS: usize = 16 + 16 + 4 * 5;
const MAX_MESHES: usize = crate::MAX_MESHES;
const FLAME_MESH: usize = 9;
const WHITE: i64 = -1;

/// Doubles per frame description (see `Frame::from_slice` and `engine_render_frame`).
pub const FRAME_LEN: usize = 26;

/// Camera, light, environment and quality for one frame.
pub struct Frame {
    pub eye: [f32; 3],
    pub target: [f32; 3],
    pub fov: f32,
    /// Orthographic half height, or 0 for perspective.
    pub ortho: f32,
    pub light_direction: [f32; 3],
    pub ambient: f32,
    pub shadows: bool,
    pub shadow_extent: f32,
    pub light_color: [f32; 3],
    pub background: [f32; 3],
    pub fog: f32,
    /// Drawing size in pixels.
    pub width: u32,
    pub height: u32,
    pub samples: u32,
    pub shadow_size: u32,
    pub soft_shadows: bool,
}

impl Frame {
    /// Layout: eye 0..3, target 3..6, fov 6, ortho 7, light direction 8..11, ambient 11, shadows 12,
    /// shadow extent 13, light color 14..17, background 17..20, fog 20, width 21, height 22,
    /// samples 23, shadow size 24, soft shadows 25.
    pub fn from_slice(f: &[f64]) -> Option<Frame> {
        if f.len() < FRAME_LEN {
            return None;
        }
        let v3 = |i: usize| [f[i] as f32, f[i + 1] as f32, f[i + 2] as f32];
        Some(Frame {
            eye: v3(0),
            target: v3(3),
            fov: f[6] as f32,
            ortho: f[7] as f32,
            light_direction: v3(8),
            ambient: f[11] as f32,
            shadows: f[12] != 0.0,
            shadow_extent: f[13] as f32,
            light_color: v3(14),
            background: v3(17),
            fog: f[20] as f32,
            width: f[21].max(0.0) as u32,
            height: f[22].max(0.0) as u32,
            samples: if f[23] >= 4.0 { 4 } else { 1 },
            shadow_size: (f[24] as u32).clamp(256, 4096),
            soft_shadows: f[25] != 0.0,
        })
    }
}

fn bytes<T: Copy>(data: &[T]) -> &[u8] {
    // SAFETY: f32 / u32 / u16 slices: plain data, no padding.
    unsafe { std::slice::from_raw_parts(data.as_ptr().cast(), std::mem::size_of_val(data)) }
}

struct Pipelines {
    opaque: RenderPipeline,
    cutout: RenderPipeline,
    blend: RenderPipeline,
    add: RenderPipeline,
}

struct GpuMesh {
    version: u64,
    vertices: Buffer,
    indices: Buffer,
    format: IndexFormat,
    count: u32,
    material: BindGroup,
    cutout: bool,
}

pub struct Gpu {
    instance: Instance,
    adapter: Adapter,
    device: Device,
    queue: Queue,
    pub backend: &'static str,
    module: ShaderModule,
    scene_layout: BindGroupLayout,
    shadow_layout: BindGroupLayout,
    texture_layout: BindGroupLayout,
    pipeline_layout: PipelineLayout,
    shadow_pipeline: RenderPipeline,
    sampler: Sampler,
    pipelines: HashMap<(TextureFormat, u32), Pipelines>,
    meshes: HashMap<u8, GpuMesh>,
    textures: HashMap<i64, (TextureView, bool)>,
    materials: HashMap<(i64, u32), BindGroup>,
    error: Arc<Mutex<Option<String>>>,
}

/// Which meshes a draw covers (see `Gpu::draw`).
#[derive(Clone, Copy, PartialEq)]
enum Only {
    All,
    Solid,
    Cutout,
    Blended,
    Added,
}

/// Backends to try, best first.
fn backends() -> &'static [Backends] {
    #[cfg(target_os = "android")]
    {
        &[Backends::VULKAN, Backends::GL]
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
            let options = RequestAdapterOptions {
                power_preference: PowerPreference::HighPerformance,
                force_fallback_adapter: false,
                compatible_surface: Some(&surface),
                ..Default::default()
            };
            let adapter = match pollster::block_on(instance.request_adapter(&options)) {
                Ok(a) => a,
                Err(e) => {
                    last = format!("{backends:?}: {e}");
                    continue;
                }
            };
            let desc = DeviceDescriptor {
                label: Some("nayan"),
                required_features: Features::empty(),
                required_limits: Limits::downlevel_webgl2_defaults().using_resolution(adapter.limits()),
                ..Default::default()
            };
            let (device, queue) = match pollster::block_on(adapter.request_device(&desc)) {
                Ok(d) => d,
                Err(e) => {
                    last = format!("{backends:?}: {e}");
                    continue;
                }
            };
            let backend = match adapter.get_info().backend {
                Backend::Vulkan => "vulkan",
                Backend::Gl => "gl",
                Backend::Metal => "metal",
                _ => "other",
            };
            return Ok((Gpu::build(instance, adapter, device, queue, backend), surface));
        }
        Err(last)
    }

    fn build(instance: Instance, adapter: Adapter, device: Device, queue: Queue, backend: &'static str) -> Gpu {
        let error = Arc::new(Mutex::new(None));
        let sink = error.clone();
        device.on_uncaptured_error(Arc::new(move |e: Error| {
            if let Ok(mut slot) = sink.lock() {
                slot.get_or_insert_with(|| format!("wgpu: {e}"));
            }
        }));
        let module = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("scene"),
            source: ShaderSource::Wgsl(include_str!("shader.wgsl").into()),
        });
        let uniform = |binding, visibility| BindGroupLayoutEntry {
            binding,
            visibility,
            ty: BindingType::Buffer { ty: BufferBindingType::Uniform, has_dynamic_offset: false, min_binding_size: None },
            count: None,
        };
        let texture = |binding, filterable| BindGroupLayoutEntry {
            binding,
            visibility: ShaderStages::FRAGMENT,
            ty: BindingType::Texture {
                sample_type: TextureSampleType::Float { filterable },
                view_dimension: TextureViewDimension::D2,
                multisampled: false,
            },
            count: None,
        };
        let scene_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("scene"),
            entries: &[uniform(0, ShaderStages::VERTEX_FRAGMENT), texture(1, false)],
        });
        // The shadow pass writes the shadow map, so it can't bind it.
        let shadow_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("shadow"),
            entries: &[uniform(0, ShaderStages::VERTEX)],
        });
        let texture_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("material"),
            entries: &[
                texture(0, true),
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::FRAGMENT,
                    ty: BindingType::Sampler(SamplerBindingType::Filtering),
                    count: None,
                },
                uniform(2, ShaderStages::FRAGMENT),
            ],
        });
        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("scene"),
            bind_group_layouts: &[Some(&scene_layout), Some(&texture_layout)],
            immediate_size: 0,
        });
        let shadow_pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("shadow"),
            bind_group_layouts: &[Some(&shadow_layout)],
            immediate_size: 0,
        });
        let shadow_pipeline = device.create_render_pipeline(&RenderPipelineDescriptor {
            label: Some("shadow"),
            layout: Some(&shadow_pipeline_layout),
            vertex: VertexState {
                module: &module,
                entry_point: Some("vs_shadow"),
                compilation_options: Default::default(),
                buffers: &vertex_layouts()[..2],
            },
            primitive: PrimitiveState { cull_mode: Some(Face::Back), ..Default::default() },
            // Slope-scaled bias keeps surfaces from shadowing themselves ("acne").
            depth_stencil: Some(DepthStencilState {
                format: SHADOW_FORMAT,
                depth_write_enabled: Some(true),
                depth_compare: Some(CompareFunction::Less),
                stencil: StencilState::default(),
                bias: DepthBiasState { constant: 2, slope_scale: 2.0, clamp: 0.0 },
            }),
            multisample: MultisampleState::default(),
            fragment: None,
            multiview_mask: None,
            cache: None,
        });
        let sampler = device.create_sampler(&SamplerDescriptor {
            address_mode_u: AddressMode::Repeat,
            address_mode_v: AddressMode::Repeat,
            mag_filter: FilterMode::Linear,
            min_filter: FilterMode::Linear,
            ..Default::default()
        });
        Gpu {
            instance,
            adapter,
            device,
            queue,
            backend,
            module,
            scene_layout,
            shadow_layout,
            texture_layout,
            pipeline_layout,
            shadow_pipeline,
            sampler,
            pipelines: HashMap::new(),
            meshes: HashMap::new(),
            textures: HashMap::new(),
            materials: HashMap::new(),
            error,
        }
    }

    pub fn take_error(&self) -> Option<String> {
        self.error.lock().ok()?.take()
    }

    /// # Safety
    /// `window` must outlive the surface.
    pub unsafe fn create_surface(&self, window: NativeWindow) -> Result<Surface<'static>, String> {
        unsafe { create_surface(&self.instance, window) }
    }

    pub fn create_target(&self, surface: Surface<'static>, window: NativeWindow, width: u32, height: u32) -> Target {
        let caps = surface.get_capabilities(&self.adapter);
        // Colors are authored for a non-sRGB target, as on WebGPU.
        let format = caps.formats.iter().copied().find(|f| !f.is_srgb()).or(caps.formats.first().copied()).unwrap_or(TextureFormat::Rgba8Unorm);
        let mut config = surface.get_default_config(&self.adapter, width.max(1), height.max(1)).expect("surface supported by the adapter");
        config.format = format;
        // Frames are drawn from the JS thread: Mailbox never blocks it waiting for vsync (the frame loop
        // is already paced by requestAnimationFrame). Fifo (always available) where it isn't supported.
        config.present_mode = if caps.present_modes.contains(&PresentMode::Mailbox) { PresentMode::Mailbox } else { PresentMode::Fifo };
        config.alpha_mode = if caps.alpha_modes.contains(&CompositeAlphaMode::Opaque) { CompositeAlphaMode::Opaque } else { caps.alpha_modes[0] };
        config.desired_maximum_frame_latency = 2;
        config.view_formats = Vec::new();
        surface.configure(&self.device, &config);
        let globals = self.device.create_buffer(&BufferDescriptor {
            label: Some("globals"),
            size: (GLOBALS_FLOATS * 4) as u64,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let shadow_group = self.device.create_bind_group(&BindGroupDescriptor {
            label: Some("shadow"),
            layout: &self.shadow_layout,
            entries: &[BindGroupEntry { binding: 0, resource: globals.as_entire_binding() }],
        });
        Target {
            surface,
            window,
            srgb: format.is_srgb(),
            config,
            globals,
            shadow_group,
            scene_group: None,
            shadow_view: None,
            shadow_size: 0,
            depth: None,
            msaa: None,
            samples: 0,
            target_size: (0, 0),
            instances: None,
        }
    }

    fn pipelines(&mut self, format: TextureFormat, samples: u32) -> &Pipelines {
        let key = (format, samples);
        if !self.pipelines.contains_key(&key) {
            let make = |entry: &str, mode: u8| {
                let transparent = mode != 0;
                let blend = match mode {
                    1 => Some(BlendState {
                        color: BlendComponent { src_factor: BlendFactor::SrcAlpha, dst_factor: BlendFactor::OneMinusSrcAlpha, operation: BlendOperation::Add },
                        alpha: BlendComponent { src_factor: BlendFactor::One, dst_factor: BlendFactor::OneMinusSrcAlpha, operation: BlendOperation::Add },
                    }),
                    2 => Some(BlendState {
                        color: BlendComponent { src_factor: BlendFactor::SrcAlpha, dst_factor: BlendFactor::One, operation: BlendOperation::Add },
                        alpha: BlendComponent { src_factor: BlendFactor::Zero, dst_factor: BlendFactor::One, operation: BlendOperation::Add },
                    }),
                    _ => None,
                };
                self.device.create_render_pipeline(&RenderPipelineDescriptor {
                    label: Some(entry),
                    layout: Some(&self.pipeline_layout),
                    vertex: VertexState {
                        module: &self.module,
                        entry_point: Some("vs"),
                        compilation_options: Default::default(),
                        buffers: &vertex_layouts(),
                    },
                    primitive: PrimitiveState { cull_mode: Some(Face::Back), ..Default::default() },
                    // See-through surfaces are tested against depth but don't hide what's behind them.
                    depth_stencil: Some(DepthStencilState {
                        format: DEPTH_FORMAT,
                        depth_write_enabled: Some(!transparent),
                        depth_compare: Some(CompareFunction::Less),
                        stencil: StencilState::default(),
                        bias: DepthBiasState::default(),
                    }),
                    multisample: MultisampleState { count: samples, ..Default::default() },
                    fragment: Some(FragmentState {
                        module: &self.module,
                        entry_point: Some(entry),
                        compilation_options: Default::default(),
                        targets: &[Some(ColorTargetState { format, blend, write_mask: ColorWrites::ALL })],
                    }),
                    multiview_mask: None,
                    cache: None,
                })
            };
            let pipelines = Pipelines { opaque: make("fs_opaque", 0), cutout: make("fs_cutout", 0), blend: make("fs_blend", 1), add: make("fs_blend", 2) };
            self.pipelines.insert(key, pipelines);
        }
        &self.pipelines[&key]
    }

    fn texture(&mut self, id: i64) -> (TextureView, bool) {
        if let Some(t) = self.textures.get(&id) {
            return t.clone();
        }
        let white = crate::texture::Image { width: 1, height: 1, rgba: vec![255; 4] };
        let image = if id == WHITE { None } else { crate::texture::get(id as u32) };
        let image = image.as_deref().unwrap_or(&white);
        let size = Extent3d { width: image.width, height: image.height, depth_or_array_layers: 1 };
        let texture = self.device.create_texture(&TextureDescriptor {
            label: Some("texture"),
            size,
            mip_level_count: 1,
            sample_count: 1,
            dimension: TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
            view_formats: &[],
        });
        self.queue.write_texture(
            TexelCopyTextureInfo { texture: &texture, mip_level: 0, origin: Origin3d::ZERO, aspect: TextureAspect::All },
            &image.rgba,
            TexelCopyBufferLayout { offset: 0, bytes_per_row: Some(image.width * 4), rows_per_image: Some(image.height) },
            size,
        );
        let cutout = image.rgba.chunks_exact(4).any(|p| p[3] < 128);
        let entry = (texture.create_view(&TextureViewDescriptor::default()), cutout);
        self.textures.insert(id, entry.clone());
        entry
    }

    fn material(&mut self, texture: i64, shine: f32) -> (BindGroup, bool) {
        let (view, cutout) = self.texture(texture);
        let key = (texture, shine.to_bits());
        if let Some(group) = self.materials.get(&key) {
            return (group.clone(), cutout);
        }
        let buffer = self.device.create_buffer(&BufferDescriptor {
            label: Some("material"),
            size: 16,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        self.queue.write_buffer(&buffer, 0, bytes(&[shine, 0.0, 0.0, 0.0]));
        let group = self.device.create_bind_group(&BindGroupDescriptor {
            label: Some("material"),
            layout: &self.texture_layout,
            entries: &[
                BindGroupEntry { binding: 0, resource: BindingResource::TextureView(&view) },
                BindGroupEntry { binding: 1, resource: BindingResource::Sampler(&self.sampler) },
                BindGroupEntry { binding: 2, resource: buffer.as_entire_binding() },
            ],
        });
        self.materials.insert(key, group.clone());
        (group, cutout)
    }

    /// Uploads (or refreshes) the GPU copy of mesh `id`. False if it has nothing to draw.
    fn ensure_mesh(&mut self, id: u8, meshes: &std::collections::BTreeMap<u8, Arc<MeshData>>) -> bool {
        let Some(data) = meshes.get(&id) else { return false };
        if self.meshes.get(&id).is_some_and(|m| m.version == data.version) {
            return true;
        }
        if data.indices.is_empty() || data.vertices.len() < VERTEX_FLOATS {
            return false;
        }
        let buffer = |label, contents: &[u8], usage| {
            let size = (contents.len() as u64).div_ceil(4) * 4;
            let buffer = self.device.create_buffer(&BufferDescriptor { label: Some(label), size, usage: usage | BufferUsages::COPY_DST, mapped_at_creation: false });
            let mut padded = contents.to_vec();
            padded.resize(size as usize, 0);
            self.queue.write_buffer(&buffer, 0, &padded);
            buffer
        };
        let vertices = buffer("vertices", bytes(&data.vertices), BufferUsages::VERTEX);
        // 16-bit indices halve index fetches; every built-in shape and most models fit.
        let short = data.vertices.len() / VERTEX_FLOATS <= 0x10000;
        let (indices, format) = if short {
            let small: Vec<u16> = data.indices.iter().map(|&i| i as u16).collect();
            (buffer("indices", bytes(&small), BufferUsages::INDEX), IndexFormat::Uint16)
        } else {
            (buffer("indices", bytes(&data.indices), BufferUsages::INDEX), IndexFormat::Uint32)
        };
        let (material, cutout) = self.material(data.texture.map(i64::from).unwrap_or(WHITE), data.shine);
        self.meshes.insert(id, GpuMesh { version: data.version, vertices, indices, format, count: data.indices.len() as u32, material, cutout });
        true
    }

    // glam's older camera helpers: right-handed, 0..1 depth, as WebGPU expects.
    #[allow(deprecated)]
    /// Draws one frame. None when the surface skipped it (busy, occluded or just reconfigured).
    pub fn render(&mut self, target: &mut Target, meshes: &std::collections::BTreeMap<u8, Arc<MeshData>>, frame: &Frame, inst: &Instances) -> Result<Option<[f32; 16]>, String> {
        if frame.width == 0 || frame.height == 0 {
            return Ok(None);
        }
        target.resize(self, frame.width, frame.height);
        let used = inst.count.min(inst.matrices.len() / 16).min(inst.colors.len() / 4);
        target.prepare(self, frame, used);

        // Camera.
        let (width, height) = (frame.width as f32, frame.height as f32);
        let aspect = width / height;
        let proj = if frame.ortho > 0.0 {
            let h = frame.ortho;
            Mat4::orthographic_rh(-h * aspect, h * aspect, -h, h, 0.1, 500.0)
        } else {
            Mat4::perspective_rh(frame.fov, aspect, 0.1, 500.0)
        };
        let eye = Vec3::from(frame.eye);
        let look = Vec3::from(frame.target);
        // Looking straight down (board games) needs a different "up" than the world's.
        let flat = (look.x - eye.x).abs() + (look.z - eye.z).abs() < 1e-6;
        let view = Mat4::look_at_rh(eye, look, if flat { Vec3::new(0.0, 0.0, -1.0) } else { Vec3::Y });
        let view_proj = proj * view;

        // Light: orthographic, covering `extent` around the camera target, snapped to texels to avoid shimmer.
        let direction = Vec3::from(frame.light_direction).normalize_or(Vec3::Y);
        let mut light_view_proj = Mat4::IDENTITY;
        if frame.shadows {
            let extent = if frame.shadow_extent > 0.0 { frame.shadow_extent } else { 30.0 };
            let texel = 2.0 * extent / target.shadow_size as f32;
            let center = (look / texel).round() * texel;
            let up = if direction.y.abs() > 0.99 { Vec3::Z } else { Vec3::Y };
            let light_view = Mat4::look_at_rh(center + direction * 60.0, center, up);
            light_view_proj = Mat4::orthographic_rh(-extent, extent, -extent, extent, 1.0, 140.0) * light_view;
        }

        let mut g = [0f32; GLOBALS_FLOATS];
        g[0..16].copy_from_slice(&view_proj.to_cols_array());
        g[16..32].copy_from_slice(&light_view_proj.to_cols_array());
        g[32..35].copy_from_slice(&direction.to_array());
        g[35] = frame.ambient;
        g[36] = if frame.soft_shadows { 1.0 } else { 0.0 };
        g[37] = if frame.shadows { 1.0 } else { 0.0 };
        g[38] = 0.0005;
        g[39] = if target.srgb { 1.0 } else { 0.0 };
        g[40..43].copy_from_slice(&frame.eye);
        g[43] = 1.0;
        g[44..47].copy_from_slice(&frame.background);
        g[47] = frame.fog.max(0.0);
        g[48..51].copy_from_slice(&frame.light_color);
        g[51] = 1.0;
        self.queue.write_buffer(&target.globals, 0, bytes(&g));

        let buffers = target.instances.as_ref().expect("prepared");
        if used > 0 {
            self.queue.write_buffer(&buffers.matrices, 0, bytes(&inst.matrices[..used * 16]));
            self.queue.write_buffer(&buffers.colors, 0, bytes(&inst.colors[..used * 4]));
            if let Some(regions) = inst.regions.filter(|r| r.len() >= used * 4) {
                self.queue.write_buffer(&buffers.regions, 0, bytes(&regions[..used * 4]));
            }
        }

        // Upload every mesh drawn this frame before recording (the passes borrow them).
        let buckets = (inst.ranges.len() / 2).min(2 * MAX_MESHES);
        for b in 0..buckets {
            if inst.ranges[b * 2 + 1] > 0 {
                self.ensure_mesh((b % MAX_MESHES) as u8, meshes);
            }
        }
        let format = target.config.format;
        let samples = target.samples;
        self.pipelines(format, samples);

        let surface_texture = match target.surface.get_current_texture() {
            CurrentSurfaceTexture::Success(t) | CurrentSurfaceTexture::Suboptimal(t) => t,
            CurrentSurfaceTexture::Timeout | CurrentSurfaceTexture::Occluded => return Ok(None),
            CurrentSurfaceTexture::Outdated | CurrentSurfaceTexture::Lost => {
                target.surface.configure(&self.device, &target.config);
                return Ok(None);
            }
            CurrentSurfaceTexture::Validation => return Err("surface: validation error acquiring a frame".into()),
        };
        let screen = surface_texture.texture.create_view(&TextureViewDescriptor::default());
        let mut encoder = self.device.create_command_encoder(&CommandEncoderDescriptor::default());
        let ranges = inst.ranges;

        if frame.shadows && used > 0 {
            let mut pass = encoder.begin_render_pass(&RenderPassDescriptor {
                label: Some("shadow"),
                color_attachments: &[],
                depth_stencil_attachment: Some(RenderPassDepthStencilAttachment {
                    view: target.shadow_view.as_ref().expect("prepared"),
                    depth_ops: Some(Operations { load: LoadOp::Clear(1.0), store: StoreOp::Store }),
                    stencil_ops: None,
                }),
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            pass.set_pipeline(&self.shadow_pipeline);
            pass.set_bind_group(0, &target.shadow_group, &[]);
            self.draw(&mut pass, buffers, ranges, used, 0, false, Only::All); // see-through instances don't cast shadows
        }

        {
            let [r, g, b] = frame.background.map(f64::from);
            let clear = if target.srgb { [r, g, b].map(|c| c.powf(2.2)) } else { [r, g, b] };
            let clear = Color { r: clear[0], g: clear[1], b: clear[2], a: 1.0 };
            let color = match &target.msaa {
                // MSAA target never leaves tile memory.
                Some(msaa) => RenderPassColorAttachment {
                    view: msaa,
                    depth_slice: None,
                    resolve_target: Some(&screen),
                    ops: Operations { load: LoadOp::Clear(clear), store: StoreOp::Discard },
                },
                None => RenderPassColorAttachment { view: &screen, depth_slice: None, resolve_target: None, ops: Operations { load: LoadOp::Clear(clear), store: StoreOp::Store } },
            };
            let mut pass = encoder.begin_render_pass(&RenderPassDescriptor {
                label: Some("scene"),
                color_attachments: &[Some(color)],
                depth_stencil_attachment: Some(RenderPassDepthStencilAttachment {
                    view: target.depth.as_ref().expect("prepared"),
                    depth_ops: Some(Operations { load: LoadOp::Clear(1.0), store: StoreOp::Discard }),
                    stencil_ops: None,
                }),
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            if used > 0 {
                let p = &self.pipelines[&(format, samples)];
                pass.set_bind_group(0, target.scene_group.as_ref().expect("prepared"), &[]);
                pass.set_pipeline(&p.opaque);
                self.draw(&mut pass, buffers, ranges, used, 0, true, Only::Solid);
                // Cut-outs discard texels, which turns off early depth testing on mobile GPUs: only they pay for it.
                pass.set_pipeline(&p.cutout);
                self.draw(&mut pass, buffers, ranges, used, 0, true, Only::Cutout);
                pass.set_pipeline(&p.blend);
                self.draw(&mut pass, buffers, ranges, used, MAX_MESHES, true, Only::Blended);
                // Flames add their light last, so smoke never dulls them.
                pass.set_pipeline(&p.add);
                self.draw(&mut pass, buffers, ranges, used, MAX_MESHES, true, Only::Added);
            }
        }
        self.queue.submit([encoder.finish()]);
        self.queue.present(surface_texture);
        Ok(Some(view_proj.to_cols_array()))
    }

    /// One instanced draw per mesh, for the ranges starting at bucket `offset` (0 = opaque,
    /// MAX_MESHES = transparent). Ranges are clamped to `used` so a stale buffer can't overrun.
    #[allow(clippy::too_many_arguments)]
    fn draw(&self, pass: &mut RenderPass, buffers: &InstanceBuffers, ranges: &[u32], used: usize, offset: usize, textured: bool, only: Only) {
        let end = (offset + MAX_MESHES).min(ranges.len() / 2);
        for b in offset..end {
            let first = ranges[b * 2] as usize;
            let count = (ranges[b * 2 + 1] as usize).min(used.saturating_sub(first));
            if count == 0 {
                continue;
            }
            let id = b - offset;
            let Some(mesh) = self.meshes.get(&(id as u8)) else { continue };
            match only {
                Only::Solid if mesh.cutout => continue,
                Only::Cutout if !mesh.cutout => continue,
                Only::Blended if id == FLAME_MESH => continue,
                Only::Added if id != FLAME_MESH => continue,
                _ => {}
            }
            if textured {
                pass.set_bind_group(1, &mesh.material, &[]);
            }
            pass.set_vertex_buffer(0, mesh.vertices.slice(..));
            // Instance data starts at `first` through the buffer offsets: GLES has no base instance.
            pass.set_vertex_buffer(1, buffers.matrices.slice((first * 64) as u64..));
            if textured {
                pass.set_vertex_buffer(2, buffers.colors.slice((first * 16) as u64..));
                pass.set_vertex_buffer(3, buffers.regions.slice((first * 16) as u64..));
            }
            pass.set_index_buffer(mesh.indices.slice(..), mesh.format);
            pass.draw_indexed(0..mesh.count, 0, 0..count as u32);
        }
    }
}

/// Mesh vertices, then per-instance matrix, color and texture region.
fn vertex_layouts() -> [Option<VertexBufferLayout<'static>>; 4] {
    const MESH: [VertexAttribute; 4] = vertex_attr_array![0 => Float32x3, 1 => Float32x3, 2 => Float32x3, 3 => Float32x2];
    const MATRIX: [VertexAttribute; 4] = vertex_attr_array![4 => Float32x4, 5 => Float32x4, 6 => Float32x4, 7 => Float32x4];
    const COLOR: [VertexAttribute; 1] = vertex_attr_array![8 => Float32x4];
    const REGION: [VertexAttribute; 1] = vertex_attr_array![9 => Float32x4];
    [
        Some(VertexBufferLayout { array_stride: (VERTEX_FLOATS * 4) as u64, step_mode: VertexStepMode::Vertex, attributes: &MESH }),
        Some(VertexBufferLayout { array_stride: 64, step_mode: VertexStepMode::Instance, attributes: &MATRIX }),
        Some(VertexBufferLayout { array_stride: 16, step_mode: VertexStepMode::Instance, attributes: &COLOR }),
        Some(VertexBufferLayout { array_stride: 16, step_mode: VertexStepMode::Instance, attributes: &REGION }),
    ]
}

struct InstanceBuffers {
    capacity: usize,
    matrices: Buffer,
    colors: Buffer,
    regions: Buffer,
}

/// A surface and what drawing into it needs (depth, MSAA and shadow textures, instance buffers).
pub struct Target {
    surface: Surface<'static>,
    pub window: NativeWindow,
    config: SurfaceConfiguration,
    srgb: bool,
    globals: Buffer,
    shadow_group: BindGroup,
    scene_group: Option<BindGroup>,
    shadow_view: Option<TextureView>,
    shadow_size: u32,
    depth: Option<TextureView>,
    msaa: Option<TextureView>,
    samples: u32,
    target_size: (u32, u32),
    instances: Option<InstanceBuffers>,
}

impl Target {
    /// Reconfigures the surface for a new drawing size.
    pub fn resize(&mut self, gpu: &Gpu, width: u32, height: u32) {
        let (width, height) = (width.max(1), height.max(1));
        if self.config.width != width || self.config.height != height {
            self.config.width = width;
            self.config.height = height;
            self.surface.configure(&gpu.device, &self.config);
        }
    }

    /// Makes the render targets, shadow map and instance buffers this frame needs.
    fn prepare(&mut self, gpu: &Gpu, frame: &Frame, used: usize) {
        let device = &gpu.device;
        let size = (self.config.width, self.config.height);
        if self.depth.is_none() || self.samples != frame.samples || self.target_size != size {
            self.samples = frame.samples;
            self.target_size = size;
            let extent = Extent3d { width: size.0, height: size.1, depth_or_array_layers: 1 };
            let texture = |format, label| {
                device
                    .create_texture(&TextureDescriptor {
                        label: Some(label),
                        size: extent,
                        mip_level_count: 1,
                        sample_count: self.samples,
                        dimension: TextureDimension::D2,
                        format,
                        usage: TextureUsages::RENDER_ATTACHMENT,
                        view_formats: &[],
                    })
                    .create_view(&TextureViewDescriptor::default())
            };
            self.depth = Some(texture(DEPTH_FORMAT, "depth"));
            // Without MSAA the scene is drawn straight into the screen's texture.
            self.msaa = (self.samples > 1).then(|| texture(self.config.format, "msaa"));
        }
        if self.shadow_view.is_none() || self.shadow_size != frame.shadow_size {
            self.shadow_size = frame.shadow_size;
            let view = device
                .create_texture(&TextureDescriptor {
                    label: Some("shadow"),
                    size: Extent3d { width: self.shadow_size, height: self.shadow_size, depth_or_array_layers: 1 },
                    mip_level_count: 1,
                    sample_count: 1,
                    dimension: TextureDimension::D2,
                    format: SHADOW_FORMAT,
                    usage: TextureUsages::RENDER_ATTACHMENT | TextureUsages::TEXTURE_BINDING,
                    view_formats: &[],
                })
                .create_view(&TextureViewDescriptor::default());
            self.scene_group = Some(device.create_bind_group(&BindGroupDescriptor {
                label: Some("scene"),
                layout: &gpu.scene_layout,
                entries: &[
                    BindGroupEntry { binding: 0, resource: self.globals.as_entire_binding() },
                    BindGroupEntry { binding: 1, resource: BindingResource::TextureView(&view) },
                ],
            }));
            self.shadow_view = Some(view);
        }
        let needed = used.max(1);
        if self.instances.as_ref().is_none_or(|b| b.capacity < needed) {
            let capacity = needed.next_power_of_two().max(256);
            let buffer = |label, floats: usize| {
                device.create_buffer(&BufferDescriptor {
                    label: Some(label),
                    size: (capacity * floats * 4) as u64,
                    usage: BufferUsages::VERTEX | BufferUsages::COPY_DST,
                    mapped_at_creation: false,
                })
            };
            let regions = buffer("regions", 4);
            // Sources without regions show whole textures.
            let whole: Vec<f32> = (0..capacity).flat_map(|_| [0.0, 0.0, 1.0, 1.0]).collect();
            gpu.queue.write_buffer(&regions, 0, bytes(&whole));
            self.instances = Some(InstanceBuffers { capacity, matrices: buffer("matrices", 16), colors: buffer("colors", 4), regions });
        }
    }
}
