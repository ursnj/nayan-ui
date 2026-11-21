//! Backdrop filtering stays on the GPU. Only filtered UI allocates an offscreen target;
//! each panel downsamples its bounds plus the halo, filters densely, then composites at full resolution.
use wgpu::util::DeviceExt;

const SHADER: &str = r#"
struct Settings {
    // Source UV at the output origin, and source UV size across the output viewport.
    mapping: vec4f,
    step: vec4f,
    bounds: vec4f,
    corners: vec4f,
    weights: array<vec4f, 4>,
};
@group(0) @binding(0) var image: texture_2d<f32>;
@group(0) @binding(1) var image_sampler: sampler;
@group(0) @binding(2) var<uniform> settings: Settings;
struct Vertex { @builtin(position) position: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) index: u32) -> Vertex {
    let p = array<vec2f, 3>(vec2f(-1., -1.), vec2f(3., -1.), vec2f(-1., 3.))[index];
    return Vertex(vec4f(p, 0., 1.), vec2f((p.x + 1.) * .5, (1. - p.y) * .5));
}
@fragment fn downsample(v: Vertex) -> @location(0) vec4f {
    let uv = settings.mapping.xy + v.uv * settings.mapping.zw;
    let d = .5 / vec2f(textureDimensions(image));
    return (textureSample(image, image_sampler, uv + d)
        + textureSample(image, image_sampler, uv - d)
        + textureSample(image, image_sampler, uv + vec2f(d.x, -d.y))
        + textureSample(image, image_sampler, uv + vec2f(-d.x, d.y))) * .25;
}
@fragment fn blur(v: Vertex) -> @location(0) vec4f {
    let uv = v.uv;
    let d = settings.step.xy;
    var color = textureSample(image, image_sampler, uv) * settings.step.z;
    // Pair adjacent Gaussian taps through linear sampling; fixed accesses also suit WebGL drivers.
    color += (textureSample(image, image_sampler, uv + d * settings.weights[0].x)
        + textureSample(image, image_sampler, uv - d * settings.weights[0].x)) * settings.weights[0].y;
    color += (textureSample(image, image_sampler, uv + d * settings.weights[1].x)
        + textureSample(image, image_sampler, uv - d * settings.weights[1].x)) * settings.weights[1].y;
    color += (textureSample(image, image_sampler, uv + d * settings.weights[2].x)
        + textureSample(image, image_sampler, uv - d * settings.weights[2].x)) * settings.weights[2].y;
    color += (textureSample(image, image_sampler, uv + d * settings.weights[3].x)
        + textureSample(image, image_sampler, uv - d * settings.weights[3].x)) * settings.weights[3].y;
    return color;
}
@fragment fn composite(v: Vertex) -> @location(0) vec4f {
    let p = v.position.xy - settings.bounds.xy;
    let size = settings.bounds.zw;
    var r = settings.corners.x;
    if p.x >= size.x * .5 { r = settings.corners.y; }
    if p.y >= size.y * .5 {
        r = settings.corners.z;
        if p.x >= size.x * .5 { r = settings.corners.w; }
    }
    r = min(r, min(size.x, size.y) * .5);
    let q = abs(p - size * .5) - (size * .5 - vec2f(r));
    if length(max(q, vec2f(0.))) + min(max(q.x, q.y), 0.) > r { discard; }
    return textureSample(image, image_sampler, settings.mapping.xy + v.uv * settings.mapping.zw);
}
@fragment fn copy(v: Vertex) -> @location(0) vec4f {
    return textureSample(image, image_sampler, v.uv);
}
"#;

#[derive(Clone, Copy)]
pub(super) struct Panel {
    pub index: usize,
    pub rect: egui::Rect,
    pub clip: egui::Rect,
    pub filter: crate::components::Backdrop,
}

struct Stage {
    view: wgpu::TextureView,
    settings: wgpu::Buffer,
    source: wgpu::BindGroup,
}

struct Region {
    size: [u32; 2],
    stages: Vec<Stage>,
    scratch: wgpu::TextureView,
    horizontal: wgpu::Buffer,
    vertical: wgpu::Buffer,
    composite: wgpu::Buffer,
    source: wgpu::BindGroup,
    intermediate: wgpu::BindGroup,
    filtered: wgpu::BindGroup,
}

