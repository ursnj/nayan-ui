//! Inline text keeps its own typography and link targets while sharing a single wrapped galley.
use super::*;

pub(super) struct Target {
    pub node: Node,
    pub start: usize,
    pub end: usize,
    pub href: Option<String>,
}

#[derive(Clone)]
struct InlineText {
    format: egui::TextFormat,
    transform: style::TextTransform,
    line_height: style::Length,
    tracking: style::Length,
}

impl InlineText {
    fn apply(&mut self, style: &style::Style, scale: f32) {
        if let Some(size) = style.text_size {
            self.format.font_id.size = size * scale;
        }
        if style.weight.is_some() || style.medium || style.monospace {
            self.format.font_id.family = style.font_family();
        }
        if let Some(color) = style.foreground {
            self.format.color = color;
        }
        self.transform = style.text_transform.unwrap_or(self.transform);
        self.line_height = style.line_height.unwrap_or(self.line_height);
        self.tracking = style.tracking.unwrap_or(self.tracking);
    }

    fn append(&self, job: &mut egui::text::LayoutJob, text: &str, scale: f32) {
        let mut format = self.format.clone();
        let size = format.font_id.size / scale;
        format.line_height = Some(self.line_height.points(size) * scale);
        format.extra_letter_spacing = self.tracking.points(size) * scale;
        job.append(&self.transform.apply(text), 0., format);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detected_links_use_accent_without_inheriting_text_defaults_or_underlines() {
        let mut doc = ComponentDocument::default();
        doc.palette = theme::Palette::configure(
            &doc.palette,
            &json!({"colors":{"accent":"#7654d1"},"components":{"NText":{"className":"text-foreground"}}}),
            false,
        );
        let node: Node = serde_json::from_value(json!({"id":"copy","kind":"NText","props":{
            "linkify":true,"text":"Visit https://example.com or email hi@example.com."
        }}))
        .unwrap();
        let plain = Color32::from_rgb(0x12, 0x34, 0x56);
        let format = egui::TextFormat {
            color: plain,
            underline: egui::Stroke::new(1., plain),
            ..Default::default()
        };
        let mut job = egui::text::LayoutJob::default();
        let mut targets = Vec::new();
        let inline = InlineText {
            format,
            transform: style::TextTransform::Normal,
            line_height: style::Length::Em(1.625),
            tracking: style::Length::Points(0.),
        };
        doc.append_inline(&node, &inline, &mut job, Some(&mut targets), None);
        assert_eq!(targets.len(), 2);
        for section in &job.sections {
            let value = &job.text[section.byte_range.start.0..section.byte_range.end.0];
            if value.starts_with("https://") || value.contains('@') {
                assert_eq!(section.format.color, doc.palette.get("accent"));
                assert_eq!(section.format.underline, egui::Stroke::NONE);
            } else {
                assert_eq!(section.format.color, plain);
            }
        }
    }

    #[test]
    fn nested_text_measures_and_paints_the_same_scaled_typography() {
        let mut doc = ComponentDocument::default();
        doc.font_scale = 2.;
        let node: Node = serde_json::from_value(json!({
            "id":"headline","kind":"NText","props":{"className":"uppercase tracking-wide leading-tight"},
            "children":[
                {"id":"prefix","kind":"NText","props":{"text":"Read "}},
                {"id":"link","kind":"NLink","props":{"text":"the guide","href":"/guide","className":"text-4xl normal-case"}}
            ]
        }))
        .unwrap();
        let style = doc.measure_style(&node, 320.);
        let mut targets = Vec::new();
        let painted = doc.rich_text_job(&node, &style, 320., Color32::WHITE, Some(&mut targets)).unwrap();
        let measured = doc.rich_text_job(&node, &style, 320., Color32::WHITE, None).unwrap();
        assert_eq!(painted.text, "READ the guide");
        assert_eq!(painted, measured);
        let format = &painted.sections.last().unwrap().format;
        assert_eq!(format.font_id.size, 72.);
        assert_eq!(format.line_height, Some(90.));
        assert!((format.extra_letter_spacing - 1.8).abs() < 0.0001);
        assert_eq!(targets[0].href.as_deref(), Some("/guide"));
        assert_eq!(targets[0].start, 5);
        assert_eq!(targets[0].end, 14);
    }
}

impl ComponentDocument {
    fn append_inline(
        &self,
        node: &Node,
        inherited: &InlineText,
        job: &mut egui::text::LayoutJob,
        mut targets: Option<&mut Vec<Target>>,
        owner: Option<&Node>,
    ) {
        let owner = if node.kind == "NLink" {
            None
        } else if node.props["linkify"] == true {
            Some(node)
        } else {
            owner
        };
        let mut inline = inherited.clone();
        let scale = self.font_scale.max(1.);
        if node.props["text"].is_null() || node.props["className"].is_string() || node.props["style"].is_object() {
            let style = self.measure_style(node, job.wrap.max_width);
            inline.apply(&style, scale);
            if node.props["className"]
                .as_str()
                .unwrap_or("")
                .split_whitespace()
                .any(|s| s == "underline")
            {
                inline.format.underline = egui::Stroke::new(1., inline.format.color);
            }
        }
        let start = job.text.chars().count();
        if node.props["style"]["fontStyle"] == "italic" || node.props["tag"] == "em" {
            inline.format.italics = true;
        }
        if node.props["style"]["textDecorationLine"] == "line-through" || node.props["tag"] == "del" {
            inline.format.strikethrough = egui::Stroke::new(1., inline.format.color);
        }
        let direct = ["text", "label", "title", "name"]
            .iter()
            .find_map(|key| node.props[*key].as_str().filter(|s| !s.is_empty()));
        if let Some(text) = direct {
            if let Some(owner) = owner {
                let mut offset = 0;
                for link in linkify::links(text) {
                    inline.append(job, &text[offset..link.start], scale);
                    let begin = job.text.chars().count();
                    let mut link_text = inline.clone();
                    link_text.format.color = self.palette.get("accent");
                    link_text.format.underline = egui::Stroke::NONE;
                    let link_style = self.measure_style(
                        &Node {
                            id: owner.id.clone(),
                            kind: "NLink".into(),
                            props: json!({"style":owner.props["linkStyle"],"className":owner.props["linkClassName"]}),
                            children: vec![],
                        },
                        job.wrap.max_width,
                    );
                    link_text.apply(&link_style, scale);
                    let label = &text[link.start..link.end];
                    link_text.append(job, label, scale);
                    if let Some(targets) = targets.as_deref_mut() {
                        targets.push(Target {
                            node: linkify::target(owner, node, begin, label, &link.href),
                            start: begin,
                            end: job.text.chars().count(),
                            href: Some(link.href),
                        });
                    }
                    offset = link.end;
                }
                inline.append(job, &text[offset..], scale);
            } else {
                inline.append(job, text, scale);
            }
        } else {
            for child in &node.children {
                self.append_inline(child, &inline, job, targets.as_deref_mut(), owner);
            }
        }
        if let Some(targets) = targets.filter(|_| matches!(node.kind.as_str(), "NPress" | "NLink")) {
            targets.push(Target {
                node: node.clone(),
                start,
                end: job.text.chars().count(),
                href: node.props["href"].as_str().map(str::to_owned),
            });
        }
    }

