//! Gregorian calendar selection, bounds, navigation and hit testing stay off the JS thread.
use super::*;
const MONTHS: [&str; 12] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Date {
    year: i32,
    month: u32,
    day: u32,
}
impl Date {
    fn days(year: i32, month: u32) -> u32 {
        match month {
            2 => {
                if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) {
                    29
                } else {
                    28
                }
            }
            4 | 6 | 9 | 11 => 30,
            _ => 31,
        }
    }
    fn parse(value: &Value) -> Option<Self> {
        let parts = value.as_str()?.split('-').map(str::parse::<i32>).collect::<Result<Vec<_>, _>>().ok()?;
        if parts.len() != 3
            || !(1..=9999).contains(&parts[0])
            || !(1..=12).contains(&parts[1])
            || !(1..=Self::days(parts[0], parts[1] as u32) as i32).contains(&parts[2])
        {
            return None;
        }
        Some(Self {
            year: parts[0],
            month: parts[1] as u32,
            day: parts[2] as u32,
        })
    }
    fn iso(self) -> String {
        format!("{:04}-{:02}-{:02}", self.year, self.month, self.day)
    }
    fn weekday(self) -> u32 {
        let offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
        let year = self.year - i32::from(self.month < 3);
        ((year + year / 4 - year / 100 + year / 400 + offsets[self.month as usize - 1] + self.day as i32) % 7) as u32
    }
}
#[derive(Clone, Copy, PartialEq, Eq)]
enum CalendarMode {
    Days,
    Months,
    Years,
}
#[derive(Clone)]
struct Calendar {
    selected: Date,
    year: i32,
    month: u32,
    mode: CalendarMode,
    year_page: i32,
}
impl Calendar {
    fn new(selected: Date, min: Date) -> Self {
        Self {
            selected,
            year: selected.year,
            month: selected.month,
            mode: CalendarMode::Days,
            year_page: min.year + (selected.year - min.year) / 12 * 12,
        }
    }
}
// App surfaces can be translucent glass. An overlapping calendar needs an opaque
// backing so form fields cannot show through its dates and navigation controls.
fn opaque_surface(palette: &theme::Palette) -> Color32 {
    fn over(front: Color32, back: Color32) -> Color32 {
        let [r, g, b, a] = front.to_srgba_unmultiplied();
        let alpha = a as f32 / 255.;
        let blend = |front: u8, back: u8| (front as f32 * alpha + back as f32 * (1. - alpha)).round() as u8;
        Color32::from_rgb(blend(r, back.r()), blend(g, back.g()), blend(b, back.b()))
    }
    let background = over(palette.get("background"), theme::Palette::new(palette.dark).get("background"));
    over(palette.get("surface"), background)
}
impl ComponentDocument {
    pub(super) fn date_picker(&mut self, ui: &mut egui::Ui, node: &Node) {
        let min = Date::parse(&node.props["minimumDate"]).unwrap_or(Date {
            year: 1900,
            month: 1,
            day: 1,
        });
        let max = Date::parse(&node.props["maximumDate"])
            .unwrap_or(Date {
                year: 2100,
                month: 12,
                day: 31,
            })
            .max(min);
        let selected = Date::parse(&self.value(node, &["value"], json!("2000-01-01")))
            .unwrap_or(min)
            .clamp(min, max);
        let key = ui.make_persistent_id(("calendar", &node.id));
        let mut view = ui
            .ctx()
            .data_mut(|data| data.get_temp::<Calendar>(key))
            .unwrap_or_else(|| Calendar::new(selected, min));
        if view.selected != selected {
            view = Calendar::new(selected, min);
        }
        view.year = view.year.clamp(min.year, max.year);
        view.month = view.month.clamp(
            if view.year == min.year { min.month } else { 1 },
            if view.year == max.year { max.month } else { 12 },
        );
        if view.year_page < min.year || view.year_page > max.year {
            view.year_page = min.year + (view.year - min.year) / 12 * 12;
        }
        let label = format!("{} {} {}", selected.day, MONTHS[selected.month as usize - 1], selected.year);
        ui.spacing_mut().button_padding = Vec2::new(12., 10.);
        let mut popup_style = ui.style().as_ref().clone();
        popup_style.visuals.window_fill = opaque_surface(&self.palette);
        popup_style.spacing.item_spacing = Vec2::splat(2.);
        popup_style.spacing.button_padding.x = 2.;
        let shown = egui::ComboBox::from_id_salt((&node.id, "date"))
            .popup_style(egui::style::StyleModifier::from(popup_style))
            .width(ui.available_width())
            .height(440. * self.font_scale.max(1.))
            .close_behavior(egui::PopupCloseBehavior::CloseOnClickOutside)
            .selected_text(egui::RichText::new(&label).line_height(Some(24. * self.font_scale.max(1.))))
            .show_ui(ui, |ui| {
                let width = ui.available_width().min((ui.ctx().viewport_rect().width() - 24.).max(1.));
                ui.set_width(width);
                let height = (30. * self.font_scale.max(1.)).max(44.);
                // Keep the popup footprint stable when switching between day,
                // month and year grids. Egui caches an open popup's size, so a
                // shorter chooser would otherwise clip the last calendar rows.
                ui.set_min_height(height * 7. + 28. * self.font_scale.max(1.) + 20.);
                let (can_previous, can_next, previous_label, next_label) = match view.mode {
                    CalendarMode::Days => (
                        (view.year, view.month) > (min.year, min.month),
                        (view.year, view.month) < (max.year, max.month),
                        "Previous month",
                        "Next month",
                    ),
                    CalendarMode::Months => (view.year > min.year, view.year < max.year, "Previous year", "Next year"),
                    CalendarMode::Years => (view.year_page > min.year, view.year_page + 12 <= max.year, "Previous years", "Next years"),
                };
                ui.horizontal(|ui| {
                    let previous = ui.add_enabled(can_previous, egui::Button::new("‹").min_size(Vec2::new(44., height)));
                    self.date_semantic(node, "previous", previous_label, &previous, Value::Null);
                    if previous.clicked() {
                        match view.mode {
                            CalendarMode::Days if view.month == 1 => {
                                view.year -= 1;
                                view.month = 12;
                            }
                            CalendarMode::Days => view.month -= 1,
                            CalendarMode::Months => view.year -= 1,
                            CalendarMode::Years => view.year_page -= 12,
                        }
                    }
                    let title_width = (width - 88. - 6.).max(2.);
                    let month = ui.add_sized(
                        [title_width * 0.62, height],
                        egui::Button::new(MONTHS[view.month as usize - 1])
                            .truncate()
                            .selected(view.mode == CalendarMode::Months),
                    );
                    self.date_semantic(node, "month", "Choose month", &month, json!(view.month));
                    if month.clicked() {
                        view.mode = CalendarMode::Months;
                    }
                    let year = ui.add_sized(
                        [title_width * 0.38, height],
                        egui::Button::new(view.year.to_string())
                            .truncate()
                            .selected(view.mode == CalendarMode::Years),
                    );
                    self.date_semantic(node, "year", "Choose year", &year, json!(view.year));
                    if year.clicked() {
                        view.mode = CalendarMode::Years;
                        view.year_page = min.year + (view.year - min.year) / 12 * 12;
                    }
                    let next = ui.add_enabled(can_next, egui::Button::new("›").min_size(Vec2::new(44., height)));
                    self.date_semantic(node, "next", next_label, &next, Value::Null);
                    if next.clicked() {
                        match view.mode {
                            CalendarMode::Days if view.month == 12 => {
                                view.year += 1;
                                view.month = 1;
                            }
                            CalendarMode::Days => view.month += 1,
                            CalendarMode::Months => view.year += 1,
                            CalendarMode::Years => view.year_page += 12,
                        }
                    }
                    view.month = view.month.clamp(
                        if view.year == min.year { min.month } else { 1 },
                        if view.year == max.year { max.month } else { 12 },
                    );
                });
                ui.add_space(6.);
                match view.mode {
                    CalendarMode::Months | CalendarMode::Years => {
                        let months = view.mode == CalendarMode::Months;
                        let cell = ((width - 4.) / 3.).max(1.);
                        if !months {
                            ui.add_sized(
                                [width, 28. * self.font_scale.max(1.)],
                                egui::Label::new(format!("{} – {}", view.year_page, (view.year_page + 11).min(max.year))),
                            );
                        }
                        egui::Grid::new((&node.id, "choices"))
                            .min_col_width(0.)
                            .spacing(Vec2::splat(2.))
                            .show(ui, |ui| {
                                for index in 0..12 {
                                    let year = view.year_page + index;
                                    let month = index as u32 + 1;
                                    let (id, label, enabled, active, value) = if months {
                                        (
                                            format!("month:{month}"),
                                            MONTHS[index as usize].to_owned(),
                                            (view.year, month) >= (min.year, min.month) && (view.year, month) <= (max.year, max.month),
                                            view.month == month,
                                            json!(month),
                                        )
                                    } else {
                                        (format!("year:{year}"), year.to_string(), year <= max.year, view.year == year, json!(year))
                                    };
                                    let response = ui
                                        .add_enabled_ui(enabled, |ui| {
                                            ui.add_sized([cell, height], egui::Button::new(&label).truncate().selected(active))
                                        })
                                        .inner;
                                    self.date_semantic(node, &id, &label, &response, value);
                                    if response.clicked() {
                                        if months {
                                            view.month = month;
                                        } else {
                                            view.year = year;
                                            view.month = view.month.clamp(
                                                if year == min.year { min.month } else { 1 },
                                                if year == max.year { max.month } else { 12 },
                                            );
                                        }
                                        view.mode = CalendarMode::Days;
                                    }
                                    if index % 3 == 2 {
                                        ui.end_row();
                                    }
                                }
                            });
                    }
                    CalendarMode::Days => {
                        let first = Date {
                            year: view.year,
                            month: view.month,
                            day: 1,
                        }
                        .weekday();
                        let days = Date::days(view.year, view.month);
                        let cell = ((width - 12.) / 7.).max(1.);
                        egui::Grid::new((&node.id, "days"))
                            .min_col_width(0.)
                            .spacing(Vec2::splat(2.))
                            .show(ui, |ui| {
                                for label in ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] {
                                    ui.add_sized([cell, 28. * self.font_scale.max(1.)], egui::Label::new(label).truncate());
                                }
                                ui.end_row();
                                for index in 0..42 {
                                    let day = index as i32 - first as i32 + 1;
                                    if day < 1 || day > days as i32 {
                                        ui.allocate_space(Vec2::new(cell, height));
                                    } else {
                                        let date = Date {
                                            year: view.year,
                                            month: view.month,
                                            day: day as u32,
                                        };
                                        let response = ui
                                            .add_enabled_ui(date >= min && date <= max, |ui| {
                                                ui.add_sized([cell, height], egui::Button::new(day.to_string()).truncate().selected(date == selected))
                                            })
                                            .inner;
                                        self.date_semantic(
                                            node,
                                            &date.iso(),
                                            &format!("{} {} {}", day, MONTHS[date.month as usize - 1], date.year),
                                            &response,
                                            json!(date.iso()),
                                        );
                                        if response.clicked() {
                                            self.values.insert(node.id.clone(), json!(date.iso()));
                                            self.change(&node.id, json!(date.iso()));
                                            ui.close();
                                        }
                                    }
                                    if index % 7 == 6 {
                                        ui.end_row();
                                    }
                                }
                            });
                    }
                }
            });
        if shown.inner.is_none() {
            view.mode = CalendarMode::Days;
        }
        let mut accessible = node.clone();
        accessible.props["accessibilityLabel"] = json!(format!("{}: {}", node.props["label"].as_str().unwrap_or("Choose date"), label));
        self.semantic(&accessible, &shown.response, json!(selected.iso()));
        ui.ctx().data_mut(|data| data.insert_temp(key, view));
    }
    fn date_semantic(&mut self, node: &Node, id: &str, label: &str, response: &Response, value: Value) {
        self.semantic(
            &Node {
                id: format!("{}:{id}", node.id),
                kind: "NButton".into(),
                props: json!({"label":label}),
                children: vec![],
            },
            response,
            value,
        );
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn gregorian_leap_days_and_month_boundaries_are_validated() {
        assert!(Date::parse(&json!("2000-02-29")).is_some());
        for date in ["1900-02-29", "2023-02-29", "2024-04-31", "2024-00-01", "0000-01-01", "2000-02-29-extra"] {
            assert!(Date::parse(&json!(date)).is_none(), "{date}");
        }
        assert_eq!(Date::parse(&json!("1970-01-01")).unwrap().weekday(), 4);
        assert_eq!(Date::parse(&json!("2000-01-01")).unwrap().weekday(), 6);
        assert_eq!(Date::parse(&json!("2024-02-29")).unwrap().weekday(), 4);
    }
}

