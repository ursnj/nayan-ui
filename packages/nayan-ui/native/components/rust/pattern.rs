//! Decorative vector recipes: cached GPU geometry and native navigation image adapters.
#[path = "pattern_image.rs"]
mod image;
use super::*;
use std::sync::Arc;

#[derive(Clone, Deserialize)]
#[serde(untagged)]
enum Length {
    Points(f32),
    Percent(String),
    Relative {
        percent: f32,
        #[serde(default)]
        offset: f32,
        min: Option<f32>,
        #[serde(rename = "maxInset")]
        max_inset: Option<f32>,
    },
}
impl Length {
    fn resolve(&self, span: f32) -> f32 {
        let value = match self {
            Self::Points(value) => *value,
            Self::Percent(value) => value.trim_end_matches('%').parse::<f32>().unwrap_or(0.) * span / 100.,
            Self::Relative {
                percent,
                offset,
                min,
                max_inset,
            } => {
                let value = span * percent / 100. + offset;
                let value = max_inset.map_or(value, |inset| value.min(span - inset));
                min.map_or(value, |minimum| value.max(minimum))
            }
        };
        value.clamp(-1_000_000., 1_000_000.)
    }
    fn valid(&self) -> bool {
        match self {
            Self::Points(v) => v.is_finite(),
            Self::Percent(v) => v.strip_suffix('%').and_then(|n| n.parse::<f32>().ok()).is_some_and(f32::is_finite),
            Self::Relative {
                percent,
                offset,
                min,
                max_inset,
            } => percent.is_finite() && offset.is_finite() && min.is_none_or(f32::is_finite) && max_inset.is_none_or(f32::is_finite),
        }
    }
}

