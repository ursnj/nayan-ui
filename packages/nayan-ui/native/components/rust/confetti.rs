use super::*;

impl ComponentDocument {
    pub(super) fn paint_confetti(&mut self, painter: &egui::Painter, node: &Node, rect: Rect) {
        let run = node.props["run"].as_u64().unwrap_or(0);
        if run == 0 {
            return;
        }
        let state = self.confetti.entry(node.id.clone()).or_insert((run, self.elapsed));
        if state.0 != run {
            *state = (run, self.elapsed);
        }
        let duration = numeric(&node.props, &["duration"], 1.4).clamp(0.1, 10.);
        let elapsed = self.elapsed - state.1;
        if elapsed > duration {
            return;
        }
        let progress = if self.reduced_motion {
            if elapsed > 0.2 {
                return;
            }
            0.35
        } else {
            (elapsed / duration) as f32
        };
        let defaults = ["#f2a6c3", "#ffd385", "#91d9bd", "#a9c9fa", "#c4b1ed"];
        let colors: Vec<_> = node.props["confettiColors"]
            .as_array()
            .map(|values| values.iter().filter_map(|v| v.as_str().and_then(theme::parse_color)).collect())
            .unwrap_or_default();
        let count = numeric(&node.props, &["count"], 24.).clamp(1., 128.) as usize;
        for index in 0..count {
            let i = index as f32;
            let x = rect.center().x + (i * 2.4).sin() * progress * rect.width() * 0.44;
            let y = rect.top()
                + rect.height() * (0.3 - (progress * std::f32::consts::PI).sin() * (0.12 + (index % 4) as f32 * 0.025) + progress * progress * 0.55);
            let angle = progress * if index % 2 == 0 { 11.17 } else { -9.07 };
            let (sin, cos) = angle.sin_cos();
            let points = [(-3.5, -6.), (3.5, -6.), (3.5, 6.), (-3.5, 6.)]
                .into_iter()
                .map(|(dx, dy)| Pos2::new(x + dx * cos - dy * sin, y + dx * sin + dy * cos))
                .collect();
            let color = if colors.is_empty() {
                theme::parse_color(defaults[index % defaults.len()]).unwrap()
            } else {
                colors[index % colors.len()]
            };
            let alpha = ((1. - progress) * 4.).clamp(0., 1.);
            painter.add(egui::Shape::convex_polygon(points, color.gamma_multiply(alpha), egui::Stroke::NONE));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn a_run_keeps_its_clock_across_updates_restarts_explicitly_and_releases_on_unmount() {
        let mut doc = ComponentDocument::default();
        let tree = |run| json!([{"id":"confetti","kind":"NConfetti","props":{"run":run,"width":300,"height":400}}]);
        doc.set_tree(&tree(1)).unwrap();
        doc.frame(300., 400., 1.).drop_without_applying_deltas();
        let started = doc.confetti["confetti"].1;
        for _ in 0..10 {
            doc.frame(300., 400., 1.).drop_without_applying_deltas();
        }
        doc.set_tree(&tree(1)).unwrap();
        doc.frame(300., 400., 1.).drop_without_applying_deltas();
        assert_eq!(doc.confetti["confetti"].1, started);
        doc.set_tree(&tree(2)).unwrap();
        doc.frame(300., 400., 1.).drop_without_applying_deltas();
        assert!(doc.confetti["confetti"].1 > started);
        doc.set_tree(&json!([])).unwrap();
        assert!(doc.confetti.is_empty());
    }
}
