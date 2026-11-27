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
        let previous = self.values.get(&index).copied();
        let delta = height - previous.unwrap_or(self.estimate);
        if previous.is_none() || delta.abs() > 0.1 {
            self.values.insert(index, height);
            self.add(index, delta);
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
        let mut index = 0;
        let mut measured_delta = 0.;
        let mut step = self.count.checked_ilog2().map_or(0, |power| 1 << power);
        while step != 0 {
            let next = index + step;
            if next <= self.count {
                let delta = measured_delta + self.sums[next];
                if next as f32 * self.estimate + delta <= offset {
                    index = next;
                    measured_delta = delta;
                }
            }
            step >>= 1;
        }
        index.min(self.count.saturating_sub(1))
    }
}

#[derive(Default)]
pub(super) struct FlowListState {
    metrics: Heights,
    masonry: Vec<Heights>,
    item_count: usize,
    callbacks: list::ListState,
    width: f32,
    content_key: String,
    offset: f32,
    viewport: f32,
    header: f32,
    footer: f32,
    requested: Option<f32>,
    size_correction: Option<f32>,
    initialized: bool,
    tree_changed: bool,
    header_changed: bool,
    changed_groups: HashSet<usize>,
    measured_groups: HashMap<usize, f32>,
    mounted_columns: Vec<Option<(usize, usize)>>,
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

fn measurement_group(p: &Value, index: usize) -> usize {
    if p["masonry"] == true { index } else { index / columns(p) }
}

fn config(p: &Value) -> String {
    json!([
        p["itemCount"],
        p["numColumns"],
        p["masonry"],
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
        for row in next.children.iter().filter(|row| row.kind == "NListItem") {
            let old_row = previous_rows.remove(row.id.as_str());
            if old_row != Some(row) {
                self.changed_groups.extend(
                    old_row
                        .into_iter()
                        .chain(std::iter::once(row))
                        .filter_map(|n| n.props["index"].as_u64())
                        .map(|index| measurement_group(&next.props, index as usize)),
                );
            }
        }
        self.changed_groups.extend(
            previous_rows
                .values()
                .filter_map(|n| n.props["index"].as_u64())
                .map(|index| measurement_group(&next.props, index as usize)),
        );
    }

    pub(super) fn invalidate_measurements(&mut self) {
        self.width = -1.;
    }

    fn sync(&mut self, p: &Value, width: f32) {
        let key = p["contentKey"].as_str().unwrap_or("");
        if self.width != width || self.content_key != key {
            self.metrics = Heights::default();
            self.masonry.clear();
            self.header = 0.;
            self.footer = 0.;
            self.size_correction = None;
            self.width = width;
            self.content_key = key.into();
        }
        self.header = self
            .header
            .max(numeric(p, &["headerSize"], 0.) as f32 + list::content_insets(p).top);
        self.footer = self.footer.max(list::content_insets(p).bottom);
        self.item_count = p["itemCount"].as_u64().unwrap_or(0) as usize;
        if p["masonry"] == true {
            let count = columns(p);
            if self.masonry.len() != count {
                self.masonry = vec![Heights::default(); count];
                self.metrics = Heights::default();
            }
            for (index, column) in self.masonry.iter_mut().enumerate() {
                column.reset(self.item_count.saturating_sub(index).div_ceil(count), estimate(p));
            }
        } else {
            self.masonry.clear();
            self.metrics.reset(rows(p), estimate(p));
        }
    }

    fn body_height(&self) -> f32 {
        if self.masonry.is_empty() {
            self.metrics.prefix(self.metrics.count)
        } else {
            self.masonry.iter().map(|column| column.prefix(column.count)).fold(0., f32::max)
        }
    }

    fn item_top(&self, index: usize, column_count: usize) -> f32 {
        let row = index / column_count;
        self.masonry.get(index % column_count).unwrap_or(&self.metrics).prefix(row)
    }

    fn visible_anchor(&self, offset: f32, columns: usize) -> Option<(usize, f32)> {
        let top = offset - self.header;
        if self.item_count == 0 || top < 0. || offset < 0.5 {
            return None;
        }
        if self.masonry.is_empty() {
            let row = self.metrics.index(top);
            return Some((row * columns, self.header + self.metrics.prefix(row)));
        }
        self.masonry.iter().enumerate().filter_map(|(index, column)| {
            if column.count == 0 || top >= column.prefix(column.count) { return None; }
            let row = column.index(top);
            Some((row * columns + index, self.header + column.prefix(row)))
        }).max_by(|(_, a), (_, b)| a.total_cmp(b))
    }

    fn paint_offset(&mut self, children: &[Node], desired: f32, height: f32, columns: usize) -> f32 {
        if self.masonry.is_empty() {
            return list::mounted_window(children, self.item_count).map_or(desired, |(start, end)| {
                list::mounted_offset(desired, height, 0., self.header + self.item_top(start, columns),
                    self.header + self.item_top(end, columns), start > 0, end < self.item_count)
            });
        }
        self.mounted_columns.resize(columns, None);
        self.mounted_columns.fill(None);
        for child in children.iter().filter(|node| node.kind == "NListItem") {
            if let Some(index) = child.props["index"].as_u64().map(|n| n as usize).filter(|n| *n < self.item_count) {
                let row = index / columns;
                let span = self.mounted_columns[index % columns].get_or_insert((row, row + 1));
                span.1 = row + 1;
            }
        }
        let mut lower: f32 = 0.;
        let mut upper = f32::INFINITY;
        for (column, span) in self.masonry.iter().zip(&self.mounted_columns) {
            if let Some((start, end)) = *span {
                if start > 0 {
                    lower = lower.max(self.header + column.prefix(start));
                }
                if end < column.count {
                    upper = upper.min(self.header + column.prefix(end) - height);
                }
            }
        }
        list::covered_offset(desired, Some(lower), Some(upper))
    }

    fn masonry_windows(&self, top: f32, height: f32, p: &Value, velocity: f32) -> (Vec<Value>, Vec<Value>) {
        let count = self.masonry.len();
        let overscan = p["overscan"].as_u64().unwrap_or(4) as f32 * estimate(p);
        let ahead = (velocity.abs() * 0.12).min(height).min(overscan);
        let before = overscan + if velocity < 0. { ahead } else { 0. };
        let after = overscan + if velocity > 0. { ahead } else { 0. };
        let span = |column: &Heights, index: usize, from: f32, to: f32| {
            if column.count == 0 || to <= 0. || from >= column.prefix(column.count) {
                return None;
            }
            let start = column.index(from.max(0.)) * count + index;
            let end = ((column.index(to - 0.001) + 1) * count + index).min(self.item_count);
            Some(json!({"start":start,"end":end,"step":count}))
        };
        let mut mounted = Vec::with_capacity(count);
        let mut visible = Vec::with_capacity(count);
        for (index, column) in self.masonry.iter().enumerate() {
            mounted.extend(span(column, index, top - before, top.max(0.) + height + after));
            visible.extend(span(column, index, top, top + height));
        }
        (mounted, visible)
    }

    fn range(&self, p: &Value, offset: f32, height: f32, initial: bool) -> Value {
        let count = p["itemCount"].as_u64().unwrap_or(0) as usize;
        let header = self.header.max(numeric(p, &["headerSize"], 0.) as f32);
        let total = header + self.body_height() + self.footer;
        let offset = offset.clamp(0., (total - height).max(0.));
        if !self.masonry.is_empty() {
            return self.masonry_range(p, offset, height, 0.);
        }
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

    fn masonry_range(&self, p: &Value, offset: f32, height: f32, velocity: f32) -> Value {
        let distance = (self.header + self.body_height() + self.footer - offset - height).max(0.);
        let (ranges, visible) = self.masonry_windows(offset - self.header, height, p, velocity);
        let first = visible.iter().filter_map(|range| range["start"].as_i64()).min().unwrap_or(-1);
        let last = visible.iter().map(|range| {
            let start = range["start"].as_i64().unwrap();
            let end = range["end"].as_i64().unwrap();
            let step = self.masonry.len() as i64;
            start + (end - start - 1) / step * step
        }).max().unwrap_or(-1);
        json!({"configuration":config(p),"start":0,"end":0,"ranges":ranges,"visibleRanges":visible,
            "first":first,"last":last,"offset":offset,"viewportHeight":height,"itemCount":self.item_count,
            "itemSize":estimate(p),"atEnd":distance<=0.5,"nearEnd":self.item_count>0 && distance<=height*numeric(p,&["onEndReachedThreshold"],0.5) as f32,
            "distanceFromEnd":distance,"headerPinned":false})
    }

    fn initial_offset(&self, p: &Value) -> f32 {
        let count = p["itemCount"].as_u64().unwrap_or(0);
        let index = p["initialScrollIndex"].as_u64().unwrap_or(0).min(count.saturating_sub(1));
        if index == 0 {
            0.
        } else {
            self.header + self.item_top(index as usize, columns(p))
        }
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
            if state.item_count != p["itemCount"].as_u64().unwrap_or(0) as usize
                || state.masonry.len() != (if p["masonry"] == true { columns(p) } else { 0 })
                || (state.masonry.is_empty() && state.metrics.count != rows(p))
                || state.content_key != p["contentKey"].as_str().unwrap_or("")
            {
                let mut fresh = FlowListState::default();
                fresh.metrics = state.metrics.clone();
                fresh.masonry = state.masonry.clone();
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
            state.range(p, state.initial_offset(p), p["height"].as_f64().unwrap_or(400.) as f32, true)
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
        let total = state.header + state.body_height() + state.footer;
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
                let row = index / columns(p);
                let metric = state.masonry.get(index % columns(p)).unwrap_or(&state.metrics);
                let top = metric.prefix(row);
                let row_height = metric.prefix(row + 1) - top;
                state.header + top - (height - row_height).max(0.) * position
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
        let width_changed = state.width != width;
        state.sync(p, width);
        let tree_changed = std::mem::take(&mut state.tree_changed);
        let header_changed = std::mem::take(&mut state.header_changed);
        let changed_groups = std::mem::take(&mut state.changed_groups);
        let measurements_changed = width_changed || tree_changed || header_changed || !changed_groups.is_empty();
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
        let size_correction = state.size_correction.take();
        if let Some(offset) = requested {
            area = area.vertical_scroll_offset(offset);
        } else if state.pin_end {
            area = area.vertical_scroll_offset(
                (state.header + state.body_height() + state.footer - height)
                    .max(0.),
            );
        } else if let Some(offset) = size_correction {
            area = area.vertical_scroll_offset(offset);
        } else if !state.initialized {
            area = area.vertical_scroll_offset(state.initial_offset(p));
        }
        let output = list::show_list_viewport(self.native, area, ui, |ui, viewport| {
            content.frame(false).show(ui, |ui| {
                ui.spacing_mut().item_spacing.y = 0.;
                let column_count = columns(p);
                let offset = if self.native {
                    state.paint_offset(&node.children, viewport.min.y, height, column_count)
                } else {
                    viewport.min.y
                };
                let origin = ui.max_rect().min + Vec2::new(0., viewport.min.y - offset - padding.top);
                let clip = ui.clip_rect();
                let anchor = if measurements_changed && !state.pin_end && offset == viewport.min.y {
                    state.visible_anchor(offset, column_count)
                } else { None };
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
                let mut total = state.header + state.body_height();
                if state.item_count == 0 {
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
                state.measured_groups.clear();
                let cell_width = width / column_count as f32;
                let item_count = state.item_count;
                let masonry = !state.masonry.is_empty();
                for row in node.children.iter().filter(|n| n.kind == "NListItem") {
                    let Some(index) = row.props["index"]
                        .as_u64()
                        .map(|v| v as usize)
                        .filter(|v| *v < item_count)
                    else {
                        continue;
                    };
                    let column = index % column_count;
                    let row_index = index / column_count;
                    let group = if masonry { index } else { row_index };
                    let metrics = state.masonry.get_mut(column).unwrap_or(&mut state.metrics);
                    let top = state.header + metrics.prefix(row_index);
                    let origin = origin + Vec2::new(column as f32 * cell_width, top);
                    // Keep prefix sums for measured rows outside the viewport. A tree update
                    // can change a row's height even when the user is looking elsewhere.
                    if !tree_changed
                        && !changed_groups.contains(&group)
                        && !state.measured_groups.contains_key(&group)
                        && metrics.values.get(&row_index)
                            .is_some_and(|height| !flow_part_visible(origin.y, *height, clip))
                    {
                        self.forget_list_bounds(std::slice::from_ref(row));
                        continue;
                    }
                    let measured = self
                        .measure_flow_part(ui, row, origin, cell_width, clip)
                        .clamp(1., 16384.);
                    let measured = if masonry { measured } else {
                        *state.measured_groups.entry(group).and_modify(|h| *h = h.max(measured)).or_insert(measured)
                    };
                    metrics.set(row_index, measured);
                }
                if state.item_count > 0 {
                    total = state.header + state.body_height();
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
                let delta = anchor.map_or(0., |(index, before)| state.header + state.item_top(index, column_count) - before);
                (viewport.min.y, delta)
            }).inner
        });
        let (drawn_offset, size_delta) = output.inner;
        let offset = if size_delta.abs() > 0.1 {
            // Anchor the content that was drawn before the new sizes changed the scroll bounds.
            let corrected = drawn_offset + size_delta;
            state.size_correction = Some(corrected.max(0.));
            ui.ctx().request_repaint();
            corrected
        } else {
            drawn_offset
        };
        let mut current = if state.masonry.is_empty() {
            state.range(p, offset, height, !state.initialized)
        } else {
            state.masonry_range(p, offset.clamp(0., (state.header + state.body_height() + state.footer - height).max(0.)), height, list::scroll_velocity(ui, &output))
        };
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
        if requested.is_none() && state.masonry.is_empty() {
            state.callbacks.prepare_window(
                &mut current,
                p["overscan"].as_u64().unwrap_or(4) as usize,
                columns(p),
                list::scroll_velocity(ui, &output),
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

    #[test]
    fn measured_offsets_match_prefixes_and_keep_small_height_changes() {
        let mut heights = Heights::default();
        heights.reset(127, 80.);
        for index in (0..127).step_by(3) {
            heights.set(index, 30. + (index % 17) as f32 * 18.);
        }
        for row in 0..127 {
            assert_eq!(heights.index(heights.prefix(row)), row);
            assert_eq!(heights.index(heights.prefix(row + 1) - 0.5), row);
        }
        let starting_height = heights.prefix(1);
        heights.set(0, starting_height + 0.08);
        heights.set(0, starting_height + 0.16);
        assert!((heights.prefix(1) - starting_height - 0.16).abs() < 0.001);
    }

    #[test]
    fn remeasuring_rows_above_the_viewport_keeps_the_visible_row_in_place() {
        let tree = |first_height: f32| {
            let children = (0..20).map(|index| {
                let height = if index == 0 { first_height } else { 80. };
                json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index,"height":height}})
            }).collect::<Vec<_>>();
            json!([{"id":"list","kind":"NList","props":{
                "itemCount":20,"itemSize":80,"variableSize":true,"height":240
            },"children":children}])
        };
        let mut doc = ComponentDocument::default();
        doc.set_tree(&tree(80.)).unwrap();
        let frame = |doc: &mut ComponentDocument| doc.frame(360., 260., 1.).drop_without_applying_deltas();
        frame(&mut doc);
        doc.command(&json!({"action":"listScroll","id":"list","kind":"offset","offset":425})).unwrap();
        frame(&mut doc);
        let before = doc.layout_bounds("row-6").unwrap()[1];
        for height in [180., 45.] {
            doc.set_tree(&tree(height)).unwrap();
            frame(&mut doc);
            frame(&mut doc);
            let after = doc.layout_bounds("row-6").unwrap()[1];
            assert!((after - before).abs() < 0.2, "row moved from {before} to {after}");
        }
    }

    #[test]
    fn variable_lists_plan_and_render_the_initial_index() {
        let props = json!({"itemCount":100,"itemSize":80,"variableSize":true,"height":240,"initialScrollIndex":50});
        let mut doc = ComponentDocument::default();
        let plan = doc.plan_list(&json!({"id":"list","props":props})).unwrap();
        assert_eq!(plan["first"], 50);
        let children = (46..62).map(|index| {
            json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index,"height":80}})
        }).collect::<Vec<_>>();
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":props,"children":children}])).unwrap();
        doc.frame(360., 260., 1.).drop_without_applying_deltas();
        assert!(doc.layout_bounds("row-50").is_some());
    }

    #[test]
    fn masonry_packs_columns_and_plans_only_nearby_items_in_each_column() {
        let props = json!({"itemCount":500,"itemSize":100,"variableSize":true,"numColumns":2,"masonry":true,"height":300,"overscan":2});
        let mut doc = ComponentDocument::default();
        let children = (0..28).map(|index| {
            let height = if index % 2 == 0 { 65 } else { 130 };
            json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index,"height":height}})
        }).collect::<Vec<_>>();
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":props,"children":children}])).unwrap();
        doc.frame(360., 340., 1.).drop_without_applying_deltas();
        let [left, _, _, _] = doc.layout_bounds("row-0").unwrap();
        let [right, _, _, _] = doc.layout_bounds("row-1").unwrap();
        assert!(right > left);
        assert_eq!(doc.layout_bounds("row-2").unwrap()[1], 65.);
        assert_eq!(doc.layout_bounds("row-3").unwrap()[1], 130.);
        doc.command(&json!({"action":"listScroll","id":"list","offset":1000})).unwrap();
        let plan = doc.plan_list(&json!({"id":"list","props":props})).unwrap();
        let ranges = plan["ranges"].as_array().unwrap();
        assert_eq!(ranges.len(), 2);
        assert_eq!(ranges[0]["step"], 2);
        let first_left = ranges[0]["start"].as_u64().unwrap();
        let first_right = ranges[1]["start"].as_u64().unwrap();
        assert!(first_left > first_right);
        let materialized: u64 = ranges.iter().map(|range| {
            (range["end"].as_u64().unwrap() - range["start"].as_u64().unwrap()).div_ceil(2)
        }).sum();
        assert!(materialized < 24);
    }
}
