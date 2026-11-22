use super::*;

#[test]
fn card_shadows_never_paint_inside_translucent_surfaces() {
    for native in [false, true] {
        for (surface, shadow) in [
            ("rgba(255,255,255,0.35)", "0px 6px 18px -8px rgba(37,23,68,0.16)"),
            ("rgba(91,82,111,0.42)", "0px 8px 24px -12px rgba(12,9,22,0.4)"),
            ("rgba(255,255,255,0.35)", "4px -3px 12px 2px rgba(37,23,68,0.16)"),
        ] {
            for scale in [1., 2., 3.] {
                let mut doc = ComponentDocument::default();
                doc.command(&json!({"action":"environment","native":native})).unwrap();
                tree(
                    &mut doc,
                    json!([{"id":"card","kind":"NCard","props":{
                        "width":180,"height":120,"className":"m-8 rounded-[14px] border-0 p-0",
                        "style":{"backgroundColor":surface,"boxShadow":shadow}
                    }}]),
                );
                let output = doc.frame(400., 300., scale);
                let bounds = doc.layout_rects["card"];
                let mut shadows = 0;
                let mut fills = 0;
                for shape in &output.shapes {
                    if let egui::Shape::Rect(rect) = &shape.shape {
                        if rect.blur_width > 0. && rect.fill.a() > 0 {
                            shadows += 1;
                            assert!(
                                !shape.clip_rect.intersect(bounds).is_positive(),
                                "shadow darkens the card interior: native={native}, scale={scale}, shadow={shadow}, clip={:?}, bounds={bounds:?}",
                                shape.clip_rect
                            );
                        } else if rect.rect == bounds && rect.fill == theme::parse_color(surface).unwrap() {
                            fills += 1;
                        }
                    }
                }
                assert!(shadows > 0, "the exterior shadow must remain visible");
                assert_eq!(fills, 1, "the translucent surface must blend exactly once");
                output.drop_without_applying_deltas();
            }
        }
    }
}

fn painted_text_bounds(shape: &egui::Shape, text: &str) -> Option<Rect> {
    match shape {
        egui::Shape::Text(shape) if shape.galley.text() == text => Some(shape.galley.rect.translate(shape.pos.to_vec2())),
        egui::Shape::Vec(shapes) => shapes.iter().find_map(|shape| painted_text_bounds(shape, text)),
        _ => None,
    }
}

#[test]
fn alerts_paint_custom_content_and_message_only_alerts_once() {
    let mut doc = ComponentDocument::default();
    doc.set_tree(&json!([
        {"id":"custom","kind":"NAlert","props":{"className":"flex-row gap-3"},"children":[
            {"id":"title","kind":"NText","props":{"text":"Notice"}},
            {"id":"details","kind":"NText","props":{"text":"Save a backup."}}
        ]},
        {"id":"message","kind":"NAlert","props":{"message":"Upload complete."}},
        {"id":"standard","kind":"NAlert","props":{"title":"Warning","description":"Session expires soon."}}
    ]))
    .unwrap();
    let output = doc.frame(480., 400., 1.);
    let paint_count = |text| {
        output
            .shapes
            .iter()
            .filter(|shape| painted_text_bounds(&shape.shape, text).is_some())
            .count()
    };
    let counts = [
        "Notice",
        "Save a backup.",
        "NoticeSave a backup.",
        "Upload complete.",
        "Warning",
        "Session expires soon.",
    ]
    .map(paint_count);
    output.drop_without_applying_deltas();
    assert_eq!(counts, [1, 1, 0, 1, 1, 1]);
}

#[test]
fn badge_text_is_centered_in_intrinsic_and_fixed_boxes() {
    for native in [false, true] {
        for class in [
            "rounded-md px-2 py-1",
            "rounded-md w-32 h-12 px-2 py-1",
            "rounded-md min-w-32 min-h-12 px-2 py-1",
        ] {
            let mut doc = ComponentDocument::default();
            doc.command(&json!({"action":"environment","native":native,"fontScale":1.5})).unwrap();
            doc.set_tree(&json!([{"id":"row","kind":"NView","props":{"className":"flex-row flex-wrap items-center gap-2"},"children":[
                {"id":"badge","kind":"NBadge","props":{"className":class},"children":[{"id":"label","kind":"NText","props":{"text":"Update gy"}}]},
                {"id":"neighbor","kind":"NBadge","props":{"className":"rounded-md px-2 py-1","text":"Second"}}
            ]}]))
            .unwrap();
            let output = doc.frame(400., 300., 2.);
            let label = output
                .shapes
                .iter()
                .find_map(|shape| painted_text_bounds(&shape.shape, "Update gy"))
                .unwrap();
            output.drop_without_applying_deltas();
            let badge = bounds(&doc, "badge");
            assert!(
                (badge.center() - label.center()).length() <= 1.,
                "native={native}, class={class}: label={label:?}, badge={badge:?}"
            );
            assert!(bounds(&doc, "neighbor").left() >= badge.right() + 7., "class={class}: badges overlap");
        }
    }
}

#[test]
fn badge_and_chip_variants_use_theme_colors_and_sizes() {
    let palette = theme::Palette::new(false);
    for kind in ["NBadge", "NChip"] {
        let large = style::Style::resolve(
            kind,
            &json!({"color":"accent","variant":"primary","size":"lg"}),
            &palette,
            style::Conditions::default(),
            Vec2::new(400., 300.),
        );
        let soft = style::Style::resolve(
            kind,
            &json!({"color":"accent","variant":"soft","size":"sm"}),
            &palette,
            style::Conditions::default(),
            Vec2::new(400., 300.),
        );
        assert_eq!(large.background, Some(palette.get("accent")));
        assert_eq!(large.min_height, Some(32.));
        assert_eq!(soft.background, Some(palette.get("accent").gamma_multiply(0.15)));
        assert_eq!(soft.min_height, Some(20.));
    }
}

#[test]
fn single_line_values_and_placeholders_are_centered_inside_the_field() {
    for native in [false, true] {
        for height in [48., 72.] {
            for scale in [1., 1.5] {
                for placeholder in [false, true] {
                    let mut doc = ComponentDocument::default();
                    doc.command(&json!({"action":"environment","native":native,"fontScale":scale})).unwrap();
                    tree(
                        &mut doc,
                        json!([{"id":"name","kind":"NInput","props":{
                            "label":"Full name", "height":height,
                            "defaultValue":if placeholder { "" } else { "Center gy" }, "placeholder":"Center gy"
                        }}]),
                    );
                    for focused in [false, true] {
                        if focused {
                            doc.command(&json!({"action":"focus","id":"name"})).unwrap();
                        }
                        let output = doc.frame(400., 600., 1.);
                        let bounds = output
                            .shapes
                            .iter()
                            .find_map(|shape| painted_text_bounds(&shape.shape, "Center gy"))
                            .unwrap();
                        let field = doc.semantics.iter().find(|node| node.id == "name").unwrap().rect;
                        let expected = field[1] + field[3] / 2.;
                        assert!(
                            (bounds.center().y - expected).abs() <= 1.,
                            "native={native}, height={height}, scale={scale}, placeholder={placeholder}, focused={focused}: text={bounds:?}, field={field:?}"
                        );
                        assert!(bounds.left() >= field[0] && bounds.left() < field[0] + 16.);
                        output.drop_without_applying_deltas();
                    }
                }
            }
        }
    }
}

#[test]
fn multiline_text_keeps_its_top_padding() {
    let mut doc = ComponentDocument::default();
    tree(
        &mut doc,
        json!([{"id":"about","kind":"NTextarea","props":{"defaultValue":"First line\nSecond line","height":128}}]),
    );
    let output = doc.frame(400., 600., 1.);
    let bounds = output
        .shapes
        .iter()
        .find_map(|shape| painted_text_bounds(&shape.shape, "First line\nSecond line"))
        .unwrap();
    let field = doc.semantics.iter().find(|node| node.id == "about").unwrap().rect;
    assert!((bounds.top() - field[1] - 10.).abs() <= 1.);
    output.drop_without_applying_deltas();
}

#[test]
fn moving_platform_editors_are_published_every_frame_without_accessibility_throttling() {
    let mut doc = ComponentDocument::default();
    doc.command(&json!({"action":"environment","native":true,"platformInputs":true})).unwrap();
    let form = |top: i32| {
        json!([
          {"id":"top","kind":"NView","props":{"height":top}},
          {"id":"field","kind":"NInput"},
          {"id":"bottom","kind":"NView","props":{"height":400-top}}
        ])
    };
    tree(&mut doc, form(20));
    for top in 21..25 {
        doc.set_tree(&form(top)).unwrap();
        let before = doc.revision;
        frame(&mut doc);
        assert!(
            doc.revision > before,
            "A platform editor moving in the viewport must be published this frame"
        );
    }
}

