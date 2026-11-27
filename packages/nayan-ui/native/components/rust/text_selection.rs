//! Browser text selection uses the renderer's shaped character positions, never DOM font metrics.
use super::*;
use std::{ops::Range, sync::Arc};
use unicode_segmentation::UnicodeSegmentation;
pub(super) const COPY_ID: &str = "__engine:text-selection:copy";

#[derive(PartialEq)]
pub(super) struct Block {
    pub key: usize,
    pub id: String,
    pub text: String,
    pub len: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn selection(texts: &[&str]) -> Selection {
        let mut selection = Selection::default();
        selection.set_blocks(
            texts
                .iter()
                .enumerate()
                .map(|(key, text)| Block {
                    key,
                    id: key.to_string(),
                    text: (*text).into(),
                    len: text.chars().count(),
                })
                .collect(),
        );
        let context = egui::Context::default();
        crate::components::fonts::configure(&context);
        context
            .run_ui(Default::default(), |ui| {
                for (key, text) in texts.iter().enumerate() {
                    let galley = ui.fonts_mut(|fonts| fonts.layout((*text).into(), egui::FontId::proportional(16.), Color32::WHITE, 120.));
                    let origin = Pos2::new(20., 20. + key as f32 * 200.);
                    let bounds = Rect::from_min_size(origin, galley.size());
                    selection.register(key, galley, origin, Rect::EVERYTHING, bounds);
                }
            })
            .drop_without_applying_deltas();
        selection
    }

    fn point(selection: &Selection, key: usize, character: usize) -> Pos2 {
        let run = selection.runs.iter().find(|run| run.key == key).unwrap();
        run.galley.pos_from_cursor(egui::text::CCursor::new(character)).center() + run.origin.to_vec2()
    }

    fn command(selection: &mut Selection, phase: &str, point: Pos2) -> bool {
        selection.command(&json!({"phase":phase,"x":point.x,"y":point.y}))
    }

    #[test]
    fn forward_and_reverse_drags_copy_unicode_across_wrapped_paragraphs_without_soft_newlines() {
        let texts = ["A café 🌍 with several wrapped words.", "Next paragraph — नमस्ते!"];
        for reverse in [false, true] {
            let mut selection = selection(&texts);
            let (a, b) = (point(&selection, 0, 2), point(&selection, 1, 14));
            let (a, b) = if reverse { (b, a) } else { (a, b) };
            command(&mut selection, "start", a);
            assert!(command(&mut selection, "move", b));
            command(&mut selection, "end", b);
            assert_eq!(
                selection.text,
                format!(
                    "{}\n{}",
                    texts[0].chars().skip(2).collect::<String>(),
                    texts[1].chars().take(14).collect::<String>()
                )
            );
        }
    }

    #[test]
    fn unicode_words_paragraphs_select_all_offscreen_and_clear_follow_the_same_ranges() {
        let mut selection = selection(&["café नमस्ते world", "Offscreen text"]);
        let p = point(&selection, 0, 7);
        assert!(command(&mut selection, "word", p));
        assert_eq!(selection.text, "नमस्ते");
        command(&mut selection, "block", p);
        assert_eq!(selection.text, "café नमस्ते world");
        selection.runs.pop();
        command(&mut selection, "all", p);
        assert_eq!(selection.text, "café नमस्ते world\nOffscreen text");
        command(&mut selection, "clear", p);
        assert!(selection.text.is_empty());
        command(&mut selection, "all", p);
        selection.set_blocks(vec![]);
        assert!(selection.text.is_empty(), "navigation must clear a selection from the previous page");
    }

    #[test]
    fn clicks_do_not_consume_links_dragging_can_scroll_and_rotated_text_uses_transformed_hit_tests() {
        let mut selection = selection(&["Selectable link text"]);
        let p = point(&selection, 0, 3);
        assert!(!command(&mut selection, "start", p));
        assert!(!command(&mut selection, "end", p));
        assert!(selection.text.is_empty());
        command(&mut selection, "start", p);
        command(&mut selection, "move", Pos2::new(p.x + 10., 610.));
        assert!(selection.scroll_delta(600.) > 0.);
        command(&mut selection, "end", p);
        assert_eq!(selection.scroll_delta(600.), 0.);
        selection.clear();
        let center = Pos2::new(100., 100.);
        let angle = 0.4;
        selection.rotate(0, center, angle);
        let transformed = center + egui::emath::Rot2::from_angle(angle) * (p - center);
        command(&mut selection, "word", transformed);
        assert_eq!(selection.text, "Selectable");
    }

