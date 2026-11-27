//! Renderer-independent SVG documents and native, pressure-aware brush geometry.
pub(super) use crate::svg::parse_svg;
use raqote::{LineCap, LineJoin, Path, PathBuilder, PathOp, Point, StrokeStyle, Winding};
use serde_json::{Value, json};

pub use crate::render::document::number;
pub fn svg(path: &Path) -> String {
    use std::fmt::Write;
    let mut s = String::new();
    for op in &path.ops {
        match op {
            PathOp::MoveTo(p) => {
                let _ = write!(s, "M{} {}", compact(p.x), compact(p.y));
            }
            PathOp::LineTo(p) => {
                let _ = write!(s, "L{} {}", compact(p.x), compact(p.y));
            }
            PathOp::QuadTo(a, b) => {
                let _ = write!(s, "Q{} {} {} {}", compact(a.x), compact(a.y), compact(b.x), compact(b.y));
            }
            PathOp::CubicTo(a, b, c) => {
                let _ = write!(
                    s,
                    "C{} {} {} {} {} {}",
                    compact(a.x),
                    compact(a.y),
                    compact(b.x),
                    compact(b.y),
                    compact(c.x),
                    compact(c.y)
                );
            }
            PathOp::Close => s.push('Z'),
        }
    }
    s
}
fn compact(value: f32) -> f32 {
    (value * 1000.).round() / 1000.
}
fn merge_ink(path: &Path) -> Path {
    use i_overlay::{core::fill_rule::FillRule, float::simplify::SimplifyShape};
    let flat = path.flatten(0.05);
    let mut contours: Vec<Vec<[f32; 2]>> = Vec::new();
    let mut contour = Vec::new();
    for op in flat.ops {
        match op {
            PathOp::MoveTo(p) => {
                if contour.len() > 2 {
                    contours.push(std::mem::take(&mut contour));
                } else {
                    contour.clear();
                }
                contour.push([p.x, p.y]);
            }
            PathOp::LineTo(p) => contour.push([p.x, p.y]),
            PathOp::Close => {
                if contour.len() > 2 {
                    contours.push(std::mem::take(&mut contour));
                } else {
                    contour.clear();
                }
            }
            _ => {}
        }
    }
    if contour.len() > 2 {
        contours.push(contour);
    }
    let shapes = contours.simplify_shape(FillRule::NonZero);
    let mut b = PathBuilder::new();
    for shape in shapes {
        for ring in shape {
            if let Some(p) = ring.first() {
                b.move_to(p[0], p[1]);
                for p in ring.iter().skip(1) {
                    b.line_to(p[0], p[1]);
                }
                b.close();
            }
        }
    }
    b.finish()
}
#[derive(Clone)]
pub struct Stroke {
    pub data: Value,
    pub path: Path,
    pub color: [u8; 4],
    pub width: f32,
    pub opacity: f32,
    pub erase: bool,
    pub brush: String,
    pub fill: bool,
    /// Smoothed gesture samples of a live brush stroke (one polyline per symmetry copy), kept in
    /// memory for games: colliders, tracing and scoring. Never serialized; loaded strokes have none.
    pub centerline: Vec<Vec<[f32; 2]>>,
}
impl Stroke {
    pub fn parse(data: Value) -> Result<Self, String> {
        if let Some(id) = data.get("layerId") {
            if id.as_u64().filter(|id| *id <= u32::MAX as u64).is_none() {
                return Err("Invalid stroke layer identifier".into());
            }
        }
        let source = data.get("path").and_then(Value::as_str).ok_or("Drawing is missing its SVG path")?;
        let mut path = parse_svg(source)?;
        let brush = data.get("brushType").and_then(Value::as_str).unwrap_or("NORMAL").to_owned();
        path.winding = match data.get("fillRule").and_then(Value::as_str) {
            Some("nonzero") => Winding::NonZero,
            Some("evenodd") => Winding::EvenOdd,
            _ if brush == "CALLIGRAPHY" || brush == "CRAYON" => Winding::NonZero,
            _ => Winding::EvenOdd,
        };
        let color = parse_color(data.get("color").and_then(Value::as_str).unwrap_or("#000000"))?;
        let width = number(&data, "width", 3.);
        if !(0.0..=16384.).contains(&width) {
            return Err("Invalid drawing stroke width".into());
        }
        let mut opacity = number(&data, "opacity", 1.).clamp(0., 1.);
        let erase = data.get("isEraser").and_then(Value::as_bool).unwrap_or(false);
        // Historical original Clear ignored opacity. Preserve old artwork; engine brushes support soft erasing.
        if erase && data.get("engineBrushVersion").is_none() {
            opacity = 1.;
        }
        let fill = data.get("style").and_then(Value::as_str) == Some("fill");
        Ok(Self {
            data,
            path,
            color,
            width,
            opacity,
            erase,
            brush,
            fill,
            centerline: Vec::new(),
        })
    }
    pub fn style(&self, glow: bool) -> StrokeStyle {
        let factor = if glow {
            3.
        } else {
            match self.brush.as_str() {
                "CALLIGRAPHY" => 1.8,
                "WATERCOLOR" => 2.5,
                "MARKER" => 1.6,
                "CRAYON" => 1.3,
                "NEON" => 1.2,
                "PENCIL" => 0.8,
                _ => 1.,
            }
        };
        StrokeStyle {
            width: self.width * factor,
            cap: match self.brush.as_str() {
                "CALLIGRAPHY" => LineCap::Square,
                "PENCIL" => LineCap::Butt,
                _ => LineCap::Round,
            },
            join: if self.brush == "CALLIGRAPHY" { LineJoin::Miter } else { LineJoin::Round },
            ..Default::default()
        }
    }
}
pub fn parse_color(s: &str) -> Result<[u8; 4], String> {
    if s == "transparent" {
        return Ok([0, 0, 0, 0]);
    }
    let c = s.parse::<svgtypes::Color>().map_err(|_| format!("Unsupported drawing color: {s}"))?;
    Ok([c.red, c.green, c.blue, c.alpha])
}
#[derive(Clone, Copy)]
pub struct Sample {
    pub x: f32,
    pub y: f32,
    pub pressure: f32,
}
pub struct LiveStroke {
    pub stroke: Stroke,
    pub pending: Vec<Path>,
    pub last: Sample,
    pub midpoint: Point,
    pub samples: usize,
    pub symmetry: (f32, f32, String),
    smoothing: f32,
    pressure: bool,
    seed: u32,
}
fn circle(x: f32, y: f32, r: f32) -> Path {
    let mut b = PathBuilder::new();
    b.move_to(x + r, y);
    b.arc(x, y, r, 0., -std::f32::consts::TAU);
    b.close();
    b.finish()
}
impl LiveStroke {
    pub fn new(options: &Value, p: Sample) -> Result<Self, String> {
        let brush = options.get("brushType").and_then(Value::as_str).unwrap_or("NORMAL");
        let mut stroke = Stroke::parse(
            json!({"path":"","color":options.get("color").cloned().unwrap_or(json!("#2567c7")),"width":number(options,"width",3.),"opacity":number(options,"opacity",1.),"isEraser":options.get("isEraser").and_then(Value::as_bool).unwrap_or(false),"brushType":brush,"style":if brush=="NEON" {"stroke"} else {"fill"},"fillRule":"nonzero","engineBrushVersion":1}),
        )?;
        stroke.path.winding = Winding::NonZero;
        stroke.centerline = vec![vec![[p.x, p.y]]];
        let mut live = Self {
            stroke,
            pending: vec![],
            last: p,
            midpoint: Point::new(p.x, p.y),
            samples: 1,
            symmetry: (0., 0., "none".into()),
            smoothing: number(options, "smoothing", 0.35).clamp(0., 0.85),
            pressure: options.get("pressure").and_then(Value::as_bool).unwrap_or(true),
            seed: ((p.x * 137. + p.y * 53.).abs() as u32).wrapping_add(17),
        };
        if brush != "NEON" {
            live.add_tip(p);
        }
        Ok(live)
    }
    fn width(&self, p: Sample) -> f32 {
        let pressure = if self.pressure {
            0.2 + 0.8 * p.pressure.clamp(0., 1.).sqrt()
        } else {
            1.
        };
        self.stroke.style(false).width * pressure
    }
    fn add(&mut self, path: Path) {
        self.stroke.path.ops.extend_from_slice(&path.ops);
        self.pending.push(path);
    }
    fn random(&mut self) -> f32 {
        self.seed = self.seed.wrapping_mul(1664525).wrapping_add(1013904223);
        (self.seed >> 8) as f32 / 16777216.
    }
    fn add_tip(&mut self, p: Sample) {
        let width = self.width(p);
        match self.stroke.brush.as_str() {
            "SPRINKLING" | "CRAYON" => {
                let spray = self.stroke.brush == "SPRINKLING";
                let count = if spray { 8 } else { 10 };
                for _ in 0..count {
                    let a = self.random() * std::f32::consts::TAU;
                    let d = self.random().sqrt() * width * if spray { 2.5 } else { 0.4 };
                    let r = if spray { (width * 0.06).max(0.45) } else { (width * 0.12).max(0.35) };
                    self.add(circle(p.x + a.cos() * d, p.y + a.sin() * d, r));
                }
            }
            "CALLIGRAPHY" => {
                let mut b = PathBuilder::new();
                b.move_to(p.x - width * 0.5, p.y - width * 0.2);
                b.line_to(p.x + width * 0.2, p.y + width * 0.5);
                b.line_to(p.x + width * 0.5, p.y + width * 0.2);
                b.line_to(p.x - width * 0.2, p.y - width * 0.5);
                b.close();
                self.add(b.finish());
            }
            _ => self.add(circle(p.x, p.y, width / 2.)),
        }
    }
    pub fn update(&mut self, mut p: Sample) {
        let distance = (p.x - self.last.x).hypot(p.y - self.last.y);
        if distance < 0.15 {
            return;
        }
        if self.samples >= 100_000 {
            return;
        }
        let filter = (1. - self.smoothing).max((distance / 12.).min(1.));
        p.x = self.last.x + (p.x - self.last.x) * filter;
        p.y = self.last.y + (p.y - self.last.y) * filter;
        if self.stroke.brush == "CRAYON" || self.stroke.brush == "SPRINKLING" {
            let spacing = (self.width(p) * 0.2).clamp(1., 4.);
            let steps = (distance / spacing).ceil().clamp(1., 256.) as usize;
            let start = self.last;
            for i in 1..=steps {
                let t = i as f32 / steps as f32;
                self.add_tip(Sample {
                    x: start.x + (p.x - start.x) * t,
                    y: start.y + (p.y - start.y) * t,
                    pressure: p.pressure,
                });
            }
        } else {
            let mid = Point::new((self.last.x + p.x) / 2., (self.last.y + p.y) / 2.);
            let mut b = PathBuilder::new();
            b.move_to(self.midpoint.x, self.midpoint.y);
            b.quad_to(self.last.x, self.last.y, mid.x, mid.y);
            let center = b.finish();
            if self.stroke.brush == "NEON" {
                if self.stroke.path.ops.is_empty() {
                    self.stroke.path.ops.push(PathOp::MoveTo(self.midpoint));
                }
                self.stroke.path.ops.extend(center.ops.iter().skip(1).cloned());
                self.pending.push(center);
            } else {
                let mut style = self.stroke.style(false);
                style.width = self.width(p);
                if self.stroke.brush == "CALLIGRAPHY" {
                    let dx = p.x - self.last.x;
                    let dy = p.y - self.last.y;
                    style.width *= 0.45 + dx.abs() / dx.hypot(dy).max(0.01);
                }
                self.add(raqote::stroke_to_path(&center.flatten(0.08), &style));
            }
            self.midpoint = mid;
        }
        self.last = p;
        self.samples += 1;
        if let Some(line) = self.stroke.centerline.first_mut() {
            line.push([p.x, p.y]);
        }
    }
    pub fn end(&mut self, p: Sample) {
        self.smoothing = 0.;
        self.update(p);
    }
    pub fn finish(mut self) -> Stroke {
        if self.stroke.brush == "NEON" && self.samples == 1 {
            let mut b = PathBuilder::new();
            b.move_to(self.last.x, self.last.y);
            b.line_to(self.last.x + 0.01, self.last.y);
            self.stroke.path = b.finish();
        } else if self.stroke.brush != "CRAYON" && self.stroke.brush != "SPRINKLING" {
            let mut b = PathBuilder::new();
            b.move_to(self.midpoint.x, self.midpoint.y);
            b.line_to(self.last.x, self.last.y);
            let center = b.finish();
            if self.stroke.brush == "NEON" {
                self.stroke.path.ops.extend(center.ops.iter().skip(1).cloned());
            } else {
                let mut style = self.stroke.style(false);
                style.width = self.width(self.last);
                self.add(raqote::stroke_to_path(&center.flatten(0.08), &style));
            }
        }
        if self.stroke.fill && !matches!(self.stroke.brush.as_str(), "CRAYON" | "SPRINKLING") {
            self.stroke.path = merge_ink(&self.stroke.path);
        }
        let serialized = svg(&self.stroke.path);
        if let Ok(mut path) = parse_svg(&serialized) {
            path.winding = Winding::NonZero;
            self.stroke.path = path;
        }
        self.stroke.data["path"] = json!(serialized);
        self.stroke
    }
}