#[test]
fn platform_editors_receive_styles_and_the_gpu_does_not_duplicate_their_text() {
    for browser in [false, true] {
        let mut doc = ComponentDocument::default();
        doc.command(&json!({"action":"environment","native":!browser,"platformInputs":true}))
            .unwrap();
        if browser {
            doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
        }
        doc.set_tree(&json!([{"id":"field","kind":"NInput","props":{"label":"Name","value":"Native text marker","placeholder":"Native hint marker","autoCapitalize":"none","inputProps":{"autoCorrect":false},"style":{"fontSize":18,"height":48,"color":"#123456"}}}])).unwrap();
        let output = doc.frame(390., 600., 1.);
        assert!(
            !output
                .shapes
                .iter()
                .any(|shape| painted_text_bounds(&shape.shape, "Native text marker").is_some())
        );
        assert!(
            !output
                .shapes
                .iter()
                .any(|shape| painted_text_bounds(&shape.shape, "Native hint marker").is_some())
        );
        output.drop_without_applying_deltas();
        let snapshot = doc.snapshot();
        let editor = &snapshot["nodes"].as_array().unwrap().iter().find(|node| node["id"] == "field").unwrap()["editor"];
        assert_eq!(editor["fontSize"], 18.);
        assert_eq!(editor["placeholder"], "Native hint marker");
        assert_eq!(editor["autoCapitalize"], "none");
        assert_eq!(editor["autoCorrect"], false);
        assert_eq!(editor["color"], "rgba(18,52,86,1)");
        assert!(editor["rect"][2].as_f64().unwrap() > 0.);
    }
}

#[test]
fn platform_editor_keeps_receiving_edits_when_scrolled_out_of_view_and_releases_on_unmount() {
    let mut doc = ComponentDocument::default();
    doc.command(&json!({"action":"environment","native":true,"platformInputs":true})).unwrap();
    let field = json!({"id":"field","kind":"NInput","props":{"value":"A"}});
    tree(&mut doc, json!([field]));
    assert!(doc.input_cache.contains_key("field"));
    doc.set_tree(&json!([{"id":"spacer","kind":"NView","props":{"height":1000}},field]))
        .unwrap();
    doc.frame(390., 200., 1.).drop_without_applying_deltas();
    assert!(!doc.semantics.iter().any(|node| node.id == "field"));
    let ack = doc
        .command(&json!({"action":"value","id":"field","value":"AB👋","platform":true,"compact":true,"acknowledge":true}))
        .unwrap();
    assert_eq!(ack["events"][0]["value"], "AB👋");
    assert_eq!(doc.values["field"], "AB👋");
    doc.set_tree(&json!([])).unwrap();
    assert!(!doc.input_cache.contains_key("field"));
    assert!(
        doc.command(&json!({"action":"value","id":"field","value":"late","platform":true}))
            .is_err()
    );
}

#[test]
fn compact_input_acknowledgements_keep_one_node_and_apply_selection_atomically() {
    let mut doc = ComponentDocument::default();
    let mut nodes = vec![json!({"id":"field","kind":"NInput","props":{"value":"","maxLength":5}})];
    nodes.extend((0..100).map(|i| json!({"id":format!("label-{i}"),"kind":"NText","props":{"text":format!("Static form label {i}"),"height":2}})));
    tree(&mut doc, json!(nodes));
    let full_bytes = doc.snapshot().to_string().len();
    let ack = doc.command(&json!({"action":"value","id":"field","value":"Hi👋abc","platform":true,"acknowledge":true,"compact":true,"selection":{"start":6,"end":6}})).unwrap();
    assert_eq!(ack["partial"], true);
    assert_eq!(ack["nodes"].as_array().unwrap().len(), 1);
    assert_eq!(ack["nodes"][0]["value"], "Hi👋ab");
    assert_eq!(ack["events"].as_array().unwrap().len(), 1);
    assert!(ack.get("imageRequests").is_none());
    assert!(ack.get("overlays").is_none());
    let state = egui::TextEdit::load_state(&doc.context, egui::Id::unique("field")).unwrap();
    assert_eq!(state.cursor.char_range().unwrap().primary.index.0, 5);
    assert!(doc.take_snapshot()["events"].as_array().unwrap().is_empty());
    let compact_bytes = ack.to_string().len();
    assert!(compact_bytes * 5 < full_bytes, "{full_bytes} -> {compact_bytes}");
    eprintln!("Input acknowledgement: {full_bytes} -> {compact_bytes} bytes");
}

#[test]
fn controlled_native_input_paints_new_text_before_react_echo_and_still_accepts_resets() {
    let mut doc = ComponentDocument::default();
    let form = |value: &str| json!([{"id":"field","kind":"NInput","props":{"value":value}}]);
    tree(&mut doc, form("A"));
    for text in ["AB", "ABC", "AB👋", "AB"] {
        doc.command(&json!({"action":"value","id":"field","value":text,"platform":true,"acknowledge":true,"compact":true}))
            .unwrap();
        for _ in 0..3 {
            frame(&mut doc);
        }
        assert_eq!(
            doc.snapshot()["nodes"][0]["value"],
            text,
            "An old React prop must not undo a newer OS edit"
        );
    }
    doc.set_tree(&form("AB")).unwrap();
    frame(&mut doc);
    assert_eq!(doc.snapshot()["nodes"][0]["platformEdit"], true);
    doc.set_tree(&form("")).unwrap();
    frame(&mut doc);
    assert_eq!(doc.snapshot()["nodes"][0]["value"], "");
    assert_eq!(doc.snapshot()["nodes"][0]["platformEdit"], false);
}

#[test]
fn ime_acknowledgements_return_the_latest_normalized_value_and_consume_events_once() {
    let mut ui = ComponentDocument::default();
    tree(&mut ui, json!([{"id":"mobile","kind":"NInput","props":{"maxLength":10}}]));
    let first = ui
        .command(&json!({"action":"value","id":"mobile","value":"123","platform":true,"acknowledge":true}))
        .unwrap();
    let second = ui
        .command(&json!({"action":"value","id":"mobile","value":"123456789012","platform":true,"acknowledge":true}))
        .unwrap();
    assert_eq!(first["nodes"][0]["value"], "123");
    assert_eq!(second["nodes"][0]["value"], "1234567890");
    assert_eq!(second["nodes"][0]["platformEdit"], true);
    assert!(second["revision"].as_u64().unwrap() > first["revision"].as_u64().unwrap());
    assert_eq!(first["events"].as_array().unwrap().len(), 1);
    assert_eq!(second["events"].as_array().unwrap().len(), 1);
    assert!(second["events"][0]["sequence"].as_u64().unwrap() > first["events"][0]["sequence"].as_u64().unwrap());
    frame(&mut ui);
    assert!(ui.take_snapshot()["events"].as_array().unwrap().is_empty());
    assert_eq!(ui.snapshot()["nodes"][0]["value"], "1234567890");
    ui.set_tree(&json!([{"id":"mobile","kind":"NInput","props":{"value":"987"}}])).unwrap();
    frame(&mut ui);
    assert_eq!(ui.snapshot()["nodes"][0]["value"], "987");
    assert_eq!(ui.snapshot()["nodes"][0]["platformEdit"], false);
}

#[test]
fn profile_inputs_expose_platform_keyboard_hints_and_rust_limits() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([
            {"id":"mobile","kind":"NInput","props":{"label":"Mobile","type":"tel","maxLength":10}},
            {"id":"about","kind":"NTextarea","props":{"label":"About","maxLength":300}}
        ]),
    );
    let snapshot = ui.snapshot();
    assert_eq!(snapshot["nodes"][0]["inputType"], "tel");
    assert_eq!(snapshot["nodes"][0]["maxLength"], 10);
    assert_eq!(snapshot["nodes"][1]["multiline"], true);
    ui.command(&json!({"action":"value","id":"mobile","value":"123456789012"})).unwrap();
    frame(&mut ui);
    assert_eq!(ui.snapshot()["nodes"][0]["value"], "1234567890");
}

fn frame(ui: &mut ComponentDocument) {
    ui.frame(400., 600., 1.).drop_without_applying_deltas();
}

fn tree(ui: &mut ComponentDocument, nodes: Value) {
    ui.set_tree(&nodes).unwrap();
    frame(ui);
}

fn bounds(ui: &ComponentDocument, id: &str) -> Rect {
    let [x, y, w, h] = ui.layout_bounds(id).unwrap_or_else(|| panic!("{id} was not laid out"));
    Rect::from_min_size(Pos2::new(x, y), Vec2::new(w, h))
}

