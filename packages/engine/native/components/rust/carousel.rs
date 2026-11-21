use super::*;

#[derive(Default, Debug)]
pub(super) struct CarouselState {
    index: Option<usize>,
    width: f32,
    offset: f32,
    target: Option<f32>,
    last_activity: f64,
    down: bool,
    wheeling: bool,
    autoplay: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    fn slides(autoplay: bool) -> Value {
        json!({"id":"hero","kind":"NCarousel","props":{"height":200,"autoPlay":autoplay,"interval":1000,"accessibilityLabel":"Highlights"},"children":[
            {"id":"slide-a","kind":"NText","props":{"text":"First slide"}},
            {"id":"slide-b","kind":"NText","props":{"text":"Second slide"}},
            {"id":"slide-c","kind":"NText","props":{"text":"Third slide"}}
        ]})
    }

    fn frame(doc: &mut ComponentDocument, frames: usize) {
        for _ in 0..frames {
            doc.frame(400., 600., 1.).drop_without_applying_deltas();
        }
    }
    #[test]
    fn autoplay_is_native_and_pauses_when_disabled_by_the_host() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([slides(true)])).unwrap();
        frame(&mut doc, 85);
        assert_eq!(doc.values["hero"].as_f64(), Some(1.));
        assert!(doc.semantics.iter().any(|node| node.id == "slide-b"));
        doc.set_tree(&json!([slides(false)])).unwrap();
        frame(&mut doc, 180);
        assert_eq!(doc.values["hero"].as_f64(), Some(1.));
        doc.set_tree(&json!([slides(true)])).unwrap();
        frame(&mut doc, 30);
        assert_eq!(doc.values["hero"].as_f64(), Some(1.));
        frame(&mut doc, 40);
        assert_eq!(
            doc.values["hero"].as_f64(),
            Some(2.),
            "state={:?}, events={:?}, semantics={}",
            doc.carousels.get("hero"),
            doc.events,
            doc.snapshot()["nodes"]
        );
    }
    #[test]
    fn indicators_and_accessible_steps_use_the_same_rust_page_state() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([slides(false)])).unwrap();
        frame(&mut doc, 3);
        doc.command(&json!({"action":"increment","id":"hero"})).unwrap();
        frame(&mut doc, 30);
        assert_eq!(doc.values["hero"].as_f64(), Some(1.));
        doc.command(&json!({"action":"activate","id":"hero:page:2"})).unwrap();
        frame(&mut doc, 30);
        assert_eq!(
            doc.values["hero"].as_f64(),
            Some(2.),
            "state={:?}, events={:?}, semantics={}",
            doc.carousels.get("hero"),
            doc.events,
            doc.snapshot()["nodes"]
        );
        doc.command(&json!({"action":"focus","id":"hero"})).unwrap();
        doc.command(&json!({"action":"key","key":"Home"})).unwrap();
        frame(&mut doc, 30);
        assert_eq!(doc.values["hero"].as_f64(), Some(0.));
    }
    #[test]
    fn a_horizontal_swipe_snaps_and_resizing_keeps_the_selected_page() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([slides(false)])).unwrap();
        frame(&mut doc, 3);
        doc.touch(0, 330., 70.);
        frame(&mut doc, 1);
        doc.touch(1, 40., 70.);
        frame(&mut doc, 2);
        doc.touch(2, 40., 70.);
        frame(&mut doc, 60);
        assert_eq!(doc.values["hero"].as_f64(), Some(1.));
        for width in [240., 768., 400.] {
            for _ in 0..25 {
                doc.frame(width, 600., 1.).drop_without_applying_deltas();
            }
            assert_eq!(doc.values["hero"].as_f64(), Some(1.));
            let slide = doc.semantics.iter().find(|node| node.id == "slide-b").unwrap();
            assert!(slide.rect[0] >= 0. && slide.rect[0] + slide.rect[2] <= width);
        }
    }
    #[test]
    fn vertical_pages_snap_and_resize_on_the_vertical_axis() {
        let mut doc = ComponentDocument::default();
        let mut node = slides(false);
        node["props"]["orientation"] = json!("vertical");
        doc.set_tree(&json!([node.clone()])).unwrap();
        frame(&mut doc, 3);
        doc.touch(0, 100., 130.);
        frame(&mut doc, 1);
        doc.touch(1, 100., 20.);
        frame(&mut doc, 2);
        doc.touch(2, 100., 20.);
        frame(&mut doc, 60);
        assert_eq!(doc.values["hero"], json!(1));
        let second = doc.semantics.iter().find(|n| n.id == "slide-b").unwrap();
        assert!(second.rect[1] >= 0. && second.rect[1] < 200.);
        node["props"]["height"] = json!(300);
        doc.set_tree(&json!([node])).unwrap();
        frame(&mut doc, 30);
        assert_eq!(doc.values["hero"], json!(1));
        doc.command(&json!({"action":"focus","id":"hero"})).unwrap();
        doc.command(&json!({"action":"key","key":"ArrowDown"})).unwrap();
        frame(&mut doc, 30);
        assert_eq!(doc.values["hero"], json!(2));
    }
    #[test]
    fn a_scrolled_away_header_pauses_autoplay_without_a_javascript_timer() {
        let mut doc = ComponentDocument::default();
        let list = json!({"id":"list","kind":"NList","props":{"height":200,"itemCount":100,"itemSize":40,"headerSize":200},"children":[
            {"id":"header","kind":"NListHeader","children":[slides(true)]}
        ]});
        doc.set_tree(&json!([list])).unwrap();
        frame(&mut doc, 5);
        doc.command(&json!({"action":"listScroll","id":"list","offset":500})).unwrap();
        frame(&mut doc, 180);
        assert_eq!(doc.values["hero"].as_f64(), Some(0.));
        doc.command(&json!({"action":"listScroll","id":"list","offset":0})).unwrap();
        frame(&mut doc, 30);
        assert_eq!(doc.values["hero"].as_f64(), Some(0.));
        frame(&mut doc, 40);
        assert_eq!(doc.values["hero"].as_f64(), Some(1.));
    }
    #[test]
    fn a_vertical_swipe_on_the_carousel_scrolls_its_parent_list() {
        let mut doc = ComponentDocument::default();
        let list = json!({"id":"list","kind":"NList","props":{"height":240,"itemCount":100,"itemSize":40,"headerSize":200},"children":[
            {"id":"header","kind":"NListHeader","children":[slides(false)]}
        ]});
        doc.set_tree(&json!([list])).unwrap();
        frame(&mut doc, 3);
        doc.touch(0, 100., 130.);
        frame(&mut doc, 1);
        doc.touch(1, 100., 30.);
        frame(&mut doc, 1);
        doc.touch(2, 100., 30.);
        frame(&mut doc, 20);
        let list = doc.semantics.iter().find(|node| node.id == "list").unwrap();
        assert!(list.value["offset"].as_f64().unwrap() > 50.);
        assert_eq!(doc.values["hero"].as_f64(), Some(0.));
    }
}

