//! Native shape construction and bounded scanline bucket fill; no JS pixel processing.
use super::*;
use raqote::{PathBuilder, Transform};
use std::{collections::HashMap, sync::LazyLock};
pub struct ShapeGesture {
    pub start: Sample,
    pub end: Sample,
    pub options: Value,
}
pub const SHAPES: &[(&str, &str)] = &[
    ("line", "Line"),
    ("arrow", "Arrow"),
    ("rectangle", "Rectangle"),
    ("square", "Square"),
    ("rounded-rectangle", "Rounded rectangle"),
    ("circle", "Circle"),
    ("ellipse", "Oval"),
    ("triangle", "Triangle"),
    ("right-triangle", "Right triangle"),
    ("diamond", "Diamond"),
    ("pentagon", "Pentagon"),
    ("hexagon", "Hexagon"),
    ("octagon", "Octagon"),
    ("star", "Star"),
    ("heart", "Heart"),
    ("trapezoid", "Trapezoid"),
    ("parallelogram", "Parallelogram"),
    ("cross", "Cross"),
    ("speech-bubble", "Speech bubble"),
    ("cloud", "Cloud"),
];
pub fn is_shape(kind: &str) -> bool {
    SHAPES.iter().any(|(id, _)| *id == kind)
}
/// Previews use the exact same native geometry as touch drawing, cached once per engine session.
pub fn catalog() -> Value {
    static CATALOG: LazyLock<Value> = LazyLock::new(|| {
        Value::Array(
            SHAPES
                .iter()
                .map(|(kind, label)| {
                    let start = Sample { x: 4., y: 4., pressure: 1. };
                    let end = Sample {
                        x: 44.,
                        y: 44.,
                        pressure: 1.,
                    };
                    let outline = shape(start, end, &json!({"tool":kind,"width":2.,"filled":false})).expect("built-in shape");
                    let filled = shape(start, end, &json!({"tool":kind,"width":2.,"filled":true})).expect("built-in shape");
                    json!({"kind":kind,"name":label,"path":outline.data["path"],"filledPath":filled.data["path"],"canFill":*kind!="line"})
                })
                .collect(),
        )
    });
    CATALOG.clone()
}
fn polygon(b: &mut PathBuilder, points: &[(f32, f32)]) {
    if let Some(&(x, y)) = points.first() {
        b.move_to(x, y);
        for &(x, y) in points.iter().skip(1) {
            b.line_to(x, y);
        }
        b.close();
    }
}
pub fn shape(start: Sample, end: Sample, options: &Value) -> Result<Stroke, String> {
    let kind = options["tool"].as_str().unwrap_or("line");
    if !is_shape(kind) {
        return Err("Unknown drawing shape".into());
    }
    let mut b = PathBuilder::new();
    let mut x = start.x.min(end.x);
    let mut y = start.y.min(end.y);
    let mut w = (end.x - start.x).abs().max(0.01);
    let mut h = (end.y - start.y).abs().max(0.01);
    if matches!(kind, "square" | "circle") {
        let side = w.max(h);
        w = side;
        h = side;
        x = if end.x >= start.x { start.x } else { start.x - side };
        y = if end.y >= start.y { start.y } else { start.y - side };
    }
    if kind == "line" {
        b.move_to(start.x, start.y);
        b.line_to(end.x, end.y);
        return shape_stroke(path::svg(&b.finish()), options);
    }
    if kind == "arrow" {
        let dx = end.x - start.x;
        let dy = end.y - start.y;
        let len = dx.hypot(dy).max(0.01);
        let ux = dx / len;
        let uy = dy / len;
        let nx = -uy;
        let ny = ux;
        let head = (len * 0.3).min(24.).max(number(options, "width", 3.) * 1.6).min(len * 0.6);
        let bx = end.x - ux * head;
        let by = end.y - uy * head;
        if options["filled"] == true {
            let half = (number(options, "width", 3.) * 0.5).max(1.).min(head * 0.4);
            polygon(
                &mut b,
                &[
                    (start.x + nx * half, start.y + ny * half),
                    (bx + nx * half, by + ny * half),
                    (bx + nx * head * 0.65, by + ny * head * 0.65),
                    (end.x, end.y),
                    (bx - nx * head * 0.65, by - ny * head * 0.65),
                    (bx - nx * half, by - ny * half),
                    (start.x - nx * half, start.y - ny * half),
                ],
            );
        } else {
            b.move_to(start.x, start.y);
            b.line_to(end.x, end.y);
            b.move_to(bx + nx * head * 0.65, by + ny * head * 0.65);
            b.line_to(end.x, end.y);
            b.line_to(bx - nx * head * 0.65, by - ny * head * 0.65);
        }
        return shape_stroke(path::svg(&b.finish()), options);
    }
    match kind {
        "rectangle" | "square" => b.rect(0., 0., 1., 1.),
        "circle" | "ellipse" => {
            b.move_to(1., 0.5);
            b.arc(0.5, 0.5, 0.5, 0., -std::f32::consts::TAU);
            b.close();
        }
        "rounded-rectangle" => {
            let rx = (w.min(h) * 0.18) / w;
            let ry = (w.min(h) * 0.18) / h;
            b.move_to(rx, 0.);
            b.line_to(1. - rx, 0.);
            b.quad_to(1., 0., 1., ry);
            b.line_to(1., 1. - ry);
            b.quad_to(1., 1., 1. - rx, 1.);
            b.line_to(rx, 1.);
            b.quad_to(0., 1., 0., 1. - ry);
            b.line_to(0., ry);
            b.quad_to(0., 0., rx, 0.);
            b.close();
        }
        "triangle" => polygon(&mut b, &[(0.5, 0.), (1., 1.), (0., 1.)]),
        "right-triangle" => polygon(&mut b, &[(0., 0.), (1., 1.), (0., 1.)]),
        "diamond" => polygon(&mut b, &[(0.5, 0.), (1., 0.5), (0.5, 1.), (0., 0.5)]),
        "pentagon" | "hexagon" | "octagon" | "star" => {
            let n = match kind {
                "pentagon" => 5,
                "hexagon" => 6,
                "octagon" => 8,
                _ => 10,
            };
            let points = (0..n)
                .map(|i| {
                    let angle = -std::f32::consts::FRAC_PI_2 + i as f32 * std::f32::consts::TAU / n as f32;
                    let r = if kind == "star" && i % 2 == 1 { 0.22 } else { 0.5 };
                    (0.5 + angle.cos() * r, 0.5 + angle.sin() * r)
                })
                .collect::<Vec<_>>();
            polygon(&mut b, &points);
        }
        "heart" => {
            b.move_to(0.5, 0.95);
            b.cubic_to(1.25, 0.45, 0.95, -0.15, 0.5, 0.25);
            b.cubic_to(0.05, -0.15, -0.25, 0.45, 0.5, 0.95);
            b.close();
        }
        "trapezoid" => polygon(&mut b, &[(0.2, 0.), (0.8, 0.), (1., 1.), (0., 1.)]),
        "parallelogram" => polygon(&mut b, &[(0.25, 0.), (1., 0.), (0.75, 1.), (0., 1.)]),
        "cross" => polygon(
            &mut b,
            &[
                (0.33, 0.),
                (0.67, 0.),
                (0.67, 0.33),
                (1., 0.33),
                (1., 0.67),
                (0.67, 0.67),
                (0.67, 1.),
                (0.33, 1.),
                (0.33, 0.67),
                (0., 0.67),
                (0., 0.33),
                (0.33, 0.33),
            ],
        ),
        "speech-bubble" => {
            b.move_to(0.15, 0.05);
            b.line_to(0.85, 0.05);
            b.quad_to(1., 0.05, 1., 0.2);
            b.line_to(1., 0.6);
            b.quad_to(1., 0.75, 0.85, 0.75);
            b.line_to(0.6, 0.75);
            b.line_to(0.3, 1.);
            b.line_to(0.35, 0.75);
            b.line_to(0.15, 0.75);
            b.quad_to(0., 0.75, 0., 0.6);
            b.line_to(0., 0.2);
            b.quad_to(0., 0.05, 0.15, 0.05);
            b.close();
        }
        "cloud" => {
            b.move_to(0.22, 0.88);
            b.cubic_to(-0.06, 0.9, -0.06, 0.48, 0.17, 0.45);
            b.cubic_to(0.13, 0.14, 0.4, 0.08, 0.53, 0.3);
            b.cubic_to(0.75, -0.06, 1.04, 0.17, 0.89, 0.48);
            b.cubic_to(1.13, 0.59, 1.01, 0.94, 0.8, 0.88);
            b.close();
        }
        _ => unreachable!(),
    }
    let path = b.finish().transform(&Transform::new(w, 0., 0., h, x, y));
    shape_stroke(path::svg(&path), options)
}
fn shape_stroke(svg: String, options: &Value) -> Result<Stroke, String> {
    Stroke::parse(json!({"path":svg,"color":options.get("color").cloned().unwrap_or(json!("#2567c7")),
        "width":number(options,"width",3.),"opacity":number(options,"opacity",1.),"brushType":"NORMAL",
        "style":if options["filled"]==true && options["tool"]!="line" {"fill"} else {"stroke"},"fillRule":"nonzero"}))
}
fn reverse_contours(path: raqote::Path) -> raqote::Path {
    use raqote::{PathOp, Point};
    let mut out = PathBuilder::new();
    let mut edges: Vec<(Point, PathOp)> = Vec::new();
    let mut current = Point::new(0., 0.);
    let mut closed = false;
    let flush = |edges: &mut Vec<(Point, PathOp)>, current: Point, closed: bool, out: &mut PathBuilder| {
        if edges.is_empty() {
            return;
        }
        out.move_to(current.x, current.y);
        for (start, op) in edges.drain(..).rev() {
            match op {
                PathOp::LineTo(_) => out.line_to(start.x, start.y),
                PathOp::QuadTo(c, _) => out.quad_to(c.x, c.y, start.x, start.y),
                PathOp::CubicTo(a, b, _) => out.cubic_to(b.x, b.y, a.x, a.y, start.x, start.y),
                _ => {}
            }
        }
        if closed {
            out.close();
        }
    };
    for op in path.ops {
        match op {
            PathOp::MoveTo(p) => {
                flush(&mut edges, current, closed, &mut out);
                current = p;
                closed = false;
            }
            PathOp::Close => closed = true,
            _ => {
                let end = match &op {
                    PathOp::LineTo(p) | PathOp::QuadTo(_, p) | PathOp::CubicTo(_, _, p) => *p,
                    _ => current,
                };
                edges.push((current, op));
                current = end;
            }
        }
    }
    flush(&mut edges, current, closed, &mut out);
    let mut result = out.finish();
    result.winding = path.winding;
    result
}
pub fn mirror_path(mut path: raqote::Path, width: f32, height: f32, mode: &str, fill: bool) -> raqote::Path {
    if !matches!(mode, "vertical" | "horizontal" | "both") {
        return path;
    }
    let original = path.clone();
    let mut append = |transform: Transform, flip: bool| {
        let mirrored = original.clone().transform(&transform);
        path.ops.extend(if flip && fill { reverse_contours(mirrored).ops } else { mirrored.ops });
    };
    if mode == "vertical" || mode == "both" {
        append(Transform::new(-1., 0., 0., 1., width, 0.), true);
    }
    if mode == "horizontal" || mode == "both" {
        append(Transform::new(1., 0., 0., -1., 0., height), true);
    }
    if mode == "both" {
        append(Transform::new(-1., 0., 0., -1., width, height), false);
    }
    path
}
pub fn mirror(mut stroke: Stroke, width: f32, height: f32, mode: &str) -> Stroke {
    if !matches!(mode, "vertical" | "horizontal" | "both") {
        return stroke;
    }
    stroke.path = mirror_path(stroke.path, width, height, mode, stroke.fill);
    stroke.data["path"] = json!(path::svg(&stroke.path));
    if let Some(line) = stroke.centerline.first().cloned() {
        let flip = |fx: bool, fy: bool| {
            line.iter()
                .map(|&[x, y]| [if fx { width - x } else { x }, if fy { height - y } else { y }])
                .collect()
        };
        if mode == "vertical" || mode == "both" {
            stroke.centerline.push(flip(true, false));
        }
        if mode == "horizontal" || mode == "both" {
            stroke.centerline.push(flip(false, true));
        }
        if mode == "both" {
            stroke.centerline.push(flip(true, true));
        }
    }
    stroke
}
pub fn bucket(raster: &Raster, x: f32, y: f32, tolerance: f32, options: &Value) -> Result<Option<Stroke>, String> {
    let w = raster.width as usize;
    let h = raster.height as usize;
    let x = (x * raster.ratio).floor() as usize;
    let y = (y * raster.ratio).floor() as usize;
    if x >= w || y >= h {
        return Ok(None);
    }
    let pixel = |i: usize| &raster.pixels[i * 4..i * 4 + 4];
    let target = pixel(y * w + x).to_vec();
    let threshold = (tolerance.clamp(0., 0.3) * 255.).max(1.);
    let matches = |i: usize| pixel(i).iter().zip(&target).all(|(a, b)| (*a as f32 - *b as f32).abs() <= threshold);
    let mut visited = vec![false; w * h];
    let mut stack = vec![(x, y)];
    let mut rows: Vec<(usize, usize, usize)> = Vec::new();
    while let Some((x, y)) = stack.pop() {
        if visited[y * w + x] || !matches(y * w + x) {
            continue;
        }
        let mut left = x;
        while left > 0 && !visited[y * w + left - 1] && matches(y * w + left - 1) {
            left -= 1;
        }
        let mut right = x;
        while right + 1 < w && !visited[y * w + right + 1] && matches(y * w + right + 1) {
            right += 1;
        }
        visited[y * w + left..y * w + right + 1].fill(true);
        rows.push((y, left, right + 1));
        if rows.len() > 50_000 {
            return Err("This region is too complex to fill. Try a smaller tolerance".into());
        }
        for ny in [y.checked_sub(1), (y + 1 < h).then_some(y + 1)].into_iter().flatten() {
            let mut inside = false;
            for nx in left..=right {
                let eligible = !visited[ny * w + nx] && matches(ny * w + nx);
                if eligible && !inside {
                    stack.push((nx, ny));
                }
                inside = eligible;
            }
        }
    }
    // Merge identical runs vertically: an empty paper becomes one SVG rectangle, not millions of pixels.
    rows.sort_unstable();
    let mut rectangles: Vec<(usize, usize, usize, usize)> = Vec::new();
    let mut previous = HashMap::<(usize, usize), usize>::new();
    for (y, left, right) in rows {
        if let Some(index) = previous.get(&(left, right)).copied().filter(|i| rectangles[*i].3 == y) {
            rectangles[index].3 = y + 1;
        } else {
            previous.insert((left, right), rectangles.len());
            rectangles.push((left, y, right, y + 1));
        }
    }
    let mut b = PathBuilder::new();
    for (left, top, right, bottom) in rectangles {
        b.rect(
            left as f32 / raster.ratio,
            top as f32 / raster.ratio,
            (right - left) as f32 / raster.ratio,
            (bottom - top) as f32 / raster.ratio,
        );
    }
    let mut options = options.clone();
    options["filled"] = json!(true);
    options["tool"] = json!("rectangle");
    shape_stroke(path::svg(&b.finish()), &options).map(Some)
}