#[test]
fn absolute_children_overlay_the_padding_box_without_taking_flow_space() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"slide","kind":"NCard","props":{"width":200,"className":"gap-0 p-0"},"children":[
            {"id":"art","kind":"NCard","props":{"height":120,"className":"border-0 p-0"}},
            {"id":"fade","kind":"NCard","props":{"className":"absolute inset-0 border-0 rounded-none p-0 bg-linear-to-b from-surface/0 to-surface"}},
            {"id":"badge","kind":"NCard","props":{"className":"absolute top-0 right-0 rounded-none rounded-bl-xl px-2 py-1"},"children":[
                {"id":"badge-text","kind":"NText","props":{"text":"Premium","className":"text-[11px] font-extrabold uppercase tracking-[0.66px]"}}]},
            {"id":"copy","kind":"NCard","props":{"className":"absolute bottom-0 left-0 right-0 items-center border-0 bg-transparent px-6 pb-8 gap-0"},"children":[
                {"id":"title","kind":"NText","props":{"text":"Play offline","className":"text-2xl font-bold text-center leading-8"}}]}
        ]}]),
    );
    frame(&mut ui);
    let slide = bounds(&ui, "slide");
    let inner = slide.shrink(1.);
    assert_eq!(slide.height(), 122., "only the flow child sizes the card");
    assert_eq!(bounds(&ui, "fade"), inner);
    let badge = bounds(&ui, "badge");
    assert_eq!((badge.right(), badge.top()), (inner.right(), inner.top()));
    assert!(
        badge.width() < 120.,
        "badge {badge:?} text {:?} slide {slide:?}",
        bounds(&ui, "badge-text")
    );
    let copy = bounds(&ui, "copy");
    assert_eq!((copy.left(), copy.right(), copy.bottom()), (inner.left(), inner.right(), inner.bottom()));
    let title = bounds(&ui, "title");
    assert!(
        (title.bottom() - (inner.bottom() - 32.)).abs() < 1.,
        "pb-8 keeps the title above the bottom: {title:?}"
    );
    assert!((title.center().x - inner.center().x).abs() < 1.);
}

#[test]
fn justified_rows_center_their_measured_content() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"button","kind":"NCard","props":{"width":300,"className":"flex-row items-center justify-center gap-0 px-4 py-2.5"},"children":[
            {"id":"icon","kind":"NIcon","props":{"size":18,"viewBox":24,"paths":["M0 0H24V24H0Z"]}},
            {"id":"caption","kind":"NText","props":{"text":"PLAY NOW","className":"ml-1.5 text-sm font-bold leading-5"}}
        ]}]),
    );
    frame(&mut ui);
    let button = bounds(&ui, "button");
    let content = bounds(&ui, "icon").union(bounds(&ui, "caption"));
    assert!(
        (content.center().x - button.center().x).abs() < 4.,
        "button {button:?}, content {content:?}"
    );
    assert!(content.left() > button.left() + 40.);
}

#[test]
fn vertical_gradients_fade_from_transparent_and_respect_corners() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"fade","kind":"NCard","props":{"width":100,"height":100,
        "className":"border-0 rounded-none rounded-b-xl p-0 bg-linear-to-b from-[#ff000000] to-[#ff0000]"}}]))
        .unwrap();
    let output = ui.frame(400., 600., 1.);
    let mesh = output
        .shapes
        .iter()
        .find_map(|shape| match &shape.shape {
            egui::Shape::Mesh(mesh) => Some(mesh.clone()),
            _ => None,
        })
        .expect("gradient mesh");
    output.drop_without_applying_deltas();
    let top = mesh.vertices.iter().min_by(|a, b| a.pos.y.total_cmp(&b.pos.y)).unwrap();
    let bottom = mesh.vertices.iter().max_by(|a, b| a.pos.y.total_cmp(&b.pos.y)).unwrap();
    assert_eq!(top.color.a(), 0);
    assert_eq!(bottom.color, Color32::from_rgb(255, 0, 0));
    let corner = Pos2::new(bottom.pos.x.min(100.), 100.);
    assert!(
        !mesh.vertices.iter().any(|v| v.pos == Pos2::new(0., 100.)),
        "rounded bottom corners: {corner:?}"
    );
    assert!(mesh.vertices.iter().any(|v| v.pos == Pos2::new(0., 0.)), "square top corners");
}

#[test]
fn weights_and_corner_utilities_resolve_to_registered_families() {
    let palette = theme::Palette::default();
    let resolve = |class: &str| style::Style::resolve("NText", &json!({"className":class}), &palette, Default::default(), Vec2::splat(400.));
    assert_eq!(resolve("font-bold").font_family(), egui::FontFamily::Name("native-bold".into()));
    assert_eq!(resolve("font-semibold").font_family(), egui::FontFamily::Name("native-semibold".into()));
    assert_eq!(resolve("font-extrabold").font_family(), egui::FontFamily::Name("native-extrabold".into()));
    assert_eq!(resolve("font-medium").font_family(), egui::FontFamily::Name("native-medium".into()));
    assert_eq!(resolve("").font_family(), egui::FontFamily::Proportional);
    let corners = resolve("rounded-none rounded-bl-xl").corner_radius();
    assert_eq!((corners.nw, corners.ne, corners.sw, corners.se), (0, 0, 12, 0));
    let corners = resolve("rounded-t-[13px]").corner_radius();
    assert_eq!((corners.nw, corners.ne), (13, 13));
    let mut ui = ComponentDocument::default();
    for weight in ["font-medium", "font-semibold", "font-bold", "font-extrabold", "font-black"] {
        tree(&mut ui, json!([{"id":"t","kind":"NText","props":{"text":"Weighted","className":weight}}]));
    }
}

#[test]
fn overlay_indicators_sit_on_the_slides_without_reserving_height() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"hero","kind":"NCarousel","props":{"height":200,"indicatorPlacement":"overlay","indicatorShadowColor":"#ffffff"},"children":[
            {"id":"a","kind":"NCard","props":{"height":200,"className":"border-0 p-0"}},
            {"id":"b","kind":"NCard","props":{"height":200,"className":"border-0 p-0"}}
        ]}]),
    );
    frame(&mut ui);
    assert_eq!(bounds(&ui, "a").height(), 200.);
    let dot = ui.semantics.iter().find(|node| node.id == "hero:page:1").unwrap().rect;
    let hero = ui.semantics.iter().find(|node| node.id == "hero").unwrap().rect;
    assert!((dot[1] + dot[3] / 2. - (hero[1] + 200. - 20.)).abs() < 1., "dot {dot:?}, hero {hero:?}");
}

#[test]
fn a_new_gpu_renderer_receives_every_texture_again() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([
        {"id":"title","kind":"NText","props":{"text":"Games"}},
        {"id":"art","kind":"NImage","props":{"width":40,"height":40,"source":{"uri":"https://example.test/art.png"},"cachePolicy":"none"}},
        {"id":"icon","kind":"NIcon","props":{"size":18,"paths":["M0 0H24V24H0Z"]}}
    ]))
    .unwrap();
    ui.frame(400., 600., 1.).drop_without_applying_deltas();
    let request = ui.snapshot()["imageRequests"][0]["request"].as_u64().unwrap();
    ui.image_result(
        request,
        Some(std::sync::Arc::new(crate::assets::texture::Image {
            source_size: None,
            width: 2,
            height: 2,
            rgba: vec![255; 16],
        })),
        None,
    );
    let uploads = |ui: &mut ComponentDocument| {
        let mut output = ui.frame(400., 600., 1.);
        let deltas = std::mem::take(&mut output.textures_delta);
        output.drop_without_applying_deltas();
        let full_font = deltas
            .set
            .iter()
            .any(|(id, d)| *id == egui::TextureId::default() && d.iter().any(|d| d.pos.is_none()));
        let others = deltas.set.iter().filter(|(id, _)| *id != &egui::TextureId::default()).count();
        let mut deltas = deltas;
        deltas.clear();
        (full_font, others)
    };
    // The layout pass above consumed the initial atlas/icon upload; a fresh GPU needs all three.
    ui.reupload_textures();
    assert_eq!(uploads(&mut ui), (true, 2), "first frame uploads the atlas, the image and the icon");
    assert_eq!(uploads(&mut ui).1, 0);
    ui.reupload_textures();
    assert_eq!(
        uploads(&mut ui),
        (true, 2),
        "a fresh renderer gets the atlas, the image and the icon again"
    );
}

