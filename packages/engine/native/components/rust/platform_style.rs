//! Resolve the shared Rust utilities for Fabric views outside a GPU UI surface.
use super::*;

fn color(value: Color32) -> Value {
    let [r, g, b, a] = value.to_srgba_unmultiplied();
    json!(format!("rgba({r},{g},{b},{})", a as f32 / 255.))
}

/// Native Yoga must resolve percentages against the parent, rather than the window viewport.
fn dimension(value: &str, available: f32) -> Option<Value> {
    match value {
        "full" => return Some(json!("100%")),
        "auto" => return Some(json!("auto")),
        "screen" => return Some(json!(available)),
        "px" => return Some(json!(1)),
        _ => {}
    }
    if let Some(value) = value.strip_prefix('[').and_then(|v| v.strip_suffix(']')) {
        if let Some(percent) = value.strip_suffix('%') {
            return percent.parse::<f32>().ok().filter(|v| v.is_finite()).map(|_| json!(value));
        }
        let (value, scale) = value.strip_suffix("rem").map_or((value.trim_end_matches("px"), 1.), |v| (v, 16.));
        return value.parse::<f32>().ok().filter(|v| v.is_finite()).map(|v| json!(v * scale));
    }
    if let Some((a, b)) = value.split_once('/') {
        let (a, b) = (a.parse::<f32>().ok()?, b.parse::<f32>().ok()?);
        return (a.is_finite() && b.is_finite() && b > 0.).then(|| json!(format!("{}%", a / b * 100.)));
    }
    value.parse::<f32>().ok().filter(|v| v.is_finite()).map(|v| json!(v * 4.))
}

