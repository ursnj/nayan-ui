use super::*;
use taffy::style_helpers::{auto, fr, length, percent};

impl Document {
    pub(super) fn paint_style(&self, i: usize, palette: &theme::Palette) -> style::Style {
        let item = &self.boxes[i];
        let css = &item.css;
        let mut props = item.node.props.clone();
        props["className"] = json!("");
        let mut style = serde_json::Map::new();
        let font = css
            .get("font-size")
            .and_then(|s| number(s, self.viewport.x, self.viewport, 16.))
            .unwrap_or(16.);
        style.insert("fontSize".into(), json!(font));
        style.insert(
            "borderRadius".into(),
            json!(
                css.get("border-radius")
                    .and_then(|s| number(split(s, ' ').first().copied().unwrap_or("0"), self.viewport.x, self.viewport, font))
                    .unwrap_or(0.)
            ),
        );
        for (property, key) in [
            ("color", "color"),
            ("background-color", "backgroundColor"),
            ("border-color", "borderColor"),
        ] {
            if let Some(color) = css.get(property).and_then(|v| values::color(v)) {
                style.insert(key.into(), json!(values::hex(color)));
            }
        }
        if !style.contains_key("backgroundColor") {
            if let Some(color) = css.get("background").and_then(|v| values::color(v)) {
                style.insert("backgroundColor".into(), json!(values::hex(color)));
            }
        }
        if let Some(value) = css.get("font-weight") {
            style.insert(
                "fontWeight".into(),
                json!(value.parse::<u16>().unwrap_or(match value.as_str() {
                    "bold" => 700,
                    "bolder" => 800,
                    _ => 400,
                })),
            );
        }
        if let Some(value) = css.get("line-height") {
            let unitless = !["px", "em", "rem", "%", "vh", "vw"].iter().any(|unit| value.contains(unit));
            let height = number(value, font, self.viewport, font)
                .map(|v| if unitless { v * font } else { v })
                .unwrap_or(font * 1.5);
            style.insert("lineHeight".into(), json!(height));
        }
        for (property, key) in [("opacity", "opacity"), ("border-width", "borderWidth")] {
            if let Some(value) = css
                .get(property)
                .and_then(|v| number(split(v, ' ').first().copied().unwrap_or("0"), self.viewport.x, self.viewport, font))
            {
                style.insert(key.into(), json!(value));
            }
        }
        for (property, key) in [
            ("box-shadow", "boxShadow"),
            ("text-align", "textAlign"),
            ("backdrop-filter", "backdropFilter"),
        ] {
            if let Some(value) = css.get(property) {
                style.insert(key.into(), json!(value));
            }
        }
        if let Some(border) = css.get("border") {
            let parts = split(border, ' ');
            if let Some(width) = parts.iter().find_map(|v| number(v, self.viewport.x, self.viewport, font)) {
                style.entry("borderWidth").or_insert_with(|| json!(width));
            }
            if let Some(color) = parts.iter().find_map(|v| values::color(v)) {
                style.entry("borderColor").or_insert_with(|| json!(values::hex(color)));
            }
        }
        if let Some(value) = css.get("letter-spacing").and_then(|v| number(v, font, self.viewport, font)) {
            props["className"] = json!(format!("{} tracking-[{}px]", props["className"].as_str().unwrap_or(""), value));
        }
        // CSS is already cascaded. The regular painter consumes explicit numeric styles.
        props["style"] = Value::Object(style);
        let mut result = style::Style::resolve(
            &item.node.kind,
            &props,
            palette,
            style::Conditions {
                dark: palette.dark,
                viewport: self.viewport.x,
                ..Default::default()
            },
            self.viewport,
        );
        result.foreground = css.get("color").and_then(|v| values::color(v)).or(Some(palette.get("foreground")));
        result.monospace = css.get("font-family").is_some_and(|family| family.contains("monospace"));
        let radii = split(css.get("border-radius").map(String::as_str).unwrap_or("0"), ' ');
        let a = radii.first().copied().unwrap_or("0");
        let b = radii.get(1).copied().unwrap_or(a);
        let c = radii.get(2).copied().unwrap_or(a);
        let d = radii.get(3).copied().unwrap_or(b);
        for (index, key, fallback) in [
            (0, "border-top-left-radius", a),
            (1, "border-top-right-radius", b),
            (2, "border-bottom-left-radius", d),
            (3, "border-bottom-right-radius", c),
        ] {
            result.corners[index] = number(css.get(key).map(String::as_str).unwrap_or(fallback), self.viewport.x, self.viewport, font);
        }
        result.text_transform = css.get("text-transform").and_then(|value| style::TextTransform::parse(value));
        result.padding = style::Edges::default();
        result.margin = style::Edges::default();
        result.background = props["style"]["backgroundColor"].as_str().and_then(values::color);
        result.border_width = props["style"]["borderWidth"].as_f64().unwrap_or(0.) as f32;
        result.hidden = css.get("display").is_some_and(|v| v == "none") || css.get("visibility").is_some_and(|v| v == "hidden");
        result
    }
    fn taffy_style(&self, i: usize) -> tf::Style {
        let item = &self.boxes[i];
        let css = &item.css;
        let get = |key: &str| css.get(key).map(String::as_str).unwrap_or("");
        let font = number(get("font-size"), self.viewport.x, self.viewport, 16.).unwrap_or(16.);
        let n = |v: &str| number(v, self.viewport.x, self.viewport, font);
        let dimension = |v: &str| -> tf::Dimension {
            if let Some(v) = v.strip_suffix('%').and_then(|v| v.parse::<f32>().ok()) {
                percent(v / 100.)
            } else {
                n(v).map(length).unwrap_or_else(auto)
            }
        };
        let spacing = |v: &str| -> tf::LengthPercentageAuto {
            if v == "auto" {
                auto()
            } else if let Some(v) = v.strip_suffix('%').and_then(|v| v.parse::<f32>().ok()) {
                percent(v / 100.)
            } else {
                length(n(v).unwrap_or(0.))
            }
        };
        let lengths = |value: &str| -> tf::Rect<tf::LengthPercentageAuto> {
            let v = split(value, ' ');
            let a = v.first().copied().unwrap_or("0");
            let b = v.get(1).copied().unwrap_or(a);
            let c = v.get(2).copied().unwrap_or(a);
            let d = v.get(3).copied().unwrap_or(b);
            tf::Rect {
                top: spacing(a),
                right: spacing(b),
                bottom: spacing(c),
                left: spacing(d),
            }
        };
        let edge = |name: &str| -> tf::Rect<tf::LengthPercentageAuto> {
            let mut edges = lengths(get(name));
            for (side, slot) in [
                ("top", &mut edges.top),
                ("right", &mut edges.right),
                ("bottom", &mut edges.bottom),
                ("left", &mut edges.left),
            ] {
                if let Some(value) = css.get(&format!("{name}-{side}")) {
                    *slot = spacing(value);
                }
                let safe = &item.node.props["safeArea"];
                if safe.is_object()
                    && crate::safe_area::edge_mode(&safe["edges"], side) != "off"
                    && name == if safe["mode"] == "margin" { "margin" } else { "padding" }
                {
                    let base = slot.resolve_to_option(self.viewport.x, |_, _| 0.).unwrap_or(0.);
                    *slot = length(crate::safe_area::apply(
                        base as f64,
                        safe["insets"][side].as_f64().unwrap_or(0.),
                        crate::safe_area::edge_mode(&safe["edges"], side),
                    ) as f32);
                }
            }
            edges
        };
        let lp = |v: tf::LengthPercentageAuto| -> tf::LengthPercentage {
            let a = v.resolve_to_option(0., |_, _| 0.).unwrap_or(0.);
            let b = v.resolve_to_option(100., |_, _| 0.).unwrap_or(0.);
            if (b - a).abs() > 0.001 { percent((b - a) / 100.) } else { length(a) }
        };
        let convert = |r: tf::Rect<tf::LengthPercentageAuto>| tf::Rect {
            left: lp(r.left),
            right: lp(r.right),
            top: lp(r.top),
            bottom: lp(r.bottom),
        };
        let mut result = tf::Style {
            display: match get("display") {
                "none" => tf::Display::None,
                "grid" | "inline-grid" => tf::Display::Grid,
                "flex" | "inline-flex" => tf::Display::Flex,
                _ => tf::Display::Block,
            },
            box_sizing: if get("box-sizing") == "content-box" {
                tf::BoxSizing::ContentBox
            } else {
                tf::BoxSizing::BorderBox
            },
            size: tf::Size {
                width: dimension(get("width")),
                height: dimension(get("height")),
            },
            min_size: tf::Size {
                width: dimension(get("min-width")),
                height: dimension(get("min-height")),
            },
            max_size: tf::Size {
                width: dimension(get("max-width")),
                height: dimension(get("max-height")),
            },
            margin: edge("margin"),
            padding: convert(edge("padding")),
            flex_direction: if get("flex-direction").starts_with("column") {
                tf::FlexDirection::Column
            } else {
                tf::FlexDirection::Row
            },
            flex_wrap: if get("flex-wrap") == "wrap" {
                tf::FlexWrap::Wrap
            } else {
                tf::FlexWrap::NoWrap
            },
            flex_basis: dimension(get("flex-basis")),
            flex_grow: n(get("flex-grow")).unwrap_or(0.),
            flex_shrink: n(get("flex-shrink")).unwrap_or(1.),
            ..Default::default()
        };
        let align = |value: &str| match value {
            "center" => Some(tf::AlignItems::CENTER),
            "end" | "flex-end" => Some(tf::AlignItems::FLEX_END),
            "start" | "flex-start" => Some(tf::AlignItems::FLEX_START),
            "stretch" => Some(tf::AlignItems::STRETCH),
            "baseline" => Some(tf::AlignItems::BASELINE),
            _ => None,
        };
        result.align_items = align(get("align-items"));
        result.align_self = align(get("align-self"));
        result.justify_content = match get("justify-content") {
            "center" => Some(tf::JustifyContent::CENTER),
            "space-between" => Some(tf::JustifyContent::SPACE_BETWEEN),
            "space-around" => Some(tf::JustifyContent::SPACE_AROUND),
            "space-evenly" => Some(tf::JustifyContent::SPACE_EVENLY),
            "end" | "flex-end" => Some(tf::JustifyContent::FLEX_END),
            "start" | "flex-start" => Some(tf::JustifyContent::FLEX_START),
            _ => None,
        };
        result.align_content = match get("align-content") {
            "center" => Some(tf::AlignContent::CENTER),
            "start" | "flex-start" => Some(tf::AlignContent::FLEX_START),
            "end" | "flex-end" => Some(tf::AlignContent::FLEX_END),
            "space-between" => Some(tf::AlignContent::SPACE_BETWEEN),
            _ => None,
        };
        let placement = |value: &str| -> tf::GridPlacement {
            if let Some(span) = value.strip_prefix("span ").and_then(|v| v.trim().parse::<u16>().ok()) {
                tf::span(span)
            } else if let Ok(line) = value.parse::<i16>() {
                tf::line(line)
            } else {
                auto()
            }
        };
        for (name, slot) in [("grid-column", &mut result.grid_column), ("grid-row", &mut result.grid_row)] {
            let parts = split(get(name), '/');
            if let Some(start) = parts.first() {
                slot.start = placement(start);
                slot.end = parts.get(1).map_or_else(auto, |v| placement(v));
            }
        }
        result.justify_items = align(get("justify-items"));
        result.justify_self = align(get("justify-self"));
        if !get("place-items").is_empty() {
            result.align_items = align(get("place-items"));
            result.justify_items = align(get("place-items"));
        }
        let gaps = split(get("gap"), ' ');
        let gap = n(gaps.first().copied().unwrap_or("0")).unwrap_or(0.);
        let gapx = n(gaps.get(1).copied().unwrap_or("")).unwrap_or(gap);
        result.gap = tf::Size {
            width: length(n(get("column-gap")).unwrap_or(gapx)),
            height: length(n(get("row-gap")).unwrap_or(gap)),
        };
        if ["absolute", "fixed"].contains(&get("position")) {
            result.position = tf::Position::Absolute;
        }
        result.inset = tf::Rect {
            left: spacing(if get("left").is_empty() { "auto" } else { get("left") }),
            right: spacing(if get("right").is_empty() { "auto" } else { get("right") }),
            top: spacing(if get("top").is_empty() { "auto" } else { get("top") }),
            bottom: spacing(if get("bottom").is_empty() { "auto" } else { get("bottom") }),
        };
        if !get("inset").is_empty() {
            result.inset = lengths(get("inset"));
        }
        if matches!(get("position"), "" | "static" | "sticky") {
            result.inset = tf::Rect {
                left: auto(),
                right: auto(),
                top: auto(),
                bottom: auto(),
            };
        }
        if !get("aspect-ratio").is_empty() {
            let v = split(get("aspect-ratio"), '/');
            result.aspect_ratio = n(v[0]).map(|n| n / v.get(1).and_then(|v| v.parse::<f32>().ok()).unwrap_or(1.));
        }
        let border = get("border-width");
        let border = if border.is_empty() { get("border") } else { border };
        let size = split(border, ' ').iter().find_map(|v| n(v)).unwrap_or(0.);
        result.border = tf::Rect {
            left: length(size),
            right: length(size),
            top: length(size),
            bottom: length(size),
        };
        for (side, slot) in [
            ("top", &mut result.border.top),
            ("right", &mut result.border.right),
            ("bottom", &mut result.border.bottom),
            ("left", &mut result.border.left),
        ] {
            if let Some(value) = css.get(&format!("border-{side}-width")).or_else(|| css.get(&format!("border-{side}"))) {
                *slot = length(split(value, ' ').iter().find_map(|v| n(v)).unwrap_or(0.));
            }
        }
        let overflow = |v: &str| match v {
            "hidden" => taffy::Overflow::Hidden,
            "clip" => taffy::Overflow::Clip,
            "auto" => taffy::Overflow::Scroll,
            "scroll" => taffy::Overflow::Scroll,
            _ => taffy::Overflow::Visible,
        };
        result.overflow = taffy::geometry::Point {
            x: overflow(if get("overflow-x").is_empty() {
                get("overflow")
            } else {
                get("overflow-x")
            }),
            y: overflow(if get("overflow-y").is_empty() {
                get("overflow")
            } else {
                get("overflow-y")
            }),
        };
        let track = |value: &str| -> tf::TrackSizingFunction {
            if let Some(body) = value.strip_prefix("minmax(").and_then(|v| v.strip_suffix(')')) {
                let args = split(body, ',');
                let min: tf::MinTrackSizingFunction = match args.first().copied().unwrap_or("auto") {
                    "min-content" => tf::min_content(),
                    "max-content" => tf::max_content(),
                    "auto" => auto(),
                    v => length(n(v).unwrap_or(0.)),
                };
                let max: tf::MaxTrackSizingFunction = match args.get(1).copied().unwrap_or("1fr") {
                    "auto" => auto(),
                    "max-content" => tf::max_content(),
                    "min-content" => tf::min_content(),
                    v if v.ends_with("fr") => fr(v.trim_end_matches("fr").parse::<f32>().unwrap_or(1.)),
                    v => length(n(v).unwrap_or(0.)),
                };
                taffy::style_helpers::minmax(min, max)
            } else if let Some(v) = value.strip_suffix("fr").and_then(|v| v.parse::<f32>().ok()) {
                fr(v)
            } else if value == "max-content" {
                tf::max_content()
            } else if value == "min-content" {
                tf::min_content()
            } else if let Some(v) = n(value) {
                length(v)
            } else {
                auto()
            }
        };
        let tracks = |value: &str| -> Vec<tf::GridTemplateComponent<String>> {
            let mut output = Vec::new();
            for value in split(value, ' ') {
                if let Some(body) = value.strip_prefix("repeat(").and_then(|v| v.strip_suffix(')')) {
                    let args = split(body, ',');
                    let count = args.first().and_then(|count| count.parse::<usize>().ok()).unwrap_or(1).min(24);
                    for _ in 0..count {
                        for token in split(args.get(1).copied().unwrap_or("1fr"), ' ') {
                            output.push(track(token).into());
                        }
                    }
                } else {
                    output.push(track(value).into());
                }
            }
            output
        };
        if result.display == tf::Display::Grid {
            result.grid_template_columns = tracks(get("grid-template-columns"));
            result.grid_template_rows = tracks(get("grid-template-rows"));
            result.grid_auto_columns = split(get("grid-auto-columns"), ' ').into_iter().map(track).collect();
            result.grid_auto_rows = split(get("grid-auto-rows"), ' ').into_iter().map(track).collect();
            let flow = get("grid-auto-flow");
            let dense = flow.split_whitespace().any(|word| word == "dense");
            let column = flow.split_whitespace().any(|word| word == "column");
            result.grid_auto_flow = match (column, dense) {
                (false, false) => tf::GridAutoFlow::Row,
                (true, false) => tf::GridAutoFlow::Column,
                (false, true) => tf::GridAutoFlow::RowDense,
                (true, true) => tf::GridAutoFlow::ColumnDense,
            };
            // An indefinite block parent must size implicit rows from their contents. Taffy's
            // automatic minimum otherwise collapses clipped grid items to their border size.
            if result.grid_auto_rows.is_empty() && get("height").is_empty() && get("min-height").is_empty() {
                result.grid_auto_rows = vec![taffy::style_helpers::max_content()];
            }
        }
        result
    }

