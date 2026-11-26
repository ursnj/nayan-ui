use super::*;

#[derive(Default)]
pub(super) struct ListState {
    range: Option<Value>,
    command: Option<u64>,
    pub(super) requested_offset: Option<f32>,
    offset: f32,
    viewport: Option<f32>,
    reached_count: Option<usize>,
    visible: Option<(i64, i64)>,
    pinned: Option<bool>,
    window_checked_at: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frame(doc: &mut ComponentDocument) {
        for _ in 0..3 {
            doc.frame(400., 600., 1.).drop_without_applying_deltas();
        }
    }

    fn set(doc: &mut ComponentDocument, count: usize, rows: std::ops::Range<usize>, offset: f32, sequence: u64) {
        let children: Vec<_> = rows
            .map(|index| {
                json!({
                    "id": format!("row-{index}"), "kind": "NListItem", "props": {"index": index},
                    "children": [{"id":format!("button-{index}"), "kind":"NButton", "props":{"label":format!("Row {index}")}}]
                })
            })
            .collect();
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":{
            "itemCount":count, "itemSize":40, "overscan":3, "height":320,
            "scrollOffset":offset,"scrollSequence":sequence,"accessibilityLabel":"Players"
        },"children":children}]))
            .unwrap();
        frame(doc);
    }

    fn range(doc: &ComponentDocument) -> Value {
        doc.semantics.iter().find(|node| node.id == "list").unwrap().value.clone()
    }

    #[test]
    fn lists_request_missing_visible_rows_again_without_another_touch() {
        for variable in [false, true] {
            let mut doc = ComponentDocument::default();
            let props = json!({"itemCount":100,"itemSize":40,"height":200,"overscan":3,"variableSize":variable});
            let mount = |doc: &mut ComponentDocument, start: u64, end: u64| {
                let children: Vec<_> = (start..end)
                    .map(|index| json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index,"height":40}}))
                    .collect();
                doc.set_tree(&json!([{"id":"list","kind":"NList","props":props,"children":children}]))
                    .unwrap();
            };
            mount(&mut doc, 0, 12);
            frame(&mut doc);
            doc.take_snapshot();

            doc.command(&json!({"action":"listScroll","id":"list","offset":2000})).unwrap();
            frame(&mut doc);
            assert_eq!(range(&doc)["first"], 50);
            assert!(doc.layout_bounds("row-50").is_none());
            // Drop the scroll update before React can mount any of the new rows.
            let dropped = doc.take_snapshot();
            assert!(dropped["events"].as_array().unwrap().iter().any(|e| e["id"] == "list"));

            for _ in 0..12 {
                doc.frame(400., 600., 1.).drop_without_applying_deltas();
            }
            let update = doc.take_snapshot();
            let events = update["events"].as_array().unwrap();
            let retry = events
                .iter()
                .find(|event| event["id"] == "list")
                .expect("the missing visible rows must be requested again");
            assert_eq!(retry["value"]["first"], 50);
            assert_ne!(retry["value"]["visibleChanged"], true);
            assert_ne!(retry["value"]["endReached"], true);
            assert_ne!(retry["value"]["headerPinnedChanged"], true);
            assert!(events.len() <= 2, "retries must be throttled");

            let retry = &retry["value"];
            mount(&mut doc, retry["start"].as_u64().unwrap(), retry["end"].as_u64().unwrap());
            frame(&mut doc);
            doc.take_snapshot();
            for _ in 0..12 {
                doc.frame(400., 600., 1.).drop_without_applying_deltas();
            }
            assert!(doc.layout_bounds("row-50").is_some());
            assert!(doc.take_snapshot()["events"].as_array().unwrap().is_empty());
        }
    }

    #[test]
    fn native_lists_keep_their_rows_at_the_scroll_edges() {
        for variable in [false, true] {
            let mut doc = ComponentDocument::default();
            doc.command(&json!({"action":"environment","native":true})).unwrap();
            let children: Vec<_> = (0..8)
                .map(|index| json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index,"height":40}}))
                .collect();
            doc.set_tree(&json!([{"id":"list","kind":"NList","props":{
                "itemCount":8,"itemSize":40,"height":240,"variableSize":variable,"canRefresh":true
            },"children":children}])).unwrap();
            frame(&mut doc);
            let scroll_id = doc.scroll_targets[0].scroll_id;
            for (start, delta) in [(50., 45.), (190., -45.)] {
                doc.touch(0, 200., start);
                frame(&mut doc);
                for step in 1..=3 {
                    doc.touch(1, 200., start + delta * step as f32);
                    frame(&mut doc);
                    let state = egui::scroll_area::State::load(&doc.context, scroll_id).unwrap();
                    assert_eq!(state.overscroll().y, 0., "scrolling pushed the mounted rows away; variable={variable}");
                }
                doc.touch(2, 200., start + delta * 3.);
                for _ in 0..10 {
                    frame(&mut doc);
                    let state = egui::scroll_area::State::load(&doc.context, scroll_id).unwrap();
                    assert_eq!(state.overscroll().y, 0., "coasting pushed the mounted rows away; variable={variable}");
                }
            }
            if variable {
                assert!(doc.events.iter().any(|event| event["value"]["refreshRequested"] == true));
            }
        }
    }

    #[test]
    fn native_lists_draw_committed_rows_until_a_distant_window_arrives() {
        for variable in [false, true] {
            let mut doc = ComponentDocument::default();
            doc.command(&json!({"action":"environment","native":true})).unwrap();
            let mount = |doc: &mut ComponentDocument, start: usize| {
                let children: Vec<_> = (start..start + 12).map(|index| {
                    json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index},"children":[
                        {"id":format!("cell-{index}"),"kind":"NButton","props":{"label":format!("Cell {index}"),"height":80,"width":300}}
                    ]})
                }).collect();
                doc.set_tree(&json!([{"id":"list","kind":"NList","props":{
                    "itemCount":600,"itemSize":80,"height":240,"variableSize":variable
                },"children":children}])).unwrap();
            };
            mount(&mut doc, 0);
            frame(&mut doc);
            doc.command(&json!({"action":"listScroll","id":"list","offset":6000})).unwrap();
            for _ in 0..10 {
                frame(&mut doc);
                assert_eq!(range(&doc)["first"], 75);
                assert!(doc.semantics.iter().filter(|node| node.kind == "NButton").count() >= 3);
            }
            mount(&mut doc, 72);
            frame(&mut doc);
            assert!(doc.semantics.iter().any(|node| node.id == "cell-75"));
        }
    }

    #[test]
    fn rendered_ranges_match_planning_and_materialize_every_home_row_through_the_end() {
        for padding in ["", "p-3"] {
            let mut doc = ComponentDocument::default();
            let props = json!({"itemCount":27,"itemSize":341,"height":640,"overscan":4,"initialNumToRender":4,
                "headerSize":254,"stickyHeaderSize":60,"contentContainerClassName":padding});
            let plan = doc.plan_list(&json!({"id":"list","props":props})).unwrap();
            let configuration = plan["configuration"].clone();
            let materialize = |doc: &mut ComponentDocument, range: &Value| {
                let children: Vec<_> = (range["start"].as_u64().unwrap()..range["end"].as_u64().unwrap())
                    .map(|index| {
                        json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index},"children":[
                            {"id":format!("game-{index}"),"kind":"NPress","props":{"height":329,"className":"p-0"}}
                        ]})
                    })
                    .collect();
                doc.set_tree(&json!([{"id":"list","kind":"NList","props":props,"children":children}]))
                    .unwrap();
            };
            materialize(&mut doc, &plan);
            frame(&mut doc);
            for offset in [0., 1000., 3000., 6000., 10000.] {
                doc.events.clear();
                doc.scroll_list(&json!({"id":"list","offset":offset})).unwrap();
                frame(&mut doc);
                let range = range(&doc);
                assert_eq!(
                    range["configuration"], configuration,
                    "frame ranges must pass React's configuration guard, padding={padding}"
                );
                let event = doc.events.iter().rev().find(|e| e["id"] == "list" && e["type"] == "change");
                if let Some(event) = event {
                    assert_eq!(event["value"]["configuration"], configuration);
                }
                materialize(&mut doc, &range);
                frame(&mut doc);
                let first = range["first"].as_i64().unwrap();
                let last = range["last"].as_i64().unwrap();
                for index in first..=last {
                    if index >= 0 {
                        assert!(
                            doc.layout_bounds(&format!("game-{index}")).is_some(),
                            "missing visible row {index} at {offset}, padding={padding}"
                        );
                    }
                }
            }
            assert!(doc.layout_bounds("game-26").is_some(), "final game row must render");
        }
    }

    #[test]
    fn million_row_layout_paints_only_visible_rows_and_clips_accessibility() {
        let mut doc = ComponentDocument::default();
        set(&mut doc, 1_000_000, 0..20, 0., 0);
        let state = range(&doc);
        assert_eq!(state["first"], 0);
        assert_eq!(state["last"], 7);
        assert_eq!(state["end"], 11);
        assert_eq!(state["viewportHeight"], 320.);
        assert!(doc.semantics.len() <= 9);
        assert!(doc.layout_bounds("button-12").is_none());
        let list = doc.semantics.iter().find(|node| node.id == "list").unwrap();
        for node in doc.semantics.iter().filter(|node| node.kind == "NButton") {
            assert!(node.rect[1] >= list.rect[1]);
            assert!(node.rect[1] + node.rect[3] <= list.rect[1] + list.rect[3] + 0.1);
        }
    }

    #[test]
    fn jumps_request_new_rows_without_painting_old_items_at_new_positions() {
        let mut doc = ComponentDocument::default();
        set(&mut doc, 100_000, 0..20, 0., 0);
        doc.command(&json!({"action":"listScroll","id":"list","offset":20000})).unwrap();
        frame(&mut doc);
        assert_eq!(range(&doc)["first"], 500);
        assert!(doc.semantics.iter().all(|node| node.kind != "NButton"));
        assert!(doc.layout_bounds("button-0").is_none());
        set(&mut doc, 100_000, 497..511, 20000., 1);
        assert!(doc.semantics.iter().any(|node| node.id == "button-500"));
        doc.command(&json!({"action":"activate","id":"button-500"})).unwrap();
        frame(&mut doc);
        assert!(doc.events.iter().any(|event| event["id"] == "button-500" && event["type"] == "press"));
        assert!(doc.command(&json!({"action":"activate","id":"button-0"})).is_err());
    }

    #[test]
    fn pixel_scrolling_does_not_request_react_updates_until_row_boundaries() {
        let mut doc = ComponentDocument::default();
        set(&mut doc, 1000, 0..20, 1., 0);
        doc.take_snapshot();
        doc.command(&json!({"action":"listScroll","id":"list","offset":2})).unwrap();
        frame(&mut doc);
        assert!(doc.take_snapshot()["events"].as_array().unwrap().is_empty());
        doc.command(&json!({"action":"listScroll","id":"list","offset":45})).unwrap();
        frame(&mut doc);
        assert!(
            doc.take_snapshot()["events"]
                .as_array()
                .unwrap()
                .iter()
                .any(|event| event["id"] == "list")
        );
    }

    #[test]
    fn empty_lists_shrinking_data_and_end_clamping_have_valid_ranges() {
        let mut doc = ComponentDocument::default();
        set(&mut doc, 1000, 990..1000, 1_000_000., 0);
        assert_eq!(range(&doc)["last"], 999);
        assert_eq!(range(&doc)["atEnd"], true);
        set(&mut doc, 3, 0..3, 0., 1);
        assert_eq!(range(&doc)["first"], 0);
        assert_eq!(range(&doc)["end"], 3);
        set(&mut doc, 0, 0..0, 0., 2);
        assert_eq!(range(&doc)["first"], -1);
        assert_eq!(range(&doc)["last"], -1);
        assert_eq!(range(&doc)["end"], 0);
        assert!(doc.set_tree(&json!([])).is_ok());
        assert!(doc.lists.is_empty());
    }

    #[test]
    fn rust_plans_initial_windows_and_validates_imperative_scroll_targets() {
        let mut doc = ComponentDocument::default();
        let props = json!({"itemCount":100000,"itemSize":40,"overscan":2,"height":200,"initialNumToRender":10,"initialScrollIndex":500});
        let plan = doc.command(&json!({"action":"listPlan","id":"list","props":props})).unwrap();
        assert_eq!(plan["start"], 498);
        assert_eq!(plan["end"], 512);
        assert_eq!(plan["offset"], 20000.);
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":props}])).unwrap();
        doc.command(&json!({"action":"listScroll","id":"list","kind":"index","index":500,"viewPosition":0.5}))
            .unwrap();
        let jumped = doc.command(&json!({"action":"listPlan","id":"list","props":props})).unwrap();
        assert_eq!(jumped["offset"], 19920.);
        assert!(jumped["start"].as_u64().unwrap() <= 500 && jumped["end"].as_u64().unwrap() > 500);
        doc.command(&json!({"action":"listScroll","id":"list","kind":"end"})).unwrap();
        assert_eq!(
            doc.command(&json!({"action":"listPlan","id":"list","props":props})).unwrap()["offset"],
            3999800.
        );
        for command in [
            json!({"kind":"index","index":-1}),
            json!({"kind":"index","index":1,"viewPosition":2}),
            json!({"kind":"offset","offset":null}),
        ] {
            let mut command = command;
            command["action"] = json!("listScroll");
            command["id"] = json!("list");
            assert!(doc.command(&command).is_err());
        }
    }
    #[test]
    fn rust_deduplicates_end_and_visibility_callbacks_and_rearms_after_leaving() {
        let props = json!({"itemCount":100,"itemSize":40.1,"overscan":2,"onEndReachedThreshold":0.5});
        let mut state = ListState::default();
        let end = range_at(&props, 4010., 200., false);
        let event = state.notification(&end).unwrap();
        assert_eq!(event["endReached"], true);
        assert_eq!(event["visibleChanged"], true);
        assert!(state.notification(&end).is_none());
        state.notification(&range_at(&props, 0., 200., false));
        assert_eq!(state.notification(&end).unwrap()["endReached"], true);
        let mut appended = props.clone();
        appended["itemCount"] = json!(101);
        assert_eq!(state.notification(&range_at(&appended, 4050.1, 200., false)).unwrap()["endReached"], true);
        let exact = json!({"itemCount":100000,"itemSize":40.1,"overscan":2,"onEndReachedThreshold":0});
        assert_eq!(range_at(&exact, 4010000., 200., false)["nearEnd"], true);
    }
    #[test]
    fn end_threshold_crossing_within_a_row_emits_only_the_new_end_notification() {
        let props = json!({"itemCount":100,"itemSize":40,"overscan":2,"onEndReachedThreshold":0.5});
        let mut state = ListState::default();
        state.notification(&range_at(&props, 3699., 200., false));
        let event = state.notification(&range_at(&props, 3701., 200., false)).unwrap();
        assert_eq!(event["visibleChanged"], false);
        assert_eq!(event["endReached"], true);
        assert!(state.notification(&range_at(&props, 3702., 200., false)).is_none());
    }

    #[test]
    fn mounted_window_batches_scroll_updates_without_delaying_visibility_or_jumps() {
        let props = json!({"itemCount":100,"itemSize":40,"overscan":4,"height":200});
        let mut state = ListState::default();
        let first = range_at(&props, 400., 200., false);
        state.notification(&first).unwrap();
        for offset in [440., 480.] {
            let mut range = range_at(&props, offset, 200., false);
            state.prepare_window(&mut range, 4, 1, 0.);
            let update = state.notification(&range).unwrap();
            assert_eq!(update["start"], first["start"]);
            assert_eq!(update["end"], first["end"]);
            assert_eq!(update["first"], json!((offset / 40.) as usize));
            assert_eq!(update["visibleChanged"], true);
        }
        for offset in [520., 2400., 0.] {
            let expected = range_at(&props, offset, 200., false);
            let mut range = expected.clone();
            state.prepare_window(&mut range, 4, 1, 0.);
            assert_eq!(range, expected);
            state.notification(&range).unwrap();
        }
    }

    #[test]
    fn a_fast_fling_buffers_rows_in_its_direction_without_changing_visibility() {
        let props = json!({"itemCount":100,"itemSize":40,"overscan":4,"height":200});
        let base = range_at(&props, 400., 200., false);
        let mut state = ListState::default();
        state.notification(&base).unwrap();
        let mut forward = base.clone();
        state.prepare_window(&mut forward, 4, 1, 6000.);
        assert_eq!(forward["start"], base["start"]);
        assert_eq!(forward["end"], base["end"].as_u64().unwrap() + 4);
        assert_eq!(forward["last"], base["last"]);
        state.notification(&forward).unwrap();
        let mut reverse = base.clone();
        state.prepare_window(&mut reverse, 4, 1, -6000.);
        assert_eq!(reverse["start"], base["start"].as_u64().unwrap() - 4);
        assert_eq!(reverse["end"], base["end"]);
        assert_eq!(reverse["first"], base["first"]);
        state.notification(&reverse).unwrap();
        let mut stopped = base.clone();
        state.prepare_window(&mut stopped, 4, 1, 0.);
        assert_eq!(stopped, base);
    }

    #[test]
    fn native_list_flings_travel_farther_without_accelerating_the_drag() {
        let fling = |native| {
            let mut doc = ComponentDocument::default();
            doc.command(&json!({"action":"environment","native":native})).unwrap();
            set(&mut doc, 1000, 0..20, 0., 0);
            doc.touch(0, 200., 300.);
            doc.frame(400., 600., 1.).drop_without_applying_deltas();
            for step in 1..=10 {
                doc.touch(1, 200., 300. - step as f32 * 24.);
                doc.frame(400., 600., 1.).drop_without_applying_deltas();
            }
            let dragged = range(&doc)["offset"].as_f64().unwrap();
            doc.touch(2, 200., 60.);
            for _ in 0..240 {
                doc.frame(400., 600., 1.).drop_without_applying_deltas();
            }
            (dragged, range(&doc)["offset"].as_f64().unwrap() - dragged)
        };
        let (baseline_drag, baseline_coast) = fling(false);
        let (native_drag, native_coast) = fling(true);
        assert_eq!(native_drag, baseline_drag);
        assert!(native_coast > baseline_coast * 1.25, "native coast: {native_coast}; baseline: {baseline_coast}");
    }

    #[test]
    fn a_fling_travels_as_far_on_120_hz_displays_as_on_60_hz() {
        let fling = |dt: f64| {
            let mut doc = ComponentDocument::default();
            set(&mut doc, 1000, 0..20, 0., 0);
            let step = |doc: &mut ComponentDocument| doc.frame_after(400., 600., 1., dt).drop_without_applying_deltas();
            doc.touch(0, 200., 300.);
            step(&mut doc);
            let moves = (0.1 / dt).round() as usize;
            for i in 1..=moves {
                doc.touch(1, 200., 300. - 250. * i as f32 / moves as f32);
                step(&mut doc);
            }
            doc.touch(2, 200., 50.);
            for _ in 0..(3. / dt) as usize {
                step(&mut doc);
            }
            range(&doc)["offset"].as_f64().unwrap()
        };
        let (sixty, one_twenty) = (fling(1. / 60.), fling(1. / 120.));
        assert!(sixty > 500., "inertia should carry past the 250-point drag: {sixty}");
        assert!((one_twenty - sixty).abs() < sixty * 0.15, "60 Hz: {sixty}, 120 Hz: {one_twenty}");
    }

    #[test]
    fn a_tap_with_finger_jitter_leaves_the_list_where_it_was() {
        for jitter in [2., 5.] {
            let mut doc = ComponentDocument::default();
            set(&mut doc, 1000, 0..20, 0., 0);
            doc.command(&json!({"action":"listScroll","id":"list","offset":400})).unwrap();
            frame(&mut doc);
            doc.touch(0, 200., 150.);
            frame(&mut doc);
            for step in 1..=3 {
                doc.touch(1, 200., 150. - jitter * step as f32 / 3.);
                doc.frame_after(400., 600., 1., 0.004).drop_without_applying_deltas();
            }
            doc.touch(2, 200., 150. - jitter);
            for _ in 0..60 {
                frame(&mut doc);
            }
            assert_eq!(range(&doc)["offset"], 400., "a {jitter}-point tap moved the list");
        }
    }

    #[test]
    fn touching_a_new_spot_never_jumps_the_list() {
        let mut doc = ComponentDocument::default();
        set(&mut doc, 1000, 0..20, 0., 0);
        doc.touch(0, 200., 300.);
        frame(&mut doc);
        for i in 1..=6 {
            doc.touch(1, 200., 300. - 40. * i as f32);
            frame(&mut doc);
        }
        doc.touch(2, 200., 60.);
        for _ in 0..10 {
            frame(&mut doc);
        }
        let coasting = range(&doc)["offset"].as_f64().unwrap();
        doc.touch(0, 200., 150.);
        frame(&mut doc);
        let touched = range(&doc)["offset"].as_f64().unwrap();
        assert!(
            touched >= coasting,
            "a touch 90 points below the last lift moved the list back: {coasting} -> {touched}"
        );
        doc.touch(2, 200., 150.);
        frame(&mut doc);
        doc.touch(0, 200., 250.);
        doc.touch(2, 200., 250.);
        let before = range(&doc)["offset"].as_f64().unwrap();
        frame(&mut doc);
        assert!(range(&doc)["offset"].as_f64().unwrap() >= before, "a tap elsewhere moved the list back");
    }

    #[test]
    fn taps_on_a_resting_list_leave_it_in_place() {
        let mut doc = ComponentDocument::default();
        set(&mut doc, 1000, 0..20, 0., 0);
        doc.command(&json!({"action":"listScroll","id":"list","offset":400})).unwrap();
        frame(&mut doc);
        for y in [60., 250., 30., 300., 150.] {
            doc.touch(0, 200., y);
            frame(&mut doc);
            doc.touch(2, 200., y);
            for _ in 0..30 {
                frame(&mut doc);
            }
            assert_eq!(range(&doc)["offset"], 400., "a tap at y={y} moved the list");
        }
    }

    #[test]
    fn a_lift_and_the_next_touch_in_one_frame_never_jump_the_list() {
        let mut doc = ComponentDocument::default();
        set(&mut doc, 1000, 0..20, 0., 0);
        doc.touch(0, 200., 300.);
        frame(&mut doc);
        for i in 1..=6 {
            doc.touch(1, 200., 300. - 40. * i as f32);
            frame(&mut doc);
        }
        doc.touch(2, 200., 60.);
        doc.touch(0, 200., 250.);
        let lifted = range(&doc)["offset"].as_f64().unwrap();
        frame(&mut doc);
        frame(&mut doc);
        let touched = range(&doc)["offset"].as_f64().unwrap();
        assert!(
            touched >= lifted,
            "touching 190 points below the lift moved the list back: {lifted} -> {touched}"
        );
    }

    #[test]
    fn scrolling_sends_positions_at_a_bounded_rate_and_settles_with_the_final_ones() {
        let mut doc = ComponentDocument::default();
        let rows: Vec<_> = (0..12)
            .map(|index| {
                json!({"id": format!("row-{index}"), "kind": "NListItem", "props": {"index": index},
                    "children": [{"id":format!("button-{index}"), "kind":"NButton", "props":{"label":format!("Game {index}"), "height": 360}}]})
            })
            .collect();
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":{"itemCount":100,"itemSize":380,"overscan":4,"height":600},"children":rows}]))
            .unwrap();
        frame(&mut doc);
        doc.touch(0, 200., 500.);
        frame(&mut doc);
        for i in 1..=6 {
            doc.touch(1, 200., 500. - 60. * i as f32);
            frame(&mut doc);
        }
        doc.touch(2, 200., 140.);
        let mut received = doc.take_snapshot();
        let mut sent = 0;
        for _ in 0..60 {
            doc.frame(400., 600., 1.).drop_without_applying_deltas();
            let snapshot = doc.take_snapshot();
            if snapshot["revision"] != received["revision"] {
                sent += 1;
                received = snapshot;
            }
        }
        assert!(sent <= 16, "{sent} snapshots in one second of coasting");
        for _ in 0..400 {
            frame(&mut doc);
            let snapshot = doc.take_snapshot();
            if snapshot["revision"] != received["revision"] {
                received = snapshot;
            }
        }
        let offset = |snapshot: &Value| snapshot["nodes"].as_array().unwrap().iter().find(|n| n["id"] == "list").unwrap()["value"]["offset"].clone();
        assert_eq!(offset(&received), range(&doc)["offset"], "the last snapshot JS received is stale");
        assert!(range(&doc)["offset"].as_f64().unwrap() > 500.);
    }

    #[test]
    fn tapping_the_text_of_a_partly_hidden_row_does_not_scroll_to_it() {
        let mut doc = ComponentDocument::default();
        let rows: Vec<_> = (0..12)
            .map(|index| {
                json!({"id": format!("row-{index}"), "kind": "NListItem", "props": {"index": index},
                    "children": [{"id":format!("text-{index}"), "kind":"NText",
                        "props":{"text":"Guide the snake to eat food and grow longer without hitting the walls or yourself in this classic arcade game that keeps getting faster"}}]})
            })
            .collect();
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":{"itemCount":12,"itemSize":120,"overscan":4,"height":300},"children":rows}]))
            .unwrap();
        frame(&mut doc);
        for (y, wiggle) in [(285., 3.), (285., 6.), (295., 7.), (250., 7.5), (60., 7.)] {
            doc.touch(0, 60., y);
            frame(&mut doc);
            for step in 1..=3 {
                doc.touch(1, 60. + wiggle * step as f32 / 3., y);
                frame(&mut doc);
            }
            doc.touch(2, 60. + wiggle, y);
            for _ in 0..10 {
                frame(&mut doc);
            }
            assert_eq!(
                range(&doc)["offset"],
                0.,
                "pressing text at y={y} with a {wiggle}-point nudge scrolled the list"
            );
        }
    }

    #[test]
    fn taps_anywhere_on_a_home_style_list_keep_its_scroll_position() {
        let mut doc = ComponentDocument::default();
        let card = |id: String| {
            let badge = json!({"id":format!("badge-{id}"),"kind":"NCard","props":{"className":"bg-action absolute top-0 right-0 flex-row items-center gap-[5px] rounded-none rounded-bl-xl border px-[9px] py-[5px]"},"children":[
                {"id":format!("crown-{id}"),"kind":"NIcon","props":{"size":14,"strokeWidth":2,"paths":["M5 21h14"]}},
                {"id":format!("premium-{id}"),"kind":"NText","props":{"text":"Premium","className":"text-[11px] font-extrabold uppercase"}}]});
            let media = json!({"id":format!("media-{id}"),"kind":"NCard","props":{"className":"gap-0 rounded-none border-0 bg-transparent p-0"},"children":[
                {"id":format!("art-{id}"),"kind":"NCard","props":{"width":180,"height":180,"className":"border-0 p-0"}}, badge]});
            let button = json!({"id":format!("button-{id}"),"kind":"NCard","props":{"height":40,"className":"bg-action w-full flex-row items-center justify-center gap-0 rounded-xl border-0 px-4 py-2.5"},"children":[
                {"id":format!("pad-{id}"),"kind":"NIcon","props":{"size":18,"viewBox":512,"paths":["M0 0H512V512H0Z"]}},
                {"id":format!("play-{id}"),"kind":"NText","props":{"text":"PLAY NOW","className":"ml-1.5 text-sm font-bold"}}]});
            json!({"id":format!("press-{id}"),"kind":"NPress","props":{"width":182,"height":334},"children":[
                {"id":format!("card-{id}"),"kind":"NCard","props":{"width":182,"className":"gap-0 rounded-[14px] border p-0"},"children":[media,
                    {"id":format!("copy-{id}"),"kind":"NCard","props":{"className":"w-full gap-0 rounded-none border-0 bg-transparent p-2.5"},"children":[
                        {"id":format!("title-{id}"),"kind":"NText","props":{"text":format!("Game {id}"),"numberOfLines":1}},
                        {"id":format!("desc-{id}"),"kind":"NCard","props":{"height":64,"className":"mb-1 w-full gap-0 rounded-none border-0 bg-transparent p-0"},"children":[
                            {"id":format!("text-{id}"),"kind":"NText","props":{"text":"A short description of this game","numberOfLines":3}}]},
                        button]}]}]})
        };
        let mut children = vec![
            json!({"id":"hdr","kind":"NListHeader","children":[{"id":"car","kind":"NCarousel","props":{"height":240},"children":[
            {"id":"slide-a","kind":"NCard","props":{"height":240,"className":"border-0 p-0"}},
            {"id":"slide-b","kind":"NCard","props":{"height":240,"className":"border-0 p-0"}}]}]}),
        ];
        for index in 0..12 {
            children.push(json!({"id":format!("row-{index}"),"kind":"NListItem","props":{"index":index},"children":[
                {"id":format!("pair-{index}"),"kind":"NCard","props":{"height":346,"className":"flex-row gap-3 border-0 bg-transparent px-3 py-1.5"},
                 "children":[card(format!("{index}a")), card(format!("{index}b"))]}]}));
        }
        let pills: Vec<_> = (0..10)
            .map(|i| json!({"id":format!("pill-{i}"),"kind":"NButton","props":{"width":80,"height":48,"label":format!("C{i}")}}))
            .collect();
        children.push(json!({"id":"sticky","kind":"NListStickyHeader","children":[{"id":"shadow","kind":"NScrollShadow","props":{"orientation":"horizontal","height":64,"showsScrollIndicator":false},"children":[
            {"id":"pillrow","kind":"NCard","props":{"width":1100,"height":64,"className":"flex-row items-center gap-3 border-0 px-3 py-2"},"children":pills}]}]}));
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":{"itemCount":12,"itemSize":346,"overscan":4,"height":650,"headerSize":260,"stickyHeaderSize":64},"children":children}]))
            .unwrap();
        frame(&mut doc);
        doc.touch(0, 200., 600.);
        frame(&mut doc);
        for i in 1..=10 {
            doc.touch(1, 200., 600. - 30. * i as f32);
            frame(&mut doc);
        }
        doc.touch(2, 200., 300.);
        for _ in 0..200 {
            frame(&mut doc);
        }
        let rest = range(&doc)["offset"].as_f64().unwrap();
        assert!(rest > 300., "the list should have scrolled: {rest}");
        for (x, y) in [
            (60., 30.),
            (300., 400.),
            (100., 620.),
            (350., 40.),
            (200., 200.),
            (30., 500.),
            (170., 90.),
            (360., 110.),
            (100., 560.),
            (290., 300.),
            (16., 640.),
            (385., 72.),
        ] {
            doc.touch(0, x, y);
            frame(&mut doc);
            doc.touch(2, x, y);
            for _ in 0..20 {
                frame(&mut doc);
            }
            assert_eq!(range(&doc)["offset"].as_f64().unwrap(), rest, "a tap at ({x}, {y}) moved the list");
        }
    }

    #[test]
    fn invalid_geometry_cannot_allocate_unbounded_content() {
        for props in [
            json!({"itemCount":1,"itemSize":0,"overscan":3}),
            json!({"itemCount":1_000_001,"itemSize":40,"overscan":3}),
            json!({"itemCount":1,"itemSize":40,"overscan":101}),
        ] {
            assert!(
                ComponentDocument::default()
                    .set_tree(&json!([{"id":"list","kind":"NList","props":props}]))
                    .is_err()
            );
        }
    }
}

