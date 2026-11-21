use super::*;

impl Document {
    /// Measurement and painting share the same shaped runs, including nested emphasis and links.
    pub(super) fn text_job(&self, index: usize, width: f32, scale: f32) -> egui::text::LayoutJob {
        self.text_layout(index, width, scale).0
    }

    pub(super) fn text_layout(&self, index: usize, width: f32, scale: f32) -> (egui::text::LayoutJob, Vec<rich_text::Target>) {
        let item = &self.boxes[index];
        let mut job = egui::text::LayoutJob::default();
        job.wrap.max_width = if item.css.get("white-space").is_some_and(|v| v == "nowrap" || v == "pre") {
            1_000_000.
        } else {
            width.max(1.)
        };
        // egui already falls back to splitting a word that cannot fit. CSS overflow-wrap
        // retains normal word boundaries; only word-break: break-all is greedy.
        job.wrap.break_anywhere = item.css.get("word-break").is_some_and(|v| v == "break-all");
        if let Some(lines) = item
            .css
            .get("-webkit-line-clamp")
            .and_then(|v| v.parse::<usize>().ok())
            .filter(|n| *n > 0)
        {
            job.wrap.max_rows = lines.min(100);
        }
        fn append(sheet: &Document, index: usize, job: &mut egui::text::LayoutJob, scale: f32, targets: &mut Vec<rich_text::Target>) {
            let item = &sheet.boxes[index];
            let paint = &item.paint;
            let start = job.text.chars().count();
            let direct = ["text", "label"].iter().find_map(|key| item.node.props[*key].as_str());
            if let Some(label) = direct {
                let label = paint.text_transform.unwrap_or(style::TextTransform::Normal).apply(label);
                let size = paint.text_size.unwrap_or(16.);
                let mut format = egui::TextFormat {
                    font_id: egui::FontId::new(size * scale, paint.font_family()),
                    color: paint.foreground.unwrap_or(Color32::WHITE),
                    line_height: Some(paint.line_height.map_or(size * 1.5, |v| v.points(size)) * scale),
                    extra_letter_spacing: item
                        .css
                        .get("letter-spacing")
                        .and_then(|v| number(v, size, sheet.viewport, size))
                        .unwrap_or(0.)
                        * scale,
                    ..Default::default()
                };
                if item
                    .css
                    .get("text-decoration-line")
                    .or_else(|| item.css.get("text-decoration"))
                    .is_some_and(|v| v.contains("underline"))
                {
                    format.underline = egui::Stroke::new(1., format.color);
                }
                format.italics = item.css.get("font-style").is_some_and(|value| value == "italic");
                if item
                    .css
                    .get("text-decoration-line")
                    .or_else(|| item.css.get("text-decoration"))
                    .is_some_and(|value| value.contains("line-through"))
                {
                    format.strikethrough = egui::Stroke::new(1., format.color);
                }
                job.append(&label, 0., format);
            } else {
                for child in &item.children {
                    append(sheet, *child, job, scale, targets);
                }
            }
            if item.node.kind == "NLink" {
                targets.push(rich_text::Target {
                    node: item.node.clone(),
                    start,
                    end: job.text.chars().count(),
                    href: item.node.props["href"].as_str().map(str::to_owned),
                });
            }
        }
        let mut targets = Vec::new();
        append(self, index, &mut job, scale, &mut targets);
        (job, targets)
    }

    pub(super) fn measure(
        &self,
        context: &egui::Context,
        index: usize,
        known: tf::Size<Option<f32>>,
        available: tf::Size<tf::AvailableSpace>,
        scale: f32,
    ) -> tf::Size<f32> {
        let item = &self.boxes[index];
        if matches!(item.node.kind.as_str(), "NPattern" | "NConfetti") {
            return tf::Size {
                width: known.width.unwrap_or(0.),
                height: known.height.unwrap_or(0.),
            };
        }
        if matches!(item.node.kind.as_str(), "NLoading" | "NSpinner") {
            let available_width = match available.width {
                tf::AvailableSpace::Definite(width) => width,
                _ => 1_000_000.,
            };
            let size = super::super::loading::measure(context, &item.node, &item.paint, known.width.unwrap_or(available_width), scale).0;
            return tf::Size {
                width: known.width.unwrap_or(size.x),
                height: known.height.unwrap_or(size.y),
            };
        }
        if item.node.kind == "NSkeleton" {
            return tf::Size {
                width: known.width.unwrap_or(match available.width {
                    tf::AvailableSpace::Definite(w) => w,
                    _ => 120.,
                }),
                height: known.height.unwrap_or(16.),
            };
        }
        if matches!(item.node.kind.as_str(), "NImage" | "NIcon") {
            let width = item.node.props["width"].as_f64().map(|v| v as f32);
            let height = item.node.props["height"].as_f64().map(|v| v as f32);
            let size = numeric(&item.node.props, &["size"], if item.node.kind == "NIcon" { 24. } else { 160. }) as f32;
            let ratio = width.zip(height).filter(|(_, h)| *h > 0.).map_or(1., |(w, h)| w / h);
            return tf::Size {
                width: known.width.or_else(|| known.height.map(|h| h * ratio)).or(width).unwrap_or(size),
                height: known.height.or_else(|| known.width.map(|w| w / ratio)).or(height).unwrap_or(size),
            };
        }
        let mut width = match available.width {
            tf::AvailableSpace::Definite(width) => width.min(known.width.unwrap_or(f32::INFINITY)),
            _ => known.width.unwrap_or(1_000_000.),
        };
        if let Some(maximum) = item
            .css
            .get("max-width")
            .and_then(|v| number(v, width, self.viewport, item.paint.text_size.unwrap_or(16.)))
        {
            width = width.min(maximum);
        }
        let mut job = self.text_job(index, width, scale);
        if matches!(available.width, tf::AvailableSpace::MinContent)
            && known.width.is_none()
            && !item.css.get("white-space").is_some_and(|v| v == "nowrap" || v == "pre")
        {
            // CSS min-content is the widest unbreakable word, rather than one glyph.
            let longest = context.fonts_mut(|fonts| {
                job.sections
                    .iter()
                    .flat_map(|section| {
                        job.text[section.byte_range.start.0..section.byte_range.end.0]
                            .split_whitespace()
                            .map(move |word| (word, &section.format))
                    })
                    .map(|(word, format)| {
                        fonts.layout_no_wrap(word.into(), format.font_id.clone(), Color32::WHITE).size().x
                            + format.extra_letter_spacing * word.chars().count().saturating_sub(1) as f32
                    })
                    .fold(0., f32::max)
            });
            job.wrap.max_width = longest.max(1.);
        }
        let dimensions = context.fonts_mut(|fonts| fonts.layout_job(job).size());
        let control = matches!(item.node.kind.as_str(), "NInput" | "NTextarea" | "NSelect" | "NSearchField");
        tf::Size {
            width: known.width.unwrap_or(if control { width.min(320.) } else { dimensions.x }),
            height: known.height.unwrap_or(dimensions.y.max(if control { 24. } else { 0. })),
        }
    }
}
