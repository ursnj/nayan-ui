use super::*;
fn rule(tag: &str, class: &str, declarations: &[(&str, &str)]) -> Value {
    let tests = if class.is_empty() {
        json!([["tag", tag]])
    } else {
        json!([["class", class]])
    };
    json!({"parts":[{"tests":tests,"relation":" "}],"specificity":if class.is_empty(){1}else{10},"layer":4,"declarations":declarations.iter().map(|(k,v)|json!([k,v,false])).collect::<Vec<_>>()})
}
fn draw(rules: Vec<Value>, nodes: Value, width: f32) -> ComponentDocument {
    let mut doc = ComponentDocument::default();
    doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":rules}})).unwrap();
    doc.command(&json!({"action":"tree","nodes":nodes})).unwrap();
    doc.frame(width, 1000., 1.).drop_without_applying_deltas();
    doc
}
fn box_for<'a>(doc: &'a ComponentDocument, id: &str) -> &'a BoxNode {
    doc.css.as_ref().unwrap().boxes.iter().find(|b| b.node.id == id).unwrap()
}

#[test]
fn selectable_page_text_excludes_controls_hidden_text_and_opted_out_regions() {
    let mut doc = draw(
        vec![],
        json!([{"id":"root","kind":"NView","children":[
            {"id":"heading","kind":"NText","props":{"tag":"h1","text":"Heading"}},
            {"id":"paragraph","kind":"NText","props":{"tag":"p","text":"A paragraph with café and 🌍."}},
            {"id":"button","kind":"NButton","props":{"text":"Do not copy buttons"}},
            {"id":"hidden","kind":"NText","props":{"text":"Hidden","style":{"display":"none"}}},
            {"id":"none","kind":"NView","props":{"style":{"userSelect":"none"}},"children":[{"id":"child","kind":"NText","props":{"text":"Not selectable"}}]},
            {"id":"private","kind":"NInput","props":{"secureTextEntry":true,"value":"Secret"}},
            {"id":"footer","kind":"NText","props":{"text":"Footer","style":{"marginTop":2000}}}
        ]}]),
        390.,
    );
    let passes = doc.css.as_ref().unwrap().layout_passes;
    let result = doc.command(&json!({"action":"textSelection","phase":"all"})).unwrap();
    assert_eq!(result["text"], "Heading\nA paragraph with café and 🌍.\nFooter");
    let output = doc.frame(390., 1000., 1.);
    assert!(!output.shapes.is_empty());
    output.drop_without_applying_deltas();
    assert_eq!(doc.snapshot()["selectionText"], result["text"]);
    assert_eq!(doc.css.as_ref().unwrap().layout_passes, passes, "selecting text must not rebuild layout");
}

