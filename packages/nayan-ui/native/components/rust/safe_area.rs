//! Platform-neutral safe-area geometry and edge policy. The OS supplies measurements in points.
use serde_json::{Value, json};

const SIDES: [&str; 4] = ["top", "right", "bottom", "left"];
fn number(v: &Value) -> f64 {
    v.as_f64().filter(|v| v.is_finite()).unwrap_or(0.)
}
fn positive(v: &Value) -> f64 {
    number(v).max(0.)
}

pub fn apply(base: f64, inset: f64, mode: &str) -> f64 {
    let base = if base.is_finite() { base } else { 0. };
    let inset = if inset.is_finite() { inset.max(0.) } else { 0. };
    match mode {
        "maximum" => base.max(inset),
        "off" => base,
        _ => base + inset,
    }
}
pub fn edge_mode<'a>(edges: &'a Value, side: &str) -> &'a str {
    if edges.is_null() {
        return "additive";
    }
    if let Some(edges) = edges.as_array() {
        return if edges.iter().any(|edge| edge.as_str() == Some(side)) {
            "additive"
        } else {
            "off"
        };
    }
    match edges[side].as_str() {
        Some("maximum") => "maximum",
        Some("additive") => "additive",
        _ => "off",
    }
}
pub fn request(v: &Value) -> Result<Value, &'static str> {
    match v["action"].as_str() {
        Some("resolve") => Ok(Value::Object(
            SIDES
                .into_iter()
                .map(|side| {
                    (
                        side.into(),
                        json!(apply(
                            number(&v["base"][side]),
                            positive(&v["insets"][side]),
                            edge_mode(&v["edges"], side)
                        )),
                    )
                })
                .collect(),
        )),
        Some("normalize" | "measure") => {
            let frame = &v["frame"];
            let (x, y, w, h) = (
                number(&frame["x"]),
                number(&frame["y"]),
                positive(&frame["width"]),
                positive(&frame["height"]),
            );
            let mut insets = v["insets"].clone();
            if v["action"] == "measure" {
                let window = &v["window"];
                insets = json!({
                    "top":(positive(&window["insets"]["top"])-y).max(0.),
                    "left":(positive(&window["insets"]["left"])-x).max(0.),
                    "bottom":(y+h-(positive(&window["height"])-positive(&window["insets"]["bottom"]))).max(0.),
                    "right":(x+w-(positive(&window["width"])-positive(&window["insets"]["right"]))).max(0.)
                });
            }
            Ok(json!({"frame":{"x":x,"y":y,"width":w,"height":h},"insets":{
                "top":positive(&insets["top"]).min(h),"right":positive(&insets["right"]).min(w),
                "bottom":positive(&insets["bottom"]).min(h),"left":positive(&insets["left"]).min(w)
            }}))
        }
        _ => Err("Unknown safe-area operation"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn edges_add_maximum_or_preserve_spacing() {
        assert_eq!(apply(12., 34., "additive"), 46.);
        assert_eq!(apply(48., 34., "maximum"), 48.);
        assert_eq!(apply(12., 34., "maximum"), 34.);
        assert_eq!(apply(-4., 34., "off"), -4.);
        assert_eq!(apply(f64::NAN, f64::INFINITY, "additive"), 0.);
    }
    #[test]
    fn edges_arrays_and_objects_disable_omitted_sides() {
        let v =
            request(&json!({"action":"resolve","insets":{"top":62,"bottom":34},"base":{"top":8,"bottom":50},"edges":{"bottom":"maximum"}})).unwrap();
        assert_eq!(v, json!({"top":8.,"bottom":50.,"left":0.,"right":0.}));
        assert_eq!(edge_mode(&json!(["top"]), "bottom"), "off");
        assert_eq!(edge_mode(&Value::Null, "bottom"), "additive");
    }
    #[test]
    fn nested_provider_uses_only_the_window_edges_it_overlaps() {
        let window = json!({"width":400,"height":800,"insets":{"top":24,"bottom":34,"left":12,"right":10}});
        let v = request(&json!({"action":"measure","window":window,"frame":{"x":0,"y":80,"width":400,"height":720}})).unwrap();
        assert_eq!(v["insets"], json!({"top":0.,"bottom":34.,"left":12.,"right":10.}));
        let v = request(&json!({"action":"measure","window":window,"frame":{"x":20,"y":80,"width":360,"height":600}})).unwrap();
        assert_eq!(v["insets"], json!({"top":0.,"bottom":0.,"left":0.,"right":0.}));
    }
    #[test]
    fn geometry_is_bounded_and_negative_insets_never_escape() {
        let v = request(&json!({"action":"normalize","frame":{"width":200,"height":100},"insets":{"top":300,"bottom":-8,"left":900}})).unwrap();
        assert_eq!(v["insets"], json!({"top":100.,"bottom":0.,"left":200.,"right":0.}));
    }
    #[test]
    fn rotation_uses_the_new_frame_and_landscape_cutouts() {
        let v=request(&json!({"action":"measure","window":{"width":800,"height":400,"insets":{"left":62,"right":62,"bottom":21}},"frame":{"width":800,"height":400}})).unwrap();
        assert_eq!(v["insets"], json!({"top":0.,"bottom":21.,"left":62.,"right":62.}));
    }
}
