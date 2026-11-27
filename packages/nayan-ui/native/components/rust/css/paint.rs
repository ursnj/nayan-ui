use super::*;

impl Document {
    fn selectable_text(&self, index: usize) -> bool {
        let item = &self.boxes[index];
        if !item.rect.is_positive()
            || item.inline
            || item.paint.hidden
            || item.children.iter().any(|i| !self.boxes[*i].inline)
            || !(matches!(item.node.kind.as_str(), "NText" | "NLink" | "NButton") || (item.node.kind == "NView" && !text(&item.node).is_empty()))
        {
            return false;
        }
        let mut ancestor = Some(index);
        while let Some(index) = ancestor {
            let item = &self.boxes[index];
            if item.node.props["selectable"] == false
                || item.node.props["aria-hidden"] == true
                || item.paint.hidden
                || item.paint.opacity == 0.
                || item
                    .css
                    .get("user-select")
                    .or_else(|| item.css.get("-webkit-user-select"))
                    .is_some_and(|v| v == "none")
                || item.css.get("clip").is_some_and(|v| v.replace(' ', "") == "rect(0,0,0,0)")
                || matches!(
                    item.node.kind.as_str(),
                    "NButton" | "NPress" | "NCheck" | "NSwitch" | "NSelect" | "NDatePicker" | "NMenuItem" | "NActionItem"
                )
                || item.node.props["aria-hidden"] == "true"
                || matches!(item.tag.as_str(), "script" | "style" | "noscript" | "head" | "meta" | "title")
            {
                return false;
            }
            ancestor = item.parent;
        }
        true
    }

    fn selection_blocks(&self, scale: f32) -> Vec<super::super::text_selection::Block> {
        self.boxes
            .iter()
            .enumerate()
            .filter(|(i, _)| self.selectable_text(*i))
            .map(|(key, item)| {
                let text = self.text_job(key, item.content.width(), scale).text;
                super::super::text_selection::Block {
                    key,
                    id: item.node.id.clone(),
                    len: text.chars().count(),
                    text,
                }
            })
            .collect()
    }
    fn styled(&self, index: usize) -> Node {
        let item = &self.boxes[index];
        let mut node = Node {
            id: item.node.id.clone(),
            kind: item.node.kind.clone(),
            props: item.node.props.clone(),
            children: Vec::new(),
        };
        let p = &item.paint;
        let mut style = json!({"fontSize":p.text_size.unwrap_or(16.),"fontWeight":p.weight.unwrap_or(400),"lineHeight":p.line_height.map(|l|l.points(p.text_size.unwrap_or(16.))).unwrap_or(p.text_size.unwrap_or(16.)*1.5)});
        if let Some(color) = p.foreground {
            style["color"] = json!(values::hex(color));
        }
        node.props["className"] = json!("");
        node.props["style"] = style;
        if let Some(fit) = item.css.get("object-fit") {
            node.props["contentFit"] = json!(fit);
        }
        if let Some(lines) = item.css.get("-webkit-line-clamp").and_then(|v| v.parse::<u64>().ok()) {
            node.props["numberOfLines"] = json!(lines);
        }
        if item.children.iter().any(|i| !self.boxes[*i].inline) {
            // Containers paint their children separately. Retain their accessible label without
            // cloning a whole page subtree again for every ancestor on every frame.
            if node.props["text"].is_null() && node.props["label"].is_null() {
                node.props["text"] = json!(text(&item.node));
            }
        } else {
            node.children = item.children.iter().map(|i| self.styled(*i)).collect();
        }
        node
    }

    pub(super) fn cache_paint_nodes(&mut self) {
        for i in 0..self.boxes.len() {
            self.boxes[i].styled = Some(self.styled(i));
        }
    }

