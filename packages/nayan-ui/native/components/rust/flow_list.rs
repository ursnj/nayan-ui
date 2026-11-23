//! Variable-height virtual lists. Fenwick prefix sums keep scroll queries logarithmic.
use super::*;

#[derive(Clone, Default)]
struct Heights {
    count: usize,
    estimate: f32,
    values: BTreeMap<usize, f32>,
    sums: Vec<f32>,
}

impl Heights {
    fn reset(&mut self, count: usize, estimate: f32) {
        if self.count == count && self.estimate == estimate {
            return;
        }
        if self.estimate != estimate {
            self.values.clear();
        }
        self.count = count;
        self.estimate = estimate;
        self.values.retain(|i, _| *i < count);
        self.sums = vec![0.; count + 1];
        let values: Vec<_> = self.values.iter().map(|(i, h)| (*i, *h)).collect();
        for (i, h) in values {
            self.add(i, h - estimate);
        }
    }

    fn add(&mut self, index: usize, delta: f32) {
        let mut i = index + 1;
        while i <= self.count {
            self.sums[i] += delta;
            i += i & i.wrapping_neg();
        }
    }

    fn set(&mut self, index: usize, height: f32) {
        let previous = self.values.insert(index, height).unwrap_or(self.estimate);
        if (height - previous).abs() > 0.1 {
            self.add(index, height - previous);
        }
    }

    fn prefix(&self, index: usize) -> f32 {
        let mut i = index.min(self.count);
        let mut value = i as f32 * self.estimate;
        while i > 0 {
            value += self.sums[i];
            i -= i & i.wrapping_neg();
        }
        value.max(0.)
    }