#[test]
fn rendered_hover_cursors_follow_click_targets_without_relayout_and_reset_on_leave() {
    let mut doc = draw(
        vec![rule("", "control", &[("width", "200px"), ("height", "64px")])],
        json!([{"id":"root","kind":"NView","props":{"style":{"display":"flex","flexDirection":"column","gap":12}},"children":[
            {"id":"card","kind":"NLink","props":{"href":"/games","className":"control"},"children":[{"id":"card-title","kind":"NText","props":{"text":"Game card"}}]},
            {"id":"disabled","kind":"NButton","props":{"className":"control","disabled":true,"text":"Disabled"}},
            {"id":"field","kind":"NInput","props":{"className":"control","placeholder":"Name"}},
            {"id":"check","kind":"NCheck","props":{"label":"Remember"}},
            {"id":"label","kind":"NText","props":{"tag":"label","htmlFor":"check","text":"Toggle checkbox","className":"control"}},
            {"id":"disclosure","kind":"NDisclosure","children":[{"id":"summary","kind":"NText","props":{"tag":"summary","text":"Show details","className":"control"}}]},
            {"id":"plain","kind":"NText","props":{"text":"Plain content","className":"control"}}
        ]}]),
        390.,
    );
    let passes = doc.css.as_ref().unwrap().layout_passes;
    for (id, cursor) in [
        ("card", "pointer"),
        ("disabled", "not-allowed"),
        ("field", "text"),
        ("check", "pointer"),
        ("label", "pointer"),
        ("summary", "pointer"),
        ("plain", "default"),
    ] {
        let point = doc.semantics.iter().find(|node| node.id == id).map_or_else(
            || box_for(&doc, id).rect.center(),
            |node| Pos2::new(node.rect[0] + node.rect[2] * 0.5, node.rect[1] + node.rect[3] * 0.5),
        );
        doc.command(&json!({"action":"pointer","x":point.x,"y":point.y,"snapshot":false}))
            .unwrap();
        for _ in 0..2 {
            doc.frame(390., 1000., 1.).drop_without_applying_deltas();
        }
        assert_eq!(doc.snapshot()["cursor"], cursor, "hover over {id}");
    }
    let point = box_for(&doc, "card").rect.center();
    doc.command(&json!({"action":"pointer","x":point.x,"y":point.y,"snapshot":false}))
        .unwrap();
    for _ in 0..2 {
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    let revision = doc.revision;
    doc.command(&json!({"action":"pointer","gone":true,"snapshot":false})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.snapshot()["cursor"], "default");
    assert!(
        doc.revision > revision,
        "cursor changes must reach the browser even without semantic changes"
    );
    assert_eq!(doc.css.as_ref().unwrap().layout_passes, passes);
}

#[test]
fn flex_heading_blocks_remeasure_their_text_at_the_final_content_width() {
    for width in [288., 408., 592.] {
        let title = json!({"id":"title","kind":"NText","props":{"tag":"h2"},"children":[{"id":"title-text","kind":"NText","props":{"text":"Game statistics"}}]});
        let description = json!({"id":"description","kind":"NText","props":{"tag":"p"},"children":[{"id":"description-text","kind":"NText","props":{"text":"Your completed rounds, wins, and personal bests."}}]});
        let copy = json!({"id":"copy","kind":"NView","props":{"tag":"div"},"children":[title,description]});
        let action = json!({"id":"action","kind":"NLink","props":{"className":"action"},"children":[{"id":"label","kind":"NText","props":{"text":"Browse games"}},{"id":"icon","kind":"NIcon","props":{"size":15}}]});
        let heading = json!({"id":"heading","kind":"NView","props":{"tag":"div","className":"heading"},"children":[copy,action]});
        let grid = json!({"id":"grid","kind":"NView","props":{"tag":"div","style":{"display":"grid","gap":20}},"children":[heading]});
        let content = json!({"id":"content","kind":"NView","props":{"tag":"div"},"children":[grid]});
        let nodes = json!([{"id":"columns","kind":"NView","props":{"tag":"div","style":{"display":"grid","gridTemplateColumns":"216px minmax(0,1fr) 320px","gap":24}},"children":[{"id":"left","kind":"NView","props":{"tag":"aside"}},content,{"id":"right","kind":"NView","props":{"tag":"aside"}}]}]);
        let doc = draw(
            vec![
                rule(
                    "",
                    "heading",
                    &[
                        ("display", "flex"),
                        ("flex-wrap", "wrap"),
                        ("justify-content", "space-between"),
                        ("align-items", "center"),
                        ("gap", "16px"),
                    ],
                ),
                rule(
                    "h2",
                    "",
                    &[
                        ("font-size", "16px"),
                        ("font-weight", "650"),
                        ("letter-spacing", "-.045em"),
                        ("line-height", "1.5"),
                    ],
                ),
                rule("p", "", &[("font-size", "12.8px"), ("line-height", "1.8"), ("margin-top", "6px")]),
                rule(
                    "",
                    "action",
                    &[
                        ("display", "inline-flex"),
                        ("font-size", "12.8px"),
                        ("font-weight", "750"),
                        ("white-space", "nowrap"),
                        ("gap", "8px"),
                    ],
                ),
            ],
            nodes,
            width + 584.,
        );
        let copy = box_for(&doc, "copy");
        let title = box_for(&doc, "title");
        let description = box_for(&doc, "description");
        assert_eq!(title.rect.height(), 24., "text must use the available width {width}: {:?}", title.rect);
        assert_eq!(title.rect.width(), copy.content.width());
        assert_eq!(description.rect.width(), copy.content.width());
        assert!(
            description.rect.bottom() <= copy.content.bottom(),
            "the description must reserve its painted height at {width}"
        );
    }
    let narrow = draw(
        vec![rule("h2", "", &[("font-size", "16px"), ("line-height", "24px")])],
        json!([{"id":"copy","kind":"NView","props":{"tag":"div"},"children":[{"id":"title","kind":"NText","props":{"tag":"h2","text":"Game statistics"}}]}]),
        96.,
    );
    assert_eq!(box_for(&narrow, "title").rect.width(), 96.);
    assert_eq!(
        box_for(&narrow, "title").rect.height(),
        48.,
        "text must still wrap when the containing block is genuinely narrow"
    );
}

#[test]
fn fixed_negative_background_paints_under_content_and_stays_at_the_viewport() {
    let mut doc = draw(
        vec![
            rule("", "page", &[("background-color", "#101010")]),
            rule(
                "",
                "backdrop",
                &[
                    ("position", "fixed"),
                    ("inset", "0"),
                    ("width", "100vw"),
                    ("height", "100dvh"),
                    ("z-index", "-1"),
                    ("background-color", "#ff0000"),
                ],
            ),
        ],
        json!([{"id":"page","kind":"NView","props":{"className":"page"},"children":[{"id":"backdrop","kind":"NView","props":{"className":"backdrop"}},{"id":"title","kind":"NText","props":{"text":"Foreground content"}},{"id":"spacer","kind":"NView","props":{"style":{"height":2000}}}]}]),
        390.,
    );
    let output = doc.frame(390., 1000., 1.);
    let backdrop = output
        .shapes
        .iter()
        .position(|shape| matches!(&shape.shape, egui::Shape::Rect(rect) if rect.fill == Color32::RED))
        .unwrap();
    let content = output
        .shapes
        .iter()
        .position(|shape| matches!(&shape.shape, egui::Shape::Text(_)))
        .unwrap();
    assert!(backdrop < content, "a decorative background must not cover page content");
    output.drop_without_applying_deltas();
    doc.command(&json!({"action":"pointer","x":100,"y":100,"snapshot":false})).unwrap();
    for _ in 0..20 {
        doc.scroll(0., -20.);
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    assert!(doc.layout_bounds("page").unwrap()[1] < -200.);
    assert_eq!(doc.layout_bounds("backdrop").unwrap(), [0., 0., 390., 1000.]);
}

#[test]
fn touch_scrolling_after_wheel_input_starts_from_the_new_contact() {
    let mut doc = draw(vec![], json!([{"id":"page","kind":"NView","props":{"style":{"height":5000}}}]), 390.);
    doc.command(&json!({"action":"pointer","x":195,"y":338,"snapshot":false})).unwrap();
    doc.scroll(0., -600.);
    for _ in 0..30 {
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    let before = doc.root_scroll;
    assert!(before > 500.);
    doc.touch(0, 195., 650.);
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert!(
        (doc.root_scroll - before).abs() < 1.,
        "a new contact must not drag from the last wheel location"
    );
    for y in [620., 590., 560., 530., 500., 470., 440., 410., 380., 350.] {
        doc.touch(1, 195., y);
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    doc.touch(2, 195., 350.);
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert!(doc.root_scroll > before + 250., "the swipe must scroll down from its starting offset");
}

#[test]
fn scrolling_and_paint_only_hover_keep_the_measured_page() {
    let mut hover = rule("", "card", &[("color", "#ff0000"), ("transform", "translateY(-4px)")]);
    hover["parts"][0]["tests"].as_array_mut().unwrap().push(json!(["pseudo", "hover"]));
    let mut doc = draw(
        vec![rule("", "card", &[("height", "150px"), ("color", "#ffffff")]), hover],
        json!([{"id":"root","kind":"NView","children":(0..20).map(|i|json!({"id":format!("card{i}"),"kind":"NView","props":{"className":"card"},"children":[{"id":format!("title{i}"),"kind":"NText","props":{"text":"A favourite game"}}]})).collect::<Vec<_>>()}]),
        390.,
    );
    let passes = doc.css.as_ref().unwrap().layout_passes;
    let title_y = box_for(&doc, "title0").rect.top();
    assert_eq!(
        doc.command(&json!({"action":"pointer","x":30,"y":40,"snapshot":false})).unwrap(),
        Value::Null
    );
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(box_for(&doc, "title0").paint.foreground, Some(Color32::RED));
    assert_eq!(box_for(&doc, "title0").rect.top(), title_y - 4.);
    assert_eq!(doc.css.as_ref().unwrap().layout_passes, passes);
    for _ in 0..60 {
        doc.command(&json!({"action":"scroll","x":0,"y":-20,"snapshot":false})).unwrap();
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    assert!(doc.root_scroll > 500.);
    assert_eq!(box_for(&doc, "title0").paint.foreground, Some(Color32::WHITE));
    assert_eq!(box_for(&doc, "title0").rect.top(), title_y);
    assert_eq!(doc.css.as_ref().unwrap().layout_passes, passes, "scrolling must not rebuild Taffy layout");
}

#[test]
fn geometry_changing_hover_still_reflows_and_invalidated_trees_rebuild_paint() {
    let mut hover = rule("", "grow", &[("width", "200px")]);
    hover["parts"][0]["tests"].as_array_mut().unwrap().push(json!(["pseudo", "hover"]));
    let mut doc = draw(
        vec![rule("", "grow", &[("width", "100px"), ("height", "100px")]), hover],
        json!([{"id":"root","kind":"NView","props":{"className":"grow"},"children":[{"id":"title","kind":"NText","props":{"text":"Before"}}]}]),
        390.,
    );
    let passes = doc.css.as_ref().unwrap().layout_passes;
    doc.command(&json!({"action":"pointer","x":40,"y":40,"snapshot":false})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(box_for(&doc, "root").rect.width(), 200.);
    assert!(doc.css.as_ref().unwrap().layout_passes > passes);
    doc.command(&json!({"action":"tree","nodes":[{"id":"title","kind":"NText","props":{"text":"After"}}]}))
        .unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(text(box_for(&doc, "title").styled.as_ref().unwrap()), "After");
}

#[test]
fn css_icons_keep_svg_dimensions_and_do_not_shrink_labels() {
    let doc = draw(
        vec![
            rule(
                "",
                "badge",
                &[
                    ("display", "inline-flex"),
                    ("align-items", "center"),
                    ("gap", "5px"),
                    ("padding", "5px 9px"),
                    ("white-space", "nowrap"),
                    ("font-size", "11px"),
                ],
            ),
            rule("svg", "", &[("width", "14px"), ("height", "14px"), ("flex-shrink", "0")]),
        ],
        json!([{"id":"root","kind":"NTheme","children":[{"id":"badge","kind":"NText","props":{"className":"badge"},"children":[{"id":"icon","kind":"NIcon","props":{"size":24,"paths":"M1 1L23 23"}},{"id":"label","kind":"NText","props":{"text":"Premium"}}]}]}]),
        390.,
    );
    assert_eq!(box_for(&doc, "icon").rect.size(), Vec2::splat(14.));
    let badge = box_for(&doc, "badge");
    assert!(badge.rect.width() < 160. && badge.rect.width() > 70.);
    assert_eq!(badge.content.left() - badge.rect.left(), 9.);
    assert_eq!(box_for(&doc, "label").rect.height(), 17.);
}
#[test]
fn css_inherit_layer_order_and_shorthand_resets_match_browser_cascade() {
    let mut utility = rule("", "white", &[("color", "#ffffff"), ("padding-left", "90px")]);
    utility["layer"] = json!(3);
    let doc = draw(
        vec![
            rule("", "parent", &[("color", "#b8a7ff"), ("font-size", "28px")]),
            rule("a", "", &[("color", "inherit"), ("font-size", "inherit")]),
            utility,
            rule("a", "", &[("padding", "4px 12px")]),
        ],
        json!([{"id":"root","kind":"NTheme","props":{"className":"parent"},"children":[{"id":"link","kind":"NLink","props":{"className":"white","text":"Explore games"}}]}]),
        390.,
    );
    let link = box_for(&doc, "link");
    assert_eq!(link.paint.foreground, Some(Color32::from_rgb(184, 167, 255)));
    assert_eq!(link.paint.text_size, Some(28.));
    assert_eq!(link.content.left() - link.rect.left(), 12.);
}
#[test]
fn responsive_card_grid_uses_the_selected_breakpoint() {
    for (width, columns) in [(390., 1), (768., 2), (1440., 4)] {
        let mut tablet = rule("", "grid", &[("grid-template-columns", "repeat(2,minmax(0,1fr))")]);
        tablet["media"] = json!(["(min-width: 640px)"]);
        let mut desktop = rule("", "grid", &[("grid-template-columns", "repeat(4,minmax(0,1fr))")]);
        desktop["media"] = json!(["(min-width: 1024px)"]);
        let doc = draw(
            vec![
                rule(
                    "",
                    "grid",
                    &[
                        ("display", "grid"),
                        ("grid-template-columns", "1fr"),
                        ("gap", "12px"),
                        ("padding", "12px"),
                    ],
                ),
                tablet,
                desktop,
            ],
            json!([{"id":"grid","kind":"NView","props":{"className":"grid"},"children":(0..8).map(|i|json!({"id":format!("card{i}"),"kind":"NView","props":{"style":{"height":100}}})).collect::<Vec<_>>()}]),
            width,
        );
        let first = box_for(&doc, "card0").rect;
        let next = box_for(&doc, &format!("card{columns}")).rect;
        assert_eq!(next.top() - first.top(), 112., "width {width}");
        assert!((first.width() - (width - 24. - 12. * (columns - 1) as f32) / columns as f32).abs() <= 1.);
    }
}

#[test]
fn implicit_grid_tracks_fill_rows_and_columns_at_the_declared_size() {
    let doc = draw(
        vec![rule(
            "",
            "grid",
            &[
                ("display", "grid"),
                ("grid-auto-flow", "column"),
                ("grid-template-rows", "40px 40px"),
                ("grid-auto-columns", "100px 140px"),
                ("gap", "8px"),
            ],
        )],
        json!([{"id":"grid","kind":"NView","props":{"className":"grid"},"children":(0..4).map(|i|json!({"id":format!("cell{i}"),"kind":"NView"})).collect::<Vec<_>>()}]),
        390.,
    );
    let first = box_for(&doc, "cell0").rect;
    let second = box_for(&doc, "cell1").rect;
    let third = box_for(&doc, "cell2").rect;
    assert_eq!(first.size(), Vec2::new(100., 40.));
    assert_eq!(second.min - first.min, Vec2::new(0., 48.));
    assert_eq!(third.min - first.min, Vec2::new(108., 0.));
    assert_eq!(third.size(), Vec2::new(140., 40.));

    let doc = draw(
        vec![rule("", "grid", &[("display", "grid"), ("grid-auto-rows", "36px 64px")])],
        json!([{"id":"grid","kind":"NView","props":{"className":"grid"},"children":[
            {"id":"first","kind":"NView"}, {"id":"second","kind":"NView"}
        ]}]),
        390.,
    );
    assert_eq!(box_for(&doc, "first").rect.height(), 36.);
    assert_eq!(box_for(&doc, "second").rect.height(), 64.);
}

#[test]
fn dynamic_viewport_lengths_and_relative_typography_resolve_correctly() {
    assert!((number("100dvh", 390., Vec2::new(390., 844.), 16.).unwrap() - 844.).abs() < 0.001);
    assert_eq!(number("50svw", 390., Vec2::new(390., 844.), 16.), Some(195.));
    let doc = draw(
        vec![rule("", "large", &[("font-size", "24px")]), rule("", "small", &[("font-size", ".5em")])],
        json!([{"id":"parent","kind":"NView","props":{"className":"large"},"children":[{"id":"child","kind":"NText","props":{"className":"small","text":"Half size"}}]}]),
        390.,
    );
    assert_eq!(box_for(&doc, "child").paint.text_size, Some(12.));
}
#[test]
fn grid_cards_include_their_block_children_in_row_height() {
    let rules = vec![
        rule(
            "",
            "grid",
            &[("display", "grid"), ("grid-template-columns", "repeat(4,minmax(0,1fr))"), ("gap", "22px")],
        ),
        rule(
            "",
            "card",
            &[("display", "block"), ("overflow", "hidden"), ("border", "1px solid #ffffff")],
        ),
        rule(
            "",
            "cover",
            &[("display", "block"), ("width", "100%"), ("aspect-ratio", "1"), ("overflow", "hidden")],
        ),
    ];
    let cards = json!([{"id":"grid","kind":"NView","props":{"className":"grid","tag":"div"},"children":(0..8).map(|i|json!({"id":format!("card{i}"),"kind":"NView","props":{"className":"card"},"children":[{"id":format!("cover{i}"),"kind":"NLink","props":{"className":"cover"},"children":[{"id":format!("image{i}"),"kind":"NImage","props":{"style":{"width":"100%","height":"100%"}}}]},{"id":format!("content{i}"),"kind":"NView","children":[{"id":format!("title{i}"),"kind":"NText","props":{"tag":"h3","text":"A favourite game"}},{"id":format!("description{i}"),"kind":"NText","props":{"tag":"p","text":"A short description to explain this game."}}]}]})).collect::<Vec<_>>()}]);
    let doc = draw(
        rules,
        json!([{"id":"body","kind":"NTheme","children":[{"id":"block","kind":"NView","props":{"tag":"div"},"children":cards}]}]),
        1440.,
    );
    let card = box_for(&doc, "card0");
    let cover = box_for(&doc, "cover0");
    let content = box_for(&doc, "content0");
    assert!(
        card.rect.bottom() >= content.rect.bottom(),
        "card {:?}, cover {:?}, content {:?}",
        card.rect,
        cover.rect,
        content.rect
    );
    assert!(card.rect.height() > 350., "{:?}", card.rect);
}

#[test]
fn flex_directions_and_opacity_follow_the_cascade() {
    let doc = draw(
        vec![
            rule("", "row", &[("display", "flex"), ("align-items", "center"), ("gap", "12px")]),
            rule("", "hidden-paint", &[("opacity", "0")]),
        ],
        json!([{"id":"row","kind":"NView","props":{"className":"row"},"children":[{"id":"first","kind":"NView","props":{"style":{"width":40,"height":40}}},{"id":"second","kind":"NView","props":{"className":"hidden-paint","style":{"width":60,"height":40}},"children":[{"id":"icon","kind":"NIcon","props":{"paths":"M1 1L23 23","size":16}}]}]}]),
        390.,
    );
    assert_eq!(box_for(&doc, "second").rect.left() - box_for(&doc, "first").rect.left(), 52.);
    assert_eq!(box_for(&doc, "icon").paint.opacity, 0.);
}
#[test]
fn block_cards_do_not_flatten_headings_and_paragraphs_into_one_text_run() {
    let doc = draw(
        vec![rule("", "card", &[("padding", "20px"), ("display", "block")])],
        json!([{"id":"card","kind":"NLink","props":{"tag":"a","className":"card"},"children":[{"id":"heading","kind":"NText","props":{"tag":"h3","text":"A heading"}},{"id":"paragraph","kind":"NText","props":{"tag":"p","text":"A description on another line"}}]}]),
        390.,
    );
    assert!(!box_for(&doc, "heading").inline);
    assert!(box_for(&doc, "paragraph").rect.top() >= box_for(&doc, "heading").rect.bottom());
}
#[test]
fn logical_spacing_and_translucent_colors_keep_their_values() {
    let mut style = BTreeMap::new();
    values::declare(&mut style, "margin-block-end", "calc(16px * (1 - 0))");
    assert_eq!(number(&style["margin-bottom"], 390., Vec2::new(390., 844.), 16.), Some(16.));
    assert_eq!(
        number("calc(calc(.25rem * 4) * calc(1 - 0))", 390., Vec2::new(390., 844.), 16.),
        Some(16.)
    );
    let color = values::color("color-mix(in oklab, #9bd6b1 10%, transparent)")
        .unwrap()
        .to_srgba_unmultiplied();
    assert!(color[3] >= 25 && color[3] <= 26);
    assert!(color[0] > 145 && color[1] > 205);
}

#[test]
fn calculated_unitless_line_height_scales_with_the_font() {
    let doc = draw(
        vec![rule("", "small", &[("font-size", "14px"), ("line-height", "calc(1.25 / .875)")])],
        json!([{"id":"text","kind":"NText","props":{"className":"small","text":"A feature description"}}]),
        390.,
    );
    assert_eq!(box_for(&doc, "text").rect.height(), 20.);
}
#[test]
fn responsive_grid_spans_fill_the_row() {
    let doc = draw(
        vec![rule(
            "",
            "grid",
            &[("display", "grid"), ("grid-template-columns", "repeat(2,minmax(0,1fr))"), ("gap", "12px")],
        )],
        json!([{"id":"grid","kind":"NView","props":{"className":"grid"},"children":[{"id":"navigation","kind":"NView","props":{"style":{"gridColumn":"1 / -1","height":44}}},{"id":"left","kind":"NView","props":{"style":{"height":100}}},{"id":"right","kind":"NView","props":{"style":{"height":100}}}]}]),
        768.,
    );
    assert_eq!(box_for(&doc, "navigation").rect.width(), 768.);
    assert_eq!(box_for(&doc, "left").rect.top(), 56.);
    assert_eq!(box_for(&doc, "right").rect.top(), 56.);
}
#[test]
fn disclosure_expansion_and_anchor_scrolling_are_owned_by_rust() {
    let mut doc = draw(
        vec![],
        json!([{"id":"faq","kind":"NDisclosure","props":{"tag":"details"},"children":[{"id":"summary","kind":"NText","props":{"tag":"summary","text":"How does it work?"}},{"id":"answer","kind":"NText","props":{"tag":"p","text":"An answer that starts collapsed."}}]},{"id":"spacer","kind":"NView","props":{"style":{"height":1500}}},{"id":"target","kind":"NText","props":{"text":"The linked section"}}]),
        390.,
    );
    assert!(box_for(&doc, "answer").paint.hidden);
    doc.command(&json!({"action":"activate","id":"faq"})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert!(!box_for(&doc, "answer").paint.hidden);
    doc.command(&json!({"action":"scrollToId","id":"target"})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert!(doc.root_scroll > 400.);
}

#[test]
fn static_positions_ignore_old_sticky_offsets_and_flex_flow_resets_direction() {
    let doc = draw(
        vec![rule(
            "",
            "navigation",
            &[
                ("display", "flex"),
                ("flex-direction", "column"),
                ("flex-flow", "wrap"),
                ("position", "static"),
                ("top", "88px"),
                ("gap", "12px"),
            ],
        )],
        json!([{"id":"navigation","kind":"NView","props":{"className":"navigation"},"children":[{"id":"one","kind":"NText","props":{"text":"Account"}},{"id":"two","kind":"NText","props":{"text":"Games"}}]}]),
        390.,
    );
    assert_eq!(box_for(&doc, "navigation").rect.top(), 0.);
    assert_eq!(box_for(&doc, "one").rect.top(), box_for(&doc, "two").rect.top());
    assert!(box_for(&doc, "two").rect.left() > box_for(&doc, "one").rect.right());
}

#[test]
fn percentage_flex_basis_keeps_intrinsic_dialog_content_height() {
    let doc = draw(
        vec![
            rule("", "dialog", &[("display", "flex"), ("flex-direction", "column")]),
            rule("", "body", &[("flex", "1"), ("min-height", "0"), ("overflow-y", "auto")]),
        ],
        json!([{"id":"dialog","kind":"NView","props":{"className":"dialog"},"children":[{"id":"header","kind":"NView","props":{"style":{"height":44}}},{"id":"body","kind":"NView","props":{"className":"body"},"children":[{"id":"field","kind":"NView","props":{"style":{"height":120}}}]}]}]),
        390.,
    );
    assert!(box_for(&doc, "body").rect.height() >= 120., "{:?}", box_for(&doc, "body").rect);
}

#[test]
fn full_width_dialog_header_and_padding_resets_follow_the_containing_block() {
    let doc = draw(
        vec![
            rule(
                "",
                "dialog",
                &[
                    ("display", "flex"),
                    ("flex-direction", "column"),
                    ("padding-inline", "16px"),
                    ("padding", "0"),
                ],
            ),
            rule(
                "",
                "header",
                &[
                    ("display", "flex"),
                    ("position", "sticky"),
                    ("top", "0"),
                    ("padding", "20px 24px"),
                    ("width", "100%"),
                ],
            ),
        ],
        json!([{"id":"root","kind":"NTheme","children":[{"id":"dialog","kind":"NView","props":{"className":"dialog"},"children":[{"id":"header","kind":"NView","props":{"className":"header"},"children":[{"id":"caption","kind":"NView","props":{"style":{"flex":1}},"children":[{"id":"title","kind":"NText","props":{"text":"Edit profile"}}]},{"id":"close","kind":"NPress","props":{"style":{"width":36,"height":36}},"children":[{"id":"x","kind":"NText","props":{"text":"×"}}]}]},{"id":"body","kind":"NView","props":{"style":{"height":400}}}]}]}]),
        390.,
    );
    assert_eq!(box_for(&doc, "dialog").content.left(), 0.);
    assert_eq!(box_for(&doc, "header").rect.width(), 390.);
}

#[test]
fn max_width_paragraphs_reserve_all_wrapped_lines() {
    let doc = draw(
        vec![rule(
            "",
            "paragraph",
            &[("font-size", "16px"), ("line-height", "1.5"), ("max-width", "20ch")],
        )],
        json!([{"id":"text","kind":"NText","props":{"className":"paragraph","text":"Find your next game. Share your best moments. Meet your next friendly rival. Your games and your community, together."}}]),
        768.,
    );
    let item = box_for(&doc, "text");
    let sheet = doc.css.as_ref().unwrap();
    let i = sheet.boxes.iter().position(|b| b.node.id == "text").unwrap();
    let size = doc
        .context
        .fonts_mut(|fonts| fonts.layout_job(sheet.text_job(i, item.content.width(), 1.)).size());
    assert!(item.rect.height() >= size.y, "layout {:?}, shaped {:?}", item.rect, size);
    assert!(item.rect.height() > 48.);
}
#[test]
fn emergency_word_wrapping_prefers_word_boundaries() {
    let doc = draw(
        vec![rule(
            "",
            "title",
            &[("font-size", "32px"), ("overflow-wrap", "anywhere"), ("width", "200px")],
        )],
        json!([{"id":"title","kind":"NText","props":{"className":"title","text":"Powerful Features"}}]),
        390.,
    );
    let sheet = doc.css.as_ref().unwrap();
    let i = sheet.boxes.iter().position(|b| b.node.id == "title").unwrap();
    let galley = doc.context.fonts_mut(|fonts| fonts.layout_job(sheet.text_job(i, 200., 1.)));
    let first: String = galley.rows[0].glyphs.iter().map(|g| g.chr).collect();
    assert_eq!(first.trim(), "Powerful");
}

#[test]
fn linkified_paragraphs_and_select_labels_do_not_overlap_and_field_padding_opens_the_menu() {
    let mut doc = draw(
        vec![],
        json!([{"id":"fields","kind":"NView","props":{"style":{"display":"flex","flexDirection":"column","gap":16,"padding":20,"maxWidth":520}},"children":[
            {"id":"paragraph","kind":"NText","props":{"tag":"p"},"children":[{"id":"about","kind":"NText","props":{"linkify":true,"text":"Visit www.example.org, email hi@example.org, or https://example.org/help."}}]},
            {"id":"select","kind":"NSelect","props":{"label":"Choose fruit","style":{"width":"100%","padding":"10px 12px","borderWidth":1},"options":[{"label":"Apple","value":"a"}]}}
        ]}]),
        390.,
    );
    let label_y = box_for(&doc, "__engine:select:select:label").rect.top();
    for link in doc.semantics.iter().filter(|node| node.kind == "NLink") {
        assert!(
            link.rect[1] + link.rect[3] <= label_y,
            "wrapped text must finish before the next field label"
        );
    }
    let field = box_for(&doc, "select").rect;
    let semantic = doc.semantics.iter().find(|node| node.id == "select").unwrap();
    assert_eq!(semantic.rect[2], field.width(), "the entire field is accessible and clickable");
    doc.touch(0, field.left() + 2., field.center().y);
    doc.touch(2, field.left() + 2., field.center().y);
    for _ in 0..3 {
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    assert!(doc.semantics.iter().any(|node| node.id == "select:option:0"));
}

#[test]
fn linkify_classes_style_only_detected_links_and_plain_text_keeps_parent_typography() {
    let doc = draw(
        vec![
            rule("p", "", &[("color", "#123456")]),
            rule("", "custom-link", &[("color", "#ff0000"), ("font-weight", "700")]),
        ],
        json!([{"id":"paragraph","kind":"NText","props":{"tag":"p"},"children":[{"id":"about","kind":"NText","props":{"linkify":true,"linkClassName":"custom-link"},"children":[{"id":"text","kind":"NText","props":{"text":"Visit www.example.org, then email hi@example.org."}}]}]}]),
        390.,
    );
    let sheet = doc.css.as_ref().unwrap();
    let index = sheet.boxes.iter().position(|node| node.node.id == "paragraph").unwrap();
    let job = sheet.text_job(index, 390., 1.);
    assert_eq!(job.text, "Visit www.example.org, then email hi@example.org.");
    for section in &job.sections {
        let text = &job.text[section.byte_range.start.0..section.byte_range.end.0];
        assert_eq!(
            section.format.color,
            if text.contains("www.") || text.contains("@") {
                Color32::RED
            } else {
                Color32::from_rgb(0x12, 0x34, 0x56)
            },
            "{text}"
        );
    }
}

#[test]
fn default_linkify_styles_survive_css_resets_without_requiring_tailwind_utilities() {
    let mut reset = rule("a", "", &[("color", "inherit"), ("text-decoration", "inherit")]);
    reset["layer"] = json!(1);
    let doc = draw(
        vec![reset],
        json!([{"id":"about","kind":"NText","props":{"linkify":true,"text":"Visit www.example.org."}}]),
        390.,
    );
    let sheet = doc.css.as_ref().unwrap();
    let job = sheet.text_job(0, 390., 1.);
    let link = job
        .sections
        .iter()
        .find(|section| job.text[section.byte_range.start.0..section.byte_range.end.0].contains("www."))
        .unwrap();
    assert_eq!(link.format.color, doc.palette.get("accent"));
    assert_eq!(link.format.underline, egui::Stroke::NONE);
}

#[test]
fn select_popup_inherits_stylesheet_theme_colors_and_preserves_explicit_theme_overrides() {
    for explicit in [false, true] {
        let mut doc = draw(
            vec![rule(
                "body",
                "",
                &[
                    ("--accent", "#b99bff"),
                    ("--surface", "rgba(81,70,99,0.42)"),
                    ("--field-background", "var(--surface)"),
                ],
            )],
            json!([{"id":"theme","kind":"NTheme","props":if explicit {json!({"colors":{"accent":"#abcdef"}})} else {json!({})},"children":[{"id":"select","kind":"NSelect","props":{"options":[{"label":"Apple","value":"a"}],"defaultValue":"a"}}]}]),
            390.,
        );
        doc.command(&json!({"action":"activate","id":"select"})).unwrap();
        let expected = if explicit {
            Color32::from_rgb(0xab, 0xcd, 0xef)
        } else {
            Color32::from_rgb(0xb9, 0x9b, 0xff)
        };
        fn contains(shape: &egui::Shape, color: Color32) -> bool {
            match shape {
                egui::Shape::Rect(rect) => rect.fill == color,
                egui::Shape::Vec(shapes) => shapes.iter().any(|shape| contains(shape, color)),
                _ => false,
            }
        }
        let mut seen = false;
        let mut solid_surface = false;
        for _ in 0..20 {
            let output = doc.frame(390., 1000., 1.);
            seen |= output.shapes.iter().any(|shape| contains(&shape.shape, expected));
            solid_surface |= output
                .shapes
                .iter()
                .any(|shape| contains(&shape.shape, values::color("rgba(81,70,99,0.42)").unwrap().to_opaque()));
            output.drop_without_applying_deltas();
        }
        assert!(seen, "the selected option must use the stylesheet accent unless NTheme overrides it");
        assert!(solid_surface, "translucent page surfaces must not let text bleed through the dropdown");
    }
}

#[test]
fn translucent_rounded_borders_have_one_continuous_stroke_instead_of_darker_straight_edges() {
    for color in ["rgba(99,82,132,0.12)", "rgba(205,190,231,0.12)"] {
        for scale in [1., 2., 3.] {
            let mut doc = draw(
                vec![rule(
                    "",
                    "card",
                    &[
                        ("width", "180px"),
                        ("height", "100px"),
                        ("border-radius", "18px"),
                        ("background-color", "rgba(255,255,255,0.35)"),
                        ("border", &format!("1px solid {color}")),
                        ("border-top-color", color),
                    ],
                )],
                json!([{"id":"card","kind":"NCard","props":{"className":"card"}}]),
                390.,
            );
            let rect = box_for(&doc, "card").rect;
            let output = doc.frame(390., 1000., scale);
            let strokes = output
                .shapes
                .iter()
                .filter(|shape| match &shape.shape {
                    egui::Shape::Rect(shape) => shape.rect == rect && shape.stroke.width > 0. && shape.stroke.color.a() > 0,
                    _ => false,
                })
                .count();
            assert_eq!(
                strokes, 1,
                "each part of the rounded border must blend once, color={color}, scale={scale}"
            );
            output.drop_without_applying_deltas();
        }
    }
}

#[test]
fn rounded_control_borders_use_the_latest_cascaded_color_in_one_stroke() {
    for kind in ["NButton", "NLink"] {
        for radius in ["14px", "50%"] {
            for scale in [1., 2., 3.] {
                for shorthand_last in [false, true] {
                    let base = "rgba(99,82,132,0.12)";
                    let control = "rgba(15,23,41,0.18)";
                    let declarations = if shorthand_last {
                        vec![
                            ("border-color", control),
                            ("border-width", "4px"),
                            ("border-top-color", "#ef4444"),
                            ("border", "1px solid rgba(99,82,132,0.12)"),
                        ]
                    } else {
                        vec![
                            ("border", "1px solid rgba(99,82,132,0.12)"),
                            ("border-color", control),
                            ("border-width", "2px"),
                        ]
                    };
                    let mut doc = draw(
                        vec![
                            rule(
                                "",
                                "control",
                                &[
                                    ("width", "180px"),
                                    ("height", "48px"),
                                    ("border-radius", radius),
                                    ("background-color", "rgba(255,255,255,0.35)"),
                                ],
                            ),
                            rule("", "control", &declarations),
                        ],
                        json!([{"id":"button","kind":kind,"props":{"className":"control","text":"Continue","href":"/account"}}]),
                        390.,
                    );
                    let bounds = box_for(&doc, "button").rect;
                    let output = doc.frame(390., 1000., scale);
                    let strokes: Vec<_> = output
                        .shapes
                        .iter()
                        .filter_map(|shape| match &shape.shape {
                            egui::Shape::Rect(rect) if rect.rect == bounds && rect.stroke.width > 0. && rect.stroke.color.a() > 0 => Some(rect),
                            _ => None,
                        })
                        .collect();
                    assert_eq!(
                        strokes.len(),
                        1,
                        "one uniform border: kind={kind}, radius={radius}, scale={scale}, shorthand_last={shorthand_last}"
                    );
                    assert_eq!(
                        strokes[0].stroke.color,
                        values::color(if shorthand_last { base } else { control }).unwrap()
                    );
                    assert_eq!(strokes[0].stroke.width, if shorthand_last { 1. } else { 2. });
                    output.drop_without_applying_deltas();
                }
            }
        }
    }
}

#[test]
fn background_shorthands_replace_earlier_utility_colors_and_later_longhands_still_win() {
    for (background, expected) in [
        ("transparent", Color32::TRANSPARENT),
        ("none", Color32::TRANSPARENT),
        ("#635284", Color32::from_rgb(99, 82, 132)),
    ] {
        let doc = draw(
            vec![
                rule(
                    "",
                    "bg-background",
                    &[("background-color", "#e1ddea"), ("background-image", "url(old.png)")],
                ),
                rule("", "download-section", &[("background", background)]),
                rule("", "override", &[("background-color", "#123456")]),
            ],
            json!([
                {"id":"section","kind":"NView","props":{"tag":"section","className":"bg-background download-section","style":{"height":100}}},
                {"id":"override","kind":"NView","props":{"className":"bg-background download-section override","style":{"height":100}}}
            ]),
            390.,
        );
        assert_eq!(box_for(&doc, "section").paint.background, Some(expected));
        assert_eq!(box_for(&doc, "section").css.get("background-image").map(String::as_str), Some("none"));
        assert_eq!(box_for(&doc, "override").paint.background, Some(Color32::from_rgb(0x12, 0x34, 0x56)));
    }
}

#[test]
fn safe_area_uses_shared_rust_edge_policy_in_css_layout() {
    let doc = draw(
        vec![rule("", "safe", &[("padding", "12px")])],
        json!([
            {"id":"safe","kind":"NView","props":{"className":"safe","safeArea":{"insets":{"top":62,"bottom":34},"edges":{"top":"additive","bottom":"maximum"}}},"children":[{"id":"text","kind":"NText","props":{"text":"Safe content"}}]}
        ]),
        400.,
    );
    assert!((box_for(&doc, "text").rect.min.y - 74.).abs() < 0.1);
    assert!((box_for(&doc, "text").rect.min.x - 12.).abs() < 0.1);
}

#[test]
fn entrances_are_viewport_triggered_and_keep_cached_layout() {
    let mut doc = draw(
        vec![],
        json!([{"id":"root","kind":"NView","children":[
            {"id":"top","kind":"NView","props":{"style":{"height":80,"backgroundColor":"#ffffff"},"entrance":{"duration":240,"translateY":14}}},
            {"id":"later","kind":"NView","props":{"style":{"height":80,"marginTop":1400,"backgroundColor":"#ffffff"},"entrance":{"duration":240}}}
        ]}]),
        390.,
    );
    let passes = doc.css.as_ref().unwrap().layout_passes;
    let top = box_for(&doc, "top").rect.top();
    assert!((doc.layout_rects["top"].top() - top - 14.).abs() < 0.01);
    let visible = doc.frame(390., 1000., 1.);
    assert!(visible.shapes.iter().any(|entry| match &entry.shape {
        egui::Shape::Rect(shape) => shape.fill.r() > 0 && shape.fill.a() < 255,
        _ => false,
    }));
    visible.drop_without_applying_deltas();
    for _ in 0..20 {
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    assert!((doc.layout_rects["top"].top() - top).abs() < 0.01);
    assert!(!doc.entrance_started.contains_key("later"));
    assert_eq!(doc.css.as_ref().unwrap().layout_passes, passes);

    let later = box_for(&doc, "later").rect.top();
    doc.command(&json!({"action":"pageScroll","offset":later - 990.})).unwrap();
    for _ in 0..20 {
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    assert!(
        !doc.entrance_started.contains_key("later"),
        "a thin visible edge must not spend the entrance"
    );

    doc.command(&json!({"action":"environment","entrancesReady":false})).unwrap();
    doc.command(&json!({"action":"pageScroll","offset":900})).unwrap();
    for _ in 0..20 {
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    assert!(!doc.entrance_started.contains_key("later"), "hidden surface must keep the entrance ready");
    doc.command(&json!({"action":"environment","entrancesReady":true})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.entrance_started["later"].started, doc.elapsed);

    doc.command(&json!({"action":"environment","reducedMotion":true})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.entrance_started["later"].started, f64::NEG_INFINITY);
    doc.command(&json!({"action":"environment","reducedMotion":false})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.entrance_started["later"].started, f64::NEG_INFINITY);
    doc.command(&json!({"action":"tree","nodes":[]})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert!(doc.entrance_started.is_empty());
}

#[test]
fn settled_initial_viewport_preserves_later_entrances_and_replay() {
    let mut doc = ComponentDocument::default();
    doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
    doc.command(&json!({"action":"environment","settleVisibleEntrances":true})).unwrap();
    doc.command(&json!({"action":"tree","nodes":[{"id":"root","kind":"NView","children":[
        {"id":"initial","kind":"NView","props":{"style":{"height":80},"entrance":{"duration":350,"translateY":18,"replay":true}}},
        {"id":"later","kind":"NView","props":{"style":{"height":80,"marginTop":1350},"entrance":{"duration":350}}},
        {"id":"bottom","kind":"NView","props":{"style":{"height":1000}}}
    ]}]}))
    .unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.entrance_started["initial"].started, f64::NEG_INFINITY);
    assert_eq!(doc.layout_rects["initial"].top(), box_for(&doc, "initial").rect.top());
    assert!(!doc.entrance_started.contains_key("later"));

    doc.command(&json!({"action":"environment","settleVisibleEntrances":false})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.entrance_started["initial"].started, f64::NEG_INFINITY);
    doc.command(&json!({"action":"pageScroll","offset":1200})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.entrance_started["later"].started, doc.elapsed);
    assert!(!doc.entrance_started.contains_key("initial"));

    doc.command(&json!({"action":"pageScroll","offset":0})).unwrap();
    doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    assert_eq!(doc.entrance_started["initial"].started, doc.elapsed);
    assert!((doc.layout_rects["initial"].top() - box_for(&doc, "initial").rect.top() - 18.).abs() < 0.01);
}

#[test]
fn opted_in_entrances_replay_after_scrolling_out_and_back() {
    let mut doc = draw(
        vec![],
        json!([{"id":"root","kind":"NView","children":[
            {"id":"group","kind":"NView","props":{"style":{"marginTop":1350}},"children":[
                {"id":"repeated","kind":"NView","props":{"style":{"height":80},"entrance":{"duration":350,"translateY":18,"replay":true}}},
                {"id":"once","kind":"NView","props":{"style":{"height":80},"entrance":{"duration":350,"translateY":18}}}
            ]},
            {"id":"bottom","kind":"NView","props":{"style":{"height":1000}}}
        ]}]),
        390.,
    );
    assert!(doc.entrance_started.is_empty());
    let jump = |doc: &mut ComponentDocument, offset: f64| {
        doc.command(&json!({"action":"pageScroll","offset":offset})).unwrap();
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    };
    jump(&mut doc, 1200.);
    let played = doc.elapsed;
    assert_eq!(doc.entrance_started["repeated"].started, played);
    assert_eq!(doc.entrance_started["once"].started, played);
    for _ in 0..24 {
        doc.frame(390., 1000., 1.).drop_without_applying_deltas();
    }
    let settled = doc.layout_rects["repeated"].top();

    // A small visible part does not make the settled section start over.
    jump(&mut doc, 380.);
    assert_eq!(doc.entrance_started["repeated"].started, played);
    jump(&mut doc, 0.);
    assert!(!doc.entrance_started.contains_key("repeated"));
    assert_eq!(doc.entrance_started["once"].started, played);

    jump(&mut doc, 1200.);
    assert_eq!(doc.entrance_started["repeated"].started, doc.elapsed);
    assert_eq!(doc.entrance_started["once"].started, played);
    assert!((doc.layout_rects["repeated"].top() - settled - 18.).abs() < 0.01);
}