// Eight adjacent weights on either side of the centre fit a sigma of at most two working texels.
fn kernel(sigma: f32) -> [f32; 9] {
    let sigma = sigma.max(0.01);
    let mut weights = std::array::from_fn(|i| (-0.5 * (i as f32 / sigma).powi(2)).exp());
    let total = weights[0] + 2. * weights[1..].iter().sum::<f32>();
    weights.iter_mut().for_each(|w| *w /= total);
    weights
}

fn gaussian_settings(settings: &mut [f32; 32], sigma: f32) {
    let weights = kernel(sigma);
    settings[6] = weights[0];
    for pair in 0..4 {
        let i = pair * 2 + 1;
        let weight = weights[i] + weights[i + 1];
        // Bilinear interpolation at this offset exactly combines the two neighbouring taps.
        settings[16 + pair * 4] = i as f32 + if weight > 0. { weights[i + 1] / weight } else { 0. };
        settings[17 + pair * 4] = weight;
    }
}

fn write_settings(queue: &wgpu::Queue, buffer: &wgpu::Buffer, values: &[f32; 32]) {
    let bytes: Vec<_> = values.iter().flat_map(|v| v.to_ne_bytes()).collect();
    queue.write_buffer(buffer, 0, &bytes);
}

pub(super) struct BackdropRenderer {
    size: [u32; 2],
    pub view: wgpu::TextureView,
    downsample: wgpu::RenderPipeline,
    filter: wgpu::RenderPipeline,
    composite: wgpu::RenderPipeline,
    copy: wgpu::RenderPipeline,
    layout: wgpu::BindGroupLayout,
    sampler: wgpu::Sampler,
    source: wgpu::BindGroup,
    regions: Vec<Region>,
}

fn image(device: &wgpu::Device, format: wgpu::TextureFormat, size: [u32; 2]) -> wgpu::TextureView {
    device
        .create_texture(&wgpu::TextureDescriptor {
            label: Some("UI backdrop"),
            size: wgpu::Extent3d {
                width: size[0],
                height: size[1],
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT
                | wgpu::TextureUsages::TEXTURE_BINDING
                | if cfg!(test) {
                    wgpu::TextureUsages::COPY_SRC | wgpu::TextureUsages::COPY_DST
                } else {
                    wgpu::TextureUsages::empty()
                },
            view_formats: &[],
        })
        .create_view(&Default::default())
}

fn uniform(device: &wgpu::Device) -> wgpu::Buffer {
    device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
        label: Some("UI backdrop settings"),
        contents: &[0; 128],
        usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
    })
}

fn bind(
    device: &wgpu::Device,
    layout: &wgpu::BindGroupLayout,
    sampler: &wgpu::Sampler,
    view: &wgpu::TextureView,
    settings: &wgpu::Buffer,
) -> wgpu::BindGroup {
    device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: Some("UI backdrop"),
        layout,
        entries: &[
            wgpu::BindGroupEntry {
                binding: 0,
                resource: wgpu::BindingResource::TextureView(view),
            },
            wgpu::BindGroupEntry {
                binding: 1,
                resource: wgpu::BindingResource::Sampler(sampler),
            },
            wgpu::BindGroupEntry {
                binding: 2,
                resource: settings.as_entire_binding(),
            },
        ],
    })
}

fn pass<'a>(encoder: &'a mut wgpu::CommandEncoder, view: &wgpu::TextureView, load: wgpu::LoadOp<wgpu::Color>) -> wgpu::RenderPass<'a> {
    encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
        label: Some("UI backdrop"),
        color_attachments: &[Some(wgpu::RenderPassColorAttachment {
            view,
            depth_slice: None,
            resolve_target: None,
            ops: wgpu::Operations {
                load,
                store: wgpu::StoreOp::Store,
            },
        })],
        depth_stencil_attachment: None,
        timestamp_writes: None,
        occlusion_query_set: None,
        multiview_mask: None,
    })
}