#[cfg(test)]
mod interaction_tests {
    use super::*;
    fn frame(doc: &mut ComponentDocument) {
        doc.frame(360., 640., 1.).drop_without_applying_deltas();
    }
    fn activate(doc: &mut ComponentDocument, id: &str) {
        doc.command(&json!({"action":"activate","id":id})).unwrap();
        for _ in 0..3 {
            frame(doc);
        }
    }
    #[test]
    fn closed_date_field_centers_its_text_with_input_padding() {
        fn text_bounds(shape: &egui::Shape) -> Option<egui::Rect> {
            match shape {
                egui::Shape::Text(text) if text.galley.job.text == "28 February 2000" => Some(text.galley.rect.translate(text.pos.to_vec2())),
                egui::Shape::Vec(shapes) => shapes.iter().find_map(text_bounds),
                _ => None,
            }
        }
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([{"id":"dob","kind":"NDatePicker","props":{"defaultValue":"2000-02-28"}}]))
            .unwrap();
        frame(&mut doc);
        let output = doc.frame(360., 640., 1.);
        let field = doc.layout_rects["dob"];
        let caption = output.shapes.iter().find_map(|shape| text_bounds(&shape.shape)).unwrap();
        assert!(caption.left() >= field.left() + 12.);
        assert!(
            (caption.center().y - field.center().y).abs() <= 1.,
            "caption {caption:?}, field {field:?}"
        );
        output.drop_without_applying_deltas();
    }
    #[test]
    fn month_and_year_choices_stay_in_one_popup_and_start_near_the_selected_year() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([{"id":"dob","kind":"NDatePicker","props":{"defaultValue":"2000-02-28"}}]))
            .unwrap();
        frame(&mut doc);
        activate(&mut doc, "dob");
        activate(&mut doc, "dob:year");
        assert!(doc.semantics.iter().any(|node| node.id == "dob:year:2000"));
        activate(&mut doc, "dob:year:1997");
        activate(&mut doc, "dob:month");
        activate(&mut doc, "dob:month:9");
        assert!(doc.semantics.iter().any(|node| node.id == "dob:1997-09-30"));
        activate(&mut doc, "dob:1997-09-30");
        assert_eq!(doc.values["dob"], "1997-09-30");
        assert!(!doc.semantics.iter().any(|node| node.id.starts_with("dob:")));
    }
    #[test]
    fn calendar_columns_and_header_fit_narrow_screens_and_large_text() {
        for width in [280., 320., 400., 768.] {
            for scale in [1., 1.5, 2.] {
                let mut doc = ComponentDocument::default();
                doc.command(&json!({"action":"environment","fontScale":scale})).unwrap();
                doc.set_tree(&json!([{"id":"dob","kind":"NDatePicker","props":{"defaultValue":"2000-02-28"}}]))
                    .unwrap();
                doc.frame(width, 900., 1.).drop_without_applying_deltas();
                doc.command(&json!({"action":"activate","id":"dob"})).unwrap();
                for _ in 0..5 {
                    doc.frame(width, 900., 1.).drop_without_applying_deltas();
                }
                for (id, rect) in &doc.layout_rects {
                    if id.starts_with("dob:") {
                        assert!(
                            rect.left() >= 0. && rect.right() <= width + 0.5,
                            "{id}: {rect:?}, width {width}, scale {scale}"
                        );
                    }
                }
                let days: Vec<_> = (6..=12).map(|day| doc.layout_rects[&format!("dob:2000-02-{day:02}")]).collect();
                for pair in days.windows(2) {
                    assert!((pair[1].left() - pair[0].right() - 2.).abs() < 0.5, "{pair:?}");
                    assert!((pair[1].width() - pair[0].width()).abs() < 0.5);
                }
                let previous = doc.layout_rects["dob:previous"];
                let next = doc.layout_rects["dob:next"];
                assert!((previous.left() - days[0].left()).abs() < 0.5);
                assert!(
                    (next.right() - days[6].right()).abs() <= 1.5,
                    "width {width} scale {scale}: next {next:?}, day {:?}",
                    days[6]
                );
            }
        }
    }
    #[test]
    fn accessible_calendar_blocks_out_of_bounds_dates_and_emits_a_local_day() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(
            &json!([{"id":"dob","kind":"NDatePicker","props":{"defaultValue":"2000-02-28","minimumDate":"2000-02-20","maximumDate":"2000-03-02"}}]),
        )
        .unwrap();
        frame(&mut doc);
        activate(&mut doc, "dob");
        assert!(doc.semantics.iter().any(|node| node.id == "dob:2000-02-19" && node.disabled));
        assert!(doc.command(&json!({"action":"activate","id":"dob:2000-02-19"})).is_err());
        activate(&mut doc, "dob:2000-02-29");
        assert_eq!(doc.values["dob"], "2000-02-29");
        assert!(doc.events.iter().any(|event| event["id"] == "dob" && event["value"] == "2000-02-29"));
        assert!(!doc.semantics.iter().any(|node| node.id == "dob:2000-02-19"));
        activate(&mut doc, "dob");
        activate(&mut doc, "dob:next");
        assert!(doc.semantics.iter().any(|node| node.id == "dob:2000-03-03" && node.disabled));
        assert!(doc.semantics.iter().any(|node| node.id == "dob:next" && node.disabled));
    }
}

