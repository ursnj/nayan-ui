//! Select values, filtering, popup lifetime and keyboard navigation stay in Rust.
use super::*;

fn key(value: &Value) -> &Value {
    value.get("value").unwrap_or(value)
}
fn option(value: &Value) -> Value {
    if value.is_object() {
        value.clone()
    } else {
        json!({"label":string(value),"value":value})
    }
}
fn label(value: &Value) -> String {
    value["label"].as_str().map(str::to_owned).unwrap_or_else(|| string(key(value)))
}

impl ComponentDocument {
    pub(super) fn select_key_target(&self, id: Option<&str>, key: Key) -> Option<String> {
        if !matches!(
            key,
            Key::ArrowDown | Key::ArrowUp | Key::Home | Key::End | Key::Enter | Key::Space | Key::Escape
        ) {
            return None;
        }
        let focused = self.context.memory(|memory| memory.focused());
        let node = if let Some(id) = id {
            self.semantics.iter().find(|node| node.id == id)
        } else {
            self.semantics.iter().find(|node| Some(node.focus_id) == focused)
        };
        if let Some(node) = node {
            if matches!(node.kind.as_str(), "NInput" | "NTextarea") && matches!(key, Key::Space | Key::Home | Key::End) {
                return None;
            }
            let owner = if node.kind == "NSelect" && node.select_owner.is_none() {
                Some(node.id.as_str())
            } else {
                node.select_owner.as_deref()
            };
            if let Some(owner) = owner {
                return self
                    .semantics
                    .iter()
                    .find(|root| root.id == owner && root.kind == "NSelect" && !root.disabled && !root.read_only)
                    .map(|root| root.id.clone());
            }
            if id.is_some() {
                return None;
            }
        }
        if id.is_some() {
            return None;
        }
        self.semantics
            .iter()
            .find(|root| {
                root.kind == "NSelect"
                    && root.select_owner.is_none()
                    && !root.disabled
                    && !root.read_only
                    && egui::Popup::is_id_open(&self.context, root.focus_id.with("popup"))
            })
            .map(|root| root.id.clone())
    }

    pub(super) fn close_selects_on_focus(&self, id: &str) {
        for root in &self.semantics {
            if root.kind == "NSelect" && root.select_owner.is_none() && id != root.id && !id.starts_with(&format!("{}:", root.id)) {
                egui::Popup::close_id(&self.context, root.focus_id.with("popup"));
            }
        }
    }

    pub(super) fn select(&mut self, ui: &mut egui::Ui, n: &Node, resolved: &style::Style, framed: bool) -> Response {
        let disabled = flag(&n.props, &["disabled", "isDisabled", "isLoading", "readOnly", "isReadOnly"]);
        ui.add_enabled_ui(!disabled, |ui| {
            let radius = resolved.corner_radius();
            let border = self.palette.get("field-border");
            let visuals = ui.visuals_mut();
            visuals.window_fill = self.palette.get("surface");
            visuals.window_stroke = egui::Stroke::new(1., border);
            visuals.menu_corner_radius = radius;
            for widget in [
                &mut visuals.widgets.inactive,
                &mut visuals.widgets.hovered,
                &mut visuals.widgets.active,
                &mut visuals.widgets.open,
            ] {
                widget.corner_radius = radius;
                if framed {
                    widget.bg_fill = Color32::TRANSPARENT;
                    widget.weak_bg_fill = Color32::TRANSPARENT;
                    widget.bg_stroke = egui::Stroke::NONE;
                }
            }
            if framed {
                ui.spacing_mut().interact_size.y = ui.available_height().max(1.);
            }
            self.select_enabled(ui, n, framed)
        })
        .inner
    }

