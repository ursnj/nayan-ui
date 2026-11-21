use super::*;

pub(super) fn split(value: &str, separator: char) -> Vec<&str> {
    let mut depth = 0i32;
    let mut start = 0;
    let mut result = Vec::new();
    for (index, ch) in value.char_indices() {
        match ch {
            '(' | '[' => depth += 1,
            ')' | ']' => depth -= 1,
            _ => {}
        }
        if depth == 0 && (ch == separator || (separator == ' ' && ch.is_whitespace())) {
            let part = value[start..index].trim();
            if !part.is_empty() {
                result.push(part);
            }
            start = index + ch.len_utf8();
        }
    }
    let part = value[start..].trim();
    if !part.is_empty() {
        result.push(part);
    }
    result
}

pub(super) fn vars(value: &str, variables: &BTreeMap<String, String>) -> String {
    let mut value = value.to_string();
    for _ in 0..24 {
        let Some(start) = value.find("var(") else { break };
        let mut depth = 1;
        let mut end = start + 4;
        for (i, ch) in value[start + 4..].char_indices() {
            match ch {
                '(' => depth += 1,
                ')' => depth -= 1,
                _ => {}
            }
            if depth == 0 {
                end = start + 4 + i;
                break;
            }
        }
        if depth != 0 {
            break;
        }
        let arguments = split(&value[start + 4..end], ',');
        let replacement = arguments
            .first()
            .and_then(|key| variables.get(*key))
            .map(String::as_str)
            .unwrap_or_else(|| arguments.get(1).copied().unwrap_or("0"))
            .to_string();
        value.replace_range(start..=end, &replacement);
    }
    value
}

pub(super) fn number(value: &str, available: f32, viewport: Vec2, font: f32) -> Option<f32> {
    let value = value.trim();
    if let Some(body) = value.strip_prefix('(').and_then(|v| v.strip_suffix(')')) {
        let mut depth = 0;
        let mut balanced = true;
        for ch in body.chars() {
            if ch == '(' {
                depth += 1
            } else if ch == ')' {
                depth -= 1
            }
            if depth < 0 {
                balanced = false;
                break;
            }
        }
        if balanced && depth == 0 {
            return number(body, available, viewport, font);
        }
    }
    if let Some(body) = value.strip_prefix("env(").and_then(|v| v.strip_suffix(')')) {
        return Some(split(body, ',').get(1).and_then(|v| number(v, available, viewport, font)).unwrap_or(0.));
    }
    for name in ["calc", "min", "max", "clamp"] {
        if let Some(body) = value.strip_prefix(&format!("{name}(")).and_then(|v| v.strip_suffix(')')) {
            let mut depth = 0_i32;
            let mut balanced = true;
            for ch in body.chars() {
                if ch == '(' {
                    depth += 1
                } else if ch == ')' {
                    depth -= 1
                }
                if depth < 0 {
                    balanced = false;
                    break;
                }
            }
            if !balanced || depth != 0 {
                continue;
            }
            let arguments = split(body, ',');
            if name == "calc" {
                return number(body, available, viewport, font);
            }
            let values: Option<Vec<_>> = arguments.iter().map(|v| number(v, available, viewport, font)).collect();
            let values = values?;
            return match name {
                "min" => values.into_iter().reduce(f32::min),
                "max" => values.into_iter().reduce(f32::max),
                "clamp" if values.len() == 3 => Some(values[1].clamp(values[0].min(values[2]), values[2].max(values[0]))),
                _ => None,
            };
        }
    }
    for operators in ["+-", "*/"] {
        let mut depth = 0i32;
        for (i, ch) in value.char_indices().rev() {
            match ch {
                ')' => depth += 1,
                '(' => depth -= 1,
                _ => {}
            }
            if i > 0 && depth == 0 && operators.contains(ch) && (operators == "*/" || value.as_bytes()[i - 1].is_ascii_whitespace()) {
                let a = number(&value[..i], available, viewport, font)?;
                let b = number(&value[i + 1..], available, viewport, font)?;
                return Some(match ch {
                    '+' => a + b,
                    '-' => a - b,
                    '*' => a * b,
                    '/' if b != 0. => a / b,
                    _ => return None,
                });
            }
        }
    }
    for (unit, scale) in [
        ("rem", 16.),
        ("em", font),
        ("ch", font * 0.625),
        ("svw", viewport.x / 100.),
        ("dvw", viewport.x / 100.),
        ("vw", viewport.x / 100.),
        ("dvh", viewport.y / 100.),
        ("svh", viewport.y / 100.),
        ("vh", viewport.y / 100.),
        ("%", available / 100.),
        ("px", 1.),
        ("s", 1000.),
    ] {
        if let Some(v) = value.strip_suffix(unit) {
            return v.trim().parse::<f32>().ok().map(|n| n * scale).filter(|v| v.is_finite());
        }
    }
    value.parse::<f32>().ok().filter(|v| v.is_finite())
}

