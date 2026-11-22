use super::*;

struct Tab {
    value: Value,
    label: String,
    style: style::Style,
    font: egui::FontId,
    size: Vec2,
    text_width: f32,
    selected: bool,
    disabled: bool,
}

fn paint_box(ui: &egui::Ui, rect: Rect, style: &style::Style, fill: Color32) {
    let corners = style.corner_radius();
    if let Some((shadow, _)) = style.shadow {
        ui.painter().add(shadow.as_shape(rect, corners));
    }
    ui.painter().rect(
        rect,
        corners,
        fill,
        egui::Stroke::new(style.border_width, style.border.unwrap_or(Color32::TRANSPARENT)),
        egui::StrokeKind::Inside,
    );
}

impl ComponentDocument {
    pub(super) fn tabs(&mut self, ui: &mut egui::Ui, node: &Node) {
        let props = &node.props;
        let items = props["options"].as_array().or_else(|| props["items"].as_array());
        let first = items.and_then(|items| items.iter().find(|item| !flag(item, &["disabled", "isDisabled"])));
        let selected = self.value(
            node,
            &["value", "selected"],
            first.map_or(Value::Null, |item| item.get("value").unwrap_or(item).clone()),
        );
        let vertical = props["orientation"] == "vertical";
        if let Some(label) = props["label"].as_str() {
            ui.label(label);
        }
        if let Some(items) = items.filter(|items| !items.is_empty()) {
            ui.spacing_mut().item_spacing = Vec2::splat(12.);
            if vertical {
                ui.horizontal_top(|ui| {
                    self.tab_list(ui, node, items, &selected, true);
                    ui.vertical(|ui| self.tab_content(ui, node, &selected));
                });
                return;
            }
            self.tab_list(ui, node, items, &selected, false);
        }
        self.tab_content(ui, node, &selected);
    }

    fn tab_content(&mut self, ui: &mut egui::Ui, node: &Node, selected: &Value) {
        for child in &node.children {
            if child.kind != "NTabsContent" {
                self.one(ui, child);
            } else if &child.props["item"] != selected {
                self.forget_list_bounds(std::slice::from_ref(child));
            } else if let Some(classes) = node.props["contentClassName"].as_str() {
                let mut child = child.clone();
                child.props["className"] = json!(format!("{classes} {}", child.props["className"].as_str().unwrap_or("")));
                self.one(ui, &child);
            } else {
                self.one(ui, child);
            }
        }
    }

