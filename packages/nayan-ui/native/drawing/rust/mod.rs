//! Native 2D art documents, isolated from game mesh registries and simulation.
//! SVG remains the persisted source of truth; previews and paper pixels are disposable caches.
//! Games can bind a document's pixels as a live texture, feed it document-space input and read its
//! stroke geometry and coverage (see `game.rs`).
mod controls;
mod export;
mod game;
mod path;
mod project;
mod raster;
#[cfg(test)]
mod tests;
mod tools;
use base64::Engine;
use controls::Controls;
pub use path::number;
use path::{LiveStroke, Sample, Stroke, parse_color};
use project::{Checkpoint, Layer, layer_id};
use raster::Raster;
pub use raster::Rect;
use serde_json::{Value, json};
use std::sync::Arc;
use tools::ShapeGesture;

pub struct Document {
    pub width: f32,
    pub height: f32,
    pub raster: Raster,
    pub revision: u64,
    paths: Vec<Arc<Stroke>>,
    history: Vec<Checkpoint>,
    layers: Vec<Layer>,
    active_layer: u32,
    editing_enabled: bool,
    shape: Option<ShapeGesture>,
    picked_color: Option<String>,
    error: Option<String>,
    event_key: Option<(u64, u64, u32, u32, bool, Option<String>, Option<String>)>,
    index: usize,
    brush: Value,
    controls: Controls,
    controls_revision: u64,
    live: Option<LiveStroke>,
    pub zoom: f32,
    pub offset: [f32; 2],
    pub viewport: [f32; 2],
    view_fit: ViewFit,
    pub background: [f32; 3],
    last_present: u64,
    paint_version: u64,
    texture: Option<u32>,
    texture_version: u64,
}

#[derive(PartialEq, Eq)]
enum ViewFit {
    Contain,
    Width,
    Cover,
}