    fn select_enabled(&mut self, ui: &mut egui::Ui, n: &Node, framed: bool) -> Response {
        let p = &n.props;
        let items: Vec<_> = p["options"]
            .as_array()
            .or_else(|| p["items"].as_array())
            .into_iter()
            .flatten()
            .map(option)
            .collect();
        let multi = flag(p, &["isMulti", "multiple"]);
        let value = self.value(n, &["value", "selected"], if multi { json!([]) } else { Value::Null });
        let values: Vec<_> = if multi {
            value.as_array().cloned().unwrap_or_default()
        } else if value.is_null() || (value == "" && !items.iter().any(|item| key(item) == "")) {
            vec![]
        } else {
            vec![value.clone()]
        };
        let selected: Vec<_> = values
            .iter()
            .map(|value| {
                if value["label"].is_string() {
                    return option(value);
                }
                items
                    .iter()
                    .find(|item| key(item) == key(value))
                    .cloned()
                    .unwrap_or_else(|| option(value))
            })
            .collect();
        let shown = if selected.is_empty() {
            p["placeholder"].as_str().unwrap_or("Select...").into()
        } else {
            selected.iter().map(label).collect::<Vec<_>>().join(", ")
        };
        if let Some(label) = p["label"].as_str().filter(|s| !s.is_empty()) {
            ui.label(label);
        }
        let semantic_start = self.semantics.len();
        let query_id = format!("{}:search", n.id);
        let cursor_id = format!("{}:cursor", n.id);
        // The horizontal row scopes widget IDs; use the same scope for lookup and drawing.
        let mut changed = None;
        let keys = self.select_keys.remove(&n.id).unwrap_or_default();
        let response = ui.horizontal(|ui| {
            let combo_id = ui.make_persistent_id(egui::IdSalt::new(&n.id));
            let popup_id = combo_id.with("popup");
            let mut open = egui::Popup::is_id_open(ui.ctx(), popup_id);
            let focused = !keys.is_empty()
                || ui.memory(|m| {
                    m.has_focus(combo_id)
                        || m.has_focus(egui::Id::unique(&query_id))
                        || self
                            .previous_semantics
                            .iter()
                            .any(|node| node.select_owner.as_deref() == Some(&n.id) && m.has_focus(node.focus_id))
                });
            if !open && focused && ui.input_mut(|i| i.consume_key(Modifiers::NONE, Key::ArrowDown)) {
                egui::Popup::open_id(ui.ctx(), popup_id);
                open = true;
            }
            let mut query = self.values.get(&query_id).and_then(Value::as_str).unwrap_or("").to_string();
            let filter_id = format!("{}:filter", n.id);
            let mut navigated = self.values.get(&filter_id).and_then(Value::as_str) != Some(query.as_str());
            self.values.insert(filter_id.clone(), json!(query));
            let filtered: Vec<_> = items
                .iter()
                .enumerate()
                .filter(|(_, item)| label(item).to_lowercase().contains(&query.to_lowercase()))
                .collect();
            let enabled: Vec<_> = filtered
                .iter()
                .filter(|(_, item)| !flag(item, &["disabled", "isDisabled"]))
                .map(|(index, _)| *index)
                .collect();
            let mut active = self
                .values
                .get(&cursor_id)
                .and_then(Value::as_u64)
                .map(|v| v as usize)
                .filter(|v| enabled.contains(v))
                .or_else(|| enabled.first().copied());
            let mut choose = false;
            for key in &keys {
                if *key == Key::Escape {
                    egui::Popup::close_id(ui.ctx(), popup_id);
                    ui.memory_mut(|memory| memory.request_focus(combo_id));
                    open = false;
                    continue;
                }
                if !open {
                    egui::Popup::open_id(ui.ctx(), popup_id);
                    open = true;
                    if matches!(key, Key::ArrowUp | Key::End) {
                        active = enabled.last().copied();
                    }
                    continue;
                }
                match key {
                    Key::ArrowDown | Key::ArrowUp if !enabled.is_empty() => {
                        let at = active.and_then(|id| enabled.iter().position(|value| *value == id)).unwrap_or(0);
                        active = Some(
                            enabled[if *key == Key::ArrowDown {
                                (at + 1) % enabled.len()
                            } else {
                                (at + enabled.len() - 1) % enabled.len()
                            }],
                        );
                        navigated = true;
                    }
                    Key::Home => {
                        active = enabled.first().copied();
                        navigated = true;
                    }
                    Key::End => {
                        active = enabled.last().copied();
                        navigated = true;
                    }
                    Key::Enter | Key::Space => choose = true,
                    _ => {}
                }
            }
            if open && focused {
                for (key, forward) in [(Key::ArrowDown, true), (Key::ArrowUp, false)] {
                    if ui.input_mut(|i| i.consume_key(Modifiers::NONE, key)) && !enabled.is_empty() {
                        navigated = true;
                        let at = active.and_then(|id| enabled.iter().position(|v| *v == id)).unwrap_or(0);
                        active = Some(
                            enabled[if forward {
                                (at + 1) % enabled.len()
                            } else {
                                (at + enabled.len() - 1) % enabled.len()
                            }],
                        );
                    }
                }
                choose |= ui.input_mut(|i| i.consume_key(Modifiers::NONE, Key::Enter))
                    || (!ui.memory(|m| m.has_focus(egui::Id::unique(&query_id))) && ui.input_mut(|i| i.consume_key(Modifiers::NONE, Key::Space)));
            }
            if let Some(index) = active {
                self.values.insert(cursor_id.clone(), json!(index));
            }
            let clearable = p["isClearable"] == true && !selected.is_empty();
            let width = ui.available_width().min((ui.ctx().viewport_rect().width() - 24.).max(1.));
            ui.spacing_mut().icon_width = 16.;
            let clear_response = std::rc::Rc::new(std::cell::RefCell::new(None));
            let clear_slot = clear_response.clone();
            let clear_id = format!("{}:clear", n.id);
            let icon_color = self.palette.get("muted");
            let mut popup_visuals = self.palette.visuals();
            popup_visuals.menu_corner_radius = ui.visuals().menu_corner_radius;
            popup_visuals.window_stroke = egui::Stroke::new(1., self.palette.get("field-border"));
            let popup_font = ui.style().override_font_id.clone();
            let popup_style = egui::style::StyleModifier::from(move |style: &mut egui::Style| {
                style.visuals = popup_visuals.clone();
                style.override_font_id = popup_font.clone();
            });
            let caption = egui::RichText::new(&shown).color(if selected.is_empty() {
                self.palette.get("field-placeholder")
            } else {
                ui.visuals().text_color()
            });
            let mut caption = (*egui::WidgetText::from(caption).into_layout_job(ui.style(), egui::FontSelection::Default, egui::Align::Min)).clone();
            caption.wrap.max_width =
                (width - ui.spacing().button_padding.x * 2. - 16. - ui.spacing().item_spacing.x - if clearable { 32. } else { 0. }).max(1.);
            caption.wrap.max_rows = 1;
            let caption = ui.fonts_mut(|fonts| fonts.layout_job(caption));
            let combo = egui::ComboBox::from_id_salt(&n.id)
                .width(width.max(1.))
                .truncate()
                .icon(move |ui, rect, _, _| {
                    let center = Pos2::new(rect.right() - 8., rect.center().y);
                    ui.painter().line_segment(
                        [center + Vec2::new(-4., -2.), center + Vec2::new(0., 2.)],
                        egui::Stroke::new(1.5, icon_color),
                    );
                    ui.painter().line_segment(
                        [center + Vec2::new(0., 2.), center + Vec2::new(4., -2.)],
                        egui::Stroke::new(1.5, icon_color),
                    );
                    if clearable {
                        let center = Pos2::new(rect.left() - 20., rect.center().y);
                        let hit = Rect::from_center_size(center, Vec2::new(28., 28.));
                        let response = ui.interact(hit, egui::Id::unique(&clear_id), egui::Sense::click());
                        for direction in [-1., 1.] {
                            let delta = Vec2::new(3. * direction, 3.);
                            ui.painter()
                                .line_segment([center - delta, center + delta], egui::Stroke::new(1.5, icon_color));
                        }
                        *clear_slot.borrow_mut() = Some(response);
                    }
                })
                .selected_text(egui::WidgetText::Galley(caption))
                .close_behavior(egui::PopupCloseBehavior::CloseOnClickOutside)
                .popup_style(popup_style)
                .show_ui(ui, |ui| {
                    *ui.visuals_mut() = self.palette.visuals();
                    ui.visuals_mut().widgets.inactive.bg_fill = Color32::TRANSPARENT;
                    ui.visuals_mut().widgets.inactive.weak_bg_fill = Color32::TRANSPARENT;
                    let visuals = ui.visuals_mut();
                    for widget in [&mut visuals.widgets.inactive, &mut visuals.widgets.hovered, &mut visuals.widgets.active] {
                        widget.bg_stroke = egui::Stroke::NONE;
                    }
                    ui.spacing_mut().button_padding = Vec2::new(12., 8.);
                    ui.spacing_mut().interact_size.y = 40.;
                    ui.set_width(ui.available_width().min((ui.ctx().viewport_rect().width() - 24.).max(1.)));
                    if let Some(label) = p["selectLabel"].as_str().filter(|s| !s.is_empty()) {
                        ui.label(label);
                    }
                    if p["isSearchable"] != false {
                        let mut platform_query = String::new();
                        let buffer = if self.platform_inputs { &mut platform_query } else { &mut query };
                        let original_cursor = ui.visuals().text_cursor.stroke;
                        if self.platform_inputs { ui.visuals_mut().text_cursor.stroke = egui::Stroke::NONE; }
                        let response = ui.add(
                            egui::TextEdit::singleline(buffer)
                                .id(egui::Id::unique(&query_id))
                                .hint_text(if self.platform_inputs { "" } else { "Search..." })
                                .desired_width(ui.available_width())
                                .margin(egui::Margin::symmetric(12, 8)),
                        );
                        ui.visuals_mut().text_cursor.stroke = original_cursor;
                        self.values.insert(query_id.clone(), json!(query));
                        let search = Node {
                                id: query_id.clone(),
                                kind: "NInput".into(),
                                props: json!({"placeholder":"Search...","autoCapitalize":"none","autoCorrect":false,"accessibilityLabel":format!("Search {}", p["label"].as_str().unwrap_or("options")),"_selectOwner":n.id}),
                                children: vec![],
                            };
                        self.semantic(
                            ui,
                            &search,
                            &response,
                            json!(query),
                        );
                        let style = self.measure_style(&search, response.rect.width());
                        self.input_editor(&search, &style, style::Edges { left:12.,right:12.,top:8.,bottom:8. });
                    }
                    if filtered.is_empty() {
                        ui.label(p["noOptionsMessage"].as_str().unwrap_or("No options"));
                    }
                    for (index, item) in filtered {
                        let selected = selected.iter().any(|v| key(v) == key(item));
                        let mut button = egui::Button::new(egui::RichText::new(label(item)).color(if selected {
                            self.palette.get("accent-foreground")
                        } else {
                            self.palette.get("foreground")
                        }))
                        .wrap()
                        .min_size(Vec2::new(ui.available_width(), 40.))
                        .selected(selected);
                        if active == Some(index) && focused && !selected {
                            button = button.fill(self.palette.get("surface-secondary"));
                        }
                        let response = ui.add_enabled(!flag(item, &["disabled", "isDisabled"]), button);
                        if active == Some(index) && navigated {
                            response.scroll_to_me(None);
                        }
                        let entry = Node {
                            id: format!("{}:option:{index}", n.id),
                            kind: "NSelect".into(),
                            props: json!({"label":label(item),"_selectOwner":n.id,"_selected":selected,"_multiple":multi}),
                            children: vec![],
                        };
                        self.semantic(ui, &entry, &response, item.clone());
                        if response.clicked() || (choose && active == Some(index) && response.enabled()) {
                            self.values.insert(cursor_id.clone(), json!(index));
                            if multi {
                                let mut result = values.clone();
                                if selected {
                                    result.retain(|v| key(v) != key(item));
                                } else {
                                    result.push(item.clone());
                                }
                                changed = Some(Value::Array(
                                    result
                                        .iter()
                                        .map(|v| items.iter().find(|item| key(item) == key(v)).cloned().unwrap_or_else(|| option(v)))
                                        .collect(),
                                ));
                            } else {
                                changed = Some(item.clone());
                                ui.memory_mut(|m| m.request_focus(combo_id));
                                ui.close();
                            }
                        }
                    }
                    // Register ComboBox's own ScrollArea ahead of background page targets.
                    // Its parent stack gives the scope used to create the default area id.
                    let area = ui
                        .stack()
                        .iter()
                        .find(|stack| stack.kind() == Some(egui::UiKind::ScrollArea))
                        .and_then(|stack| stack.parent.as_ref())
                        .map(|parent| parent.scope_id.with(egui::IdSalt::new("scroll_area")));
                    let rect = ui.clip_rect().intersect(ui.max_rect());
                    if let Some(area) = area.filter(|_| rect.is_positive()) {
                        self.scroll_targets.insert(
                            0,
                            scroll::ScrollTarget {
                                rect,
                                drag_id: area.with("area"),
                                scroll_id: area,
                                horizontal: false,
                            },
                        );
                    }
                });
            let open = egui::Popup::is_id_open(ui.ctx(), popup_id);
            if !open {
                self.values.remove(&query_id);
                self.values.remove(&cursor_id);
                self.values.remove(&filter_id);
            }
            let mut root = n.clone();
            root.props["label"] = json!(format!("{}: {}", p["label"].as_str().unwrap_or("Select"), shown));
            root.props["_expanded"] = json!(open);
            root.props["_multiple"] = json!(multi);
            root.props["_valueLabel"] = json!(shown);
            root.props["_activeDescendant"] = if open {
                active.map(|index| json!(format!("{}:option:{index}", n.id))).unwrap_or(Value::Null)
            } else {
                Value::Null
            };
            if framed {
                self.record_semantic(&root, &combo.response, value.clone());
            } else {
                self.semantic(ui, &root, &combo.response, value.clone());
            }
            let clear_response = clear_response.borrow_mut().take();
            if let Some(response) = clear_response {
                self.semantic(
                    ui,
                    &Node {
                        id: format!("{}:clear", n.id),
                        kind: "NButton".into(),
                        props: json!({"accessibilityLabel":format!("Clear {}", p["label"].as_str().unwrap_or("selection"))}),
                        children: vec![],
                    },
                    &response,
                    Value::Null,
                );
                if response.clicked() {
                    changed = Some(if multi { json!([]) } else { Value::Null });
                }
            }
            combo.response
        }).inner;
        // Root first, options after: platform semantics and foreground hit testing agree.
        if let Some(at) = self.semantics[semantic_start..].iter().position(|node| node.id == n.id) {
            let root = self.semantics.remove(semantic_start + at);
            self.semantics.insert(semantic_start, root);
        }
        if let Some(value) = changed {
            self.values.insert(n.id.clone(), value.clone());
            self.change(&n.id, value);
        }
        response
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn frame(doc: &mut ComponentDocument) {
        for _ in 0..3 {
            doc.frame(320., 600., 1.).drop_without_applying_deltas();
        }
    }
    fn setup(props: Value, css: bool) -> ComponentDocument {
        let mut doc = ComponentDocument::default();
        if css {
            doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
        }
        let mut props = props;
        props["options"] =
            json!([{"label":"Apple","value":"a"},{"label":"Banana","value":"b"},{"label":"Unavailable","value":"c","isDisabled":true}]);
        doc.set_tree(&json!([{"id":"select","kind":"NSelect","props":props}])).unwrap();
        frame(&mut doc);
        doc
    }
    fn activate(doc: &mut ComponentDocument, id: &str) {
        doc.command(&json!({"action":"activate","id":id})).unwrap();
        frame(doc);
    }
    fn last(doc: &ComponentDocument) -> Value {
        doc.events.iter().rev().find(|e| e["type"] == "change" && e["id"] == "select").unwrap()["value"].clone()
    }
    #[test]
    fn single_select_uses_placeholder_returns_an_option_and_closes() {
        for css in [false, true] {
            let mut doc = setup(json!({"placeholder":"Choose fruit"}), css);
            assert!(doc.semantics.iter().find(|n| n.id == "select").unwrap().label.contains("Choose fruit"));
            activate(&mut doc, "select");
            activate(&mut doc, "select:option:1");
            assert_eq!(last(&doc), json!({"label":"Banana","value":"b"}));
            assert!(!doc.semantics.iter().any(|n| n.id.contains(":option:")));
            assert!(doc.semantics.iter().find(|n| n.id == "select").unwrap().label.contains("Banana"));
        }
    }
    #[test]
    fn multi_select_toggles_values_and_keeps_the_menu_open() {
        for css in [false, true] {
            let mut doc = setup(json!({"isMulti":true}), css);
            activate(&mut doc, "select");
            activate(&mut doc, "select:option:0");
            activate(&mut doc, "select:option:1");
            assert_eq!(
                last(&doc).as_array().unwrap().iter().map(|v| string(&v["value"])).collect::<Vec<_>>(),
                ["a", "b"]
            );
            assert_eq!(doc.semantics.iter().find(|n| n.id == "select:option:0").unwrap().selected, Some(true));
            activate(&mut doc, "select:option:0");
            assert_eq!(last(&doc), json!([{"label":"Banana","value":"b"}]));
            assert_eq!(doc.semantics.iter().find(|n| n.id == "select").unwrap().expanded, Some(true));
        }
    }
    #[test]
    fn select_search_clear_disabled_and_controlled_values_are_respected() {
        for css in [false, true] {
            for multi in [false, true] {
                let mut doc = setup(
                    json!({"isMulti":multi,"isClearable":true,"defaultValue":if multi {json!(["a"])} else {json!("a")}}),
                    css,
                );
                activate(&mut doc, "select:clear");
                assert_eq!(last(&doc), if multi { json!([]) } else { Value::Null });
                activate(&mut doc, "select");
                assert!(doc.command(&json!({"action":"activate","id":"select:option:2"})).is_err());
                doc.command(&json!({"action":"value","id":"select:search","value":"bAn"})).unwrap();
                frame(&mut doc);
                assert!(!doc.semantics.iter().any(|n| n.id == "select:option:0"));
                assert!(doc.semantics.iter().any(|n| n.id == "select:option:1"));
                activate(&mut doc, "select:option:1");
                assert_eq!(
                    last(&doc),
                    if multi {
                        json!([{"label":"Banana","value":"b"}])
                    } else {
                        json!({"label":"Banana","value":"b"})
                    }
                );
            }
            let mut disabled = setup(json!({"isDisabled":true}), css);
            assert!(disabled.command(&json!({"action":"activate","id":"select"})).is_err());
            let mut controlled = setup(json!({"value":{"label":"Apple","value":"a"}}), css);
            activate(&mut controlled, "select");
            activate(&mut controlled, "select:option:1");
            assert_eq!(last(&controlled)["value"], "b");
            assert_eq!(controlled.semantics.iter().find(|n| n.id == "select").unwrap().value["value"], "a");
        }
    }
    #[test]
    fn targeted_keyboard_navigation_stays_with_its_select() {
        let mut doc = setup(json!({"isSearchable":true}), true);
        let props = json!({"isSearchable":true,"options":[{"label":"Apple","value":"a"},{"label":"Banana","value":"b"}]});
        doc.set_tree(&json!([{"id":"select","kind":"NSelect","props":props},{"id":"other","kind":"NSelect","props":props}]))
            .unwrap();
        frame(&mut doc);
        doc.command(&json!({"action":"focus","id":"select"})).unwrap();
        for key in ["ArrowDown", "ArrowDown", "Enter"] {
            assert_eq!(
                doc.command(&json!({"action":"key","key":key,"id":"select","selectOnly":true})).unwrap()["handled"],
                true
            );
            frame(&mut doc);
        }
        assert_eq!(last(&doc)["value"], "b");
        assert!(!doc.events.iter().any(|event| event["id"] == "other"));
    }
    #[test]
    fn keyboard_opens_moves_and_selects_without_page_scrolling() {
        let mut doc = setup(json!({}), true);
        doc.command(&json!({"action":"focus","id":"select"})).unwrap();
        for (step, key) in ["ArrowDown", "ArrowDown", "Enter"].into_iter().enumerate() {
            doc.command(&json!({"action":"key","key":key})).unwrap();
            doc.command(&json!({"action":"key","key":key,"pressed":false})).unwrap();
            frame(&mut doc);
            if step == 1 {
                assert_eq!(
                    doc.semantics
                        .iter()
                        .find(|node| node.id == "select")
                        .unwrap()
                        .active_descendant
                        .as_deref(),
                    Some("select:option:1")
                );
            }
        }
        assert_eq!(last(&doc)["value"], "b");
        assert_eq!(doc.root_scroll, 0.);
    }
}

#[cfg(test)]
mod theme_tests {
    use super::*;
    fn has_fill(shape: &egui::Shape, fill: Color32) -> bool {
        match shape {
            egui::Shape::Rect(rect) => rect.fill == fill,
            egui::Shape::Vec(shapes) => shapes.iter().any(|shape| has_fill(shape, fill)),
            _ => false,
        }
    }
    #[test]
    fn select_field_and_popup_follow_scoped_theme_tokens_in_light_and_dark_modes() {
        for theme in ["light", "dark"] {
            let mut doc = ComponentDocument::default();
            doc.set_tree(&json!([{"id":"theme","kind":"NTheme","props":{"theme":theme,"radius":14,"colors":{"field-background":"#123456","field-border":"#345678","surface":"#234567","accent":"#abcdef"}},"children":[{"id":"select","kind":"NSelect","props":{"options":[{"label":"Apple","value":"a"}],"defaultValue":"a"}}]}])).unwrap();
            let output = doc.frame(390., 600., 1.);
            assert!(output.shapes.iter().any(|shape| matches!(&shape.shape, egui::Shape::Rect(rect) if rect.fill == Color32::from_rgb(0x12,0x34,0x56) && rect.corner_radius.nw == 14)), "the trigger must use field-background and the theme radius");
            output.drop_without_applying_deltas();
            doc.command(&json!({"action":"activate","id":"select"})).unwrap();
            let mut surface = false;
            for _ in 0..20 {
                let output = doc.frame(390., 600., 1.);
                surface |= output
                    .shapes
                    .iter()
                    .any(|shape| has_fill(&shape.shape, Color32::from_rgb(0x23, 0x45, 0x67)));
                output.drop_without_applying_deltas();
            }
            assert!(
                surface,
                "the dropdown must use the scoped surface color, theme={theme}, nodes={:?}",
                doc.snapshot()["nodes"]
            );
        }
    }
}

#[cfg(test)]
mod scroll_tests {
    use super::*;
    fn frame(doc: &mut ComponentDocument) {
        for _ in 0..3 {
            doc.frame(390., 600., 1.).drop_without_applying_deltas();
        }
    }
    #[test]
    fn touch_scrolls_dropdown_options_without_moving_the_page_or_changing_selection() {
        for css in [false, true] {
            let mut doc = ComponentDocument::default();
            if css {
                doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
            }
            let options: Vec<_> = (0..40).map(|i| json!({"label":format!("Option {i}"),"value":i.to_string()})).collect();
            doc.set_tree(&json!([{"id":"page","kind":"NView","children":[{"id":"select","kind":"NSelect","props":{"options":options,"isMulti":true}},{"id":"spacer","kind":"NView","props":{"height":2000,"style":{"height":2000}}}]}])).unwrap();
            frame(&mut doc);
            let before = doc.layout_bounds("select").unwrap()[1];
            doc.command(&json!({"action":"activate","id":"select"})).unwrap();
            frame(&mut doc);
            let item = doc.semantics.iter().find(|node| node.id == "select:option:2").unwrap();
            let x = item.rect[0] + item.rect[2] / 2.;
            let y = item.rect[1] + item.rect[3] / 2.;
            doc.touch(0, x, y);
            frame(&mut doc);
            for step in 1..=6 {
                doc.touch(1, x, y - step as f32 * 20.);
                frame(&mut doc);
            }
            doc.touch(2, x, y - 120.);
            frame(&mut doc);
            assert_eq!(doc.layout_bounds("select").unwrap()[1], before, "the page must stay still, css={css}");
            assert!(
                !doc.semantics.iter().any(|node| node.id == "select:option:0"),
                "options must scroll, css={css}"
            );
            assert!(!doc.events.iter().any(|event| event["id"] == "select" && event["type"] == "change"));
        }
    }
}

#[cfg(test)]
mod typography_tests {
    use super::*;
    #[test]
    fn popup_options_inherit_the_accessibility_font_scale() {
        let mut doc = ComponentDocument::default();
        doc.command(&json!({"action":"environment","fontScale":2})).unwrap();
        doc.set_tree(&json!([{"id":"select","kind":"NSelect","props":{"options":[{"label":"Large option","value":"a"}]}}]))
            .unwrap();
        doc.frame(390., 600., 1.).drop_without_applying_deltas();
        doc.command(&json!({"action":"activate","id":"select"})).unwrap();
        let mut scaled = false;
        for _ in 0..3 {
            let output = doc.frame(390., 600., 1.);
            scaled|=output.shapes.iter().any(|shape|matches!(&shape.shape,egui::Shape::Text(text) if text.galley.job.text=="Large option" && text.galley.job.sections.iter().all(|section|section.format.font_id.size>=32.)));
            output.drop_without_applying_deltas();
        }
        assert!(scaled, "popup text must scale with the field instead of using egui's unscaled defaults");
    }
}
