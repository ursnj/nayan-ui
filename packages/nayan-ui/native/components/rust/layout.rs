//! Intrinsic and flexible row layout for declarative component trees; no JS measurements.
use super::*;

/// Route page insets to content, never to the surface viewport or nested decorations.
pub(super) fn page_safe_area(nodes: &mut [Node]) {
    fn target(nodes: &mut [Node], area: &Value) -> bool {
        for node in nodes {
            if matches!(node.kind.as_str(), "NSheet" | "NDialog" | "NConfirm" | "NPopover") {
                continue;
            }
            // An embedded page owns its own content and must not receive the outer inset twice.
            if node.props["pageSafeArea"].is_object() {
                return true;
            }
            if node.props["pageScrollContent"] == true {
                node.props["safeArea"] = area.clone();
                return true;
            }
            if node.kind == "NList" && node.props["pageScrollContent"] != "item" {
                node.props["contentSafeArea"] = area.clone();
                return true;
            }
            if target(&mut node.children, area) {
                return true;
            }
        }
        false
    }
    for node in nodes {
        if let Some(area) = node.props.get("pageSafeArea").filter(|a| a.is_object()).cloned() {
            if !target(&mut node.children, &area) {
                node.props["safeArea"] = area;
            }
        }
        page_safe_area(&mut node.children);
    }
}

impl ComponentDocument {
    pub(super) fn measure_style(&self, node: &Node, width: f32) -> style::Style {
        style::Style::resolve(
            &node.kind,
            &node.props,
            &self.palette,
            style::Conditions {
                dark: self.palette.dark,
                viewport: self.context.viewport_rect().width(),
                ..Default::default()
            },
            Vec2::new(width, 16384.),
        )
    }

    fn text_size(&self, node: &Node, style: &style::Style, width: f32) -> Vec2 {
        if matches!(node.kind.as_str(), "NText" | "NLink")
            && let Some(job) = self.rich_text_job(node, style, width, Color32::WHITE, None)
        {
            return self.context.fonts_mut(|fonts| fonts.layout_job(job).size());
        }
        let scale = self.font_scale.max(1.);
        let size = style.text_size.unwrap_or(16.);
        let text = style
            .text_transform
            .unwrap_or(style::TextTransform::Normal)
            .apply(text(node))
            .into_owned();
        let mut job = egui::text::LayoutJob::simple(text, egui::FontId::new(size * scale, style.font_family()), Color32::WHITE, width.max(1.));
        job.sections[0].format.line_height = style
            .line_height
            .map(|h| h.points(size) * scale)
            .or_else(|| self.native.then_some(size * 1.625 * scale));
        job.sections[0].format.extra_letter_spacing = style.tracking.map_or(0., |tracking| tracking.points(size) * scale);
        if let Some(lines) = node.props["numberOfLines"].as_u64().filter(|n| *n > 0) {
            job.wrap.max_rows = lines.min(100) as usize;
        }
        self.context.fonts_mut(|fonts| fonts.layout_job(job).size())
    }

    fn intrinsic_width(&self, node: &Node, s: &style::Style, available: f32) -> f32 {
        if let Some(width) = s.width {
            return width + s.margin.left + s.margin.right;
        }
        let content = match node.kind.as_str() {
            "NText" | "NLink" | "NBadge" | "NChip" => self.text_size(node, s, 1_000_000.).x,
            "NLoading" => loading::measure(&self.context, node, &s, available, self.font_scale).0.x,
            "NIcon" => numeric(&node.props, &["size"], 24.) as f32,
            "NImage" => s.height.unwrap_or(64.),
            "NInput" | "NTextarea" => available,
            _ => {
                let children = node.children.iter().filter(|n| !absolute(n)).map(|n| {
                    let style = self.measure_style(n, available);
                    self.intrinsic_width(n, &style, available)
                });
                if s.horizontal { children.sum() } else { children.fold(0., f32::max) }
            }
        };
        (content + s.padding.left + s.padding.right + s.border_width * 2.)
            .max(s.min_width.unwrap_or(0.))
            .min(s.max_width.unwrap_or(available))
            + s.margin.left
            + s.margin.right
    }