    fn index(&self, offset: f32) -> usize {
        let mut lo = 0;
        let mut hi = self.count;
        while lo < hi {
            let mid = (lo + hi + 1) / 2;
            if self.prefix(mid) <= offset {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        lo.min(self.count.saturating_sub(1))
    }
}

#[derive(Default)]
pub(super) struct FlowListState {
    metrics: Heights,
    callbacks: list::ListState,
    width: f32,
    content_key: String,
    offset: f32,
    viewport: f32,
    header: f32,
    footer: f32,
    requested: Option<f32>,
    initialized: bool,
    tree_changed: bool,
    header_changed: bool,
    changed_groups: HashSet<usize>,
    pull_start: Option<Pos2>,
    pull_ready: bool,
    pin_end: bool,
}

fn estimate(p: &Value) -> f32 {
    numeric(p, &["itemSize"], 96.) as f32
}

fn columns(p: &Value) -> usize {
    p["numColumns"].as_u64().unwrap_or(1).clamp(1, 100) as usize
}

fn rows(p: &Value) -> usize {
    (p["itemCount"].as_u64().unwrap_or(0) as usize).div_ceil(columns(p))
}

fn config(p: &Value) -> String {
    json!([
        p["itemCount"],
        p["numColumns"],
        p["itemSize"],
        p["overscan"],
        p["height"],
        p["contentKey"],
        p["onEndReachedThreshold"],
        p["headerSize"],
        p["contentInsets"]
    ])
    .to_string()
}

impl FlowListState {
    pub(super) fn update_tree(&mut self, id: &str, previous: &[Node], next: &[Node]) {
        fn path<'a>(nodes: &'a [Node], id: &str, parents: &mut Vec<&'a Node>) -> bool {
            for node in nodes {
                parents.push(node);
                if node.id == id || path(&node.children, id, parents) {
                    return true;
                }
                parents.pop();
            }
            false
        }

        let mut previous_path = Vec::new();
        let mut next_path = Vec::new();
        if !path(previous, id, &mut previous_path) || !path(next, id, &mut next_path) {
            self.tree_changed = true;
            return;
        }
        let previous = previous_path.pop().unwrap();
        let next = next_path.pop().unwrap();
        if previous.props != next.props
            || previous_path.len() != next_path.len()
            || previous_path.iter().zip(&next_path).any(|(old, new)| {
                old.id != new.id || old.kind != new.kind || old.props != new.props
            })
        {
            self.tree_changed = true;
            return;
        }
        self.header_changed |= previous.children.iter().find(|n| n.kind == "NListHeader")
            != next.children.iter().find(|n| n.kind == "NListHeader");

        let mut previous_rows: HashMap<_, _> = previous
            .children
            .iter()
            .filter(|row| row.kind == "NListItem")
            .map(|row| (row.id.as_str(), row))
            .collect();
        let columns = columns(&next.props);
        for row in next.children.iter().filter(|row| row.kind == "NListItem") {
            let old_row = previous_rows.remove(row.id.as_str());
            if old_row != Some(row) {
                self.changed_groups.extend(
                    old_row
                        .into_iter()
                        .chain(std::iter::once(row))
                        .filter_map(|n| n.props["index"].as_u64())
                        .map(|index| index as usize / columns),
                );
            }
        }
        self.changed_groups.extend(
            previous_rows
                .values()
                .filter_map(|n| n.props["index"].as_u64())
                .map(|index| index as usize / columns),
        );
    }

    pub(super) fn invalidate_measurements(&mut self) {
        self.width = -1.;
    }

    fn sync(&mut self, p: &Value, width: f32) {
        let key = p["contentKey"].as_str().unwrap_or("");
        if self.width != width || self.content_key != key {
            self.metrics = Heights::default();
            self.header = 0.;
            self.footer = 0.;
            self.width = width;
            self.content_key = key.into();
        }
        self.header = self
            .header
            .max(numeric(p, &["headerSize"], 0.) as f32 + list::content_insets(p).top);
        self.footer = self.footer.max(list::content_insets(p).bottom);
        self.metrics.reset(rows(p), estimate(p));
    }

    fn range(&self, p: &Value, offset: f32, height: f32, initial: bool) -> Value {
        let count = p["itemCount"].as_u64().unwrap_or(0) as usize;
        let header = self.header.max(numeric(p, &["headerSize"], 0.) as f32);
        let total = header + self.metrics.prefix(self.metrics.count) + self.footer;
        let offset = offset.clamp(0., (total - height).max(0.));
        let first = self.metrics.index((offset - header).max(0.));
        let last = self
            .metrics
            .index((offset + height - header - 0.01).max(0.));
        let overscan = p["overscan"].as_u64().unwrap_or(4) as usize;
        let end = if initial {
            (first
                + (p["initialNumToRender"].as_u64().unwrap_or(12) as usize).div_ceil(columns(p))
                + overscan)
                .min(self.metrics.count)
        } else {
            (last + 1 + overscan).min(self.metrics.count)
        };
        let distance = (total - offset - height).max(0.);
        json!({"configuration":config(p),"start":first.saturating_sub(overscan)*columns(p),"end":(end*columns(p)).min(count),"first":if count==0 {-1}else{(first*columns(p)) as i64},"last":if count==0 {-1}else{((last+1)*columns(p)).min(count) as i64-1},"offset":offset,"viewportHeight":height,"itemCount":count,"itemSize":estimate(p),"atEnd":distance<=0.5,"nearEnd":count>0 && distance<=height*numeric(p,&["onEndReachedThreshold"],0.5) as f32,"distanceFromEnd":distance,"headerPinned":false})
    }
}

impl ComponentDocument {
    pub(super) fn plan_flow_list(&self, id: &str, p: &Value) -> Value {
        if let Some(state) = self.flow_lists.get(id) {
            let mut view = state.range(
                p,
                state.requested.unwrap_or(state.offset),
                state.viewport.max(1.),
                false,
            );
            // Reconcile a changed dataset in Rust before React materializes any row.
            if state.metrics.count != rows(p)
                || state.content_key != p["contentKey"].as_str().unwrap_or("")
            {
                let mut fresh = FlowListState::default();
                fresh.metrics = state.metrics.clone();
                fresh.width = state.width;
                fresh.content_key = state.content_key.clone();
                fresh.header = state.header;
                fresh.footer = state.footer;
                fresh.sync(p, state.width);
                fresh.viewport = state.viewport;
                view = fresh.range(
                    p,
                    if state.content_key == fresh.content_key {
                        state.offset
                    } else {
                        0.
                    },
                    state.viewport.max(1.),
                    false,
                );
            }
            view
        } else {
            let mut state = FlowListState::default();
            state.sync(p, 0.);
            state.range(p, 0., p["height"].as_f64().unwrap_or(400.) as f32, true)
        }
    }

