//! Build-time utility CSS for engine browser hosts. No Tailwind compiler or GPU is required.
use serde_json::{Value, json};

fn arbitrary(value: &str) -> Option<String> {
    value.strip_prefix('[')?.strip_suffix(']').map(|s| s.replace('_', " "))
}
fn length(value: &str) -> Option<String> {
    if let Some(value) = arbitrary(value) {
        return Some(value);
    }
    Some(match value {
        "auto" | "min-content" | "max-content" | "fit-content" => value.into(),
        "full" => "100%".into(),
        "screen" => "100vh".into(),
        "dvh" => "100dvh".into(),
        "svh" => "100svh".into(),
        "lvh" => "100lvh".into(),
        "px" => "1px".into(),
        "min" => "min-content".into(),
        "max" => "max-content".into(),
        "fit" => "fit-content".into(),
        _ => {
            if let Some((a, b)) = value.split_once('/') {
                let a = a.parse::<f32>().ok()?;
                let b = b.parse::<f32>().ok()?;
                if !a.is_finite() || !b.is_finite() || b <= 0. {
                    return None;
                }
                format!("{}%", a / b * 100.)
            } else {
                let n = value.parse::<f32>().ok()?;
                if !n.is_finite() {
                    return None;
                }
                format!("{}px", n * 4.)
            }
        }
    })
}
fn color(value: &str) -> Option<String> {
    let (value, alpha) = value
        .rsplit_once('/')
        .filter(|(_, a)| a.parse::<f32>().is_ok())
        .map_or((value, None), |(v, a)| (v, a.parse::<f32>().ok()));
    let color = if let Some(c) = arbitrary(value) {
        c
    } else if value == "current" {
        "currentColor".into()
    } else if ["transparent", "black", "white", "inherit"].contains(&value) {
        value.into()
    } else if let Ok(i) = super::palette::COLORS.binary_search_by(|(name, _)| name.cmp(&value)) {
        let c = super::palette::COLORS[i].1;
        format!("#{:02x}{:02x}{:02x}", c[0], c[1], c[2])
    } else if value.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') && !value.is_empty() {
        format!("var(--{value})")
    } else {
        return None;
    };
    Some(alpha.map_or(color.clone(), |a| {
        format!("color-mix(in srgb,{color} {}%,transparent)", a.clamp(0., 100.))
    }))
}
fn radius(value: &str) -> Option<String> {
    Some(match value {
        "none" => "0px".into(),
        "xs" => "2px".into(),
        "sm" => "4px".into(),
        "md" => "6px".into(),
        "lg" => "8px".into(),
        "xl" => "12px".into(),
        "2xl" => "16px".into(),
        "3xl" => "24px".into(),
        "4xl" => "32px".into(),
        "full" => "9999px".into(),
        _ => arbitrary(value)?,
    })
}
fn declaration(property: &str, value: impl AsRef<str>) -> String {
    format!("{property}:{};", value.as_ref())
}
fn declarations(class: &str) -> Option<String> {
    let (negative, class) = class.strip_prefix('-').map_or((false, class), |s| (true, s));
    let signed = |value: String| if negative { format!("calc({value} * -1)") } else { value };
    let exact=match class {
        "block"|"inline"|"flex"|"grid"|"inline-flex"|"inline-grid"|"inline-block"|"contents"|"table"|"list-item" => Some(declaration("display",class)),
        "hidden"=>Some("display:none;".into()), "visible"=>Some("visibility:visible;".into()), "invisible"=>Some("visibility:hidden;".into()),
        "collapse"=>Some("visibility:collapse;".into()),
        "static"|"relative"|"absolute"|"fixed"|"sticky"=>Some(declaration("position",class)),
        "flex-row"=>Some("flex-direction:row;".into()), "flex-col"=>Some("flex-direction:column;".into()),
        "flex-row-reverse"=>Some("flex-direction:row-reverse;".into()), "flex-col-reverse"=>Some("flex-direction:column-reverse;".into()),
        "flex-wrap"=>Some("flex-wrap:wrap;".into()), "flex-nowrap"=>Some("flex-wrap:nowrap;".into()),
        "flex-1"=>Some("flex:1;".into()), "flex-auto"=>Some("flex:1 1 auto;".into()), "flex-none"=>Some("flex:none;".into()),
        "grow"|"flex-grow"=>Some("flex-grow:1;".into()), "grow-0"=>Some("flex-grow:0;".into()),
        "shrink"|"flex-shrink"=>Some("flex-shrink:1;".into()), "shrink-0"|"flex-shrink-0"=>Some("flex-shrink:0;".into()),
        "items-start"=>Some("align-items:flex-start;".into()), "items-end"=>Some("align-items:flex-end;".into()),
        "items-center"=>Some("align-items:center;".into()), "items-baseline"=>Some("align-items:baseline;".into()), "items-stretch"=>Some("align-items:stretch;".into()),
        "justify-start"=>Some("justify-content:flex-start;".into()), "justify-end"=>Some("justify-content:flex-end;".into()),
        "justify-center"=>Some("justify-content:center;".into()), "justify-between"=>Some("justify-content:space-between;".into()),
        "justify-around"=>Some("justify-content:space-around;".into()), "justify-evenly"=>Some("justify-content:space-evenly;".into()),
        "self-start"=>Some("align-self:flex-start;".into()), "self-center"=>Some("align-self:center;".into()), "self-stretch"=>Some("align-self:stretch;".into()),
        "justify-self-start"=>Some("justify-self:start;".into()), "isolate"=>Some("isolation:isolate;".into()),
        "italic"=>Some("font-style:italic;".into()), "not-italic"=>Some("font-style:normal;".into()),
        "uppercase"=>Some("text-transform:uppercase;".into()), "lowercase"=>Some("text-transform:lowercase;".into()), "capitalize"=>Some("text-transform:capitalize;".into()), "normal-case"=>Some("text-transform:none;".into()),
        "underline"=>Some("text-decoration-line:underline;".into()), "line-through"=>Some("text-decoration-line:line-through;".into()), "no-underline"=>Some("text-decoration-line:none;".into()),
        "truncate"=>Some("overflow:hidden;text-overflow:ellipsis;white-space:nowrap;".into()),
        "break-all"=>Some("word-break:break-all;".into()), "break-words"=>Some("overflow-wrap:break-word;".into()),
        "tabular-nums"=>Some("font-variant-numeric:tabular-nums;".into()),
        "list-disc"=>Some("list-style-type:disc;".into()), "list-decimal"=>Some("list-style-type:decimal;".into()), "list-none"=>Some("list-style-type:none;".into()),
        "list-inside"=>Some("list-style-position:inside;".into()), "list-outside"=>Some("list-style-position:outside;".into()), "mask-repeat"=>Some("mask-repeat:repeat;".into()),
        "border-collapse"=>Some("border-collapse:collapse;".into()), "border-separate"=>Some("border-collapse:separate;".into()),
        "antialiased"=>Some("-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;".into()),
        "sr-only"=>Some("position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;".into()),
        "not-sr-only"=>Some("position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip:auto;white-space:normal;".into()),
        "outline-none"=>Some("outline-style:none;".into()),
        "outline"=>Some("outline-style:solid;outline-width:1px;".into()),
        "rounded"=>Some("border-radius:4px;".into()),
        "border"=>Some("border-style:solid;border-width:1px;".into()),
        "bg-gradient-to-t"|"bg-linear-to-t"=>Some("background-image:linear-gradient(to top,var(--nayan-gradient-stops,var(--nayan-gradient-from,transparent),var(--nayan-gradient-to,transparent)));".into()),
        "bg-gradient-to-b"|"bg-linear-to-b"=>Some("background-image:linear-gradient(to bottom,var(--nayan-gradient-stops,var(--nayan-gradient-from,transparent),var(--nayan-gradient-to,transparent)));".into()),
        "bg-gradient-to-r"|"bg-linear-to-r"=>Some("background-image:linear-gradient(to right,var(--nayan-gradient-stops,var(--nayan-gradient-from,transparent),var(--nayan-gradient-to,transparent)));".into()),
        "animate-spin"=>Some("animation:nayan-spin 1s linear infinite;".into()),
        "transition"|"transition-all"=>Some("transition-property:all;transition-duration:150ms;transition-timing-function:cubic-bezier(.4,0,.2,1);".into()),
        "transition-colors"=>Some("transition-property:color,background-color,border-color,fill,stroke;transition-duration:150ms;".into()),
        "transition-opacity"=>Some("transition-property:opacity;transition-duration:150ms;".into()),
        "transition-shadow"=>Some("transition-property:box-shadow;transition-duration:150ms;".into()),
        "transition-transform"=>Some("transition-property:transform,translate,scale,rotate;transition-duration:150ms;".into()),
        "transform"|"scale-3d"|"filter"|"backdrop-filter"=>Some(String::new()),
        "grayscale"=>Some("filter:grayscale(1);".into()), "blur"=>Some("filter:blur(8px);".into()),
        "resize"=>Some("resize:both;".into()), "resize-none"=>Some("resize:none;".into()),
        "container"=>Some("width:100%;".into()),
        _=>None,
    };
    if exact.is_some() {
        return exact;
    }
    for (prefix, property) in [
        ("overflow-x-", "overflow-x"),
        ("overflow-y-", "overflow-y"),
        ("overflow-", "overflow"),
        ("object-", "object-fit"),
        ("pointer-events-", "pointer-events"),
        ("cursor-", "cursor"),
        ("whitespace-", "white-space"),
        ("text-wrap-", "text-wrap"),
    ] {
        if let Some(v) = class.strip_prefix(prefix) {
            if [
                "auto",
                "scroll",
                "hidden",
                "visible",
                "clip",
                "contain",
                "cover",
                "fill",
                "none",
                "all",
                "pointer",
                "not-allowed",
                "default",
                "normal",
                "nowrap",
                "pre",
                "pre-wrap",
                "pre-line",
                "wrap",
                "balance",
                "pretty",
            ]
            .contains(&v)
            {
                return Some(declaration(property, v));
            }
        }
    }
    if class == "text-wrap" {
        return Some("text-wrap:wrap;".into());
    }
    if let Some(flow) = class.strip_prefix("grid-flow-") {
        let flow = match flow {
            "row" | "dense" => flow,
            "col" => "column",
            "row-dense" => "row dense",
            "col-dense" => "column dense",
            _ => return None,
        };
        return Some(declaration("grid-auto-flow", flow));
    }
    for (prefix, property) in [("auto-cols-", "grid-auto-columns"), ("auto-rows-", "grid-auto-rows")] {
        if let Some(value) = class.strip_prefix(prefix) {
            let track = match value {
                "auto" => "auto".into(),
                "min" => "min-content".into(),
                "max" => "max-content".into(),
                "fr" => "minmax(0,1fr)".into(),
                _ => arbitrary(value)?,
            };
            return Some(declaration(property, track));
        }
    }
    for (prefix, property) in [("grid-cols-", "grid-template-columns"), ("grid-rows-", "grid-template-rows")] {
        if let Some(v) = class.strip_prefix(prefix) {
            return Some(declaration(
                property,
                if let Some(v) = arbitrary(v) {
                    v
                } else if v == "none" {
                    v.into()
                } else {
                    let n = v.parse::<u16>().ok()?;
                    if n > 128 || n == 0 {
                        return None;
                    }
                    format!("repeat({n},minmax(0,1fr))")
                },
            ));
        }
    }
    if let Some(v) = class.strip_prefix("columns-") {
        return Some(declaration("columns", v.parse::<u16>().ok()?.to_string()));
    }
    for (prefix, property) in [("col-span-", "grid-column"), ("row-span-", "grid-row")] {
        if let Some(v) = class.strip_prefix(prefix) {
            return Some(declaration(
                property,
                if v == "full" {
                    "1 / -1".into()
                } else {
                    format!("span {} / span {}", v.parse::<u16>().ok()?, v)
                },
            ));
        }
    }
    for (prefix, properties) in [
        ("inset-x-", &["left", "right"][..]),
        ("inset-y-", &["top", "bottom"][..]),
        ("inset-", &["top", "right", "bottom", "left"][..]),
        ("top-", &["top"][..]),
        ("right-", &["right"][..]),
        ("bottom-", &["bottom"][..]),
        ("left-", &["left"][..]),
        ("px-", &["padding-left", "padding-right"][..]),
        ("py-", &["padding-top", "padding-bottom"][..]),
        ("pt-", &["padding-top"][..]),
        ("pr-", &["padding-right"][..]),
        ("pb-", &["padding-bottom"][..]),
        ("pl-", &["padding-left"][..]),
        ("p-", &["padding"][..]),
        ("mx-", &["margin-left", "margin-right"][..]),
        ("my-", &["margin-top", "margin-bottom"][..]),
        ("mt-", &["margin-top"][..]),
        ("mr-", &["margin-right"][..]),
        ("mb-", &["margin-bottom"][..]),
        ("ml-", &["margin-left"][..]),
        ("m-", &["margin"][..]),
        ("gap-x-", &["column-gap"][..]),
        ("gap-y-", &["row-gap"][..]),
        ("gap-", &["gap"][..]),
        ("min-w-", &["min-width"][..]),
        ("max-w-", &["max-width"][..]),
        ("min-h-", &["min-height"][..]),
        ("max-h-", &["max-height"][..]),
        ("w-", &["width"][..]),
        ("h-", &["height"][..]),
        ("size-", &["width", "height"][..]),
    ] {
        if let Some(v) = class.strip_prefix(prefix) {
            let value = if prefix == "max-w-" {
                match v {
                    "none" => Some("none".into()),
                    "xs" => Some("320px".into()),
                    "sm" => Some("384px".into()),
                    "md" => Some("448px".into()),
                    "lg" => Some("512px".into()),
                    "xl" => Some("576px".into()),
                    "2xl" => Some("672px".into()),
                    "3xl" => Some("768px".into()),
                    "4xl" => Some("896px".into()),
                    "5xl" => Some("1024px".into()),
                    "6xl" => Some("1152px".into()),
                    "7xl" => Some("1280px".into()),
                    _ => length(v),
                }
            } else if v == "screen" && prefix.ends_with("w-") {
                Some("100vw".into())
            } else {
                length(v)
            }?;
            return Some(properties.iter().map(|p| declaration(p, signed(value.clone()))).collect());
        }
    }
    if let Some(v) = class.strip_prefix("rounded-") {
        for (prefix, properties) in [
            ("tl-", &["border-top-left-radius"][..]),
            ("tr-", &["border-top-right-radius"][..]),
            ("bl-", &["border-bottom-left-radius"][..]),
            ("br-", &["border-bottom-right-radius"][..]),
            ("t-", &["border-top-left-radius", "border-top-right-radius"][..]),
            ("b-", &["border-bottom-left-radius", "border-bottom-right-radius"][..]),
            ("l-", &["border-top-left-radius", "border-bottom-left-radius"][..]),
            ("r-", &["border-top-right-radius", "border-bottom-right-radius"][..]),
        ] {
            if let Some(v) = v.strip_prefix(prefix) {
                let r = radius(v)?;
                return Some(properties.iter().map(|p| declaration(p, &r)).collect());
            }
        }
        return Some(declaration("border-radius", radius(v)?));
    }
    if let Some(v) = class.strip_prefix("border-") {
        let (side, v) = ["t", "r", "b", "l", "x", "y"]
            .into_iter()
            .find_map(|s| v.strip_prefix(&format!("{s}-")).map(|v| (s, v)))
            .unwrap_or(("", v));
        let (side, v) = if ["t", "r", "b", "l", "x", "y"].contains(&v) && side.is_empty() {
            (v, "1")
        } else {
            (side, v)
        };
        let width = v
            .parse::<f32>()
            .ok()
            .filter(|n| n.is_finite())
            .map(|n| format!("{n}px"))
            .or_else(|| arbitrary(v).filter(|v| v.ends_with("px")));
        let suffix = if width.is_some() { "width" } else { "color" };
        let value = width.unwrap_or(color(v)?);
        let sides = match side {
            "t" => vec!["top"],
            "r" => vec!["right"],
            "b" => vec!["bottom"],
            "l" => vec!["left"],
            "x" => vec!["left", "right"],
            "y" => vec!["top", "bottom"],
            _ => vec![""],
        };
        return Some(format!(
            "border-style:solid;{}",
            sides
                .iter()
                .map(|side| declaration(
                    &if side.is_empty() {
                        format!("border-{suffix}")
                    } else {
                        format!("border-{side}-{suffix}")
                    },
                    &value
                ))
                .collect::<String>()
        ));
    }
    for (prefix, property) in [("bg-", "background-color"), ("fill-", "fill"), ("stroke-", "stroke")] {
        if let Some(v) = class.strip_prefix(prefix) {
            return Some(declaration(property, color(v)?));
        }
    }
    if let Some(v) = class.strip_prefix("text-") {
        if ["left", "right", "center", "justify", "start", "end"].contains(&v) {
            return Some(declaration("text-align", v));
        }
        if let Some((size, line)) = super::style::text_preset(v) {
            return Some(format!("font-size:{size}px;line-height:{line}px;"));
        }
        if let Some(value) = arbitrary(v).filter(|v| v.ends_with("px") || v.ends_with("rem") || v.ends_with("em") || v.starts_with("clamp(")) {
            return Some(declaration("font-size", value));
        }
        return Some(declaration("color", color(v)?));
    }
    if let Some(v) = class.strip_prefix("font-") {
        let weight = match v {
            "thin" => 100,
            "extralight" => 200,
            "light" => 300,
            "normal" => 400,
            "medium" => 500,
            "semibold" => 600,
            "bold" => 700,
            "extrabold" => 800,
            "black" => 900,
            "mono" => return Some("font-family:ui-monospace,monospace;".into()),
            _ => return None,
        };
        return Some(declaration("font-weight", weight.to_string()));
    }
    if let Some(v) = class.strip_prefix("leading-") {
        let value = match v {
            "none" => "1".into(),
            "tight" => "1.25".into(),
            "snug" => "1.375".into(),
            "normal" => "1.5".into(),
            "relaxed" => "1.625".into(),
            "loose" => "2".into(),
            _ => length(v)?,
        };
        return Some(declaration("line-height", value));
    }
    if let Some(v) = class.strip_prefix("tracking-") {
        let value = match v {
            "tighter" => "-.05em".into(),
            "tight" => "-.025em".into(),
            "normal" => "0em".into(),
            "wide" => ".025em".into(),
            "wider" => ".05em".into(),
            "widest" => ".1em".into(),
            _ => arbitrary(v)?,
        };
        return Some(declaration("letter-spacing", value));
    }
    if let Some(v) = class.strip_prefix("opacity-") {
        let n = v.parse::<f32>().ok()?;
        return n.is_finite().then(|| declaration("opacity", (n / 100.).clamp(0., 1.).to_string()));
    }
    if let Some(v) = class.strip_prefix("z-") {
        return Some(declaration("z-index", v.parse::<i32>().ok()?.to_string()));
    }
    if let Some(v) = class.strip_prefix("line-clamp-") {
        let n = v.parse::<u16>().ok()?;
        return Some(format!(
            "overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:{n};"
        ));
    }
    if let Some(v) = class.strip_prefix("aspect-") {
        return Some(declaration(
            "aspect-ratio",
            if v == "square" {
                "1 / 1".into()
            } else if v == "video" {
                "16 / 9".into()
            } else {
                arbitrary(v)?
            },
        ));
    }
    for (prefix, property) in [("translate-x-", "--nayan-translate-x"), ("translate-y-", "--nayan-translate-y")] {
        if let Some(v) = class.strip_prefix(prefix) {
            return Some(format!(
                "{}translate:var(--nayan-translate-x,0) var(--nayan-translate-y,0);",
                declaration(property, signed(length(v)?))
            ));
        }
    }
    if let Some(v) = class.strip_prefix("scale-") {
        let value = arbitrary(v).or_else(|| v.parse::<f32>().ok().filter(|n| n.is_finite()).map(|n| (n / 100.).to_string()))?;
        return Some(declaration("scale", value));
    }
    if let Some(v) = class.strip_prefix("duration-") {
        return Some(declaration("transition-duration", format!("{}ms", v.parse::<u32>().ok()?)));
    }
    if let Some(v) = class.strip_prefix("ease-") {
        return Some(declaration(
            "transition-timing-function",
            match v {
                "in-out" => "cubic-bezier(.4,0,.2,1)",
                "out" => "cubic-bezier(0,0,.2,1)",
                "in" => "cubic-bezier(.4,0,1,1)",
                "linear" => "linear",
                _ => return None,
            },
        ));
    }
    for prefix in ["from-", "via-", "to-"] {
        if let Some(v) = class.strip_prefix(prefix) {
            let kind = prefix.trim_end_matches('-');
            return Some(format!(
                "{}--nayan-gradient-stops:var(--nayan-gradient-from,transparent),{}var(--nayan-gradient-to,transparent);",
                declaration(&format!("--nayan-gradient-{kind}"), color(v)?),
                if kind == "via" { "var(--nayan-gradient-via)," } else { "" }
            ));
        }
    }
    if class == "ring" || class.starts_with("ring-") {
        let v = class.strip_prefix("ring-").unwrap_or("3");
        if let Some(v) = v.strip_prefix("offset-") {
            return Some(declaration("--nayan-ring-offset", length(v)?));
        }
        if let Ok(width) = v.parse::<f32>() {
            return Some(format!(
                "--nayan-ring-width:{width}px;box-shadow:0 0 0 calc(var(--nayan-ring-width,3px) + var(--nayan-ring-offset,0px)) var(--nayan-ring-color,currentColor);"
            ));
        }
        return Some(declaration("--nayan-ring-color", color(v)?));
    }
    if class == "shadow" || class.starts_with("shadow-") {
        let v = class.strip_prefix("shadow-").unwrap_or("md");
        let value = match v {
            "none" => Some("none"),
            "xs" => Some("0 1px 2px 0 var(--nayan-shadow-color,#0000000d)"),
            "sm" => Some("0 1px 3px 0 var(--nayan-shadow-color,#0000001a),0 1px 2px -1px var(--nayan-shadow-color,#0000001a)"),
            "md" => Some("0 4px 6px -1px var(--nayan-shadow-color,#0000001a),0 2px 4px -2px var(--nayan-shadow-color,#0000001a)"),
            "lg" => Some("0 10px 15px -3px var(--nayan-shadow-color,#0000001a),0 4px 6px -4px var(--nayan-shadow-color,#0000001a)"),
            "xl" => Some("0 20px 25px -5px var(--nayan-shadow-color,#0000001a),0 8px 10px -6px var(--nayan-shadow-color,#0000001a)"),
            "2xl" => Some("0 25px 50px -12px var(--nayan-shadow-color,#00000040)"),
            _ => None,
        };
        return Some(if let Some(value) = value {
            declaration("box-shadow", value)
        } else if let Some(value) = arbitrary(v) {
            declaration("box-shadow", value)
        } else {
            declaration("--nayan-shadow-color", color(v)?)
        });
    }
    if let Some(value) = arbitrary(class).and_then(|v| v.split_once(':').map(|(p, v)| (p.to_owned(), v.to_owned()))) {
        return Some(declaration(&value.0, value.1));
    }
    None
}