    fn tab_list(&mut self, ui: &mut egui::Ui, node: &Node, entries: &[Value], selected: &Value, vertical: bool) {
        let props = &node.props;
        let classes = |key| props[key].as_str().unwrap_or("");
        let secondary = props["variant"] == "secondary";
        let available = ui.available_width().max(1.);
        let resolve = |class_name: String| {
            style::Style::resolve(
                "NView",
                &json!({"className":class_name}),
                &self.palette,
                style::Conditions {
                    dark: self.palette.dark,
                    viewport: ui.ctx().viewport_rect().width(),
                    ..Default::default()
                },
                Vec2::new(available, ui.available_height()),
            )
        };
        let list_default = if secondary { "gap-0" } else { "rounded-lg bg-default p-1 gap-0" };
        let list = resolve(format!("{list_default} {}", classes("listClassName")));
        let scale = self.font_scale.max(1.);
        let tabs: Vec<_> = entries
            .iter()
            .map(|entry| {
                let value = entry.get("value").unwrap_or(entry).clone();
                let label = entry["label"].as_str().map(str::to_owned).unwrap_or_else(|| string(entry));
                let is_selected = &value == selected || entry == selected;
                let appearance = match (secondary, is_selected) {
                    (false, true) => "rounded-md bg-surface text-foreground bg-segment text-segment-foreground shadow-sm",
                    (true, true) => "rounded-none text-foreground",
                    _ => "rounded-md text-muted",
                };
                let style = resolve(format!(
                    "min-h-8 px-3 py-1 text-sm font-medium {appearance} {} {} {} {}",
                    classes("itemClassName"),
                    classes("tabClassName"),
                    classes("triggerClassName"),
                    if is_selected { classes("activeItemClassName") } else { "" },
                ));
                let font = egui::FontId::new(style.text_size.unwrap_or(14.) * scale, style.font_family());
                let text_size = ui.painter().layout_no_wrap(label.clone(), font.clone(), Color32::WHITE).size();
                let width = style
                    .width
                    .unwrap_or(text_size.x + style.padding.left + style.padding.right)
                    .max(style.min_width.unwrap_or(0.));
                let height = style
                    .height
                    .unwrap_or(text_size.y + style.padding.top + style.padding.bottom)
                    .max(style.min_height.unwrap_or(32.));
                Tab {
                    value,
                    label,
                    style,
                    font,
                    size: Vec2::new(width, height),
                    text_width: text_size.x,
                    selected: is_selected,
                    disabled: flag(entry, &["disabled", "isDisabled"]),
                }
            })
            .collect();
        let gap = list.gap.unwrap_or(Vec2::ZERO);
        let gaps = (tabs.len() - 1) as f32 * if vertical { gap.y } else { gap.x };
        let padding = list.padding;
        let tab_width = if vertical {
            tabs.iter().map(|tab| tab.size.x).fold(0., f32::max)
        } else {
            tabs.iter().map(|tab| tab.size.x).sum()
        };
        let row_height = tabs.iter().map(|tab| tab.size.y).fold(0., f32::max);
        let natural_width = tab_width + padding.left + padding.right + if vertical { 0. } else { gaps };
        let is_full = !vertical && props["isFull"] == true;
        let max_width = if vertical { available * 0.45 } else { available };
        let width = list
            .width
            .unwrap_or(if is_full { available } else { natural_width })
            .min(max_width)
            .max(1.);
        let height = padding.top
            + padding.bottom
            + if vertical {
                tabs.iter().map(|tab| tab.size.y).sum::<f32>() + gaps
            } else {
                row_height
            };
        let (track, track_response) = ui.allocate_exact_size(Vec2::new(width, height), egui::Sense::hover());
        paint_box(ui, track, &list, list.background.unwrap_or(Color32::TRANSPARENT));
        let line = |rect: Rect, thickness| {
            if vertical {
                Rect::from_min_max(rect.right_top() - Vec2::new(thickness, 0.), rect.right_bottom())
            } else {
                Rect::from_min_max(rect.left_bottom() - Vec2::new(0., thickness), rect.right_bottom())
            }
        };
        if secondary {
            ui.painter().rect_filled(line(track, 1.), 0., self.palette.get("border"));
        }
        let label = ["accessibilityLabel", "aria-label", "ariaLabel", "label"]
            .iter()
            .find_map(|key| props[*key].as_str())
            .unwrap_or("Tabs");
        let group = Node {
            id: node.id.clone(),
            kind: "NTabsList".into(),
            props: json!({"accessibilityLabel":label}),
            children: vec![],
        };
        self.record_semantic(&group, &track_response, json!(if vertical { "vertical" } else { "horizontal" }));
        let content_width = (width - padding.left - padding.right - if vertical { 0. } else { gaps }).max(0.);
        let mut position = track.min + Vec2::new(padding.left, padding.top);
        for (index, tab) in tabs.iter().enumerate() {
            let width = if vertical {
                content_width
            } else if is_full {
                content_width / tabs.len() as f32
            } else {
                tab.size.x * (content_width / tab_width.max(1.)).min(1.)
            };
            let size = Vec2::new(width, if vertical { tab.size.y } else { row_height });
            let rect = Rect::from_min_size(position, size);
            let id = format!("{}:option:{index}", node.id);
            let builder = egui::UiBuilder::new().max_rect(rect);
            let button = ui.new_child(if tab.disabled { builder.disabled() } else { builder });
            let response = button.interact(rect, egui::Id::unique(&id), egui::Sense::click());
            let opacity = tab.style.opacity * if response.enabled() { 1. } else { 0.5 };
            let fill = tab.style.background.unwrap_or_else(|| {
                if response.hovered() {
                    self.palette.get("surface-secondary").gamma_multiply(0.6)
                } else {
                    Color32::TRANSPARENT
                }
            });
            paint_box(ui, rect, &tab.style, fill.gamma_multiply(opacity));
            if secondary && tab.selected {
                ui.painter()
                    .rect_filled(line(rect, 2.), 0., self.palette.get("accent").gamma_multiply(opacity));
            }
            let color = tab
                .style
                .foreground
                .unwrap_or_else(|| self.palette.get("foreground"))
                .gamma_multiply(opacity);
            let inset = tab
                .style
                .padding
                .left
                .min(tab.style.padding.right)
                .min(((width - tab.text_width) * 0.5).max(2.));
            let mut text = egui::text::LayoutJob::simple(tab.label.clone(), tab.font.clone(), color, (width - 2. * inset).max(1.));
            text.wrap.max_rows = 1;
            let galley = ui.painter().layout_job(text);
            ui.painter()
                .with_clip_rect(rect.intersect(ui.clip_rect()))
                .galley(rect.center() - galley.size() * 0.5, galley, color);
            self.focus_outline(ui.painter(), &response, rect, tab.style.corner_radius(), egui::StrokeKind::Inside);
            let entry = Node {
                id,
                kind: "NTabs".into(),
                props: json!({"label":tab.label,"_selected":tab.selected}),
                children: vec![],
            };
            self.record_semantic(&entry, &response, tab.value.clone());
            if response.clicked() && !tab.selected {
                self.values.insert(node.id.clone(), tab.value.clone());
                self.change(&node.id, tab.value.clone());
            }
            if vertical {
                position.y += size.y + gap.y;
            } else {
                position.x += size.x + gap.x;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tree(props: Value) -> Value {
        let mut tabs = json!({"id":"tabs","kind":"NTabs","props":{"items":["Account",{"value":"security","label":"Security","disabled":true},"Billing"]},"children":[
            {"id":"account-panel","kind":"NTabsContent","props":{"item":"Account"},"children":[{"id":"account-copy","kind":"NText","props":{"text":"Account settings"}}]},
            {"id":"billing-panel","kind":"NTabsContent","props":{"item":"Billing"},"children":[{"id":"billing-copy","kind":"NText","props":{"text":"Billing details"}}]}
        ]});
        tabs["props"].as_object_mut().unwrap().extend(props.as_object().unwrap().clone());
        json!([tabs])
    }

    #[test]
    fn tabs_show_one_panel_and_keep_full_width_geometry_when_switching() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&tree(json!({"isFull":true}))).unwrap();
        let output = doc.frame(250., 300., 1.);
        let (_, list) = doc.semantics.split_first().unwrap();
        let widths: Vec<_> = list.iter().filter(|node| node.kind == "NTabs").map(|node| node.rect[2]).collect();
        assert_eq!(widths.len(), 3);
        assert!(widths[0] >= 70. && widths.iter().all(|width| (width - widths[0]).abs() < 0.01));
        assert!(
            output
                .shapes
                .iter()
                .any(|shape| matches!(&shape.shape, egui::Shape::Rect(rect) if rect.fill == doc.palette.get("default") && rect.corner_radius.nw > 0))
        );
        output.drop_without_applying_deltas();
        assert!(doc.layout_bounds("account-copy").is_some());
        assert!(doc.command(&json!({"action":"activate","id":"tabs:option:1"})).is_err());
        doc.command(&json!({"action":"activate","id":"tabs:option:2"})).unwrap();
        for _ in 0..3 {
            doc.frame(250., 300., 1.).drop_without_applying_deltas();
        }
        assert_eq!(doc.values["tabs"], json!("Billing"));
        assert!(doc.layout_bounds("account-copy").is_none());
        assert!(doc.layout_bounds("billing-copy").is_some());
        let billing = doc.semantics.iter().find(|node| node.id == "tabs:option:2").unwrap();
        assert_eq!(billing.selected, Some(true));
        assert!((billing.rect[2] - widths[0]).abs() < 0.01);
    }

    #[test]
    fn the_vertical_secondary_indicator_and_panel_follow_controlled_selection() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&tree(json!({"orientation":"vertical","variant":"secondary","selected":"Billing"})))
            .unwrap();
        let output = doc.frame(300., 300., 1.);
        let billing = doc.semantics.iter().find(|node| node.id == "tabs:option:2").unwrap();
        assert_eq!(billing.selected, Some(true));
        let list = doc.semantics.iter().find(|node| node.id == "tabs").unwrap();
        assert_eq!(list.value, "vertical");
        assert!(doc.layout_bounds("billing-copy").unwrap()[0] >= list.rect[0] + list.rect[2]);
        assert!(
            output
                .shapes
                .iter()
                .any(|shape| matches!(&shape.shape, egui::Shape::Rect(rect) if rect.fill == doc.palette.get("accent") && rect.rect.width() == 2.))
        );
        output.drop_without_applying_deltas();
        doc.command(&json!({"action":"activate","id":"tabs:option:0"})).unwrap();
        for _ in 0..3 {
            doc.frame(300., 300., 1.).drop_without_applying_deltas();
        }
        assert!(doc.events.iter().any(|event| event["id"] == "tabs" && event["value"] == "Account"));
        assert!(doc.layout_bounds("billing-copy").is_some());
        doc.set_tree(&tree(json!({"orientation":"vertical","variant":"secondary","selected":"Account"})))
            .unwrap();
        doc.frame(300., 300., 1.).drop_without_applying_deltas();
        assert!(doc.layout_bounds("account-copy").is_some());
    }
}
