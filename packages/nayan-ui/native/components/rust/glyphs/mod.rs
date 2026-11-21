//! Platform glyphs enter egui's atlas once; shaping, layout, caching and GPU drawing stay in Rust.
use egui::{ColorImage, FontFamily, FontPriority, GlyphBitmap, GlyphRasterizer, GlyphRasterizerRequest, RasterizedGlyph, Vec2};

#[cfg(target_os = "android")]
mod android;
#[cfg(any(target_os = "ios", target_os = "macos"))]
mod apple;
#[cfg(target_arch = "wasm32")]
mod web;

pub(super) fn install(context: &egui::Context) {
    // Emoji must precede monochrome symbols already present in a text font (e.g. ❤️).
    context.add_glyph_rasterizer(
        GlyphRasterizer::new("nayan::emoji", |request| {
            egui::epaint::text::has_emoji_presentation(request.cluster)
                .then(|| rasterize(request, true))
                .flatten()
        })
        .with_priority(FontPriority::Highest),
    );
    context.add_glyph_rasterizer(GlyphRasterizer::new("nayan::unicode", |request| rasterize(request, false)));
}

fn rasterize(request: &GlyphRasterizerRequest<'_>, color: bool) -> Option<RasterizedGlyph> {
    if !request.font_size_px.is_finite()
        || !(1. ..=1024.).contains(&request.font_size_px)
        || request.cluster.is_empty()
        || request.cluster.len() > 256
    {
        return None;
    }
    #[cfg(any(target_os = "ios", target_os = "macos"))]
    return apple::rasterize(request, color);
    #[cfg(target_os = "android")]
    return android::rasterize(request, color);
    #[cfg(target_arch = "wasm32")]
    return web::rasterize(request, color);
    #[cfg(not(any(target_os = "ios", target_os = "macos", target_os = "android", target_arch = "wasm32")))]
    {
        let _ = color;
        None
    }
}

fn extent(left: f64, top: f64, right: f64, bottom: f64) -> Option<(usize, usize)> {
    let width = right - left;
    let height = bottom - top;
    (left.is_finite()
        && top.is_finite()
        && width.is_finite()
        && height.is_finite()
        && (1. ..=2048.).contains(&width)
        && (1. ..=2048.).contains(&height))
    .then_some((width as usize, height as usize))
}

#[cfg(any(target_os = "android", target_os = "ios", target_os = "macos"))]
fn bold(family: &FontFamily) -> bool {
    matches!(family, FontFamily::Name(name) if matches!(name.as_ref(), "native-semibold" | "native-bold" | "native-extrabold" | "native-black"))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn glyph_buffers_have_bounded_finite_dimensions() {
        assert_eq!(extent(-2., -24., 30., 8.), Some((32, 32)));
        for bounds in [
            [0., 0., f64::INFINITY, 20.],
            [0., f64::NAN, 20., 30.],
            [0., 0., 5000., 20.],
            [0., 0., -1., 20.],
        ] {
            assert_eq!(extent(bounds[0], bounds[1], bounds[2], bounds[3]), None);
        }
    }
    #[cfg(any(target_os = "ios", target_os = "macos"))]
    #[test]
    fn system_emoji_clusters_keep_color_and_coverage_and_missing_symbols_have_a_fallback() {
        for cluster in ["🎮", "🏆", "💎", "❤️", "👍🏽", "👨‍👩‍👧‍👦", "🇮🇳"] {
            let glyph = rasterize(
                &GlyphRasterizerRequest {
                    cluster,
                    family: &FontFamily::Proportional,
                    font_size_px: 32.,
                    subpixel_offset_px: 0.,
                },
                true,
            )
            .expect(cluster);
            assert!(glyph.bitmap.is_color);
            assert!(glyph.advance_px > 0.);
            assert!(
                glyph.bitmap.image.pixels.iter().any(|p| p.a() > 0 && p.r() != p.g()),
                "{cluster}: missing colored glyph pixels"
            );
        }
        let glyph = rasterize(
            &GlyphRasterizerRequest {
                cluster: "↗",
                family: &FontFamily::Monospace,
                font_size_px: 24.,
                subpixel_offset_px: 0.,
            },
            false,
        )
        .unwrap();
        assert!(!glyph.bitmap.is_color);
        assert!(glyph.bitmap.image.pixels.iter().any(|p| p.a() > 0));
    }
}