    #[test]
    fn reverse_selection_starts_in_line_end_space_and_word_selection_uses_the_glyph_under_the_pointer() {
        let mut selection = selection(&["A café next"]);
        let start = point(&selection, 0, 0);
        let end = point(&selection, 0, 11);
        selection.runs[0].bounds.max.x += 30.;
        command(&mut selection, "start", end + Vec2::new(20., 0.));
        command(&mut selection, "move", start);
        command(&mut selection, "end", start);
        assert_eq!(selection.text, "A café next");
        command(&mut selection, "word", start + Vec2::new(6., 0.));
        assert_eq!(selection.text, "A");
    }

    #[test]
    fn long_press_selects_a_word_and_exposes_copy_but_an_ordinary_touch_swipe_remains_a_scroll() {
        let mut selection = selection(&["Touch selectable words"]);
        let p = point(&selection, 0, 2);
        command(&mut selection, "touchStart", p);
        assert!(!selection.tick(0.3));
        command(&mut selection, "touchMove", p + Vec2::new(0., -20.));
        assert!(!selection.tick(1.));
        assert!(selection.text.is_empty());
        command(&mut selection, "touchStart", p);
        assert!(selection.tick(1.5));
        assert_eq!(selection.text, "Touch");
        assert!(command(&mut selection, "touchEnd", p));
        assert_eq!(selection.text, "Touch");
        assert!(selection.menu.is_some());
        let handle = selection.handle(selection.bounds().unwrap().1).unwrap();
        assert!(command(&mut selection, "touchStart", handle));
        let to = point(&selection, 0, 16);
        command(&mut selection, "touchMove", to);
        command(&mut selection, "touchEnd", to);
        assert_eq!(selection.text, "Touch selectable");
    }
}

struct Run {
    key: usize,
    galley: Arc<egui::Galley>,
    origin: Pos2,
    clip: Rect,
    bounds: Rect,
    rotations: Vec<(Pos2, f32)>,
}

impl Run {
    fn local(&self, mut point: Pos2) -> Pos2 {
        for (center, angle) in self.rotations.iter().rev() {
            point = *center + egui::emath::Rot2::from_angle(-angle) * (point - *center);
        }
        point
    }
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Position {
    block: usize,
    character: usize,
}

#[derive(Default)]
pub(super) struct Selection {
    blocks: Vec<Block>,
    runs: Vec<Run>,
    anchor: Option<Position>,
    focus: Option<Position>,
    start: Option<Pos2>,
    pointer: Option<Pos2>,
    dragging: bool,
    pending_touch: Option<(Pos2, f64)>,
    touch_selection: bool,
    clock: f64,
    pub menu: Option<Pos2>,
    pub text: String,
    pub revision: u64,
}

impl Selection {
    pub fn set_blocks(&mut self, blocks: Vec<Block>) {
        if self.blocks != blocks {
            self.clear();
            self.blocks = blocks;
        }
    }

    pub fn begin_frame(&mut self) {
        self.runs.clear();
    }

    pub fn run_count(&self) -> usize {
        self.runs.len()
    }

    pub fn rotate(&mut self, from: usize, center: Pos2, angle: f32) {
        for run in &mut self.runs[from..] {
            run.rotations.push((center, angle));
        }
    }

    pub fn register(&mut self, key: usize, galley: Arc<egui::Galley>, origin: Pos2, clip: Rect, bounds: Rect) {
        self.runs.push(Run {
            key,
            galley,
            origin,
            clip,
            bounds,
            rotations: Vec::new(),
        });
    }

    fn hit(&self, point: Pos2, nearest: bool) -> Option<Position> {
        let mut best = None;
        let mut distance = f32::INFINITY;
        for run in self.runs.iter().rev() {
            let point = run.local(point);
            let rect = run.bounds.intersect(run.clip);
            if !rect.is_positive() {
                continue;
            }
            let local = point - run.origin;
            let contains = rect.contains(point);
            if !contains && !nearest {
                continue;
            }
            let d = (point - rect.clamp(point)).length_sq();
            if contains || d < distance {
                best = Some(Position {
                    block: run.key,
                    character: run.galley.cursor_from_pos(local).index.0,
                });
                distance = d;
                if contains {
                    break;
                }
            }
        }
        best
    }

    pub fn hovered(&self, key: usize, point: Pos2) -> bool {
        self.runs.last().filter(|run| run.key == key).is_some_and(|run| {
            let point = run.local(point);
            run.clip.contains(point) && run.galley.rows.iter().any(|row| row.rect().contains((point - run.origin).to_pos2()))
        })
    }

