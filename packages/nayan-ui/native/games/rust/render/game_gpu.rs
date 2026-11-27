//! The game scene pipeline and its per-surface resources.
use super::*;
use crate::render::{
    Instances, MeshData, Overlay, VERTEX_FLOATS, cache,
    cull::{Frustum, Sphere, mesh_bounds},
};
use crate::shapes;
use glamx::{Mat4, Vec3};
use std::collections::HashMap;

const DEPTH_FORMAT: TextureFormat = TextureFormat::Depth24Plus;
// 16 bits cover the light's 1..140 depth range to ~0.002 units, well inside the depth bias.
const SHADOW_FORMAT: TextureFormat = TextureFormat::Depth16Unorm;
const GLOBALS_FLOATS: usize = 16 + 16 + 4 * 5;
const MAX_MESHES: usize = crate::MAX_MESHES;
const FLAME_MESH: usize = 9;
const WHITE: i64 = -1;
/// The overlay's depth range: z -100..100 points squeezed into the nearest 0.1% of depth, so it is
/// sorted within itself yet in front of all but what touches the scene camera's near plane.
const OVERLAY_DEPTH: f32 = 1e-3;
/// Cancels the shader's hemisphere tint (0.8 for faces toward the viewer), so with full ambient
/// light the overlay's flat faces show their exact color.
const OVERLAY_LIGHT: f32 = 1.25;

/// The overlay's camera: points from the view's top-left (x right, y up, so on screen y <= 0), z
/// toward the viewer within -100..100, into the front `OVERLAY_DEPTH` of the depth range.
#[allow(deprecated)]
fn overlay_view_proj(width: f32, height: f32) -> Mat4 {
    Mat4::from_scale(Vec3::new(1.0, 1.0, OVERLAY_DEPTH)) * Mat4::orthographic_rh(0.0, width.max(1.0), -height.max(1.0), 0.0, -100.0, 100.0)
}

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
    /// The scene's resolution relative to the drawing size (< 1: drawn smaller, stretched to fill the
    /// screen, with the overlay still drawn at the full size so text stays sharp).
    pub scale: f32,
    /// Smooth the scene's edges after drawing it (FXAA): anti-aliasing for levels without MSAA.
    pub fxaa: bool,
    /// Whether the live scene draws its own shadow map. Without, only a cached backdrop does (live
    /// instances still receive its shadows), saving the shadow pass on frames the backdrop is kept.
    pub live_shadows: bool,
}

impl Frame {
    /// Layout: eye 0..3, target 3..6, fov 6, ortho 7, light direction 8..11, ambient 11, shadows 12,
    /// shadow extent 13, light color 14..17, background 17..20, fog 20, width 21, height 22,
    /// samples 23, shadow size 24, soft shadows 25, and optionally scene scale 26 (default 1),
    /// FXAA 27 (default off) and live shadows 28 (default on).
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
            scale: f.get(26).map_or(1.0, |&s| if s > 0.0 && s < 0.999 { (s as f32).max(0.25) } else { 1.0 }),
            fxaa: f.get(27).is_some_and(|&v| v != 0.0),
            live_shadows: f.get(28).is_none_or(|&v| v != 0.0),
        })
    }
}

/// The camera's view-projection for a frame: right-handed, 0..1 depth (as WebGPU expects).
#[allow(deprecated)] // glam's older camera helpers
pub fn view_projection(frame: &Frame) -> Mat4 {
    let (width, height) = (frame.width.max(1) as f32, frame.height.max(1) as f32);
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
    proj * view
}

/// Where `encode_scene` draws.
enum SceneTarget<'a> {
    /// The surface's texture this frame.
    Screen(&'a TextureView),
    /// The scaled scene's texture, stretched over the screen after.
    SceneColor,
    /// The cached backdrop.
    Backdrop,
}

/// Everything a cached backdrop's pixels depend on besides its instances: the camera, light, sky,
/// fog, size and quality. A change in any of them draws it again.
fn backdrop_values(frame: &Frame, target: &Target) -> [f32; 32] {
    let mut v = [0f32; 32];
    v[0..3].copy_from_slice(&frame.eye);
    v[3..6].copy_from_slice(&frame.target);
    v[6] = frame.fov;
    v[7] = frame.ortho;
    v[8..11].copy_from_slice(&frame.light_direction);
    v[11] = frame.ambient;
    v[12] = frame.shadows as u8 as f32;
    v[13] = frame.shadow_extent;
    v[14..17].copy_from_slice(&frame.light_color);
    v[17..20].copy_from_slice(&frame.background);
    v[20] = frame.fog;
    v[21] = target.game.target_size.0 as f32;
    v[22] = target.game.target_size.1 as f32;
    v[23] = target.game.samples as f32;
    v[24] = frame.shadow_size as f32;
    v[25] = frame.soft_shadows as u8 as f32;
    v
}

/// The mip levels below a texture (half the size each, down to 1 x 1): 2 x 2 box averages, the color
/// weighted by alpha so cut-out edges don't darken, the alpha a plain average (which keeps the share of
/// a cut-out's coverage that alpha-to-coverage draws).
fn mip_chain(width: u32, height: u32, rgba: &[u8]) -> Vec<(u32, u32, Vec<u8>)> {
    let mut out: Vec<(u32, u32, Vec<u8>)> = Vec::new();
    let (mut w, mut h) = (width, height);
    if rgba.len() < (w * h * 4) as usize {
        return out;
    }
    while w > 1 || h > 1 {
        let (nw, nh) = ((w / 2).max(1), (h / 2).max(1));
        let src: &[u8] = out.last().map_or(rgba, |l| &l.2);
        let mut dst = vec![0u8; (nw * nh * 4) as usize];
        for y in 0..nh {
            for x in 0..nw {
                let (mut sum, mut alpha, mut n) = ([0f32; 3], 0f32, 0f32);
                for (dx, dy) in [(0, 0), (1, 0), (0, 1), (1, 1)] {
                    let (sx, sy) = ((x * 2 + dx).min(w - 1), (y * 2 + dy).min(h - 1));
                    let i = ((sy * w + sx) * 4) as usize;
                    let a = src[i + 3] as f32;
                    for c in 0..3 {
                        sum[c] += src[i + c] as f32 * a;
                    }
                    alpha += a;
                    n += 1.0;
                }
                let o = ((y * nw + x) * 4) as usize;
                for c in 0..3 {
                    dst[o + c] = if alpha > 0.0 { (sum[c] / alpha).round() as u8 } else { 0 };
                }
                dst[o + 3] = (alpha / n).round() as u8;
            }
        }
        out.push((nw, nh, dst));
        (w, h) = (nw, nh);
    }
    out
}

/// Puts a scene drawn into its own texture on the screen: stretched (linear filtering) when it was
/// drawn smaller, and with its edges smoothed (FXAA) for levels without MSAA.
struct Compose {
    pipeline: RenderPipeline,
    fxaa: RenderPipeline,
    layout: BindGroupLayout,
    sampler: Sampler,
    module: ShaderModule,
    pipeline_layout: PipelineLayout,
    /// The cached backdrop drawn at the start of a scene pass, per sample count.
    backdrop: HashMap<u32, RenderPipeline>,
}

const COMPOSE_SHADER: &str = r#"
@group(0) @binding(0) var scene: texture_2d<f32>;
@group(0) @binding(1) var linear: sampler;
struct Out {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};
// One triangle covering the screen.
@vertex fn vs(@builtin(vertex_index) i: u32) -> Out {
    let uv = vec2<f32>(f32((i << 1u) & 2u), f32(i & 2u));
    var out: Out;
    out.position = vec4<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 1.0, 1.0);
    out.uv = uv;
    return out;
}
@fragment fn fs(in: Out) -> @location(0) vec4<f32> {
    return textureSampleLevel(scene, linear, in.uv, 0.0);
}
fn at(uv: vec2<f32>) -> vec3<f32> {
    return textureSampleLevel(scene, linear, uv, 0.0).rgb;
}
// Perceptual brightness (the texture holds linear color).
fn luma(c: vec3<f32>) -> f32 {
    return dot(sqrt(c), vec3<f32>(0.299, 0.587, 0.114));
}
// FXAA (after Timothy Lottes' FXAA 3.11, console quality): blends across edges found by contrast,
// in scene texels, so a scaled scene is smoothed before it's stretched.
@fragment fn fs_fxaa(in: Out) -> @location(0) vec4<f32> {
    let px = 1.0 / vec2<f32>(textureDimensions(scene));
    let uv = in.uv;
    let m = textureSampleLevel(scene, linear, uv, 0.0);
    let nw = luma(at(uv + vec2<f32>(-1.0, -1.0) * px));
    let ne = luma(at(uv + vec2<f32>(1.0, -1.0) * px));
    let sw = luma(at(uv + vec2<f32>(-1.0, 1.0) * px));
    let se = luma(at(uv + vec2<f32>(1.0, 1.0) * px));
    let lm = luma(m.rgb);
    let lo = min(lm, min(min(nw, ne), min(sw, se)));
    let hi = max(lm, max(max(nw, ne), max(sw, se)));
    if (hi - lo < max(0.0312, hi * 0.125)) {
        return m;
    }
    var dir = vec2<f32>(-((nw + ne) - (sw + se)), (nw + sw) - (ne + se));
    let reduce = max((nw + ne + sw + se) * (0.25 / 8.0), 1.0 / 128.0);
    let scale = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
    dir = clamp(dir * scale, vec2<f32>(-8.0), vec2<f32>(8.0)) * px;
    let a = 0.5 * (at(uv + dir * (1.0 / 3.0 - 0.5)) + at(uv + dir * (2.0 / 3.0 - 0.5)));
    let b = a * 0.5 + 0.25 * (at(uv - dir * 0.5) + at(uv + dir * 0.5));
    let lb = luma(b);
    if (lb < lo || lb > hi) {
        return vec4<f32>(a, m.a);
    }
    return vec4<f32>(b, m.a);
}
"#;

struct Pipelines {
    opaque: RenderPipeline,
    cutout: RenderPipeline,
    blend: RenderPipeline,
    add: RenderPipeline,
    opaque_skin: RenderPipeline,
    cutout_skin: RenderPipeline,
    blend_skin: RenderPipeline,
    add_skin: RenderPipeline,
}

/// A coarser version of a mesh: an index buffer over the mesh's own vertices.
struct LodLevel {
    indices: Buffer,
    count: u32,
}

/// A heavy mesh's coarser versions (finest first) and the error of each, relative to its size.
struct Lods {
    version: u64,
    errors: Vec<f32>,
    levels: Vec<LodLevel>,
}

/// Meshes with at least this many triangles get coarser versions, built off the render thread
/// (native only: WASM has no worker thread for them and draws full meshes).
#[cfg(not(target_arch = "wasm32"))]
const LOD_MIN_TRIANGLES: usize = 1500;
/// A coarser version draws only where its error stays under this many pixels on screen: a device
/// pixel, under 4x MSAA on a phone or tablet screen, is below what the eye resolves.
const LOD_PIXELS: f32 = 1.0;
/// In the shadow pass, texels of the shadow map: it is read through 2x2 filtered taps, so a caster's
/// outline can move by a couple of texels unseen (the heaviest scenes draw most of their triangles twice).
const SHADOW_LOD_TEXELS: f32 = 2.0;

/// A mesh's coarser versions as the worker returns them: (id, version, [(error, indices)]).
#[cfg(not(target_arch = "wasm32"))]
type LodResult = (crate::MeshId, u64, Vec<(f32, Vec<u32>)>);

/// Simplifies heavy meshes on a thread of its own and hands the levels back.
#[cfg(not(target_arch = "wasm32"))]
struct LodWorker {
    jobs: std::sync::mpsc::Sender<(crate::MeshId, Arc<MeshData>)>,
    done: std::sync::mpsc::Receiver<LodResult>,
    pending: HashMap<crate::MeshId, u64>,
}