pub(super) fn color(value: &str) -> Option<Color32> {
    let value = value.trim();
    if let Some(c) = theme::parse_color(value) {
        return Some(c);
    }
    if let Some(body) = value.strip_prefix("color-mix(").and_then(|v| v.strip_suffix(')')) {
        let parts = split(body, ',');
        if parts.len() == 3 {
            let parse = |part: &str| {
                let tokens = split(part, ' ');
                let weight = tokens.last().and_then(|v| v.strip_suffix('%')).and_then(|v| v.parse::<f32>().ok());
                let source = if weight.is_some() {
                    tokens[..tokens.len() - 1].join(" ")
                } else {
                    part.into()
                };
                color(&source).map(|c| (c, weight))
            };
            let (a, wa) = parse(parts[1])?;
            let (b, wb) = parse(parts[2])?;
            let wa = wa.unwrap_or_else(|| 100. - wb.unwrap_or(50.)) / 100.;
            let wb = wb.unwrap_or((1. - wa) * 100.) / 100.;
            let a = a.to_srgba_unmultiplied();
            let b = b.to_srgba_unmultiplied();
            let alpha = a[3] as f32 / 255. * wa + b[3] as f32 / 255. * wb;
            let channel = |i: usize| {
                if alpha > 0. {
                    ((a[i] as f32 * a[3] as f32 / 255. * wa + b[i] as f32 * b[3] as f32 / 255. * wb) / alpha)
                        .round()
                        .clamp(0., 255.) as u8
                } else {
                    0
                }
            };
            return Some(Color32::from_rgba_unmultiplied(
                channel(0),
                channel(1),
                channel(2),
                (alpha * 255.).round().clamp(0., 255.) as u8,
            ));
        }
    }
    if let Some(body) = value.strip_prefix("oklch(").and_then(|v| v.strip_suffix(')')) {
        let parts = split(body, ' ');
        if parts.len() < 3 {
            return None;
        }
        let l = parts[0].trim_end_matches('%').parse::<f32>().ok()? / if parts[0].ends_with('%') { 100. } else { 1. };
        let c = parts[1].parse::<f32>().ok()?;
        let h = parts[2].trim_end_matches("deg").parse::<f32>().ok()?.to_radians();
        let a = c * h.cos();
        let b = c * h.sin();
        let lp = (l + 0.3963377774 * a + 0.2158037573 * b).powi(3);
        let m = (l - 0.1055613458 * a - 0.0638541728 * b).powi(3);
        let s = (l - 0.0894841775 * a - 1.291485548 * b).powi(3);
        let channel = |v: f32| {
            ((if v <= 0.0031308 {
                v * 12.92
            } else {
                1.055 * v.max(0.).powf(1. / 2.4) - 0.055
            })
            .clamp(0., 1.)
                * 255.)
                .round() as u8
        };
        return Some(Color32::from_rgb(
            channel(4.0767416621 * lp - 3.3077115913 * m + 0.2309699292 * s),
            channel(-1.2684380046 * lp + 2.6097574011 * m - 0.3413193965 * s),
            channel(-0.0041960863 * lp - 0.7034186147 * m + 1.707614701 * s),
        ));
    }
    for prefix in ["rgb(", "rgba(", "hsl(", "hsla("] {
        if let Some(body) = value.strip_prefix(prefix).and_then(|v| v.strip_suffix(')')) {
            let tokens: Vec<_> = body
                .split(|c: char| c.is_whitespace() || c == ',' || c == '/')
                .filter(|v| !v.is_empty())
                .collect();
            if tokens.len() >= 3 && prefix.starts_with("rgb") {
                let ch = |v: &str| {
                    v.trim_end_matches('%')
                        .parse::<f32>()
                        .ok()
                        .map(|n| (n * if v.ends_with('%') { 2.55 } else { 1. }).clamp(0., 255.) as u8)
                };
                let alpha = tokens
                    .get(3)
                    .and_then(|v| {
                        v.trim_end_matches('%')
                            .parse::<f32>()
                            .ok()
                            .map(|n| n / if v.ends_with('%') { 100. } else { 1. })
                    })
                    .unwrap_or(1.);
                return Some(Color32::from_rgba_unmultiplied(
                    ch(tokens[0])?,
                    ch(tokens[1])?,
                    ch(tokens[2])?,
                    (alpha.clamp(0., 1.) * 255.) as u8,
                ));
            }
        }
    }
    None
}