#[test]
fn controls_layout_and_state_are_owned_by_rust() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"button","kind":"NButton","children":[{"id":"text","kind":"NText","props":{"text":"Save"}}]}, {"id":"input","kind":"NInput","props":{"label":"Name","defaultValue":"Ada"}}]),
    );
    let snapshot = ui.snapshot();
    assert_eq!(snapshot["nodes"][0]["label"], "Save");
    assert!(snapshot["nodes"][0]["rect"][3].as_f64().unwrap() >= 44.);
    assert_eq!(snapshot["nodes"][1]["value"], "Ada");
    ui.command(&json!({"action":"value","id":"input","value":"Grace"})).unwrap();
    frame(&mut ui);
    assert_eq!(ui.snapshot()["nodes"][1]["value"], "Grace");
}

#[test]
fn accessible_activation_uses_the_same_hit_test_as_pointer_input() {
    let mut ui = ComponentDocument::default();
    tree(&mut ui, json!([{"id":"save","kind":"NButton","props":{"label":"Save"}}]));
    ui.command(&json!({"action":"activate","id":"save"})).unwrap();
    frame(&mut ui);
    assert!(
        ui.snapshot()["events"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["id"] == "save" && e["type"] == "press")
    );
}

#[test]
fn disabled_and_read_only_controls_cannot_be_changed_by_the_host() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"off","kind":"NButton","props":{"label":"Off","disabled":true}}, {"id":"read","kind":"NInput","props":{"isReadOnly":true}}]),
    );
    assert!(ui.command(&json!({"action":"activate","id":"off"})).is_err());
    assert!(ui.command(&json!({"action":"value","id":"read","value":"changed"})).is_err());
}

#[test]
fn cancelled_pointer_does_not_activate_a_control() {
    let mut ui = ComponentDocument::default();
    tree(&mut ui, json!([{"id":"save","kind":"NButton","props":{"label":"Save"}}]));
    let r = ui.semantics[0].rect;
    ui.touch(0, r[0] + r[2] / 2., r[1] + r[3] / 2.);
    frame(&mut ui);
    ui.touch(3, 0., 0.);
    frame(&mut ui);
    assert!(ui.events.is_empty());
}

#[test]
fn invalid_updates_leave_the_existing_tree_intact() {
    let mut ui = ComponentDocument::default();
    tree(&mut ui, json!([{"id":"save","kind":"NButton","props":{"label":"Save"}}]));
    assert!(ui.set_tree(&json!([{"id":"bad","kind":"Unknown"}])).is_err());
    assert!(ui.set_tree(&json!([{"id":"x","kind":"NText"},{"id":"x","kind":"NText"}])).is_err());
    frame(&mut ui);
    assert_eq!(ui.semantics[0].id, "save");
}

#[test]
fn numeric_values_are_clamped_and_non_numeric_values_are_rejected() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"volume","kind":"NSlider","props":{"label":"Volume","min":10,"max":20}}]),
    );
    ui.command(&json!({"action":"value","id":"volume","value":500})).unwrap();
    frame(&mut ui);
    assert_eq!(ui.semantics[0].value, json!(20.));
    assert!(ui.command(&json!({"action":"value","id":"volume","value":"loud"})).is_err());
}

#[test]
fn events_are_delivered_once_and_state_survives_tree_updates() {
    let mut ui = ComponentDocument::default();
    let nodes = json!([{"id":"input","kind":"NInput"}]);
    tree(&mut ui, nodes.clone());
    ui.command(&json!({"action":"value","id":"input","value":"Ada"})).unwrap();
    assert_eq!(ui.take_snapshot()["events"].as_array().unwrap().len(), 1);
    assert!(ui.take_snapshot()["events"].as_array().unwrap().is_empty());
    ui.set_tree(&nodes).unwrap();
    frame(&mut ui);
    assert_eq!(ui.semantics[0].value, "Ada");
}

#[test]
fn accessibility_steps_and_validation_are_rust_owned_even_between_frames() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"volume","kind":"NSlider","props":{"label":"Volume","min":0,"max":10,"step":2,"defaultValue":2}}]),
    );
    ui.command(&json!({"action":"increment","id":"volume"})).unwrap();
    ui.command(&json!({"action":"increment","id":"volume"})).unwrap();
    ui.command(&json!({"action":"decrement","id":"volume"})).unwrap();
    frame(&mut ui);
    assert_eq!(ui.semantics[0].value, json!(4.));
    ui.command(&json!({"action":"value","id":"volume","value":7.1})).unwrap();
    frame(&mut ui);
    assert_eq!(ui.semantics[0].value, json!(8.));
}

#[test]
fn platform_preferences_are_partial_updates_owned_by_rust() {
    let mut ui = ComponentDocument::default();
    ui.command(&json!({"action":"environment","dark":true,"fontScale":1.5})).unwrap();
    ui.command(&json!({"action":"environment","reducedMotion":true})).unwrap();
    assert!(ui.dark);
    assert!(ui.reduced_motion);
    assert_eq!(ui.font_scale, 1.5);
}

#[test]
fn defaults_are_initial_values_and_text_limits_are_enforced_in_rust() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"input","kind":"NInput","props":{"defaultValue":"Ada","maxLength":4}}]),
    );
    ui.set_tree(&json!([{"id":"input","kind":"NInput","props":{"defaultValue":"Other","maxLength":4}}]))
        .unwrap();
    frame(&mut ui);
    assert_eq!(ui.semantics[0].value, "Ada");
    ui.command(&json!({"action":"value","id":"input","value":"Grace"})).unwrap();
    frame(&mut ui);
    assert_eq!(ui.semantics[0].value, "Grac");
}

#[test]
fn keyboard_steps_are_computed_by_the_rust_control() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"volume","kind":"NSlider","props":{"label":"Volume","defaultValue":30,"step":2}}]),
    );
    ui.command(&json!({"action":"focus","id":"volume"})).unwrap();
    ui.command(&json!({"action":"key","key":"ArrowRight","pressed":true})).unwrap();
    ui.command(&json!({"action":"key","key":"ArrowRight","pressed":false})).unwrap();
    frame(&mut ui);
    assert_eq!(ui.semantics[0].value, json!(32.));
}

#[test]
fn theme_defaults_share_the_reference_semantic_palette_and_accept_scoped_overrides() {
    let light = theme::Palette::new(false);
    let dark = theme::Palette::new(true);
    assert_eq!(light.get("background"), Color32::from_rgb(245, 245, 245));
    assert_eq!(dark.get("background"), Color32::from_rgb(6, 6, 7));
    assert_eq!(light.get("accent"), Color32::from_rgb(4, 133, 247));
    assert_eq!(light.visuals().widgets.inactive.corner_radius, egui::CornerRadius::same(8));
    let custom = theme::Palette::configure(&light, &json!({"colors":{"accent":"#7c3aed","accent-foreground":"white"}}), false);
    assert_eq!(custom.get("accent"), Color32::from_rgb(124, 58, 237));
    assert_eq!(custom.get("accent-foreground"), Color32::WHITE);
    assert_eq!(custom.get("focus"), custom.get("accent"));
    assert_eq!(custom.get("action"), custom.get("accent"));
    let fields = theme::Palette::configure(&custom, &json!({"colors":{"surface":"#123456","foreground":"#abcdef"}}), false);
    assert_eq!(fields.get("field-background"), fields.get("surface"));
    assert_eq!(fields.get("field-foreground"), fields.get("foreground"));
    let explicit = theme::Palette::configure(&fields, &json!({"colors":{"field-background":"#345678"}}), false);
    assert_ne!(explicit.get("field-background"), explicit.get("surface"));
    assert_eq!(light.get("accent"), Color32::from_rgb(4, 133, 247));
    assert_eq!(custom.get("surface"), light.get("surface"));
}

#[test]
fn utilities_resolve_semantic_palette_dark_states_breakpoints_and_arbitrary_values_in_rust() {
    let palette = theme::Palette::new(true);
    let props = json!({"className":"p-4 px-2 w-1/2 h-[52px] rounded-xl bg-white dark:bg-accent/50 text-foreground border-2 border-danger gap-3 md:w-[240px] disabled:opacity-30"});
    let style = style::Style::resolve(
        "NCard",
        &props,
        &palette,
        style::Conditions {
            dark: true,
            disabled: true,
            viewport: 900.,
            ..Default::default()
        },
        Vec2::new(400., 600.),
    );
    assert_eq!(style.padding.left, 8.);
    assert_eq!(style.padding.top, 16.);
    assert_eq!(style.width, Some(240.));
    assert_eq!(style.height, Some(52.));
    assert_eq!(style.radius, 12.);
    assert_eq!(style.opacity, 0.3);
    assert!((126..=129).contains(&style.background.unwrap().a()));
    assert_eq!(style.foreground, Some(palette.get("foreground")));
    assert_eq!(style.border, Some(palette.get("danger")));
    assert_eq!(style.border_width, 2.);
    let arbitrary = style::Style::resolve(
        "NText",
        &json!({"className":"text-[#123456] bg-blue-500"}),
        &palette,
        style::Conditions::default(),
        Vec2::splat(400.),
    );
    assert_eq!(arbitrary.foreground, Some(Color32::from_rgb(18, 52, 86)));
    assert!(arbitrary.background.is_some());
}

