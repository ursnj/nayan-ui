//! A small, antialiased gradient ring, animated by the existing engine clock.
use super::*;
use std::{
    f32::consts::{FRAC_PI_2, TAU},
    sync::Arc,
};

pub(super) fn diameter(props: &Value) -> f32 {
    let size = match props["size"].as_str() {
        Some("small" | "sm") => 20.,
        Some("large" | "lg") => 48.,
        _ => numeric(props, &["size"], 32.) as f32,
    };
    size.clamp(8., 160.)
}

pub(super) fn measure(context: &egui::Context, node: &Node, style: &style::Style, width: f32, scale: f32) -> (Vec2, Option<Arc<egui::Galley>>) {
    let size = diameter(&node.props);
    let label = node.props["label"].as_str().filter(|text| !text.trim().is_empty());
    let caption = label.map(|label| {
        context.fonts_mut(|fonts| {
            fonts.layout(
                label.into(),
                egui::FontId::new(style.text_size.unwrap_or(14.) * scale.max(1.), style.font_family()),
                Color32::WHITE,
                width.max(1.),
            )
        })
    });
    let extent = caption.as_ref().map_or(Vec2::splat(size), |caption| {
        Vec2::new(size.max(caption.size().x), size + 8. + caption.size().y)
    });
    (extent, caption)
}

fn angles(time: f64, animate: bool) -> (f32, f32) {
    if !animate {
        return (-FRAC_PI_2, TAU * 0.72);
    }
    let phase = (time % 30.) as f32;
    (phase * TAU * 0.9 - FRAC_PI_2, TAU * (0.47 + 0.23 * (phase * TAU / 1.5).sin()))
}

fn arc(center: Pos2, radius: f32, stroke: f32, start: f32, sweep: f32, color: Color32, pixel: f32) -> egui::Mesh {
    let steps = (radius * sweep).ceil().clamp(16., 64.) as usize;
    let mut mesh = egui::Mesh::default();
    mesh.vertices.reserve((steps + 1) * 4);
    mesh.indices.reserve(steps * 18);
    for index in 0..=steps {
        let fraction = index as f32 / steps as f32;
        let normal = Vec2::angled(start + sweep * fraction);
        let tint = color.gamma_multiply(0.22 + fraction * 0.78);
        for (distance, color) in [
            (radius + stroke * 0.5 + pixel, Color32::TRANSPARENT),
            (radius + stroke * 0.5, tint),
            (radius - stroke * 0.5, tint),
            ((radius - stroke * 0.5 - pixel).max(0.), Color32::TRANSPARENT),
        ] {
            mesh.colored_vertex(center + normal * distance, color);
        }
        if index > 0 {
            let current = index as u32 * 4;
            for lane in 0..3 {
                let previous = current - 4 + lane;
                mesh.add_triangle(previous, previous + 1, current + lane);
                mesh.add_triangle(previous + 1, current + lane + 1, current + lane);
            }
        }
    }
    mesh
}