pub(super) fn validate(props: &Value) -> Result<(), String> {
    if props["itemCount"].as_u64().is_none_or(|n| n > 1_000_000)
        || props["itemSize"].as_f64().is_none_or(|n| !n.is_finite() || !(1. ..=16384.).contains(&n))
        || props.get("overscan").is_some_and(|v| v.as_u64().is_none_or(|n| n > 100))
        || props
            .get("initialNumToRender")
            .is_some_and(|v| v.as_u64().is_none_or(|n| !(1..=1000).contains(&n)))
        || props.get("initialScrollIndex").is_some_and(|v| v.as_u64().is_none())
        || props
            .get("onEndReachedThreshold")
            .is_some_and(|v| v.as_f64().is_none_or(|n| !n.is_finite() || n < 0.))
    {
        return Err("Invalid NList item count, itemSize, overscan, initial range or end threshold".into());
    }
    if let Some(height) = props.get("height").or_else(|| props["style"].get("height")) {
        if height.as_f64().is_none_or(|n| !n.is_finite() || !(1. ..=16384.).contains(&n)) {
            return Err("NList height must be between 1 and 16384".into());
        }
    }
    if props["hasSeparator"] == true
        && props["separatorSize"]
            .as_f64()
            .is_none_or(|n| !n.is_finite() || n < 0. || n >= props["itemSize"].as_f64().unwrap())
    {
        return Err("NList separatorSize must be nonnegative and less than itemSize".into());
    }
    for key in ["headerSize", "stickyHeaderSize"] {
        if props
            .get(key)
            .is_some_and(|v| v.as_f64().is_none_or(|n| !n.is_finite() || !(0. ..=16384.).contains(&n)))
        {
            return Err("NList header sizes must be between 0 and 16384".into());
        }
    }
    Ok(())
}

