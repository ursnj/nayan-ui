use super::*;
use serde_json::json;
fn doc() -> Document {
    Document::new(128., 128., 1.).unwrap()
}
fn path(d: &str, color: &str) -> Value {
    json!({"path":d,"color":color,"width":4,"opacity":1,"style":"stroke"})
}
fn pixel(d: &Document, x: usize, y: usize) -> [u8; 4] {
    d.raster.pixels[(y * d.raster.width as usize + x) * 4..(y * d.raster.width as usize + x) * 4 + 4]
        .try_into()
        .unwrap()
}
fn run(d: &mut Document, brush: &str) {
    d.command(json!({"op":"brush","brushType":brush,"color":"#2468cc","width":8.,"opacity":0.6,"smoothing":0.25}))
        .unwrap();
    d.touch(0, 20., 20., 0.3);
    for i in 1..50 {
        d.touch(1, 20. + i as f32 * 1.5, 20. + (i as f32 * 0.15).sin() * 10., i as f32 / 50.);
    }
    d.touch(2, 100., 20., 0.8);
}
#[test]
fn all_legacy_brushes_keep_svg_metadata_and_look_after_roundtrip() {
    for brush in ["NORMAL", "MARKER", "PENCIL", "CALLIGRAPHY", "WATERCOLOR", "NEON", "CRAYON", "SPRINKLING"] {
        let mut d = doc();
        let input = json!([{"path":"M10 10 C30 5 45 45 60 20 L100 80","color":"#1e72cc","width":"5","opacity":0.4,"style":"stroke","brushType":brush,"touchPoints":[{"x":1,"y":2,"timestamp":42}],"futureMetadata":{"doNotDrop":true}}]);
        d.load(&input).unwrap();
        let original = d.raster.pixels.clone();
        assert_eq!(d.command(json!({"op":"paths"})).unwrap(), input);
        d.load(&input).unwrap();
        assert_eq!(d.raster.pixels, original, "{brush}");
        assert!(original.iter().any(|p| *p != 0));
    }
}
#[test]
fn svg_commands_arcs_and_scientific_notation_load() {
    let mut d = doc();
    d.load(&json!([path(
        "M1e1 10 h20 v20 q10 10 20 0 t20 0 c0 -10 10 -10 10 0 s10 10 10 0 a5 8 30 0 1 10 0 z",
        "navy"
    )]))
    .unwrap();
    assert!(d.raster.pixels.iter().any(|p| *p != 0));
}
#[test]
fn invalid_legacy_import_is_atomic() {
    let mut d = doc();
    d.load(&json!([path("M0 10 L100 10", "red")])).unwrap();
    let pixels = d.raster.pixels.clone();
    assert!(d.load(&json!([path("M0 0 X10 10", "red")])).is_err());
    assert_eq!(d.paths.len(), 1);
    assert_eq!(d.raster.pixels, pixels);
}
#[test]
fn transparent_eraser_removes_ink_instead_of_painting_paper() {
    let mut d = doc();
    d.load(
        &json!([{"path":"M0 0H128V128H0Z","color":"red","width":1,"style":"fill"},{"path":"M20 64H100","color":"blue","width":12,"isEraser":true}]),
    )
    .unwrap();
    assert_eq!(pixel(&d, 64, 64), [0, 0, 0, 0]);
    assert_eq!(pixel(&d, 64, 20), [255, 0, 0, 255]);
}
#[test]
fn opacity_is_applied_once_per_stroke_even_at_self_intersections() {
    let mut d = doc();
    d.load(&json!([{"path":"M10 64H118M64 10V118","color":"#0000ff","width":20,"opacity":0.5}]))
        .unwrap();
    let a = pixel(&d, 64, 64)[3];
    assert!((125..=130).contains(&a), "alpha was {a}");
    assert_eq!(a, pixel(&d, 30, 64)[3]);
}
#[test]
fn fill_rules_and_stroke_order_survive() {
    let mut d = doc();
    d.load(&json!([{"path":"M10 10H118V118H10ZM30 30H90V90H30Z","color":"red","width":1,"style":"fill","fillRule":"evenodd"}]))
        .unwrap();
    assert_eq!(pixel(&d, 50, 50)[3], 0);
    let mut paths = d.command(json!({"op":"paths"})).unwrap();
    paths[0]["fillRule"] = json!("nonzero");
    d.load(&paths).unwrap();
    assert_eq!(pixel(&d, 50, 50), [255, 0, 0, 255]);
}
#[test]
fn every_new_brush_can_be_reopened_without_a_javascript_object() {
    for brush in ["NORMAL", "MARKER", "PENCIL", "CALLIGRAPHY", "WATERCOLOR", "NEON", "CRAYON", "SPRINKLING"] {
        let mut d = doc();
        run(&mut d, brush);
        let pixels = d.raster.pixels.clone();
        let saved = d.command(json!({"op":"paths"})).unwrap();
        assert!(pixels.iter().any(|p| *p != 0), "{brush}");
        let mut reopened = doc();
        reopened.load(&saved).unwrap();
        assert_eq!(pixels, reopened.raster.pixels, "{brush} changed after saving");
    }
}
#[test]
fn taps_work_for_all_brushes() {
    for brush in ["NORMAL", "MARKER", "PENCIL", "CALLIGRAPHY", "WATERCOLOR", "NEON", "CRAYON", "SPRINKLING"] {
        let mut d = doc();
        d.command(json!({"op":"brush","brushType":brush,"color":"red","width":10})).unwrap();
        d.touch(0, 64., 64., 1.);
        d.touch(2, 64., 64., 1.);
        assert!(d.raster.pixels.iter().any(|p| *p != 0), "invisible {brush} tap");
    }
}
#[test]
fn undo_redo_branch_and_clear_preserve_the_imported_artwork() {
    let mut d = doc();
    let original = json!([path("M10 10H100", "red")]);
    d.load(&original).unwrap();
    run(&mut d, "PENCIL");
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(d.command(json!({"op":"paths"})).unwrap(), original);
    d.command(json!({"op":"redo"})).unwrap();
    assert_eq!(d.paths.len(), 2);
    d.command(json!({"op":"clear"})).unwrap();
    assert_eq!(d.paths.len(), 0);
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(d.paths.len(), 2);
    d.command(json!({"op":"undo"})).unwrap();
    run(&mut d, "NORMAL");
    assert!(!d.summary()["canRedo"].as_bool().unwrap());
}
#[test]
fn cancelled_input_does_not_change_the_document() {
    let mut d = doc();
    d.load(&json!([path("M10 10H100", "red")])).unwrap();
    let before = d.raster.pixels.clone();
    d.touch(0, 20., 20., 1.);
    d.touch(1, 60., 60., 1.);
    if let Some(l) = &mut d.live {
        d.raster.preview(l);
    }
    d.touch(3, 0., 0., 1.);
    assert_eq!(d.raster.pixels, before);
    assert_eq!(d.paths.len(), 1);
}
#[test]
fn dirty_rectangles_stay_local_and_committed_ink_is_not_replayed_per_sample() {
    let mut d = doc();
    d.raster.dirty = None;
    d.touch(0, 20., 20., 1.);
    d.touch(1, 30., 25., 1.);
    if let Some(l) = &mut d.live {
        d.raster.preview(l);
    }
    let r = d.raster.dirty.unwrap();
    assert!(r.width < 64 && r.height < 64, "{r:?}");
    assert!(d.paths.is_empty());
}
#[test]
fn pressure_produces_wider_stylus_marks() {
    fn stroke(pressure: f32) -> usize {
        let mut d = doc();
        d.command(json!({"op":"brush","width":20,"color":"black","pressure":true})).unwrap();
        d.touch(0, 20., 64., pressure);
        d.touch(1, 100., 64., pressure);
        d.touch(2, 110., 64., pressure);
        d.raster.pixels.chunks_exact(4).filter(|p| p[3] > 0).count()
    }
    assert!(stroke(1.) > stroke(0.1) * 2);
}
#[test]
fn fast_brushes_have_continuous_geometry_and_final_endpoint() {
    let mut d = doc();
    d.command(json!({"op":"brush","width":8,"color":"black","smoothing":0.5})).unwrap();
    d.touch(0, 10., 64., 1.);
    d.touch(1, 110., 64., 1.);
    d.touch(2, 115., 64., 1.);
    for x in 10..115 {
        assert!(pixel(&d, x, 64)[3] > 0, "gap at {x}");
    }
}
#[test]
fn canvas_coordinates_follow_zoom_and_fit() {
    let mut d = doc();
    d.viewport = [256., 128.];
    assert_eq!(d.local(128., 64.), [64., 64.]);
    d.transform(20., 0., 3.);
    assert_eq!(d.local(148., 64.), [64., 64.]);
    d.command(json!({"op":"resetView"})).unwrap();
    assert_eq!(d.zoom, 1.);
    assert_eq!(d.offset, [0., 0.]);
}
#[test]
fn width_fit_keeps_phone_and_tablet_edges_drawable_without_changing_artwork() {
    for viewport in [[128., 192.], [256., 128.], [834., 1000.], [1194., 650.]] {
        let mut d = Document::new(128., 256., 1.).unwrap();
        d.load(&json!([path("M10 20L30 40", "red")])).unwrap();
        let project = d.project();
        let pixels = d.raster.pixels.clone();
        let revision = d.revision;
        d.viewport = viewport;
        d.command(json!({"op":"viewFit","fit":"width"})).unwrap();
        assert_eq!(d.project(), project);
        assert_eq!(d.raster.pixels, pixels);
        assert_eq!(d.revision, revision);
        let left = d.local(0., viewport[1] / 2.);
        let right = d.local(viewport[0], viewport[1] / 2.);
        assert!(left[0].abs() < 0.0001, "left gap in {viewport:?}");
        assert!((right[0] - d.width).abs() < 0.0001, "right gap in {viewport:?}");
        d.command(json!({"op":"brush","color":"blue","width":4,"smoothing":0})).unwrap();
        for x in [1., viewport[0] - 1.] {
            d.touch(0, x, viewport[1] / 2., 1.);
            d.touch(2, x, viewport[1] / 2., 1.);
        }
        assert_eq!(d.paths.len(), 3);
        assert!(pixel(&d, 0, 128)[2] > 0);
        assert!(pixel(&d, 127, 128)[2] > 0);
        d.command(json!({"op":"resetView"})).unwrap();
        assert!(d.local(0., viewport[1] / 2.)[0].abs() < 0.0001);
    }
}
#[test]
fn cover_fit_keeps_the_whole_view_drawable_when_the_viewport_resizes() {
    let mut d = doc();
    d.load(&json!([path("M20 20L100 100", "orange")])).unwrap();
    let project = d.project();
    d.command(json!({"op":"viewFit","fit":"cover"})).unwrap();
    for [width, height] in [[256., 128.], [128., 256.]] {
        d.viewport = [width, height];
        for [x, y] in [[0., 0.], [width, height]] {
            let [local_x, local_y] = d.local(x, y);
            assert!((0. ..=d.width).contains(&local_x));
            assert!((0. ..=d.height).contains(&local_y));
        }
        assert_eq!(d.project(), project);
    }
}

