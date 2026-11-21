//! Cached paper plus an isolated live-stroke layer. Only changed pixels cross to the GPU.
use super::path::{LiveStroke, Stroke};
use raqote::{BlendMode, DrawOptions, DrawTarget, Path, PathOp, SolidSource, Source, Transform};

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Rect {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}
impl Rect {
    pub fn union(self, b: Self) -> Self {
        let x = self.x.min(b.x);
        let y = self.y.min(b.y);
        Self {
            x,
            y,
            width: (self.x + self.width).max(b.x + b.width) - x,
            height: (self.y + self.height).max(b.y + b.height) - y,
        }
    }
}
pub struct Raster {
    pub width: u32,
    pub height: u32,
    pub ratio: f32,
    pub pixels: Vec<u8>,
    pub dirty: Option<Rect>,
    /// Pixels changed since the bound game texture was last refreshed (independent of `dirty`,
    /// which the drawing surface consumes).
    pub texture_dirty: Option<Rect>,
    paper: DrawTarget,
    ink: DrawTarget,
    glow: Option<DrawTarget>,
    /// Per-layer target reused by `replay_layers`, created on first use.
    scratch: Option<DrawTarget>,
    live_bounds: Option<Rect>,
    below: Vec<u32>,
    above: Vec<u32>,
    layer_opacity: f32,
}
// SAFETY: Raqote's only non-Send fields are arena-internal edge pointers. The owned arena
// keeps their allocations stable when moved. Raster never exposes those pointers, and every
// access to a document (UI input, JSI commands, render and disposal) holds DOCUMENTS' mutex.
// It is safe to move exclusive ownership between those threads, never to share references.
unsafe impl Send for Raster {}
impl Raster {
    pub fn new(w: f32, h: f32, ratio: f32) -> Self {
        let ratio = ratio.clamp(0.1, 3.).min(2048. / w.max(h)).min((4_000_000. / (w * h)).sqrt());
        let width = (w * ratio).ceil().max(1.) as u32;
        let height = (h * ratio).ceil().max(1.) as u32;
        let make = || {
            let mut dt = DrawTarget::new(width as i32, height as i32);
            dt.set_transform(&Transform::scale(ratio, ratio));
            dt
        };
        Self {
            width,
            height,
            ratio,
            pixels: vec![0; width as usize * height as usize * 4],
            dirty: Some(Rect { x: 0, y: 0, width, height }),
            texture_dirty: Some(Rect { x: 0, y: 0, width, height }),
            paper: make(),
            ink: make(),
            glow: None,
            scratch: None,
            live_bounds: None,
            below: vec![],
            above: vec![],
            layer_opacity: 1.,
        }
    }
    pub fn replay<'a>(&mut self, strokes: impl Iterator<Item = &'a Stroke>) {
        self.below.clear();
        self.above.clear();
        self.layer_opacity = 1.;
        self.paper.clear(SolidSource { r: 0, g: 0, b: 0, a: 0 });
        self.reset_live();
        for stroke in strokes {
            draw(&mut self.paper, stroke, &stroke.path, false, false);
        }
        self.sync(
            Rect {
                x: 0,
                y: 0,
                width: self.width,
                height: self.height,
            },
            None,
        );
    }
    pub fn replay_layers(&mut self, strokes: &[std::sync::Arc<Stroke>], layers: &[super::project::Layer], active: u32) {
        self.reset_live();
        let size = (self.width * self.height) as usize;
        // Reuse the composite buffers' allocations across undos.
        for buffer in [&mut self.below, &mut self.above] {
            buffer.clear();
            buffer.resize(size, 0);
        }
        self.paper.clear(SolidSource { r: 0, g: 0, b: 0, a: 0 });
        self.layer_opacity = 1.;
        let (width, height, ratio) = (self.width as i32, self.height as i32, self.ratio);
        let scratch = self.scratch.get_or_insert_with(|| {
            let mut dt = DrawTarget::new(width, height);
            dt.set_transform(&Transform::scale(ratio, ratio));
            dt
        });
        // One pass over the strokes: each goes to the first layer with its id (in draw order).
        let mut buckets: Vec<Vec<&Stroke>> = vec![Vec::new(); layers.len()];
        for stroke in strokes {
            let id = super::project::layer_id(stroke);
            if let Some(k) = layers.iter().position(|l| l.id == id) {
                buckets[k].push(stroke);
            }
        }
        let mut seen = false;
        for layer in layers {
            let is_active = layer.id == active;
            if is_active {
                seen = true;
                self.layer_opacity = if layer.visible { layer.opacity } else { 0. };
            }
            if !layer.visible {
                continue;
            }
            scratch.clear(SolidSource { r: 0, g: 0, b: 0, a: 0 });
            let bucket = layers.iter().position(|l| l.id == layer.id).map_or(&[][..], |k| &buckets[k][..]);
            for stroke in bucket {
                draw(scratch, stroke, &stroke.path, false, false);
            }
            if is_active {
                self.paper.get_data_mut().copy_from_slice(scratch.get_data());
            } else {
                let target = if seen { &mut self.above } else { &mut self.below };
                for (dst, src) in target.iter_mut().zip(scratch.get_data()) {
                    *dst = composite(*dst, *src, layer.opacity, false, false);
                }
            }
        }
        self.sync(
            Rect {
                x: 0,
                y: 0,
                width: self.width,
                height: self.height,
            },
            None,
        );
    }
    pub fn preview_shape(&mut self, stroke: &Stroke) {
        let old = self.live_bounds;
        self.reset_live();
        if let Some(rect) = old {
            self.sync(rect, None);
        }
        if let Some(rect) = bounds(&stroke.path, stroke.width + 3., self.ratio, self.width, self.height) {
            draw(&mut self.ink, stroke, &stroke.path, false, true);
            self.live_bounds = Some(rect);
            self.sync(rect, Some(stroke));
        }
    }
    pub fn reset_live(&mut self) {
        if let Some(rect) = self.live_bounds.take() {
            for dt in std::iter::once(&mut self.ink).chain(self.glow.iter_mut()) {
                let data = dt.get_data_mut();
                for y in rect.y..rect.y + rect.height {
                    let start = (y * self.width + rect.x) as usize;
                    data[start..start + rect.width as usize].fill(0);
                }
            }
        }
    }
    pub fn preview(&mut self, live: &mut LiveStroke) {
        let mut dirty = None;
        for path in live.pending.drain(..) {
            let path = super::tools::mirror_path(path, live.symmetry.0, live.symmetry.1, &live.symmetry.2, live.stroke.fill);
            let pad = live.stroke.style(live.stroke.brush == "NEON").width + 3.;
            if let Some(rect) = bounds(&path, pad, self.ratio, self.width, self.height) {
                dirty = Some(dirty.map_or(rect, |r: Rect| r.union(rect)));
                if live.stroke.brush == "NEON" && !live.stroke.erase {
                    if self.glow.is_none() {
                        let mut dt = DrawTarget::new(self.width as i32, self.height as i32);
                        dt.set_transform(&Transform::scale(self.ratio, self.ratio));
                        self.glow = Some(dt);
                    }
                    draw(self.glow.as_mut().unwrap(), &live.stroke, &path, true, true);
                }
                draw(&mut self.ink, &live.stroke, &path, false, true);
            }
        }
        if let Some(rect) = dirty {
            self.live_bounds = Some(self.live_bounds.map_or(rect, |r| r.union(rect)));
            self.sync(rect, Some(&live.stroke));
        }
    }
    pub fn commit(&mut self, stroke: &Stroke) {
        let full = bounds(
            &stroke.path,
            stroke.style(stroke.brush == "NEON").width + 3.,
            self.ratio,
            self.width,
            self.height,
        );
        let rect = match (self.live_bounds, full) {
            (Some(a), Some(b)) => Some(a.union(b)),
            (a, b) => a.or(b),
        };
        draw(&mut self.paper, stroke, &stroke.path, false, false);
        if let Some(rect) = rect {
            self.sync(rect, None);
        }
        self.reset_live();
    }
    fn sync(&mut self, rect: Rect, live: Option<&Stroke>) {
        let width = self.width as usize;
        let (left, columns) = (rect.x as usize, rect.width as usize);
        let paper = self.paper.get_data();
        // Loop invariants: the live layers (glow, then ink) and their opacities.
        let live = live.map(|stroke| {
            let alpha = stroke.opacity * stroke.color[3] as f32 / 255.;
            let glow = self
                .glow
                .as_ref()
                .filter(|_| stroke.brush == "NEON" && !stroke.erase)
                .map(|glow| (glow.get_data(), alpha * 0.35));
            let ink_opacity = if stroke.erase { stroke.opacity } else { alpha };
            (glow, self.ink.get_data(), ink_opacity, stroke.erase)
        });
        let layers = (!self.below.is_empty()).then_some((&self.below[..], &self.above[..], self.layer_opacity));
        for y in rect.y as usize..(rect.y + rect.height) as usize {
            let row = y * width + left..y * width + left + columns;
            let out = self.pixels[row.start * 4..row.end * 4].as_chunks_mut::<4>().0;
            if live.is_none() && layers.is_none() {
                for (out, &p) in out.iter_mut().zip(&paper[row]) {
                    *out = rgba(p);
                }
                continue;
            }
            for (k, (out, &p)) in out.iter_mut().zip(&paper[row.clone()]).enumerate() {
                let i = row.start + k;
                let mut p = p;
                if let Some((glow, ink, ink_opacity, erase)) = live {
                    if let Some((glow, opacity)) = glow {
                        p = composite(p, glow[i], opacity, false, true);
                    }
                    p = composite(p, ink[i], ink_opacity, erase, false);
                }
                if let Some((below, above, opacity)) = layers {
                    p = composite(below[i], p, opacity, false, false);
                    p = composite(p, above[i], 1., false, false);
                }
                *out = rgba(p);
            }
        }
        self.dirty = Some(self.dirty.map_or(rect, |r| r.union(rect)));
        self.texture_dirty = Some(self.texture_dirty.map_or(rect, |r| r.union(rect)));
    }
    /// Byte offset of the pixel under document point (x, y), if it lies on the paper.
    pub fn offset(&self, x: f32, y: f32) -> Option<usize> {
        if !(x >= 0. && y >= 0.) {
            return None;
        }
        let (ix, iy) = ((x * self.ratio) as u32, (y * self.ratio) as u32);
        (ix < self.width && iy < self.height).then(|| ((iy * self.width + ix) * 4) as usize)
    }
}
fn draw(dt: &mut DrawTarget, stroke: &Stroke, path: &Path, glow: bool, preview: bool) {
    let [r, g, b, a] = stroke.color;
    let source = Source::Solid(SolidSource::from_unpremultiplied_argb(
        if preview || stroke.erase { 255 } else { a },
        r,
        g,
        b,
    ));
    let options = DrawOptions {
        blend_mode: if preview {
            BlendMode::SrcOver
        } else if stroke.erase {
            BlendMode::DstOut
        } else if glow {
            BlendMode::Screen
        } else {
            BlendMode::SrcOver
        },
        alpha: if preview { 1. } else { stroke.opacity * if glow { 0.35 } else { 1. } },
        ..Default::default()
    };
    if stroke.brush == "NEON" && !stroke.erase && !preview && !glow {
        draw(dt, stroke, path, true, false);
    }
    if stroke.fill && !glow {
        dt.fill(path, &source, &options);
    } else {
        let mut style = stroke.style(glow);
        if style.width == 0. {
            style.width = 1. / dt.get_transform().m11.abs().max(0.001);
        }
        dt.stroke(path, &source, &style, &options);
    }
}
/// Premultiplied ARGB (raqote) to RGBA bytes.
#[inline]
fn rgba(p: u32) -> [u8; 4] {
    [(p >> 16) as u8, (p >> 8) as u8, p as u8, (p >> 24) as u8]
}
#[inline]
fn composite(dst: u32, src: u32, opacity: f32, erase: bool, screen: bool) -> u32 {
    // Transparent source: the float path below would also return `dst` (unless opacity is NaN/inf).
    if src >> 24 == 0 && opacity.is_finite() {
        return dst;
    }
    let alpha = (src >> 24) as f32 / 255. * opacity;
    let da = (dst >> 24) as f32 / 255.;
    if alpha <= 0. {
        return dst;
    }
    let out_a = if erase { da * (1. - alpha) } else { alpha + da * (1. - alpha) };
    let mut out = ((out_a * 255. + 0.5).clamp(0., 255.) as u32) << 24;
    for shift in [0, 8, 16] {
        let d = ((dst >> shift) & 255) as f32 / 255.;
        let s = ((src >> shift) & 255) as f32 / 255. * opacity;
        let v = if erase {
            d * (1. - alpha)
        } else if screen {
            d + s - d * s
        } else {
            s + d * (1. - alpha)
        };
        out |= ((v * 255. + 0.5).clamp(0., 255.) as u32) << shift;
    }
    out
}
fn bounds(path: &Path, pad: f32, ratio: f32, width: u32, height: u32) -> Option<Rect> {
    let mut min = [f32::INFINITY; 2];
    let mut max = [f32::NEG_INFINITY; 2];
    let mut add = |p: &raqote::Point| {
        min[0] = min[0].min(p.x);
        min[1] = min[1].min(p.y);
        max[0] = max[0].max(p.x);
        max[1] = max[1].max(p.y);
    };
    for op in &path.ops {
        match op {
            PathOp::MoveTo(p) | PathOp::LineTo(p) => add(p),
            PathOp::QuadTo(a, b) => {
                add(a);
                add(b);
            }
            PathOp::CubicTo(a, b, c) => {
                add(a);
                add(b);
                add(c);
            }
            PathOp::Close => {}
        }
    }
    let x = ((min[0] - pad) * ratio).floor().clamp(0., width as f32) as u32;
    let y = ((min[1] - pad) * ratio).floor().clamp(0., height as f32) as u32;
    let right = ((max[0] + pad) * ratio).ceil().clamp(0., width as f32) as u32;
    let bottom = ((max[1] + pad) * ratio).ceil().clamp(0., height as f32) as u32;
    (right > x && bottom > y).then_some(Rect {
        x,
        y,
        width: right.saturating_sub(x),
        height: bottom.saturating_sub(y),
    })
}