    fn paint_node(
        &self,
        doc: &mut ComponentDocument,
        ui: &mut egui::Ui,
        index: usize,
        origin: Pos2,
        clip: Rect,
        fixed: bool,
        deferred: &mut Vec<usize>,
        visible: &mut HashSet<String>,
        mut motion_opacity: f32,
    ) {
        let item = &self.boxes[index];
        if item.inline || item.paint.hidden {
            return;
        }
        let selection_start = doc.selection.run_count();
        if item.fixed && !fixed {
            // A negative stacking layer belongs behind the root's content, above its background.
            if item.css.get("z-index").and_then(|v| v.parse::<i32>().ok()).is_some_and(|z| z < 0) {
                self.paint_node(doc, ui, index, Pos2::ZERO, clip, true, deferred, visible, motion_opacity);
                return;
            }
            deferred.push(index);
            return;
        }
        let mut origin = origin;
        if item.css.get("position").is_some_and(|v| v == "sticky") {
            let rect = item.rect.translate(origin.to_vec2());
            let top = item
                .css
                .get("top")
                .and_then(|v| number(v, self.viewport.y, self.viewport, 16.))
                .unwrap_or(0.);
            let bottom = item
                .parent
                .map(|p| self.boxes[p].rect.bottom() + origin.y)
                .unwrap_or(self.height + origin.y);
            origin.y += rect.top().max(top).min((bottom - rect.height()).max(rect.top())) - rect.top();
        }
        let rect = item.rect.translate(origin.to_vec2());
        let angle = transform::rotation(item.css.get("transform").map(String::as_str).unwrap_or(""));
        let context = ui.ctx().clone();
        let layer = ui.painter().layer_id();
        let shape_start = context.graphics_mut(|graphics| graphics.entry(layer).next_idx());
        if !rect.is_positive() || !rect.intersects(clip) {
            doc.forget_list_bounds(std::slice::from_ref(&item.node));
            return;
        }
        if let Some(entrance) = item.entrance {
            let now = doc.elapsed;
            let has_visible_area = rect.intersect(clip).is_positive();
            let started = doc.entrance_started.get_mut(&item.node.id).map(|playback| {
                if has_visible_area {
                    playback.last_visible = now;
                }
                playback.replay = entrance.replay;
                playback.started
            });
            if doc.reduced_motion || doc.settle_visible_entrances {
                // A view already shown at rest stays settled until it leaves the viewport.
                if has_visible_area && started != Some(f64::NEG_INFINITY) {
                    doc.entrance_started.insert(
                        item.node.id.clone(),
                        EntrancePlayback {
                            started: f64::NEG_INFINITY,
                            last_visible: now,
                            replay: entrance.replay,
                        },
                    );
                }
            } else if let Some((opacity, offset)) = entrance.sample(now - started.unwrap_or(now)) {
                let can_play = started.is_some() || (!doc.entrances_paused && entrance::Entrance::visible_enough(rect, clip));
                if can_play && started.is_none() {
                    doc.entrance_started.insert(
                        item.node.id.clone(),
                        EntrancePlayback {
                            started: now,
                            last_visible: now,
                            replay: entrance.replay,
                        },
                    );
                }
                origin.y += offset;
                motion_opacity *= opacity;
                if can_play {
                    ui.ctx().request_repaint();
                }
            }
        }
        let rect = item.rect.translate(origin.to_vec2());
        let mut paint = item.paint.clone();
        paint.opacity *= motion_opacity;
        paint.width = Some(rect.width());
        paint.height = Some(rect.height());
        let corners = paint.corner_radius();
        let mut painter = ui.painter().with_clip_rect(clip);
        painter.set_opacity(paint.opacity);
        if paint.backdrop_blur > 0. {
            painter.add(egui::Shape::Callback(egui::epaint::PaintCallback {
                rect,
                callback: std::sync::Arc::new(Backdrop {
                    blur: paint.backdrop_blur,
                    corners,
                }),
            }));
        }
        if let Some((shadow, spread)) = paint.shadow {
            let shape = shadow.as_shape(rect.expand(spread), corners);
            for outside in super::super::outer_shadow_clips(rect, clip) {
                if outside.is_positive() {
                    painter.with_clip_rect(outside).add(shape.clone());
                }
            }
        }
        painter.rect(
            rect,
            corners,
            paint.background.unwrap_or(Color32::TRANSPARENT),
            egui::Stroke::new(paint.border_width, paint.border.unwrap_or(Color32::TRANSPARENT)),
            egui::StrokeKind::Inside,
        );
        // Only distinct edge colors need another pass. Repainting the same translucent stroke
        // through square edge clips darkens the straight edges but leaves rounded corners lighter.
        for (side, edge) in [
            (
                "top",
                Rect::from_min_max(rect.min, Pos2::new(rect.right(), rect.top() + paint.border_width)),
            ),
            (
                "left",
                Rect::from_min_max(rect.min, Pos2::new(rect.left() + paint.border_width, rect.bottom())),
            ),
            (
                "bottom",
                Rect::from_min_max(Pos2::new(rect.left(), rect.bottom() - paint.border_width), rect.max),
            ),
            (
                "right",
                Rect::from_min_max(Pos2::new(rect.right() - paint.border_width, rect.top()), rect.max),
            ),
        ] {
            if paint.border_width > 0. {
                if let Some(color) = item
                    .css
                    .get(&format!("border-{side}-color"))
                    .and_then(|v| values::color(v))
                    .filter(|color| *color != paint.border.unwrap_or(Color32::TRANSPARENT))
                {
                    painter.with_clip_rect(edge.intersect(clip)).rect_stroke(
                        rect,
                        corners,
                        egui::Stroke::new(paint.border_width, color),
                        egui::StrokeKind::Inside,
                    );
                }
            }
        }
        doc.layout_rects.insert(item.node.id.clone(), rect);
        doc.layout_clips.insert(item.node.id.clone(), rect.intersect(clip));
        if item.node.props["observedVisible"] == true {
            visible.insert(item.node.id.clone());
        }
        let child_clip = if item.css.get("clip").is_some_and(|v| v.replace(' ', "") == "rect(0,0,0,0)") {
            Rect::NOTHING
        } else if item
            .css
            .get("overflow")
            .is_some_and(|v| matches!(v.as_str(), "hidden" | "clip" | "auto" | "scroll"))
        {
            clip.intersect(rect)
        } else {
            clip
        };
        let node = item.styled.as_ref().expect("CSS paint nodes are prepared with layout");
        let content = item.content.translate(origin.to_vec2());
        let container = item.children.iter().any(|i| !self.boxes[*i].inline);
        let details = item.parent.filter(|parent| item.tag == "summary" && self.boxes[*parent].tag == "details");
        let summary = details.is_some();
        let label_target = if item.tag == "label" {
            node.props["htmlFor"]
                .as_str()
                .and_then(|id| self.boxes.iter().position(|b| b.node.id == id))
                .or_else(|| {
                    self.boxes
                        .iter()
                        .enumerate()
                        .find(|(i, b)| self.ancestor(*i, index) && matches!(b.node.kind.as_str(), "NInput" | "NTextarea" | "NCheck" | "NSwitch"))
                        .map(|(i, _)| i)
                })
        } else {
            None
        };
        let interactive =
            summary || label_target.is_some() || matches!(node.kind.as_str(), "NButton" | "NPress" | "NLink" | "NActionItem" | "NMenuItem");
        let text_leaf =
            !container && (matches!(node.kind.as_str(), "NText" | "NLink" | "NButton") || (node.kind == "NView" && !text(&node).is_empty()));
        if text_leaf {
            let (job, targets) = self.text_layout(index, content.width(), doc.font_scale.max(1.));
            let galley = ui.fonts_mut(|fonts| fonts.layout_job(job));
            let x = match item.css.get("text-align").map(String::as_str) {
                Some("center") => content.center().x - galley.size().x * 0.5,
                Some("right") | Some("end") => content.right() - galley.size().x,
                _ => content.left(),
            };
            let y = if node.kind == "NButton" {
                content.center().y - galley.size().y * 0.5
            } else {
                content.top()
            };
            let origin = Pos2::new(x, y);
            if self.selectable_text(index) {
                doc.selection.paint(
                    &painter.with_clip_rect(child_clip),
                    index,
                    &galley,
                    origin,
                    doc.palette.get("accent").gamma_multiply(0.3),
                );
                let bounds = Rect::from_min_max(Pos2::new(content.left(), y), Pos2::new(content.right(), y + galley.size().y));
                doc.selection.register(index, galley.clone(), origin, child_clip, bounds);
                if !interactive
                    && ui
                        .input(|input| input.pointer.hover_pos())
                        .is_some_and(|p| doc.selection.hovered(index, p))
                {
                    ui.ctx().set_cursor_icon(egui::CursorIcon::Text);
                }
            }
            painter
                .with_clip_rect(child_clip)
                .galley(Pos2::new(x, y), galley.clone(), paint.foreground.unwrap_or(doc.palette.get("foreground")));
            if !interactive {
                let response = ui.interact(rect.intersect(clip), egui::Id::unique(&node.id), egui::Sense::hover());
                doc.semantic(ui, node, &response, Value::Null);
            }
            if !interactive {
                doc.inline_links(ui, &galley, origin, targets, child_clip);
            }
        } else if node.kind == "NConfetti" {
            doc.paint_confetti(&painter.with_clip_rect(child_clip.intersect(content)), node, content);
        } else if node.kind == "NPattern" {
            doc.paint_pattern(&painter.with_clip_rect(child_clip.intersect(content)), node, content);
        } else if node.kind == "NIcon" {
            let size = content.width().min(content.height()).clamp(1., 512.);
            let icon_rect = Rect::from_center_size(content.center(), Vec2::splat(size));
            let color = paint.foreground.unwrap_or(doc.palette.get("foreground"));
            let painter = painter.with_clip_rect(child_clip);
            if node.props["paths"].is_null() && node.props["name"].as_str().is_some_and(|name| !name.is_ascii()) {
                let galley =
                    ui.fonts_mut(|fonts| fonts.layout_no_wrap(string(&node.props["name"]), egui::FontId::new(size, paint.font_family()), color));
                painter.galley(icon_rect.center() - galley.size() * 0.5, galley, color);
            } else if let Some(texture) = doc.icon(ui, node, size) {
                painter.image(texture, icon_rect, Rect::from_min_max(Pos2::ZERO, Pos2::new(1., 1.)), color);
            }
            if node.props["accessibilityLabel"].is_string() || node.props["aria-label"].is_string() {
                let response = ui.interact(icon_rect, egui::Id::unique(&node.id), egui::Sense::hover());
                doc.semantic(ui, node, &response, Value::Null);
            }
        } else if matches!(node.kind.as_str(), "NInput" | "NTextarea" | "NSearchField") {
            let mut child = ui.new_child(egui::UiBuilder::new().max_rect(content));
            child.set_clip_rect(child_clip);
            let response = self.input(doc, &mut child, index, content);
            doc.focus_outline(&painter, &response, rect, corners, egui::StrokeKind::Inside);
        } else if node.kind == "NSelect" {
            let disabled = flag(&node.props, &["disabled", "isDisabled", "isLoading", "readOnly", "isReadOnly"]);
            let outer = ui.interact(
                rect.intersect(child_clip),
                egui::Id::unique((&node.id, "field")),
                if disabled { egui::Sense::hover() } else { egui::Sense::click() },
            );
            if outer.contains_pointer() {
                ui.ctx().set_cursor_icon(if disabled {
                    egui::CursorIcon::NotAllowed
                } else {
                    egui::CursorIcon::PointingHand
                });
            }
            let mut child = ui.new_child(egui::UiBuilder::new().max_rect(rect).layout(egui::Layout::top_down(egui::Align::Min)));
            child.set_clip_rect(child_clip);
            paint.width = Some(rect.width());
            paint.height = Some(rect.height());
            paint.apply(&mut child, doc.font_scale.max(1.));
            child.spacing_mut().button_padding = Vec2::new(
                ((content.left() - rect.left()) + (rect.right() - content.right())) * 0.5,
                ((content.top() - rect.top()) + (rect.bottom() - content.bottom())) * 0.5,
            );
            let palette = doc.palette.clone();
            for name in [
                "foreground",
                "surface",
                "surface-foreground",
                "surface-secondary",
                "surface-tertiary",
                "muted",
                "accent",
                "accent-foreground",
                "border",
                "field-background",
                "field-foreground",
                "field-placeholder",
                "field-border",
                "focus",
            ] {
                if let Some(color) = item
                    .variables
                    .get(&format!("--{name}"))
                    .and_then(|value| values::color(&vars(value, &item.variables)))
                {
                    // Floating menus need a solid surface so page text cannot bleed through.
                    // The field itself retains its stylesheet transparency.
                    doc.palette.inherit_color(name, if name == "surface" { color.to_opaque() } else { color });
                }
            }
            let response = doc.select(&mut child, node, &paint, true);
            doc.focus_outline(&painter, &response, rect, corners, egui::StrokeKind::Outside);
            doc.palette = palette;
            if let Some(root) = doc.semantics.iter_mut().find(|entry| entry.id == node.id) {
                let hit = rect.intersect(child_clip);
                root.rect = [hit.min.x, hit.min.y, hit.width(), hit.height()];
                doc.layout_rects.insert(node.id.clone(), rect);
                if outer.clicked() {
                    egui::Popup::toggle_id(ui.ctx(), root.focus_id.with("popup"));
                    ui.memory_mut(|memory| memory.request_focus(root.focus_id));
                }
            }
        } else if !container && !matches!(node.kind.as_str(), "NView" | "NTheme" | "NCard") {
            let mut child = ui.new_child(egui::UiBuilder::new().max_rect(content).layout(egui::Layout::top_down(egui::Align::Min)));
            child.set_clip_rect(child_clip);
            paint.width = Some(content.width());
            paint.height = Some(content.height());
            paint.apply(&mut child, doc.font_scale.max(1.));
            doc.node(&mut child, node, &paint);
        }
        if container {
            let mut children = item.children.clone();
            children.sort_by_key(|i| self.boxes[*i].css.get("z-index").and_then(|v| v.parse::<i32>().ok()).unwrap_or(0));
            let scrolls = |axis: &str| {
                item.css
                    .get(axis)
                    .or_else(|| item.css.get("overflow"))
                    .is_some_and(|v| matches!(v.as_str(), "auto" | "scroll"))
            };
            let horizontal = scrolls("overflow-x");
            let vertical = scrolls("overflow-y");
            if horizontal || vertical {
                let mut scrolling_ui = ui.new_child(egui::UiBuilder::new().max_rect(content));
                scrolling_ui.set_clip_rect(child_clip.intersect(content));
                let bounds = children
                    .iter()
                    .filter(|i| !self.boxes[**i].inline && !self.boxes[**i].paint.hidden && !self.boxes[**i].fixed)
                    .fold(Rect::NOTHING, |r, i| r.union(self.boxes[*i].rect.translate(origin.to_vec2())));
                let extent = Vec2::new(
                    (bounds.right() - content.left()).max(content.width()),
                    (bounds.bottom() - content.top()).max(content.height()),
                );
                let area = egui::ScrollArea::new([horizontal, vertical])
                    .id_salt((&node.id, "css-scroll"))
                    .auto_shrink([false, false]);
                let area = if item.css.get("scrollbar-width").is_some_and(|v| v == "none") {
                    area.scroll_bar_visibility(egui::scroll_area::ScrollBarVisibility::AlwaysHidden)
                } else {
                    area
                };
                let output = area.show_viewport(&mut scrolling_ui, |scrolling_ui, _| {
                    scrolling_ui.set_min_size(extent);
                    let shifted = origin + (scrolling_ui.max_rect().min - content.min);
                    for child in &children {
                        self.paint_node(
                            doc,
                            scrolling_ui,
                            *child,
                            shifted,
                            scrolling_ui.clip_rect(),
                            fixed,
                            deferred,
                            visible,
                            motion_opacity,
                        );
                    }
                });
                if (horizontal && extent.x > content.width()) || (vertical && extent.y > content.height()) {
                    doc.register_scroll_target(ui, output.id, content, horizontal);
                }
            } else {
                for child in children {
                    self.paint_node(doc, ui, child, origin, child_clip, fixed, deferred, visible, motion_opacity);
                }
            }
        }
        if interactive {
            let response = ui.interact(
                super::super::press::hit_rect(node, transform::rotate_rect(rect, rect.center(), angle)).intersect(clip),
                egui::Id::unique(&node.id),
                egui::Sense::click(),
            );
            if !flag(&node.props, &["disabled", "isDisabled"]) {
                doc.focus_outline(&painter, &response, rect, corners, egui::StrokeKind::Outside);
            }
            if response.contains_pointer() {
                let disabled = flag(&node.props, &["disabled", "isDisabled"])
                    || label_target.is_some_and(|i| flag(&self.boxes[i].node.props, &["disabled", "isDisabled"]));
                ui.ctx().set_cursor_icon(if disabled {
                    egui::CursorIcon::NotAllowed
                } else {
                    egui::CursorIcon::PointingHand
                });
            }
            let clicked = if node.kind == "NPress" {
                doc.press_interaction(node, &response)
            } else {
                response.clicked() && !flag(&node.props, &["disabled", "isDisabled"])
            };
            if clicked {
                if let Some(parent) = details {
                    let details = &self.boxes[parent].node;
                    let expanded = !Self::expanded(doc, details);
                    doc.values.insert(details.id.clone(), json!(expanded));
                    doc.change(&details.id, json!(expanded));
                } else if let Some(target) = label_target {
                    let target = &self.boxes[target].node;
                    if matches!(target.kind.as_str(), "NCheck" | "NSwitch") {
                        let checked = doc.value(target, &["checked", "isSelected"], json!(false)) != true;
                        doc.values.insert(target.id.clone(), json!(checked));
                        doc.change(&target.id, json!(checked));
                    } else {
                        doc.context.memory_mut(|m| m.request_focus(egui::Id::unique(&target.id)));
                    }
                } else if node.kind != "NPress" {
                    doc.click(&node.id);
                }
                if node.props["type"] == "submit" {
                    self.submit(doc, &node.id);
                }
            }
            if let Some(parent) = details {
                let mut details = self.boxes[parent].node.clone();
                let expanded = Self::expanded(doc, &details);
                details.kind = "NPress".into();
                details.props["label"] = json!(text(node));
                details.props["_expanded"] = json!(expanded);
                doc.record_semantic(&details, &response, json!(expanded));
            } else {
                doc.record_semantic(node, &response, Value::Null);
            }
        }
        if angle != 0. {
            doc.selection.rotate(selection_start, rect.center(), angle);
            context.graphics_mut(|graphics| {
                let list = graphics.entry(layer);
                let end = list.next_idx();
                for i in shape_start.0..end.0 {
                    list.mutate_shape(egui::layers::ShapeIdx(i), |clipped| {
                        transform::rotate_shape(&mut clipped.shape, rect.center(), angle);
                        clipped.clip_rect = transform::rotate_rect(clipped.clip_rect, rect.center(), angle).intersect(ui.clip_rect());
                    });
                }
            });
        }
    }