fn parts(class: &str) -> Vec<&str> {
    let mut depth = 0;
    let mut start = 0;
    let mut result = Vec::new();
    for (i, ch) in class.char_indices() {
        match ch {
            '[' | '(' => depth += 1,
            ']' | ')' => depth -= 1,
            ':' if depth == 0 => {
                result.push(&class[start..i]);
                start = i + 1;
            }
            _ => {}
        }
    }
    result.push(&class[start..]);
    result
}
fn escape(class: &str) -> String {
    class
        .chars()
        .enumerate()
        .map(|(i, c)| {
            if c.is_ascii_alphanumeric() && !(i == 0 && c.is_ascii_digit()) || c == '-' || c == '_' {
                c.to_string()
            } else {
                format!("\\{c}")
            }
        })
        .collect()
}
fn rule(class: &str) -> Option<(u32, String)> {
    let mut segments = parts(class);
    let utility = segments.pop()?;
    let (important, utility) = utility.strip_prefix('!').map_or((false, utility), |v| (true, v));
    let (important, utility) = utility.strip_suffix('!').map_or((important, utility), |v| (true, v));
    let spacing = utility
        .strip_prefix("space-y-")
        .map(|v| ("margin-bottom", v))
        .or_else(|| utility.strip_prefix("space-x-").map(|v| ("margin-right", v)));
    let mut body = if let Some((property, value)) = spacing {
        declaration(property, length(value)?)
    } else {
        declarations(utility)?
    };
    if body.is_empty() {
        return Some((0, String::new()));
    }
    if important {
        body = body.replace(';', "!important;");
    }
    let mut selector = format!(".{}", escape(class));
    let mut media = Vec::new();
    let mut order = 0;
    for variant in segments {
        let breakpoint = match variant {
            "sm" => Some(640),
            "md" => Some(768),
            "lg" => Some(1024),
            "xl" => Some(1280),
            "2xl" => Some(1536),
            _ => None,
        };
        if let Some(width) = breakpoint {
            media.push(format!("(min-width:{width}px)"));
            order += width * 100;
            continue;
        }
        if let Some(value) = variant.strip_prefix("min-").and_then(arbitrary) {
            let n = value.trim_end_matches("px").parse::<u32>().ok()?;
            media.push(format!("(min-width:{value})"));
            order += n * 100;
            continue;
        }
        if let Some(value) = variant.strip_prefix("max-").and_then(arbitrary) {
            media.push(format!("(max-width:{value})"));
            order += 100;
            continue;
        }
        match variant {
            "dark" => {
                selector = format!(":where(.dark,[data-theme=dark]) {selector}");
                order += 10;
            }
            "hover" | "focus" | "focus-visible" | "active" | "disabled" | "checked" | "empty" => {
                selector += &format!(":{variant}");
                if variant == "hover" {
                    media.push("(hover:hover)".into());
                }
                order += 20;
            }
            "first" => {
                selector += ":first-child";
                order += 20;
            }
            "last" => {
                selector += ":last-child";
                order += 20;
            }
            "odd" => {
                selector += ":nth-child(odd)";
                order += 20;
            }
            "even" => {
                selector += ":nth-child(even)";
                order += 20;
            }
            "group-hover" => {
                selector = format!(".group:hover {selector}");
                order += 20;
            }
            "motion-safe" => media.push("(prefers-reduced-motion:no-preference)".into()),
            "motion-reduce" => media.push("(prefers-reduced-motion:reduce)".into()),
            "placeholder" => selector += "::placeholder",
            _ => return None,
        }
    }
    // Broad shorthands precede axis/side overrides, independent of source class order.
    if ["px-", "py-", "mx-", "my-", "gap-x-", "gap-y-"].iter().any(|p| utility.starts_with(p)) {
        order += 1;
    }
    if [
        "pt-",
        "pr-",
        "pb-",
        "pl-",
        "mt-",
        "mr-",
        "mb-",
        "ml-",
        "leading-",
        "tracking-",
        "border-t-",
        "border-b-",
    ]
    .iter()
    .any(|p| utility.starts_with(p))
    {
        order += 2;
    }
    if spacing.is_some() {
        selector += " > :not(:last-child)";
    }
    if utility.starts_with("rounded-") {
        order += match utility.rsplit('-').next().unwrap_or("") {
            "none" => 0,
            "xs" => 1,
            "sm" => 2,
            "md" => 3,
            "lg" => 4,
            "xl" => 5,
            "2xl" => 6,
            "3xl" => 7,
            "4xl" => 8,
            "full" => 9,
            _ => 10,
        };
    }
    let mut css = format!("{selector}{{{body}}}");
    for condition in media.into_iter().rev() {
        css = format!("@media {condition}{{{css}}}");
    }
    Some((order, css))
}