pub(super) fn content_insets(props: &Value) -> style::Edges {
    let v = &props["contentInsets"];
    style::Edges {
        left: v[0].as_f64().unwrap_or(0.) as f32,
        right: v[1].as_f64().unwrap_or(0.) as f32,
        top: v[2].as_f64().unwrap_or(0.) as f32,
        bottom: v[3].as_f64().unwrap_or(0.) as f32,
    }
}

fn header_size(props: &Value) -> f32 {
    numeric(props, &["headerSize"], 0.) as f32 + content_insets(props).top
}

fn sticky_size(props: &Value) -> f32 {
    numeric(props, &["stickyHeaderSize"], 0.) as f32
}

fn headers(props: &Value) -> f32 {
    header_size(props) + sticky_size(props)
}

#[cfg(test)]
mod header_tests {
    use super::*;
    fn frame(doc: &mut ComponentDocument) {
        for _ in 0..3 {
            doc.frame(400., 600., 1.).drop_without_applying_deltas();
        }
    }
    #[test]
    fn sticky_headers_and_native_attachments_share_the_same_clipped_viewport() {
        let mut doc = ComponentDocument::default();
        doc.command(&json!({"action":"environment","overlays":["ad"]})).unwrap();
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":{"height":240,"itemCount":100,"itemSize":80,"headerSize":160,"stickyHeaderSize":48},"children":[
            {"id":"header","kind":"NListHeader","children":[{"id":"hero","kind":"NCard","props":{"height":160,"className":"border-0 p-0"}}]},
            {"id":"sticky","kind":"NListStickyHeader","children":[{"id":"category","kind":"NButton","props":{"label":"Arcade","height":48}}]},
            {"id":"row","kind":"NListItem","props":{"index":0},"children":[{"id":"ad","kind":"NCard","props":{"width":120,"height":80,"className":"border-0 p-0"}}]}
        ]}])).unwrap();
        frame(&mut doc);
        assert_eq!(doc.overlay_bounds()["ad"][1], 208.);
        assert_eq!(doc.overlay_clips()["ad"][3], 32.);
        doc.command(&json!({"action":"listScroll","id":"list","offset":200})).unwrap();
        frame(&mut doc);
        let category = doc.semantics.iter().find(|node| node.id == "category").unwrap();
        assert_eq!(category.rect[1], 0.);
        assert_eq!(doc.overlay_bounds()["ad"][1], 8.);
        assert_eq!(doc.overlay_clips()["ad"], [0., 48., 120., 40.]);
        doc.command(&json!({"action":"listScroll","id":"list","offset":400})).unwrap();
        frame(&mut doc);
        assert!(!doc.overlay_bounds().contains_key("ad"));
        doc.command(&json!({"action":"listScroll","id":"list","kind":"index","index":0})).unwrap();
        frame(&mut doc);
        assert_eq!(doc.overlay_bounds()["ad"][1], 48.);
        doc.command(&json!({"action":"listScroll","id":"list","kind":"index","index":5,"viewPosition":0.5}))
            .unwrap();
        let list = doc.tree[0].clone();
        assert_eq!(doc.plan_list(&json!({"id":"list","props":list.props})).unwrap()["offset"], 504.);
    }
    #[test]
    fn blurred_sticky_headers_paint_body_underneath_but_clip_accessibility_and_native_views() {
        let mut doc = ComponentDocument::default();
        doc.command(&json!({"action":"environment","native":true,"overlays":["ad"]})).unwrap();
        doc.set_tree(&json!([{"id":"list","kind":"NList","props":{"height":240,"itemCount":100,"itemSize":80,"headerSize":160,"stickyHeaderSize":48},"children":[
            {"id":"sticky","kind":"NListStickyHeader","children":[{"id":"glass","kind":"NView","props":{"width":400,"height":48,"className":"backdrop-blur-md bg-background/30 p-0 gap-0"},"children":[
                {"id":"category","kind":"NButton","props":{"label":"Arcade","width":100,"height":48}}
            ]}]},
            {"id":"row","kind":"NListItem","props":{"index":0},"children":[{"id":"body","kind":"NPress","props":{"height":80,"width":400,"className":"bg-[#ef4444] p-0 gap-0"},"children":[
                {"id":"ad","kind":"NCard","props":{"width":120,"height":80,"className":"border-0 p-0"}}
            ]}]}
        ]}])).unwrap();
        frame(&mut doc);
        doc.command(&json!({"action":"listScroll","id":"list","offset":200})).unwrap();
        frame(&mut doc);
        let output = doc.frame(400., 600., 1.);
        let marker = output
            .shapes
            .iter()
            .position(|shape| {
                matches!(&shape.shape, egui::Shape::Callback(callback)
            if callback.callback.is::<Backdrop>())
            })
            .expect("blur marker");
        assert!(
            output.shapes[..marker].iter().any(|shape| shape.clip_rect.top() < 48.
                && matches!(&shape.shape, egui::Shape::Rect(rect) if rect.fill == Color32::from_rgb(239, 68, 68) && rect.rect.top() < 48.)),
            "body paints behind glass"
        );
        output.drop_without_applying_deltas();
        assert_eq!(doc.overlay_clips()["ad"], [0., 48., 120., 40.]);
        let body = doc.semantics.iter().find(|s| s.id == "body").unwrap();
        assert_eq!(body.rect[1], 48.);
        doc.events.clear();
        doc.touch(0, 200., 24.);
        frame(&mut doc);
        doc.touch(2, 200., 24.);
        frame(&mut doc);
        assert!(
            !doc.events.iter().any(|e| e["type"] == "press" && e["id"] == "body"),
            "glass gaps cannot activate hidden cards"
        );
        doc.events.clear();
        doc.touch(0, 50., 24.);
        frame(&mut doc);
        doc.touch(2, 50., 24.);
        frame(&mut doc);
        assert!(
            doc.events.iter().any(|e| e["type"] == "press" && e["id"] == "category"),
            "foreground categories remain tappable"
        );
    }
    #[test]
    fn pin_changes_are_reported_at_the_header_boundary_without_per_pixel_updates() {
        let props = json!({"height":240,"itemCount":100,"itemSize":80,"headerSize":160,"stickyHeaderSize":48});
        let mut state = ListState::default();
        state.notification(&range_at(&props, 159., 240., false));
        let next = state.notification(&range_at(&props, 161., 240., false)).unwrap();
        assert_eq!(next["headerPinned"], true);
        assert_eq!(next["headerPinnedChanged"], true);
        assert_eq!(next["visibleChanged"], false);
        assert!(state.notification(&range_at(&props, 162., 240., false)).is_none());
    }
}