    fn build(&self, index: usize, tree: &mut tf::TaffyTree<usize>, ids: &mut HashMap<usize, tf::NodeId>) -> tf::NodeId {
        let item = &self.boxes[index];
        let children: Vec<_> = item
            .children
            .iter()
            .filter(|c| !self.boxes[**c].inline)
            .map(|c| self.build(*c, tree, ids))
            .collect();
        let style = self.taffy_style(index);
        let node = if children.is_empty() {
            tree.new_leaf_with_context(style, index).unwrap()
        } else {
            tree.new_with_children(style, &children).unwrap()
        };
        ids.insert(index, node);
        node
    }
    pub(super) fn compute(&mut self, doc: &ComponentDocument, tree_nodes: &[Node]) {
        #[cfg(test)]
        {
            self.layout_passes += 1;
        }
        self.boxes.clear();
        let roots = self.collect(tree_nodes, None, false, None);
        self.cascade(doc);
        self.inline_content(doc);
        for i in 0..self.boxes.len() {
            self.boxes[i].paint = self.paint_style(i, &doc.palette);
            if let Some(parent) = self.boxes[i].parent {
                self.boxes[i].paint.opacity *= self.boxes[parent].paint.opacity;
            }
        }
        let mut tree = tf::TaffyTree::new();
        let mut ids = HashMap::new();
        let children: Vec<_> = roots.iter().map(|i| self.build(*i, &mut tree, &mut ids)).collect();
        let root = tree
            .new_with_children(
                tf::Style {
                    display: tf::Display::Flex,
                    flex_direction: tf::FlexDirection::Column,
                    size: tf::Size {
                        width: length(self.viewport.x),
                        height: auto(),
                    },
                    ..Default::default()
                },
                &children,
            )
            .unwrap();
        let context = doc.context.clone();
        let scale = doc.font_scale.max(1.);
        let measure = |known, available, _id, index: Option<&mut usize>, _style: &tf::Style| {
            index.map_or(tf::Size::ZERO, |index| self.measure(&context, *index, known, available, scale))
        };
        // Inline-level boxes shrink to their contents in a block formatting context. Taffy's
        // flex/grid algorithms then apply the actual available width and responsive constraints.
        for i in (0..self.boxes.len()).rev() {
            let Some(id) = ids.get(&i).copied() else { continue };
            let item = &self.boxes[i];
            let display = item.css.get("display").map(String::as_str).unwrap_or(
                if matches!(item.tag.as_str(), "span" | "a" | "strong" | "em" | "b" | "small" | "label") {
                    "inline"
                } else {
                    "block"
                },
            );
            if display.starts_with("inline") && !item.css.contains_key("width") {
                let _ = tree.compute_layout_with_measure(
                    id,
                    tf::Size {
                        width: tf::AvailableSpace::MaxContent,
                        height: tf::AvailableSpace::MaxContent,
                    },
                    measure,
                );
                let width = tree.layout(id).map(|l| l.size.width).unwrap_or(0.);
                let mut style = tree.style(id).unwrap().clone();
                style.size.width = length(width);
                // Match inline formatting's containing-block constraint without stretching.
                if item.css.get("max-width").is_none() {
                    style.max_size.width = percent(1_f32);
                }
                tree.set_style(id, style).unwrap();
            }
        }
        let _ = tree.compute_layout_with_measure(
            root,
            tf::Size {
                width: tf::AvailableSpace::Definite(self.viewport.x),
                height: tf::AvailableSpace::MaxContent,
            },
            measure,
        );
        // Resolve containing-block widths after intrinsic flex/grid sizing. The block algorithm
        // can otherwise retain a min-content child layout beneath a correctly sized parent.
        let mut resolved_widths = false;
        for (index, id) in &ids {
            let item = &self.boxes[*index];
            if item.css.get("position").is_some_and(|v| matches!(v.as_str(), "absolute" | "fixed")) {
                continue;
            }
            let parent_layout = item.parent.and_then(|p| ids.get(&p)).and_then(|p| tree.layout(*p).ok());
            let parent_width = parent_layout
                .map(|layout| layout.size.width - layout.padding.left - layout.padding.right - layout.border.left - layout.border.right)
                .unwrap_or(self.viewport.x);
            let declared = item.css.get("width").map(String::as_str).unwrap_or("auto");
            let fills_block = declared == "auto"
                && tree.style(*id).is_ok_and(|s| s.display == tf::Display::Block)
                && item
                    .parent
                    .and_then(|p| ids.get(&p))
                    .is_some_and(|p| tree.style(*p).is_ok_and(|s| s.display == tf::Display::Block))
                && !matches!(
                    item.node.kind.as_str(),
                    "NImage" | "NIcon" | "NInput" | "NTextarea" | "NSelect" | "NButton" | "NLoading" | "NSpinner" | "NSkeleton"
                )
                && (item.css.get("display").is_some_and(|v| v == "block")
                    || !matches!(item.tag.as_str(), "span" | "a" | "strong" | "em" | "b" | "i" | "small" | "label" | "code"));
            let resolved = item
                .css
                .get("width")
                .filter(|v| v.contains('%'))
                .and_then(|v| number(v, parent_width, self.viewport, item.paint.text_size.unwrap_or(16.)))
                .or_else(|| {
                    fills_block.then(|| {
                        let margin = tree.layout(*id).map(|l| l.margin.left + l.margin.right).unwrap_or(0.);
                        (parent_width - margin).max(0.)
                    })
                });
            if let Some(value) = resolved {
                let width = tree.layout(*id).map(|l| l.size.width).unwrap_or(0.);
                if (width - value).abs() > 0.5 {
                    let mut style = tree.style(*id).unwrap().clone();
                    style.size.width = length(value.max(0.));
                    tree.set_style(*id, style).unwrap();
                    resolved_widths = true;
                }
            }
        }
        if resolved_widths {
            let _ = tree.compute_layout_with_measure(
                root,
                tf::Size {
                    width: tf::AvailableSpace::Definite(self.viewport.x),
                    height: tf::AvailableSpace::MaxContent,
                },
                measure,
            );
        }
        // A column flex item can keep its one-line intrinsic height after its width is
        // stretched. Linkified paragraphs must reserve every row that will be painted.
        fn linkified(sheet: &Document, index: usize) -> bool {
            sheet.boxes[index].node.props["linkify"] == true
                || sheet.boxes[index]
                    .children
                    .iter()
                    .any(|child| sheet.boxes[*child].inline && linkified(sheet, *child))
        }
        let mut wrapped_links = false;
        for (index, id) in &ids {
            let item = &self.boxes[*index];
            if !linkified(self, *index)
                || item.inline
                || item.children.iter().any(|child| !self.boxes[*child].inline)
                || item.css.get("height").is_some_and(|v| v != "auto")
            {
                continue;
            }
            let layout = tree.layout(*id).unwrap();
            let inset = layout.padding.top + layout.padding.bottom + layout.border.top + layout.border.bottom;
            let width = layout.size.width - layout.padding.left - layout.padding.right - layout.border.left - layout.border.right;
            let height = context.fonts_mut(|fonts| fonts.layout_job(self.text_job(*index, width, scale)).size().y) + inset;
            if height > layout.size.height + 0.5 {
                let mut style = tree.style(*id).unwrap().clone();
                style.min_size.height = length(height);
                tree.set_style(*id, style).unwrap();
                wrapped_links = true;
            }
        }
        if wrapped_links {
            let _ = tree.compute_layout_with_measure(
                root,
                tf::Size {
                    width: tf::AvailableSpace::Definite(self.viewport.x),
                    height: tf::AvailableSpace::MaxContent,
                },
                measure,
            );
        }
        fn locate(sheet: &mut Document, tree: &tf::TaffyTree<usize>, ids: &HashMap<usize, tf::NodeId>, i: usize, origin: Pos2) {
            let Some(id) = ids.get(&i) else {
                return;
            };
            let layout = tree.layout(*id).unwrap();
            let min = origin
                + Vec2::new(layout.location.x, layout.location.y)
                + transform::translation(&sheet.boxes[i].css, Vec2::new(layout.size.width, layout.size.height), sheet.viewport);
            sheet.boxes[i].rect = Rect::from_min_size(min, Vec2::new(layout.size.width, layout.size.height));
            sheet.boxes[i].content = Rect::from_min_max(
                min + Vec2::new(layout.padding.left + layout.border.left, layout.padding.top + layout.border.top),
                min + Vec2::new(
                    layout.size.width - layout.padding.right - layout.border.right,
                    layout.size.height - layout.padding.bottom - layout.border.bottom,
                ),
            );
            let children = sheet.boxes[i].children.clone();
            for child in children {
                locate(sheet, tree, ids, child, min);
            }
        }
        for i in roots {
            locate(self, &tree, &ids, i, Pos2::ZERO);
        }
        self.height = tree.layout(root).map(|l| l.size.height).unwrap_or(self.viewport.y).max(self.viewport.y);
        self.cache_paint_nodes();
    }
}