    pub(super) fn scroll_flow_list(
        &mut self,
        id: &str,
        p: &Value,
        command: &Value,
    ) -> Result<(), String> {
        let state = self.flow_lists.entry(id.into()).or_default();
        state.sync(p, state.width);
        let height = if state.viewport > 0. {
            state.viewport
        } else {
            p["height"].as_f64().unwrap_or(400.) as f32
        };
        let total = state.header + state.metrics.prefix(state.metrics.count) + state.footer;
        let offset = match command["kind"].as_str().unwrap_or("offset") {
            "end" => {
                state.pin_end = true;
                (total - height).max(0.)
            }
            "index" => {
                let index = command["index"]
                    .as_u64()
                    .filter(|n| *n < p["itemCount"].as_u64().unwrap_or(0))
                    .ok_or("NList scroll index is out of range")?
                    as usize;
                let position = command
                    .get("viewPosition")
                    .map(|v| {
                        v.as_f64()
                            .filter(|v| v.is_finite() && (0. ..=1.).contains(v))
                            .ok_or("Invalid viewPosition")
                    })
                    .transpose()?
                    .unwrap_or(0.) as f32;
                state.header + state.metrics.prefix(index / columns(p))
                    - (height - estimate(p)).max(0.) * position
            }
            "offset" => command["offset"]
                .as_f64()
                .filter(|v| v.is_finite() && *v >= 0.)
                .ok_or("Invalid NList scroll offset")? as f32,
            _ => return Err("Unknown NList scroll command".into()),
        };
        if command["kind"] != "end" {
            state.pin_end = false;
        }
        state.requested = Some(offset.clamp(0., (total - height).max(0.)));
        Ok(())
    }