fn height(props: &Value) -> f32 {
    props["style"]["height"].as_f64().or_else(|| props["height"].as_f64()).unwrap_or(400.) as f32
}

fn configuration(props: &Value) -> String {
    json!({"count":props["itemCount"],"size":props["itemSize"],"overscan":props["overscan"],
        "height":height(props),"initial":props["initialScrollIndex"],"rows":props["initialNumToRender"],
        "threshold":props["onEndReachedThreshold"],"headerSize":props["headerSize"],"stickyHeaderSize":props["stickyHeaderSize"],"contentInsets":props["contentInsets"]})
    .to_string()
}

fn initial_offset(props: &Value) -> f32 {
    let count = props["itemCount"].as_u64().unwrap_or(0);
    let index = props["initialScrollIndex"].as_u64().unwrap_or(0).min(count.saturating_sub(1));
    if index == 0 {
        0.
    } else {
        header_size(props) + index as f32 * numeric(props, &["itemSize"], 64.) as f32
    }
}

fn range_at(props: &Value, offset: f32, viewport: f32, initial: bool) -> Value {
    let count = props["itemCount"].as_u64().unwrap_or(0) as usize;
    let size = numeric(props, &["itemSize"], 64.) as f32;
    let overscan = props["overscan"].as_u64().unwrap_or(6) as usize;
    let total = headers(props) + count as f32 * size + content_insets(props).bottom;
    let offset = offset.clamp(0., (total - viewport).max(0.));
    let first = (((offset - header_size(props)).max(0.) / size).floor() as usize).min(count.saturating_sub(1));
    let visible_end = ((((offset + viewport - headers(props)).max(0.)) / size).ceil() as usize).min(count);
    let end = if initial {
        first
            .saturating_add(props["initialNumToRender"].as_u64().unwrap_or(12) as usize)
            .saturating_add(overscan)
            .min(count)
    } else {
        visible_end.saturating_add(overscan).min(count)
    };
    let distance = (total - offset - viewport).max(0.);
    json!({"configuration":configuration(props),"start":first.saturating_sub(overscan),"end":end,
        "first":if count==0 || visible_end == 0 {-1} else {first as i64},"last":if count==0 || visible_end == 0 {-1} else {visible_end.saturating_sub(1) as i64},
        "offset":offset,"viewportHeight":viewport,"itemCount":count,"itemSize":size,"atEnd":distance<=0.5,
        "nearEnd":count>0 && (distance <= 0.5 || distance <= viewport * numeric(props,&["onEndReachedThreshold"],0.5) as f32),
        "distanceFromEnd":if distance<=0.5 {0.} else {distance},"headerPinned":sticky_size(props)>0. && offset>=header_size(props)})
}

