//! CPU image attachment for static platform views; live UI keeps the same recipe on wgpu.
use super::*;
use raqote::{DrawOptions, DrawTarget, PathBuilder, SolidSource, Source, Transform};

fn source(color: Color32) -> Source<'static> {
    Source::Solid(SolidSource {
        r: color.r(),
        g: color.g(),
        b: color.b(),
        a: color.a(),
    })
}
fn rounded_rect(x: f32, y: f32, w: f32, h: f32, r: f32) -> raqote::Path {
    let r = r.clamp(0., w.min(h).max(0.) / 2.);
    let mut p = PathBuilder::new();
    let k = r * 0.5522848;
    p.move_to(x + r, y);
    p.line_to(x + w - r, y);
    p.cubic_to(x + w - r + k, y, x + w, y + r - k, x + w, y + r);
    p.line_to(x + w, y + h - r);
    p.cubic_to(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h);
    p.line_to(x + r, y + h);
    p.cubic_to(x + r - k, y + h, x, y + h - r + k, x, y + h - r);
    p.line_to(x, y + r);
    p.cubic_to(x, y + r - k, x + r - k, y, x + r, y);
    p.close();
    p.finish()
}

pub(super) fn render(value: &Value) -> Result<String, String> {
    use base64::Engine;
    validate(&value["recipe"])?;
    let dimension = |key: &str| {
        value[key]
            .as_f64()
            .filter(|n| n.is_finite() && *n > 0. && *n <= 16384.)
            .ok_or_else(|| format!("Invalid pattern {key}"))
    };
    let width = dimension("width")? as f32;
    let height = dimension("height")? as f32;
    let density = value["density"]
        .as_f64()
        .filter(|n| n.is_finite() && *n > 0. && *n <= 8.)
        .ok_or("Invalid pattern density")? as f32;
    // At most 4 Mi pixels / 16 MiB of output, including high-density tablets and landscape.
    let density = density.min(2048. / width.max(height)).min((4_194_304. / (width * height)).sqrt());
    let w = (width * density).round().max(1.) as u32;
    let h = (height * density).round().max(1.) as u32;
    let mut target = DrawTarget::new(w as i32, h as i32);
    target.set_transform(&Transform::scale(w as f32 / width, h as f32 / height));
    let recipe: Recipe = serde_json::from_value(value["recipe"].clone()).map_err(|e| e.to_string())?;
    let size = Vec2::new(width, height);
    let options = DrawOptions::new();
    for gradient in &recipe.gradients {
        let colors: Vec<_> = gradient.colors.iter().map(|c| theme::parse_color(c).unwrap_or_default()).collect();
        let point = |length: &[Length; 2]| raqote::Point::new(length[0].resolve(width), length[1].resolve(height));
        let start = point(&gradient.start);
        let end = point(&gradient.end);
        let paint = if colors.len() == 1 || (end - start).square_length() < 0.0001 {
            source(*colors.last().unwrap())
        } else {
            Source::new_linear_gradient(
                raqote::Gradient {
                    stops: colors
                        .iter()
                        .enumerate()
                        .map(|(i, c)| {
                            let [r, g, b, a] = c.to_srgba_unmultiplied();
                            raqote::GradientStop {
                                position: i as f32 / (colors.len() - 1) as f32,
                                color: raqote::Color::new(a, r, g, b),
                            }
                        })
                        .collect(),
                },
                start,
                end,
                raqote::Spread::Pad,
            )
        };
        target.fill_rect(0., 0., width, height, &paint, &options);
    }
    for shape in &recipe.shapes {
        let (path, color) = match shape {
            Shape::Path(path) => {
                for (path, color) in path.painted(size) {
                    target.fill(&path, &source(color), &options);
                }
                continue;
            }
            Shape::Circle { cx, cy, r, color } => {
                let mut p = PathBuilder::new();
                p.arc(
                    cx.resolve(width),
                    cy.resolve(height),
                    r.resolve(width.min(height)).max(0.),
                    0.,
                    std::f32::consts::TAU,
                );
                p.close();
                (p.finish(), color)
            }
            Shape::Rect { x, y, w, h, r, color } => (
                rounded_rect(
                    x.resolve(width),
                    y.resolve(height),
                    w.resolve(width).max(0.),
                    h.resolve(height).max(0.),
                    r.resolve(width.min(height)),
                ),
                color,
            ),
            Shape::Diamond { cx, cy, size, color } => {
                let x = cx.resolve(width);
                let y = cy.resolve(height);
                let half = size.resolve(width.min(height)).max(0.) / 2.;
                let mut p = PathBuilder::new();
                p.move_to(x, y - half);
                p.line_to(x + half, y);
                p.line_to(x, y + half);
                p.line_to(x - half, y);
                p.close();
                (p.finish(), color)
            }
        };
        target.fill(&path, &source(theme::parse_color(color).unwrap_or_default()), &options);
    }
    if let Some(grid) = &recipe.grid {
        let paint = source(theme::parse_color(&grid.color).unwrap_or_default());
        let line = grid.line_width.unwrap_or(1.);
        for i in 0..(width / grid.spacing).floor().clamp(0., 512.) as usize {
            target.fill_rect(i as f32 * grid.spacing, 0., line, height, &paint, &options);
        }
        for i in 0..(height / grid.spacing).floor().clamp(0., 512.) as usize {
            target.fill_rect(0., i as f32 * grid.spacing, width, line, &paint, &options);
        }
    }
    let rgba: Vec<u8> = target
        .get_data()
        .iter()
        .flat_map(|pixel| {
            let a = pixel >> 24;
            let channel = |shift: u32| {
                if a == 0 {
                    0
                } else {
                    ((((pixel >> shift) & 255) * 255 + a / 2) / a).min(255) as u8
                }
            };
            [channel(16), channel(8), channel(0), a as u8]
        })
        .collect();
    let mut png = Vec::new();
    {
        let mut encoder = png::Encoder::new(&mut png, w, h);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        encoder
            .write_header()
            .map_err(|e| e.to_string())?
            .write_image_data(&rgba)
            .map_err(|e| e.to_string())?;
    }
    Ok(format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(png)))
}
