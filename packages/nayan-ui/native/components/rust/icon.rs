//! Vector icons: SVG path data rasterized once per pixel size into an alpha mask, tinted on the GPU.
use raqote::{DrawOptions, DrawTarget, LineCap, LineJoin, SolidSource, Source, StrokeStyle, Transform, Winding};
pub(super) const MAX_PIXELS: usize = 512;

/// Fills (or strokes, with `stroke` in viewBox units) `paths` scaled uniformly and centered from
/// `view` (`[x, y, width, height]`) into a square of `pixels`. Returns one coverage byte per pixel.
pub(super) fn mask(paths: &[String], view: [f32; 4], pixels: usize, stroke: Option<f32>, even_odd: bool) -> Result<Vec<u8>, String> {
    let pixels = pixels.clamp(1, MAX_PIXELS);
    let [x, y, width, height] = view;
    if !(width > 0. && height > 0. && x.is_finite() && y.is_finite()) {
        return Err("Icon viewBox must have a positive size".into());
    }
    let side = pixels as f32;
    let scale = side / width.max(height);
    let mut target = DrawTarget::new(pixels as i32, pixels as i32);
    target.set_transform(&Transform::new(
        scale,
        0.,
        0.,
        scale,
        (side - width * scale) / 2. - x * scale,
        (side - height * scale) / 2. - y * scale,
    ));
    let white = Source::Solid(SolidSource {
        r: 255,
        g: 255,
        b: 255,
        a: 255,
    });
    for d in paths {
        if d.len() > 64 * 1024 {
            return Err("Icon path exceeds 64 KB".into());
        }
        let mut path = crate::svg::parse_svg(d)?;
        match stroke {
            Some(width) => target.stroke(
                &path,
                &white,
                &StrokeStyle {
                    width,
                    cap: LineCap::Round,
                    join: LineJoin::Round,
                    ..Default::default()
                },
                &DrawOptions::new(),
            ),
            None => {
                path.winding = if even_odd { Winding::EvenOdd } else { Winding::NonZero };
                target.fill(&path, &white, &DrawOptions::new());
            }
        }
    }
    Ok(target.get_data().iter().map(|pixel| (pixel >> 24) as u8).collect())
}

/// Rasterize an outline or pattern for a native Image adapter.
/// Kept independent of a UI document and GPU: callers run this on their asset worker.
pub(crate) fn request(command: &str) -> Result<serde_json::Value, String> {
    use base64::Engine;
    use serde_json::{Value, json};
    let value: Value = serde_json::from_str(command).map_err(|e| e.to_string())?;
    match value["action"].as_str() {
        Some("patternImage") => super::pattern::native_image(&value).map(Value::String),
        Some("image") => {
            let paths: Vec<String> = match &value["paths"] {
                Value::String(s) => vec![s.clone()],
                Value::Array(paths) if paths.len() <= 32 => paths
                    .iter()
                    .map(|s| s.as_str().map(String::from).ok_or("Invalid icon path"))
                    .collect::<Result<_, _>>()?,
                _ => return Err("Missing icon paths".into()),
            };
            let view = match &value["viewBox"] {
                Value::Number(n) => {
                    let side = n.as_f64().ok_or("Invalid icon viewBox")? as f32;
                    [0., 0., side, side]
                }
                Value::Array(v) if v.len() == 4 => {
                    let mut view = [0.; 4];
                    for (i, n) in v.iter().enumerate() {
                        view[i] = n.as_f64().filter(|n| n.is_finite()).ok_or("Invalid icon viewBox")? as f32;
                    }
                    view
                }
                Value::Null => [0., 0., 24., 24.],
                _ => return Err("Invalid icon viewBox".into()),
            };
            let pixels = value["pixels"]
                .as_u64()
                .filter(|n| *n > 0 && *n <= MAX_PIXELS as u64)
                .ok_or("Icon pixels must be between 1 and 512")? as usize;
            let stroke = value["strokeWidth"].as_f64().map(|n| n as f32);
            let alpha = mask(&paths, view, pixels, stroke, value["fillRule"] == "evenodd")?;
            let rgba: Vec<u8> = alpha.into_iter().flat_map(|a| [0, 0, 0, a]).collect();
            let mut png = Vec::new();
            {
                let mut encoder = png::Encoder::new(&mut png, pixels as u32, pixels as u32);
                encoder.set_color(png::ColorType::Rgba);
                encoder.set_depth(png::BitDepth::Eight);
                encoder
                    .write_header()
                    .map_err(|e| e.to_string())?
                    .write_image_data(&rgba)
                    .map_err(|e| e.to_string())?;
            }
            Ok(json!(format!(
                "data:image/png;base64,{}",
                base64::engine::general_purpose::STANDARD.encode(png)
            )))
        }
        _ => Err("Unknown icon operation".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    const CROWN: &str = "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z";
    fn at(mask: &[u8], pixels: usize, x: usize, y: usize) -> u8 {
        mask[y * pixels + x]
    }
    #[test]
    fn native_icon_pngs_preserve_shape_and_transparent_holes() {
        use base64::Engine;
        let image = request(r#"{"action":"image","paths":"M0 0H24V24H0ZM6 6V18H18V6Z","pixels":96}"#).unwrap();
        let data = image.as_str().unwrap().strip_prefix("data:image/png;base64,").unwrap();
        let png = base64::engine::general_purpose::STANDARD.decode(data).unwrap();
        let rgba = crate::assets::texture::decode(&png).unwrap();
        assert_eq!((rgba.width, rgba.height), (96, 96));
        let alpha: Vec<_> = rgba.rgba.chunks_exact(4).map(|pixel| pixel[3]).collect();
        assert!(alpha.iter().any(|a| *a > 200));
        assert_eq!(alpha[48 * 96 + 48], 0, "the hole stays transparent");
        assert!(request(r#"{"action":"image","paths":"M0 0H24V24H0Z","pixels":513}"#).is_err());
    }
    #[test]
    fn nonzero_fills_keep_counter_wound_holes_open() {
        let ring = "M0 0H24V24H0ZM6 6V18H18V6Z".to_owned();
        let mask = mask(&[ring], [0., 0., 24., 24.], 24, None, false).unwrap();
        assert_eq!(at(&mask, 24, 2, 2), 255);
        assert_eq!(at(&mask, 24, 12, 12), 0);
    }
    #[test]
    fn arcs_and_strokes_rasterize_inside_the_view_box() {
        let mask = mask(&[CROWN.to_owned(), "M5 21h14".to_owned()], [0., 0., 24., 24.], 48, Some(2.), false).unwrap();
        assert!(at(&mask, 48, 24, 42) > 200, "base line");
        assert!(at(&mask, 48, 24, 7) > 100, "crown tip drawn through its arc");
        assert_eq!(at(&mask, 48, 24, 24), 0, "stroked outlines stay hollow");
        assert_eq!(at(&mask, 48, 0, 0), 0);
    }
    #[test]
    fn invalid_paths_and_view_boxes_are_rejected() {
        assert!(mask(&["M0 0 L".to_owned()], [0., 0., 24., 24.], 24, None, false).is_err());
        assert!(mask(&[CROWN.to_owned()], [0., 0., 0., 24.], 24, None, false).is_err());
    }
}