#[test]
fn width_fit_pan_reaches_entire_tall_drawing_at_base_zoom_and_stays_within_reach() {
    let mut d = Document::new(128., 256., 1.).unwrap();
    d.viewport = [256., 128.];
    d.command(json!({"op":"viewFit","fit":"width"})).unwrap();
    d.transform(0., 192., 1.);
    assert_eq!(d.offset, [0., 192.]);
    assert_eq!(d.local(0., 0.), [0., 0.]);
    d.transform(0., -384., 1.);
    assert_eq!(d.offset, [0., -192.]);
    assert_eq!(d.local(256., 128.), [128., 256.]);
    d.transform(128., 640., 2.);
    assert_eq!(d.offset, [128., 448.]);
    assert_eq!(d.local(0., 0.), [0., 0.]);
    d.viewport = [128., 256.];
    d.transform(0., 0., 0.5);
    assert_eq!(d.offset, [32., 64.]);
    assert_eq!(d.local(128., 256.), [96., 192.]);
}
#[test]
fn fitted_canvas_can_pan_and_zoom_out_without_editing_or_losing_artwork() {
    let mut d = doc();
    d.load(&json!([path("M20 20L100 100", "orange")])).unwrap();
    d.command(json!({"op":"viewFit","fit":"width"})).unwrap();
    let project = d.project();
    let pixels = d.raster.pixels.clone();
    let revision = d.revision;
    d.transform(20., 15., 1.);
    assert_eq!(d.offset, [20., 15.]);
    assert_eq!(d.local(64., 64.), [44., 49.]);
    d.transform(0., 0., 0.5);
    assert_eq!(d.zoom, 0.5);
    assert_eq!(d.offset, [16., 15.]);
    d.transform(10_000., -10_000., 0.01);
    assert_eq!(d.zoom, 0.5);
    assert_eq!(d.offset, [16., -16.]);
    assert_eq!(d.project(), project);
    assert_eq!(d.raster.pixels, pixels);
    assert_eq!(d.revision, revision);
    d.command(json!({"op":"resetView"})).unwrap();
    assert_eq!(d.zoom, 1.);
    assert_eq!(d.offset, [0., 0.]);
}
#[test]
fn invalid_view_fit_is_atomic_and_contain_stays_available() {
    let mut d = doc();
    d.viewport = [256., 128.];
    assert_eq!(d.view_scale(), 1.);
    d.command(json!({"op":"viewFit","fit":"width"})).unwrap();
    d.transform(0., 10., 2.);
    assert!(d.command(json!({"op":"viewFit","fit":"invalid"})).is_err());
    assert!(matches!(d.view_fit, ViewFit::Width));
    assert_eq!(d.zoom, 2.);
    assert_eq!(d.offset, [0., 10.]);
    d.command(json!({"op":"viewFit","fit":"contain"})).unwrap();
    assert_eq!(d.view_scale(), 1.);
    assert_eq!(d.zoom, 1.);
    assert_eq!(d.offset, [0., 0.]);
}
#[test]
fn png_is_transparent_unpremultiplied_and_has_real_dimensions() {
    let mut d = doc();
    d.load(&json!([{"path":"M10 10H100V100H10Z","color":"red","width":1,"style":"fill","opacity":0.5}]))
        .unwrap();
    let png = d.command(json!({"op":"png"})).unwrap();
    let bytes = base64::engine::general_purpose::STANDARD.decode(png["base64"].as_str().unwrap()).unwrap();
    let mut reader = png::Decoder::new(std::io::Cursor::new(bytes)).read_info().unwrap();
    assert_eq!(reader.info().width, 128);
    assert_eq!(reader.info().height, 128);
    let mut data = vec![0; reader.output_buffer_size().unwrap()];
    reader.next_frame(&mut data).unwrap();
    assert_eq!(&data[..4], &[0, 0, 0, 0]);
    let i = (50 * 128 + 50) * 4;
    assert_eq!(data[i], 255);
    assert!((125..=130).contains(&data[i + 3]));
}
#[test]
fn invalid_dimensions_and_disposed_documents_fail_clearly() {
    for (w, h) in [(0., 20.), (f32::NAN, 20.), (20., f32::INFINITY)] {
        assert!(Document::new(w, h, 2.).is_err());
    }
    let id = create(16., 16., 1.).unwrap();
    destroy(id);
    destroy(id);
    assert!(command(id, "{\"op\":\"state\"}").is_err());
}
#[test]
fn history_is_bounded_without_losing_current_strokes() {
    let mut d = doc();
    for i in 0..140 {
        d.touch(0, 20. + (i % 50) as f32, 20., 1.);
        d.touch(2, 20. + (i % 50) as f32, 20., 1.);
    }
    assert_eq!(d.paths.len(), 140);
    assert!(d.history.len() <= 128);
}
#[test]
fn a_short_smoothed_stroke_reaches_the_release_point() {
    let mut d = doc();
    d.command(json!({"op":"brush","color":"black","width":2,"smoothing":0.8})).unwrap();
    d.touch(0, 20., 20., 1.);
    d.touch(1, 22., 20., 1.);
    d.touch(2, 25., 20., 1.);
    assert!(pixel(&d, 24, 20)[3] > 0);
}
#[test]
fn the_stylus_eraser_does_not_change_the_selected_brush() {
    let mut d = doc();
    d.load(&json!([{"path":"M0 0H128V128H0Z","color":"red","width":1,"style":"fill"}]))
        .unwrap();
    d.command(json!({"op":"brush","color":"blue","width":10,"brushType":"MARKER"})).unwrap();
    d.touch(4, 30., 64., 1.);
    d.touch(1, 90., 64., 1.);
    d.touch(2, 100., 64., 1.);
    assert_eq!(pixel(&d, 64, 64)[3], 0);
    assert_eq!(d.brush["brushType"], "MARKER");
}
#[test]
fn legacy_hairlines_and_zero_width_fills_keep_their_original_metadata() {
    let mut d = doc();
    let paths = json!([
      {"path":"M10 20H110", "color":"navy", "width":0, "style":"stroke"},
      {"path":"M40 40H80V80H40Z", "color":"red", "width":"0", "style":"fill"}
    ]);
    d.load(&paths).unwrap();
    assert!(pixel(&d, 64, 20)[3] > 0);
    assert_eq!(pixel(&d, 64, 64), [255, 0, 0, 255]);
    assert_eq!(d.command(json!({"op":"paths"})).unwrap(), paths);
}