#[test]
fn utility_padding_and_sizing_change_actual_control_bounds_and_hidden_controls_leave_accessibility() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"card","kind":"NCard","props":{"className":"p-0"},"children":[{"id":"button","kind":"NButton","props":{"label":"Save","className":"w-[180px] h-12"}}]}]),
    );
    let before = ui.semantics[0].rect;
    assert_eq!(before[2], 180.);
    assert_eq!(before[3], 48.);
    ui.set_tree(&json!([{"id":"card","kind":"NCard","props":{"className":"p-6"},"children":[{"id":"button","kind":"NButton","props":{"label":"Save","className":"w-[180px] h-12"}}]}])).unwrap();
    frame(&mut ui);
    assert!((ui.semantics[0].rect[0] - before[0] - 24.).abs() < 0.1);
    ui.set_tree(&json!([{"id":"button","kind":"NButton","props":{"label":"Save","className":"hidden"}}]))
        .unwrap();
    frame(&mut ui);
    assert!(ui.semantics.is_empty());
}

#[test]
fn nested_themes_do_not_leak_colors_to_siblings_and_idle_frames_do_not_emit_updates() {
    let mut ui = ComponentDocument::default();
    tree(
        &mut ui,
        json!([{"id":"theme","kind":"NTheme","props":{"theme":"dark","colors":{"background":"#123456"}},"children":[{"id":"text","kind":"NText","props":{"text":"Hello"}}]}]),
    );
    assert_eq!(ui.background, Color32::from_rgb(18, 52, 86));
    assert!(!ui.palette.dark);
    let revision = ui.revision;
    frame(&mut ui);
    assert_eq!(ui.revision, revision);
}

#[test]
fn system_scheme_picks_token_overrides_and_keeps_platform_defaults_in_rust() {
    let props = json!({"theme":"system","colors":{"accent":"#123456"},"themes":{"dark":{"accent":"#abcdef"}},"radius":10});
    let light = theme::Palette::configure(&theme::Palette::platform(false, true), &props, false);
    let dark = theme::Palette::configure(&theme::Palette::platform(false, true), &props, true);
    assert_eq!(light.get("accent"), Color32::from_rgb(18, 52, 86));
    assert_eq!(dark.get("accent"), Color32::from_rgb(171, 205, 239));
    assert!(dark.native);
    assert_eq!(dark.radius, 10.);
    let native_button = style::Style::resolve("NButton", &json!({}), &dark, style::Conditions::default(), Vec2::splat(400.));
    assert_eq!(native_button.radius, 15.);
}

#[test]
fn every_implemented_component_fits_phone_tablet_and_desktop_widths_with_large_text() {
    let kinds = [
        "NTheme",
        "NCard",
        "NImage",
        "NText",
        "NButton",
        "NPress",
        "NCloseButton",
        "NCheck",
        "NSwitch",
        "NToggleButton",
        "NInput",
        "NTextarea",
        "NSearchField",
        "NInputOtp",
        "NSlider",
        "NNumberField",
        "NProgress",
        "NLoading",
        "NDivider",
        "NChip",
        "NBadge",
        "NRequired",
        "NKbd",
        "NCode",
        "NLink",
        "NTooltip",
        "NScrollShadow",
        "NDisclosure",
        "NRadio",
        "NRadioGroup",
        "NButtonGroup",
        "NTabs",
        "NTabsContent",
        "NSelect",
        "NAlert",
        "NEmptyState",
        "NActionItem",
        "NMenuItem",
        "NSkeleton",
        "NSkeletonGroup",
    ];
    for native in [false, true] {
        for width in [240., 320., 768., 1200.] {
            for scale in [1., 2., 3.] {
                for kind in kinds {
                    let mut ui = ComponentDocument::default();
                    let mut props = json!({"label":"A longer label that should wrap on smaller screens","defaultExpanded":true,"items":[{"label":"A long first option label","value":"one"},{"label":"Second option label","value":"two"}],"code":"const a_long_identifier_without_spaces_to_test_wrapping = 123456789;"});
                    if ["NSlider", "NNumberField"].contains(&kind) {
                        props["defaultValue"] = json!(50);
                    }
                    if kind == "NProgress" {
                        props["showLabel"] = json!(true);
                        props["value"] = json!(50);
                    }
                    if kind == "NTabs" {
                        props["value"] = json!("one");
                    }
                    if kind == "NSelect" {
                        props["value"] = json!({"label":"A long selected option label that should fit","value":"one"});
                    }
                    let child = json!({"id":"child","kind":"NText","props":{"text":"Content that should wrap naturally in this component"}});
                    ui.set_tree(&json!([{"id":"card","kind":"NCard","children":[{"id":"control","kind":kind,"props":props,"children":[child]}]}]))
                        .unwrap();
                    ui.command(&json!({"action":"environment","fontScale":scale,"native":native})).unwrap();
                    ui.frame(width, 600., 1.).drop_without_applying_deltas();
                    // Use actual layout bounds, not accessibility rectangles clipped to the viewport.
                    let [x, _, w, _] = ui.layout_bounds("control").unwrap();
                    assert!(
                        x >= -0.5 && x + w <= width + 0.5,
                        "{kind} overflows width {width} at scale {scale}, native={native}: x={x}, width={w}"
                    );
                }
            }
        }
    }
}

#[test]
fn resizing_preserves_control_values_and_updates_responsive_breakpoints() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"input","kind":"NInput","props":{"label":"Name","defaultValue":"Ada","className":"w-full md:w-[300px]"}}]))
        .unwrap();
    ui.frame(400., 600., 1.).drop_without_applying_deltas();
    ui.command(&json!({"action":"value","id":"input","value":"Grace"})).unwrap();
    ui.frame(900., 600., 1.).drop_without_applying_deltas();
    assert_eq!(ui.layout_bounds("input").unwrap()[2], 300.);
    assert_eq!(ui.semantics[0].value, "Grace");
    ui.frame(240., 400., 1.).drop_without_applying_deltas();
    assert!(ui.layout_bounds("input").unwrap()[2] <= 240.);
    assert_eq!(ui.semantics[0].value, "Grace");
}

#[test]
fn disclosure_wraps_and_keeps_expansion_state_in_rust() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"disclosure","kind":"NDisclosure","props":{"title":"A long disclosure header that must wrap","defaultExpanded":false},"children":[{"id":"child","kind":"NText","props":{"text":"Content"}}]}])).unwrap();
    ui.frame(240., 600., 1.).drop_without_applying_deltas();
    assert_eq!(ui.semantics[0].value, false);
    ui.command(&json!({"action":"activate","id":"disclosure"})).unwrap();
    ui.frame(240., 600., 1.).drop_without_applying_deltas();
    assert_eq!(ui.semantics[0].value, true);
    assert!(ui.events.iter().any(|event| event["id"] == "disclosure" && event["value"] == true));
}

#[test]
fn expanded_select_options_fit_small_viewports_with_large_text() {
    for width in [240., 320.] {
        for scale in [1., 3.] {
            let mut ui = ComponentDocument::default();
            ui.set_tree(&json!([{"id":"select","kind":"NSelect","props":{"value":{"label":"First","value":"one"},"options":[{"label":"A very long option label that must wrap within the small screen","value":"one"},{"label":"Second option","value":"two"}]}}])).unwrap();
            ui.command(&json!({"action":"environment","fontScale":scale})).unwrap();
            ui.frame(width, 600., 1.).drop_without_applying_deltas();
            assert!(ui.semantics.iter().any(|s| s.id == "select" && s.label.contains("First")));
            ui.command(&json!({"action":"activate","id":"select"})).unwrap();
            for _ in 0..3 {
                ui.frame(width, 600., 1.).drop_without_applying_deltas();
            }
            let options: Vec<_> = ui.semantics.iter().filter(|s| s.id.contains(":option:")).collect();
            assert!(!options.is_empty(), "Select did not open");
            for option in options {
                let [x, _, w, _] = ui.layout_bounds(&option.id).unwrap();
                assert!(
                    x >= -0.5 && x + w <= width + 0.5,
                    "Select option overflows width {width} at scale {scale}: {x}+{w}"
                );
            }
        }
    }
}