impl BackdropRenderer {
    pub fn ensure(slot: &mut Option<Self>, device: &wgpu::Device, format: wgpu::TextureFormat, size: [u32; 2]) {
        if slot.as_ref().is_some_and(|r| r.size == size) {
            return;
        }
        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("UI backdrop"),
            source: wgpu::ShaderSource::Wgsl(SHADER.into()),
        });
        let layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("UI backdrop"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        view_dimension: wgpu::TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("UI backdrop"),
            bind_group_layouts: &[Some(&layout)],
            immediate_size: 0,
        });
        let pipeline = |entry| {
            device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
                label: Some("UI backdrop"),
                layout: Some(&pipeline_layout),
                vertex: wgpu::VertexState {
                    module: &shader,
                    entry_point: Some("vs"),
                    compilation_options: Default::default(),
                    buffers: &[],
                },
                primitive: Default::default(),
                depth_stencil: None,
                multisample: Default::default(),
                fragment: Some(wgpu::FragmentState {
                    module: &shader,
                    entry_point: Some(entry),
                    compilation_options: Default::default(),
                    targets: &[Some(wgpu::ColorTargetState {
                        format,
                        blend: None,
                        write_mask: wgpu::ColorWrites::ALL,
                    })],
                }),
                multiview_mask: None,
                cache: None,
            })
        };
        let downsample = pipeline("downsample");
        let filter = pipeline("blur");
        let composite = pipeline("composite");
        let copy = pipeline("copy");
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("UI backdrop"),
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            ..Default::default()
        });
        let view = image(device, format, size);
        let source = bind(device, &layout, &sampler, &view, &uniform(device));
        *slot = Some(Self {
            size,
            view,
            downsample,
            filter,
            composite,
            copy,
            layout,
            sampler,
            source,
            regions: Vec::new(),
        });
    }

    pub fn blur(
        &mut self,
        device: &wgpu::Device,
        queue: &wgpu::Queue,
        encoder: &mut wgpu::CommandEncoder,
        format: wgpu::TextureFormat,
        panel: Panel,
        index: usize,
        scale: f32,
    ) {
        let screen = egui::Rect::from_min_size(egui::Pos2::ZERO, egui::vec2(self.size[0] as f32, self.size[1] as f32));
        let rect = panel.rect * scale;
        let clip = rect.intersect(panel.clip * scale).intersect(screen);
        if !clip.is_positive() {
            return;
        }
        let radius = panel.filter.blur * scale;
        let expanded = clip.expand(radius * 3.).intersect(screen);
        let left = expanded.min.x.floor();
        let top = expanded.min.y.floor();
        let width = expanded.max.x.ceil() - left;
        let height = expanded.max.y.ceil() - top;
        let size = [width as u32, height as u32];
        let levels = ((radius / 2.).log2().ceil() as usize).clamp(1, 8);
        // Each reduction filters the preceding level. A single large resize would alias fine details.
        // Separate uniforms for each pass/panel: queue writes precede the entire submission.
        if self.regions.get(index).is_none_or(|r| r.size != size || r.stages.len() != levels) {
            let mut stages: Vec<Stage> = Vec::with_capacity(levels);
            let mut reduced = size;
            for _ in 0..levels {
                reduced = reduced.map(|n| n.div_ceil(2).max(1));
                let settings = uniform(device);
                let source = stages.last().map_or(&self.view, |stage| &stage.view);
                stages.push(Stage {
                    view: image(device, format, reduced),
                    source: bind(device, &self.layout, &self.sampler, source, &settings),
                    settings,
                });
            }
            let scratch = image(device, format, reduced);
            let horizontal = uniform(device);
            let vertical = uniform(device);
            let composite = uniform(device);
            let filtered = &stages.last().unwrap().view;
            let region = Region {
                size,
                source: bind(device, &self.layout, &self.sampler, filtered, &horizontal),
                intermediate: bind(device, &self.layout, &self.sampler, &scratch, &vertical),
                filtered: bind(device, &self.layout, &self.sampler, filtered, &composite),
                stages,
                scratch,
                horizontal,
                vertical,
                composite,
            };
            if index < self.regions.len() {
                self.regions[index] = region;
            } else {
                self.regions.push(region);
            }
        }
        let region = &self.regions[index];
        let sw = self.size[0] as f32;
        let sh = self.size[1] as f32;
        for (i, stage) in region.stages.iter().enumerate() {
            let mut settings = [0.; 32];
            settings[..4].copy_from_slice(&if i == 0 {
                [left / sw, top / sh, width / sw, height / sh]
            } else {
                [0., 0., 1., 1.]
            });
            write_settings(queue, &stage.settings, &settings);
            let mut pass = pass(encoder, &stage.view, wgpu::LoadOp::Clear(wgpu::Color::TRANSPARENT));
            pass.set_pipeline(&self.downsample);
            pass.set_bind_group(0, &stage.source, &[]);
            pass.draw(0..3, 0..1);
        }
        let reduced = region.stages.last().unwrap().view.texture().size();
        let mut horizontal = [0.; 32];
        horizontal[4] = 1. / reduced.width as f32;
        // Account for odd-sized reductions so the requested blur stays consistent while scrolling.
        gaussian_settings(&mut horizontal, radius * reduced.width as f32 / width);
        let mut vertical = [0.; 32];
        vertical[5] = 1. / reduced.height as f32;
        gaussian_settings(&mut vertical, radius * reduced.height as f32 / height);
        let mut composite = [0.; 32];
        composite[..4].copy_from_slice(&[-left / width, -top / height, sw / width, sh / height]);
        composite[8..12].copy_from_slice(&[rect.min.x, rect.min.y, rect.width(), rect.height()]);
        let c = panel.filter.corners;
        composite[12..16].copy_from_slice(&[c.nw as f32 * scale, c.ne as f32 * scale, c.sw as f32 * scale, c.se as f32 * scale]);
        write_settings(queue, &region.horizontal, &horizontal);
        write_settings(queue, &region.vertical, &vertical);
        write_settings(queue, &region.composite, &composite);
        {
            let mut pass = pass(encoder, &region.scratch, wgpu::LoadOp::Clear(wgpu::Color::TRANSPARENT));
            pass.set_pipeline(&self.filter);
            pass.set_bind_group(0, &region.source, &[]);
            pass.draw(0..3, 0..1);
        }
        {
            let mut pass = pass(
                encoder,
                &region.stages.last().unwrap().view,
                wgpu::LoadOp::Clear(wgpu::Color::TRANSPARENT),
            );
            pass.set_pipeline(&self.filter);
            pass.set_bind_group(0, &region.intermediate, &[]);
            pass.draw(0..3, 0..1);
        }
        {
            let mut pass = pass(encoder, &self.view, wgpu::LoadOp::Load);
            pass.set_pipeline(&self.composite);
            pass.set_bind_group(0, &region.filtered, &[]);
            let x = clip.min.x.floor() as u32;
            let y = clip.min.y.floor() as u32;
            pass.set_scissor_rect(x, y, clip.max.x.ceil() as u32 - x, clip.max.y.ceil() as u32 - y);
            pass.draw(0..3, 0..1);
        }
    }

    pub fn present(&self, encoder: &mut wgpu::CommandEncoder, view: &wgpu::TextureView) {
        let mut pass = pass(encoder, view, wgpu::LoadOp::Clear(wgpu::Color::TRANSPARENT));
        pass.set_pipeline(&self.copy);
        pass.set_bind_group(0, &self.source, &[]);
        pass.draw(0..3, 0..1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gaussian_preserves_color_and_has_no_gaps_between_samples() {
        for sigma in [0.5, 1., 1.5, 2.] {
            let weights = kernel(sigma);
            assert!((weights[0] + 2. * weights[1..].iter().sum::<f32>() - 1.).abs() < 1e-6);
            assert!(weights.windows(2).all(|w| w[0] >= w[1]));
            // The impulse response has contiguous coverage across three standard deviations.
            assert!(weights[..=(3. * sigma).ceil() as usize].iter().all(|w| *w > 0.));
        }
    }

    #[test]
    #[cfg(not(target_arch = "wasm32"))]
    fn backdrop_removes_checkerboards_and_smooths_edges_at_each_pixel_density() {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle());
        let Ok(adapter) = pollster::block_on(instance.request_adapter(&Default::default())) else {
            eprintln!("Backdrop pixel regression requires an available GPU adapter");
            return;
        };
        let (device, queue) = pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor {
            required_limits: wgpu::Limits::downlevel_webgl2_defaults(),
            ..Default::default()
        }))
        .unwrap();
        for scale in [1, 2, 3] {
            let (width, height) = (256 * scale, 128 * scale);
            let mut input = Vec::new();
            for y in 0..height {
                for x in 0..width {
                    let white = if y < 64 * scale {
                        ((x / (4 * scale)) + (y / (4 * scale))) % 2 == 0
                    } else {
                        x >= 128 * scale
                    };
                    let value = if white { 255 } else { 0 };
                    input.extend_from_slice(&[value, value, value, 255]);
                }
            }
            let format = wgpu::TextureFormat::Rgba8Unorm;
            let mut renderer = None;
            BackdropRenderer::ensure(&mut renderer, &device, format, [width, height]);
            let renderer = renderer.as_mut().unwrap();
            let extent = wgpu::Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            };
            queue.write_texture(
                renderer.view.texture().as_image_copy(),
                &input,
                wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(width * 4),
                    rows_per_image: None,
                },
                extent,
            );
            let rect = egui::Rect::from_min_max(egui::pos2(16., 8.), egui::pos2(240., 120.));
            let panel = Panel {
                index: 0,
                rect,
                clip: rect,
                filter: crate::components::Backdrop {
                    blur: 12.,
                    corners: egui::CornerRadius::same(12),
                },
            };
            let mut encoder = device.create_command_encoder(&Default::default());
            renderer.blur(&device, &queue, &mut encoder, format, panel, 0, scale as f32);
            let output = device.create_buffer(&wgpu::BufferDescriptor {
                label: None,
                size: (width * height * 4) as u64,
                usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
                mapped_at_creation: false,
            });
            encoder.copy_texture_to_buffer(
                renderer.view.texture().as_image_copy(),
                wgpu::TexelCopyBufferInfo {
                    buffer: &output,
                    layout: wgpu::TexelCopyBufferLayout {
                        offset: 0,
                        bytes_per_row: Some(width * 4),
                        rows_per_image: None,
                    },
                },
                extent,
            );
            queue.submit([encoder.finish()]);
            let (tx, rx) = std::sync::mpsc::channel();
            output.slice(..).map_async(wgpu::MapMode::Read, move |r| tx.send(r).unwrap());
            device.poll(wgpu::PollType::wait_indefinitely()).unwrap();
            rx.recv().unwrap().unwrap();
            let pixels = output.slice(..).get_mapped_range().unwrap();
            let pixel = |x: u32, y: u32| pixels[((y * scale * width + x * scale) * 4) as usize] as i16;
            for x in 48..208 {
                assert!(
                    (pixel(x, 28) - 128).abs() <= 6,
                    "checkerboard remains at {x}, density {scale}: {}",
                    pixel(x, 28)
                );
            }
            let edge: Vec<_> = (80..176).map(|x| pixel(x, 96)).collect();
            assert!(edge[0] < 5 && *edge.last().unwrap() > 250);
            assert!(
                edge.windows(2).all(|p| (0..=12).contains(&(p[1] - p[0]))),
                "edge has repeated sharp steps at density {scale}: {edge:?}"
            );
            for (x, y) in [(0, 0), (16, 8), (250, 96)] {
                assert_eq!(
                    pixel(x, y),
                    input[((y * scale * width + x * scale) * 4) as usize] as i16,
                    "blur escaped its rounded clip"
                );
            }
        }
    }

    #[test]
    fn backdrop_shader_validates() {
        let module = naga::front::wgsl::parse_str(super::SHADER).unwrap();
        naga::valid::Validator::new(naga::valid::ValidationFlags::all(), naga::valid::Capabilities::empty())
            .validate(&module)
            .unwrap();
    }
}
