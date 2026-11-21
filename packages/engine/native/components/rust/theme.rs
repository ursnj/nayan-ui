//! HeroUI semantic defaults shared by @nayan-ui/react and @nayan-ui/native.
//! sRGB values converted from their OKLCH tokens; Nayan uses an 8-point base radius.
use super::*;
use std::collections::BTreeMap;

const LIGHT: &[(&str, [u8; 3])] = &[
    ("background", [245, 245, 245]),
    ("foreground", [24, 24, 27]),
    ("surface", [255, 255, 255]),
    ("surface-secondary", [239, 239, 240]),
    ("surface-tertiary", [234, 234, 235]),
    ("muted", [113, 113, 122]),
    ("default", [235, 235, 236]),
    ("accent", [4, 133, 247]),
    ("accent-foreground", [252, 252, 252]),
    ("success", [23, 201, 100]),
    ("warning", [245, 165, 36]),
    ("danger", [255, 56, 60]),
    ("border", [222, 222, 224]),
    ("separator", [228, 228, 231]),
];
const DARK: &[(&str, [u8; 3])] = &[
    ("background", [6, 6, 7]),
    ("foreground", [252, 252, 252]),
    ("surface", [24, 24, 27]),
    ("surface-secondary", [35, 35, 37]),
    ("surface-tertiary", [38, 39, 40]),
    ("muted", [159, 159, 169]),
    ("default", [39, 39, 42]),
    ("accent", [4, 133, 247]),
    ("accent-foreground", [252, 252, 252]),
    ("success", [23, 201, 100]),
    ("warning", [247, 183, 80]),
    ("danger", [219, 59, 62]),
    ("border", [40, 40, 44]),
    ("separator", [33, 33, 36]),
];

#[derive(Clone)]
pub(super) struct Palette {
    pub dark: bool,
    pub native: bool,
    pub radius: f32,
    pub components: std::sync::Arc<BTreeMap<String, Value>>,
    overrides: BTreeMap<String, Color32>,
}

impl Palette {
    pub fn new(dark: bool) -> Self {
        Self {
            dark,
            native: false,
            radius: 8.,
            components: Default::default(),
            overrides: BTreeMap::new(),
        }
    }

    pub fn platform(dark: bool, native: bool) -> Self {
        let mut palette = Self::new(dark);
        palette.native = native;
        palette
    }

    pub fn configure(parent: &Self, props: &Value, system_dark: bool) -> Self {
        let dark = match props["theme"].as_str() {
            Some("dark" | "DARK") => true,
            Some("light" | "LIGHT") => false,
            Some("system") => system_dark,
            _ => parent.dark,
        };
        let mut result = if dark == parent.dark { parent.clone() } else { Self::new(dark) };
        result.native = parent.native;
        result.components = parent.components.clone();
        if let Some(components) = props["components"].as_object() {
            result.components = std::sync::Arc::new(components.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
        }
        result.radius = props["radius"]
            .as_f64()
            .filter(|v| v.is_finite())
            .map(|v| v.clamp(0., 64.) as f32)
            .unwrap_or(parent.radius);
        for colors in [props.get("colors"), props["themes"].get(if dark { "dark" } else { "light" })]
            .into_iter()
            .flatten()
        {
            if let Some(colors) = colors.as_object() {
                for (name, value) in colors {
                    if let Some(color) = value.as_str().and_then(parse_color) {
                        result.overrides.insert(name.clone(), color);
                    }
                }
            }
        }
        result
    }

    /// Stylesheet tokens supply defaults; explicit NTheme colors retain priority.
    pub fn inherit_color(&mut self, name: &str, color: Color32) {
        self.overrides.entry(name.to_owned()).or_insert(color);
    }

    pub fn color(&self, name: &str) -> Option<Color32> {
        if let Some(c) = self.overrides.get(name) {
            return Some(*c);
        }
        if self.native && name == "separator" {
            return Some(if self.dark {
                Color32::from_rgb(71, 71, 75)
            } else {
                Color32::from_rgb(169, 169, 172)
            });
        }
        let alias = match name {
            "surface-foreground" | "overlay-foreground" | "field-foreground" | "link" => "foreground",
            "overlay" | "field-background" => "surface",
            "field-placeholder" => "muted",
            "focus" | "action" => "accent",
            "action-foreground" => "accent-foreground",
            "field-border" => "border",
            "default-foreground" => "foreground",
            "success-foreground" | "warning-foreground" => return Some(Color32::from_rgb(24, 24, 27)),
            "danger-foreground" => "accent-foreground",
            _ => name,
        };
        if let Some(color) = self.overrides.get(alias) {
            return Some(*color);
        }
        (if self.dark { DARK } else { LIGHT })
            .iter()
            .find(|(n, _)| *n == alias)
            .map(|(_, c)| Color32::from_rgb(c[0], c[1], c[2]))
    }

    pub fn get(&self, name: &str) -> Color32 {
        self.color(name).unwrap_or(Color32::TRANSPARENT)
    }

    pub fn visuals(&self) -> egui::Visuals {
        let mut v = if self.dark { egui::Visuals::dark() } else { egui::Visuals::light() };
        v.override_text_color = Some(self.get("foreground"));
        v.weak_text_color = Some(self.get("muted"));
        v.panel_fill = self.get("background");
        v.window_fill = self.get("surface");
        v.extreme_bg_color = self.get("field-background");
        v.text_edit_bg_color = Some(self.get("field-background"));
        v.faint_bg_color = self.get("surface-secondary");
        v.code_bg_color = self.get("surface-secondary");
        v.selection.bg_fill = self.get("accent");
        v.selection.stroke.color = self.get("accent-foreground");
        v.hyperlink_color = self.get("link");
        v.warn_fg_color = self.get("warning");
        v.error_fg_color = self.get("danger");
        v.window_corner_radius = egui::CornerRadius::same(self.radius as u8);
        v.menu_corner_radius = egui::CornerRadius::same(self.radius as u8);
        for w in [
            &mut v.widgets.noninteractive,
            &mut v.widgets.inactive,
            &mut v.widgets.hovered,
            &mut v.widgets.active,
            &mut v.widgets.open,
        ] {
            w.corner_radius = egui::CornerRadius::same(self.radius as u8);
            w.fg_stroke.color = self.get("foreground");
            w.bg_fill = self.get("default");
            w.weak_bg_fill = self.get("default");
            w.bg_stroke = egui::Stroke::new(1., self.get("border"));
        }
        v.disabled_alpha = 0.5;
        v
    }
}

pub(super) fn parse_color(value: &str) -> Option<Color32> {
    if value == "transparent" {
        return Some(Color32::TRANSPARENT);
    }
    if let Some(hex) = value.strip_prefix('#') {
        let digits: String = if hex.len() == 3 || hex.len() == 4 {
            hex.chars().flat_map(|c| [c, c]).collect()
        } else {
            hex.into()
        };
        if digits.len() == 6 || digits.len() == 8 {
            let n = u32::from_str_radix(&digits, 16).ok()?;
            let (rgb, a) = if digits.len() == 8 { (n >> 8, n as u8) } else { (n, 255) };
            return Some(Color32::from_rgba_unmultiplied((rgb >> 16) as u8, (rgb >> 8) as u8, rgb as u8, a));
        }
        return None;
    }
    value
        .parse::<svgtypes::Color>()
        .ok()
        .map(|c| Color32::from_rgba_unmultiplied(c.red, c.green, c.blue, c.alpha))
}

impl Default for Palette {
    fn default() -> Self {
        Self::new(false)
    }
}