impl ComponentDocument {
    pub(super) fn loading(&mut self, ui: &mut egui::Ui, node: &Node, resolved: &style::Style) {
        let available = ui.available_width().max(1.);
        let (natural, caption) = measure(
            ui.ctx(),
            node,
            resolved,
            resolved.width.unwrap_or(available).min(available),
            self.font_scale,
        );
        let fill = node.props["fill"] == true;
        // Scroll layouts have unbounded content height. Fill only the visible remainder,
        // respecting a containing panel's clip and any header above the indicator.
        let bottom = ui.max_rect().bottom().min(ui.clip_rect().bottom()).min(ui.ctx().viewport_rect().bottom());
        let remaining = (bottom - ui.cursor().min.y).max(1.);
        let width = resolved.width.unwrap_or(if fill { available } else { natural.x }).min(available).max(1.);
        let height = resolved.height.unwrap_or(if fill { remaining } else { natural.y }).max(1.);
        let (rect, response) = ui.allocate_exact_size(Vec2::new(width, height), egui::Sense::hover());
        let animating = node.props["animating"] != false;
        if ui.is_rect_visible(rect) {
            let caption_height = caption.as_ref().map_or(0., |caption| caption.size().y + 8.);
            let size = diameter(&node.props).min(width).min((height - caption_height).max(1.));
            let stroke = numeric(&node.props, &["strokeWidth"], (size * 0.1) as f64).clamp(0.5, (size * 0.25).max(0.5) as f64) as f32;
            let radius = (size - stroke) * 0.5;
            let center = Pos2::new(rect.center().x, rect.top() + (height - size - caption_height).max(0.) * 0.5 + size * 0.5);
            let color = node.props["color"]
                .as_str()
                .and_then(|color| self.palette.color(color).or_else(|| theme::parse_color(color)))
                .or(resolved.foreground)
                .unwrap_or_else(|| self.palette.get("accent"));
            ui.painter()
                .circle_stroke(center, radius, egui::Stroke::new(stroke, color.gamma_multiply(0.12)));
            let moving = animating && !self.reduced_motion;
            let (start, sweep) = angles(self.elapsed, moving);
            ui.painter().add(egui::Shape::mesh(arc(
                center,
                radius,
                stroke,
                start,
                sweep,
                color,
                1. / ui.ctx().pixels_per_point().max(1.),
            )));
            ui.painter()
                .circle_filled(center + Vec2::angled(start) * radius, stroke * 0.5, color.gamma_multiply(0.22));
            ui.painter()
                .circle_filled(center + Vec2::angled(start + sweep) * radius, stroke * 0.5, color);
            if let Some(caption) = caption {
                ui.painter().galley_with_override_text_color(
                    Pos2::new(rect.center().x - caption.size().x * 0.5, center.y + size * 0.5 + 8.),
                    caption,
                    self.palette.get("muted"),
                );
            }
            if moving {
                ui.ctx().request_repaint();
            }
        }
        self.semantic(ui, node, &response, json!(animating));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fill_respects_a_css_panels_height_and_padding_below_its_header() {
        let mut doc = ComponentDocument::default();
        doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
        doc.set_tree(
            &json!([{"id":"panel","kind":"NView","props":{"style":{"height":400,"padding":20}},"children":[
                {"id":"header","kind":"NView","props":{"style":{"height":80,"flexShrink":0}}},
                {"id":"loading","kind":"NLoading","props":{"fill":true}}
            ]}]),
        )
        .unwrap();
        doc.frame(320., 700., 1.).drop_without_applying_deltas();
        let rect = doc.layout_rects["loading"];
        assert!((rect.top() - 100.).abs() < 1., "{rect:?}");
        assert!((rect.height() - 280.).abs() < 1., "{rect:?}");
        assert!((rect.center().x - 160.).abs() < 1., "{rect:?}");
    }

    #[test]
    fn fill_uses_the_visible_remainder_after_headers_and_resizes_with_the_surface() {
        for (width, height, header) in [(320., 480., 0.), (402., 700., 120.), (768., 540., 180.)] {
            let mut doc = ComponentDocument::default();
            doc.set_tree(&json!([{"id":"page","kind":"NView","props":{"className":"w-full gap-0"},"children":[
                {"id":"header","kind":"NView","props":{"height":header}},
                {"id":"loading","kind":"NLoading","props":{"fill":true,"size":"large"}}
            ]}]))
            .unwrap();
            doc.frame(width, height, 1.).drop_without_applying_deltas();
            let rect = doc.layout_rects["loading"];
            assert!(rect.top() >= header);
            assert!(rect.height() > height - header - 32., "{rect:?}");
            assert!(rect.bottom() <= height + 0.1, "{rect:?}");
            assert!((rect.center().x - width / 2.).abs() < 1., "{rect:?}");
        }
    }

    #[test]
    fn sizes_accept_existing_mobile_names_and_bound_custom_values() {
        for (value, expected) in [
            (json!(null), 32.),
            (json!("small"), 20.),
            (json!("medium"), 32.),
            (json!("large"), 48.),
            (json!(64), 64.),
            (json!(-4), 8.),
            (json!(9999), 160.),
        ] {
            assert_eq!(diameter(&json!({"size":value})), expected);
        }
    }
    #[test]
    fn reduced_motion_is_static_and_the_native_clock_advances_the_ring() {
        assert_eq!(angles(0., false), angles(100., false));
        assert_ne!(angles(0., true), angles(0.5, true));
        let mesh = arc(Pos2::new(24., 24.), 20., 4., 0., TAU * 0.72, Color32::RED, 0.5);
        assert!(mesh.vertices.iter().all(|vertex| vertex.pos.x.is_finite() && vertex.pos.y.is_finite()));
        assert!(mesh.indices.iter().all(|index| (*index as usize) < mesh.vertices.len()));
        assert!(mesh.vertices.len() <= 260);
    }
    #[test]
    fn caption_is_measured_beneath_a_centered_ring_and_reports_indeterminate_loading() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([{"id":"loading","kind":"NLoading","props":{"size":"large","width":280,"label":"Loading games…","color":"#a78bfa"}}]))
            .unwrap();
        doc.frame(320., 240., 1.).drop_without_applying_deltas();
        let node = doc.semantics.iter().find(|node| node.id == "loading").unwrap();
        assert_eq!(node.rect[2], 280.);
        assert!(node.rect[3] > 64.);
        assert_eq!(node.label, "Loading games…");
        assert_eq!(node.value, true);
    }
}