    fn bounds(&self) -> Option<(Position, Position)> {
        let (a, b) = (self.anchor?, self.focus?);
        Some((a.min(b), a.max(b)))
    }

    fn range(&self, key: usize, len: usize) -> Option<Range<usize>> {
        let (a, b) = self.bounds()?;
        if key < a.block || key > b.block {
            return None;
        }
        let start = if key == a.block { a.character.min(len) } else { 0 };
        let end = if key == b.block { b.character.min(len) } else { len };
        (start < end).then_some(start..end)
    }

    fn refresh(&mut self) {
        let mut parts = Vec::new();
        for block in &self.blocks {
            if let Some(range) = self.range(block.key, block.len) {
                parts.push(block.text.chars().skip(range.start).take(range.end - range.start).collect::<String>());
            }
        }
        let text = parts.join("\n");
        if text != self.text {
            self.text = text;
            self.revision += 1;
        }
    }

    fn clear(&mut self) {
        self.anchor = None;
        self.focus = None;
        self.start = None;
        self.pointer = None;
        self.dragging = false;
        self.pending_touch = None;
        self.touch_selection = false;
        self.menu = None;
        self.refresh();
    }

    /// Returns whether the pointer event belongs to selection rather than a control/scroll gesture.
    pub fn command(&mut self, value: &Value) -> bool {
        let point = Pos2::new(numeric(value, &["x"], 0.) as f32, numeric(value, &["y"], 0.) as f32);
        if !point.x.is_finite() || !point.y.is_finite() {
            return false;
        }
        match value["phase"].as_str().unwrap_or("") {
            "touchStart" => {
                if self.touch_selection {
                    if let Some((first, last)) = self.bounds() {
                        for (position, opposite) in [(first, last), (last, first)] {
                            if self.handle(position).is_some_and(|handle| handle.distance(point) <= 16.) {
                                self.anchor = Some(opposite);
                                self.focus = Some(position);
                                self.start = Some(point);
                                self.pointer = Some(point);
                                self.dragging = true;
                                self.menu = None;
                                return true;
                            }
                        }
                    }
                }
                self.clear();
                if self.hit(point, false).is_some() {
                    self.pending_touch = Some((point, self.clock));
                }
                false
            }
            "touchMove" => {
                if let Some((start, _)) = self.pending_touch {
                    if start.distance(point) >= 8. {
                        self.clear();
                    }
                    false
                } else if self.touch_selection {
                    let mut value = value.clone();
                    value["phase"] = json!("move");
                    self.command(&value)
                } else {
                    false
                }
            }
            "touchEnd" => {
                if self.pending_touch.is_some() {
                    self.clear();
                    return false;
                }
                if !self.touch_selection {
                    return false;
                }
                if !self.dragging {
                    self.start = None;
                    self.pointer = None;
                    self.menu = Some(point);
                    return true;
                }
                let mut value = value.clone();
                value["phase"] = json!("end");
                let handled = self.command(&value);
                if !self.text.is_empty() {
                    self.menu = Some(point);
                }
                handled
            }
            "menu" => {
                if !self.text.is_empty() {
                    self.menu = Some(point);
                    true
                } else {
                    false
                }
            }
            "start" => {
                let hit = self.hit(point, false);
                let extend = value["extend"] == true && self.anchor.is_some() && hit.is_some();
                if !extend {
                    self.clear();
                }
                if let Some(hit) = hit {
                    if !extend {
                        self.anchor = Some(hit);
                    }
                    self.focus = Some(hit);
                    self.start = Some(point);
                    self.pointer = Some(point);
                    self.dragging = extend;
                    self.refresh();
                }
                extend
            }
            "move" | "end" => {
                let Some(start) = self.start else {
                    return false;
                };
                self.pointer = Some(point);
                self.dragging |= (point - start).length() >= 3.;
                if self.dragging {
                    if let Some(focus) = self.hit(point, true) {
                        self.focus = Some(focus);
                    }
                    self.refresh();
                }
                let handled = self.dragging;
                if value["phase"] == "end" {
                    self.start = None;
                    self.pointer = None;
                    self.dragging = false;
                }
                handled
            }
            "word" | "block" => {
                self.clear();
                let Some(mut hit) = self.hit(point, false) else {
                    return false;
                };
                if value["phase"] == "word" {
                    if let Some(run) = self.runs.iter().rev().find(|run| run.key == hit.block) {
                        let local = run.local(point) - run.origin;
                        if hit.character > 0 && run.galley.pos_from_cursor(egui::text::CCursor::new(hit.character)).center().x > local.x {
                            hit.character -= 1;
                        }
                    }
                }
                let Some(block) = self.blocks.iter().find(|b| b.key == hit.block) else {
                    return false;
                };
                let mut range = 0..block.len;
                if value["phase"] == "word" {
                    let mut offset = 0;
                    for segment in block.text.split_word_bounds() {
                        let end = offset + segment.chars().count();
                        if hit.character < end || end == block.len {
                            range = offset..end;
                            break;
                        }
                        offset = end;
                    }
                }
                self.anchor = Some(Position {
                    block: hit.block,
                    character: range.start,
                });
                self.focus = Some(Position {
                    block: hit.block,
                    character: range.end,
                });
                self.refresh();
                true
            }
            "all" => {
                self.clear();
                if let (Some(first), Some(last)) = (self.blocks.first(), self.blocks.last()) {
                    self.anchor = Some(Position {
                        block: first.key,
                        character: 0,
                    });
                    self.focus = Some(Position {
                        block: last.key,
                        character: last.len,
                    });
                    self.refresh();
                }
                !self.text.is_empty()
            }
            "copy" => !self.text.is_empty(),
            _ => {
                self.clear();
                false
            }
        }
    }

