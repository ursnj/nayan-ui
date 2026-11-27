use super::*;

impl Document {
    pub(super) fn input(&self, doc: &mut ComponentDocument, ui: &mut egui::Ui, index: usize, rect: Rect) -> Response {
        let item = &self.boxes[index];
        let n = &item.node;
        let p = &n.props;
        let mut value = string(&doc.value(n, &["value"], json!("")));
        let mut platform_value = String::new();
        let buffer = if doc.platform_inputs { &mut platform_value } else { &mut value };
        let multiline = n.kind == "NTextarea" || p["multiline"] == true;
        let mut edit = if multiline {
            egui::TextEdit::multiline(buffer)
        } else {
            egui::TextEdit::singleline(buffer)
        };
        edit = edit
            .id(egui::Id::unique(&n.id))
            .frame(egui::Frame::NONE)
            .margin(egui::Margin::ZERO)
            .font(egui::FontId::new(
                item.paint.text_size.unwrap_or(16.) * doc.font_scale.max(1.),
                item.paint.font_family(),
            ))
            .text_color(item.paint.foreground.unwrap_or(doc.palette.get("foreground")))
            .hint_text(if doc.platform_inputs { String::new() } else { string(&p["placeholder"]) })
            .password(p["type"] == "password" || p["secureTextEntry"] == true)
            .interactive(!flag(p, &["disabled", "isDisabled", "readOnly", "isReadOnly"]))
            .align(if multiline { egui::Align2::LEFT_TOP } else { egui::Align2::LEFT_CENTER })
            .desired_width(rect.width())
            .min_size(rect.size());
        if let Some(limit) = p["maxLength"].as_u64() {
            edit = edit.char_limit(limit as usize);
        }
        let original_cursor = ui.visuals().text_cursor.stroke;
        if doc.platform_inputs {
            ui.visuals_mut().text_cursor.stroke = egui::Stroke::NONE;
        }
        let response = ui.put(rect, edit);
        ui.visuals_mut().text_cursor.stroke = original_cursor;
        if response.changed() && !doc.platform_inputs {
            doc.values.insert(n.id.clone(), json!(value));
            doc.change(&n.id, json!(value));
        }
        doc.record_semantic(n, &response, json!(value));
        if n.kind == "NInputOtp" {
            doc.paint_otp(ui, n, &response, &value);
        }
        doc.input_editor(n, &item.paint, style::Edges::default());
        if response.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)) && !multiline {
            self.submit(doc, &n.id);
        }
        response
    }
}