impl ListState {
    pub(super) fn window_notification(&mut self, range: &Value, children: &[Node], now: f64) -> Option<Value> {
        if let Some(event) = self.notification(range) {
            self.window_checked_at = now;
            return Some(event);
        }
        if now - self.window_checked_at < 0.1 {
            return None;
        }
        self.window_checked_at = now;
        let indices = children.iter().filter(|node| node.kind == "NListItem").filter_map(|node| node.props["index"].as_u64());
        let (mounted, expected) = if let Some(visible) = range["visibleRanges"].as_array() {
            let spans: Vec<_> = visible.iter().map(|entry| {
                (entry["start"].as_u64().unwrap(), entry["end"].as_u64().unwrap(), entry["step"].as_u64().unwrap())
            }).collect();
            let expected = spans.iter().map(|&(start, end, step)| (end - start).div_ceil(step)).sum();
            let mounted = indices.filter(|&index| spans.iter().any(|&(start, end, step)| {
                (start..end).contains(&index) && (index - start).is_multiple_of(step)
            })).count() as u64;
            (mounted, expected)
        } else {
            let first = range["first"].as_u64()?;
            let last = range["last"].as_u64()?;
            (indices.filter(|index| (first..=last).contains(index)).count() as u64, last.checked_sub(first)? + 1)
        };
        if mounted >= expected {
            return None;
        }
        // The native range may have reached JS before its matching rows were committed.
        // Reissue only the range, without repeating visibility or pagination callbacks.
        Some(range.clone())
    }

