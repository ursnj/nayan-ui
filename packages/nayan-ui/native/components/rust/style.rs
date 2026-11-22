//! A supported Tailwind utility vocabulary. Resolution, variants and painting remain in Rust.
use super::*;

#[derive(Clone, Copy, Default)]
pub(super) struct Conditions {
    pub dark: bool,
    pub disabled: bool,
    pub hovered: bool,
    pub focused: bool,
    pub active: bool,
    pub viewport: f32,
}

#[derive(Clone, Copy, Default, Debug, PartialEq)]
pub(super) struct Edges {
    pub left: f32,
    pub right: f32,
    pub top: f32,
    pub bottom: f32,
}

impl Edges {
    fn all(value: f32) -> Self {
        Self {
            left: value,
            right: value,
            top: value,
            bottom: value,
        }
    }

    pub fn margin(self) -> egui::Margin {
        egui::Margin {
            left: self.left.clamp(-127., 127.) as i8,
            right: self.right.clamp(-127., 127.) as i8,
            top: self.top.clamp(-127., 127.) as i8,
            bottom: self.bottom.clamp(-127., 127.) as i8,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub(super) enum Length {
    Points(f32),
    /// A multiple of the element's font size (`em`, unitless line heights).
    Em(f32),
}

impl Length {
    pub fn points(self, font_size: f32) -> f32 {
        match self {
            Length::Points(v) => v,
            Length::Em(v) => v * font_size,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub(super) enum TextTransform {
    Normal,
    Uppercase,
    Lowercase,
}

impl TextTransform {
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "none" | "normal-case" => Some(Self::Normal),
            "uppercase" => Some(Self::Uppercase),
            "lowercase" => Some(Self::Lowercase),
            _ => None,
        }
    }

    pub fn apply<'a>(self, text: impl Into<std::borrow::Cow<'a, str>>) -> std::borrow::Cow<'a, str> {
        let text = text.into();
        match self {
            Self::Normal => text,
            Self::Uppercase => text.to_uppercase().into(),
            Self::Lowercase => text.to_lowercase().into(),
        }
    }

    pub fn name(self) -> &'static str {
        match self {
            Self::Normal => "none",
            Self::Uppercase => "uppercase",
            Self::Lowercase => "lowercase",
        }
    }
}

pub(super) fn text_preset(size: &str) -> Option<(f32, f32)> {
    Some(match size {
        "xs" => (12., 16.),
        "sm" => (14., 20.),
        "base" => (16., 24.),
        "lg" => (18., 28.),
        "xl" => (20., 28.),
        "2xl" => (24., 32.),
        "3xl" => (30., 36.),
        "4xl" => (36., 40.),
        "5xl" => (48., 48.),
        "6xl" => (60., 60.),
        "7xl" => (72., 72.),
        "8xl" => (96., 96.),
        "9xl" => (128., 128.),
        _ => return None,
    })
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub(super) struct Gradient {
    /// Top-to-bottom when true, bottom-to-top otherwise.
    pub down: bool,
    pub from: Color32,
    pub to: Color32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub(super) struct TextShadow {
    pub color: Color32,
    pub offset: Vec2,
    pub radius: f32,
}

#[derive(Clone, Debug)]
pub(super) struct Style {
    pub padding: Edges,
    pub margin: Edges,
    pub horizontal: bool,
    pub grow: f32,
    pub justify_between: bool,
    pub aspect_ratio: Option<f32>,
    pub wrap: bool,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub min_width: Option<f32>,
    pub max_width: Option<f32>,
    pub min_height: Option<f32>,
    pub max_height: Option<f32>,
    pub gap: Option<Vec2>,
    pub background: Option<Color32>,
    pub foreground: Option<Color32>,
    pub border: Option<Color32>,
    pub border_width: f32,
    pub radius: f32,
    /// Per-corner overrides of `radius`: top-left, top-right, bottom-left, bottom-right.
    pub corners: [Option<f32>; 4],
    pub text_size: Option<f32>,
    pub monospace: bool,
    pub medium: bool,
    pub weight: Option<u16>,
    pub line_height: Option<Length>,
    pub tracking: Option<Length>,
    pub text_transform: Option<TextTransform>,
    pub text_align: Option<egui::Align>,
    pub text_shadow: Option<TextShadow>,
    gradient_down: Option<bool>,
    gradient_from: Option<Color32>,
    gradient_to: Option<Color32>,
    pub shadow: Option<(egui::epaint::Shadow, f32)>,
    pub backdrop_blur: f32,
    pub opacity: f32,
    opacity_set: bool,
    pub hidden: bool,
    pub align: egui::Align,
    pub stretch: bool,
    pub justify: egui::Align,
    pub absolute: bool,
    /// Offsets of an absolutely positioned box: top, right, bottom, left.
    pub inset: [Option<f32>; 4],
}

impl Default for Style {
    fn default() -> Self {
        Self {
            padding: Edges::default(),
            margin: Edges::default(),
            horizontal: false,
            grow: 0.,
            justify_between: false,
            aspect_ratio: None,
            wrap: false,
            width: None,
            height: None,
            min_width: None,
            max_width: None,
            min_height: None,
            max_height: None,
            gap: None,
            background: None,
            foreground: None,
            border: None,
            border_width: 0.,
            radius: 8.,
            corners: [None; 4],
            text_size: None,
            monospace: false,
            medium: false,
            weight: None,
            line_height: None,
            tracking: None,
            text_transform: None,
            text_align: None,
            text_shadow: None,
            gradient_down: None,
            gradient_from: None,
            gradient_to: None,
            shadow: None,
            backdrop_blur: 0.,
            opacity: 1.,
            opacity_set: false,
            hidden: false,
            align: egui::Align::Min,
            stretch: false,
            justify: egui::Align::Min,
            absolute: false,
            inset: [None; 4],
        }
    }
}

fn number(s: &str) -> Option<f32> {
    s.parse::<f32>().ok().filter(|v| v.is_finite())
}

fn length(s: &str, available: f32) -> Option<f32> {
    if s == "full" {
        return Some(available.max(0.));
    }
    if s == "px" {
        return Some(1.);
    }
    if let Some(s) = s.strip_prefix('[').and_then(|s| s.strip_suffix(']')) {
        return if let Some(s) = s.strip_suffix("%") {
            number(s).map(|v| available * v / 100.)
        } else if let Some(s) = s.strip_suffix("rem") {
            number(s).map(|v| v * 16.)
        } else {
            number(s.strip_suffix("px").unwrap_or(s))
        };
    }
    if let Some((a, b)) = s.split_once('/') {
        let a = number(a)?;
        let b = number(b)?;
        return (b > 0.).then_some(available * a / b);
    }
    number(s).map(|v| v * 4.)
}

fn color(s: &str, palette: &theme::Palette) -> Option<Color32> {
    let (name, alpha) = s
        .rsplit_once('/')
        .filter(|(_, a)| number(a).is_some())
        .map(|(n, a)| (n, number(a).unwrap() / 100.))
        .unwrap_or((s, 1.));
    let name = name.strip_prefix('[').and_then(|s| s.strip_suffix(']')).unwrap_or(name);
    let c = if let Some(token) = name.strip_prefix("var(--").and_then(|s| s.strip_suffix(')')) {
        palette.color(token)
    } else if let Some(c) = palette.color(name) {
        Some(c)
    } else if let Ok(i) = super::palette::COLORS.binary_search_by(|(n, _)| n.cmp(&name)) {
        let c = super::palette::COLORS[i].1;
        Some(Color32::from_rgb(c[0], c[1], c[2]))
    } else {
        theme::parse_color(&name.replace('_', " "))
    }?;
    Some(c.gamma_multiply(alpha.clamp(0., 1.)))
}

fn radius(s: &str) -> Option<f32> {
    match s {
        "none" => Some(0.),
        "sm" => Some(2.),
        "md" => Some(6.),
        "lg" => Some(8.),
        "xl" => Some(12.),
        "2xl" => Some(16.),
        "3xl" => Some(24.),
        "full" => Some(255.),
        _ => length(s, 0.),
    }
    .map(|v| v.clamp(0., 255.))
}

fn text_align(s: &str) -> Option<egui::Align> {
    match s {
        "left" | "start" => Some(egui::Align::Min),
        "center" => Some(egui::Align::Center),
        "right" | "end" => Some(egui::Align::Max),
        _ => None,
    }
}

fn edges(e: &mut Edges, axis: &str, value: f32) {
    match axis {
        "" => *e = Edges::all(value),
        "x" => {
            e.left = value;
            e.right = value;
        }
        "y" => {
            e.top = value;
            e.bottom = value;
        }
        "t" => e.top = value,
        "b" => e.bottom = value,
        "l" => e.left = value,
        "r" => e.right = value,
        _ => {}
    }
}

pub(super) fn variant(class: &str, c: Conditions) -> Option<&str> {
    // Colons inside arbitrary values (e.g. a CSS color function) are not variant separators.
    let mut rest = class;
    while !rest.starts_with('[') {
        let Some((prefix, tail)) = rest.split_once(':') else {
            break;
        };
        if prefix.contains('[') {
            break;
        }
        let applies = match prefix {
            "dark" => c.dark,
            "light" => !c.dark,
            "disabled" => c.disabled,
            "hover" => c.hovered && !c.disabled,
            "focus" | "focus-visible" => c.focused,
            "active" => c.active && !c.disabled,
            "sm" => c.viewport >= 640.,
            "md" => c.viewport >= 768.,
            "lg" => c.viewport >= 1024.,
            "xl" => c.viewport >= 1280.,
            "2xl" => c.viewport >= 1536.,
            _ => false,
        };
        if !applies {
            return None;
        }
        rest = tail;
    }
    Some(rest)
}

impl Style {
    pub fn resolve(kind: &str, props: &Value, palette: &theme::Palette, conditions: Conditions, available: Vec2) -> Self {
        let merged;
        let props = if let Some(defaults) = palette.components.get(kind) {
            let mut value = props.clone();
            value["className"] = serde_json::json!(format!(
                "{} {}",
                defaults["className"].as_str().unwrap_or(""),
                props["className"].as_str().unwrap_or("")
            ));
            let mut style = defaults["style"].as_object().cloned().unwrap_or_default();
            if let Some(explicit) = props["style"].as_object() {
                style.extend(explicit.clone());
            }
            value["style"] = Value::Object(style);
            merged = value;
            &merged
        } else {
            props
        };
        let mut result = Self {
            radius: palette.radius,
            ..Default::default()
        };
        match kind {
            "NImage" | "NView" | "NPress" => {
                result.radius = 0.;
            }
            "NCard" => {
                if palette.native {
                    result.radius = palette.radius * 1.5;
                }
                result.background = Some(palette.get("surface"));
                result.border = Some(palette.get("border"));
                result.border_width = 1.;
                result.padding = Edges {
                    left: 16.,
                    right: 16.,
                    top: 12.,
                    bottom: 12.,
                };
            }
            "NBadge" | "NChip" => {
                let name = props["color"].as_str().unwrap_or("default");
                let tone = palette.color(name).unwrap_or_else(|| palette.get("default"));
                let foreground = palette
                    .color(&format!("{name}-foreground"))
                    .unwrap_or_else(|| palette.get("foreground"));
                let variant = props["variant"].as_str().unwrap_or(if kind == "NBadge" { "soft" } else { "secondary" });
                result.background = Some(match variant {
                    "primary" => tone,
                    "tertiary" => Color32::TRANSPARENT,
                    "soft" => tone.gamma_multiply(if name == "default" { 0.5 } else { 0.15 }),
                    _ => palette.get("default"),
                });
                result.foreground = Some(if variant == "primary" || name == "default" {
                    foreground
                } else {
                    let midpoint = |first: u8, second: u8| ((u16::from(first) + u16::from(second)) / 2) as u8;
                    let foreground = palette.get("foreground");
                    Color32::from_rgb(
                        midpoint(tone.r(), foreground.r()),
                        midpoint(tone.g(), foreground.g()),
                        midpoint(tone.b(), foreground.b()),
                    )
                });
                let (size, height) = match props["size"].as_str() {
                    Some("sm") => (12., 20.),
                    Some("lg") => (16., 32.),
                    _ => (14., 28.),
                };
                result.text_size = Some(size);
                result.min_height = Some(height);
                result.padding = Edges { left: 10., right: 10., top: 2., bottom: 2. };
            }
            "NActionItem" => {
                result.radius = 12.;
                result.horizontal = true;
                result.justify_between = true;
                result.align = egui::Align::Center;
                result.padding = Edges {
                    left: 16.,
                    right: 16.,
                    top: 12.,
                    bottom: 12.,
                };
                result.background = Some(palette.get("surface"));
            }
            "NButton" => {
                if palette.native {
                    result.radius = palette.radius * 1.5;
                    result.medium = true;
                    result.border = Some(Color32::TRANSPARENT);
                }
                result.background = Some(palette.get("action"));
                result.foreground = Some(palette.get("action-foreground"));
                result.padding = Edges {
                    left: 16.,
                    right: 16.,
                    top: 10.,
                    bottom: 10.,
                };
            }
            "NInput" | "NTextarea" | "NSearchField" | "NInputOtp" | "NSelect" => {
                if palette.native {
                    result.margin.bottom = 12.;
                }
                if palette.native {
                    result.radius = 12.;
                }
                result.background = Some(palette.get("field-background"));
                if kind == "NSelect" {
                    result.foreground = Some(palette.get("field-foreground"));
                }
                result.border = Some(palette.get("field-border"));
                result.border_width = if palette.native { 0. } else { 1. };
                result.padding = Edges {
                    left: 12.,
                    right: 12.,
                    top: 10.,
                    bottom: 10.,
                };
            }
            _ => {}
        }
        if props["isOutline"] == true || props["variant"] == "outline" {
            result.background = Some(Color32::TRANSPARENT);
            result.foreground = Some(palette.get("foreground"));
            result.border = Some(palette.get("border"));
            result.border_width = 1.;
        }
        let mut classes: Vec<_> = props["className"].as_str().unwrap_or("").split_whitespace().collect();
        classes.sort_by_key(|s| s.split('[').next().unwrap_or(s).matches(':').count());
        for class in classes {
            if let Some(class) = variant(class, conditions) {
                result.utility(class, palette, available);
            }
        }
        if matches!(kind, "NInput" | "NTextarea" | "NSearchField" | "NInputOtp") {
            for class in props["containerClassName"].as_str().unwrap_or("").split_whitespace() {
                if let Some(class) = variant(class, conditions) {
                    result.utility(class, palette, available);
                }
            }
        }
        // Resolve React Native style spelling in the same Rust path as Tailwind utilities.
        for (key, prefix) in [
            ("width", "w"),
            ("height", "h"),
            ("minWidth", "min-w"),
            ("maxWidth", "max-w"),
            ("minHeight", "min-h"),
            ("maxHeight", "max-h"),
            ("padding", "p"),
            ("paddingHorizontal", "px"),
            ("paddingVertical", "py"),
            ("paddingTop", "pt"),
            ("paddingBottom", "pb"),
            ("paddingLeft", "pl"),
            ("paddingRight", "pr"),
            ("margin", "m"),
            ("marginHorizontal", "mx"),
            ("marginVertical", "my"),
            ("marginTop", "mt"),
            ("marginBottom", "mb"),
            ("marginLeft", "ml"),
            ("marginRight", "mr"),
            ("gap", "gap"),
            ("rowGap", "gap-y"),
            ("columnGap", "gap-x"),
            ("top", "top"),
            ("right", "right"),
            ("bottom", "bottom"),
            ("left", "left"),
            ("fontSize", "text"),
            ("lineHeight", "leading"),
        ] {
            let value = &props["style"][key];
            if let Some(n) = value.as_f64().filter(|v| v.is_finite()) {
                result.utility(&format!("{prefix}-[{n}px]"), palette, available);
            } else if let Some(v) = value.as_str() {
                result.utility(&format!("{prefix}-[{v}]"), palette, available);
            }
        }
        for (key, values) in [
            ("flexDirection", &[("row", "flex-row"), ("column", "flex-col")][..]),
            ("flexWrap", &[("wrap", "flex-wrap"), ("nowrap", "flex-nowrap")][..]),
            ("position", &[("absolute", "absolute"), ("relative", "relative")][..]),
            (
                "alignItems",
                &[
                    ("flex-start", "items-start"),
                    ("center", "items-center"),
                    ("flex-end", "items-end"),
                    ("stretch", "items-stretch"),
                ][..],
            ),
            (
                "justifyContent",
                &[
                    ("flex-start", "justify-start"),
                    ("center", "justify-center"),
                    ("flex-end", "justify-end"),
                    ("space-between", "justify-between"),
                ][..],
            ),
        ] {
            if let Some(v) = props["style"][key].as_str() {
                if let Some((_, class)) = values.iter().find(|(name, _)| *name == v) {
                    result.utility(class, palette, available);
                }
            }
        }
        if let Some(grow) = props["style"]["flexGrow"].as_f64().or_else(|| props["style"]["flex"].as_f64()) {
            result.grow = grow.clamp(0., 16384.) as f32;
        }
        if let Some(v) = props["style"]["aspectRatio"].as_f64().filter(|v| v.is_finite() && *v > 0.) {
            result.aspect_ratio = Some(v as f32);
        }
        if let Some(v) = props["style"]["color"].as_str().and_then(theme::parse_color) {
            result.foreground = Some(v);
        }
        if let Some(v) = props["style"]["fontWeight"]
            .as_u64()
            .or_else(|| props["style"]["fontWeight"].as_str().and_then(|v| v.parse().ok()))
        {
            result.weight = Some(v.clamp(100, 900) as u16);
        }

        // Explicit numeric style props override class utilities, consistently on both platforms.
        result.width = props["style"]["width"]
            .as_f64()
            .or_else(|| props["width"].as_f64())
            .filter(|v| v.is_finite())
            .map(|v| v as f32)
            .or(result.width);
        result.height = props["style"]["height"]
            .as_f64()
            .or_else(|| props["height"].as_f64())
            .filter(|v| v.is_finite())
            .map(|v| v as f32)
            .or(result.height);
        if let Some(filter) = props["style"]["backdropFilter"].as_str() {
            result.backdrop_blur = filter
                .strip_prefix("blur(")
                .and_then(|v| v.strip_suffix(')'))
                .and_then(|v| number(v.trim().trim_end_matches("px")))
                .unwrap_or(0.)
                .clamp(0., 64.);
        }
        if let Some(shadow) = props["style"]["boxShadow"].as_str() {
            let parts: Vec<_> = shadow.split_whitespace().collect();
            if parts.len() >= 5 {
                let lengths: Option<Vec<f32>> = parts[..4].iter().map(|part| number(part.trim_end_matches("px"))).collect();
                if let (Some(v), Some(color)) = (lengths, theme::parse_color(&parts[4..].join(" "))) {
                    result.shadow = Some((
                        egui::epaint::Shadow {
                            offset: [v[0].clamp(-127., 127.) as i8, v[1].clamp(-127., 127.) as i8],
                            blur: v[2].clamp(0., 255.) as u8,
                            spread: 0,
                            color,
                        },
                        v[3].clamp(-255., 255.),
                    ));
                }
            }
        }
        if let Some(v) = props["style"]["borderRadius"].as_f64() {
            result.radius = (v as f32).clamp(0., 255.);
        }
        if let Some(v) = props["style"]["borderWidth"].as_f64() {
            result.border_width = (v as f32).clamp(0., 32.);
        }
        if let Some(v) = props["style"]["borderColor"].as_str().and_then(theme::parse_color) {
            result.border = Some(v);
        }
        if let Some(v) = props["style"]["backgroundColor"].as_str().and_then(theme::parse_color) {
            result.background = Some(v);
        }
        if let Some(v) = props["style"]["opacity"].as_f64() {
            result.opacity = (v as f32).clamp(0., 1.);
            result.opacity_set = true;
        }
        if let Some(color) = props["style"]["textShadowColor"].as_str().and_then(theme::parse_color) {
            let offset = &props["style"]["textShadowOffset"];
            result.text_shadow = Some(TextShadow {
                color,
                offset: Vec2::new(
                    offset["width"].as_f64().unwrap_or(0.).clamp(-64., 64.) as f32,
                    offset["height"].as_f64().unwrap_or(0.).clamp(-64., 64.) as f32,
                ),
                radius: props["style"]["textShadowRadius"].as_f64().unwrap_or(0.).clamp(0., 64.) as f32,
            });
        }
        if let Some(align) = props["style"]["textAlign"].as_str().and_then(text_align) {
            result.text_align = Some(align);
        }
        if let Some(value) = props["style"]["letterSpacing"].as_f64() {
            result.tracking = Some(Length::Points(value as f32));
        }
        if let Some(value) = props["style"]["textTransform"].as_str().and_then(TextTransform::parse) {
            result.text_transform = Some(value);
        }
        if props["safeArea"].is_object() {
            let safe = &props["safeArea"];
            let spacing = if safe["mode"] == "margin" {
                &mut result.margin
            } else {
                &mut result.padding
            };
            for (side, value) in [
                ("top", &mut spacing.top),
                ("right", &mut spacing.right),
                ("bottom", &mut spacing.bottom),
                ("left", &mut spacing.left),
            ] {
                *value = crate::safe_area::apply(
                    *value as f64,
                    safe["insets"][side].as_f64().unwrap_or(0.),
                    crate::safe_area::edge_mode(&safe["edges"], side),
                ) as f32;
            }
        }
        result
    }

    pub fn corner_radius(&self) -> egui::CornerRadius {
        let corner = |index: usize| self.corners[index].unwrap_or(self.radius).clamp(0., 255.) as u8;
        egui::CornerRadius {
            nw: corner(0),
            ne: corner(1),
            sw: corner(2),
            se: corner(3),
        }
    }

    pub fn gradient(&self) -> Option<Gradient> {
        Some(Gradient {
            down: self.gradient_down?,
            from: self.gradient_from.unwrap_or(Color32::TRANSPARENT),
            to: self.gradient_to.unwrap_or(Color32::TRANSPARENT),
        })
    }
    /// The egui family registered for this weight in `fonts::configure`.
    pub fn font_family(&self) -> egui::FontFamily {
        if self.monospace {
            return egui::FontFamily::Monospace;
        }
        match self.weight.unwrap_or(if self.medium { 500 } else { 400 }) {
            ..=450 => egui::FontFamily::Proportional,
            weight => egui::FontFamily::Name(fonts::family(weight).into()),
        }
    }

    fn utility(&mut self, class: &str, palette: &theme::Palette, available: Vec2) {
        if let Some(value) = class.strip_prefix("backdrop-blur") {
            self.backdrop_blur = match value {
                "-none" => 0.,
                "-sm" => 4.,
                "" => 8.,
                "-md" => 12.,
                "-lg" => 16.,
                "-xl" => 24.,
                "-2xl" => 40.,
                "-3xl" => 64.,
                _ => value
                    .strip_prefix("-[")
                    .and_then(|v| v.strip_suffix("px]"))
                    .and_then(number)
                    .unwrap_or(0.)
                    .clamp(0., 64.),
            };
            return;
        }
        match class {
            "hidden" => {
                self.hidden = true;
                return;
            }
            "flex" | "block" => {
                self.hidden = false;
                return;
            }
            "flex-1" | "flex-auto" | "flex-grow" | "grow" => {
                self.grow = 1.;
                return;
            }
            "grow-0" | "flex-none" => {
                self.grow = 0.;
                return;
            }
            "justify-between" => {
                self.justify_between = true;
                return;
            }
            "aspect-square" => {
                self.aspect_ratio = Some(1.);
                return;
            }
            "flex-row" => {
                self.horizontal = true;
                return;
            }
            "flex-col" => {
                self.horizontal = false;
                return;
            }
            "flex-wrap" | "flex-nowrap" => {
                self.wrap = class == "flex-wrap";
                return;
            }
            "font-mono" => {
                self.monospace = true;
                return;
            }
            "font-medium" => {
                self.medium = true;
                self.weight = Some(500);
                return;
            }
            "font-normal" | "font-semibold" | "font-bold" | "font-extrabold" | "font-black" => {
                self.weight = Some(match class {
                    "font-semibold" => 600,
                    "font-bold" => 700,
                    "font-extrabold" => 800,
                    "font-black" => 900,
                    _ => 400,
                });
                return;
            }
            "uppercase" | "lowercase" | "normal-case" => {
                self.text_transform = TextTransform::parse(class);
                return;
            }
            "text-left" | "text-center" | "text-right" => {
                self.text_align = text_align(&class[5..]);
                return;
            }
            "absolute" => {
                self.absolute = true;
                return;
            }
            "relative" | "static" => {
                self.absolute = false;
                return;
            }
            "bg-linear-to-b" | "bg-gradient-to-b" | "bg-linear-to-t" | "bg-gradient-to-t" => {
                self.gradient_down = Some(class.ends_with("-b"));
                self.background = Some(Color32::TRANSPARENT);
                return;
            }
            "items-stretch" => {
                self.stretch = true;
                return;
            }
            "items-start" => {
                self.stretch = false;
                self.align = egui::Align::Min;
                return;
            }
            "items-center" => {
                self.stretch = false;
                self.align = egui::Align::Center;
                return;
            }
            "items-end" => {
                self.stretch = false;
                self.align = egui::Align::Max;
                return;
            }
            "justify-start" => {
                self.justify_between = false;
                self.justify = egui::Align::Min;
                return;
            }
            "justify-center" => {
                self.justify_between = false;
                self.justify = egui::Align::Center;
                return;
            }
            "justify-end" => {
                self.justify_between = false;
                self.justify = egui::Align::Max;
                return;
            }
            "border" => {
                self.border_width = 1.;
                self.border = Some(palette.get("border"));
                return;
            }
            "rounded" => {
                self.radius = 4.;
                return;
            }
            _ => {}
        }
        for (prefix, sides) in [
            ("inset-x-", &[1, 3][..]),
            ("inset-y-", &[0, 2][..]),
            ("inset-", &[0, 1, 2, 3][..]),
            ("top-", &[0][..]),
            ("right-", &[1][..]),
            ("bottom-", &[2][..]),
            ("left-", &[3][..]),
        ] {
            if let Some(v) = class.strip_prefix(prefix).and_then(|v| length(v, 0.)) {
                for side in sides {
                    self.inset[*side] = Some(v.clamp(-16384., 16384.));
                }
                return;
            }
        }
        if let Some(v) = class.strip_prefix("leading-") {
            let height = match v {
                "none" => Some(Length::Em(1.)),
                "tight" => Some(Length::Em(1.25)),
                "snug" => Some(Length::Em(1.375)),
                "normal" => Some(Length::Em(1.5)),
                "relaxed" => Some(Length::Em(1.625)),
                "loose" => Some(Length::Em(2.)),
                _ => length(v, 0.).map(Length::Points),
            };
            if let Some(height) = height {
                self.line_height = Some(height);
                return;
            }
        }
        if let Some(v) = class.strip_prefix("tracking-") {
            let spacing = match v {
                "tighter" => Some(Length::Em(-0.05)),
                "tight" => Some(Length::Em(-0.025)),
                "normal" => Some(Length::Em(0.)),
                "wide" => Some(Length::Em(0.025)),
                "wider" => Some(Length::Em(0.05)),
                "widest" => Some(Length::Em(0.1)),
                _ => v.strip_prefix('[').and_then(|v| v.strip_suffix(']')).and_then(|v| {
                    v.strip_suffix("em")
                        .and_then(number)
                        .map(Length::Em)
                        .or_else(|| length(&format!("[{v}]"), 0.).map(Length::Points))
                }),
            };
            if let Some(spacing) = spacing {
                self.tracking = Some(spacing);
                return;
            }
        }
        if let Some(v) = class.strip_prefix("from-").and_then(|v| color(v, palette)) {
            self.gradient_from = Some(v);
            return;
        }
        if let Some(v) = class.strip_prefix("to-").and_then(|v| color(v, palette)) {
            self.gradient_to = Some(v);
            return;
        }
        for (prefix, corners) in [
            ("rounded-tl-", &[0][..]),
            ("rounded-tr-", &[1][..]),
            ("rounded-bl-", &[2][..]),
            ("rounded-br-", &[3][..]),
            ("rounded-t-", &[0, 1][..]),
            ("rounded-b-", &[2, 3][..]),
            ("rounded-l-", &[0, 2][..]),
            ("rounded-r-", &[1, 3][..]),
        ] {
            if let Some(v) = class.strip_prefix(prefix).and_then(radius) {
                for corner in corners {
                    self.corners[*corner] = Some(v);
                }
                return;
            }
        }
        for (prefix, field, extent) in [
            ("min-w-", 0, available.x),
            ("max-w-", 1, available.x),
            ("min-h-", 2, available.y),
            ("max-h-", 3, available.y),
            ("w-", 4, available.x),
            ("h-", 5, available.y),
        ] {
            if let Some(v) = class.strip_prefix(prefix).and_then(|v| length(v, extent)) {
                let v = Some(v.clamp(0., 16384.));
                match field {
                    0 => self.min_width = v,
                    1 => self.max_width = v,
                    2 => self.min_height = v,
                    3 => self.max_height = v,
                    4 => self.width = v,
                    _ => self.height = v,
                }
                return;
            }
        }
        if let Some(v) = class.strip_prefix("bg-").and_then(|v| color(v, palette)) {
            self.background = Some(v);
            return;
        }
        if let Some(v) = class.strip_prefix("text-") {
            let size = text_preset(v).map(|(size, _)| size).or_else(|| {
                let value = v.strip_prefix('[')?.strip_suffix(']')?;
                value
                    .strip_suffix("px")
                    .and_then(number)
                    .or_else(|| value.strip_suffix("rem").and_then(number).map(|v| v * 16.))
            });
            if let Some(size) = size {
                self.text_size = Some(size.clamp(1., 256.));
                return;
            }
            if let Some(c) = color(v, palette) {
                self.foreground = Some(c);
                return;
            }
        }
        if let Some(v) = class.strip_prefix("border-") {
            if let Some(n) = number(v) {
                self.border_width = n.clamp(0., 16.);
                self.border.get_or_insert(palette.get("border"));
                return;
            }
            if let Some(c) = color(v, palette) {
                self.border = Some(c);
                return;
            }
        }
        if let Some(v) = class.strip_prefix("rounded-") {
            if let Some(v) = radius(v) {
                self.radius = v;
            }
            return;
        }
        if let Some(v) = class.strip_prefix("opacity-").and_then(number) {
            self.opacity = (v / 100.).clamp(0., 1.);
            self.opacity_set = true;
            return;
        }
        for (prefix, axis) in [("gap-x-", 1), ("gap-y-", 2), ("gap-", 0)] {
            if let Some(v) = class.strip_prefix(prefix).and_then(|v| length(v, 0.)) {
                let gap = self.gap.get_or_insert(Vec2::splat(8.));
                if axis != 2 {
                    gap.x = v.max(0.);
                }
                if axis != 1 {
                    gap.y = v.max(0.);
                }
                return;
            }
        }
        for (prefix, side) in [
            ("px-", "x"),
            ("py-", "y"),
            ("pt-", "t"),
            ("pb-", "b"),
            ("pl-", "l"),
            ("pr-", "r"),
            ("p-", ""),
        ] {
            if let Some(v) = class.strip_prefix(prefix).and_then(|v| length(v, 0.)) {
                edges(&mut self.padding, side, v.clamp(0., 127.));
                return;
            }
        }
        let (class, sign) = class.strip_prefix('-').map(|v| (v, -1.)).unwrap_or((class, 1.));
        for (prefix, side) in [
            ("mx-", "x"),
            ("my-", "y"),
            ("mt-", "t"),
            ("mb-", "b"),
            ("ml-", "l"),
            ("mr-", "r"),
            ("m-", ""),
        ] {
            if let Some(v) = class.strip_prefix(prefix).and_then(|v| length(v, 0.)) {
                edges(&mut self.margin, side, (v * sign).clamp(-127., 127.));
                return;
            }
        }
    }

    pub fn apply(&self, ui: &mut egui::Ui, font_scale: f32) {
        if let Some(v) = self.width {
            ui.set_width(v.max(0.));
        }
        if let Some(v) = self.max_width {
            ui.set_max_width(v);
        }
        if let Some(v) = self.max_height {
            ui.set_max_height(v);
        }
        if let Some(v) = self.min_width {
            ui.set_min_width(v);
        }
        if let Some(v) = self.min_height {
            ui.set_min_height(v);
        }
        if let Some(v) = self.gap {
            ui.spacing_mut().item_spacing = v;
        }
        if self.text_size.is_some() || self.monospace || self.medium || self.weight.is_some() {
            let inherited = ui.style().override_font_id.clone();
            let size = self
                .text_size
                .unwrap_or_else(|| inherited.as_ref().map(|f| f.size / font_scale).unwrap_or(16.));
            let family = if self.monospace || self.medium || self.weight.is_some() {
                self.font_family()
            } else {
                inherited.map_or(egui::FontFamily::Proportional, |f| f.family)
            };
            ui.style_mut().override_font_id = Some(egui::FontId::new(size * font_scale, family));
        }
        let visuals = ui.visuals_mut();
        if let Some(c) = self.foreground {
            visuals.override_text_color = Some(c);
        }
        for w in [
            &mut visuals.widgets.inactive,
            &mut visuals.widgets.hovered,
            &mut visuals.widgets.active,
            &mut visuals.widgets.open,
        ] {
            if let Some(c) = self.background {
                w.bg_fill = c;
                w.weak_bg_fill = c;
            }
            if let Some(c) = self.foreground {
                w.fg_stroke.color = c;
            }
            if let Some(c) = self.border {
                w.bg_stroke = egui::Stroke::new(self.border_width, c);
            }
            w.corner_radius = self.corner_radius();
        }
        if let Some(c) = self.background {
            visuals.text_edit_bg_color = Some(c);
        }
        ui.spacing_mut().button_padding = Vec2::new(
            (self.padding.left + self.padding.right) / 2.,
            (self.padding.top + self.padding.bottom) / 2.,
        );
        if self.opacity_set && !ui.is_enabled() {
            ui.visuals_mut().disabled_alpha = 1.;
        }
        ui.multiply_opacity(self.opacity);
    }

    pub fn frame(&self, control: bool) -> egui::Frame {
        let mut frame = egui::Frame::new().outer_margin(self.margin.margin());
        if !control {
            frame = frame
                .inner_margin(self.padding.margin())
                .fill(self.background.unwrap_or(Color32::TRANSPARENT))
                .corner_radius(self.corner_radius())
                .stroke(egui::Stroke::new(self.border_width, self.border.unwrap_or(Color32::TRANSPARENT)));
        }
        frame
    }

    pub fn layout(&self) -> egui::Layout {
        (if self.horizontal {
            egui::Layout::left_to_right(self.align)
        } else {
            egui::Layout::top_down(self.align)
        })
        .with_cross_justify(self.stretch)
        .with_main_align(self.justify)
        .with_main_wrap(self.wrap)
    }
}

#[cfg(test)]
mod safe_area_tests {
    use super::*;
    #[test]
    fn safe_area_applies_after_theme_classes_and_inline_spacing() {
        let palette = theme::Palette::new(false);
        let padding = Style::resolve(
            "NView",
            &json!({"className":"p-3","style":{"paddingBottom":48},"safeArea":{"insets":{"top":62,"bottom":34},"edges":{"top":"additive","bottom":"maximum"}}}),
            &palette,
            Conditions::default(),
            Vec2::splat(400.),
        );
        assert_eq!(padding.padding.top, 74.);
        assert_eq!(padding.padding.bottom, 48.);
        assert_eq!(padding.padding.left, 12.);
        let margin = Style::resolve(
            "NView",
            &json!({"className":"m-2","safeArea":{"mode":"margin","insets":{"bottom":34},"edges":["bottom"]}}),
            &palette,
            Conditions::default(),
            Vec2::splat(400.),
        );
        assert_eq!(margin.margin.bottom, 42.);
        assert_eq!(margin.margin.top, 8.);
    }
}