    pub(super) fn flow_list(
        &mut self,
        ui: &mut egui::Ui,
        node: &Node,
        resolved: &style::Style,
        p: &Value,
        content: &style::Style,
    ) {
        let padding = list::content_insets(p);
        let height = resolved
            .height
            .unwrap_or_else(|| {
                if p["fillViewport"] == true {
                    (ui.ctx().viewport_rect().bottom() - ui.cursor().min.y).max(80.)
                } else {
                    400.
                }
            })
            .clamp(1., 16384.);
        let width = (ui.available_width() - padding.left - padding.right).max(1.);
        let mut state = self.flow_lists.remove(&node.id).unwrap_or_default();
        state.sync(p, width);
        let tree_changed = std::mem::take(&mut state.tree_changed);
        let header_changed = std::mem::take(&mut state.header_changed);
        let changed_groups = std::mem::take(&mut state.changed_groups);
        state.viewport = height;
        if ui.input(|i| i.pointer.any_pressed()) {
            state.pin_end = false;
        }
        let mut area = egui::ScrollArea::vertical()
            .id_salt((&node.id, "flow-list"))
            .max_height(height)
            .min_scrolled_height(height)
            .auto_shrink([false, false]);
        if p["showsVerticalScrollIndicator"] == false {
            area = area.scroll_bar_visibility(egui::scroll_area::ScrollBarVisibility::AlwaysHidden);
        }
        let requested = state.requested.take();
        if let Some(offset) = requested {
            area = area.vertical_scroll_offset(offset);
        } else if state.pin_end {
            area = area.vertical_scroll_offset(
                (state.header + state.metrics.prefix(state.metrics.count) + state.footer - height)
                    .max(0.),
            );
        }
        let mut current = Value::Null;
        let output = area.show_viewport(ui, |ui, viewport| {
            content.frame(false).show(ui, |ui| {
                ui.spacing_mut().item_spacing.y = 0.;
                let origin = ui.max_rect().min - Vec2::new(0., padding.top);
                let clip = ui.clip_rect();
                if let Some(header) = node.children.iter().find(|n| n.kind == "NListHeader") {
                    let top = origin + Vec2::new(0., padding.top);
                    let cached = (state.header - padding.top).max(0.);
                    let measured = if tree_changed
                        || header_changed
                        || cached == 0.
                        || flow_part_visible(top.y, cached, clip)
                    {
                        self.measure_flow_part(ui, header, top, width, clip)
                    } else {
                        self.forget_list_bounds(std::slice::from_ref(header));
                        cached
                    };
                    let explicit = numeric(p, &["headerSize"], 0.) as f32;
                    state.header = padding.top + if explicit > 0. { explicit } else { measured };
                } else {
                    state.header = padding.top;
                }
                let mut total = state.header + state.metrics.prefix(state.metrics.count);
                if state.metrics.count == 0 {
                    if let Some(empty) = node.children.iter().find(|n| n.kind == "NListEmpty") {
                        total += self.measure_flow_part(
                            ui,
                            empty,
                            origin + Vec2::new(0., state.header),
                            width,
                            ui.clip_rect(),
                        );
                    }
                }
                let mut group_heights: BTreeMap<usize, f32> = BTreeMap::new();
                for row in node.children.iter().filter(|n| n.kind == "NListItem") {
                    let Some(index) = row.props["index"]
                        .as_u64()
                        .map(|v| v as usize)
                        .filter(|v| *v < p["itemCount"].as_u64().unwrap_or(0) as usize)
                    else {
                        continue;
                    };
                    let group = index / columns(p);
                    let cell_width = width / columns(p) as f32;
                    let top = state.header + state.metrics.prefix(group);
                    let origin = origin + Vec2::new((index % columns(p)) as f32 * cell_width, top);
                    // Keep prefix sums for measured rows outside the viewport. A tree update
                    // can change a row's height even when the user is looking elsewhere.
                    if !tree_changed
                        && !changed_groups.contains(&group)
                        && !group_heights.contains_key(&group)
                        && state
                            .metrics
                            .values
                            .get(&group)
                            .is_some_and(|height| !flow_part_visible(origin.y, *height, clip))
                    {
                        self.forget_list_bounds(std::slice::from_ref(row));
                        continue;
                    }
                    let measured = self
                        .measure_flow_part(ui, row, origin, cell_width, clip)
                        .clamp(1., 16384.);
                    let measured = group_heights
                        .entry(group)
                        .and_modify(|h| *h = h.max(measured))
                        .or_insert(measured);
                    state.metrics.set(group, *measured);
                }
                if state.metrics.count > 0 {
                    total = state.header + state.metrics.prefix(state.metrics.count);
                }
                if let Some(footer) = node.children.iter().find(|n| n.kind == "NListFooter") {
                    state.footer = padding.bottom
                        + self.measure_flow_part(
                            ui,
                            footer,
                            origin + Vec2::new(0., total),
                            width,
                            ui.clip_rect(),
                        );
                } else {
                    state.footer = padding.bottom;
                }
                ui.set_height((total + state.footer - padding.top - padding.bottom).max(0.));
                current = state.range(p, viewport.min.y, height, !state.initialized);
            });
        });
        state.initialized = true;
        state.offset = current["offset"].as_f64().unwrap_or(0.) as f32;
        if output.content_size.y > height {
            self.register_scroll_target(ui, output.id, output.inner_rect, false);
        }
        let mut refresh = false;
        ui.input(|input| {
            if input.pointer.any_pressed() && state.offset <= 0.5 && p["refreshing"] != true {
                state.pull_start = input
                    .pointer
                    .interact_pos()
                    .filter(|pos| output.inner_rect.contains(*pos));
                state.pull_ready = false;
            }
            if let (Some(start), Some(pos)) = (state.pull_start, input.pointer.interact_pos()) {
                if pos.y - start.y > 64. {
                    state.pull_ready = true;
                }
            }
            if input.pointer.any_released() {
                refresh = state.pull_ready && p["canRefresh"] == true;
                state.pull_start = None;
                state.pull_ready = false;
            }
        });
        if state.pull_ready || p["refreshing"] == true {
            ui.painter().circle_stroke(
                output.inner_rect.center_top() + Vec2::new(0., 20.),
                8.,
                egui::Stroke::new(2., self.palette.get("accent")),
            );
        }
        if requested.is_none() {
            state.callbacks.retain_window(
                &mut current,
                p["overscan"].as_u64().unwrap_or(4) as usize,
                columns(p),
            );
        }
        if let Some(mut event) = state.callbacks.window_notification(&current, &node.children, self.elapsed) {
            event["refreshRequested"] = json!(refresh);
            self.change(&node.id, event);
        } else if refresh {
            let mut event = current.clone();
            event["refreshRequested"] = json!(true);
            self.change(&node.id, event);
        }
        self.flow_lists.insert(node.id.clone(), state);
        let response = ui.interact(
            output.inner_rect,
            egui::Id::unique((&node.id, "flow-viewport")),
            egui::Sense::hover(),
        );
        self.semantic(ui, node, &response, current);
    }