    pub(super) fn measured_text_height(&self, node: &Node, s: &style::Style, width: f32) -> f32 {
        let badge = matches!(node.kind.as_str(), "NBadge" | "NChip");
        let border = if badge { s.border_width * 2. } else { 0. };
        let text_height = self.text_size(node, s, (width - s.padding.left - s.padding.right - border).max(1.)).y;
        let height = text_height + s.padding.top + s.padding.bottom + border;
        let height = if badge { height.max(s.min_height.unwrap_or(0.)) } else { height };
        height + s.margin.top + s.margin.bottom
    }

    pub(super) fn flow_row(&mut self, ui: &mut egui::Ui, flow: &[&Node], resolved: &style::Style) -> bool {
        let available = ui.available_width().max(0.);
        let styles: Vec<_> = flow.iter().map(|n| self.measure_style(n, available)).collect();
        if !resolved.wrap && !resolved.justify_between && !styles.iter().any(|s| s.grow > 0.) {
            return false;
        }
        let gap = resolved.gap.map_or(ui.spacing().item_spacing.x, |v| v.x);
        let gaps = gap * flow.len().saturating_sub(1) as f32;
        let mut widths: Vec<_> = flow
            .iter()
            .zip(&styles)
            .map(|(n, s)| if s.grow == 0. { self.intrinsic_width(n, s, available) } else { 0. })
            .collect();
        let fixed: f32 = widths.iter().sum();
        let grow: f32 = styles.iter().map(|s| s.grow).sum();
        if grow > 0. {
            let free = (available - fixed - gaps).max(0.);
            for (width, style) in widths.iter_mut().zip(&styles) {
                if style.grow > 0. {
                    *width = free * style.grow / grow;
                }
            }
        } else if !resolved.wrap && fixed + gaps > available {
            let rigid: f32 = widths.iter().zip(&styles).filter(|(_, s)| s.width.is_some()).map(|(w, _)| *w).sum();
            let flexible = (fixed - rigid).max(1.);
            for (w, s) in widths.iter_mut().zip(&styles) {
                if s.width.is_none() {
                    *w *= ((available - rigid - gaps).max(0.) / flexible).min(1.);
                }
            }
        }
        let heights: Vec<_> = flow.iter().zip(&widths).map(|(n, w)| self.preferred_height(n, *w)).collect();
        let base = ui.cursor().min;
        let mut x = base.x;
        let mut y = base.y;
        let mut line_height = heights
            .iter()
            .copied()
            .fold(0., f32::max)
            .max(resolved.height.unwrap_or(0.) - resolved.padding.top - resolved.padding.bottom - resolved.border_width * 2.);
        let used: f32 = widths.iter().sum::<f32>() + gaps;
        let distributed = if resolved.justify_between && flow.len() > 1 {
            (available - used).max(0.) / (flow.len() - 1) as f32
        } else {
            0.
        };
        if !resolved.justify_between && grow == 0. && !resolved.wrap {
            let free = (available - used).max(0.);
            x += if resolved.justify == egui::Align::Center {
                free / 2.
            } else if resolved.justify == egui::Align::Max {
                free
            } else {
                0.
            };
        }
        let mut bottom = base.y;
        for (((node, s), width), height) in flow.iter().zip(&styles).zip(&widths).zip(&heights) {
            if resolved.wrap && x > base.x && x + width > base.x + available + 0.5 {
                x = base.x;
                y = bottom + resolved.gap.map_or(gap, |v| v.y);
                line_height = *height;
            }
            let offset = if resolved.align == egui::Align::Center {
                (line_height - height).max(0.) / 2.
            } else if resolved.align == egui::Align::Max {
                (line_height - height).max(0.)
            } else {
                0.
            };
            let rect = Rect::from_min_size(Pos2::new(x, y + offset), Vec2::new(*width, height.max(0.)));
            let content_width = (width - s.margin.left - s.margin.right).max(0.);
            let content_height = (resolved.stretch && !resolved.wrap && s.height.is_none())
                .then(|| (line_height - s.margin.top - s.margin.bottom).max(0.));
            let mut child_ui = ui.new_child(egui::UiBuilder::new().max_rect(rect).layout(egui::Layout::top_down(egui::Align::Min)));
            self.one_sized(&mut child_ui, node, [Some(content_width), content_height]);
            bottom = bottom.max(child_ui.min_rect().bottom()).max(y + line_height);
            x += width + gap + distributed;
        }
        ui.allocate_rect(Rect::from_min_max(base, Pos2::new(base.x + available, bottom)), egui::Sense::hover());
        true
    }
}