#[cfg(not(target_arch = "wasm32"))]
impl LodWorker {
    fn start() -> Option<Self> {
        let (jobs, inbox) = std::sync::mpsc::channel::<(crate::MeshId, Arc<MeshData>)>();
        let (outbox, done) = std::sync::mpsc::channel();
        std::thread::Builder::new()
            .name("nayan-lod".into())
            .spawn(move || {
                for (id, data) in inbox {
                    let levels = crate::assets::geometry::lod_levels(&data.vertices, &data.indices);
                    if outbox.send((id, data.version, levels)).is_err() {
                        break;
                    }
                }
            })
            .ok()?;
        Some(LodWorker {
            jobs,
            done,
            pending: HashMap::new(),
        })
    }
}

struct GpuMesh {
    version: u64,
    vertices: Buffer,
    skin: Option<Buffer>,
    indices: Buffer,
    format: IndexFormat,
    count: u32,
    material: BindGroup,
    cutout: bool,
    /// Bounds in the mesh's own space, for culling.
    bounds: Sphere,
}

pub(super) struct GameGpu {
    module: ShaderModule,
    scene_layout: BindGroupLayout,
    /// Compares a depth with the shadow map's, filtering the 2x2 results (hardware PCF).
    shadow_sampler: Sampler,
    /// Added to attachments that never leave a pass (MSAA color, depth) where that saves memory and
    /// bandwidth: on tile GPUs they then live only in tile memory, never written out.
    transient: TextureUsages,
    shadow_layout: BindGroupLayout,
    texture_layout: BindGroupLayout,
    pipeline_layout: PipelineLayout,
    skin_pipeline_layout: PipelineLayout,
    shadow_pipeline: RenderPipeline,
    shadow_skin_pipeline: RenderPipeline,
    skin_layout: BindGroupLayout,
    default_skin: BoneBuffer,
    sampler: Sampler,
    pipelines: HashMap<(TextureFormat, u32), Pipelines>,
    compose: HashMap<TextureFormat, Compose>,
    meshes: HashMap<crate::MeshId, GpuMesh>,
    /// Coarser versions of heavy meshes, drawn where an instance looks small (shadows too).
    lods: HashMap<crate::MeshId, Lods>,
    #[cfg(not(target_arch = "wasm32"))]
    lod_worker: Option<LodWorker>,
    textures: HashMap<i64, (TextureView, bool)>,
    /// GPU copies of dynamic textures (drawing documents), refreshed from their dirty rectangles.
    dynamic: HashMap<i64, Texture>,
    materials: HashMap<(i64, u32), BindGroup>,
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

impl GameGpu {
    pub(super) fn new(adapter: &Adapter, device: &Device, queue: &Queue) -> Self {
        let module = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("scene"),
            source: ShaderSource::Wgsl(include_str!("shader.wgsl").into()),
        });
        let uniform = |binding, visibility| BindGroupLayoutEntry {
            binding,
            visibility,
            ty: BindingType::Buffer {
                ty: BufferBindingType::Uniform,
                has_dynamic_offset: false,
                min_binding_size: None,
            },
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
        // The shadow map is read through a comparison sampler: the GPU filters 2x2 depth tests per tap.
        let scene_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("scene"),
            entries: &[
                uniform(0, ShaderStages::VERTEX_FRAGMENT),
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::FRAGMENT,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Depth,
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::FRAGMENT,
                    ty: BindingType::Sampler(SamplerBindingType::Comparison),
                    count: None,
                },
            ],
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
        let skin_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("bones"),
            entries: &[uniform(0, ShaderStages::VERTEX)],
        });
        let default_skin = BoneBuffer::new(device, &skin_layout);
        queue.write_buffer(&default_skin.buffer, 0, bytes(&crate::assets::skeleton::SkinDraw::new(0).matrices));
        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("scene"),
            bind_group_layouts: &[Some(&scene_layout), Some(&texture_layout)],
            immediate_size: 0,
        });
        let skin_pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("skinned scene"),
            bind_group_layouts: &[Some(&scene_layout), Some(&texture_layout), Some(&skin_layout)],
            immediate_size: 0,
        });
        let shadow_pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("shadow"),
            bind_group_layouts: &[Some(&shadow_layout)],
            immediate_size: 0,
        });
        let shadow_skin_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("skinned shadow"),
            bind_group_layouts: &[Some(&shadow_layout), Some(&texture_layout), Some(&skin_layout)],
            immediate_size: 0,
        });
        let static_layouts = vertex_layouts();
        let skinned_layouts = skin_vertex_layouts();
        let make_shadow = |skinned: bool| {
            device.create_render_pipeline(&RenderPipelineDescriptor {
                label: Some("shadow"),
                layout: Some(if skinned { &shadow_skin_layout } else { &shadow_pipeline_layout }),
                vertex: VertexState {
                    module: &module,
                    entry_point: Some(if skinned { "vs_skin_shadow" } else { "vs_shadow" }),
                    compilation_options: Default::default(),
                    buffers: if skinned { &skinned_layouts } else { &static_layouts[..2] },
                },
                primitive: PrimitiveState {
                    cull_mode: Some(Face::Back),
                    ..Default::default()
                },
                // Slope-scaled bias keeps surfaces from shadowing themselves ("acne").
                depth_stencil: Some(DepthStencilState {
                    format: SHADOW_FORMAT,
                    depth_write_enabled: Some(true),
                    depth_compare: Some(CompareFunction::Less),
                    stencil: StencilState::default(),
                    bias: DepthBiasState {
                        constant: 2,
                        slope_scale: 2.0,
                        clamp: 0.0,
                    },
                }),
                multisample: MultisampleState::default(),
                fragment: None,
                multiview_mask: None,
                cache: None,
            })
        };
        let shadow_pipeline = make_shadow(false);
        let shadow_skin_pipeline = make_shadow(true);
        // Trilinear: textures carry mip chains, so distant and tilted surfaces read a few texels each
        let sampler = device.create_sampler(&SamplerDescriptor {
            address_mode_u: AddressMode::Repeat,
            address_mode_v: AddressMode::Repeat,
            mag_filter: FilterMode::Linear,
            min_filter: FilterMode::Linear,
            mipmap_filter: MipmapFilterMode::Linear,
            ..Default::default()
        });
        // Tile GPUs (mobile, Apple) keep attachments that are only cleared and discarded in tile memory
        let transient = if adapter.get_info().transient_saves_memory == Some(true) {
            TextureUsages::TRANSIENT_ATTACHMENT
        } else {
            TextureUsages::empty()
        };
        let shadow_sampler = device.create_sampler(&SamplerDescriptor {
            label: Some("shadow"),
            mag_filter: FilterMode::Linear,
            min_filter: FilterMode::Linear,
            compare: Some(CompareFunction::LessEqual),
            ..Default::default()
        });
        Self {
            shadow_sampler,
            transient,
            module,
            scene_layout,
            shadow_layout,
            texture_layout,
            pipeline_layout,
            skin_pipeline_layout,
            shadow_pipeline,
            shadow_skin_pipeline,
            skin_layout,
            default_skin,
            sampler,
            pipelines: HashMap::new(),
            compose: HashMap::new(),
            meshes: HashMap::new(),
            lods: HashMap::new(),
            #[cfg(not(target_arch = "wasm32"))]
            lod_worker: LodWorker::start(),
            textures: HashMap::new(),
            dynamic: HashMap::new(),
            materials: HashMap::new(),
        }
    }
}

impl Gpu {
    #[cfg(not(target_arch = "wasm32"))]
    pub(super) fn warm_game_pipelines(mut self) -> Self {
        // The common screen format; other formats are compiled when first drawn.
        #[cfg(target_vendor = "apple")]
        let format = TextureFormat::Bgra8Unorm;
        #[cfg(not(target_vendor = "apple"))]
        let format = TextureFormat::Rgba8Unorm;
        for samples in [4, 1] {
            self.pipelines(format, samples);
        }
        self
    }