impl CarouselState {
    pub(super) fn pause(&mut self, now: f64) {
        self.last_activity = now;
    }

    fn slide(&mut self, index: usize, now: f64) {
        self.index = Some(index);
        self.target = Some(index as f32 * self.width);
        self.last_activity = now;
    }
}

impl ComponentDocument {
    pub(super) fn carousel(&mut self, ui: &mut egui::Ui, node: &Node, resolved: &style::Style) {
        ui.spacing_mut().item_spacing = Vec2::ZERO;
        ui.style_mut().always_scroll_the_only_direction = false;
        let count = node.children.len();
        let width = ui.available_width().max(1.);
        let height = resolved.height.unwrap_or(240.).max(1.);
        if count == 0 {
            ui.allocate_exact_size(Vec2::new(width, height), egui::Sense::hover());
            return;
        }
        let indicators = node.props["showIndicators"] != false;
        let overlay = node.props["indicatorPlacement"] == "overlay";
        let dots_height = if indicators && !overlay { 44f32.min(height) } else { 0. };
        let panel_height = (height - dots_height).max(1.);
        let vertical = node.props["orientation"] == "vertical";
        let extent = if vertical { panel_height } else { width };
        let axis = |v: Vec2| if vertical { v.y } else { v.x };
        let along = |n| if vertical { Vec2::new(0., n) } else { Vec2::new(n, 0.) };
        let now = self.elapsed;
        let index = self
            .value(node, &["value"], json!(0))
            .as_f64()
            .filter(|n| n.is_finite())
            .unwrap_or(0.)
            .clamp(0., count.saturating_sub(1) as f64) as usize;
        let mut state = self.carousels.remove(&node.id).unwrap_or_else(|| CarouselState {
            last_activity: now,
            ..Default::default()
        });
        let autoplay = node.props["autoPlay"] == true && ui.is_enabled() && count > 1;
        if state.autoplay != autoplay {
            state.last_activity = now;
            state.autoplay = autoplay;
        }
        if state.width != extent {
            state.width = extent;
            state.offset = index as f32 * extent;
            state.slide(index, now);
        } else if state.index != Some(index) {
            state.slide(index, now);
        }
        let interval = numeric(&node.props, &["interval"], 5000.).max(1000.) / 1000.;
        let pointer = ui.input(|input| input.pointer.any_down());
        if autoplay && !pointer && !state.wheeling && now - state.last_activity >= interval {
            let next = (state.index.unwrap_or(0) + 1) % count;
            state.slide(next, now);
            self.values.insert(node.id.clone(), json!(next));
            self.change(&node.id, json!(next));
        }
        let mut area = (if vertical {
            egui::ScrollArea::vertical()
        } else {
            egui::ScrollArea::horizontal()
        })
        .id_salt((&node.id, "carousel"))
        .max_height(panel_height)
        .min_scrolled_height(panel_height)
        .auto_shrink([false, false])
        .scroll_bar_visibility(egui::scroll_area::ScrollBarVisibility::AlwaysHidden);
        let animated = state.target.is_some();
        if state.width != 0. && state.index == Some(index) && state.offset == index as f32 * extent {
            area = if vertical {
                area.vertical_scroll_offset(state.offset)
            } else {
                area.horizontal_scroll_offset(state.offset)
            };
        }
        area = area.animated(!self.reduced_motion);
        let output = area.show_viewport(ui, |ui, viewport| {
            ui.spacing_mut().item_spacing = Vec2::ZERO;
            ui.style_mut().always_scroll_the_only_direction = false;
            ui.set_min_size(if vertical {
                Vec2::new(width, panel_height * count as f32)
            } else {
                Vec2::new(width * count as f32, panel_height)
            });
            let origin = ui.max_rect().min;
            for (index, child) in node.children.iter().enumerate() {
                let rect = Rect::from_min_size(origin + along(index as f32 * extent), Vec2::new(width, panel_height));
                if rect.intersects(ui.clip_rect()) {
                    ui.scope_builder(egui::UiBuilder::new().max_rect(rect), |ui| {
                        ui.set_clip_rect(ui.clip_rect().intersect(rect));
                        self.nodes(ui, std::slice::from_ref(child));
                    });
                } else {
                    self.forget_list_bounds(std::slice::from_ref(child));
                }
            }
            if let Some(target) = state.target {
                if (axis(viewport.min.to_vec2()) - target).abs() > 0.5 {
                    ui.scroll_with_delta_animation(along(axis(viewport.min.to_vec2()) - target), egui::style::ScrollAnimation::duration(0.3));
                }
            }
        });
        if axis(output.content_size)
            > if vertical {
                output.inner_rect.height()
            } else {
                output.inner_rect.width()
            }
        {
            self.register_scroll_target(ui, output.id, output.inner_rect, !vertical);
        }
        let offset = axis(output.state.clamped_offset());
        let down = pointer && (state.down || ui.input(|input| input.pointer.interact_pos().is_some_and(|pos| output.inner_rect.contains(pos))));
        let wheel = ui.input(|input| axis(input.smooth_scroll_delta).abs() > 0.);
        state.offset = offset;
        if state.target.is_some_and(|target| (target - offset).abs() <= 0.5) {
            state.target = None;
        }
        if down {
            state.target = None;
            state.last_activity = now;
        } else if wheel && !animated {
            state.last_activity = now;
            state.wheeling = true;
        }
        if (state.down && !pointer) || (state.wheeling && !pointer && now - state.last_activity > 0.12) {
            let projected = offset + axis(output.state.velocity()) * 0.12;
            let current = state.index.unwrap_or(0);
            let next = ((projected / extent).round().max(0.) as usize).clamp(current.saturating_sub(1), (current + 1).min(count - 1));
            state.slide(next, now);
            state.wheeling = false;
            if next != current {
                self.values.insert(node.id.clone(), json!(next));
                self.change(&node.id, json!(next));
            }
        }
        state.down = down;
        if indicators {
            let active_index = state.index;
            let pill_width = |index: usize| if active_index == Some(index) { 24. } else { 8. };
            // Overlay dots sit on the slides like the platform carousel: tight spacing, one color.
            let dots: Vec<(Rect, Rect)> = if overlay {
                let gap = numeric(&node.props, &["indicatorGap"], 8.) as f32;
                let inset = numeric(&node.props, &["indicatorInset"], 16.) as f32;
                let total = (0..count).map(pill_width).sum::<f32>() + gap * count.saturating_sub(1) as f32;
                let y = output.inner_rect.bottom() - inset - 4.;
                let mut x = output.inner_rect.center().x - total / 2.;
                (0..count)
                    .map(|index| {
                        let pill = Rect::from_min_size(Pos2::new(x, y - 4.), Vec2::new(pill_width(index), 8.));
                        x += pill.width() + gap;
                        (Rect::from_center_size(pill.center(), Vec2::new(pill.width() + gap, 44.)), pill)
                    })
                    .collect()
            } else {
                let (rect, _) = ui.allocate_exact_size(Vec2::new(width, dots_height), egui::Sense::hover());
                let total = count as f32 * 44.;
                (0..count)
                    .map(|index| {
                        let hit = Rect::from_center_size(
                            Pos2::new(rect.center().x - total / 2. + index as f32 * 44. + 22., rect.center().y),
                            Vec2::new(44., dots_height),
                        );
                        (hit, Rect::from_center_size(hit.center(), Vec2::new(pill_width(index), 8.)))
                    })
                    .collect()
            };
            let overlay_color = node.props["indicatorColor"]
                .as_str()
                .and_then(theme::parse_color)
                .unwrap_or_else(|| self.palette.get("foreground"));
            let shadow = node.props["indicatorShadowColor"].as_str().and_then(theme::parse_color);
            for (index, (hit, pill)) in dots.into_iter().enumerate() {
                let response = ui.interact(hit, egui::Id::unique((&node.id, "page", index)), egui::Sense::click());
                let active = state.index == Some(index);
                if let Some(color) = shadow.filter(|_| overlay) {
                    let shadow = egui::epaint::Shadow {
                        offset: [1, 1],
                        blur: 6,
                        spread: 0,
                        color,
                    };
                    ui.painter().add(shadow.as_shape(pill, 4));
                }
                ui.painter().rect_filled(
                    pill,
                    4.,
                    if overlay {
                        overlay_color
                    } else {
                        self.palette
                            .get(if active { "accent" } else { "muted" })
                            .gamma_multiply(if active { 1. } else { 0.4 })
                    },
                );
                let button = Node {
                    id: format!("{}:page:{index}", node.id),
                    kind: "NButton".into(),
                    props: json!({"accessibilityLabel":format!("Slide {} of {}",index+1,count)}),
                    children: vec![],
                };
                self.semantic(&button, &response, Value::Null);
                if response.clicked() {
                    state.slide(index, now);
                    self.values.insert(node.id.clone(), json!(index));
                    self.change(&node.id, json!(index));
                }
            }
        }
        let response = ui.interact(
            output.inner_rect,
            egui::Id::unique((&node.id, "pages")),
            egui::Sense::focusable_noninteractive(),
        );
        let mut accessible = node.clone();
        accessible.children.clear();
        accessible.props["min"] = json!(0);
        accessible.props["max"] = json!(count - 1);
        accessible.props["step"] = json!(1);
        self.semantic(&accessible, &response, json!(state.index.unwrap_or(0)));
        if response.has_focus() && ui.is_enabled() {
            let current = state.index.unwrap_or(0);
            let next = ui.input(|input| {
                if input.key_pressed(Key::Home) {
                    Some(0)
                } else if input.key_pressed(Key::End) {
                    Some(count - 1)
                } else if input.key_pressed(Key::ArrowRight) || input.key_pressed(if vertical { Key::ArrowDown } else { Key::ArrowUp }) {
                    Some((current + 1).min(count - 1))
                } else if input.key_pressed(Key::ArrowLeft) || input.key_pressed(if vertical { Key::ArrowUp } else { Key::ArrowDown }) {
                    Some(current.saturating_sub(1))
                } else {
                    None
                }
            });
            if let Some(next) = next.filter(|next| *next != current) {
                state.slide(next, now);
                self.values.insert(node.id.clone(), json!(next));
                self.change(&node.id, json!(next));
            }
        }
        self.carousels.insert(node.id.clone(), state);
    }
}