pub(super) fn hex(color: Color32) -> String {
    let c = color.to_srgba_unmultiplied();
    format!("#{:02x}{:02x}{:02x}{:02x}", c[0], c[1], c[2], c[3])
}

/// Expand layout shorthands in cascade order, so a later shorthand resets earlier sides.
pub(super) fn declare(css: &mut BTreeMap<String, String>, name: &str, value: &str) {
    if name == "border" {
        // A later shorthand replaces earlier width/color overrides, including individual edges.
        for property in [
            "border-width",
            "border-color",
            "border-style",
            "border-top",
            "border-top-width",
            "border-top-color",
            "border-top-style",
            "border-right",
            "border-right-width",
            "border-right-color",
            "border-right-style",
            "border-bottom",
            "border-bottom-width",
            "border-bottom-color",
            "border-bottom-style",
            "border-left",
            "border-left-width",
            "border-left-color",
            "border-left-style",
        ] {
            css.remove(property);
        }
    }
    if name == "background" {
        if let Some(color) = color(value).or_else(|| (value == "none").then_some(Color32::TRANSPARENT)) {
            // A color-only shorthand also resets earlier longhands, including utility classes.
            css.insert("background-color".into(), hex(color));
            css.insert("background-image".into(), "none".into());
        }
    }
    if name == "flex-flow" {
        let parts = split(value, ' ');
        css.insert(
            "flex-direction".into(),
            parts
                .iter()
                .find(|v| matches!(**v, "row" | "row-reverse" | "column" | "column-reverse"))
                .copied()
                .unwrap_or("row")
                .into(),
        );
        css.insert(
            "flex-wrap".into(),
            parts
                .iter()
                .find(|v| matches!(**v, "wrap" | "nowrap" | "wrap-reverse"))
                .copied()
                .unwrap_or("nowrap")
                .into(),
        );
    }
    if name == "flex" {
        let parts = split(value, ' ');
        let (grow, shrink, basis) = match value {
            "none" => ("0", "0", "auto"),
            "auto" => ("1", "1", "auto"),
            _ => {
                let grow = parts.first().copied().unwrap_or("0");
                if parts.len() == 1 {
                    (grow, "1", "0%")
                } else if parts.len() == 2 && parts[1].parse::<f32>().is_ok() {
                    (grow, parts[1], "0%")
                } else if parts.len() == 2 {
                    (grow, "1", parts[1])
                } else {
                    (grow, parts.get(1).copied().unwrap_or("1"), parts.get(2).copied().unwrap_or("0%"))
                }
            }
        };
        css.insert("flex-grow".into(), grow.into());
        css.insert("flex-shrink".into(), shrink.into());
        css.insert("flex-basis".into(), basis.into());
    }
    if matches!(name, "margin" | "padding" | "inset" | "border-width" | "border-color") {
        let parts = split(value, ' ');
        if let Some(a) = parts.first() {
            let b = parts.get(1).unwrap_or(a);
            let c = parts.get(2).unwrap_or(a);
            let d = parts.get(3).unwrap_or(b);
            for (side, v) in [("top", *a), ("right", *b), ("bottom", *c), ("left", *d)] {
                let key = if name == "inset" {
                    side.to_string()
                } else if let Some(suffix) = name.strip_prefix("border-") {
                    format!("border-{side}-{suffix}")
                } else {
                    format!("{name}-{side}")
                };
                css.insert(key, v.into());
            }
        }
    } else if name == "gap" {
        let parts = split(value, ' ');
        if let Some(first) = parts.first() {
            css.insert("row-gap".into(), (*first).into());
            css.insert("column-gap".into(), parts.get(1).unwrap_or(first).to_string());
        }
    }
    if name.ends_with("-inline") || name.ends_with("-block") {
        let axis = if name.ends_with("-inline") {
            ["left", "right"]
        } else {
            ["top", "bottom"]
        };
        let base = name.rsplit_once('-').unwrap().0;
        let parts = split(value, ' ');
        if let Some(first) = parts.first() {
            for (i, side) in axis.iter().enumerate() {
                css.insert(format!("{base}-{side}"), parts.get(i).unwrap_or(first).to_string());
            }
        }
    }
    for (logical, physical) in [
        ("-inline-start", "-left"),
        ("-inline-end", "-right"),
        ("-block-start", "-top"),
        ("-block-end", "-bottom"),
    ] {
        if let Some(base) = name.strip_suffix(logical) {
            css.insert(format!("{base}{physical}"), value.into());
        }
    }
    css.insert(name.into(), value.into());
}