pub(crate) fn compile(source: &str) -> Result<String, String> {
    let value: Value = serde_json::from_str(source).map_err(|e| e.to_string())?;
    let values = value["classes"]
        .as_array()
        .filter(|v| v.len() <= 100_000)
        .ok_or("Expected at most 100000 utility classes")?;
    let mut classes = std::collections::BTreeSet::new();
    for value in values {
        let value = value
            .as_str()
            .filter(|v| v.len() <= 2048 && !v.contains(['\n', '\r', '{', '}', ';']))
            .ok_or("Invalid utility class")?;
        classes.insert(value);
    }
    let mut rules = Vec::new();
    let mut supported = Vec::new();
    let mut unsupported = Vec::new();
    for class in classes {
        if let Some((order, css)) = rule(class) {
            supported.push(class);
            if !css.is_empty() {
                rules.push((order, class, css));
            }
        } else {
            unsupported.push(class);
        }
    }
    rules.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(b.1)));
    Ok(json!({"css":rules.into_iter().map(|(_,_,css)|css).collect::<String>(),"supported":supported,"unsupported":unsupported}).to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn responsive_spacing_variants_colors_and_arbitrary_values_compile_without_a_runtime() {
        let result:Value=serde_json::from_str(&compile(&json!({"classes":["p-3","px-6","sm:grid-cols-2","min-[900px]:h-[68px]","hover:bg-accent/20","-translate-x-1/2","text-[13px]","font-bold","leading-tight","custom-site-class"]}).to_string()).unwrap()).unwrap();
        let css = result["css"].as_str().unwrap();
        assert!(css.contains("padding:12px"));
        assert!(css.contains("padding-left:24px"));
        assert!(css.contains("@media (min-width:640px)"));
        assert!(css.contains("repeat(2,minmax(0,1fr))"));
        assert!(css.contains("@media (min-width:900px)"));
        assert!(css.contains("height:68px"));
        assert!(css.contains("color-mix(in srgb,var(--accent) 20%,transparent)"));
        assert!(css.contains("calc(50% * -1)"));
        assert!(css.contains("font-size:13px"));
        assert!(css.find("font-size:13px").unwrap() < css.find("line-height:1.25").unwrap());
        assert_eq!(result["unsupported"], json!(["custom-site-class"]));
    }
    #[test]
    fn existing_rust_palette_and_important_modifiers_are_shared() {
        let css = rule("!text-violet-500").unwrap().1;
        let color = super::super::palette::COLORS.iter().find(|(n, _)| *n == "violet-500").unwrap().1;
        assert!(css.contains(&format!("#{:02x}{:02x}{:02x}!important", color[0], color[1], color[2])));
        assert!(compile(r#"{"classes":["p-[1px];body"]}"#).is_err());
    }
}
