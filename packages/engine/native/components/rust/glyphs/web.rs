use super::*;
use std::cell::RefCell;
use wasm_bindgen::JsCast;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};
thread_local! {static CANVAS:RefCell<Option<CanvasRenderingContext2d>>=const{RefCell::new(None)};}

pub(super) fn rasterize(request: &GlyphRasterizerRequest<'_>, color: bool) -> Option<RasterizedGlyph> {
    CANVAS.with(|cached| {
        let mut cached = cached.borrow_mut();
        if cached.is_none() {
            let canvas = web_sys::window()?
                .document()?
                .create_element("canvas")
                .ok()?
                .dyn_into::<HtmlCanvasElement>()
                .ok()?;
            *cached = Some(canvas.get_context("2d").ok()??.dyn_into::<CanvasRenderingContext2d>().ok()?);
        }
        let context = cached.as_ref()?;
        let family = if matches!(request.family, FontFamily::Monospace) {
            "monospace"
        } else {
            "system-ui, sans-serif"
        };
        let font = format!(
            "{} {}px {}, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'",
            super::super::fonts::css_weight(request.family),
            request.font_size_px,
            family
        );
        context.set_font(&font);
        context.set_text_baseline("alphabetic");
        let metrics = context.measure_text(request.cluster).ok()?;
        let left = -metrics.actual_bounding_box_left().ceil() - 1.;
        let right = metrics.actual_bounding_box_right().max(metrics.width()).ceil() + 1.;
        let top = -metrics.actual_bounding_box_ascent().ceil() - 1.;
        let bottom = metrics.actual_bounding_box_descent().ceil() + 1.;
        let (width, height) = extent(left, top, right, bottom)?;
        let advance = metrics.width() as f32;
        if !advance.is_finite() || advance <= 0. {
            return None;
        }
        let canvas = context.canvas()?;
        canvas.set_width(width as u32);
        canvas.set_height(height as u32);
        // Resizing clears the canvas and resets its text state.
        context.set_font(&font);
        context.set_text_baseline("alphabetic");
        context.set_fill_style_str("#ffffff");
        context.fill_text(request.cluster, -left, -top).ok()?;
        let data = context.get_image_data(0., 0., width as f64, height as f64).ok()?.data();
        Some(RasterizedGlyph {
            bitmap: GlyphBitmap {
                image: ColorImage::from_rgba_unmultiplied([width, height], &data),
                offset_px: Vec2::new(left as f32, top as f32),
                is_color: color,
            },
            advance_px: advance,
        })
    })
}