pub(crate) fn resolve(value: &Value) -> Result<Value, String> {
    let kind = value["kind"].as_str().unwrap_or("NView");
    if !matches!(kind, "NView" | "NText" | "NPress" | "NIcon" | "NImage") {
        return Err("Unsupported native style kind".into());
    }
    let class_name = value["className"].as_str().unwrap_or("");
    if class_name.len() > 65536 {
        return Err("Native class list exceeds 64 KiB".into());
    }
    let extent = |key: &str| value[key].as_f64().filter(|v| v.is_finite()).unwrap_or(0.).clamp(0., 1_000_000.) as f32;
    let available = Vec2::new(extent("width"), extent("height"));
    let palette = theme::Palette::configure(&theme::Palette::platform(false, true), &value["theme"], value["dark"] == true);
    let state = &value["state"];
    let conditions = style::Conditions {
        dark: palette.dark,
        disabled: state["disabled"] == true,
        active: state["pressed"] == true,
        hovered: state["hovered"] == true,
        focused: state["focused"] == true,
        viewport: available.x,
    };
    let defaults = palette.components.get(kind);
    let classes = format!("{} {class_name}", defaults.and_then(|v| v["className"].as_str()).unwrap_or(""));
    let mut tokens: Vec<_> = classes.split_whitespace().collect();
    tokens.sort_by_key(|s| s.split('[').next().unwrap_or(s).matches(':').count());
    let active: Vec<_> = tokens.into_iter().filter_map(|token| style::variant(token, conditions)).collect();
    let style = style::Style::resolve(kind, &json!({"className":class_name}), &palette, conditions, available);
    let mut result = json!({
        "display":if style.hidden {"none"} else {"flex"},
        "flexDirection":if style.horizontal {"row"} else {"column"},
        "flexGrow":style.grow,
        "flexWrap":if style.wrap {"wrap"} else {"nowrap"},
        "justifyContent":if style.justify_between {"space-between"} else {match style.justify {egui::Align::Center=>"center",egui::Align::Max=>"flex-end",_=>"flex-start"}},
        "alignItems":if style.stretch || !active.iter().any(|v| v.starts_with("items-")) {"stretch"} else {match style.align {egui::Align::Center=>"center",egui::Align::Max=>"flex-end",_=>"flex-start"}},
        "borderRadius":style.radius,"borderWidth":style.border_width,"opacity":style.opacity,
        "paddingTop":style.padding.top,"paddingRight":style.padding.right,"paddingBottom":style.padding.bottom,"paddingLeft":style.padding.left,
        "marginTop":style.margin.top,"marginRight":style.margin.right,"marginBottom":style.margin.bottom,"marginLeft":style.margin.left,
    });
    for (key, value) in [
        ("width", style.width),
        ("height", style.height),
        ("minWidth", style.min_width),
        ("maxWidth", style.max_width),
        ("minHeight", style.min_height),
        ("maxHeight", style.max_height),
        ("aspectRatio", style.aspect_ratio),
        ("fontSize", style.text_size),
    ] {
        if let Some(value) = value {
            result[key] = json!(value);
        }
    }
    for (key, value) in [
        ("color", style.foreground),
        ("backgroundColor", style.background),
        ("borderColor", style.border),
    ] {
        if let Some(value) = value {
            result[key] = color(value);
        }
    }
    for (key, value) in [
        "borderTopLeftRadius",
        "borderTopRightRadius",
        "borderBottomLeftRadius",
        "borderBottomRightRadius",
    ]
    .into_iter()
    .zip(style.corners)
    {
        if let Some(value) = value {
            result[key] = json!(value);
        }
    }
    if let Some(value) = style.gap {
        result["columnGap"] = json!(value.x);
        result["rowGap"] = json!(value.y);
    }
    if let Some(value) = style.weight {
        result["fontWeight"] = json!(value.to_string());
    }
    if style.monospace {
        result["fontFamily"] = json!("monospace");
    }
    if let Some(transform) = style.text_transform {
        result["textTransform"] = json!(transform.name());
    }
    if let Some(value) = style.line_height {
        result["lineHeight"] = json!(value.points(style.text_size.unwrap_or(16.)));
    }
    if let Some(value) = style.tracking {
        result["letterSpacing"] = json!(value.points(style.text_size.unwrap_or(16.)));
    }
    if let Some(value) = style.text_align {
        result["textAlign"] = json!(match value {
            egui::Align::Center => "center",
            egui::Align::Max => "right",
            _ => "left",
        });
    }
    if style.absolute {
        result["position"] = json!("absolute");
    }
    for (key, value) in ["top", "right", "bottom", "left"].into_iter().zip(style.inset) {
        if let Some(value) = value {
            result[key] = json!(value);
        }
    }
    for class in active {
        match class {
            "flex-1" => {
                result["flex"] = json!(1);
                result["flexShrink"] = json!(1);
                result["flexBasis"] = json!(0);
            }
            "flex-auto" => {
                result.as_object_mut().unwrap().remove("flex");
                result["flexShrink"] = json!(1);
                result["flexBasis"] = json!("auto");
            }
            "flex-none" => {
                result.as_object_mut().unwrap().remove("flex");
                result["flexShrink"] = json!(0);
                result["flexBasis"] = json!("auto");
            }
            "shrink" | "flex-shrink" => result["flexShrink"] = json!(1),
            "shrink-0" | "flex-shrink-0" => result["flexShrink"] = json!(0),
            "overflow-hidden" => result["overflow"] = json!("hidden"),
            "overflow-visible" => result["overflow"] = json!("visible"),
            "relative" => result["position"] = json!("relative"),
            "self-start" => result["alignSelf"] = json!("flex-start"),
            "self-end" => result["alignSelf"] = json!("flex-end"),
            "self-center" => result["alignSelf"] = json!("center"),
            "self-stretch" => result["alignSelf"] = json!("stretch"),
            "self-auto" => result["alignSelf"] = json!("auto"),
            "shadow-none" => result["boxShadow"] = json!("none"),
            _ => {}
        }
        for (prefix, key, extent) in [
            ("min-w-", "minWidth", available.x),
            ("max-w-", "maxWidth", available.x),
            ("min-h-", "minHeight", available.y),
            ("max-h-", "maxHeight", available.y),
            ("w-", "width", available.x),
            ("h-", "height", available.y),
        ] {
            if let Some(value) = class.strip_prefix(prefix).and_then(|v| dimension(v, extent)) {
                result[key] = value;
            }
        }
        for (prefix, keys) in [
            ("border-t", &["borderTopWidth"][..]),
            ("border-r", &["borderRightWidth"][..]),
            ("border-b", &["borderBottomWidth"][..]),
            ("border-l", &["borderLeftWidth"][..]),
            ("border-x", &["borderLeftWidth", "borderRightWidth"][..]),
            ("border-y", &["borderTopWidth", "borderBottomWidth"][..]),
        ] {
            let width = if class == prefix {
                Some(1.)
            } else {
                class
                    .strip_prefix(prefix)
                    .and_then(|v| v.strip_prefix('-'))
                    .and_then(|v| v.parse::<f32>().ok())
                    .filter(|v| v.is_finite())
                    .map(|v| v.clamp(0., 32.))
            };
            if let Some(width) = width {
                for key in keys {
                    result[*key] = json!(width);
                }
                if result["borderColor"].is_null() {
                    result["borderColor"] = color(palette.get("border"));
                }
            }
        }
        if let Some(value) = class
            .strip_prefix("z-")
            .map(|v| v.trim_start_matches('[').trim_end_matches(']'))
            .and_then(|v| v.parse::<i32>().ok())
        {
            result["zIndex"] = json!(value);
        }
    }
    // Theme style objects follow the same precedence as the surface resolver. Per-instance
    // styles are composed last by the native host, including registered RN style IDs.
    if let Some(defaults) = defaults.and_then(|v| v["style"].as_object()) {
        result.as_object_mut().unwrap().extend(defaults.clone());
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn native_layout_preserves_parent_percentages_stretch_and_flex_contracts() {
        let value = resolve(
            &json!({"kind":"NView","className":"flex-1 w-full items-stretch overflow-hidden border-t rounded-tr-[22px]","width":390,"height":844}),
        )
        .unwrap();
        assert_eq!(value["width"], "100%");
        assert_eq!(value["alignItems"], "stretch");
        assert_eq!(value["flex"], 1);
        assert_eq!(value["flexShrink"], 1);
        assert_eq!(value["flexBasis"], 0);
        assert_eq!(value["overflow"], "hidden");
        assert_eq!(value["borderTopWidth"], 1.);
        assert_eq!(value["borderTopRightRadius"], 22.);
    }
    #[test]
    fn theme_variants_components_and_pressed_states_share_the_rust_resolver() {
        let value=resolve(&json!({"kind":"NView","className":"bg-accent md:w-1/2 active:opacity-80","width":768,"state":{"pressed":true},"theme":{"theme":"dark","colors":{"accent":"#123456"},"components":{"NView":{"className":"items-center px-4"}}}})).unwrap();
        assert_eq!(value["width"], "50%");
        assert_eq!(value["paddingLeft"], 16.);
        assert_eq!(value["alignItems"], "center");
        assert_eq!(value["backgroundColor"], "rgba(18,52,86,1)");
        assert!((value["opacity"].as_f64().unwrap() - 0.8).abs() < 1e-6);
    }

    #[test]
    fn responsive_flex_settings_can_override_a_wrapped_and_growing_row() {
        let mut request = json!({"className":"flex-1 flex-wrap justify-between md:flex-none md:flex-nowrap md:justify-center","width":390});
        let small = resolve(&request).unwrap();
        assert_eq!(small["flexGrow"], 1.);
        assert_eq!(small["flexWrap"], "wrap");
        assert_eq!(small["justifyContent"], "space-between");

        request["width"] = json!(768);
        let wide = resolve(&request).unwrap();
        assert!(wide.get("flex").is_none());
        assert_eq!(wide["flexGrow"], 0.);
        assert_eq!(wide["flexShrink"], 0);
        assert_eq!(wide["flexBasis"], "auto");
        assert_eq!(wide["flexWrap"], "nowrap");
        assert_eq!(wide["justifyContent"], "center");

        request["className"] = json!("flex-1 grow-0 grow");
        assert_eq!(resolve(&request).unwrap()["flexGrow"], 1.);
    }

    #[test]
    fn native_text_resolves_large_and_custom_sizes_and_relative_typography() {
        let mut request =
            json!({"kind":"NText","className":"text-[1.125rem] leading-tight tracking-wide uppercase md:text-6xl md:normal-case","width":390});
        let small = resolve(&request).unwrap();
        assert_eq!(small["fontSize"], 18.);
        assert_eq!(small["lineHeight"], 22.5);
        assert_eq!(small["textTransform"], "uppercase");

        request["width"] = json!(768);
        let wide = resolve(&request).unwrap();
        assert_eq!(wide["fontSize"], 60.);
        assert_eq!(wide["lineHeight"], 75.);
        assert_eq!(wide["letterSpacing"], 1.5);
        assert_eq!(wide["textTransform"], "none");
    }
}