#[test]
fn layers_erase_independently_and_survive_project_roundtrip() {
    let mut d = doc();
    d.load(&json!([{"path":"M0 0H128V128H0Z","color":"red","width":1,"style":"fill","original":"preserved"}]))
        .unwrap();
    d.command(json!({"op":"layer","action":"add"})).unwrap();
    d.command(json!({"op":"brush","color":"blue","width":12,"isEraser":false})).unwrap();
    d.command(json!({"op":"shape","kind":"rectangle","x":20,"y":20,"endX":100,"endY":100,"filled":true}))
        .unwrap();
    assert_eq!(pixel(&d, 64, 64), [0, 0, 255, 255]);
    d.command(json!({"op":"brush","color":"black","width":20,"isEraser":true})).unwrap();
    d.touch(0, 30., 64., 1.);
    d.touch(2, 90., 64., 1.);
    assert_eq!(pixel(&d, 64, 64), [255, 0, 0, 255]);
    assert_eq!(pixel(&d, 64, 30), [0, 0, 255, 255]);
    let saved = d.project();
    let mut restored = doc();
    restored.load(&saved).unwrap();
    assert_eq!(d.raster.pixels, restored.raster.pixels);
    assert_eq!(saved, restored.project());
    assert_eq!(restored.paths[0].data["original"], "preserved");
}
#[test]
fn layer_visibility_opacity_order_and_history_are_editable() {
    let mut d = doc();
    d.load(&json!([{"path":"M0 0H128V128H0Z","color":"red","width":1,"style":"fill"}]))
        .unwrap();
    d.command(json!({"op":"layer","action":"add"})).unwrap();
    d.command(json!({"op":"brush","color":"blue"})).unwrap();
    d.command(json!({"op":"shape","kind":"rectangle","x":0,"y":0,"endX":128,"endY":128,"filled":true}))
        .unwrap();
    d.command(json!({"op":"layer","action":"update","opacity":0.5})).unwrap();
    let p = pixel(&d, 64, 64);
    assert!((126..=129).contains(&p[0]) && (126..=129).contains(&p[2]));
    d.command(json!({"op":"layer","action":"update","visible":false})).unwrap();
    assert_eq!(pixel(&d, 64, 64), [255, 0, 0, 255]);
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(pixel(&d, 64, 64), p);
    d.command(json!({"op":"layer","action":"move","index":0})).unwrap();
    assert_eq!(pixel(&d, 64, 64), [255, 0, 0, 255]);
    d.command(json!({"op":"layer","action":"delete"})).unwrap();
    assert_eq!(d.layers.len(), 1);
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(d.layers.len(), 2);
    d.command(json!({"op":"layer","action":"duplicate"})).unwrap();
    assert_eq!(d.layers.len(), 3);
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(d.layers.len(), 2);
}
#[test]
fn locked_or_hidden_layers_cannot_be_painted_and_limits_are_atomic() {
    let mut d = doc();
    d.command(json!({"op":"layer","action":"update","locked":true})).unwrap();
    d.touch(0, 10., 10., 1.);
    d.touch(2, 100., 100., 1.);
    assert!(d.paths.is_empty());
    assert!(d.command(json!({"op":"fill","x":10,"y":10})).is_err());
    assert!(d.command(json!({"op":"layer","action":"delete"})).is_err());
    d.command(json!({"op":"layer","action":"update","locked":false})).unwrap();
    for _ in 1..16 {
        d.command(json!({"op":"layer","action":"add"})).unwrap();
    }
    assert!(d.command(json!({"op":"layer","action":"add"})).is_err());
    assert_eq!(d.layers.len(), 16);
    let before = d.project();
    let mut bad = before.clone();
    bad["layers"][1]["id"] = json!(0);
    assert!(d.load(&bad).is_err());
    assert_eq!(d.project(), before);
    bad = before.clone();
    bad["activeLayer"] = json!(999);
    assert!(d.load(&bad).is_err());
    assert_eq!(d.project(), before);
}
#[test]
fn fill_respects_visible_boundaries_and_is_a_compact_undoable_vector() {
    let mut d = doc();
    d.load(&json!([{"path":"M20 20H108V108H20Z","color":"black","width":4}])).unwrap();
    d.command(json!({"op":"layer","action":"add"})).unwrap();
    d.command(json!({"op":"brush","color":"#00ff00"})).unwrap();
    d.command(json!({"op":"fill","x":64,"y":64,"tolerance":0})).unwrap();
    assert_eq!(pixel(&d, 64, 64), [0, 255, 0, 255]);
    assert_eq!(pixel(&d, 5, 5), [0, 0, 0, 0]);
    assert_eq!(pixel(&d, 20, 64), [0, 0, 0, 255]);
    let saved = d.project();
    let mut again = doc();
    again.load(&saved).unwrap();
    assert_eq!(again.raster.pixels, d.raster.pixels);
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(pixel(&d, 64, 64), [0, 0, 0, 0]);
    let mut blank = doc();
    blank.command(json!({"op":"fill","x":0,"y":0})).unwrap();
    assert!(blank.paths[0].data["path"].as_str().unwrap().len() < 80);
}
#[test]
fn shape_tools_preview_commit_cancel_and_picker_use_document_coordinates() {
    for tool in ["line", "rectangle", "ellipse"] {
        let mut d = doc();
        d.command(json!({"op":"brush","tool":tool,"color":"#123456","width":4,"filled":true}))
            .unwrap();
        d.touch(0, 20., 20., 1.);
        d.touch(1, 100., 100., 1.);
        assert!(d.shape.is_some());
        let g = d.shape.as_ref().unwrap();
        let s = tools::shape(g.start, g.end, &g.options).unwrap();
        d.raster.preview_shape(&s);
        assert!(d.raster.pixels.iter().any(|p| *p != 0));
        d.touch(3, 0., 0., 1.);
        assert!(d.raster.pixels.iter().all(|p| *p == 0));
        assert!(d.paths.is_empty());
        d.touch(0, 20., 20., 1.);
        d.touch(2, 100., 100., 1.);
        assert_eq!(d.paths.len(), 1);
        d.command(json!({"op":"brush","tool":"picker"})).unwrap();
        d.touch(0, 64., 64., 1.);
        assert_eq!(d.picked_color.as_deref(), Some("#123456"));
        assert_eq!(d.paths.len(), 1);
    }
}
#[test]
fn symmetry_does_not_create_holes_and_all_copies_undo_together() {
    let mut d = doc();
    d.command(json!({"op":"brush","color":"blue","width":30,"symmetry":"both"})).unwrap();
    d.touch(0, 64., 64., 1.);
    d.touch(2, 64., 64., 1.);
    assert_eq!(pixel(&d, 64, 64), [0, 0, 255, 255]);
    assert_eq!(d.paths.len(), 1);
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(pixel(&d, 64, 64), [0, 0, 0, 0]);
    d.touch(0, 20., 20., 1.);
    d.touch(2, 30., 30., 1.);
    for (x, y) in [(25, 25), (103, 25), (25, 103), (103, 103)] {
        assert_eq!(pixel(&d, x, y), [0, 0, 255, 255]);
    }
    let saved = d.project();
    let mut again = doc();
    again.load(&saved).unwrap();
    assert_eq!(again.raster.pixels, d.raster.pixels);
}
#[test]
fn svg_export_is_self_contained_and_keeps_layer_erasing_and_visibility() {
    let mut d = doc();
    run(&mut d, "NEON");
    d.command(json!({"op":"brush","isEraser":true})).unwrap();
    d.touch(0, 50., 20., 1.);
    d.touch(2, 50., 20., 1.);
    let svg = d.svg();
    assert!(svg.starts_with("<svg xmlns="));
    assert!(svg.contains("<mask id=\"erase1\""));
    assert!(svg.contains("mask=\"url(#erase1)\""));
    assert_eq!(svg.matches("<g").count(), svg.matches("</g>").count());
    d.command(json!({"op":"layer","action":"update","visible":false})).unwrap();
    let svg = d.svg();
    assert!(!svg.contains("<g"));
}
#[test]
fn soft_eraser_opacity_matches_live_preview_and_final_raster() {
    let mut d = doc();
    d.load(&json!([{"path":"M0 0H128V128H0Z","color":"red","width":1,"style":"fill"}]))
        .unwrap();
    d.command(json!({"op":"brush","isEraser":true,"color":"black","width":20,"opacity":0.5}))
        .unwrap();
    d.touch(0, 64., 64., 1.);
    d.raster.preview(d.live.as_mut().unwrap());
    let preview = pixel(&d, 64, 64);
    d.touch(2, 64., 64., 1.);
    let p = pixel(&d, 64, 64);
    assert!((126..=129).contains(&p[3]), "{p:?}");
    assert!(preview.iter().zip(p).all(|(a, b)| (*a as i16 - b as i16).abs() <= 1));
}
#[test]
fn native_change_stream_never_emits_for_drawing_samples_and_idle_checkpoints_are_atomic() {
    let mut d = doc();
    assert!(d.take_event().is_some());
    assert!(d.take_event().is_none());
    d.touch(0, 20., 20., 1.);
    assert_eq!(d.take_event().unwrap()["isDrawing"], true);
    let revision = d.revision;
    for i in 0..50 {
        d.touch(1, 20. + i as f32, 30., 1.);
        assert!(d.take_event().is_none());
    }
    assert!(d.command(json!({"op":"draft","afterRevision":-1})).unwrap().is_null());
    assert!(d.live.is_some());
    assert_eq!(d.revision, revision);
    d.touch(2, 80., 30., 1.);
    assert_eq!(d.take_event().unwrap()["count"], 1);
    assert!(d.take_event().is_none());
    let draft = d.command(json!({"op":"draft","afterRevision":-1})).unwrap();
    assert_eq!(draft["revision"], d.revision);
    assert_eq!(serde_json::from_str::<Value>(draft["project"].as_str().unwrap()).unwrap(), d.project());
    assert!(d.command(json!({"op":"draft","afterRevision":d.revision})).unwrap().is_null());
}
#[test]
fn saving_locks_native_input_without_losing_a_partial_stroke() {
    let mut d = doc();
    d.touch(0, 20., 20., 1.);
    d.touch(1, 80., 40., 1.);
    d.command(json!({"op":"editing","enabled":false})).unwrap();
    assert_eq!(d.paths.len(), 1);
    let before = d.project();
    d.touch(0, 20., 100., 1.);
    d.touch(2, 100., 100., 1.);
    assert_eq!(d.project(), before);
    assert!(d.command(json!({"op":"undo"})).is_err());
    d.command(json!({"op":"editing","enabled":true})).unwrap();
    d.touch(0, 20., 100., 1.);
    d.touch(2, 100., 100., 1.);
    assert_eq!(d.paths.len(), 2);
}
#[test]
fn historical_clear_opacity_remains_opaque_and_svg_glow_is_isolated_per_layer() {
    let mut d = doc();
    let paths = json!([
        {"path":"M0 0H128V128H0Z","color":"red","width":1,"style":"fill"},
        {"path":"M10 64H118","color":"black","width":20,"isEraser":true,"opacity":0.2}
    ]);
    d.load(&paths).unwrap();
    assert_eq!(pixel(&d, 64, 64), [0, 0, 0, 0]);
    assert_eq!(d.command(json!({"op":"paths"})).unwrap(), paths);
    run(&mut d, "NEON");
    let svg = d.svg();
    assert!(svg.contains("mix-blend-mode:screen"));
    assert!(svg.contains("isolation:isolate"));
}
#[test]
fn all_twenty_shapes_support_drag_directions_fill_history_and_svg_roundtrip() {
    assert_eq!(tools::SHAPES.len(), 20);
    for &(kind, _) in tools::SHAPES {
        for filled in [false, true] {
            for (sx, sy, ex, ey) in [
                (20., 20., 100., 90.),
                (100., 20., 20., 90.),
                (20., 100., 90., 20.),
                (100., 100., 20., 20.),
            ] {
                let mut d = doc();
                d.command(json!({"op":"brush","tool":kind,"color":"#ee1133","width":3,"filled":filled}))
                    .unwrap();
                d.touch(0, sx, sy, 1.);
                d.touch(1, ex, ey, 1.);
                d.touch(2, ex, ey, 1.);
                assert_eq!(d.paths.len(), 1, "{kind}");
                let pixels = d.raster.pixels.clone();
                assert!(pixels.chunks_exact(4).any(|p| p[3] > 0), "invisible {kind}");
                let saved = d.command(json!({"op":"paths"})).unwrap();
                let mut restored = doc();
                restored.load(&saved).unwrap();
                assert_eq!(restored.raster.pixels, pixels, "{kind} changed on reopening");
                d.command(json!({"op":"undo"})).unwrap();
                assert!(d.paths.is_empty());
                d.command(json!({"op":"redo"})).unwrap();
                assert_eq!(d.raster.pixels, pixels);
            }
        }
    }
}
#[test]
fn shape_catalog_uses_native_geometry_and_rejects_unknown_kinds() {
    let catalog = tools::catalog();
    let entries = catalog.as_array().unwrap();
    assert_eq!(entries.len(), 20);
    let mut ids = std::collections::HashSet::new();
    for entry in entries {
        assert!(ids.insert(entry["kind"].as_str().unwrap()));
        for field in ["path", "filledPath"] {
            assert!(!path::parse_svg(entry[field].as_str().unwrap()).unwrap().ops.is_empty());
        }
        assert!(!entry["name"].as_str().unwrap().is_empty());
    }
    let mut d = doc();
    assert!(d.command(json!({"op":"shape","kind":"unsupported"})).is_err());
    assert!(d.paths.is_empty());
    assert_eq!(d.command(json!({"op":"shapes"})).unwrap(), catalog);
}
#[test]
fn squares_and_circles_keep_equal_sides_with_non_square_drag_bounds() {
    for kind in ["square", "circle"] {
        let mut d = doc();
        d.command(json!({"op":"shape","kind":kind,"x":20,"y":20,"endX":40,"endY":100,"filled":true}))
            .unwrap();
        let mut min = [128usize; 2];
        let mut max = [0usize; 2];
        for y in 0..128 {
            for x in 0..128 {
                if pixel(&d, x, y)[3] > 0 {
                    min[0] = min[0].min(x);
                    min[1] = min[1].min(y);
                    max[0] = max[0].max(x);
                    max[1] = max[1].max(y);
                }
            }
        }
        assert_eq!(max[0] - min[0], max[1] - min[1], "{kind}");
    }
}