    pub(super) fn prepare_window(&self, range: &mut Value, overscan: usize, columns: usize, velocity: f32) {
        let (Some(first), Some(last)) = (range["first"].as_u64(), range["last"].as_u64()) else {
            return;
        };
        let count = range["itemCount"].as_u64().unwrap_or(0);
        // Give React time to mount rows in the direction of travel. At rest the
        // ordinary window returns, and the extra work never exceeds the configured buffer.
        let distance = (velocity.abs() as f64 * 0.12).min(range["viewportHeight"].as_f64().unwrap_or(0.));
        let extra = (distance / range["itemSize"].as_f64().unwrap_or(1.)).floor() as usize;
        let extra = (extra.min(overscan) * columns) as u64;
        let behind = if velocity < 0. { extra } else { 0 };
        let ahead = if velocity > 0. { extra } else { 0 };
        let next_start = range["start"].as_u64().unwrap_or(0).saturating_sub(behind);
        let next_end = (range["end"].as_u64().unwrap_or(0) + ahead).min(count);
        if extra > 0 {
            range["start"] = json!(next_start);
            range["end"] = json!(next_end);
        }
        let Some(previous) = self.range.as_ref() else { return };
        if overscan < 2 || previous["configuration"] != range["configuration"] {
            return;
        }
        let start = previous["start"].as_u64().unwrap_or(0);
        let end = previous["end"].as_u64().unwrap_or(0);
        // Move the window in batches while a buffer still surrounds the visible rows.
        // Never let the larger startup window become permanent.
        let buffer = (overscan / 2 * columns) as u64;
        if start <= first.saturating_sub(buffer + behind)
            && end >= (last + 1 + buffer + ahead).min(count)
            && end.saturating_sub(start) <= next_end.saturating_sub(next_start)
        {
            range["start"] = json!(start);
            range["end"] = json!(end);
        }
    }