#[test]
fn accessible_select_updates_its_own_value_and_closes_without_a_typescript_store() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"select","kind":"NSelect","props":{"defaultValue":"one","items":[{"label":"First","value":"one"},{"label":"Second","value":"two"}]}}])).unwrap();
    frame(&mut ui);
    assert!(ui.semantics.iter().any(|node| node.id == "select" && node.label.contains("First")));
    ui.command(&json!({"action":"activate","id":"select"})).unwrap();
    for _ in 0..3 {
        frame(&mut ui);
    }
    ui.command(&json!({"action":"activate","id":"select:option:1"})).unwrap();
    for _ in 0..3 {
        frame(&mut ui);
    }
    let select = ui.semantics.iter().find(|node| node.id == "select").unwrap();
    assert_eq!(select.value["value"], "two");
    assert!(select.label.contains("Second"));
    assert!(!ui.semantics.iter().any(|node| node.id.contains(":option:")));
}

#[test]
fn native_form_keeps_reference_field_spacing_and_rust_positioned_platform_attachments() {
    let mut ui = ComponentDocument::default();
    ui.command(&json!({"action":"environment","native":true,"overlays":["icon","picker"]}))
        .unwrap();
    ui.set_tree(
        &json!([{"id":"theme","kind":"NTheme","props":{"className":"p-2.5 gap-0","colors":{"background":"transparent"}},"children":[
          {"id":"card","kind":"NCard","props":{"className":"mb-2.5 w-full flex-row items-center gap-0 p-2"},"children":[
            {"id":"avatar","kind":"NImage","props":{"className":"mr-2.5 h-16 w-16 border-0 bg-transparent p-0"}},
            {"id":"photo","kind":"NPress","props":{"className":"flex-row items-center gap-0"},"children":[
              {"id":"icon","kind":"NCard","props":{"className":"h-[23px] w-[23px] border-0 bg-transparent p-0"}},
              {"id":"photo-label","kind":"NText","props":{"text":"Change profile image","className":"ml-2"}}
            ]}
          ]},
          {"id":"name","kind":"NInput","props":{"label":"Full name","inputProps":{"maxLength":50}}},
          {"id":"mobile","kind":"NInput","props":{"label":"Mobile","keyboardType":"numeric"}},
          {"id":"referral","kind":"NInput","props":{"label":"Referral Code"}},
          {"id":"date","kind":"NCard","props":{"className":"mb-2.5 w-full gap-1.5 border-0 bg-transparent p-0"},"children":[
            {"id":"date-label","kind":"NText","props":{"text":"Date of birth","className":"px-1.5 font-medium"}},
            {"id":"picker","kind":"NCard","props":{"className":"w-full h-9 border-0 bg-transparent p-0"}}
          ]},
          {"id":"about","kind":"NInput","props":{"label":"About","multiline":true,"textAreaProps":{"numberOfLines":3,"maxLength":300}}},
          {"id":"submit","kind":"NButton","props":{"className":"w-full"},"children":[{"id":"submit-label","kind":"NText","props":{"text":"UPDATE"}}]}
        ]}]),
    )
    .unwrap();
    ui.frame(402., 900., 1.).drop_without_applying_deltas();
    assert_eq!(ui.layout_bounds("card").unwrap(), [10., 10., 382., 82.]);
    assert_eq!(ui.layout_bounds("mobile").unwrap()[1] - ui.layout_bounds("name").unwrap()[1], 90.);
    let name = ui.semantics.iter().find(|node| node.id == "name").unwrap();
    assert_eq!(name.max_length, Some(50));
    assert_eq!(name.rect[3], 48.);
    assert_eq!(
        ui.semantics.iter().find(|node| node.id == "mobile").unwrap().keyboard_type.as_deref(),
        Some("numeric")
    );
    assert_eq!(ui.semantics.iter().find(|node| node.id == "about").unwrap().rect[3], 128.);
    assert_eq!(ui.layout_bounds("avatar").unwrap(), [19., 19., 64., 64.]);
    assert_eq!(ui.snapshot()["overlays"]["icon"][2], 23.);
}

#[test]
fn natural_grid_rows_share_the_tallest_cell_and_append_preserves_scroll() {
    let mut ui = ComponentDocument::default();
    let props = json!({"itemCount":90,"itemSize":80,"variableSize":true,"numColumns":3,"height":160,"overscan":1});
    let rows:Vec<_>=(0..12).map(|index|json!({"id":format!("row{index}"),"kind":"NListItem","props":{"index":index},"children":[{"id":format!("cell{index}"),"kind":"NView","props":{"height":if index==1{100}else{50},"className":"w-full"}}]})).collect();
    ui.set_tree(&json!([{"id":"list","kind":"NList","props":props,"children":rows}])).unwrap();
    ui.frame(330., 300., 1.).drop_without_applying_deltas();
    let a = ui.layout_bounds("cell0").unwrap();
    let b = ui.layout_bounds("cell1").unwrap();
    let c = ui.layout_bounds("cell3").unwrap();
    assert!((b[0] - a[0] - a[2]).abs() < 1.);
    assert!((a[1] - b[1]).abs() < 0.5);
    assert!((c[1] - a[1] - 100.).abs() < 1.);
    ui.scroll_flow_list("list", &props, &json!({"kind":"offset","offset":600})).unwrap();
    ui.frame(330., 300., 1.).drop_without_applying_deltas();
    let before = ui.plan_flow_list("list", &props)["offset"].as_f64().unwrap();
    let mut appended = props.clone();
    appended["itemCount"] = json!(120);
    let after = ui.plan_flow_list("list", &appended);
    assert!(before > 500.);
    assert_eq!(after["offset"], json!(before));
    assert_eq!(after["start"].as_u64().unwrap() % 3, 0);
}

#[test]
fn inline_actions_keep_wrapped_typography_and_accessible_hit_targets() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"paragraph","kind":"NText","children":[
      {"id":"prefix","kind":"NText","props":{"text":"Read our "}},
      {"id":"terms","kind":"NPress","children":[{"id":"terms-text","kind":"NText","props":{"className":"text-accent font-semibold","text":"Terms of Use"}}]},
      {"id":"suffix","kind":"NText","props":{"text":" before continuing with your account."}}
    ]}])).unwrap();
    ui.frame(220., 300., 1.).drop_without_applying_deltas();
    let parent = ui.layout_bounds("paragraph").unwrap();
    let link = ui.layout_bounds("terms").unwrap();
    assert!(link[0] >= parent[0] && link[1] >= parent[1]);
    assert!(link[1] + link[3] <= parent[1] + parent[3] + 1.);
    ui.take_snapshot();
    ui.command(&json!({"action":"activate","id":"terms"})).unwrap();
    for _ in 0..2 {
        ui.frame(220., 300., 1.).drop_without_applying_deltas();
    }
    assert!(
        ui.snapshot()["events"]
            .as_array()
            .unwrap()
            .iter()
            .any(|event| event["id"] == "terms" && event["type"] == "press")
    );
    ui.set_tree(&json!([{"id":"url","kind":"NText","props":{"text":"Visit https://example.com/help.","linkify":true}}]))
        .unwrap();
    ui.frame(220., 300., 1.).drop_without_applying_deltas();
    let id = ui.snapshot()["nodes"].as_array().unwrap().iter().find(|n| n["kind"] == "NLink").unwrap()["id"]
        .as_str()
        .unwrap()
        .to_owned();
    ui.take_snapshot();
    ui.command(&json!({"action":"activate","id":id})).unwrap();
    for _ in 0..2 {
        ui.frame(220., 300., 1.).drop_without_applying_deltas();
    }
    assert!(
        ui.snapshot()["events"]
            .as_array()
            .unwrap()
            .iter()
            .any(|event| event["value"]["href"] == "https://example.com/help")
    );
}

#[test]
fn root_component_defaults_and_style_arrays_preserve_explicit_overrides() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"theme","kind":"NTheme","props":{"components":{"NView":{"className":"p-4 bg-surface"}}},"children":[{"id":"view","kind":"NView","props":{"className":"w-full p-2","style":[{"padding":12},false,[{"paddingLeft":20},{"height":80}]]},"children":[{"id":"caption","kind":"NText","props":{"text":"Hello"}}]}]}])).unwrap();
    ui.frame(320., 200., 1.).drop_without_applying_deltas();
    let bounds = ui.layout_bounds("view").unwrap();
    let child = ui.layout_bounds("caption").unwrap();
    assert!((bounds[3] - 80.).abs() < 1.);
    assert!((child[0] - bounds[0] - 20.).abs() < 1., "bounds={bounds:?},child={child:?}");
    assert!((child[1] - bounds[1] - 12.).abs() < 1.);
}

#[test]
fn stretching_a_text_box_does_not_justify_its_words() {
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"box","kind":"NView","props":{"className":"w-full items-stretch"},"children":[{"id":"text","kind":"NText","props":{"text":"Measured content Measured content Measured content"}}]}])).unwrap();
    let output = ui.frame(220., 300., 1.);
    let mut found = false;
    for shape in &output.shapes {
        if let egui::Shape::Text(text) = &shape.shape {
            assert!(!text.galley.job.justify);
            found = true;
        }
    }
    assert!(found);
    output.drop_without_applying_deltas();
}