#[cfg(test)]
mod page_inset_tests {
    use super::*;

    fn area(bottom: f32) -> Value {
        json!({"insets":{"top":62,"right":0,"bottom":bottom,"left":0},"edges":{"bottom":"maximum"}})
    }
    fn page(children: Value, bottom: f32) -> Value {
        json!([{"id":"page","kind":"NView","props":{"className":"gap-0 p-0","pageSafeArea":area(bottom)},"children":children}])
    }

    #[test]
    fn page_list_padding_belongs_to_scroll_content_and_keeps_planning_consistent() {
        let props = json!({"height":480,"itemCount":10,"itemSize":100,"contentContainerClassName":"p-3","contentSafeArea":area(34.)});
        let mut doc = ComponentDocument::default();
        doc.set_tree(&page(json!([{"id":"list","kind":"NList","props":props}]), 34.)).unwrap();
        doc.frame(320., 480., 1.).drop_without_applying_deltas();
        assert!(doc.tree[0].props["safeArea"].is_null(), "no inset on the page viewport");
        let list = doc.semantics.iter().find(|n| n.id == "list").unwrap();
        assert!((list.rect[3] - 480.).abs() < 0.1);
        let baseline = doc.plan_list(&json!({"id":"list","props":props})).unwrap();
        doc.scroll_list(&json!({"id":"list","kind":"end"})).unwrap();
        doc.frame(320., 480., 1.).drop_without_applying_deltas();
        let end = doc.plan_list(&json!({"id":"list","props":props})).unwrap();
        assert_eq!(baseline["configuration"], end["configuration"]);
        assert_eq!(end["offset"], json!(566.)); // top 12 + rows 1000 + bottom 34 - viewport 480
        assert_eq!(end["viewportHeight"], json!(480.));
    }

    #[test]
    fn page_scroll_forms_and_refresh_rows_receive_one_inset_and_skip_decorations() {
        for refresh in [false, true] {
            let content = json!({"id":"content","kind":"NView","props":{"className":"p-3","pageScrollContent":true},"children":[
                {"id":"last","kind":"NText","props":{"text":"Last card"}},
                {"id":"nested","kind":"NView","props":{"pageScrollContent":true}}
            ]});
            let children = if refresh {
                json!([{"id":"refresh","kind":"NList","props":{"pageScrollContent":"item","itemCount":1,"itemSize":400},"children":[content]}])
            } else {
                json!([content])
            };
            let mut nodes: Vec<Node> = serde_json::from_value(page(children, 34.)).unwrap();
            page_safe_area(&mut nodes);
            assert!(nodes[0].props["safeArea"].is_null());
            let content = if refresh {
                &nodes[0].children[0].children[0]
            } else {
                &nodes[0].children[0]
            };
            assert_eq!(content.props["safeArea"], area(34.));
            assert!(content.children[1].props["safeArea"].is_null());
            if refresh {
                assert!(nodes[0].children[0].props["contentSafeArea"].is_null());
            }
        }
    }

    #[test]
    fn plain_pages_preserve_larger_padding_and_zero_insets_do_not_add_tab_spacing() {
        for (bottom, expected) in [(34., 34.), (0., 12.)] {
            let mut source = page(json!([{"id":"text","kind":"NText","props":{"text":"Form"}}]), bottom);
            source[0]["props"]["className"] = json!("p-3");
            let mut doc = ComponentDocument::default();
            doc.set_tree(&source).unwrap();
            let style = doc.measure_style(&doc.tree[0], 320.);
            assert_eq!(style.padding.bottom, expected);
            source[0]["props"]["style"] = json!({"paddingBottom":80});
            doc.set_tree(&source).unwrap();
            assert_eq!(doc.measure_style(&doc.tree[0], 320.).padding.bottom, 80.);
        }
    }
}
