//! The engine's 2D presentation pass. Vector raster work stays off the JS thread; dirty rectangles
//! are uploaded into one reusable texture. No game mesh ids or per-stroke GPU resources are used.
use super::*;
use crate::drawing::{Document, Rect};
pub(super) struct ArtSurface {
    texture: Texture,
    pipeline: RenderPipeline,
    group: BindGroup,
    uniform: Buffer,
    width: u32,
    height: u32,
}
const SHADER: &str = r#"
struct Settings { mapping:vec4<f32>, paper:vec4<f32> }
@group(0) @binding(0) var<uniform> settings:Settings;
@group(0) @binding(1) var image:texture_2d<f32>;
@group(0) @binding(2) var image_sampler:sampler;
struct Out { @builtin(position) position:vec4<f32>, @location(0) uv:vec2<f32> }
@vertex fn vs(@builtin(vertex_index) index:u32)->Out {
 var points=array<vec2<f32>,3>(vec2<f32>(-1.,-1.),vec2<f32>(3.,-1.),vec2<f32>(-1.,3.));
 let p=points[index]; var out:Out;out.position=vec4<f32>(p,0.,1.);out.uv=vec2<f32>((p.x+1.)*0.5,(1.-p.y)*0.5);return out;
}
@fragment fn fs(input:Out)->@location(0) vec4<f32> {
 let uv=(input.uv-vec2<f32>(0.5)-settings.mapping.zw)/settings.mapping.xy+vec2<f32>(0.5);
 let pixel=textureSample(image,image_sampler,uv);
 let inside=all(uv>=vec2<f32>(0.))&&all(uv<=vec2<f32>(1.));
 let ink=select(vec4<f32>(0.),pixel,inside);
 var rgb=ink.rgb+settings.paper.rgb*(1.-ink.a);
 if settings.paper.a>0.5 {rgb=select(rgb/12.92,pow((rgb+vec3<f32>(0.055))/1.055,vec3<f32>(2.4)),rgb>vec3<f32>(0.04045));}
 return vec4<f32>(rgb,1.);
}
"#;
impl Gpu {
    pub fn draw_art(&mut self, target: &mut Target, doc: &Document) -> Result<bool, String> {
        let width = doc.raster.width;
        let height = doc.raster.height;
        let new = target.art.as_ref().is_none_or(|a| a.width != width || a.height != height);
        if new {
            let module = self.device.create_shader_module(ShaderModuleDescriptor {
                label: Some("drawing"),
                source: ShaderSource::Wgsl(SHADER.into()),
            });
            let pipeline = self.device.create_render_pipeline(&RenderPipelineDescriptor {
                label: Some("drawing"),
                layout: None,
                vertex: VertexState {
                    module: &module,
                    entry_point: Some("vs"),
                    compilation_options: Default::default(),
                    buffers: &[],
                },
                primitive: PrimitiveState::default(),
                depth_stencil: None,
                multisample: MultisampleState::default(),
                fragment: Some(FragmentState {
                    module: &module,
                    entry_point: Some("fs"),
                    compilation_options: Default::default(),
                    targets: &[Some(ColorTargetState {
                        format: target.config.format,
                        blend: None,
                        write_mask: ColorWrites::ALL,
                    })],
                }),
                multiview_mask: None,
                cache: None,
            });
            let texture = self.device.create_texture(&TextureDescriptor {
                label: Some("drawing pixels"),
                size: Extent3d {
                    width,
                    height,
                    depth_or_array_layers: 1,
                },
                mip_level_count: 1,
                sample_count: 1,
                dimension: TextureDimension::D2,
                format: TextureFormat::Rgba8Unorm,
                usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
                view_formats: &[],
            });
            let view = texture.create_view(&TextureViewDescriptor::default());
            let uniform = self.device.create_buffer(&BufferDescriptor {
                label: Some("drawing view"),
                size: 32,
                usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
                mapped_at_creation: false,
            });
            let sampler = self.device.create_sampler(&SamplerDescriptor {
                label: Some("drawing clamp"),
                mag_filter: FilterMode::Linear,
                min_filter: FilterMode::Linear,
                ..Default::default()
            });
            let group = self.device.create_bind_group(&BindGroupDescriptor {
                label: Some("drawing"),
                layout: &pipeline.get_bind_group_layout(0),
                entries: &[
                    BindGroupEntry {
                        binding: 0,
                        resource: uniform.as_entire_binding(),
                    },
                    BindGroupEntry {
                        binding: 1,
                        resource: BindingResource::TextureView(&view),
                    },
                    BindGroupEntry {
                        binding: 2,
                        resource: BindingResource::Sampler(&sampler),
                    },
                ],
            });
            target.art = Some(ArtSurface {
                texture,
                pipeline,
                group,
                uniform,
                width,
                height,
            });
        }
        let art = target.art.as_ref().unwrap();
        if let Some(rect) = if new {
            Some(Rect { x: 0, y: 0, width, height })
        } else {
            doc.raster.dirty
        }
        .filter(|r| r.width > 0 && r.height > 0)
        {
            // Straight from the full-width paper: no packed copy of the rectangle.
            let start = ((rect.y * width + rect.x) * 4) as usize;
            let end = start + (((rect.height - 1) * width + rect.width) * 4) as usize;
            self.write_pixels(
                &art.texture,
                [rect.x, rect.y, rect.width, rect.height],
                &doc.raster.pixels[start..end],
                width,
            );
        }
        let fit = doc.view_scale();
        let settings = [
            fit * doc.width * doc.zoom / doc.viewport[0],
            fit * doc.height * doc.zoom / doc.viewport[1],
            doc.offset[0] / doc.viewport[0],
            doc.offset[1] / doc.viewport[1],
            doc.background[0],
            doc.background[1],
            doc.background[2],
            if target.srgb { 1. } else { 0. },
        ];
        self.queue.write_buffer(&art.uniform, 0, bytes(&settings));
        let output = match target.surface.get_current_texture() {
            CurrentSurfaceTexture::Success(t) | CurrentSurfaceTexture::Suboptimal(t) => t,
            CurrentSurfaceTexture::Timeout | CurrentSurfaceTexture::Occluded => return Ok(false),
            CurrentSurfaceTexture::Outdated | CurrentSurfaceTexture::Lost => {
                target.surface.configure(&self.device, &target.config);
                return Ok(false);
            }
            e => return Err(format!("Drawing surface: {e:?}")),
        };
        let view = output.texture.create_view(&TextureViewDescriptor::default());
        let mut encoder = self.device.create_command_encoder(&CommandEncoderDescriptor { label: Some("drawing") });
        {
            let mut pass = encoder.begin_render_pass(&RenderPassDescriptor {
                label: Some("drawing"),
                color_attachments: &[Some(RenderPassColorAttachment {
                    view: &view,
                    depth_slice: None,
                    resolve_target: None,
                    ops: Operations {
                        load: LoadOp::Clear(Color::WHITE),
                        store: StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            pass.set_pipeline(&art.pipeline);
            pass.set_bind_group(0, &art.group, &[]);
            pass.draw(0..3, 0..1);
        }
        self.queue.submit([encoder.finish()]);
        self.queue.present(output);
        Ok(true)
    }
}
#[cfg(test)]
mod tests {
    #[test]
    fn drawing_shader_validates() {
        let module = naga::front::wgsl::parse_str(super::SHADER).unwrap();
        naga::valid::Validator::new(naga::valid::ValidationFlags::all(), naga::valid::Capabilities::empty())
            .validate(&module)
            .unwrap();
    }
}