    fn ensure_compose(&mut self, format: TextureFormat) {
        if self.game.compose.contains_key(&format) {
            return;
        }
        let device = &self.device;
        let module = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("compose"),
            source: ShaderSource::Wgsl(COMPOSE_SHADER.into()),
        });
        let layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("compose"),
            entries: &[
                BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::FRAGMENT,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: true },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::FRAGMENT,
                    ty: BindingType::Sampler(SamplerBindingType::Filtering),
                    count: None,
                },
            ],
        });
        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("compose"),
            bind_group_layouts: &[Some(&layout)],
            immediate_size: 0,
        });
        let make = |entry: &str| {
            device.create_render_pipeline(&RenderPipelineDescriptor {
                label: Some(entry),
                layout: Some(&pipeline_layout),
                vertex: VertexState {
                    module: &module,
                    entry_point: Some("vs"),
                    compilation_options: Default::default(),
                    buffers: &[],
                },
                primitive: PrimitiveState::default(),
                // The overlay drawn after it in the same pass tests depth: the scene is behind it.
                depth_stencil: Some(DepthStencilState {
                    format: DEPTH_FORMAT,
                    depth_write_enabled: Some(false),
                    depth_compare: Some(CompareFunction::Always),
                    stencil: StencilState::default(),
                    bias: DepthBiasState::default(),
                }),
                multisample: MultisampleState::default(),
                fragment: Some(FragmentState {
                    module: &module,
                    entry_point: Some(entry),
                    compilation_options: Default::default(),
                    targets: &[Some(ColorTargetState {
                        format,
                        blend: None,
                        write_mask: ColorWrites::ALL,
                    })],
                }),
                multiview_mask: None,
                cache: None,
            })
        };
        let (pipeline, fxaa) = (make("fs"), make("fs_fxaa"));
        let sampler = device.create_sampler(&SamplerDescriptor {
            address_mode_u: AddressMode::ClampToEdge,
            address_mode_v: AddressMode::ClampToEdge,
            mag_filter: FilterMode::Linear,
            min_filter: FilterMode::Linear,
            ..Default::default()
        });
        self.game.compose.insert(
            format,
            Compose {
                pipeline,
                fxaa,
                layout,
                sampler,
                module,
                pipeline_layout,
                backdrop: HashMap::new(),
            },
        );
    }

    /// The pipeline that lays a cached backdrop over a scene pass's cleared target (`samples` per pixel).
    fn ensure_backdrop_pipeline(&mut self, format: TextureFormat, samples: u32) {
        self.ensure_compose(format);
        let device = &self.device;
        let compose = self.game.compose.get_mut(&format).expect("compose");
        if compose.backdrop.contains_key(&samples) {
            return;
        }
        let pipeline = device.create_render_pipeline(&RenderPipelineDescriptor {
            label: Some("backdrop"),
            layout: Some(&compose.pipeline_layout),
            vertex: VertexState {
                module: &compose.module,
                entry_point: Some("vs"),
                compilation_options: Default::default(),
                buffers: &[],
            },
            primitive: PrimitiveState::default(),
            // Behind everything: the scene drawn after it tests against cleared depth.
            depth_stencil: Some(DepthStencilState {
                format: DEPTH_FORMAT,
                depth_write_enabled: Some(false),
                depth_compare: Some(CompareFunction::Always),
                stencil: StencilState::default(),
                bias: DepthBiasState::default(),
            }),
            multisample: MultisampleState {
                count: samples,
                ..Default::default()
            },
            fragment: Some(FragmentState {
                module: &compose.module,
                entry_point: Some("fs"),
                compilation_options: Default::default(),
                targets: &[Some(ColorTargetState {
                    format,
                    blend: None,
                    write_mask: ColorWrites::ALL,
                })],
            }),
            multiview_mask: None,
            cache: None,
        });
        compose.backdrop.insert(samples, pipeline);
    }

    fn pipelines(&mut self, format: TextureFormat, samples: u32) -> &Pipelines {
        let key = (format, samples);
        if !self.game.pipelines.contains_key(&key) {
            let static_layouts = vertex_layouts();
            let skinned_layouts = skin_vertex_layouts();
            let make = |entry: &str, mode: u8, skinned: bool| {
                let transparent = mode != 0;
                // Cut-outs with MSAA turn their alpha into coverage (smooth edges); the alpha channel
                // itself isn't written, so the screen stays opaque.
                let coverage = entry == "fs_cutout_a2c";
                let blend = match mode {
                    1 => Some(BlendState {
                        color: BlendComponent {
                            src_factor: BlendFactor::SrcAlpha,
                            dst_factor: BlendFactor::OneMinusSrcAlpha,
                            operation: BlendOperation::Add,
                        },
                        alpha: BlendComponent {
                            src_factor: BlendFactor::One,
                            dst_factor: BlendFactor::OneMinusSrcAlpha,
                            operation: BlendOperation::Add,
                        },
                    }),
                    2 => Some(BlendState {
                        color: BlendComponent {
                            src_factor: BlendFactor::SrcAlpha,
                            dst_factor: BlendFactor::One,
                            operation: BlendOperation::Add,
                        },
                        alpha: BlendComponent {
                            src_factor: BlendFactor::Zero,
                            dst_factor: BlendFactor::One,
                            operation: BlendOperation::Add,
                        },
                    }),
                    _ => None,
                };
                self.device.create_render_pipeline(&RenderPipelineDescriptor {
                    label: Some(entry),
                    layout: Some(if skinned {
                        &self.game.skin_pipeline_layout
                    } else {
                        &self.game.pipeline_layout
                    }),
                    vertex: VertexState {
                        module: &self.game.module,
                        entry_point: Some(if skinned { "vs_skin" } else { "vs" }),
                        compilation_options: Default::default(),
                        buffers: if skinned { &skinned_layouts } else { &static_layouts },
                    },
                    primitive: PrimitiveState {
                        cull_mode: Some(Face::Back),
                        ..Default::default()
                    },
                    // See-through surfaces are tested against depth but don't hide what's behind them.
                    depth_stencil: Some(DepthStencilState {
                        format: DEPTH_FORMAT,
                        depth_write_enabled: Some(!transparent),
                        depth_compare: Some(CompareFunction::Less),
                        stencil: StencilState::default(),
                        bias: DepthBiasState::default(),
                    }),
                    multisample: MultisampleState {
                        count: samples,
                        alpha_to_coverage_enabled: coverage,
                        ..Default::default()
                    },
                    fragment: Some(FragmentState {
                        module: &self.game.module,
                        entry_point: Some(entry),
                        compilation_options: Default::default(),
                        targets: &[Some(ColorTargetState {
                            format,
                            blend,
                            write_mask: if coverage { ColorWrites::COLOR } else { ColorWrites::ALL },
                        })],
                    }),
                    multiview_mask: None,
                    cache: None,
                })
            };
            let cutout = if samples > 1 { "fs_cutout_a2c" } else { "fs_cutout" };
            let pipelines = Pipelines {
                opaque: make("fs_opaque", 0, false),
                cutout: make(cutout, 0, false),
                blend: make("fs_blend", 1, false),
                add: make("fs_blend", 2, false),
                opaque_skin: make("fs_opaque", 0, true),
                cutout_skin: make(cutout, 0, true),
                blend_skin: make("fs_blend", 1, true),
                add_skin: make("fs_blend", 2, true),
            };
            self.game.pipelines.insert(key, pipelines);
        }
        &self.game.pipelines[&key]
    }

    /// Uploads changed rows of dynamic textures and drops the GPU copies of released ones.
    fn refresh_dynamic(&mut self) {
        use crate::assets::texture::{Upload, upload_dynamic};
        let mut released = Vec::new(); // allocates only when something was released
        for (&id, texture) in &self.game.dynamic {
            let upload = upload_dynamic(id as u32, false, |rect, pixels, stride| self.write_pixels(texture, rect, pixels, stride));
            if upload == Upload::Released {
                released.push(id);
            }
        }
        for id in released {
            self.game.dynamic.remove(&id);
            self.game.textures.remove(&id);
            self.game.materials.retain(|(texture, _), _| *texture != id);
        }
    }

    fn texture(&mut self, id: i64) -> (TextureView, bool) {
        if let Some(t) = self.game.textures.get(&id) {
            return t.clone();
        }
        let mut created = None;
        if id >= 0 {
            crate::assets::texture::upload_dynamic(id as u32, true, |rect, pixels, stride| {
                let texture = self.device.create_texture(&TextureDescriptor {
                    label: Some("dynamic texture"),
                    size: Extent3d {
                        width: rect[2],
                        height: rect[3],
                        depth_or_array_layers: 1,
                    },
                    mip_level_count: 1,
                    sample_count: 1,
                    dimension: TextureDimension::D2,
                    format: TextureFormat::Rgba8Unorm,
                    usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
                    view_formats: &[],
                });
                self.write_pixels(&texture, rect, pixels, stride);
                created = Some(texture);
            });
        }
        if let Some(texture) = created {
            // Paper is transparent: transparent texels are cut out rather than drawn black.
            let entry = (texture.create_view(&TextureViewDescriptor::default()), true);
            self.game.textures.insert(id, entry.clone());
            self.game.dynamic.insert(id, texture);
            return entry;
        }
        let white = crate::assets::texture::Image {
            source_size: None,
            width: 1,
            height: 1,
            rgba: vec![255; 4],
        };
        let image = if id == WHITE { None } else { crate::assets::texture::get(id as u32) };
        let image = image.as_deref().unwrap_or(&white);
        let levels = mip_chain(image.width, image.height, &image.rgba);
        let texture = self.device.create_texture(&TextureDescriptor {
            label: Some("texture"),
            size: Extent3d {
                width: image.width,
                height: image.height,
                depth_or_array_layers: 1,
            },
            mip_level_count: levels.len() as u32 + 1,
            sample_count: 1,
            dimension: TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
            view_formats: &[],
        });
        let base = (image.width, image.height, &image.rgba[..]);
        for (level, (width, height, rgba)) in std::iter::once(base).chain(levels.iter().map(|(w, h, p)| (*w, *h, &p[..]))).enumerate() {
            self.queue.write_texture(
                TexelCopyTextureInfo {
                    texture: &texture,
                    mip_level: level as u32,
                    origin: Origin3d::ZERO,
                    aspect: TextureAspect::All,
                },
                rgba,
                TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(width * 4),
                    rows_per_image: Some(height),
                },
                Extent3d {
                    width,
                    height,
                    depth_or_array_layers: 1,
                },
            );
        }
        let cutout = image.rgba.chunks_exact(4).any(|p| p[3] < 128);
        let entry = (texture.create_view(&TextureViewDescriptor::default()), cutout);
        self.game.textures.insert(id, entry.clone());
        entry
    }

    fn material(&mut self, texture: i64, shine: f32) -> (BindGroup, bool) {
        let (view, cutout) = self.texture(texture);
        let key = (texture, shine.to_bits());
        if let Some(group) = self.game.materials.get(&key) {
            return (group.clone(), cutout);
        }
        let buffer = self.device.create_buffer(&BufferDescriptor {
            label: Some("material"),
            size: 16,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        self.queue
            .write_buffer(&buffer, 0, bytes(&[shine, if texture >= 0 { 1.0 } else { 0.0 }, 0.0, 0.0]));
        let group = self.device.create_bind_group(&BindGroupDescriptor {
            label: Some("material"),
            layout: &self.game.texture_layout,
            entries: &[
                BindGroupEntry {
                    binding: 0,
                    resource: BindingResource::TextureView(&view),
                },
                BindGroupEntry {
                    binding: 1,
                    resource: BindingResource::Sampler(&self.game.sampler),
                },
                BindGroupEntry {
                    binding: 2,
                    resource: buffer.as_entire_binding(),
                },
            ],
        });
        self.game.materials.insert(key, group.clone());
        (group, cutout)
    }

    /// Uploads (or refreshes) the GPU copy of mesh `id`. False if it has nothing to draw.
    fn ensure_mesh(&mut self, id: crate::MeshId, meshes: &std::collections::BTreeMap<crate::MeshId, Arc<MeshData>>) -> bool {
        let Some(data) = meshes.get(&id) else { return false };
        if self.game.meshes.get(&id).is_some_and(|m| m.version == data.version) {
            return true;
        }
        if data.indices.is_empty() || data.vertices.len() < VERTEX_FLOATS {
            return false;
        }
        let buffer = |label, contents: &[u8], usage| {
            let size = (contents.len() as u64).div_ceil(4) * 4;
            let buffer = self.device.create_buffer(&BufferDescriptor {
                label: Some(label),
                size,
                usage: usage | BufferUsages::COPY_DST,
                mapped_at_creation: false,
            });
            let mut padded = contents.to_vec();
            padded.resize(size as usize, 0);
            self.queue.write_buffer(&buffer, 0, &padded);
            buffer
        };
        let vertices = buffer("vertices", bytes(&data.vertices), BufferUsages::VERTEX);
        let skin = (!data.skin.is_empty()).then(|| buffer("skin weights", bytes(&data.skin), BufferUsages::VERTEX));
        // 16-bit indices halve index fetches; every built-in shape and most models fit.
        let short = data.vertices.len() / VERTEX_FLOATS <= 0x10000;
        let (indices, format) = if short {
            let small: Vec<u16> = data.indices.iter().map(|&i| i as u16).collect();
            (buffer("indices", bytes(&small), BufferUsages::INDEX), IndexFormat::Uint16)
        } else {
            (buffer("indices", bytes(&data.indices), BufferUsages::INDEX), IndexFormat::Uint32)
        };
        let (material, cutout) = self.material(data.texture.map(i64::from).unwrap_or(WHITE), data.shine);
        let bounds = mesh_bounds(&data.vertices);
        self.game.lods.remove(&id);
        #[cfg(not(target_arch = "wasm32"))]
        if data.skin.is_empty()
            && data.indices.len() / 3 >= LOD_MIN_TRIANGLES
            && let Some(worker) = &mut self.game.lod_worker
            && worker.pending.get(&id) != Some(&data.version)
            && worker.jobs.send((id, data.clone())).is_ok()
        {
            worker.pending.insert(id, data.version);
        }
        self.game.meshes.insert(
            id,
            GpuMesh {
                version: data.version,
                vertices,
                skin,
                indices,
                format,
                count: data.indices.len() as u32,
                material,
                cutout,
                bounds,
            },
        );
        true
    }

    /// Uploads the coarser versions the LOD worker has finished, for meshes still at that version.
    fn take_lods(&mut self) {
        #[cfg(not(target_arch = "wasm32"))]
        {
            let Some(worker) = &mut self.game.lod_worker else { return };
            let finished: Vec<_> = worker.done.try_iter().collect();
            for (id, version, levels) in finished {
                if let Some(w) = self.game.lod_worker.as_mut()
                    && w.pending.get(&id) == Some(&version)
                {
                    w.pending.remove(&id);
                }
                let Some(mesh) = self.game.meshes.get(&id).filter(|m| m.version == version) else {
                    continue;
                };
                let short = mesh.format == IndexFormat::Uint16;
                let mut lods = Lods {
                    version,
                    errors: Vec::new(),
                    levels: Vec::new(),
                };
                for (error, indices) in levels {
                    let contents = if short {
                        bytes(&indices.iter().map(|&i| i as u16).collect::<Vec<u16>>()).to_vec()
                    } else {
                        bytes(&indices).to_vec()
                    };
                    let size = (contents.len() as u64).div_ceil(4) * 4;
                    let buffer = self.device.create_buffer(&BufferDescriptor {
                        label: Some("lod indices"),
                        size,
                        usage: BufferUsages::INDEX | BufferUsages::COPY_DST,
                        mapped_at_creation: false,
                    });
                    let mut padded = contents;
                    padded.resize(size as usize, 0);
                    self.queue.write_buffer(&buffer, 0, &padded);
                    lods.errors.push(error);
                    lods.levels.push(LodLevel {
                        indices: buffer,
                        count: indices.len() as u32,
                    });
                }
                if !lods.levels.is_empty() {
                    self.game.lods.insert(id, lods);
                }
            }
        }
    }

    // glam's older camera helpers: right-handed, 0..1 depth, as WebGPU expects.
    #[allow(deprecated)]
    /// Draws one frame. None when the surface skipped it (busy, occluded or just reconfigured).
    pub fn render(
        &mut self,
        target: &mut Target,
        meshes: &std::collections::BTreeMap<crate::MeshId, Arc<MeshData>>,
        frame: &Frame,
        inst: &Instances,
    ) -> Result<Option<[f32; 16]>, String> {
        if frame.width == 0 || frame.height == 0 {
            return Ok(None);
        }
        target.resize(self, frame.width, frame.height);
        self.refresh_dynamic();
        let used = inst.count.min(inst.matrices.len() / 16).min(inst.colors.len() / 4);
        if frame.scale < 1.0 || frame.fxaa || target.game.backdrop.is_some() {
            self.ensure_compose(target.config.format);
        }
        // Room for the larger of the scene and the backdrop (drawn one after the other).
        let backdrop_count = target.game.backdrop.as_ref().map_or(0, |b| b.count);
        target.prepare(self, frame, used.max(backdrop_count));
        while target.game.skins.len() < inst.skins.len() {
            target.game.skins.push(BoneBuffer::new(&self.device, &self.game.skin_layout));
        }
        target.game.skins.truncate(inst.skins.len());
        for (buffer, draw) in target.game.skins.iter_mut().zip(inst.skins) {
            buffer.instance = draw.instance;
            write_cached(&self.queue, &buffer.buffer, &mut buffer.cache, &draw.matrices);
        }

        // Camera.
        let view_proj = view_projection(frame);
        let look = Vec3::from(frame.target);

        // Light: orthographic, covering `extent` around the camera target, snapped to texels to avoid shimmer.
        let direction = Vec3::from(frame.light_direction).normalize_or(Vec3::Y);
        let mut light_view_proj = Mat4::IDENTITY;
        if frame.shadows {
            let extent = if frame.shadow_extent > 0.0 { frame.shadow_extent } else { 30.0 };
            let texel = 2.0 * extent / target.game.shadow_size as f32;
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
        // Without live shadows the map holds only the backdrop's casters: sampled only when there is one.
        let receives = frame.shadows && (frame.live_shadows || target.game.backdrop.is_some());
        g[37] = if receives { 1.0 } else { 0.0 };
        g[38] = 0.0005;
        g[39] = if target.srgb { 1.0 } else { 0.0 };
        g[40..43].copy_from_slice(&frame.eye);
        g[43] = 1.0;
        g[44..47].copy_from_slice(&frame.background);
        g[47] = frame.fog.max(0.0);
        g[48..51].copy_from_slice(&frame.light_color);
        g[51] = 1.0;
        write_cached(&self.queue, &target.game.globals, &mut target.game.globals_cache, &g);

        // The overlay: its own camera (points), full ambient light, no shadows or fog.
        let overlay = target.game.overlay.as_ref();
        let overlay_inst = overlay.map(|o| o.instances());
        let overlay_used = overlay_inst.as_ref().map_or(0, |o| o.count);
        if let (Some(o), Some(oi)) = (overlay, &overlay_inst)
            && overlay_used > 0
        {
            let mut g = [0f32; GLOBALS_FLOATS];
            g[0..16].copy_from_slice(&overlay_view_proj(o.width, o.height).to_cols_array());
            g[32..36].copy_from_slice(&[0.0, 0.0, 1.0, 1.0]); // light toward the viewer, ambient 1
            g[39] = if target.srgb { 1.0 } else { 0.0 };
            g[40..44].copy_from_slice(&[o.width / 2.0, -o.height / 2.0, 1000.0, 1.0]);
            g[48..52].copy_from_slice(&[OVERLAY_LIGHT, OVERLAY_LIGHT, OVERLAY_LIGHT, 1.0]);
            write_cached(&self.queue, &target.game.overlay_globals, &mut target.game.overlay_globals_cache, &g);
            target
                .game
                .overlay_instances
                .as_mut()
                .expect("prepared")
                .upload(&self.queue, oi, overlay_used);
        }

        let mesh_limit = crate::assets::model::mesh_count().min(MAX_MESHES);
        if let Some(oi) = &overlay_inst {
            target.game.overlay_batches.update(oi.ranges, overlay_used, mesh_limit);
            for batch in target.game.overlay_batches.opaque.iter().chain(&target.game.overlay_batches.transparent) {
                self.ensure_mesh(batch.mesh, meshes);
            }
        }
        let format = target.config.format;
        let samples = target.game.samples;
        self.pipelines(format, samples);
        // A scaled scene: the overlay is drawn over the stretched scene, at full size without MSAA.
        let composed = target.game.compose_group.is_some() && target.game.overlay_depth.is_some() && target.game.scene_color.is_some();
        if composed {
            self.pipelines(format, 1);
        }
        let backdrop = target.game.backdrop.is_some() && target.game.backdrop_group.is_some();
        if backdrop {
            self.ensure_backdrop_pipeline(format, samples);
            // Drawn again only when it or what it was drawn with changes; submitted at once, since the
            // live scene reuses the same instance buffers.
            let drawn = backdrop_values(frame, target);
            if target.game.backdrop_dirty || target.game.backdrop_drawn != Some(drawn) {
                let b = target.game.backdrop.take().expect("backdrop");
                let mut encoder = self.device.create_command_encoder(&CommandEncoderDescriptor::default());
                self.encode_scene(
                    target,
                    meshes,
                    frame,
                    &b.instances(),
                    [view_proj, light_view_proj],
                    &mut encoder,
                    SceneTarget::Backdrop,
                );
                self.queue.submit([encoder.finish()]);
                target.game.backdrop = Some(b);
                target.game.backdrop_dirty = false;
                target.game.backdrop_drawn = Some(drawn);
            }
        }

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
        let into = if composed {
            SceneTarget::SceneColor
        } else {
            SceneTarget::Screen(&screen)
        };
        self.encode_scene(target, meshes, frame, inst, [view_proj, light_view_proj], &mut encoder, into);
        if composed {
            let mut pass = encoder.begin_render_pass(&RenderPassDescriptor {
                label: Some("compose"),
                color_attachments: &[Some(RenderPassColorAttachment {
                    view: &screen,
                    depth_slice: None,
                    resolve_target: None,
                    ops: Operations {
                        load: LoadOp::Clear(Color::BLACK),
                        store: StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: Some(RenderPassDepthStencilAttachment {
                    view: target.game.overlay_depth.as_ref().expect("composed"),
                    depth_ops: Some(Operations {
                        load: LoadOp::Clear(1.0),
                        store: StoreOp::Discard,
                    }),
                    stencil_ops: None,
                }),
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            let compose = &self.game.compose[&format];
            pass.set_pipeline(if frame.fxaa { &compose.fxaa } else { &compose.pipeline });
            pass.set_bind_group(0, target.game.compose_group.as_ref().expect("composed"), &[]);
            pass.draw(0..3, 0..1);
            if overlay_used > 0 {
                self.draw_overlay(&mut pass, target, &self.game.pipelines[&(format, 1)]);
            }
        }
        self.queue.submit([encoder.finish()]);
        self.queue.present(surface_texture);
        Ok(Some(view_proj.to_cols_array()))
    }

    /// Culls, uploads and draws `inst` (with its shadows) into a scene target: the cached backdrop, or
    /// the frame (the backdrop laid down first, the overlay last when it shares the pass).
    #[allow(clippy::too_many_arguments)]
    fn encode_scene(
        &mut self,
        target: &mut Target,
        meshes: &std::collections::BTreeMap<crate::MeshId, Arc<MeshData>>,
        frame: &Frame,
        inst: &Instances,
        [view_proj, light_view_proj]: [Mat4; 2],
        encoder: &mut CommandEncoder,
        into: SceneTarget,
    ) {
        let backdrop_pass = matches!(into, SceneTarget::Backdrop);
        let used = inst.count.min(inst.matrices.len() / 16).min(inst.colors.len() / 4);
        let mesh_limit = crate::assets::model::mesh_count().min(MAX_MESHES);
        target.game.batches.update(inst.ranges, used, mesh_limit);
        self.take_lods();
        // Upload before recording: the passes borrow these meshes.
        for batch in target.game.batches.opaque.iter().chain(&target.game.batches.transparent) {
            self.ensure_mesh(batch.mesh, meshes);
            if batch.mesh == shapes::SPHERE {
                for (_, lod) in SPHERE_LODS {
                    self.ensure_mesh(lod, meshes);
                }
            }
        }
        // Only what the camera (and, for shadows, the light's box) may see is uploaded and drawn.
        let gpu_meshes = &self.game.meshes;
        let gpu_lods = &self.game.lods;
        let mesh_info = |id: crate::MeshId| {
            gpu_meshes.get(&id).map(|m| {
                let errors = gpu_lods.get(&id).filter(|l| l.version == m.version).map_or(&[][..], |l| &l.errors[..]);
                (m.bounds, m.skin.is_some(), errors)
            })
        };
        let (opaque, transparent) = (&target.game.batches.opaque, &target.game.batches.transparent);
        target.game.culled.fill(
            [opaque, transparent],
            inst,
            used,
            &Frustum::new(view_proj),
            target.game.target_size.1 as f32 / 2.0,
            &mesh_info,
            true,
        );
        target
            .game
            .instances
            .as_mut()
            .expect("prepared")
            .upload_culled(&self.queue, &target.game.culled);
        let shadows = frame.shadows && (frame.live_shadows || backdrop_pass) && used > 0;
        if shadows {
            target.game.shadow_culled.fill(
                [opaque, &[]],
                inst,
                used,
                &Frustum::new(light_view_proj),
                target.game.shadow_size as f32 / 2.0,
                &mesh_info,
                false,
            );
            target
                .game
                .shadow_instances
                .as_mut()
                .expect("prepared")
                .upload_culled(&self.queue, &target.game.shadow_culled);
        }
        let format = target.config.format;
        let samples = target.game.samples;
        // The backdrop holds no skinned characters' poses: those belong to the live scene.
        let skins: &[BoneBuffer] = if backdrop_pass { &[] } else { &target.game.skins };
        let buffers = target.game.instances.as_ref().expect("prepared");

        // A backdrop always clears the map, even with no casters: live instances may read it all frame.
        if shadows && (target.game.shadow_culled.len() > 0 || backdrop_pass) {
            let mut pass = encoder.begin_render_pass(&RenderPassDescriptor {
                label: Some("shadow"),
                color_attachments: &[],
                depth_stencil_attachment: Some(RenderPassDepthStencilAttachment {
                    view: target.game.shadow_view.as_ref().expect("prepared"),
                    depth_ops: Some(Operations {
                        load: LoadOp::Clear(1.0),
                        store: StoreOp::Store,
                    }),
                    stencil_ops: None,
                }),
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            pass.set_pipeline(&self.game.shadow_pipeline);
            pass.set_bind_group(0, &target.game.shadow_group, &[]);
            let casters = target.game.shadow_instances.as_ref().expect("prepared");
            self.draw(&mut pass, casters, &target.game.shadow_culled.opaque, Only::All, None, skins); // see-through instances don't cast shadows
        }

        let [r, g, b] = frame.background.map(f64::from);
        let clear = if target.srgb { [r, g, b].map(|c| c.powf(2.2)) } else { [r, g, b] };
        let clear = Color {
            r: clear[0],
            g: clear[1],
            b: clear[2],
            a: 1.0,
        };
        let scene = match into {
            SceneTarget::Screen(view) => view,
            SceneTarget::SceneColor => target.game.scene_color.as_ref().expect("composed"),
            SceneTarget::Backdrop => target.game.backdrop_color.as_ref().expect("backdrop"),
        };
        let color = match &target.game.msaa {
            // MSAA target never leaves tile memory.
            Some(msaa) => RenderPassColorAttachment {
                view: msaa,
                depth_slice: None,
                resolve_target: Some(scene),
                ops: Operations {
                    load: LoadOp::Clear(clear),
                    store: StoreOp::Discard,
                },
            },
            None => RenderPassColorAttachment {
                view: scene,
                depth_slice: None,
                resolve_target: None,
                ops: Operations {
                    load: LoadOp::Clear(clear),
                    store: StoreOp::Store,
                },
            },
        };
        let mut pass = encoder.begin_render_pass(&RenderPassDescriptor {
            label: Some(if backdrop_pass { "backdrop" } else { "scene" }),
            color_attachments: &[Some(color)],
            depth_stencil_attachment: Some(RenderPassDepthStencilAttachment {
                view: target.game.depth.as_ref().expect("prepared"),
                depth_ops: Some(Operations {
                    load: LoadOp::Clear(1.0),
                    store: StoreOp::Discard,
                }),
                stencil_ops: None,
            }),
            timestamp_writes: None,
            occlusion_query_set: None,
            multiview_mask: None,
        });
        // The cached backdrop first, behind everything (the live scene tests against cleared depth).
        if !backdrop_pass
            && target.game.backdrop.is_some()
            && let (Some(group), Some(pipeline)) = (
                &target.game.backdrop_group,
                self.game.compose.get(&format).and_then(|c| c.backdrop.get(&samples)),
            )
        {
            pass.set_pipeline(pipeline);
            pass.set_bind_group(0, group, &[]);
            pass.draw(0..3, 0..1);
        }
        if target.game.culled.len() > 0 {
            let p = &self.game.pipelines[&(format, samples)];
            let visible = &target.game.culled;
            pass.set_bind_group(0, target.game.scene_group.as_ref().expect("prepared"), &[]);
            pass.set_pipeline(&p.opaque);
            self.draw(&mut pass, buffers, &visible.opaque, Only::Solid, Some(p), skins);
            // Cut-outs discard texels, which turns off early depth testing on mobile GPUs: only they pay for it.
            pass.set_pipeline(&p.cutout);
            self.draw(&mut pass, buffers, &visible.opaque, Only::Cutout, Some(p), skins);
            pass.set_pipeline(&p.blend);
            self.draw(&mut pass, buffers, &visible.transparent, Only::Blended, Some(p), skins);
            // Flames add their light last, so smoke never dulls them.
            pass.set_pipeline(&p.add);
            self.draw(&mut pass, buffers, &visible.transparent, Only::Added, Some(p), skins);
        }
        // The overlay last, in the same pass (MSAA included): its depth range is in front of the scene.
        let overlay_used = target.game.overlay.as_ref().map_or(0, |o| o.count);
        if matches!(into, SceneTarget::Screen(_)) && overlay_used > 0 {
            self.draw_overlay(&mut pass, target, &self.game.pipelines[&(format, samples)]);
        }
    }

    /// The overlay (HUD) over whatever the pass has drawn: its depth range is in front of the scene.
    fn draw_overlay(&self, pass: &mut RenderPass, target: &Target, p: &Pipelines) {
        let ob = target.game.overlay_instances.as_ref().expect("prepared");
        pass.set_bind_group(0, target.game.overlay_group.as_ref().expect("prepared"), &[]);
        pass.set_pipeline(&p.opaque);
        self.draw(pass, ob, &target.game.overlay_batches.opaque, Only::Solid, Some(p), &[]);
        pass.set_pipeline(&p.cutout);
        self.draw(pass, ob, &target.game.overlay_batches.opaque, Only::Cutout, Some(p), &[]);
        pass.set_pipeline(&p.blend);
        self.draw(pass, ob, &target.game.overlay_batches.transparent, Only::Blended, Some(p), &[]);
        pass.set_pipeline(&p.add);
        self.draw(pass, ob, &target.game.overlay_batches.transparent, Only::Added, Some(p), &[]);
    }

    /// One instanced draw per active mesh, in the same order as the world's ranges.
    fn draw(
        &self,
        pass: &mut RenderPass,
        buffers: &InstanceBuffers,
        batches: &[DrawBatch],
        only: Only,
        pipelines: Option<&Pipelines>,
        skins: &[BoneBuffer],
    ) {
        let textured = pipelines.is_some();
        let mut last_pipeline: Option<&RenderPipeline> = None;
        let mut last_material: Option<&BindGroup> = None;
        let mut last_mesh = None;
        let mut last_indices: Option<&Buffer> = None;
        for batch in batches {
            let DrawBatch {
                mesh: id, lod, first, count, ..
            } = *batch;
            let id = id as usize;
            let Some(mesh) = self.game.meshes.get(&(id as crate::MeshId)) else {
                continue;
            };
            // A coarser version: the mesh's own vertices with fewer triangles
            let level = (lod > 0)
                .then(|| self.game.lods.get(&(id as crate::MeshId)).filter(|l| l.version == mesh.version))
                .flatten()
                .and_then(|l| l.levels.get(lod as usize - 1));
            let (indices, index_count) = level.map_or((&mesh.indices, mesh.count), |l| (&l.indices, l.count));
            match only {
                Only::Solid if mesh.cutout => continue,
                Only::Cutout if !mesh.cutout => continue,
                Only::Blended if id == FLAME_MESH => continue,
                Only::Added if id != FLAME_MESH => continue,
                _ => {}
            }
            let skinned = mesh.skin.is_some();
            let pipeline = match pipelines {
                Some(p) => match (only, skinned) {
                    (Only::Solid, true) => &p.opaque_skin,
                    (Only::Cutout, true) => &p.cutout_skin,
                    (Only::Blended, true) => &p.blend_skin,
                    (Only::Added, true) => &p.add_skin,
                    (Only::Solid, false) => &p.opaque,
                    (Only::Cutout, false) => &p.cutout,
                    (Only::Added, false) => &p.add,
                    _ => &p.blend,
                },
                None => {
                    if skinned {
                        &self.game.shadow_skin_pipeline
                    } else {
                        &self.game.shadow_pipeline
                    }
                }
            };
            // Skip state the previous batch of this call already set (the caller may have set the
            // pipeline before the call, so the first batch always sets its own).
            if !last_pipeline.is_some_and(|p| std::ptr::eq(p, pipeline)) {
                pass.set_pipeline(pipeline);
                last_pipeline = Some(pipeline);
            }
            if (textured || skinned) && !last_material.is_some_and(|m| std::ptr::eq(m, &mesh.material)) {
                pass.set_bind_group(1, &mesh.material, &[]);
                last_material = Some(&mesh.material);
            }
            if !last_mesh.is_some_and(|m| std::ptr::eq(m, mesh)) {
                pass.set_vertex_buffer(0, mesh.vertices.slice(..));
                last_mesh = Some(mesh);
                last_indices = None;
            }
            if !last_indices.is_some_and(|b| std::ptr::eq(b, indices)) {
                pass.set_index_buffer(indices.slice(..), mesh.format);
                last_indices = Some(indices);
            }
            if let Some(skin) = &mesh.skin {
                // Every instance sets its own bones and instance slots.
                pass.set_vertex_buffer(4, skin.slice(..));
                for instance in first..first + count {
                    let world_instance = batch.origin + (instance - first);
                    let group = skins
                        .binary_search_by_key(&world_instance, |s| s.instance)
                        .ok()
                        .map(|i| &skins[i].group)
                        .unwrap_or(&self.game.default_skin.group);
                    pass.set_bind_group(2, group, &[]);
                    pass.set_vertex_buffer(1, buffers.matrices.slice((instance * 64) as u64..));
                    pass.set_vertex_buffer(2, buffers.colors.slice((instance * 16) as u64..));
                    pass.set_vertex_buffer(3, buffers.regions.slice((instance * 16) as u64..));
                    pass.draw_indexed(0..mesh.count, 0, 0..1);
                }
                continue;
            }
            pass.set_vertex_buffer(1, buffers.matrices.slice((first * 64) as u64..));
            if textured {
                pass.set_vertex_buffer(2, buffers.colors.slice((first * 16) as u64..));
                pass.set_vertex_buffer(3, buffers.regions.slice((first * 16) as u64..));
            }
            pass.draw_indexed(0..index_count, 0, 0..count as u32);
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
        Some(VertexBufferLayout {
            array_stride: (VERTEX_FLOATS * 4) as u64,
            step_mode: VertexStepMode::Vertex,
            attributes: &MESH,
        }),
        Some(VertexBufferLayout {
            array_stride: 64,
            step_mode: VertexStepMode::Instance,
            attributes: &MATRIX,
        }),
        Some(VertexBufferLayout {
            array_stride: 16,
            step_mode: VertexStepMode::Instance,
            attributes: &COLOR,
        }),
        Some(VertexBufferLayout {
            array_stride: 16,
            step_mode: VertexStepMode::Instance,
            attributes: &REGION,
        }),
    ]
}

fn skin_vertex_layouts() -> [Option<VertexBufferLayout<'static>>; 5] {
    const SKIN: [VertexAttribute; 2] = vertex_attr_array![10 => Float32x4, 11 => Float32x4];
    let [a, b, c, d] = vertex_layouts();
    [
        a,
        b,
        c,
        d,
        Some(VertexBufferLayout {
            array_stride: 32,
            step_mode: VertexStepMode::Vertex,
            attributes: &SKIN,
        }),
    ]
}

struct BoneBuffer {
    instance: usize,
    buffer: Buffer,
    group: BindGroup,
    cache: cache::FloatCache,
}
impl BoneBuffer {
    fn new(device: &Device, layout: &BindGroupLayout) -> Self {
        let buffer = device.create_buffer(&BufferDescriptor {
            label: Some("bone palette"),
            size: (crate::assets::skeleton::PALETTE_FLOATS * 4) as u64,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let group = device.create_bind_group(&BindGroupDescriptor {
            label: Some("bone palette"),
            layout,
            entries: &[BindGroupEntry {
                binding: 0,
                resource: buffer.as_entire_binding(),
            }],
        });
        Self {
            instance: usize::MAX,
            buffer,
            group,
            cache: Default::default(),
        }
    }
}

#[derive(Debug, PartialEq)]
struct DrawBatch {
    mesh: crate::MeshId,
    /// 0: the mesh itself; n: its nth coarser version (`Gpu::lods`).
    lod: u8,
    first: usize,
    count: usize,
    /// Where `first` was in the world's own instance order (bone palettes are keyed by it).
    origin: usize,
}

/// Build the ordered active ranges once, then reuse them for mesh uploads and every pass.
/// Cost depends on this world's meshes, rather than all meshes visited in the app so far.
#[derive(Default)]
struct Batches {
    opaque: Vec<DrawBatch>,
    transparent: Vec<DrawBatch>,
}

impl Batches {
    fn update(&mut self, ranges: &[u32], used: usize, mesh_limit: usize) {
        for (offset, out) in [(0, &mut self.opaque), (MAX_MESHES, &mut self.transparent)] {
            out.clear();
            for b in offset..(offset + mesh_limit).min(ranges.len() / 2) {
                let first = ranges[b * 2] as usize;
                let count = (ranges[b * 2 + 1] as usize).min(used.saturating_sub(first));
                if count > 0 {
                    out.push(DrawBatch {
                        mesh: (b - offset) as crate::MeshId,
                        lod: 0,
                        first,
                        count,
                        origin: first,
                    });
                }
            }
        }
    }
}

struct InstanceBuffers {
    matrix_cache: cache::FloatCache,
    color_cache: cache::FloatCache,
    region_cache: cache::FloatCache,
    capacity: usize,
    matrices: Buffer,
    colors: Buffer,
    regions: Buffer,
}

impl InstanceBuffers {
    fn upload(&mut self, queue: &Queue, inst: &Instances, used: usize) {
        write_cached(queue, &self.matrices, &mut self.matrix_cache, &inst.matrices[..used * 16]);
        write_cached(queue, &self.colors, &mut self.color_cache, &inst.colors[..used * 4]);
        if let Some(regions) = inst.regions.filter(|r| r.len() >= used * 4) {
            write_cached(queue, &self.regions, &mut self.region_cache, &regions[..used * 4]);
        }
    }

    /// Uploads a culled set (matrices always; colors and regions when it has them).
    fn upload_culled(&mut self, queue: &Queue, culled: &Culled) {
        write_cached(queue, &self.matrices, &mut self.matrix_cache, &culled.matrices);
        if culled.colors.len() * 4 == culled.matrices.len() {
            write_cached(queue, &self.colors, &mut self.color_cache, &culled.colors);
            write_cached(queue, &self.regions, &mut self.region_cache, &culled.regions);
        }
    }
}

/// Coarser stand-ins for the built-in sphere where one looks small: (largest radius on screen in
/// pixels, mesh), coarsest first. An eight-sided ball keeps within half a pixel of a true outline up
/// to ~6 px of radius and a twelve-sided one up to ~14 px; beyond that the full 24-sided sphere
/// draws. Stars, pellets, beads and sparks cost a twelfth of the triangles.
const SPHERE_LODS: [(f32, crate::MeshId); 3] = [(6.0, shapes::SPHERE_TINY), (14.0, shapes::SPHERE_SMALL), (26.0, shapes::SPHERE_MEDIUM)];

/// The sphere mesh to draw for one `radius` pixels across on screen.
fn sphere_lod(radius: f32) -> crate::MeshId {
    SPHERE_LODS
        .iter()
        .find(|&&(most, _)| radius <= most)
        .map_or(shapes::SPHERE, |&(_, mesh)| mesh)
}

/// The instances of a frame that survive culling, packed in draw order, with their batches.
#[derive(Default)]
struct Culled {
    matrices: Vec<f32>,
    colors: Vec<f32>,
    regions: Vec<f32>,
    opaque: Vec<DrawBatch>,
    transparent: Vec<DrawBatch>,
    /// A batch's visible instances, the mesh and version each draws with, and its depth (reused).
    visible: Vec<(usize, crate::MeshId, u8, f32)>,
}

impl Culled {
    /// Packs the instances of `opaque` and `transparent` that `frustum` may see, keeping their order
    /// (see-through ones are drawn back to front as the world sorted them). `mesh` gives a mesh's
    /// bounds and whether it is skinned (never culled: animation moves it past its bind pose).
    /// Without `colors`, only matrices are packed (the shadow pass reads nothing else). Built-in
    /// spheres that look small (`pixels` is half the target's height) draw with a coarser stand-in
    /// (`SPHERE_LODS`): opaque ones grouped by mesh, see-through ones in runs that keep their order.
    /// With `colors` (the camera's pass), opaque instances are packed nearest first and their batches
    /// ordered by their nearest instance, so the depth test rejects what's hidden before it's shaded
    /// (a lawn drawn after the trees and moles on it instead of under them).
    #[allow(clippy::too_many_arguments)]
    fn fill<'m>(
        &mut self,
        [opaque, transparent]: [&[DrawBatch]; 2],
        inst: &Instances,
        used: usize,
        frustum: &Frustum,
        pixels: f32,
        mesh: &dyn Fn(crate::MeshId) -> Option<(Sphere, bool, &'m [f32])>,
        colors: bool,
    ) {
        self.matrices.clear();
        self.colors.clear();
        self.regions.clear();
        let regions = inst.regions.filter(|r| r.len() >= used * 4);
        let lods_ready = SPHERE_LODS.iter().all(|&(_, m)| mesh(m).is_some());
        let mut visible = std::mem::take(&mut self.visible);
        for (ordered, batches) in [(false, opaque), (true, transparent)] {
            let mut out = std::mem::take(if ordered { &mut self.transparent } else { &mut self.opaque });
            out.clear();
            for batch in batches {
                let Some((bounds, skinned, errors)) = mesh(batch.mesh) else { continue };
                let spheres = lods_ready && !skinned && batch.mesh == shapes::SPHERE;
                let levels = !skinned && !errors.is_empty();
                let sorted = colors && !ordered && !skinned;
                let end = (batch.first + batch.count).min(used);
                visible.clear();
                for i in batch.first..end {
                    let matrix = &inst.matrices[i * 16..i * 16 + 16];
                    if !skinned && !frustum.sees(matrix, bounds) {
                        continue;
                    }
                    let (mut id, mut lod) = (batch.mesh, 0u8);
                    if spheres || levels {
                        let radius = frustum.screen_radius(matrix, bounds) * pixels;
                        if spheres {
                            // The tiers keep half a pixel of outline; shadows allow SHADOW_LOD_TEXELS
                            id = sphere_lod(if colors { radius } else { radius * LOD_PIXELS / SHADOW_LOD_TEXELS });
                        } else {
                            // The coarsest version whose error (relative to the mesh's size, at most its
                            // diameter on screen) stays under LOD_PIXELS (SHADOW_LOD_TEXELS for shadows)
                            let budget = if colors { LOD_PIXELS } else { SHADOW_LOD_TEXELS };
                            lod = errors.iter().take_while(|&&e| e * 2.0 * radius <= budget).count() as u8;
                        }
                    }
                    visible.push((i, id, lod, if sorted { frustum.depth(matrix, bounds) } else { 0.0 }));
                }
                if !ordered && (spheres || levels) {
                    // Opaque: one batch per version, nearest first within it (shadows: world order)
                    visible.sort_by(|a, b| (a.1, a.2).cmp(&(b.1, b.2)).then(a.3.total_cmp(&b.3)));
                } else if sorted {
                    visible.sort_by(|a, b| a.3.total_cmp(&b.3));
                }
                self.pack(&mut out, visible.iter(), inst, regions, colors);
            }
            if ordered {
                self.transparent = out;
            } else {
                if colors {
                    // Batches by their nearest instance (each batch's first, as packed)
                    let matrices = &self.matrices;
                    let nearest = |b: &DrawBatch| match mesh(b.mesh) {
                        Some((bounds, false, _)) => frustum.depth(&matrices[b.first * 16..b.first * 16 + 16], bounds),
                        _ => f32::INFINITY,
                    };
                    out.sort_by(|a, b| nearest(a).total_cmp(&nearest(b)));
                }
                self.opaque = out;
            }
        }
        self.visible = visible;
    }

    /// Appends instances (index, mesh, version, depth) in order, starting a batch wherever the mesh
    /// or its version changes.
    fn pack<'a>(
        &mut self,
        out: &mut Vec<DrawBatch>,
        instances: impl Iterator<Item = &'a (usize, crate::MeshId, u8, f32)>,
        inst: &Instances,
        regions: Option<&[f32]>,
        colors: bool,
    ) {
        let mut run: Option<DrawBatch> = None;
        for &(i, id, lod, _) in instances {
            let first = self.len();
            self.matrices.extend_from_slice(&inst.matrices[i * 16..i * 16 + 16]);
            if colors {
                self.colors.extend_from_slice(&inst.colors[i * 4..i * 4 + 4]);
                match regions {
                    Some(r) => self.regions.extend_from_slice(&r[i * 4..i * 4 + 4]),
                    None => self.regions.extend_from_slice(&[0.0, 0.0, 1.0, 1.0]),
                }
            }
            match &mut run {
                Some(r) if r.mesh == id && r.lod == lod => r.count += 1,
                _ => {
                    out.extend(run.take());
                    // Skinned batches are never culled, so their instances stay contiguous from `origin`.
                    run = Some(DrawBatch {
                        mesh: id,
                        lod,
                        first,
                        count: 1,
                        origin: i,
                    });
                }
            }
        }
        out.extend(run);
    }

    fn len(&self) -> usize {
        self.matrices.len() / 16
    }
}

fn write_cached(queue: &Queue, buffer: &Buffer, cache: &mut cache::FloatCache, data: &[f32]) {
    if let Some(span) = cache.changed(data) {
        queue.write_buffer(buffer, (span.start * 4) as u64, bytes(&data[span]));
    }
}

pub(super) struct GameTarget {
    globals: Buffer,
    globals_cache: cache::FloatCache,
    shadow_group: BindGroup,
    scene_group: Option<BindGroup>,
    shadow_view: Option<TextureView>,
    shadow_size: u32,
    depth: Option<TextureView>,
    msaa: Option<TextureView>,
    samples: u32,
    /// The scene's drawing size, and the screen's.
    target_size: (u32, u32),
    output_size: (u32, u32),
    /// With a scaled scene: what it's drawn into, the full-size depth the overlay tests against, and
    /// the binding that stretches it over the screen.
    scene_color: Option<TextureView>,
    overlay_depth: Option<TextureView>,
    compose_group: Option<BindGroup>,
    instances: Option<InstanceBuffers>,
    batches: Batches,
    /// This frame's instances the camera may see, and those inside the light's box (shadow casters).
    culled: Culled,
    shadow_culled: Culled,
    shadow_instances: Option<InstanceBuffers>,
    /// Drawn over the scene every frame until replaced (see `render::set_overlay`).
    overlay: Option<Overlay>,
    /// Static scenery behind the scene (see `render::set_backdrop`), drawn into `backdrop_color` when
    /// it changes or the frame values it was drawn with (`backdrop_drawn`) do.
    backdrop: Option<Overlay>,
    backdrop_dirty: bool,
    backdrop_drawn: Option<[f32; 32]>,
    backdrop_color: Option<TextureView>,
    backdrop_group: Option<BindGroup>,
    overlay_globals: Buffer,
    overlay_globals_cache: cache::FloatCache,
    overlay_group: Option<BindGroup>,
    overlay_instances: Option<InstanceBuffers>,
    overlay_batches: Batches,
    skins: Vec<BoneBuffer>,
}

impl GameTarget {
    pub(super) fn new(gpu: &Gpu) -> Self {
        let globals = gpu.device.create_buffer(&BufferDescriptor {
            label: Some("globals"),
            size: (GLOBALS_FLOATS * 4) as u64,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let shadow_group = gpu.device.create_bind_group(&BindGroupDescriptor {
            label: Some("shadow"),
            layout: &gpu.game.shadow_layout,
            entries: &[BindGroupEntry {
                binding: 0,
                resource: globals.as_entire_binding(),
            }],
        });
        let overlay_globals = gpu.device.create_buffer(&BufferDescriptor {
            label: Some("overlay globals"),
            size: (GLOBALS_FLOATS * 4) as u64,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        Self {
            globals,
            globals_cache: Default::default(),
            shadow_group,
            scene_group: None,
            shadow_view: None,
            shadow_size: 0,
            depth: None,
            msaa: None,
            samples: 0,
            target_size: (0, 0),
            output_size: (0, 0),
            scene_color: None,
            overlay_depth: None,
            compose_group: None,
            instances: None,
            batches: Batches::default(),
            culled: Culled::default(),
            shadow_culled: Culled::default(),
            shadow_instances: None,
            overlay: None,
            backdrop: None,
            backdrop_dirty: false,
            backdrop_drawn: None,
            backdrop_color: None,
            backdrop_group: None,
            overlay_globals,
            overlay_globals_cache: Default::default(),
            overlay_group: None,
            overlay_instances: None,
            overlay_batches: Batches::default(),
            skins: Vec::new(),
        }
    }
}

impl Target {
    pub(in crate::render) fn swap_overlay(&mut self, overlay: &mut Option<Overlay>) {
        std::mem::swap(&mut self.game.overlay, overlay);
    }

    pub(in crate::render) fn swap_backdrop(&mut self, backdrop: &mut Option<Overlay>) {
        std::mem::swap(&mut self.game.backdrop, backdrop);
        self.game.backdrop_dirty = true;
    }

    /// Makes the render targets, shadow map and instance buffers this frame needs.
    fn prepare(&mut self, gpu: &Gpu, frame: &Frame, used: usize) {
        let device = &gpu.device;
        let full = (self.config.width, self.config.height);
        let size = if frame.scale < 1.0 {
            let scaled = |n: u32| ((n as f32 * frame.scale).round() as u32).max(1);
            (scaled(full.0), scaled(full.1))
        } else {
            full
        };
        let composing = size != full || frame.fxaa;
        let mut recreated = false;
        if self.game.depth.is_none()
            || self.game.samples != frame.samples
            || self.game.target_size != size
            || self.game.output_size != full
            || self.game.scene_color.is_some() != composing
        {
            self.game.samples = frame.samples;
            self.game.target_size = size;
            self.game.output_size = full;
            recreated = true;
            let extent = Extent3d {
                width: size.0,
                height: size.1,
                depth_or_array_layers: 1,
            };
            let texture = |format, label| {
                device
                    .create_texture(&TextureDescriptor {
                        label: Some(label),
                        size: extent,
                        mip_level_count: 1,
                        sample_count: self.game.samples,
                        dimension: TextureDimension::D2,
                        format,
                        // Cleared and discarded by every pass that uses them (MSAA resolves into the frame)
                        usage: TextureUsages::RENDER_ATTACHMENT | gpu.game.transient,
                        view_formats: &[],
                    })
                    .create_view(&TextureViewDescriptor::default())
            };
            self.game.depth = Some(texture(DEPTH_FORMAT, "depth"));
            // Without MSAA the scene is drawn straight into the screen's texture.
            self.game.msaa = (self.game.samples > 1).then(|| texture(self.config.format, "msaa"));
            // A scaled scene goes into its own texture, stretched over the screen before the overlay.
            let single = |format, usage, (width, height): (u32, u32), label| {
                device
                    .create_texture(&TextureDescriptor {
                        label: Some(label),
                        size: Extent3d {
                            width,
                            height,
                            depth_or_array_layers: 1,
                        },
                        mip_level_count: 1,
                        sample_count: 1,
                        dimension: TextureDimension::D2,
                        format,
                        usage,
                        view_formats: &[],
                    })
                    .create_view(&TextureViewDescriptor::default())
            };
            let compose = gpu.game.compose.get(&self.config.format).filter(|_| composing);
            self.game.scene_color = compose.map(|_| {
                single(
                    self.config.format,
                    TextureUsages::RENDER_ATTACHMENT | TextureUsages::TEXTURE_BINDING,
                    size,
                    "scene color",
                )
            });
            self.game.overlay_depth =
                compose.map(|_| single(DEPTH_FORMAT, TextureUsages::RENDER_ATTACHMENT | gpu.game.transient, full, "overlay depth"));
            self.game.compose_group = compose.zip(self.game.scene_color.as_ref()).map(|(c, view)| {
                device.create_bind_group(&BindGroupDescriptor {
                    label: Some("compose"),
                    layout: &c.layout,
                    entries: &[
                        BindGroupEntry {
                            binding: 0,
                            resource: BindingResource::TextureView(view),
                        },
                        BindGroupEntry {
                            binding: 1,
                            resource: BindingResource::Sampler(&c.sampler),
                        },
                    ],
                })
            });
        }
        // The cached backdrop's texture, at the scene's size (drawn again whenever it's remade).
        let wants = self.game.backdrop.is_some() && gpu.game.compose.contains_key(&self.config.format);
        if recreated || wants != self.game.backdrop_color.is_some() {
            self.game.backdrop_color = None;
            self.game.backdrop_group = None;
            if let Some(compose) = gpu.game.compose.get(&self.config.format).filter(|_| wants) {
                let view = device
                    .create_texture(&TextureDescriptor {
                        label: Some("backdrop"),
                        size: Extent3d {
                            width: size.0,
                            height: size.1,
                            depth_or_array_layers: 1,
                        },
                        mip_level_count: 1,
                        sample_count: 1,
                        dimension: TextureDimension::D2,
                        format: self.config.format,
                        usage: TextureUsages::RENDER_ATTACHMENT | TextureUsages::TEXTURE_BINDING,
                        view_formats: &[],
                    })
                    .create_view(&TextureViewDescriptor::default());
                self.game.backdrop_group = Some(device.create_bind_group(&BindGroupDescriptor {
                    label: Some("backdrop"),
                    layout: &compose.layout,
                    entries: &[
                        BindGroupEntry {
                            binding: 0,
                            resource: BindingResource::TextureView(&view),
                        },
                        BindGroupEntry {
                            binding: 1,
                            resource: BindingResource::Sampler(&compose.sampler),
                        },
                    ],
                }));
                self.game.backdrop_color = Some(view);
            }
            self.game.backdrop_dirty = true;
        }
        if self.game.shadow_view.is_none() || self.game.shadow_size != frame.shadow_size {
            self.game.shadow_size = frame.shadow_size;
            let view = device
                .create_texture(&TextureDescriptor {
                    label: Some("shadow"),
                    size: Extent3d {
                        width: self.game.shadow_size,
                        height: self.game.shadow_size,
                        depth_or_array_layers: 1,
                    },
                    mip_level_count: 1,
                    sample_count: 1,
                    dimension: TextureDimension::D2,
                    format: SHADOW_FORMAT,
                    usage: TextureUsages::RENDER_ATTACHMENT | TextureUsages::TEXTURE_BINDING,
                    view_formats: &[],
                })
                .create_view(&TextureViewDescriptor::default());
            let group = |label, globals: &Buffer| {
                device.create_bind_group(&BindGroupDescriptor {
                    label: Some(label),
                    layout: &gpu.game.scene_layout,
                    entries: &[
                        BindGroupEntry {
                            binding: 0,
                            resource: globals.as_entire_binding(),
                        },
                        BindGroupEntry {
                            binding: 1,
                            resource: BindingResource::TextureView(&view),
                        },
                        BindGroupEntry {
                            binding: 2,
                            resource: BindingResource::Sampler(&gpu.game.shadow_sampler),
                        },
                    ],
                })
            };
            self.game.scene_group = Some(group("scene", &self.game.globals));
            self.game.overlay_group = Some(group("overlay", &self.game.overlay_globals));
            self.game.shadow_view = Some(view);
        }
        ensure_instances(gpu, &mut self.game.instances, used, 256);
        if frame.shadows {
            ensure_instances(gpu, &mut self.game.shadow_instances, used, 256);
        }
        let overlay_used = self.game.overlay.as_ref().map_or(0, |o| o.count);
        if overlay_used > 0 {
            ensure_instances(gpu, &mut self.game.overlay_instances, overlay_used, 64);
        }
    }
}

/// Grows `slot` to hold at least `used` instances (at least `min`, in powers of two).
fn ensure_instances(gpu: &Gpu, slot: &mut Option<InstanceBuffers>, used: usize, min: usize) {
    let needed = used.max(1);
    if slot.as_ref().is_some_and(|b| b.capacity >= needed) {
        return;
    }
    let capacity = needed.next_power_of_two().max(min);
    let buffer = |label, floats: usize| {
        gpu.device.create_buffer(&BufferDescriptor {
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
    *slot = Some(InstanceBuffers {
        capacity,
        matrices: buffer("matrices", 16),
        colors: buffer("colors", 4),
        regions,
        matrix_cache: Default::default(),
        color_cache: Default::default(),
        region_cache: Default::default(),
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mip_chains_halve_to_one_texel_keeping_cut_out_colors_and_average_alpha() {
        // 4 x 2: the left 2 x 2 opaque red with one transparent texel, the right half opaque blue.
        let mut rgba = Vec::new();
        for y in 0..2 {
            for x in 0..4 {
                rgba.extend_from_slice(match (x, y) {
                    (0, 0) => &[0, 0, 0, 0],
                    (0..=1, _) => &[255, 0, 0, 255],
                    _ => &[0, 0, 255, 255],
                });
            }
        }
        let levels = mip_chain(4, 2, &rgba);
        assert_eq!(levels.iter().map(|l| (l.0, l.1)).collect::<Vec<_>>(), vec![(2, 1), (1, 1)]);
        // The transparent texel's black doesn't bleed in: still pure red, at three quarters alpha.
        assert_eq!(&levels[0].2[..4], &[255, 0, 0, 191]);
        assert_eq!(&levels[0].2[4..], &[0, 0, 255, 255]);
        // Odd sizes clamp at the edge; a 1 x 1 texture has no levels; short data gives none.
        assert_eq!(mip_chain(3, 1, &[9; 12]).len(), 1);
        assert!(mip_chain(1, 1, &[1; 4]).is_empty());
        assert!(mip_chain(4, 4, &[1; 8]).is_empty());
    }

    #[test]
    fn frames_read_an_optional_scene_scale() {
        let mut f = vec![0.0; FRAME_LEN];
        f[21] = 100.0;
        f[22] = 50.0;
        assert_eq!(Frame::from_slice(&f).unwrap().scale, 1.0);
        f.push(0.5);
        assert_eq!(Frame::from_slice(&f).unwrap().scale, 0.5);
        assert!(!Frame::from_slice(&f).unwrap().fxaa);
        f.push(1.0);
        assert!(Frame::from_slice(&f).unwrap().fxaa);
        f.truncate(27);
        f[26] = 0.01;
        assert_eq!(Frame::from_slice(&f).unwrap().scale, 0.25);
        f[26] = 1.2;
        assert_eq!(Frame::from_slice(&f).unwrap().scale, 1.0);
    }

    #[test]
    fn msaa_pipelines_with_alpha_to_coverage_validate_when_a_device_is_available() {
        let Ok(mut gpu) = Gpu::headless() else { return };
        gpu.pipelines(TextureFormat::Rgba8UnormSrgb, 4);
        let error = gpu.error.lock().unwrap().take();
        assert!(error.is_none(), "GPU validation: {error:?}");
    }

    #[test]
    fn the_compose_pipeline_validates_when_a_device_is_available() {
        let Ok(mut gpu) = Gpu::headless() else { return };
        gpu.ensure_compose(TextureFormat::Rgba8UnormSrgb);
        let error = gpu.error.lock().unwrap().take();
        assert!(error.is_none(), "GPU validation: {error:?}");
    }

    #[test]
    fn static_and_skeletal_gpu_pipelines_validate_when_a_device_is_available() {
        let Ok(gpu) = Gpu::headless() else { return };
        let error = gpu.error.lock().unwrap().take();
        assert!(error.is_none(), "GPU validation: {error:?}");
    }

    #[test]
    fn batches_keep_mesh_order_opacity_and_clamp_stale_ranges() {
        let mut ranges = vec![0; MAX_MESHES * 4];
        for (bucket, first, count) in [(3, 0, 2), (700, 2, 3), (MAX_MESHES + 8, 5, 9), (900, 99, 4)] {
            ranges[bucket * 2] = first;
            ranges[bucket * 2 + 1] = count;
        }
        let mut b = Batches::default();
        b.update(&ranges, 7, 1000);
        let batch = |mesh, first, count| DrawBatch {
            mesh,
            lod: 0,
            first,
            count,
            origin: first,
        };
        assert_eq!(b.opaque, vec![batch(3, 0, 2), batch(700, 2, 3)]);
        assert_eq!(b.transparent, vec![batch(8, 5, 2)]);
        ranges.fill(0);
        b.update(&ranges, 0, 1000);
        assert!(b.opaque.is_empty() && b.transparent.is_empty(), "a cleared world keeps no stale draws");
    }

    /// A row of unit instances along x, at x = 0, 10, 20, ... (column-major translations).
    fn row(n: usize) -> (Vec<f32>, Vec<f32>, Vec<f32>) {
        let mut matrices = Vec::new();
        for i in 0..n {
            matrices.extend(Mat4::from_translation(Vec3::new(i as f32 * 10.0, 0.0, 0.0)).to_cols_array());
        }
        let colors = (0..n).flat_map(|i| [i as f32, 0.0, 0.0, 1.0]).collect();
        let regions = (0..n).flat_map(|i| [i as f32, 0.0, 1.0, 1.0]).collect();
        (matrices, colors, regions)
    }

    #[test]
    #[allow(deprecated)] // glam's older camera helpers, as the renderer uses
    fn culling_packs_visible_instances_in_order_and_keeps_skinned_ones_whole() {
        // Six instances: 0-2 a static mesh, 3-4 a skinned one, 5 a see-through static one.
        let (matrices, colors, regions) = row(6);
        let inst = Instances {
            skins: &[],
            matrices: &matrices,
            colors: &colors,
            regions: Some(&regions),
            ranges: &[],
            count: 6,
        };
        let batch = |mesh, first, count| DrawBatch {
            mesh,
            lod: 0,
            first,
            count,
            origin: first,
        };
        let opaque = [batch(20, 0, 3), batch(21, 3, 2)];
        let transparent = [batch(22, 5, 1)];
        // A box seeing x in -5..15 (instances at 0 and 10), looking down -z from above the row.
        let view = Mat4::look_at_rh(Vec3::new(5.0, 0.0, 50.0), Vec3::new(5.0, 0.0, 0.0), Vec3::Y);
        let frustum = Frustum::new(Mat4::orthographic_rh(-10.0, 10.0, -10.0, 10.0, 0.1, 100.0) * view);
        let unit = Sphere {
            center: Vec3::ZERO,
            radius: 0.5,
        };
        let info = |id: crate::MeshId| match id {
            20 | 22 => Some((unit, false, &[][..])),
            21 => Some((unit, true, &[][..])),
            _ => None,
        };
        let mut c = Culled::default();
        c.fill([&opaque, &transparent], &inst, 6, &frustum, 500.0, &info, true);
        // Static: 0 and 10 kept (20 is outside); skinned: both kept whatever their place, contiguous
        // with their world order recorded; the see-through one at x = 50 is dropped.
        assert_eq!(
            c.opaque,
            vec![
                batch(20, 0, 2),
                DrawBatch {
                    mesh: 21,
                    lod: 0,
                    first: 2,
                    count: 2,
                    origin: 3
                }
            ]
        );
        assert!(c.transparent.is_empty());
        assert_eq!(c.len(), 4);
        let first_floats = |v: &[f32], stride: usize| v.chunks(stride).map(|x| x[0]).collect::<Vec<_>>();
        assert_eq!(first_floats(&c.colors, 4), vec![0.0, 1.0, 3.0, 4.0]);
        assert_eq!(first_floats(&c.regions, 4), vec![0.0, 1.0, 3.0, 4.0]);
        assert_eq!(c.matrices[16 + 12], 10.0, "matrices travel with their instances");
        // The shadow set packs matrices only; an unknown mesh (nothing to draw) drops its batch.
        let mut s = Culled::default();
        s.fill([&[batch(99, 0, 3), batch(20, 0, 3)], &[]], &inst, 6, &frustum, 500.0, &info, false);
        assert_eq!(s.opaque, vec![batch(20, 0, 2)]);
        assert!(s.colors.is_empty() && s.regions.is_empty());
        // Without regions, whole textures are packed; stale ranges past `used` are clamped.
        let plain = Instances { regions: None, ..inst };
        c.fill([&[batch(20, 0, 3)], &[]], &plain, 1, &frustum, 500.0, &info, true);
        assert_eq!((c.len(), c.regions.clone()), (1, vec![0.0, 0.0, 1.0, 1.0]));
    }

    #[test]
    #[allow(deprecated)] // glam's older camera helpers, as the renderer uses
    fn small_spheres_draw_coarser_opaque_ones_grouped_and_see_through_ones_in_order() {
        // Four spheres straight ahead at 10, 100, 25 and 100 units: 90 degrees across and 1000 pixels
        // tall, a radius of 0.5 spans 250 / d pixels (25, 2.5, 10 and 2.5).
        let matrices: Vec<f32> = [-10.0, -100.0, -25.0, -100.0]
            .iter()
            .flat_map(|&z| Mat4::from_translation(Vec3::new(0.0, 0.0, z)).to_cols_array())
            .collect();
        let colors: Vec<f32> = (0..4).flat_map(|i| [i as f32, 0.0, 0.0, 1.0]).collect();
        let inst = Instances {
            skins: &[],
            matrices: &matrices,
            colors: &colors,
            regions: None,
            ranges: &[],
            count: 4,
        };
        let view = Mat4::look_at_rh(Vec3::ZERO, Vec3::new(0.0, 0.0, -1.0), Vec3::Y);
        let frustum = Frustum::new(Mat4::perspective_rh(std::f32::consts::FRAC_PI_2, 1.0, 0.1, 500.0) * view);
        let unit = Sphere {
            center: Vec3::ZERO,
            radius: 0.5,
        };
        let all = |_: crate::MeshId| Some((unit, false, &[][..]));
        let batch = |mesh, first, count, origin| DrawBatch {
            mesh,
            lod: 0,
            first,
            count,
            origin,
        };
        let spheres = [batch(shapes::SPHERE, 0, 4, 0)];
        let mut c = Culled::default();
        c.fill([&spheres, &[]], &inst, 4, &frustum, 500.0, &all, true);
        // One batch per mesh (25 px: the one at 10; 10 px: the one at 25; 2.5 px: the two at 100), each
        // nearest first, drawn nearest batch first, so hidden pixels are rejected before shading.
        assert_eq!(
            c.opaque,
            vec![
                batch(shapes::SPHERE_MEDIUM, 3, 1, 0),
                batch(shapes::SPHERE_SMALL, 0, 1, 2),
                batch(shapes::SPHERE_TINY, 1, 2, 1)
            ]
        );
        let first_floats = |v: &[f32]| v.chunks(4).map(|x| x[0]).collect::<Vec<_>>();
        assert_eq!(first_floats(&c.colors), vec![2.0, 1.0, 3.0, 0.0], "colors travel with their instances");
        // The camera's pass packs each opaque batch nearest first; the shadow pass keeps world order.
        let cubes = [batch(shapes::CUBE, 0, 4, 0)];
        let depths = |c: &Culled| c.matrices.chunks(16).map(|m| m[14]).collect::<Vec<_>>();
        c.fill([&cubes, &[]], &inst, 4, &frustum, 500.0, &all, true);
        assert_eq!(depths(&c), vec![-10.0, -25.0, -100.0, -100.0]);
        let mut shadow = Culled::default();
        shadow.fill([&cubes, &[]], &inst, 4, &frustum, 500.0, &all, false);
        assert_eq!(depths(&shadow), vec![-10.0, -100.0, -25.0, -100.0]);
        // See-through ones keep the world's back-to-front order, in runs of one mesh.
        c.fill([&[], &spheres], &inst, 4, &frustum, 500.0, &all, true);
        assert_eq!(
            c.transparent,
            vec![
                batch(shapes::SPHERE_MEDIUM, 0, 1, 0),
                batch(shapes::SPHERE_TINY, 1, 1, 1),
                batch(shapes::SPHERE_SMALL, 2, 1, 2),
                batch(shapes::SPHERE_TINY, 3, 1, 3)
            ]
        );
        // Without the stand-ins on the GPU (or for any other mesh), every sphere draws in full.
        let full_only = |id: crate::MeshId| (id == shapes::SPHERE).then_some((unit, false, &[][..]));
        c.fill([&spheres, &[]], &inst, 4, &frustum, 500.0, &full_only, true);
        assert_eq!(c.opaque, vec![batch(shapes::SPHERE, 0, 4, 0)]);
        c.fill([&cubes, &[]], &inst, 4, &frustum, 500.0, &all, true);
        assert_eq!(c.opaque, vec![batch(shapes::CUBE, 0, 4, 0)]);
    }

    #[test]
    #[allow(deprecated)] // glam's older camera helpers, as the renderer uses
    fn heavy_meshes_draw_the_coarsest_version_whose_error_stays_under_a_pixel() {
        // A mesh with two coarser versions (errors 0.2% and 2% of its size) seen at 10, 100 and 25
        // units: 90 degrees across, 1000 pixels tall, a radius of 0.5 spans 250 / d pixels.
        let matrices: Vec<f32> = [-10.0, -100.0, -25.0]
            .iter()
            .flat_map(|&z| Mat4::from_translation(Vec3::new(0.0, 0.0, z)).to_cols_array())
            .collect();
        let colors = vec![1.0; 12];
        let inst = Instances {
            skins: &[],
            matrices: &matrices,
            colors: &colors,
            regions: None,
            ranges: &[],
            count: 3,
        };
        let view = Mat4::look_at_rh(Vec3::ZERO, Vec3::new(0.0, 0.0, -1.0), Vec3::Y);
        let frustum = Frustum::new(Mat4::perspective_rh(std::f32::consts::FRAC_PI_2, 1.0, 0.1, 500.0) * view);
        let unit = Sphere {
            center: Vec3::ZERO,
            radius: 0.5,
        };
        let errors = [0.002f32, 0.04];
        let info = |_: crate::MeshId| Some((unit, false, &errors[..]));
        let batch = |lod, first, count, origin| DrawBatch {
            mesh: 40,
            lod,
            first,
            count,
            origin,
        };
        let heavy = [batch(0, 0, 3, 0)];
        let mut c = Culled::default();
        c.fill([&heavy, &[]], &inst, 3, &frustum, 500.0, &info, true);
        // 25 px: 0.002 * 50 = 0.1 px but 0.04 * 50 = 2 px, so the first; 2.5 px: both under, the
        // second; 10 px: 0.04 * 20 = 0.8 px, the second too. Nearest batch first.
        assert_eq!(c.opaque, vec![batch(1, 0, 1, 0), batch(2, 1, 2, 2)]);
        // Without coarser versions (not built yet, or a light mesh) it draws whole.
        let none = |_: crate::MeshId| Some((unit, false, &[][..]));
        c.fill([&heavy, &[]], &inst, 3, &frustum, 500.0, &none, true);
        assert_eq!(c.opaque, vec![batch(0, 0, 3, 0)]);
    }

    fn project(m: Mat4, p: [f32; 3]) -> [f32; 3] {
        let v = m * glamx::Vec4::new(p[0], p[1], p[2], 1.0);
        [v.x / v.w, v.y / v.w, v.z / v.w]
    }

    #[test]
    fn overlay_maps_points_to_the_screen_and_stays_in_front() {
        let m = overlay_view_proj(400.0, 800.0);
        let close = |a: [f32; 3], b: [f32; 3]| a.iter().zip(b).all(|(x, y)| (x - y).abs() < 1e-5);
        // Top-left, bottom-right and the middle of the view (y up from the top: on screen y <= 0).
        assert!(close(project(m, [0.0, 0.0, 0.0]), [-1.0, 1.0, OVERLAY_DEPTH / 2.0]));
        assert!(close(project(m, [400.0, -800.0, 0.0]), [1.0, -1.0, OVERLAY_DEPTH / 2.0]));
        assert!(close(project(m, [200.0, -400.0, 0.0]), [0.0, 0.0, OVERLAY_DEPTH / 2.0]));
        // Higher z is nearer (smaller depth); the whole range is in front of the scene's depths.
        let (front, back) = (project(m, [0.0, 0.0, 100.0])[2], project(m, [0.0, 0.0, -100.0])[2]);
        assert!(front.abs() < 1e-6 && (back - OVERLAY_DEPTH).abs() < 1e-6 && front < back);
    }
}
