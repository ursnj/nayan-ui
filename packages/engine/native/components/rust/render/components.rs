//! UI uses the same Device, Queue, Target and surface lifecycle as games and drawing.
use super::*;
#[path = "component_blur.rs"]
mod blur;
pub(super) struct ComponentRenderer {
    paint: egui_wgpu::Renderer,
    backdrop: Option<blur::BackdropRenderer>,
    overlay_clear: Option<wgpu::RenderPipeline>,
}
fn overlay_clear_pipeline(device: &wgpu::Device, format: wgpu::TextureFormat) -> wgpu::RenderPipeline {
    let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
        label: Some("platform attachment cutout"),
        source: wgpu::ShaderSource::Wgsl(std::borrow::Cow::Borrowed(
            r#"
@vertex fn vs(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
    let positions = array<vec2f, 3>(vec2f(-1., -1.), vec2f(3., -1.), vec2f(-1., 3.));
    return vec4f(positions[index], 0., 1.);
}
@fragment fn fs() -> @location(0) vec4f { return vec4f(0.); }
"#,
        )),
    });
    device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
        label: Some("platform attachment cutout"),
        layout: None,
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
            entry_point: Some("fs"),
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
}
impl Gpu {
    pub fn draw_components(&mut self, target: &mut Target, ui: &mut crate::components::ComponentDocument, width: f32, height: f32) -> Result<bool, String> {
        if target.ui.is_none() {
            ui.reupload_textures();
            let caps = target.surface.get_capabilities(&self.adapter);
            #[cfg(target_arch = "wasm32")]
            let caps = {
                let mut caps = caps;
                // wgpu's WebGPU capability list advertises only Opaque, while its canvas
                // configure path supports PreMultiplied. UI must blend with its backdrop.
                if self.backend == "webgpu" && !caps.alpha_modes.contains(&wgpu::CompositeAlphaMode::PreMultiplied) {
                    caps.alpha_modes.push(wgpu::CompositeAlphaMode::PreMultiplied);
                }
                caps
            };
            if let Some(alpha) = [
                wgpu::CompositeAlphaMode::PreMultiplied,
                wgpu::CompositeAlphaMode::PostMultiplied,
                wgpu::CompositeAlphaMode::Inherit,
            ]
            .into_iter()
            .find(|mode| caps.alpha_modes.contains(mode))
            {
                if target.config.alpha_mode != alpha {
                    target.config.alpha_mode = alpha;
                    target.surface.configure(&self.device, &target.config);
                }
            }
        }
        let output = match target.surface.get_current_texture() {
            wgpu::CurrentSurfaceTexture::Success(t) | wgpu::CurrentSurfaceTexture::Suboptimal(t) => t,
            wgpu::CurrentSurfaceTexture::Timeout | wgpu::CurrentSurfaceTexture::Occluded => return Ok(false),
            wgpu::CurrentSurfaceTexture::Outdated | wgpu::CurrentSurfaceTexture::Lost => {
                target.surface.configure(&self.device, &target.config);
                return Ok(false);
            }
            e => return Err(format!("UI surface: {e:?}")),
        };
        let ratio = (target.config.width as f32 / width).min(target.config.height as f32 / height).max(0.1);
        let frame = ui.present_frame(width, height, ratio);
        let background = ui.background;
        let rgba = if target.srgb {
            egui::Rgba::from(background).to_array()
        } else {
            background.to_array().map(|v| v as f32 / 255.)
        };
        let clear = wgpu::Color {
            r: rgba[0] as f64,
            g: rgba[1] as f64,
            b: rgba[2] as f64,
            a: rgba[3] as f64,
        };
        let mut jobs = ui.context.tessellate(frame.shapes, frame.pixels_per_point);
        let mut panels = Vec::new();
        let mut index = 0;
        jobs.retain(|job| {
            if let egui::epaint::Primitive::Callback(callback) = &job.primitive {
                if let Some(filter) = callback.callback.downcast_ref::<crate::components::Backdrop>() {
                    if callback
                        .rect
                        .intersect(job.clip_rect)
                        .intersect(egui::Rect::from_min_size(egui::Pos2::ZERO, egui::vec2(width, height)))
                        .is_positive()
                    {
                        panels.push(blur::Panel {
                            index,
                            rect: callback.rect,
                            clip: job.clip_rect,
                            filter: *filter,
                        });
                    }
                    return false;
                }
            }
            index += 1;
            true
        });
        let screen = egui_wgpu::ScreenDescriptor {
            size_in_pixels: [target.config.width, target.config.height],
            pixels_per_point: frame.pixels_per_point,
        };
        let renderer = target.ui.get_or_insert_with(|| ComponentRenderer {
            paint: egui_wgpu::Renderer::new(&self.device, target.config.format, Default::default()),
            overlay_clear: None,
            backdrop: None,
        });
        for (id, deltas) in &frame.textures_delta.set {
            for delta in deltas {
                renderer.paint.update_texture(&self.device, &self.queue, *id, delta);
            }
        }
        let mut encoder = self
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor { label: Some("engine UI") });
        let buffers = renderer.paint.update_buffers(&self.device, &self.queue, &mut encoder, &jobs, &screen);
        let view = output.texture.create_view(&Default::default());
        if !panels.is_empty() {
            blur::BackdropRenderer::ensure(&mut renderer.backdrop, &self.device, target.config.format, screen.size_in_pixels);
            let backdrop = renderer.backdrop.as_mut().unwrap();
            let clips: Vec<_> = jobs.iter().map(|job| job.clip_rect).collect();
            let mut first = 0;
            for (i, panel) in panels.iter().enumerate() {
                paint_segment(
                    &renderer.paint,
                    &mut encoder,
                    &backdrop.view,
                    &mut jobs,
                    &clips,
                    first..panel.index,
                    if i == 0 { wgpu::LoadOp::Clear(clear) } else { wgpu::LoadOp::Load },
                    &screen,
                );
                backdrop.blur(
                    &self.device,
                    &self.queue,
                    &mut encoder,
                    target.config.format,
                    *panel,
                    i,
                    screen.pixels_per_point,
                );
                first = panel.index;
            }
            let end = jobs.len();
            paint_segment(
                &renderer.paint,
                &mut encoder,
                &backdrop.view,
                &mut jobs,
                &clips,
                first..end,
                wgpu::LoadOp::Load,
                &screen,
            );
            backdrop.present(&mut encoder, &view);
        } else {
            let end = jobs.len();
            paint_segment(
                &renderer.paint,
                &mut encoder,
                &view,
                &mut jobs,
                &[],
                0..end,
                wgpu::LoadOp::Clear(clear),
                &screen,
            );
        }
        #[cfg(not(target_arch = "wasm32"))]
        let overlays = ui.overlay_clips();
        #[cfg(target_arch = "wasm32")]
        let overlays: std::collections::BTreeMap<String, [f32; 4]> = Default::default();
        if !overlays.is_empty() {
            // Android SurfaceView is composited above the RN window. Attachments own these
            // pixels, including their backdrop, so the GPU cannot tint native images/pickers.
            let pipeline = renderer
                .overlay_clear
                .get_or_insert_with(|| overlay_clear_pipeline(&self.device, target.config.format));
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("platform attachments"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    depth_slice: None,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Load,
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            pass.set_pipeline(pipeline);
            for [x, y, w, h] in overlays.values() {
                let left = (x * ratio).floor().clamp(0., target.config.width as f32) as u32;
                let top = (y * ratio).floor().clamp(0., target.config.height as f32) as u32;
                let right = ((x + w) * ratio).ceil().clamp(0., target.config.width as f32) as u32;
                let bottom = ((y + h) * ratio).ceil().clamp(0., target.config.height as f32) as u32;
                if right > left && bottom > top {
                    pass.set_scissor_rect(left, top, right - left, bottom - top);
                    pass.draw(0..3, 0..1);
                }
            }
        }
        self.queue.submit(buffers.into_iter().chain(std::iter::once(encoder.finish())));
        self.queue.present(output);
        for id in &frame.textures_delta.free {
            renderer.paint.free_texture(id);
        }
        Ok(true)
    }
}

// egui-wgpu restarts its mesh-buffer iterator for every render call. Keep all jobs in
// each segment and hide the other clips so buffer slices retain their original indices.
fn paint_segment(
    paint: &egui_wgpu::Renderer,
    encoder: &mut wgpu::CommandEncoder,
    view: &wgpu::TextureView,
    jobs: &mut [egui::ClippedPrimitive],
    clips: &[egui::Rect],
    range: std::ops::Range<usize>,
    load: wgpu::LoadOp<wgpu::Color>,
    screen: &egui_wgpu::ScreenDescriptor,
) {
    if !clips.is_empty() {
        for (index, job) in jobs.iter_mut().enumerate() {
            job.clip_rect = if range.contains(&index) { clips[index] } else { egui::Rect::NOTHING };
        }
    }
    let pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
        label: Some("engine UI"),
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
    });
    paint.render(&mut pass.forget_lifetime(), jobs, screen);
}