#[test]
fn stretched_card_rows_keep_twelve_point_gutters_with_wrapped_text_and_resizing() {
    let card = |id: &str, text: &str| {
        json!({"id":id,"kind":"NCard","props":{"className":"flex-1 gap-3 p-3"},"children":[
            {"id":format!("{id}-icon"),"kind":"NView","props":{"className":"mb-2.5"},"children":[
                {"id":format!("{id}-glyph"),"kind":"NIcon","props":{"name":"🏆","size":32}}
            ]},
            {"id":format!("{id}-title"),"kind":"NText","props":{"text":"Feature"}},
            {"id":format!("{id}-body"),"kind":"NText","props":{"text":text}}
        ]})
    };
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([{"id":"page","kind":"NView","props":{"className":"gap-3 p-3"},"children":[
        {"id":"first-row","kind":"NView","props":{"className":"flex-row items-stretch gap-3"},"children":[
            card("short", "Quick play"), card("long", "Longer descriptions wrap over several lines on a narrow phone and must keep every word visible.")
        ]},
        {"id":"second-row","kind":"NView","props":{"className":"flex-row items-stretch gap-3"},"children":[
            card("next", "More games"), card("last", "More features")
        ]}
    ]}]))
    .unwrap();
    for width in [320., 390., 900.] {
        ui.frame(width, 1000., 1.).drop_without_applying_deltas();
        let short = ui.layout_bounds("short").unwrap();
        let long = ui.layout_bounds("long").unwrap();
        let next = ui.layout_bounds("next").unwrap();
        let body = ui.layout_bounds("long-body").unwrap();
        assert!((short[3] - long[3]).abs() < 1., "{width}: {short:?}, {long:?}");
        assert!((long[0] - short[0] - short[2] - 12.).abs() < 1.);
        assert!((next[1] - long[1] - long[3] - 12.).abs() < 1.);
        assert!(body[1] + body[3] <= long[1] + long[3] - 12.);
    }
}

#[cfg(any(target_os = "ios", target_os = "macos"))]
#[test]
fn unicode_text_and_literal_icons_keep_color_cache_and_original_semantics() {
    let text = "Games 🎮 👨‍👩‍👧‍👦 🇮🇳";
    let mut ui = ComponentDocument::default();
    ui.set_tree(&json!([
      {"id":"text","kind":"NText","props":{"text":text,"className":"text-danger"}},
      {"id":"icon","kind":"NIcon","props":{"name":"🏆","size":36,"accessibilityLabel":"Trophy"}},
      {"id":"decoration","kind":"NIcon","props":{"name":"💎","size":24}}
    ]))
    .unwrap();
    let output = ui.frame(400., 300., 2.);
    let labels: Vec<_> = output
        .shapes
        .iter()
        .filter_map(|s| if let egui::Shape::Text(text) = &s.shape { Some(text) } else { None })
        .collect();
    assert!(labels.iter().any(|t| t.galley.text() == text));
    assert!(labels.iter().any(|t| t.galley.text() == "🏆"));
    assert!(
        labels
            .iter()
            .flat_map(|t| &t.galley.rows)
            .flat_map(|r| &r.glyphs)
            .any(|g| g.is_color && g.uv_rect.size.x > 0.)
    );
    assert_eq!(ui.snapshot()["nodes"][0]["label"], text);
    assert!(!ui.snapshot()["nodes"].as_array().unwrap().iter().any(|n| n["id"] == "decoration"));
    output.drop_without_applying_deltas();
    let second = ui.frame(400., 300., 2.);
    assert!(second.textures_delta.set.is_empty(), "idle glyphs must reuse their GPU atlas");
    second.drop_without_applying_deltas();
}

#[test]
fn backdrop_filters_resolve_theme_classes_and_explicit_overrides() {
    let palette = theme::Palette::configure(
        &theme::Palette::new(true),
        &json!({"components":{
            "NCard":{"className":"backdrop-blur-md bg-background/30"}
        }}),
        true,
    );
    let resolve = |props| style::Style::resolve("NCard", &props, &palette, style::Conditions::default(), Vec2::splat(400.));
    let themed = resolve(json!({}));
    assert_eq!(themed.backdrop_blur, 12.);
    assert!((75..=78).contains(&themed.background.unwrap().a()));
    assert_eq!(resolve(json!({"className":"backdrop-blur-none"})).backdrop_blur, 0.);
    assert_eq!(resolve(json!({"className":"backdrop-blur-[18px]"})).backdrop_blur, 18.);
    assert_eq!(resolve(json!({"style":{"backdropFilter":"blur(24px)"}})).backdrop_blur, 24.);
    assert_eq!(resolve(json!({"style":{"backdropFilter":"none"}})).backdrop_blur, 0.);
}

#[test]
fn list_content_padding_scrolls_away_without_shrinking_the_viewport() {
    for variable in [false, true] {
        let mut doc = ComponentDocument::default();
        let rows: Vec<_> = (0..10)
            .map(|index| {
                json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index},"children":[
                    {"id":format!("item-{index}"),"kind":"NPress","props":{"height":80,"width":376,"className":"gap-0 p-0"}}
                ]})
            })
            .collect();
        doc.set_tree(
            &json!([{"id":"list","kind":"NList","props":{"height":240,"itemCount":10,"itemSize":80,"variableSize":variable,
            "contentContainerClassName":"p-3","showsVerticalScrollIndicator":false},"children":rows}]),
        )
        .unwrap();
        for _ in 0..4 {
            frame(&mut doc);
        }
        assert_eq!(
            bounds(&doc, "list"),
            Rect::from_min_size(Pos2::ZERO, Vec2::new(400., 240.)),
            "full viewport, variable={variable}"
        );
        assert_eq!(bounds(&doc, "item-0").min, Pos2::new(12., 12.));
        doc.command(&json!({"action":"listScroll","id":"list","offset":40})).unwrap();
        for _ in 0..4 {
            frame(&mut doc);
        }
        assert_eq!(bounds(&doc, "item-0").top(), -28., "padding moves with content, variable={variable}");
        assert_eq!(doc.semantics.iter().find(|n| n.id == "item-0").unwrap().rect[1], 0.);
        let last = doc
            .semantics
            .iter()
            .filter(|n| n.id.starts_with("item-"))
            .map(|n| n.rect[1] + n.rect[3])
            .fold(0., f32::max);
        assert_eq!(last, 240., "content reaches the viewport bottom while scrolling, variable={variable}");
        doc.command(&json!({"action":"listScroll","id":"list","kind":"end"})).unwrap();
        for _ in 0..4 {
            frame(&mut doc);
        }
        assert_eq!(
            bounds(&doc, "item-9").bottom(),
            228.,
            "bottom padding is only at the content end, variable={variable}"
        );
    }
}

#[test]
fn filling_lists_use_the_full_remaining_height_without_an_extra_bottom_inset() {
    let mut doc = ComponentDocument::default();
    doc.set_tree(
        &json!([{"id":"list","kind":"NList","props":{"variableSize":true,"fillViewport":true,"itemCount":100,
        "itemSize":80,"contentContainerClassName":"p-3"},"children":[{"id":"row","kind":"NListItem","props":{"index":0},"children":[
            {"id":"item","kind":"NPress","props":{"height":80,"width":376}}
        ]}]}]),
    )
    .unwrap();
    for _ in 0..4 {
        frame(&mut doc);
    }
    assert_eq!(bounds(&doc, "list"), Rect::from_min_size(Pos2::ZERO, Vec2::new(400., 600.)));
    doc.command(&json!({"action":"listScroll","id":"list","offset":40})).unwrap();
    for _ in 0..4 {
        frame(&mut doc);
    }
    assert_eq!(bounds(&doc, "list").top(), 0.);
}

#[test]
fn delete_account_action_is_centered_in_its_card() {
    for width in [320., 390., 768.] {
        let mut ui = ComponentDocument::default();
        ui.set_tree(&json!([{"id":"card","kind":"NCard","props":{"width":width,"className":"p-4"},"children":[
            {"id":"actions","kind":"NView","props":{"className":"mt-2.5 w-full flex-row justify-center"},"children":[
                {"id":"delete","kind":"NButton","props":{"label":"Delete My Account"}}
            ]}
        ]}]))
        .unwrap();
        for _ in 0..3 {
            ui.frame(width, 600., 1.).drop_without_applying_deltas();
        }
        let rect = ui.semantics.iter().find(|n| n.id == "delete").unwrap().rect;
        assert!((rect[0] + rect[2] / 2. - width / 2.).abs() <= 2., "width={width} rect={rect:?}");
    }
}