impl Document {
    pub fn new(width: f32, height: f32, ratio: f32) -> Result<Self, String> {
        if !width.is_finite() || !height.is_finite() || width < 1. || height < 1. || width > 16384. || height > 16384. || !ratio.is_finite() {
            return Err("Invalid drawing dimensions".into());
        }
        Ok(Self {
            width,
            height,
            raster: Raster::new(width, height, ratio),
            revision: 0,
            paths: vec![],
            history: vec![Checkpoint {
                paths: vec![],
                layers: vec![Layer::base()],
                active: 0,
            }],
            layers: vec![Layer::base()],
            active_layer: 0,
            editing_enabled: true,
            shape: None,
            picked_color: None,
            error: None,
            event_key: None,
            index: 0,
            brush: Controls::default().brush(),
            controls: Controls::default(),
            controls_revision: 0,
            live: None,
            zoom: 1.,
            offset: [0., 0.],
            viewport: [width, height],
            view_fit: ViewFit::Contain,
            background: [1.; 3],
            last_present: u64::MAX,
            paint_version: 0,
            texture: None,
            texture_version: u64::MAX,
        })
    }
    fn checkpoint(&mut self) {
        self.history.truncate(self.index + 1);
        self.history.push(Checkpoint {
            paths: self.paths.clone(),
            layers: self.layers.clone(),
            active: self.active_layer,
        });
        if self.history.len() > 128 {
            self.history.remove(0);
        }
        self.index = self.history.len() - 1;
        self.revision += 1;
        self.paint_version += 1;
    }
    fn commit_stroke(&mut self, mut stroke: Stroke) {
        stroke.data["layerId"] = json!(self.active_layer);
        let stroke = Arc::new(tools::mirror(
            stroke,
            self.width,
            self.height,
            self.brush["symmetry"].as_str().unwrap_or("none"),
        ));
        self.raster.commit(&stroke);
        self.paths.push(stroke);
        self.checkpoint();
    }
    pub fn finish(&mut self) {
        if let Some(gesture) = self.shape.take() {
            if let Ok(stroke) = tools::shape(gesture.start, gesture.end, &gesture.options) {
                self.commit_stroke(stroke);
            }
        }
        if let Some(live) = self.live.take() {
            self.commit_stroke(live.finish());
        }
    }
    pub fn cancel(&mut self) {
        let changed = self.live.take().is_some() | self.shape.take().is_some();
        if changed {
            self.replay();
            self.paint_version += 1;
        }
    }
    /// Shared by the renderer and touch mapping so the visible paper is always drawable.
    pub fn view_scale(&self) -> f32 {
        let width = self.viewport[0] / self.width;
        let height = self.viewport[1] / self.height;
        match self.view_fit {
            ViewFit::Contain => width.min(height),
            ViewFit::Width => width,
            ViewFit::Cover => width.max(height),
        }
    }
    fn clamp_offset(&mut self) {
        let size = [self.width, self.height];
        let scale = self.view_scale() * self.zoom;
        for axis in 0..2 {
            let extent = size[axis] * scale;
            // Move must respond even when the paper fits. Keep at least three quarters of
            // the smaller extent visible, while allowing all of oversized artwork to be reached.
            let margin = extent.min(self.viewport[axis]) * 0.25;
            let limit = ((extent - self.viewport[axis]) / 2.).max(0.) + margin;
            self.offset[axis] = self.offset[axis].clamp(-limit, limit);
        }
    }
    fn local(&self, x: f32, y: f32) -> [f32; 2] {
        let fit = self.view_scale();
        [
            (x - self.viewport[0] / 2. - self.offset[0]) / (fit * self.zoom) + self.width / 2.,
            (y - self.viewport[1] / 2. - self.offset[1]) / (fit * self.zoom) + self.height / 2.,
        ]
    }
    /// Input in view coordinates (the canvas surface), mapped through the current zoom and pan.
    pub fn touch(&mut self, phase: i32, x: f32, y: f32, pressure: f32) {
        let [x, y] = self.local(x, y);
        self.touch_document(phase, x, y, pressure);
    }
    /// Input already in document coordinates: games map their own touches (or world hits) here.
    pub fn touch_document(&mut self, phase: i32, x: f32, y: f32, pressure: f32) {
        if !x.is_finite() || !y.is_finite() || !pressure.is_finite() {
            return;
        }
        let p = Sample { x, y, pressure };
        // Classified up front: no per-sample copy of the tool name.
        let (is_move, is_picker, is_fill, is_shape) = {
            let tool = self.brush["tool"].as_str().unwrap_or("brush");
            (tool == "move", tool == "picker", tool == "fill", tools::is_shape(tool))
        };
        if is_move {
            return;
        }
        if phase == 0 && is_picker {
            if let Some(i) = self.raster.offset(x, y).filter(|_| x < self.width && y < self.height) {
                let p = &self.raster.pixels[i..i + 4];
                let a = p[3] as f32 / 255.;
                let rgb = [0, 1, 2].map(|c| (p[c] as f32 + self.background[c] * 255. * (1. - a)).round().clamp(0., 255.) as u8);
                let color = format!("#{:02x}{:02x}{:02x}", rgb[0], rgb[1], rgb[2]);
                self.brush["color"] = json!(color);
                self.brush["tool"] = json!("brush");
                self.controls.color = color.clone();
                self.controls.tool = "brush".into();
                self.controls_revision += 1;
                self.picked_color = Some(color);
            }
            return;
        }
        if !self.editable() {
            return;
        }
        if is_fill {
            if phase == 0 && x >= 0. && y >= 0. && x < self.width && y < self.height {
                match tools::bucket(&self.raster, x, y, number(&self.brush, "tolerance", 0.08), &self.brush) {
                    Ok(Some(stroke)) => {
                        self.error = None;
                        self.commit_stroke(stroke);
                    }
                    Err(error) => self.error = Some(error),
                    _ => {}
                }
            }
            return;
        }
        if is_shape && phase != 4 {
            match phase {
                0 => {
                    self.finish();
                    if x >= 0. && y >= 0. && x <= self.width && y <= self.height {
                        self.shape = Some(ShapeGesture {
                            start: p,
                            end: p,
                            options: self.brush.clone(),
                        });
                    }
                }
                1 | 2 => {
                    if let Some(g) = &mut self.shape {
                        g.end = p;
                    }
                    if phase == 2 {
                        self.finish();
                    }
                }
                _ => self.cancel(),
            }
            self.paint_version += 1;
            return;
        }
        match phase {
            0 | 4 => {
                self.finish();
                if x < 0. || y < 0. || x > self.width || y > self.height {
                    return;
                }
                let mut brush = self.brush.clone();
                if phase == 4 {
                    brush["isEraser"] = json!(true);
                    brush["brushType"] = json!("NORMAL");
                }
                if let Ok(mut live) = LiveStroke::new(&brush, p) {
                    live.symmetry = (self.width, self.height, self.brush["symmetry"].as_str().unwrap_or("none").to_owned());
                    self.live = Some(live);
                    self.paint_version += 1;
                }
            }
            1 => {
                if let Some(live) = &mut self.live {
                    live.update(p);
                    self.paint_version += 1;
                }
            }
            2 => {
                if let Some(live) = &mut self.live {
                    live.end(p);
                }
                self.finish();
            }
            _ => self.cancel(),
        }
    }
    pub fn transform(&mut self, dx: f32, dy: f32, scale: f32) {
        if !dx.is_finite() || !dy.is_finite() || !scale.is_finite() || scale <= 0. {
            return;
        }
        self.zoom = (self.zoom * scale).clamp(0.5, 8.);
        self.offset[0] += dx;
        self.offset[1] += dy;
        self.clamp_offset();
        self.paint_version += 1;
    }
    pub fn summary(&self) -> Value {
        json!({"count":self.paths.len(),"canUndo":self.index>0,"canRedo":self.index+1<self.history.len(),"revision":self.revision,"width":self.width,"height":self.height,"pixelWidth":self.raster.width,"pixelHeight":self.raster.height,"zoom":self.zoom,"layers":self.layers,"activeLayer":self.active_layer,"editable":self.editable(),"controls":self.controls,"pickedColor":self.picked_color,"tool":self.brush["tool"],"isDrawing":self.live.is_some() || self.shape.is_some(),"error":self.error})
    }
    /// Changes in document state only: samples and pan movements never allocate a JS event.
    pub fn take_event(&mut self) -> Option<Value> {
        let key = (
            self.revision,
            self.controls_revision,
            self.active_layer,
            (self.zoom * 100.).round() as u32,
            self.live.is_some() || self.shape.is_some(),
            self.picked_color.clone(),
            self.error.clone(),
        );
        if self.event_key.as_ref() == Some(&key) {
            return None;
        }
        self.event_key = Some(key);
        Some(self.summary())
    }
    fn load(&mut self, value: &Value) -> Result<Value, String> {
        let input = if let Some(s) = value.as_str() {
            serde_json::from_str::<Value>(s).map_err(|e| e.to_string())?
        } else {
            value.clone()
        };
        let (raw, layers, active) = if input.is_array() {
            (&input, vec![Layer::base()], 0)
        } else {
            if input["version"] != 2 {
                return Err("Unsupported drawing project version".into());
            }
            let layers: Vec<Layer> = serde_json::from_value(input["layers"].clone()).map_err(|_| "Invalid drawing layers")?;
            if layers.is_empty() || layers.len() > 16 {
                return Err("A project needs 1 to 16 layers".into());
            }
            let mut ids = std::collections::HashSet::new();
            for layer in &layers {
                if !ids.insert(layer.id) || !layer.opacity.is_finite() || !(0. ..=1.).contains(&layer.opacity) || layer.name.chars().count() > 60 {
                    return Err("Invalid drawing layer".into());
                }
            }
            let active = input["activeLayer"]
                .as_u64()
                .filter(|id| *id <= u32::MAX as u64)
                .ok_or("Invalid active layer")? as u32;
            if !ids.contains(&active) {
                return Err("Active layer not found".into());
            }
            (&input["paths"], layers, active)
        };
        let input = raw.as_array().ok_or("Drawing paths must be an array")?;
        if input.len() > 50_000 {
            return Err("Drawing has too many strokes".into());
        }
        let paths = input
            .iter()
            .map(|v| Stroke::parse(v.clone()).map(Arc::new))
            .collect::<Result<Vec<_>, _>>()?;
        if paths.iter().any(|s| !layers.iter().any(|l| l.id == layer_id(s))) {
            return Err("Stroke references a missing layer".into());
        }
        self.live = None;
        self.shape = None;
        self.paths = paths;
        self.layers = layers;
        self.active_layer = active;
        self.history = vec![Checkpoint {
            paths: self.paths.clone(),
            layers: self.layers.clone(),
            active: self.active_layer,
        }];
        self.index = 0;
        self.revision += 1;
        self.paint_version += 1;
        self.replay();
        Ok(self.summary())
    }
    pub fn command(&mut self, v: Value) -> Result<Value, String> {
        if !self.editing_enabled && matches!(v["op"].as_str(), Some("undo" | "redo" | "clear" | "layer" | "fill" | "shape" | "load")) {
            return Err("Artwork is being saved".into());
        }
        match v.get("op").and_then(Value::as_str).unwrap_or("") {
            "load" => self.load(&v["paths"]),
            "project" => Ok(self.project()),
            "svg" => Ok(json!(self.svg())),
            "shapes" => Ok(tools::catalog()),
            "editing" => {
                self.finish();
                self.editing_enabled = v["enabled"].as_bool().unwrap_or(true);
                self.event_key = None;
                Ok(self.summary())
            }
            "event" => Ok(self.take_event().unwrap_or(Value::Null)),
            "draft" => {
                let after = v["afterRevision"].as_i64().unwrap_or(-1);
                if self.live.is_some() || self.shape.is_some() || after >= 0 && self.revision == after as u64 {
                    return Ok(Value::Null);
                }
                let project = self.project().to_string();
                Ok(json!({"project":project,"revision":self.revision,"width":self.width,"height":self.height}))
            }
            "layer" => self.layer_command(&v),
            "fill" => {
                self.finish();
                if !self.editable() {
                    return Err("Select a visible, unlocked layer first".into());
                }
                let x = number(&v, "x", -1.);
                let y = number(&v, "y", -1.);
                if x >= 0. && y >= 0. && x < self.width && y < self.height {
                    if let Some(stroke) = tools::bucket(&self.raster, x, y, number(&v, "tolerance", 0.08), &self.brush)? {
                        self.commit_stroke(stroke);
                    }
                }
                Ok(self.summary())
            }
            "shape" => {
                self.finish();
                if !self.editable() {
                    return Err("Select a visible, unlocked layer first".into());
                }
                let start = Sample {
                    x: number(&v, "x", 0.),
                    y: number(&v, "y", 0.),
                    pressure: 1.,
                };
                let end = Sample {
                    x: number(&v, "endX", 0.),
                    y: number(&v, "endY", 0.),
                    pressure: 1.,
                };
                let mut options = self.brush.clone();
                options["tool"] = v["kind"].clone();
                options["filled"] = v["filled"].clone();
                self.commit_stroke(tools::shape(start, end, &options)?);
                Ok(self.summary())
            }
            "controls" => self.update_controls(&v),
            "brush" => {
                let mut brush = v.clone();
                if v.get("isEraser").and_then(Value::as_bool).unwrap_or(false) {
                    brush["brushType"] = json!("NORMAL");
                }
                // Reject bad color/width before accepting native touches.
                Stroke::parse(json!({"path":"","color":brush.get("color").cloned().unwrap_or(json!("#2567c7")),"width":number(&brush,"width",3.)}))?;
                self.finish();
                self.picked_color = None;
                self.brush = brush;
                self.sync_legacy_controls();
                Ok(Value::Null)
            }
            "paths" => {
                self.finish();
                Ok(Value::Array(self.paths.iter().map(|p| p.data.clone()).collect()))
            }
            "state" => Ok(self.summary()),
            "undo" | "redo" => {
                self.finish();
                let redo = v["op"] == "redo";
                let index = if redo {
                    (self.index + 1).min(self.history.len() - 1)
                } else {
                    self.index.saturating_sub(1)
                };
                if index != self.index {
                    self.index = index;
                    self.paths = self.history[index].paths.clone();
                    self.layers = self.history[index].layers.clone();
                    self.active_layer = self.history[index].active;
                    self.replay();
                    self.revision += 1;
                    self.paint_version += 1;
                }
                Ok(self.summary())
            }
            "clear" => {
                self.cancel();
                if !self.paths.is_empty() {
                    self.paths.clear();
                    self.replay();
                    self.checkpoint();
                }
                Ok(self.summary())
            }
            "invalidateView" => {
                self.invalidate();
                Ok(self.summary())
            }
            "viewFit" => {
                let fit = match v["fit"].as_str() {
                    Some("contain") => ViewFit::Contain,
                    Some("width") => ViewFit::Width,
                    Some("cover") => ViewFit::Cover,
                    _ => return Err("Invalid drawing view fit".into()),
                };
                if self.view_fit != fit {
                    self.finish();
                    self.view_fit = fit;
                    self.zoom = 1.;
                    self.offset = [0., 0.];
                    self.paint_version += 1;
                }
                Ok(self.summary())
            }
            "resetView" => {
                self.zoom = 1.;
                self.offset = [0., 0.];
                self.paint_version += 1;
                Ok(self.summary())
            }
            "cancel" => {
                self.cancel();
                Ok(self.summary())
            }
            "finish" => {
                self.finish();
                Ok(self.summary())
            }
            "transform" => {
                self.transform(number(&v, "dx", 0.), number(&v, "dy", 0.), number(&v, "scale", 1.));
                Ok(self.summary())
            }
            "touch" => {
                let (phase, x, y, pressure) = (
                    number(&v, "phase", 1.) as i32,
                    number(&v, "x", 0.),
                    number(&v, "y", 0.),
                    number(&v, "pressure", 1.),
                );
                if v["space"] == "document" {
                    self.touch_document(phase, x, y, pressure);
                } else {
                    self.touch(phase, x, y, pressure);
                }
                Ok(Value::Null)
            }
            "texture" => {
                let id = self.texture()?;
                Ok(json!({"id":id,"width":self.raster.width,"height":self.raster.height}))
            }
            "strokes" => Ok(self.strokes(&v)),
            "sample" => Ok(self.sample(number(&v, "x", -1.), number(&v, "y", -1.))),
            "coverage" => Ok(json!(self.coverage(&v))),
            "png" => {
                self.finish();
                let mut rgba = self.raster.pixels.clone();
                for p in rgba.chunks_exact_mut(4) {
                    let a = p[3] as u32;
                    if a > 0 {
                        for c in &mut p[..3] {
                            *c = ((*c as u32 * 255 + a / 2) / a).min(255) as u8;
                        }
                    }
                }
                let mut bytes = Vec::new();
                {
                    let mut encoder = png::Encoder::new(&mut bytes, self.raster.width, self.raster.height);
                    encoder.set_color(png::ColorType::Rgba);
                    encoder.set_depth(png::BitDepth::Eight);
                    let mut writer = encoder.write_header().map_err(|e| e.to_string())?;
                    writer.write_image_data(&rgba).map_err(|e| e.to_string())?;
                }
                Ok(json!({"base64":base64::engine::general_purpose::STANDARD.encode(bytes),"width":self.raster.width,"height":self.raster.height}))
            }
            "render" => Err("render is handled by the surface registry".into()),
            _ => Err("Unknown drawing command".into()),
        }
    }
    pub fn present(&mut self, surface: i32, width: f32, height: f32, background: &str) -> Result<bool, String> {
        if width <= 0. || height <= 0. || !width.is_finite() || !height.is_finite() {
            return Ok(false);
        }
        let [r, g, b, _] = parse_color(background)?;
        self.present_rgb(surface, width, height, [r, g, b])
    }
    /// `present` with the paper color as bytes (the per-frame native path: no string round trip).
    pub fn present_rgb(&mut self, surface: i32, width: f32, height: f32, color: [u8; 3]) -> Result<bool, String> {
        if width <= 0. || height <= 0. || !width.is_finite() || !height.is_finite() {
            return Ok(false);
        }
        let bg = [color[0] as f32 / 255., color[1] as f32 / 255., color[2] as f32 / 255.];
        if self.viewport != [width, height] || self.background != bg {
            if self.viewport != [width, height] {
                self.finish();
            }
            self.viewport = [width, height];
            self.clamp_offset();
            self.background = bg;
            self.paint_version += 1;
        }
        if self.last_present == self.paint_version {
            return Ok(false);
        }
        self.prepare_preview();
        let drawn = crate::render::draw_art(surface, self)?;
        if drawn {
            self.last_present = self.paint_version;
            self.raster.dirty = None;
        }
        Ok(drawn)
    }
    /// Rasterizes the in-progress stroke or shape into the paper pixels (shared by every consumer).
    fn prepare_preview(&mut self) {
        if let Some(live) = &mut self.live {
            self.raster.preview(live);
        }
        if let Some(g) = &self.shape {
            if let Ok(stroke) = tools::shape(g.start, g.end, &g.options) {
                let stroke = tools::mirror(stroke, self.width, self.height, self.brush["symmetry"].as_str().unwrap_or("none"));
                self.raster.preview_shape(&stroke);
            }
        }
    }
    pub fn invalidate(&mut self) {
        self.event_key = None;
        self.last_present = u64::MAX;
        self.raster.dirty = Some(Rect {
            x: 0,
            y: 0,
            width: self.raster.width,
            height: self.raster.height,
        });
    }
}

