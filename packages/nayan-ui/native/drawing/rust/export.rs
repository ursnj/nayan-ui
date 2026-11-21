//! Self-contained SVG export with per-layer masks for true transparent erasing.
use super::*;
use std::fmt::Write;
fn element(stroke: &Stroke, color: &str, opacity: f32, glow: bool, hairline: f32) -> String {
    let data = path::svg(&stroke.path);
    let style = stroke.style(glow);
    let fill = stroke.fill && !glow;
    let cap = match style.cap {
        raqote::LineCap::Butt => "butt",
        raqote::LineCap::Square => "square",
        _ => "round",
    };
    let join = match style.join {
        raqote::LineJoin::Miter => "miter",
        _ => "round",
    };
    let rule = if stroke.path.winding == raqote::Winding::NonZero {
        "nonzero"
    } else {
        "evenodd"
    };
    let blend = if glow { " style=\"mix-blend-mode:screen\"" } else { "" };
    format!(
        "<path d=\"{data}\" fill=\"{}\" stroke=\"{}\" stroke-width=\"{}\" stroke-linecap=\"{cap}\" stroke-linejoin=\"{join}\" fill-rule=\"{rule}\" opacity=\"{opacity}\"{blend}/>",
        if fill { color } else { "none" },
        if fill { "none" } else { color },
        if style.width == 0. { hairline } else { style.width }
    )
}
impl Document {
    pub fn svg(&mut self) -> String {
        self.finish();
        let mut out = format!(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}\" height=\"{}\" viewBox=\"0 0 {} {}\"><defs>",
            self.width, self.height, self.width, self.height
        );
        for (i, s) in self.paths.iter().enumerate().filter(|(_, s)| s.erase) {
            let _ = write!(
                out,
                "<mask id=\"erase{i}\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"{}\" height=\"{}\"><rect width=\"{}\" height=\"{}\" fill=\"white\"/>{}</mask>",
                self.width,
                self.height,
                self.width,
                self.height,
                element(s, "black", s.opacity, false, 1. / self.raster.ratio)
            );
        }
        out.push_str("</defs>");
        for layer in self.layers.iter().filter(|l| l.visible && l.opacity > 0.) {
            let _ = write!(out, "<g style=\"isolation:isolate\" opacity=\"{}\">", layer.opacity);
            let strokes = self.paths.iter().enumerate().filter(|(_, s)| layer_id(s) == layer.id).collect::<Vec<_>>();
            for (i, _) in strokes.iter().rev().filter(|(_, s)| s.erase) {
                let _ = write!(out, "<g mask=\"url(#erase{i})\">");
            }
            for (_, stroke) in strokes {
                if stroke.erase {
                    out.push_str("</g>");
                    continue;
                }
                let c = stroke.color;
                let color = format!("#{:02x}{:02x}{:02x}", c[0], c[1], c[2]);
                if stroke.brush == "NEON" {
                    out.push_str(&element(
                        stroke,
                        &color,
                        stroke.opacity * c[3] as f32 / 255. * 0.35,
                        true,
                        1. / self.raster.ratio,
                    ));
                }
                out.push_str(&element(
                    stroke,
                    &color,
                    stroke.opacity * c[3] as f32 / 255.,
                    false,
                    1. / self.raster.ratio,
                ));
            }
            out.push_str("</g>");
        }
        out.push_str("</svg>");
        out
    }
}
