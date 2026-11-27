use super::*;

pub(super) fn rotation(value: &str) -> f32 {
    value
        .split("rotate(")
        .nth(1)
        .and_then(|v| v.split(')').next())
        .and_then(|v| {
            if let Some(v) = v.trim().strip_suffix("deg") {
                v.parse::<f32>().ok().map(f32::to_radians)
            } else {
                v.trim().trim_end_matches("rad").parse::<f32>().ok()
            }
        })
        .unwrap_or(0.)
}

pub(super) fn translation(css: &BTreeMap<String, String>, size: Vec2, viewport: Vec2) -> Vec2 {
    let mut result = Vec2::ZERO;
    if let Some(value) = css.get("translate") {
        let parts = split(value, ' ');
        result.x = parts.first().and_then(|v| number(v, size.x, viewport, 16.)).unwrap_or(0.);
        result.y = parts.get(1).and_then(|v| number(v, size.y, viewport, 16.)).unwrap_or(0.);
    }
    let value = css.get("transform").map(String::as_str).unwrap_or("");
    for (name, x, y) in [("translate(", true, true), ("translateX(", true, false), ("translateY(", false, true)] {
        if let Some(value) = value.split(name).nth(1).and_then(|v| v.split(')').next()) {
            let parts = split(value, ',');
            if x {
                result.x += number(parts[0], size.x, viewport, 16.).unwrap_or(0.);
            }
            if y {
                result.y += number(if x { parts.get(1).copied().unwrap_or("0") } else { parts[0] }, size.y, viewport, 16.).unwrap_or(0.);
            }
        }
    }
    result
}

pub(super) fn rotate_rect(rect: Rect, center: Pos2, angle: f32) -> Rect {
    let rotation = egui::emath::Rot2::from_angle(angle);
    [rect.left_top(), rect.right_top(), rect.right_bottom(), rect.left_bottom()]
        .into_iter()
        .map(|p| center + rotation * (p - center))
        .fold(Rect::NOTHING, |r, p| r.union(Rect::from_min_max(p, p)))
}

pub(super) fn rotate_shape(shape: &mut egui::Shape, center: Pos2, angle: f32) {
    let rotation = egui::emath::Rot2::from_angle(angle);
    let point = |p: Pos2| center + rotation * (p - center);
    match shape {
        egui::Shape::Vec(shapes) => {
            for shape in shapes {
                rotate_shape(shape, center, angle)
            }
        }
        egui::Shape::Rect(rect) => {
            let delta = point(rect.rect.center()) - rect.rect.center();
            rect.rect = rect.rect.translate(delta);
            rect.angle += angle;
        }
        egui::Shape::Text(text) => {
            text.pos = point(text.pos);
            text.angle += angle;
        }
        egui::Shape::Mesh(mesh) => {
            for vertex in &mut std::sync::Arc::make_mut(mesh).vertices {
                vertex.pos = point(vertex.pos)
            }
        }
        egui::Shape::Circle(circle) => circle.center = point(circle.center),
        egui::Shape::Ellipse(ellipse) => ellipse.center = point(ellipse.center),
        egui::Shape::LineSegment { points, .. } => {
            for p in points {
                *p = point(*p)
            }
        }
        egui::Shape::Path(path) => {
            for p in &mut path.points {
                *p = point(*p)
            }
        }
        egui::Shape::QuadraticBezier(curve) => {
            for p in &mut curve.points {
                *p = point(*p)
            }
        }
        egui::Shape::CubicBezier(curve) => {
            for p in &mut curve.points {
                *p = point(*p)
            }
        }
        _ => {}
    }
}