impl Document {
    pub(crate) fn surface_command(&mut self, id: i32, value: Value) -> Result<Value, String> {
        if value["op"] != "render" {
            return self.command(value);
        }
        let surface = number(&value, "surface", id as f32) as i32;
        if crate::render::resize_art_target(surface, number(&value, "pixelWidth", 0.) as u32, number(&value, "pixelHeight", 0.) as u32) {
            self.invalidate();
        }
        self.present(
            surface,
            number(&value, "width", self.width),
            number(&value, "height", self.height),
            value["background"].as_str().unwrap_or("#ffffff"),
        )
        .map(Value::Bool)
    }
}

pub fn create(w: f32, h: f32, ratio: f32) -> Result<i32, String> {
    crate::render::document::create_art(Document::new(w, h, ratio)?)
}

pub fn with<T>(id: i32, f: impl FnOnce(&mut Document) -> T) -> Option<T> {
    crate::render::document::with_art(id, f)
}

pub fn destroy(id: i32) {
    crate::render::document::destroy(id);
}

pub fn command(id: i32, text: &str) -> Result<Value, String> {
    if text.len() > 32_000_000 {
        return Err("Drawing document exceeds 32 MB".into());
    }
    crate::render::document::command(id, serde_json::from_str(text).map_err(|e| e.to_string())?)
}