    pub fn render(&mut self, doc: &mut ComponentDocument, ui: &mut egui::Ui, tree: &[Node], viewport: Vec2) {
        if let Some(theme) = tree.iter().find(|node| node.kind == "NTheme") {
            doc.palette = theme::Palette::configure(&doc.palette, &theme.props, doc.dark);
        }
        let dark = tree
            .iter()
            .find(|n| n.kind == "NTheme")
            .map(|n| theme::Palette::configure(&doc.palette, &n.props, doc.dark).dark)
            .unwrap_or(doc.dark);
        let pointer = ui.input(|i| i.pointer.hover_pos());
        let hovered = pointer.and_then(|p| {
            self.boxes
                .iter()
                .enumerate()
                .rev()
                .find(|(_, n)| n.rect.contains(p + Vec2::new(0., if n.fixed { 0. } else { doc.root_scroll })))
                .map(|(i, _)| i)
        });
        if self.viewport != viewport || self.dark != dark {
            self.dirty = true;
        }
        self.viewport = viewport;
        self.dark = dark;
        self.hovered = hovered;
        let mut recomputed = false;
        if self.dirty {
            self.compute(doc, tree);
            self.dirty = false;
            recomputed = true;
        } else if self.refresh_state(doc) {
            self.compute(doc, tree);
            recomputed = true;
        }
        if recomputed {
            if !doc.entrance_started.is_empty() {
                let entrances: HashSet<_> = self
                    .boxes
                    .iter()
                    .filter(|item| item.entrance.is_some())
                    .map(|item| item.node.id.as_str())
                    .collect();
                doc.entrance_started.retain(|id, _| entrances.contains(id.as_str()));
            }
            doc.selection.set_blocks(self.selection_blocks(doc.font_scale.max(1.)));
        }
        if let Some(color) = self.boxes.first().and_then(|n| n.paint.background) {
            doc.background = color;
        }
        let revision = doc.revision;
        let mut visible = HashSet::new();
        let mut deferred = Vec::new();
        let selection_scroll = doc.selection.scroll_delta(viewport.y);
        if selection_scroll != 0. {
            self.scroll_offset = Some(doc.root_scroll + selection_scroll);
        }
        let offset = self.scroll_offset.take().or_else(|| {
            self.scroll_to.take().and_then(|id| {
                self.boxes.iter().find(|b| b.node.id == id).map(|b| {
                    (b.rect.top()
                        - self
                            .boxes
                            .first()
                            .and_then(|root| root.variables.get("--site-header-height"))
                            .and_then(|v| number(v, self.viewport.y, self.viewport, 16.))
                            .unwrap_or(0.)
                        - 20.)
                        .max(0.)
                })
            })
        });
        let area = egui::ScrollArea::vertical()
            .id_salt("engine-css-root")
            .scroll_bar_visibility(super::super::root_scrollbar(tree))
            .auto_shrink([false, false]);
        let area = if let Some(offset) = offset {
            area.vertical_scroll_offset(offset.max(0.))
        } else {
            area
        };
        let output = area.show_viewport(ui, |ui, viewport| {
            doc.root_scroll = viewport.min.y;
            ui.set_min_size(Vec2::new(self.viewport.x, self.height));
            let origin = ui.max_rect().min;
            for (i, item) in self.boxes.iter().enumerate() {
                if item.parent.is_none() {
                    self.paint_node(doc, ui, i, origin, ui.clip_rect(), false, &mut deferred, &mut visible, 1.);
                }
            }
        });
        deferred.sort_by_key(|i| self.boxes[*i].css.get("z-index").and_then(|v| v.parse::<i32>().ok()).unwrap_or(0));
        for index in deferred.clone() {
            self.paint_node(doc, ui, index, Pos2::ZERO, ui.clip_rect(), true, &mut Vec::new(), &mut visible, 1.);
        }
        // An offscreen ancestor can skip an entire subtree, so clear after traversal.
        doc.entrance_started
            .retain(|_, playback| !playback.replay || playback.last_visible == doc.elapsed);
        if output.content_size.y > output.inner_rect.height() {
            doc.register_scroll_target(ui, output.id, output.inner_rect, false);
        }
        if revision != doc.revision {
            self.dirty = true;
        }
        doc.content_size = self
            .boxes
            .iter()
            .filter(|b| b.parent.is_none())
            .map(|b| [b.rect.width(), b.rect.height()])
            .next()
            .unwrap_or([self.viewport.x, self.height]);
        for id in visible.difference(&self.visible) {
            doc.revision += 1;
            doc.events.push(json!({"id":id,"type":"visible","value":true,"sequence":doc.revision}));
        }
        for id in self.visible.difference(&visible) {
            doc.revision += 1;
            doc.events.push(json!({"id":id,"type":"visible","value":false,"sequence":doc.revision}));
        }
        self.visible = visible;
    }
}

impl Document {
    pub(in crate::components) fn submit(&self, doc: &mut ComponentDocument, id: &str) {
        let Some(mut index) = self.boxes.iter().position(|n| n.node.id == id) else {
            return;
        };
        while self.boxes[index].tag != "form" {
            let Some(parent) = self.boxes[index].parent else {
                return;
            };
            index = parent;
        }
        let mut fields = BTreeMap::new();
        for (i, item) in self.boxes.iter().enumerate() {
            if !self.ancestor(i, index)
                || !matches!(
                    item.node.kind.as_str(),
                    "NInput" | "NTextarea" | "NSelect" | "NCheck" | "NSwitch" | "NNumberField" | "NRadio"
                )
                || flag(&item.node.props, &["disabled", "isDisabled"])
            {
                continue;
            }
            if let Some(name) = item.node.props["name"].as_str() {
                let value = doc.value(&item.node, &["value"], item.node.props["defaultValue"].clone());
                fields.insert(name.to_string(), string(&value));
            }
        }
        doc.revision += 1;
        doc.events
            .push(json!({"id":self.boxes[index].node.id,"type":"submit","value":fields,"sequence":doc.revision}));
    }
}