#[test]
fn analytics_bars_share_a_bottom_baseline() {
    let mut ui = ComponentDocument::default();
    let columns: Vec<Value> = [4., 20., 65., 130.].iter().enumerate().map(|(i, h)| json!({
        "id":format!("col{i}"),"kind":"NView","props":{"width":60,"height":170},"children":[
            {"id":format!("plot{i}"),"kind":"NView","props":{"height":150,"className":"w-full"},"children":[
                {"id":format!("anchor{i}"),"kind":"NView","props":{"height":h,"className":"absolute right-0 bottom-0 left-0 items-center"},"children":[
                    {"id":format!("bar{i}"),"kind":"NView","props":{"height":h,"width":24,"style":{"backgroundColor":"red"}}}
                ]}
            ]},
            {"id":format!("label{i}"),"kind":"NText","props":{"text":"Game","numberOfLines":1}}
        ]
    })).collect();
    ui.set_tree(&json!([{"id":"chart","kind":"NView","props":{"className":"flex-row items-end","height":170},"children":columns}]))
        .unwrap();
    for _ in 0..3 {
        ui.frame(390., 600., 1.).drop_without_applying_deltas();
    }
    let base = ui.layout_rects["bar0"].bottom();
    for i in 1..4 {
        assert!((ui.layout_rects[&format!("bar{i}")].bottom() - base).abs() < 1.);
    }
}

#[test]
fn configured_fonts_can_attach_a_surface_before_the_first_frame() {
    let mut ui = ComponentDocument::default();
    fonts::configure(&ui.context);
    ui.fonts_ready = true;
    ui.reupload_textures();
    assert_eq!(ui.context.cumulative_frame_nr(), 0);
    let first = ui.frame(390., 844., 1.);
    assert!(!first.textures_delta.set.is_empty());
    first.drop_without_applying_deltas();
    ui.reupload_textures();
    let reattached = ui.frame(390., 844., 1.);
    assert!(!reattached.textures_delta.set.is_empty());
    reattached.drop_without_applying_deltas();
}

#[test]
fn hiding_the_page_indicator_preserves_scrolling_and_nested_list_policies() {
    for native in [false, true] {
        for indicator in [None, Some(false), Some(true)] {
            let mut doc = ComponentDocument::default();
            doc.command(&json!({"action":"environment","native":native})).unwrap();
            let rows: Vec<_> = (0..18)
                .map(|i| json!({"id":format!("row-{i}"),"kind":"NText","props":{"text":format!("Row {i}"),"height":48}}))
                .collect();
            let props = indicator.map_or(
                json!({"className":"w-full"}),
                |show| json!({"className":"w-full","showsVerticalScrollIndicator":show}),
            );
            doc.set_tree(&json!([{"id":"theme","kind":"NTheme","children":[{"id":"page","kind":"NView","props":props,"children":rows}]}]))
                .unwrap();
            for _ in 0..3 {
                doc.frame(320., 200., 1.).drop_without_applying_deltas();
            }
            assert_eq!(
                root_scrollbar(&doc.tree),
                if indicator == Some(false) {
                    egui::scroll_area::ScrollBarVisibility::AlwaysHidden
                } else {
                    egui::scroll_area::ScrollBarVisibility::VisibleWhenNeeded
                }
            );
            let before = doc.layout_rects["row-5"].top();
            doc.touch(1, 160., 100.);
            doc.frame(320., 200., 1.).drop_without_applying_deltas();
            doc.scroll(0., -150.);
            for _ in 0..15 {
                doc.frame(320., 200., 1.).drop_without_applying_deltas();
            }
            assert!(
                doc.layout_rects["row-5"].top() < before - 40.,
                "hidden indicators must preserve scrolling, native={native}, indicator={indicator:?}"
            );
        }
    }
    let mut doc = ComponentDocument::default();
    doc.set_tree(&json!([{"id":"page","kind":"NView","children":[{"id":"nested","kind":"NList","props":{"showsVerticalScrollIndicator":false,"itemCount":0,"itemSize":48}}]}]))
        .unwrap();
    assert_eq!(root_scrollbar(&doc.tree), egui::scroll_area::ScrollBarVisibility::VisibleWhenNeeded);
}

#[test]
fn stable_frames_only_publish_a_new_snapshot_when_something_changes() {
    let mut doc = ComponentDocument::default();
    tree(
        &mut doc,
        json!([
            {"id":"row","kind":"NView","props":{"className":"w-full"},
             "children":[{"id":"button","kind":"NButton","props":{"text":"Continue"}}]}
        ]),
    );
    doc.command(&json!({"action":"environment","overlays":["row"]})).unwrap();
    for _ in 0..12 {
        doc.frame(390., 600., 1.).drop_without_applying_deltas();
    }
    let settled = doc.snapshot();
    for _ in 0..12 {
        doc.frame(390., 600., 1.).drop_without_applying_deltas();
    }
    assert_eq!(doc.snapshot(), settled);
    doc.frame(320., 600., 1.).drop_without_applying_deltas();
    assert!(doc.revision() > settled["revision"].as_u64().unwrap());
    assert_ne!(doc.snapshot()["overlays"]["row"], settled["overlays"]["row"]);
}

#[test]
fn custom_fonts_validate_before_replacing_the_document_fonts() {
    use base64::Engine;
    let mut doc = ComponentDocument::default();
    tree(&mut doc, json!([{"id":"label","kind":"NText","props":{"children":"Kidster"}}]));
    doc.frame(400., 600., 1.).drop_without_applying_deltas();
    let bytes = include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/Inter-Bold.ttf"));
    let regular = base64::engine::general_purpose::STANDARD.encode(bytes);
    let installed = |doc: &ComponentDocument| doc.context.fonts(|fonts| fonts.definitions().font_data.contains_key("app-regular"));
    assert!(!installed(&doc));
    doc.command(&json!({"action":"fonts","regular":regular,"bold":regular})).unwrap();
    doc.frame(400., 600., 1.).drop_without_applying_deltas();
    assert!(installed(&doc));
    for invalid in [json!(null), json!("invalid!"), json!("YWJj")] {
        assert!(doc.command(&json!({"action":"fonts","regular":invalid})).is_err());
        doc.frame(400., 600., 1.).drop_without_applying_deltas();
        assert!(installed(&doc));
        assert!(doc.layout_rects.contains_key("label"));
    }
    doc.command(&json!({"action":"resetFonts"})).unwrap();
    doc.frame(400., 600., 1.).drop_without_applying_deltas();
    assert!(!installed(&doc));
    doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[],"font":regular}}))
        .unwrap();
    doc.command(&json!({"action":"fonts","regular":regular,"bold":regular})).unwrap();
    doc.command(&json!({"action":"resetFonts"})).unwrap();
    doc.frame(400., 600., 1.).drop_without_applying_deltas();
    assert!(installed(&doc));
}

#[cfg(feature = "markdown")]
#[test]
fn markdown_uses_compact_block_spacing_and_reflows_on_native_and_web() {
    for css in [false, true] {
        for width in [320., 768.] {
            let mut doc = ComponentDocument::default();
            if css {
                doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
            }
            doc.set_tree(&json!([{"id":"article","kind":"NMarkdown","props":{"source":"## A heading\n\nA paragraph with **bold** words and [a link](https://example.org \"Tooltip\") which wraps naturally on a phone without inserting blank paragraphs.\n\n- First item\n- Second item\n\nA final paragraph.","styles":{"h2":{"fontSize":24}}}}])).unwrap();
            for _ in 0..3 {
                doc.frame(width, 2000., 1.).drop_without_applying_deltas();
            }
            let root = &doc.tree[0];
            assert_eq!(root.props["style"]["gap"], 12.);
            assert_eq!(root.children[0].props["style"]["fontSize"], 24);
            assert_eq!(root.children.len(), 4);
            assert!(doc.semantics.iter().any(|node| node.heading_level == Some(2)));
            let bounds: Vec<_> = root
                .children
                .iter()
                .map(|node| {
                    doc.layout_rects
                        .get(&node.id)
                        .copied()
                        .unwrap_or_else(|| panic!("missing {}, css={css}, width={width}, rects={:?}", node.id, doc.layout_rects))
                })
                .collect();
            for pair in bounds.windows(2) {
                assert!(
                    pair[1].top() >= pair[0].bottom(),
                    "Markdown blocks must not overlap: css={css}, width={width}, bounds={bounds:?}"
                );
                assert!(
                    pair[1].top() - pair[0].bottom() <= 24.,
                    "Markdown must not accumulate prose margins: {bounds:?}"
                );
            }
            assert!(
                doc.semantics
                    .iter()
                    .any(|node| node.kind == "NLink" && node.value == "https://example.org")
            );
        }
    }
}