    pub(super) fn notification(&mut self, range: &Value) -> Option<Value> {
        let count = range["itemCount"].as_u64().unwrap_or(0) as usize;
        let near_end = range["nearEnd"] == true;
        let end_reached = near_end && self.reached_count != Some(count);
        self.reached_count = if near_end { Some(count) } else { None };
        let visible = (range["first"].as_i64().unwrap_or(-1), range["last"].as_i64().unwrap_or(-1));
        let visible_changed = self.visible != Some(visible);
        self.visible = Some(visible);
        let pinned = range["headerPinned"] == true;
        let pinned_changed = self.pinned != Some(pinned);
        self.pinned = Some(pinned);
        let mut key = range.clone();
        for field in ["offset", "distanceFromEnd"] {
            key.as_object_mut().unwrap().remove(field);
        }
        if self.range.as_ref() == Some(&key) && !end_reached && !visible_changed {
            return None;
        }
        self.range = Some(key);
        let mut event = range.clone();
        event["endReached"] = json!(end_reached);
        event["visibleChanged"] = json!(visible_changed);
        event["headerPinnedChanged"] = json!(pinned_changed);
        Some(event)
    }
}

pub(super) fn show_list_viewport<R>(
    native: bool,
    area: egui::ScrollArea,
    ui: &mut egui::Ui,
    contents: impl FnOnce(&mut egui::Ui, Rect) -> R,
) -> egui::scroll_area::ScrollAreaOutput<R> {
    if !native {
        return area.show_viewport(ui, contents);
    }
    // Keep native list rows in the viewport during fast flings at either end.
    // Nested controls keep their own scrolling behavior.
    let style = ui.style().clone();
    let kinetic = &mut ui.spacing_mut().scroll.kinetic;
    kinetic.rubber_band = false;
    kinetic.decay_time *= 1.3;
    let output = area.show_viewport(ui, |child, viewport| {
        child.set_style(style.clone());
        contents(child, viewport)
    });
    ui.set_style(style);
    output
}

pub(super) fn scroll_velocity(ui: &egui::Ui, output: &egui::scroll_area::ScrollAreaOutput<impl Sized>) -> f32 {
    if ui.ctx().is_being_dragged(output.id.with("area")) {
        -ui.input(|input| input.pointer.velocity().y)
    } else {
        output.state.velocity().y
    }
}

pub(super) fn mounted_window(children: &[Node], count: usize) -> Option<(usize, usize)> {
    let mut indices = children.iter().filter_map(|node| {
        (node.kind == "NListItem").then(|| node.props["index"].as_u64()).flatten()
            .and_then(|index| usize::try_from(index).ok()).filter(|index| *index < count)
    });
    let first = indices.next()?;
    Some((first, indices.next_back().unwrap_or(first) + 1))
}

pub(super) fn covered_offset(desired: f32, lower: Option<f32>, upper: Option<f32>) -> f32 {
    desired.min(upper.unwrap_or(f32::INFINITY)).max(lower.unwrap_or(0.))
}

pub(super) fn mounted_offset(desired: f32, viewport: f32, sticky: f32, start: f32, end: f32, before: bool, after: bool) -> f32 {
    // A partial window can already show everything it has. Avoid moving a pinned
    // header away just to expose an earlier portion of the same mounted rows.
    if end - start < viewport - sticky && start < desired + viewport && end > desired + sticky {
        return desired;
    }
    covered_offset(desired, before.then_some(start - sticky), after.then_some((end - viewport).max(start - sticky)))
}

impl ComponentDocument {
    fn list_content(&self, props: &Value, width: f32) -> (Value, style::Style) {
        let palette = self
            .tree
            .iter()
            .find(|n| n.kind == "NTheme")
            .map(|n| theme::Palette::configure(&self.palette, &n.props, self.dark))
            .unwrap_or_else(|| self.palette.clone());
        let content = style::Style::resolve(
            "NView",
            &json!({"className":props["contentContainerClassName"],"style":props["contentContainerStyle"],"safeArea":props["contentSafeArea"]}),
            &palette,
            style::Conditions {
                dark: palette.dark,
                viewport: self.context.viewport_rect().width(),
                ..Default::default()
            },
            Vec2::new(width, 16384.),
        );
        let mut geometry = props.clone();
        let p = content.padding;
        geometry["contentInsets"] = json!([p.left, p.right, p.top, p.bottom]);
        (geometry, content)
    }

    pub(super) fn plan_list(&self, command: &Value) -> Result<Value, String> {
        let id = command["id"].as_str().ok_or("Missing UI list id")?;
        let (props, _) = self.list_content(&command["props"], self.context.viewport_rect().width());
        let props = &props;
        validate(props)?;
        if props["variableSize"] == true {
            return Ok(self.plan_flow_list(id, props));
        }
        let state = self.lists.get(id);
        let viewport = state.and_then(|s| s.viewport).unwrap_or_else(|| height(props));
        let offset = state
            .map(|s| s.requested_offset.unwrap_or(s.offset))
            .unwrap_or_else(|| initial_offset(props));
        Ok(range_at(props, offset, viewport, state.is_none()))
    }

