use super::*;

/// Interaction selectors usually change only paint. Keep the measured page and its text runs
/// while scrolling; rerun layout only when a matched declaration changes geometry or typography.
impl Document {
    pub(super) fn refresh_state(&mut self, doc: &ComponentDocument) -> bool {
        let mut affected = HashSet::new();
        for index in 0..self.state_matches.len() {
            let (node, rule, previous) = self.state_matches[index];
            let matched = self.selector(&self.rules[rule], node, doc);
            if matched != previous {
                self.state_matches[index].2 = matched;
                affected.insert(node);
            }
        }
        if affected.is_empty() {
            return false;
        }
        let paint_only = |property: &str| {
            matches!(
                property,
                "color"
                    | "opacity"
                    | "transform"
                    | "box-shadow"
                    | "z-index"
                    | "cursor"
                    | "pointer-events"
                    | "fill"
                    | "stroke"
                    | "backdrop-filter"
                    | "filter"
                    | "border-color"
                    | "border-top-color"
                    | "border-right-color"
                    | "border-bottom-color"
                    | "border-left-color"
            ) || property.starts_with("background")
                || property.starts_with("text-decoration")
                || property.starts_with("outline")
                || property.starts_with("transition")
        };
        let mut layout_changed = false;
        let mut shifts = vec![Vec2::ZERO; self.boxes.len()];
        for i in 0..self.boxes.len() {
            let parent = self.boxes[i].parent;
            let inherited_shift = parent.map_or(Vec2::ZERO, |p| shifts[p]);
            if parent.is_some_and(|p| affected.contains(&p)) {
                // Inherited text styles, variables and opacity follow the affected ancestor.
                affected.insert(i);
            }
            let mut shift = inherited_shift;
            if affected.contains(&i) {
                let old_css = self.boxes[i].css.clone();
                self.cascade_node(i, doc);
                let item = &self.boxes[i];
                layout_changed |= old_css
                    .keys()
                    .chain(item.css.keys())
                    .any(|key| old_css.get(key) != item.css.get(key) && !paint_only(key));
                shift += transform::translation(&item.css, item.rect.size(), self.viewport)
                    - transform::translation(&old_css, item.rect.size(), self.viewport);
                self.boxes[i].paint = self.paint_style(i, &doc.palette);
                if let Some(parent) = parent {
                    self.boxes[i].paint.opacity *= self.boxes[parent].paint.opacity;
                }
            }
            shifts[i] = shift;
            self.boxes[i].rect = self.boxes[i].rect.translate(shift);
            self.boxes[i].content = self.boxes[i].content.translate(shift);
        }
        if !layout_changed {
            self.cache_paint_nodes();
        }
        layout_changed
    }
}