    pub(super) fn rich_text_job(
        &self,
        node: &Node,
        resolved: &style::Style,
        width: f32,
        color: Color32,
        targets: Option<&mut Vec<Target>>,
    ) -> Option<egui::text::LayoutJob> {
        if node.props["linkify"] != true
            && !node.children.iter().any(|child| {
                child.kind != "NText" || !child.children.is_empty() || child.props["className"].is_string() || child.props["style"].is_object()
            })
        {
            return None;
        }
        let scale = self.font_scale.max(1.);
        let size = resolved.text_size.unwrap_or(16.);
        let mut job = egui::text::LayoutJob::default();
        job.wrap.max_width = width.max(1.);
        if let Some(lines) = node.props["numberOfLines"].as_u64().filter(|n| *n > 0) {
            job.wrap.max_rows = lines.min(100) as usize;
        }
        let inline = InlineText {
            format: egui::TextFormat {
                font_id: egui::FontId::new(size * scale, resolved.font_family()),
                color: resolved.foreground.unwrap_or(color),
                ..Default::default()
            },
            transform: resolved.text_transform.unwrap_or(style::TextTransform::Normal),
            line_height: resolved.line_height.unwrap_or(style::Length::Em(1.625)),
            tracking: resolved.tracking.unwrap_or(style::Length::Points(0.)),
        };
        self.append_inline(node, &inline, &mut job, targets, None);
        Some(job)
    }

    pub(super) fn rich_text(&mut self, ui: &mut egui::Ui, node: &Node, resolved: &style::Style) -> bool {
        let mut targets = Vec::new();
        let Some(job) = self.rich_text_job(node, resolved, ui.available_width(), ui.visuals().text_color(), Some(&mut targets)) else {
            return false;
        };
        let mut label = egui::Label::new(job);
        if let Some(align) = resolved.text_align {
            label = label.halign(align);
        }
        let (pos, galley, response) = label.layout_in_ui(ui);
        ui.painter().galley(pos, galley.clone(), ui.visuals().text_color());
        self.semantic(ui, node, &response, Value::Null);
        self.inline_links(ui, &galley, pos, targets, ui.clip_rect());
        true
    }

    pub(super) fn inline_links(&mut self, ui: &mut egui::Ui, galley: &egui::Galley, pos: Pos2, targets: Vec<Target>, clip: Rect) {
        for target in targets {
            let mut index = 0;
            let mut fragments = 0;
            for (line, row) in galley.rows.iter().enumerate() {
                let mut rect = Rect::NOTHING;
                for glyph in &row.glyphs {
                    if index >= target.start && index < target.end {
                        rect |= Rect::from_min_size(
                            pos + row.pos.to_vec2() + Vec2::new(glyph.pos.x, 0.),
                            Vec2::new(glyph.advance_width, row.size.y),
                        );
                    }
                    index += 1;
                }
                if row.ends_with_newline {
                    index += 1;
                }
                let rect = rect.intersect(clip);
                if rect.is_positive() {
                    let mut node = target.node.clone();
                    if fragments > 0 {
                        node.id = format!("{}:line:{line}", target.node.id);
                    }
                    fragments += 1;
                    let hit = ui.interact(rect, egui::Id::unique(&node.id), egui::Sense::click());
                    if hit.clicked() {
                        if let Some(href) = &target.href {
                            self.revision += 1;
                            self.events.push(json!({"id":target.node.props["_linkifyOwner"].as_str().unwrap_or(&target.node.id),"type":"press","value":{"href":href,"text":text(&target.node),"linkify":target.node.props["_linkifyOwner"].is_string()},"sequence":self.revision}));
                        } else {
                            self.click(&target.node.id);
                        }
                    }
                    self.semantic(ui, &node, &hit, json!(target.href));
                }
            }
        }
    }
}
