//! Parse the SVG paths shared by the drawing and UI renderers.
use raqote::{Path, PathBuilder, PathOp};
use svgtypes::{SimplePathSegment, SimplifyingPathParser};

pub fn parse_svg(svg: &str) -> Result<Path, String> {
    if svg.len() > 16_000_000 {
        return Err("Drawing path exceeds 16 MB".into());
    }
    let mut b = PathBuilder::new();
    for (i, segment) in SimplifyingPathParser::from(svg).enumerate() {
        if i >= 1_000_000 {
            return Err("Drawing path has too many segments".into());
        }
        match segment.map_err(|e| format!("Invalid SVG drawing path: {e}"))? {
            SimplePathSegment::MoveTo { x, y } => b.move_to(x as f32, y as f32),
            SimplePathSegment::LineTo { x, y } => b.line_to(x as f32, y as f32),
            SimplePathSegment::CurveTo { x1, y1, x2, y2, x, y } => b.cubic_to(x1 as f32, y1 as f32, x2 as f32, y2 as f32, x as f32, y as f32),
            SimplePathSegment::Quadratic { x1, y1, x, y } => b.quad_to(x1 as f32, y1 as f32, x as f32, y as f32),
            SimplePathSegment::ClosePath => b.close(),
        }
    }
    let path = b.finish();
    if path.ops.iter().flat_map(coordinates).any(|v| !v.is_finite() || v.abs() > 10_000_000.) {
        return Err("Drawing coordinates are out of range".into());
    }
    Ok(path)
}
fn coordinates(op: &PathOp) -> Vec<f32> {
    match op {
        PathOp::MoveTo(p) | PathOp::LineTo(p) => vec![p.x, p.y],
        PathOp::QuadTo(a, b) => vec![a.x, a.y, b.x, b.y],
        PathOp::CubicTo(a, b, c) => vec![a.x, a.y, b.x, b.y, c.x, c.y],
        PathOp::Close => vec![],
    }
}