#[derive(Deserialize)]
struct Gradient {
    start: [Length; 2],
    end: [Length; 2],
    colors: Vec<String>,
}
#[derive(Deserialize)]
#[serde(tag = "kind")]
enum Shape {
    #[serde(rename = "circle")]
    Circle { cx: Length, cy: Length, r: Length, color: String },
    #[serde(rename = "rrect")]
    Rect {
        x: Length,
        y: Length,
        w: Length,
        h: Length,
        r: Length,
        color: String,
    },
    #[serde(rename = "diamond")]
    Diamond { cx: Length, cy: Length, size: Length, color: String },
    #[serde(rename = "path")]
    Path(PathShape),
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PathShape {
    d: String,
    x: Option<Length>,
    y: Option<Length>,
    rotate: Option<f32>,
    fill: Option<String>,
    stroke: Option<String>,
    stroke_width: Option<f32>,
    #[serde(default)]
    stroke_dasharray: Vec<f32>,
    opacity: Option<f32>,
}
impl PathShape {
    fn valid(&self) -> bool {
        self.d.len() <= 64 * 1024
            && self.x.iter().chain(&self.y).all(Length::valid)
            && self.rotate.is_none_or(f32::is_finite)
            && self.fill.iter().chain(&self.stroke).all(|c| theme::parse_color(c).is_some())
            && self.stroke_width.is_none_or(|w| w.is_finite() && w > 0. && w <= 4096.)
            && self.opacity.is_none_or(|a| a.is_finite() && (0. ..=1.).contains(&a))
            && self.stroke_dasharray.len() <= 32
            && self.stroke_dasharray.iter().all(|v| v.is_finite() && *v >= 0.25 && *v <= 4096.)
            && crate::svg::parse_svg(&self.d).is_ok()
    }
    fn painted(&self, size: Vec2) -> Vec<(raqote::Path, Color32)> {
        let Ok(path) = crate::svg::parse_svg(&self.d) else { return vec![] };
        let angle = self.rotate.unwrap_or(0.).to_radians();
        let (sin, cos) = angle.sin_cos();
        let transform = raqote::Transform::new(
            cos,
            sin,
            -sin,
            cos,
            self.x.as_ref().map_or(0., |x| x.resolve(size.x)),
            self.y.as_ref().map_or(0., |y| y.resolve(size.y)),
        );
        let color = |c: &str| theme::parse_color(c).unwrap_or_default().gamma_multiply(self.opacity.unwrap_or(1.));
        let mut output = Vec::new();
        if let Some(fill) = &self.fill {
            output.push((path.clone().transform(&transform), color(fill)));
        }
        if let Some(stroke) = &self.stroke {
            let path = if self.stroke_dasharray.is_empty() {
                path
            } else {
                dashed_path(&path, &self.stroke_dasharray)
            };
            let outline = raqote::stroke_to_path(
                &path.flatten(0.05),
                &raqote::StrokeStyle {
                    width: self.stroke_width.unwrap_or(1.),
                    cap: raqote::LineCap::Round,
                    join: raqote::LineJoin::Round,
                    ..Default::default()
                },
            );
            output.push((outline.transform(&transform), color(stroke)));
        }
        output
    }
}

fn dashed_path(path: &raqote::Path, dashes: &[f32]) -> raqote::Path {
    let mut output = raqote::PathBuilder::new();
    let mut previous = raqote::Point::zero();
    let mut start = previous;
    let mut index = 0;
    let mut remaining = dashes[0];
    for op in path.flatten(0.05).ops {
        let end = match op {
            raqote::PathOp::MoveTo(p) => {
                previous = p;
                start = p;
                index = 0;
                remaining = dashes[0];
                continue;
            }
            raqote::PathOp::LineTo(p) => p,
            raqote::PathOp::Close => start,
            _ => continue,
        };
        let delta = end - previous;
        let length = delta.length();
        let mut offset = 0.;
        while offset < length {
            let next = (offset + remaining).min(length);
            if index % 2 == 0 {
                let a = previous + delta * (offset / length);
                let b = previous + delta * (next / length);
                output.move_to(a.x, a.y);
                output.line_to(b.x, b.y);
            }
            remaining -= next - offset;
            offset = next;
            if remaining <= 0.0001 {
                index += 1;
                remaining = dashes[index % dashes.len()];
            }
        }
        previous = end;
    }
    output.finish()
}

// Normalize overlaps and holes before triangulation, so translucent strokes paint only once.
fn path_mesh(path: &raqote::Path, color: Color32) -> egui::Mesh {
    use i_overlay::{core::fill_rule::FillRule, float::simplify::SimplifyShape};
    let mut contours: Vec<Vec<[f32; 2]>> = Vec::new();
    let mut contour = Vec::new();
    for op in path.flatten(0.05).ops {
        match op {
            raqote::PathOp::MoveTo(p) => {
                if contour.len() > 2 {
                    contours.push(std::mem::take(&mut contour));
                } else {
                    contour.clear();
                }
                contour.push([p.x, p.y]);
            }
            raqote::PathOp::LineTo(p) => contour.push([p.x, p.y]),
            raqote::PathOp::Close => {
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
    let mut mesh = egui::Mesh::default();
    for polygon in contours.simplify_shape(FillRule::NonZero) {
        let mut points = Vec::new();
        let mut holes = Vec::new();
        for (i, ring) in polygon.iter().enumerate() {
            if i > 0 {
                holes.push(points.len() / 2);
            }
            for p in ring {
                points.extend([p[0] as f64, p[1] as f64]);
            }
        }
        let Ok(indices) = earcutr::earcut(&points, &holes, 2) else { continue };
        let base = mesh.vertices.len() as u32;
        for p in points.chunks_exact(2) {
            mesh.colored_vertex(Pos2::new(p[0] as f32, p[1] as f32), color);
        }
        mesh.indices.extend(indices.into_iter().map(|i| base + i as u32));
    }
    mesh
}

pub(super) fn native_image(value: &Value) -> Result<String, String> {
    image::render(value)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Grid {
    spacing: f32,
    line_width: Option<f32>,
    color: String,
}
#[derive(Deserialize, Default)]
#[serde(default)]
struct Recipe {
    gradients: Vec<Gradient>,
    shapes: Vec<Shape>,
    grid: Option<Grid>,
}

pub(super) fn validate(source: &Value) -> Result<(), String> {
    let recipe: Recipe = serde_json::from_value(source.clone()).map_err(|e| format!("Invalid NPattern recipe: {e}"))?;
    let color = |v: &String| theme::parse_color(v).is_some();
    let valid = recipe.gradients.len() <= 16
        && recipe.shapes.len() <= 256
        && recipe
            .gradients
            .iter()
            .all(|g| (1..=64).contains(&g.colors.len()) && g.colors.iter().all(color) && g.start.iter().chain(&g.end).all(Length::valid))
        && recipe.shapes.iter().all(|shape| match shape {
            Shape::Circle { cx, cy, r, color: c } => [cx, cy, r].into_iter().all(Length::valid) && color(c),
            Shape::Rect { x, y, w, h, r, color: c } => [x, y, w, h, r].into_iter().all(Length::valid) && color(c),
            Shape::Diamond { cx, cy, size, color: c } => [cx, cy, size].into_iter().all(Length::valid) && color(c),
            Shape::Path(path) => path.valid(),
        })
        && recipe
            .grid
            .as_ref()
            .is_none_or(|g| g.spacing.is_finite() && g.spacing >= 1. && g.line_width.is_none_or(|v| v.is_finite() && v > 0.) && color(&g.color));
    if valid {
        Ok(())
    } else {
        Err("NPattern requires finite coordinates, valid colors and bounded recipe sizes".into())
    }
}

#[derive(Default)]
pub(super) struct Pattern {
    source: Value,
    size: Vec2,
    density: f32,
    meshes: Vec<Arc<egui::Mesh>>,
    #[cfg(test)]
    builds: usize,
}

fn clip_polygon(points: Vec<Pos2>, projection: &impl Fn(Pos2) -> f32, boundary: f32, greater: bool) -> Vec<Pos2> {
    let mut output = Vec::new();
    let Some(mut previous) = points.last().copied() else { return output };
    let signed = |p| (projection(p) - boundary) * if greater { 1. } else { -1. };
    let mut a = signed(previous);
    for point in points {
        let b = signed(point);
        if (a >= 0.) != (b >= 0.) {
            output.push(previous + (point - previous) * (a / (a - b)));
        }
        if b >= 0. {
            output.push(point);
        }
        previous = point;
        a = b;
    }
    output
}

fn gradient(size: Vec2, source: &Gradient) -> egui::Mesh {
    let start = Pos2::new(source.start[0].resolve(size.x), source.start[1].resolve(size.y));
    let axis = Pos2::new(source.end[0].resolve(size.x), source.end[1].resolve(size.y)) - start;
    let projection = |p: Pos2| {
        if axis.length_sq() > 0.0001 {
            (p - start).dot(axis) / axis.length_sq()
        } else {
            1.
        }
    };
    let ring = vec![Pos2::ZERO, Pos2::new(size.x, 0.), Pos2::new(size.x, size.y), Pos2::new(0., size.y)];
    let colors: Vec<_> = source.colors.iter().filter_map(|c| theme::parse_color(c)).collect();
    let mut mesh = egui::Mesh::default();
    if colors.is_empty() {
        return mesh;
    }
    let color = |t: f32| {
        let position = t.clamp(0., 1.) * colors.len().saturating_sub(1) as f32;
        let index = position.floor() as usize;
        let a = colors[index].to_array();
        let b = colors[(index + 1).min(colors.len() - 1)].to_array();
        let mix = |i| (a[i] as f32 + (b[i] as f32 - a[i] as f32) * position.fract()).round() as u8;
        Color32::from_rgba_premultiplied(mix(0), mix(1), mix(2), mix(3))
    };
    let low = ring.iter().map(|p| projection(*p)).fold(f32::INFINITY, f32::min);
    let high = ring.iter().map(|p| projection(*p)).fold(f32::NEG_INFINITY, f32::max);
    if (high - low).abs() < 0.0001 {
        mesh.add_colored_rect(Rect::from_min_size(Pos2::ZERO, size), color(1.));
        return mesh;
    }
    let mut cuts = vec![low];
    cuts.extend(
        (0..colors.len())
            .map(|i| i as f32 / colors.len().saturating_sub(1).max(1) as f32)
            .filter(|t| *t > low && *t < high),
    );
    cuts.push(high);
    for stops in cuts.windows(2) {
        let polygon = clip_polygon(clip_polygon(ring.clone(), &projection, stops[0], true), &projection, stops[1], false);
        let first = mesh.vertices.len() as u32;
        for point in &polygon {
            mesh.colored_vertex(*point, color(projection(*point)));
        }
        for i in 1..polygon.len().saturating_sub(1) {
            mesh.add_triangle(first, first + i as u32, first + i as u32 + 1);
        }
    }
    mesh
}

fn shapes(recipe: &Recipe, size: Vec2) -> Vec<egui::Shape> {
    let mut output: Vec<_> = recipe.gradients.iter().map(|g| egui::Shape::mesh(gradient(size, g))).collect();
    for shape in &recipe.shapes {
        if let Shape::Path(path) = shape {
            output.extend(
                path.painted(size)
                    .into_iter()
                    .map(|(path, color)| egui::Shape::mesh(path_mesh(&path, color))),
            );
            continue;
        }
        output.push(match shape {
            Shape::Path(_) => unreachable!(),
            Shape::Circle { cx, cy, r, color } => egui::Shape::circle_filled(
                Pos2::new(cx.resolve(size.x), cy.resolve(size.y)),
                r.resolve(size.x.min(size.y)).max(0.),
                theme::parse_color(color).unwrap_or_default(),
            ),
            Shape::Rect { x, y, w, h, r, color } => egui::Shape::rect_filled(
                Rect::from_min_size(
                    Pos2::new(x.resolve(size.x), y.resolve(size.y)),
                    Vec2::new(w.resolve(size.x), h.resolve(size.y)).max(Vec2::ZERO),
                ),
                r.resolve(size.x.min(size.y)).clamp(0., 255.),
                theme::parse_color(color).unwrap_or_default(),
            ),
            Shape::Diamond { cx, cy, size: length, color } => {
                let center = Pos2::new(cx.resolve(size.x), cy.resolve(size.y));
                let half = length.resolve(size.x.min(size.y)).max(0.) / 2.;
                egui::Shape::convex_polygon(
                    vec![
                        center - Vec2::new(0., half),
                        center + Vec2::new(half, 0.),
                        center + Vec2::new(0., half),
                        center - Vec2::new(half, 0.),
                    ],
                    theme::parse_color(color).unwrap_or_default(),
                    egui::Stroke::NONE,
                )
            }
        });
    }
    if let Some(grid) = &recipe.grid {
        let color = theme::parse_color(&grid.color).unwrap_or_default();
        let width = grid.line_width.unwrap_or(1.);
        for i in 0..(size.x / grid.spacing).floor().clamp(0., 512.) as usize {
            output.push(egui::Shape::rect_filled(
                Rect::from_min_size(Pos2::new(i as f32 * grid.spacing, 0.), Vec2::new(width, size.y)),
                0.,
                color,
            ));
        }
        for i in 0..(size.y / grid.spacing).floor().clamp(0., 512.) as usize {
            output.push(egui::Shape::rect_filled(
                Rect::from_min_size(Pos2::new(0., i as f32 * grid.spacing), Vec2::new(size.x, width)),
                0.,
                color,
            ));
        }
    }
    output
}

impl ComponentDocument {
    pub(super) fn paint_pattern(&mut self, painter: &egui::Painter, node: &Node, rect: Rect) {
        if !rect.is_positive() || !rect.intersects(painter.clip_rect()) {
            return;
        }
        let cache = self.patterns.entry(node.id.clone()).or_default();
        let source = &node.props["recipe"];
        let density = painter.ctx().pixels_per_point();
        if cache.source != *source || cache.size != rect.size() || cache.density != density {
            let Ok(recipe) = serde_json::from_value::<Recipe>(source.clone()) else {
                return;
            };
            let clip_rect = Rect::from_min_size(Pos2::ZERO, rect.size());
            let primitives = painter.ctx().tessellate(
                shapes(&recipe, rect.size())
                    .into_iter()
                    .map(|shape| egui::epaint::ClippedShape::new(clip_rect, shape))
                    .collect(),
                density,
            );
            cache.meshes = primitives
                .into_iter()
                .filter_map(|primitive| match primitive.primitive {
                    egui::epaint::Primitive::Mesh(mesh) => Some(Arc::new(mesh)),
                    _ => None,
                })
                .collect();
            cache.source = source.clone();
            cache.size = rect.size();
            cache.density = density;
            #[cfg(test)]
            {
                cache.builds += 1;
            }
        }
        for mesh in &cache.meshes {
            let mut shape = egui::Shape::Mesh(mesh.clone());
            if rect.min != Pos2::ZERO {
                shape.translate(rect.min.to_vec2());
            }
            painter.with_clip_rect(painter.clip_rect().intersect(rect)).add(shape);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn recipe() -> Value {
        json!({
            "gradients":[{"start":[0,0],"end":["100%","50%"],"colors":["#ff000040","transparent","#0000ff40"]}],
            "shapes":[
                {"kind":"circle","cx":"10%","cy":"15%","r":20,"color":"#ffffff30"},
                {"kind":"rrect","x":{"percent":90,"offset":30,"min":24,"maxInset":24},"y":40,"w":24,"h":32,"r":6,"color":"#00ff0030"},
                {"kind":"diamond","cx":"50%","cy":"50%","size":32,"color":"#ffffff20"}
            ],
            "grid":{"spacing":40,"lineWidth":1,"color":"rgba(0,0,0,0.02)"}
        })
    }
    fn tree(recipe: Value) -> Value {
        json!([{"id":"pattern","kind":"NPattern","props":{"recipe":recipe,"style":{"height":240}}}])
    }

    #[test]
    fn responsive_vectors_reuse_geometry_without_images_or_accessibility_noise() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&tree(recipe())).unwrap();
        doc.frame(390., 844., 1.).drop_without_applying_deltas();
        let original = doc.patterns["pattern"].meshes[0].clone();
        assert!(original.is_valid() && !original.indices.is_empty());
        doc.frame(390., 844., 1.).drop_without_applying_deltas();
        assert_eq!(doc.patterns["pattern"].builds, 1);
        assert!(Arc::ptr_eq(&original, &doc.patterns["pattern"].meshes[0]));
        assert!(doc.images.requests().is_empty());
        assert!(!doc.semantics.iter().any(|n| n.kind == "NPattern"));
        for width in [768., 1440.] {
            doc.frame(width, 1000., 1.).drop_without_applying_deltas();
            assert!(doc.patterns["pattern"].size.x > 700.);
            assert!(
                doc.patterns["pattern"]
                    .meshes
                    .iter()
                    .all(|m| m.is_valid() && m.vertices.iter().all(|v| v.pos.is_finite()))
            );
        }
        assert_eq!(doc.patterns["pattern"].builds, 3);
        doc.frame(1440., 1000., 2.).drop_without_applying_deltas();
        assert_eq!(doc.patterns["pattern"].builds, 4);
        let mut updated = recipe();
        updated["shapes"][0]["color"] = json!("#112233");
        doc.set_tree(&tree(updated)).unwrap();
        doc.frame(1440., 1000., 2.).drop_without_applying_deltas();
        assert_eq!(doc.patterns["pattern"].builds, 5);
        doc.set_tree(&json!([])).unwrap();
        assert!(doc.patterns.is_empty());
    }

    #[test]
    fn diagonal_gradients_keep_all_stops_and_fade_premultiplied_colors() {
        let source: Gradient = serde_json::from_value(recipe()["gradients"][0].clone()).unwrap();
        let mesh = gradient(Vec2::new(400., 800.), &source);
        assert!(mesh.is_valid());
        assert!(mesh.vertices.iter().any(|v| v.color == Color32::TRANSPARENT));
        assert!(mesh.vertices.iter().any(|v| v.color.r() > 0));
        assert!(mesh.vertices.iter().any(|v| v.color.b() > 0));
        assert!(
            mesh.vertices
                .iter()
                .all(|v| Rect::from_min_size(Pos2::ZERO, Vec2::new(400., 800.)).contains(v.pos))
        );
        for triangle in mesh.indices.chunks_exact(3) {
            let colors: Vec<_> = triangle.iter().map(|i| mesh.vertices[*i as usize].color).collect();
            assert!(
                !(colors.iter().any(|c| c.r() > 0) && colors.iter().any(|c| c.b() > 0)),
                "triangles must not skip the transparent stop"
            );
        }
        let length = Length::Relative {
            percent: 90.,
            offset: 30.,
            min: Some(24.),
            max_inset: Some(24.),
        };
        assert_eq!(length.resolve(390.), 366.);
        assert_eq!(Length::Percent("50%".into()).resolve(844.), 422.);
    }

    #[test]
    fn native_patterns_preserve_alpha_holes_transform_dashes_and_density() {
        use base64::Engine;
        let recipe = json!({"shapes":[
            {"kind":"path","d":"M0 0H40V40H0ZM10 10V30H30V10Z","x":20,"y":10,"fill":"#ff000080"},
            {"kind":"path","d":"M0 0H60","x":10,"y":60,"stroke":"#0000ff","strokeWidth":2,"strokeDasharray":[4,4]},
            {"kind":"path","d":"M0 0H10V20H0Z","x":90,"y":20,"rotate":90,"fill":"#00ff00"}
        ]});
        let command = json!({"action":"patternImage","recipe":recipe,"width":100,"height":80,"density":2});
        let image = super::super::icon::request(&command.to_string()).unwrap();
        let png = base64::engine::general_purpose::STANDARD
            .decode(image.as_str().unwrap().split_once(',').unwrap().1)
            .unwrap();
        let decoded = crate::assets::texture::decode(&png).unwrap();
        assert_eq!((decoded.width, decoded.height), (200, 160));
        let pixel = |x: usize, y: usize| &decoded.rgba[(y * 200 + x) * 4..(y * 200 + x) * 4 + 4];
        assert_eq!(pixel(0, 0), &[0, 0, 0, 0]);
        assert_eq!(pixel(50, 30), &[255, 0, 0, 128], "PNG colors must be straight alpha");
        assert_eq!(pixel(80, 60)[3], 0, "counter-wound holes remain clear");
        assert_eq!(pixel(150, 50), &[0, 255, 0, 255], "rotation is about the translated origin");
        assert!(pixel(24, 120)[3] > 200);
        assert_eq!(pixel(32, 120)[3], 0, "dash gaps remain transparent");
        let mut doc = ComponentDocument::default();
        doc.set_tree(&tree(recipe)).unwrap();
        doc.frame(100., 80., 2.).drop_without_applying_deltas();
        assert!(doc.patterns["pattern"].meshes.iter().all(|m| m.is_valid()));
        assert!(doc.semantics.is_empty());
    }

    #[test]
    fn native_pattern_images_are_bounded_and_reject_invalid_dimensions() {
        use base64::Engine;
        for (key, value) in [
            ("width", json!(0)),
            ("height", json!(-1)),
            ("width", json!(20000)),
            ("density", json!(0)),
            ("density", json!(9)),
        ] {
            let mut command = json!({"recipe":{},"width":100,"height":200,"density":2});
            command[key] = value;
            assert!(native_image(&command).is_err());
        }
        let image = native_image(&json!({"recipe":{},"width":3000,"height":1000,"density":4})).unwrap();
        let png = base64::engine::general_purpose::STANDARD
            .decode(image.split_once(',').unwrap().1)
            .unwrap();
        let reader = png::Decoder::new(std::io::Cursor::new(png)).read_info().unwrap();
        assert!(reader.info().width <= 2048 && reader.info().height <= 2048);
    }

    #[test]
    fn malformed_or_unbounded_recipes_are_rejected_before_painting() {
        for invalid in [
            json!({"grid":{"spacing":0,"color":"#ffffff"}}),
            json!({"gradients":[{"start":[0,0],"end":["wide",0],"colors":["#fff"]}]}),
            json!({"gradients":[{"start":[0,0],"end":[100,0],"colors":[]}]}),
            json!({"shapes":[{"kind":"circle","cx":0,"cy":0,"r":10,"color":"invalid"}]}),
            json!({"shapes":[{"kind":"path","d":"M0 0 L","fill":"#fff"}]}),
            json!({"shapes":[{"kind":"path","d":"M0 0H10","stroke":"invalid"}]}),
            json!({"shapes":[{"kind":"path","d":"M0 0H10","strokeDasharray":[0,6]}]}),
            json!({"shapes":vec![json!({"kind":"circle","cx":0,"cy":0,"r":10,"color":"#fff"});257]}),
        ] {
            assert!(ComponentDocument::default().set_tree(&tree(invalid)).is_err());
        }
    }
}