#[cfg(test)]
mod theme_tests {
    use super::*;
    fn has_surface(shape: &egui::Shape, color: Color32) -> bool {
        match shape {
            egui::Shape::Rect(rect) => rect.fill == color && rect.rect.width() > 250.,
            egui::Shape::Vec(shapes) => shapes.iter().any(|shape| has_surface(shape, color)),
            _ => false,
        }
    }
    #[test]
    fn translucent_app_surfaces_get_an_opaque_calendar_backing() {
        let props = json!({"theme":"dark","colors":{"background":"#2d293b","surface":"rgba(91, 82, 111, 0.42)"}});
        let palette = theme::Palette::configure(&theme::Palette::new(true), &props, true);
        let color = opaque_surface(&palette);
        assert_eq!(color.a(), 255);
        assert!((color.r() as i32 - 64).abs() <= 1);
        assert!((color.g() as i32 - 58).abs() <= 1);
        assert!((color.b() as i32 - 81).abs() <= 1);
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([{"id":"theme","kind":"NTheme","props":props,"children":[{"id":"date","kind":"NDatePicker","props":{"defaultValue":"2000-02-28"}}]}])).unwrap();
        doc.frame(400., 640., 1.).drop_without_applying_deltas();
        doc.command(&json!({"action":"activate","id":"date"})).unwrap();
        for _ in 0..20 {
            doc.frame(400., 640., 1.).drop_without_applying_deltas();
        }
        let output = doc.frame(400., 640., 1.);
        assert!(output.shapes.iter().any(|shape| has_surface(&shape.shape, color)));
        output.drop_without_applying_deltas();
    }
    #[test]
    fn popup_inherits_the_scoped_theme_instead_of_the_system_palette() {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([{"id":"theme","kind":"NTheme","props":{"theme":"dark","colors":{"surface":"#252238"}},"children":[{"id":"date","kind":"NDatePicker","props":{"defaultValue":"2000-02-28"}}]}])).unwrap();
        doc.frame(400., 640., 1.).drop_without_applying_deltas();
        doc.command(&json!({"action":"activate","id":"date"})).unwrap();
        for _ in 0..20 {
            doc.frame(400., 640., 1.).drop_without_applying_deltas();
        }
        let output = doc.frame(400., 640., 1.);
        assert!(output.shapes.iter().any(|shape| has_surface(&shape.shape, Color32::from_rgb(37, 34, 56))));
        output.drop_without_applying_deltas();
    }
}