    pub fn scroll_delta(&self, height: f32) -> f32 {
        if !self.dragging {
            return 0.;
        }
        let y = self.pointer.map_or(height * 0.5, |p| p.y);
        if y < 24. {
            ((24. - y) * -0.25).max(-18.)
        } else if y > height - 24. {
            ((y - height + 24.) * 0.25).min(18.)
        } else {
            0.
        }
    }

    fn handle(&self, position: Position) -> Option<Pos2> {
        let run = self.runs.iter().find(|run| run.key == position.block)?;
        let caret = run.galley.pos_from_cursor(egui::text::CCursor::new(position.character));
        let mut point = run.origin + caret.center_bottom().to_vec2();
        for (center, angle) in &run.rotations {
            point = *center + egui::emath::Rot2::from_angle(*angle) * (point - *center);
        }
        Some(point)
    }

    pub fn tick(&mut self, clock: f64) -> bool {
        self.clock = clock;
        if let Some((point, start)) = self.pending_touch {
            if clock - start >= 0.45 {
                self.command(&json!({"phase":"word","x":point.x,"y":point.y}));
                if !self.text.is_empty() {
                    self.touch_selection = true;
                    self.dragging = false;
                    self.start = Some(point);
                    self.pointer = Some(point);
                    return true;
                }
            }
        }
        false
    }

    pub fn finish_frame(&mut self) {
        if self.dragging {
            if let Some(focus) = self.pointer.and_then(|p| self.hit(p, true)) {
                self.focus = Some(focus);
                self.refresh();
            }
        }
    }

    pub fn paint(&self, painter: &egui::Painter, key: usize, galley: &egui::Galley, origin: Pos2, color: Color32) {
        let Some((first, last)) = self.bounds() else {
            return;
        };
        if first == last || key < first.block || key > last.block {
            return;
        }
        let Some(range) = self.range(key, galley.text().chars().count()) else {
            return;
        };
        let mut offset = 0;
        for row in &galley.rows {
            let end = offset + row.char_count_excluding_newline().0;
            if range.start <= end && range.end > offset {
                let x1 = row.x_offset(egui::text::CharIndex(range.start.saturating_sub(offset).min(end - offset)));
                let x2 = row.x_offset(egui::text::CharIndex(range.end.saturating_sub(offset).min(end - offset)));
                let extra = if row.ends_with_newline && range.end > end { 3. } else { 0. };
                let rect = Rect::from_min_max(
                    origin + row.pos.to_vec2() + Vec2::new(x1, 0.),
                    origin + row.pos.to_vec2() + Vec2::new(x2 + extra, row.size.y),
                );
                if rect.is_positive() {
                    painter.rect_filled(rect, 1., color);
                    if self.touch_selection {
                        if key == first.block && range.start >= offset && range.start <= end {
                            painter.circle_filled(rect.left_bottom(), 5., color.to_opaque());
                        }
                        if key == last.block && range.end > offset && range.end <= end {
                            painter.circle_filled(rect.right_bottom(), 5., color.to_opaque());
                        }
                    }
                }
            }
            offset = end + usize::from(row.ends_with_newline);
        }
    }
}
