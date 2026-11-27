//! Field eligibility and reveal geometry belong to the same layout that draws the form.
use super::*;
impl ComponentDocument {
    /// Rust supplies chrome/layout; native/browser editors own text, caret, selection and IME.
    pub(super) fn input_editor(&mut self, node: &Node, style: &style::Style, padding: style::Edges) {
        if !self.platform_inputs {
            return;
        }
        let color = |color: Color32| {
            let [r, g, b, a] = color.to_srgba_unmultiplied();
            format!("rgba({r},{g},{b},{})", a as f32 / 255.)
        };
        let placeholder = node.props["placeholderTextColor"]
            .as_str()
            .and_then(theme::parse_color)
            .unwrap_or(self.palette.get("muted"));
        let size = style.text_size.unwrap_or(16.);
        let rect = self.layout_rects.get(&node.id).copied().unwrap_or(Rect::NOTHING);
        let otp = node.kind == "NInputOtp";
        let mut editor = json!({
            "rect":[rect.left(),rect.top(),rect.width(),rect.height()],
            "color":color(if otp { Color32::TRANSPARENT } else { style.foreground.unwrap_or(self.palette.get("field-foreground")) }),
            "placeholderColor":color(placeholder), "placeholder":if otp { "" } else { node.props["placeholder"].as_str().unwrap_or("") },
            "fontSize":size, "fontWeight":style.weight.unwrap_or(if style.medium { 500 } else { 400 }).to_string(),
            "lineHeight":style.line_height.map_or(size*1.5, |height| height.points(size)),
            "padding":[padding.top,padding.right,padding.bottom,padding.left],
            "textAlign":match style.text_align { Some(egui::Align::Center)=>"center",Some(egui::Align::Max)=>"right",_=>"left" }
        });
        for key in ["autoCapitalize", "autoComplete", "autoCorrect", "autoFocus", "inputMode", "returnKeyType"] {
            if let Some(value) = node.props.get(key) {
                editor[key] = value.clone();
            }
        }
        if let Some(semantic) = self.semantics.last_mut().filter(|semantic| semantic.id == node.id) {
            semantic.editor = Some(editor);
            if !semantic.disabled && !semantic.read_only {
                self.input_cache.insert(node.id.clone(), semantic.clone());
            }
        }
    }

    /// Platform offsets are UTF-16 code units; egui's cursor indexes Unicode scalar values.
    pub(super) fn input_selection(&mut self, request: &Value) -> Result<(), String> {
        let id = request["id"].as_str().ok_or("Missing input id")?;
        if !self.input_fields.iter().any(|field| field == id) {
            return Err("Input is hidden, disabled, read-only or unavailable".into());
        }
        let start = request["start"].as_u64().ok_or("Missing selection start")?;
        let end = request["end"].as_u64().ok_or("Missing selection end")?;
        let Some(value) = self
            .values
            .get(id)
            .or_else(|| self.semantics.iter().find(|node| node.id == id).map(|node| &node.value))
            .and_then(Value::as_str)
        else {
            return Ok(());
        };
        // Ignore delayed selection events from a value superseded by an external reset.
        if request["value"].as_str() != Some(value) {
            return Ok(());
        }
        let character = |offset: u64| {
            let mut units = 0;
            value
                .chars()
                .take_while(|c| {
                    units += c.len_utf16() as u64;
                    units <= offset
                })
                .count()
        };
        let range = egui::text::CCursorRange {
            primary: egui::text::CCursor::new(character(end)),
            secondary: egui::text::CCursor::new(character(start)),
            ..Default::default()
        };
        let focus = egui::Id::unique(id);
        let mut state = egui::TextEdit::load_state(&self.context, focus).unwrap_or_default();
        state.cursor.set_char_range(Some(range));
        state.store(&self.context, focus);
        self.context.request_repaint();
        Ok(())
    }

