use super::*;

pub(super) struct ScrollTarget {
    pub rect: Rect,
    pub drag_id: egui::Id,
    pub scroll_id: egui::Id,
    pub horizontal: bool,
}

impl ComponentDocument {
    /// A sheet may take a downward drag only when every scroll ancestor is at its top.
    pub(super) fn can_start_sheet_drag(&self, pos: Pos2) -> bool {
        if !self.context.content_rect().contains(pos) {
            return true;
        }
        if self.semantics.iter().any(|node| {
            matches!(
                node.kind.as_str(),
                "NInput" | "NTextarea" | "NSearchField" | "NInputOtp" | "NSlider" | "NCarousel"
            ) && Rect::from_min_size(Pos2::new(node.rect[0], node.rect[1]), Vec2::new(node.rect[2], node.rect[3])).contains(pos)
        }) {
            return false;
        }
        self.scroll_targets
            .iter()
            .filter(|target| !target.horizontal && target.rect.contains(pos))
            .all(|target| {
                // egui keeps the scroll offset under the area id, not its drag interaction id.
                egui::scroll_area::State::load(&self.context, target.scroll_id).is_none_or(|state| state.clamped_offset().y <= 0.5)
            })
    }

    /// Children register before parents, so a gesture follows the innermost matching axis.
    pub(super) fn register_scroll_target(&mut self, ui: &egui::Ui, id: egui::Id, rect: Rect, horizontal: bool) {
        let rect = rect.intersect(ui.clip_rect());
        if ui.is_enabled() && rect.is_positive() {
            self.scroll_targets.push(ScrollTarget {
                rect,
                drag_id: id.with("area"),
                scroll_id: id,
                horizontal,
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sheet_drag_follows_root_and_nested_scroll_boundaries() {
        for native in [false, true] {
            for nested in [false, true] {
                let mut doc = ComponentDocument::default();
                doc.command(&json!({"action":"environment","native":native})).unwrap();
                let rows: Vec<_> = (0..40)
                    .map(|i| json!({"id":format!("row-{i}"),"kind":"NText","props":{"height":44,"text":format!("Row {i}")}}))
                    .collect();
                let nodes = if nested {
                    json!([{"id":"scroll","kind":"NScrollShadow","props":{"height":220},"children":rows}])
                } else {
                    json!(rows)
                };
                doc.set_tree(&nodes).unwrap();
                for _ in 0..3 {
                    doc.frame(400., 300., 1.).drop_without_applying_deltas();
                }
                assert!(
                    doc.can_start_sheet_drag(Pos2::new(100., 100.)),
                    "initial top: native={native}, nested={nested}"
                );
                doc.touch(0, 100., 180.);
                doc.frame(400., 300., 1.).drop_without_applying_deltas();
                for y in [150., 120., 90., 60.] {
                    doc.touch(1, 100., y);
                    doc.frame(400., 300., 1.).drop_without_applying_deltas();
                }
                doc.touch(3, 100., 60.);
                doc.frame(400., 300., 1.).drop_without_applying_deltas();
                assert!(
                    !doc.can_start_sheet_drag(Pos2::new(100., 100.)),
                    "scrolled content must keep its gesture: native={native}, nested={nested}"
                );
                assert_eq!(doc.command(&json!({"action":"sheetDrag","x":100,"y":100})).unwrap()["allowed"], false);
                assert!(
                    doc.can_start_sheet_drag(Pos2::new(-10., -10.)),
                    "other surfaces must not block the handle"
                );
                // Finish scrolling back to the boundary before beginning a new downward drag.
                doc.touch(0, 100., 60.);
                doc.frame(400., 300., 1.).drop_without_applying_deltas();
                for y in [120., 180., 240., 280.] {
                    doc.touch(1, 100., y);
                    doc.frame(400., 300., 1.).drop_without_applying_deltas();
                }
                doc.touch(3, 100., 280.);
                doc.frame(400., 300., 1.).drop_without_applying_deltas();
                assert!(
                    doc.can_start_sheet_drag(Pos2::new(100., 100.)),
                    "returning to the top permits dismissal: native={native}, nested={nested}"
                );
            }
        }
    }

    #[test]
    fn sheet_drag_keeps_editors_sliders_and_carousels_interactive() {
        for kind in ["NInput", "NTextarea", "NSearchField", "NInputOtp", "NSlider", "NCarousel"] {
            let mut doc = ComponentDocument::default();
            doc.set_tree(&json!([{"id":"control","kind":kind,"props":{"width":280,"height":80},"children":[
                {"id":"slide","kind":"NText","props":{"text":"Slide"}}
            ]}]))
            .unwrap();
            for _ in 0..3 {
                doc.frame(400., 300., 1.).drop_without_applying_deltas();
            }
            let node = doc.semantics.iter().find(|node| node.id == "control").unwrap();
            let pos = Pos2::new(node.rect[0] + node.rect[2] / 2., node.rect[1] + node.rect[3] / 2.);
            assert!(!doc.can_start_sheet_drag(pos), "{kind} owns its own gesture");
        }
    }
}