    fn measure_flow_part(
        &mut self,
        ui: &mut egui::Ui,
        node: &Node,
        origin: Pos2,
        width: f32,
        clip: Rect,
    ) -> f32 {
        let mut child = ui.new_child(
            egui::UiBuilder::new()
                .max_rect(Rect::from_min_size(origin, Vec2::new(width, 16384.)))
                .layout(egui::Layout::top_down(egui::Align::Min)),
        );
        child.set_clip_rect(clip);
        self.one(&mut child, node);
        (child.min_rect().bottom() - origin.y).max(0.)
    }
}

fn flow_part_visible(top: f32, height: f32, clip: Rect) -> bool {
    top <= clip.max.y && top + height >= clip.min.y
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cached_offscreen_rows_skip_layout_and_keep_scroll_geometry() {
        for columns in [1, 2] {
            let tree = |last_height: f32| {
                let mut children =
                    vec![json!({"id":"header","kind":"NListHeader","props":{"height":72}})];
                children.extend((0..16).map(|i| {
                    let height = if i == 15 { last_height } else { 100. };
                    json!({"id":format!("row-{i}"),"kind":"NListItem","props":{"index":i,"height":height}})
                }));
                json!([{"id":"list","kind":"NList","props":{
                    "itemCount":16,"itemSize":100,"numColumns":columns,"variableSize":true,"height":220
                },"children":children}])
            };
            let mut doc = ComponentDocument::default();
            doc.set_tree(&tree(100.)).unwrap();
            doc.frame(360., 260., 1.).drop_without_applying_deltas();
            doc.frame(360., 260., 1.).drop_without_applying_deltas();
            assert!(doc.layout_bounds("row-15").is_none());
            let metrics = &doc.flow_lists["list"].metrics;
            assert_eq!(metrics.values.len(), metrics.count);
            let before = metrics.prefix(metrics.count);

            doc.set_tree(&tree(160.)).unwrap();
            doc.frame(360., 260., 1.).drop_without_applying_deltas();
            let metrics = &doc.flow_lists["list"].metrics;
            assert!((metrics.prefix(metrics.count) - before - 60.).abs() < 0.1);

            doc.command(&json!({"action":"listScroll","id":"list","kind":"end"}))
                .unwrap();
            doc.frame(360., 260., 1.).drop_without_applying_deltas();
            doc.frame(360., 260., 1.).drop_without_applying_deltas();
            assert!(doc.layout_bounds("header").is_none());
            let [_, y, _, height] = doc.layout_bounds("row-15").unwrap();
            assert!(y < 220. && y + height > 0.);

            let mut shifted = tree(160.);
            shifted[0]["children"].as_array_mut().unwrap().drain(1..3);
            doc.set_tree(&shifted).unwrap();
            doc.frame(360., 260., 1.).drop_without_applying_deltas();
            assert!(doc.layout_bounds("header").is_none());
            assert!(doc.layout_bounds("row-4").is_none());
            assert!(doc.layout_bounds("row-15").is_some());
        }
    }

    #[test]
    fn measured_prefix_sums_handle_growth_shrinkage_and_large_jumps() {
        let mut h = Heights::default();
        h.reset(100000, 80.);
        h.set(0, 120.);
        h.set(500, 200.);
        assert_eq!(h.prefix(501), 40240.);
        assert_eq!(h.index(40120.), 500);
        h.reset(100001, 80.);
        assert_eq!(h.prefix(501), 40240.);
        h.reset(10, 80.);
        assert_eq!(h.prefix(10), 840.);
    }
}