    pub(super) fn scroll_list(&mut self, command: &Value) -> Result<(), String> {
        fn find<'a>(nodes: &'a [Node], id: &str, disabled: bool) -> Option<(&'a Node, bool)> {
            for node in nodes {
                let disabled = disabled || flag(&node.props, &["disabled", "isDisabled"]);
                if node.id == id && node.kind == "NList" {
                    return Some((node, disabled));
                }
                if let Some(found) = find(&node.children, id, disabled) {
                    return Some(found);
                }
            }
            None
        }
        let id = command["id"].as_str().ok_or("Missing UI list id")?;
        let (node, disabled) = find(&self.tree, id, false).ok_or("UI list is unavailable")?;
        if disabled {
            return Err("UI list is unavailable".into());
        }
        let (props, _) = self.list_content(&node.props, self.context.viewport_rect().width());
        let props = &props;
        if props["variableSize"] == true {
            let props = props.clone();
            return self.scroll_flow_list(id, &props, command);
        }
        let count = props["itemCount"].as_u64().unwrap_or(0);
        let size = numeric(props, &["itemSize"], 64.);
        let state = self.lists.entry(id.into()).or_default();
        let viewport = state.viewport.unwrap_or_else(|| height(props)) as f64;
        let offset = match command["kind"].as_str().unwrap_or("offset") {
            "end" => headers(props) as f64 + count as f64 * size + content_insets(props).bottom as f64,
            "index" => {
                let index = command["index"]
                    .as_u64()
                    .filter(|n| *n < count)
                    .ok_or("NList scroll index is out of range")?;
                let position = if command.get("viewPosition").is_some() {
                    command["viewPosition"]
                        .as_f64()
                        .filter(|n| n.is_finite() && (0. ..=1.).contains(n))
                        .ok_or("NList viewPosition must be between 0 and 1")?
                } else {
                    0.
                };
                header_size(props) as f64 + index as f64 * size - (viewport - sticky_size(props) as f64 - size).max(0.) * position
            }
            "offset" => command["offset"]
                .as_f64()
                .filter(|n| n.is_finite() && *n >= 0.)
                .ok_or("NList scroll offset must be finite and nonnegative")?,
            _ => return Err("Unknown NList scroll command".into()),
        };
        state.requested_offset = Some(offset.clamp(
            0.,
            (headers(props) as f64 + count as f64 * size + content_insets(props).bottom as f64 - viewport).max(0.),
        ) as f32);
        Ok(())
    }

    pub(super) fn virtual_list(&mut self, ui: &mut egui::Ui, node: &Node, resolved: &style::Style) {
        let (props, content) = self.list_content(&node.props, ui.available_width());
        let props = &props;
        if node.props["variableSize"] == true {
            self.flow_list(ui, node, resolved, props, &content);
            return;
        }
        let count = node.props["itemCount"].as_u64().unwrap_or(0) as usize;
        let size = numeric(&node.props, &["itemSize"], 64.) as f32;
        let height = resolved
            .height
            .unwrap_or_else(|| ui.ctx().viewport_rect().height().min(400.))
            .clamp(1., 16384.);
        let padding = content_insets(props);
        let head = header_size(props) - padding.top;
        let sticky = sticky_size(props);
        let sequence = node.props["scrollSequence"].as_u64().unwrap_or(0);
        let state = self.lists.entry(node.id.clone()).or_default();
        let mut area = egui::ScrollArea::vertical()
            .id_salt((&node.id, "list"))
            .max_height(height)
            .min_scrolled_height(height)
            .auto_shrink([false, false])
            .scroll_bar_visibility(if node.props["showsVerticalScrollIndicator"] == false {
                egui::scroll_area::ScrollBarVisibility::AlwaysHidden
            } else {
                egui::scroll_area::ScrollBarVisibility::VisibleWhenNeeded
            });
        let requested = state.requested_offset.take();
        let commanded = requested.is_some() || state.command != Some(sequence);
        if commanded {
            state.command = Some(sequence);
            let offset = requested.unwrap_or_else(|| {
                node.props["scrollOffset"]
                    .as_f64()
                    .map(|v| v.max(0.) as f32)
                    .unwrap_or_else(|| initial_offset(props))
            });
            area = area.vertical_scroll_offset(offset.min((head + sticky + count as f32 * size + padding.top + padding.bottom - height).max(0.)));
        }
        let mut range = Value::Null;
        let mounted = if self.native { mounted_window(&node.children, count) } else { None };
        let output = show_list_viewport(self.native, area, ui, |ui, viewport| {
            content.frame(false).show(ui, |ui| {
                ui.spacing_mut().item_spacing.y = 0.;
                let total = head + sticky + count as f32 * size;
                ui.set_height(total);
                // Keep the last committed rows paintable while JS catches up to the requested window.
                let offset = mounted.map_or(viewport.min.y, |(start, end)| mounted_offset(
                    viewport.min.y,
                    viewport.height(),
                    sticky,
                    head + padding.top + sticky + start as f32 * size,
                    head + padding.top + sticky + end as f32 * size,
                    start > 0,
                    end < count,
                ));
                let origin = ui.max_rect().min + Vec2::new(0., viewport.min.y - offset);
                let width = ui.available_width();
                let sticky_y = origin.y + head.max(offset - padding.top);
                if let Some(header) = node.children.iter().find(|n| n.kind == "NListHeader") {
                    let rect = Rect::from_min_size(origin, Vec2::new(width, head));
                    self.list_part(ui, header, rect, ui.clip_rect());
                }
                let body_clip = if sticky > 0. {
                    ui.clip_rect()
                        .intersect(Rect::from_min_max(Pos2::new(origin.x, sticky_y + sticky), ui.clip_rect().max))
                } else {
                    ui.clip_rect()
                };
                if count == 0 {
                    for empty in node.children.iter().filter(|n| n.kind == "NListEmpty") {
                        let rect = Rect::from_min_size(origin + Vec2::new(0., head + sticky), Vec2::new(width, height));
                        self.list_part(ui, empty, rect, body_clip);
                    }
                }
                // Backdrop filters need body pixels behind the pinned header. Keep hit testing,
                // accessibility and platform attachments clipped below it.
                let backdrop = offset >= head + padding.top
                    && node
                        .children
                        .iter()
                        .find(|n| n.kind == "NListStickyHeader")
                        .is_some_and(|n| self.has_backdrop(n, width));
                let paint_clip = if backdrop { ui.clip_rect() } else { body_clip };
                let interaction_clip = self.interaction_clip;
                if backdrop {
                    self.interaction_clip = Some(interaction_clip.map_or(body_clip, |clip| clip.intersect(body_clip)));
                }
                for row in &node.children {
                    if row.kind != "NListItem" {
                        continue;
                    }
                    let Some(index) = row.props["index"].as_u64().map(|index| index as usize) else {
                        continue;
                    };
                    let rect = Rect::from_min_size(
                        origin + Vec2::new(0., head + sticky + index as f32 * size),
                        Vec2::new(ui.available_width(), size),
                    );
                    if index >= count || !rect.intersects(paint_clip) {
                        self.forget_list_bounds(std::slice::from_ref(row));
                        continue;
                    }
                    ui.scope_builder(egui::UiBuilder::new().max_rect(rect), |row_ui| {
                        row_ui.set_clip_rect(row_ui.clip_rect().intersect(rect).intersect(paint_clip));
                        self.nodes(row_ui, std::slice::from_ref(row));
                    });
                }
                self.interaction_clip = interaction_clip;
                if let Some(header) = node.children.iter().find(|n| n.kind == "NListStickyHeader") {
                    let rect = Rect::from_min_size(Pos2::new(origin.x, sticky_y), Vec2::new(width, sticky));
                    if backdrop {
                        ui.interact(
                            rect.intersect(ui.clip_rect()),
                            egui::Id::unique((&node.id, "sticky-backdrop")),
                            egui::Sense::click_and_drag(),
                        );
                    }
                    self.list_part(ui, header, rect, ui.clip_rect());
                }
                // egui derives the viewport from large scroll coordinates, so its height wobbles in the
                // last float bits; a wobbling height would re-notify React every frame.
                let viewport_height = if (viewport.height() - height).abs() < 0.5 {
                    height
                } else {
                    viewport.height()
                };
                range = range_at(props, viewport.min.y, viewport_height, false);
            });
        });
        if output.content_size.y > output.inner_rect.height() {
            self.register_scroll_target(ui, output.id, output.inner_rect, false);
        }
        let state = self.lists.get_mut(&node.id).unwrap();
        state.offset = range["offset"].as_f64().unwrap_or(0.) as f32;
        state.viewport = range["viewportHeight"].as_f64().map(|v| v as f32);
        if !commanded {
            state.prepare_window(&mut range, props["overscan"].as_u64().unwrap_or(6) as usize, 1, scroll_velocity(ui, &output));
        }
        if let Some(event) = state.window_notification(&range, &node.children, self.elapsed) {
            self.change(&node.id, event);
        }
        let response = ui.interact(output.inner_rect, egui::Id::unique((&node.id, "list-viewport")), egui::Sense::hover());
        self.semantic(ui, node, &response, range);
    }

    fn list_part(&mut self, ui: &mut egui::Ui, node: &Node, rect: Rect, clip: Rect) {
        if !rect.is_positive() || !rect.intersects(clip) {
            self.forget_list_bounds(std::slice::from_ref(node));
            return;
        }
        ui.scope_builder(egui::UiBuilder::new().max_rect(rect), |ui| {
            ui.set_clip_rect(clip.intersect(rect));
            self.nodes(ui, std::slice::from_ref(node));
        });
    }

    pub(super) fn forget_list_bounds(&mut self, nodes: &[Node]) {
        for node in nodes {
            if let Some(carousel) = self.carousels.get_mut(&node.id) {
                carousel.pause(self.elapsed);
            }
            self.layout_rects.remove(&node.id);
            self.layout_clips.remove(&node.id);
            self.forget_list_bounds(&node.children);
        }
    }
}