    pub(super) fn input_semantic(&mut self, node: &Node, response: &Response) {
        if !matches!(node.kind.as_str(), "NInput" | "NTextarea" | "NSearchField" | "NInputOtp")
            || !response.enabled()
            || flag(&node.props, &["isReadOnly", "readOnly"])
        {
            return;
        }
        self.input_fields.push(node.id.clone());
        if self.input_focus.as_deref() == Some(&node.id) {
            self.input_focus = None;
            response.request_focus();
            response.scroll_to_me(Some(egui::Align::Center));
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn frame(doc: &mut ComponentDocument, height: f32) {
        doc.frame(360., height, 1.).drop_without_applying_deltas();
    }
    #[test]
    fn platform_caret_tracks_typing_deletion_and_unicode_ranges_without_changing_text() {
        for kind in ["NInput", "NTextarea", "NSearchField", "NInputOtp"] {
            let mut doc = ComponentDocument::default();
            doc.command(&json!({"action":"environment","native":true})).unwrap();
            doc.set_tree(&json!([{"id":"field","kind":kind}])).unwrap();
            frame(&mut doc, 600.);
            doc.command(&json!({"action":"focusInput","id":"field"})).unwrap();
            frame(&mut doc, 600.);
            for (text, start, end, expected_start, expected_end) in [
                ("Hello", 5, 5, 5, 5),
                ("Hell", 4, 4, 4, 4),
                ("H👋llo", 1, 3, 1, 2),
                ("H👋llo", 3, 3, 2, 2),
                ("H👋llo", 99, 99, 5, 5),
                ("H👋llo", 2, 2, 1, 1),
                ("First\nनमस्ते", 7, 10, 7, 10),
                ("", 0, 0, 0, 0),
            ] {
                doc.command(&json!({"action":"value","id":"field","value":text,"platform":true,"acknowledge":true}))
                    .unwrap();
                doc.command(&json!({"action":"inputSelection","id":"field","value":text,"start":start,"end":end,"snapshot":false}))
                    .unwrap();
                let state = egui::TextEdit::load_state(&doc.context, egui::Id::unique("field")).unwrap();
                let range = state.cursor.char_range().unwrap();
                assert_eq!(range.secondary.index.0, expected_start);
                assert_eq!(range.primary.index.0, expected_end);
                assert!(doc.snapshot()["events"].as_array().unwrap().is_empty());
                assert_eq!(doc.snapshot()["nodes"][0]["value"], text);
                if kind == "NTextarea" || !text.contains('\n') {
                    frame(&mut doc, 600.);
                    let state = egui::TextEdit::load_state(&doc.context, egui::Id::unique("field")).unwrap();
                    assert_eq!(state.cursor.char_range().unwrap().primary.index.0, expected_end);
                }
            }
        }
    }

    #[test]
    fn platform_selection_moves_the_rendered_caret_along_text_and_between_lines() {
        for browser in [false, true] {
            let mut doc = ComponentDocument::default();
            doc.command(&json!({"action":"environment","native":!browser})).unwrap();
            if browser {
                doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
            }
            doc.set_tree(&json!([{"id":"field","kind":"NTextarea","props":{"defaultValue":"Hello\nWorld"}}]))
                .unwrap();
            frame(&mut doc, 600.);
            doc.command(&json!({"action":"focusInput","id":"field"})).unwrap();
            frame(&mut doc, 600.);
            let mut caret = |offset| {
                doc.command(&json!({"action":"inputSelection","id":"field","value":"Hello\nWorld","start":offset,"end":offset}))
                    .unwrap();
                let output = doc.frame(360., 600., 1.);
                let rect = output
                    .platform_output
                    .ime
                    .as_ref()
                    .expect("Focused field reports its painted cursor")
                    .cursor_rect;
                output.drop_without_applying_deltas();
                rect
            };
            let start = caret(0);
            let end = caret(5);
            let next_line = caret(6);
            assert!(end.left() > start.left() + 20.);
            assert!((end.top() - start.top()).abs() < 1.);
            assert!((next_line.left() - start.left()).abs() < 1.);
            assert!(next_line.top() > start.top() + 10.);
        }
    }

    #[test]
    fn platform_selection_ignores_stale_values_and_rejects_ineligible_targets() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([
            {"id":"field","kind":"NInput","props":{"value":"New"}},
            {"id":"disabled","kind":"NInput","props":{"disabled":true}},
            {"id":"readonly","kind":"NInput","props":{"readOnly":true}},
            {"id":"label","kind":"NText","props":{"text":"Hello"}}
        ]))
        .unwrap();
        frame(&mut doc, 600.);
        doc.command(&json!({"action":"inputSelection","id":"field","value":"New","start":1,"end":1}))
            .unwrap();
        doc.command(&json!({"action":"inputSelection","id":"field","value":"Old","start":3,"end":3}))
            .unwrap();
        let state = egui::TextEdit::load_state(&doc.context, egui::Id::unique("field")).unwrap();
        assert_eq!(state.cursor.char_range().unwrap().primary.index.0, 1);
        for id in ["disabled", "readonly", "label", "missing"] {
            assert!(
                doc.command(&json!({"action":"inputSelection","id":id,"value":"","start":0,"end":0}))
                    .is_err()
            );
        }
    }
    #[test]
    fn keyboard_field_order_includes_offscreen_inputs_and_skips_ineligible_fields() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([
            {"id":"name","kind":"NInput"},
            {"id":"disabled-parent","kind":"NView","props":{"disabled":true},"children":[{"id":"disabled","kind":"NInput"}]},
            {"id":"readonly","kind":"NInput","props":{"readOnly":true}},
            {"id":"hidden-parent","kind":"NView","props":{"className":"hidden"},"children":[{"id":"hidden","kind":"NInput"}]},
            {"id":"spacer","kind":"NView","props":{"height":800}},
            {"id":"about","kind":"NTextarea"}
        ]))
        .unwrap();
        for _ in 0..3 {
            frame(&mut doc, 300.);
        }
        assert_eq!(doc.snapshot()["inputFields"], json!(["name", "about"]));
        assert!(!doc.semantics.iter().any(|node| node.id == "about"));
        assert!(doc.command(&json!({"action":"focusInput","id":"disabled"})).is_err());
        assert!(doc.command(&json!({"action":"focusInput","id":"hidden"})).is_err());
        doc.command(&json!({"action":"focusInput","id":"about"})).unwrap();
        for _ in 0..20 {
            frame(&mut doc, 300.);
        }
        let about = doc.semantics.iter().find(|node| node.id == "about").unwrap();
        assert!(about.rect[1] >= 0. && about.rect[1] + about.rect[3] <= 300.);
    }
    #[test]
    fn focused_input_can_be_revealed_again_after_the_keyboard_resizes_the_viewport() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([
            {"id":"spacer","kind":"NView","props":{"height":350}},
            {"id":"mobile","kind":"NInput","props":{"label":"Mobile"}},
            {"id":"bottom","kind":"NView","props":{"height":400}}
        ]))
        .unwrap();
        for _ in 0..3 {
            frame(&mut doc, 800.);
        }
        assert!(doc.semantics.iter().any(|node| node.id == "mobile"));
        frame(&mut doc, 280.);
        doc.command(&json!({"action":"focusInput","id":"mobile"})).unwrap();
        for _ in 0..20 {
            frame(&mut doc, 280.);
        }
        let rect = doc.layout_rects["mobile"];
        assert!(rect.top() >= 0. && rect.bottom() <= 280., "{rect:?}");
    }
}