#[test]
fn controls_are_owned_by_each_document_and_do_not_change_art_revisions() {
    let mut a = doc();
    let b = doc();
    a.take_event();
    let state = a.command(json!({"op":"controls","width":17,"color":"red"})).unwrap();
    assert_eq!(state["controls"]["width"], 17.);
    assert_eq!(state["revision"], 0);
    assert_eq!(b.summary()["controls"]["width"], 3.);
    assert!(a.take_event().is_some());
    assert!(a.take_event().is_none());
    a.command(json!({"op":"controls","width":17})).unwrap();
    assert!(a.take_event().is_none());
}
#[test]
fn native_brush_presets_retain_size_and_apply_opacity_even_when_reselected() {
    let mut d = doc();
    d.command(json!({"op":"controls","width":17})).unwrap();
    for (brush, opacity) in [
        ("NORMAL", 1.),
        ("MARKER", 0.75),
        ("PENCIL", 0.7),
        ("CALLIGRAPHY", 1.),
        ("WATERCOLOR", 0.45),
        ("NEON", 0.9),
        ("CRAYON", 0.85),
        ("SPRINKLING", 1.),
    ] {
        let state = d.command(json!({"op":"controls","brushType":brush})).unwrap();
        assert_eq!(state["controls"]["width"], 17.);
        assert!((state["controls"]["opacity"].as_f64().unwrap() - opacity).abs() < 1e-6);
        assert_eq!(state["controls"]["tool"], "brush");
    }
    d.command(json!({"op":"controls","brushType":"PENCIL","opacity":0.2})).unwrap();
    d.command(json!({"op":"controls","brushType":"PENCIL"})).unwrap();
    assert!((d.controls.opacity - 0.7).abs() < 1e-6);
}
#[test]
fn native_move_rejects_paint_and_color_resumes_brush_while_preserving_shapes() {
    let mut d = doc();
    d.command(json!({"op":"controls","tool":"move"})).unwrap();
    d.touch(0, 10., 10., 1.);
    d.touch(2, 60., 60., 1.);
    assert_eq!(d.summary()["count"], 0);
    d.command(json!({"op":"controls","color":"red"})).unwrap();
    d.touch(0, 10., 10., 1.);
    d.touch(2, 60., 60., 1.);
    assert_eq!(d.summary()["count"], 1);
    d.command(json!({"op":"controls","shape":"heart","filled":true})).unwrap();
    d.command(json!({"op":"controls","color":"blue"})).unwrap();
    d.touch(0, 20., 20., 1.);
    d.touch(2, 100., 100., 1.);
    assert_eq!(d.controls.tool, "shape");
    assert_eq!(d.paths[1].data["color"], "blue");
    assert_eq!(d.paths[1].data["style"], "fill");
}
#[test]
fn native_eraser_preserves_preset_but_renders_full_opacity_at_selected_width() {
    let mut d = doc();
    d.command(json!({"op":"controls","brushType":"WATERCOLOR","tool":"eraser","width":19}))
        .unwrap();
    assert_eq!(d.controls.brush_type, "WATERCOLOR");
    assert_eq!(d.brush["brushType"], "NORMAL");
    assert_eq!(d.brush["opacity"], 1.);
    assert_eq!(d.brush["isEraser"], true);
    d.command(json!({"op":"controls","width":21})).unwrap();
    assert_eq!(d.controls.tool, "eraser");
    d.command(json!({"op":"controls","tool":"brush"})).unwrap();
    assert_eq!(d.brush["brushType"], "WATERCOLOR");
    assert_eq!(d.brush["width"], 21.);
}
#[test]
fn invalid_native_control_changes_are_atomic_even_during_a_stroke() {
    let mut d = doc();
    d.touch(0, 10., 10., 1.);
    let before = d.summary();
    for patch in [
        json!({"op":"controls","color":"invalid"}),
        json!({"op":"controls","width":null}),
        json!({"op":"controls","shape":"unknown"}),
        json!({"op":"controls","brushType":"unknown"}),
        json!({"op":"controls","width":20,"unexpected":true}),
    ] {
        assert!(d.command(patch).is_err());
        assert_eq!(d.summary(), before);
    }
    let state = d.command(json!({"op":"controls","width":500})).unwrap();
    assert_eq!(state["controls"]["width"], 40.);
    assert_eq!(state["count"], 1);
}
#[test]
fn native_control_reset_preserves_artwork_and_undo_history() {
    let mut d = doc();
    run(&mut d, "PENCIL");
    d.command(json!({"op":"controls","width":27,"shape":"star"})).unwrap();
    d.command(json!({"op":"clear"})).unwrap();
    d.command(json!({"op":"controls","reset":true})).unwrap();
    assert_eq!(d.controls.width, 3.);
    assert_eq!(d.controls.tool, "brush");
    assert_eq!(d.controls.color, "#3b82f6");
    d.command(json!({"op":"undo"})).unwrap();
    assert_eq!(d.summary()["count"], 1);
}
#[test]
fn legacy_brush_commands_keep_native_controls_in_sync() {
    let mut d = doc();
    d.command(json!({"op":"brush","tool":"cloud","color":"red","width":12,"filled":true}))
        .unwrap();
    let controls = d.summary()["controls"].clone();
    assert_eq!(controls["tool"], "shape");
    assert_eq!(controls["shape"], "cloud");
    assert_eq!(controls["color"], "red");
    d.command(json!({"op":"controls","color":"blue"})).unwrap();
    assert_eq!(d.brush["tool"], "cloud");
}
#[test]
fn game_texture_mirrors_pixels_as_straight_alpha_and_tracks_live_strokes() {
    let mut d = doc();
    d.command(json!({"op":"brush","brushType":"NORMAL","color":"#ff0000","width":10.,"opacity":0.5}))
        .unwrap();
    let info = d.command(json!({"op":"texture"})).unwrap();
    let id = info["id"].as_u64().unwrap() as u32;
    assert_eq!(info["width"], 128);
    assert!(crate::assets::texture::is_dynamic(id));
    assert_eq!(d.command(json!({"op":"texture"})).unwrap()["id"], id, "one texture per document");
    // Initial upload: whole transparent image.
    let (rect, pixels) = crate::assets::texture::take_dynamic(id, false).unwrap();
    assert_eq!(rect, [0, 0, 128, 128]);
    assert!(pixels.iter().all(|&b| b == 0));
    // A live stroke reaches the texture before the finger lifts.
    d.command(json!({"op":"touch","space":"document","phase":0,"x":20,"y":64})).unwrap();
    d.command(json!({"op":"touch","space":"document","phase":1,"x":60,"y":64})).unwrap();
    d.sync_texture();
    let (rect, pixels) = crate::assets::texture::take_dynamic(id, false).expect("live stroke uploaded");
    assert!(rect[2] < 128 && rect[3] < 128, "only the changed region: {rect:?}");
    let inked = pixels.chunks_exact(4).find(|p| p[3] > 0).unwrap();
    assert!(inked[0] > 240 && inked[1] < 10, "straight alpha keeps full red: {inked:?}");
    assert!(
        crate::assets::texture::take_dynamic(id, false).is_none(),
        "nothing pending until it changes"
    );
    d.sync_texture();
    assert!(
        crate::assets::texture::take_dynamic(id, false).is_none(),
        "unchanged documents upload nothing"
    );
    drop(d);
    assert!(!crate::assets::texture::is_dynamic(id), "disposal frees the texture");
}
#[test]
fn document_space_input_ignores_the_canvas_view() {
    let mut d = doc();
    d.transform(30., -10., 3.);
    d.command(json!({"op":"touch","space":"document","phase":0,"x":10,"y":10})).unwrap();
    d.command(json!({"op":"touch","space":"document","phase":2,"x":50,"y":10})).unwrap();
    let strokes = d.command(json!({"op":"strokes"})).unwrap();
    let bounds = strokes[0]["bounds"].as_array().unwrap();
    let x = bounds[0].as_f64().unwrap();
    assert!((3. ..10.).contains(&x), "starts at document x=10 minus the brush radius: {x}");
}
#[test]
fn strokes_expose_centrelines_outlines_and_incremental_reads() {
    let mut d = doc();
    d.command(json!({"op":"brush","brushType":"NORMAL","color":"#2468cc","width":6.,"opacity":1,"smoothing":0,"symmetry":"vertical"}))
        .unwrap();
    d.touch_document(0, 10., 30., 1.);
    for i in 1..=10 {
        d.touch_document(1, 10. + i as f32 * 4., 30., 1.);
    }
    assert_eq!(
        d.strokes(&json!({})).as_array().unwrap().len(),
        0,
        "a stroke under the finger is not reported"
    );
    assert!(d.live.is_some(), "reading strokes never finishes a live gesture");
    d.touch_document(2, 50., 30., 1.);
    d.touch_document(0, 20., 80., 1.);
    d.touch_document(2, 30., 80., 1.);
    let all = d.strokes(&json!({}));
    let first = &all[0];
    assert_eq!(first["style"], "fill");
    let lines = first["lines"].as_array().unwrap();
    assert_eq!(lines.len(), 2, "symmetry mirrors the centreline");
    let line: Vec<f64> = lines[0].as_array().unwrap().iter().map(|v| v.as_f64().unwrap()).collect();
    assert_eq!((line[0], line[1]), (10., 30.));
    assert!((line[line.len() - 2] - 50.).abs() < 0.01);
    let mirrored: Vec<f64> = lines[1].as_array().unwrap().iter().map(|v| v.as_f64().unwrap()).collect();
    assert!((mirrored[0] - 118.).abs() < 0.01, "mirrored across x = 64");
    assert!(first["outline"].as_array().unwrap().iter().all(|c| c["closed"] == true));
    assert_eq!(d.strokes(&json!({"from":1})).as_array().unwrap().len(), 1);
    assert_eq!(d.strokes(&json!({"from":1}))[0]["index"], 1);
    // Loaded strokes have no recorded gesture; their painted path is still available.
    let mut loaded = doc();
    loaded.command(json!({"op":"load","paths":[path("M0 0 L100 0","#000000")]})).unwrap();
    let s = loaded.strokes(&json!({}));
    assert_eq!(s[0]["lines"].as_array().unwrap().len(), 0);
    assert_eq!(s[0]["outline"][0]["points"], json!([0., 0., 100., 0.]));
    assert_eq!(s[0]["outline"][0]["closed"], false);
}
#[test]
fn sample_and_coverage_score_painted_areas() {
    let mut d = doc();
    d.command(json!({"op":"load","paths":[{"path":"M0 0 H64 V128 H0 Z","color":"#00ff00","style":"fill","width":0}]}))
        .unwrap();
    let inside = d.sample(10., 10.);
    assert_eq!(inside["color"], "#00ff00");
    assert_eq!(inside["alpha"], 1.);
    assert_eq!(d.sample(100., 10.)["alpha"], 0.);
    assert!(d.sample(-1., 10.).is_null());
    let half = d.coverage(&json!({}));
    assert!((half - 0.5).abs() < 0.02, "{half}");
    assert!(d.coverage(&json!({"x":0,"y":0,"width":64,"height":128})) > 0.98);
    assert_eq!(d.coverage(&json!({"x":70,"y":0,"width":50,"height":50})), 0.);
    assert_eq!(d.coverage(&json!({"x":500,"y":0,"width":10,"height":10})), 0.);
}
