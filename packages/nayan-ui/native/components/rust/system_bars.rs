//! Native window and system-bar policy belongs to NTheme; platform bridges apply resolved colors/flags.
use super::theme::Palette;
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SystemBars {
    pub enabled: i32,
    pub status_light: i32,
    pub navigation_light: i32,
    /// -1 inherits the window's original visibility; 0 shows; 1 hides.
    pub status_hidden: i32,
    pub navigation_hidden: i32,
    /// -1 follows the device; 0 is light; 1 is dark. Backgrounds are unpremultiplied ARGB.
    pub window_style: i32,
    pub background_light: u32,
    pub background_dark: u32,
    pub remember_window: i32,
}
impl Default for SystemBars {
    fn default() -> Self {
        Self {
            enabled: 0,
            status_light: 0,
            navigation_light: 0,
            status_hidden: -1,
            navigation_hidden: -1,
            window_style: -1,
            background_light: 0,
            background_dark: 0,
            remember_window: 0,
        }
    }
}
#[derive(Clone, Copy, Default, Deserialize)]
#[serde(rename_all = "lowercase")]
enum Style {
    #[default]
    Auto,
    Light,
    Dark,
}
#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Options {
    theme: Option<String>,
    #[serde(default)]
    status_bar_style: Style,
    #[serde(default)]
    navigation_bar_style: Style,
    status_bar_hidden: Option<bool>,
    navigation_bar_hidden: Option<bool>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Configuration {
    #[serde(default)]
    theme: Option<String>,
    colors: Option<serde_json::Value>,
    themes: Option<serde_json::Value>,
    #[serde(default)]
    system_dark: bool,
    #[serde(default)]
    depth: u16,
    #[serde(default)]
    options: Options,
}
struct Scope {
    order: u64,
    depth: u16,
    bars: SystemBars,
}
#[derive(Default)]
struct Scopes {
    next: u64,
    owners: HashMap<String, Scope>,
}
impl Scopes {
    fn set(&mut self, id: &str, command: &str) -> Option<SystemBars> {
        if id.is_empty() || id.len() > 128 || command.len() > 65536 {
            return None;
        }
        let config: Configuration = serde_json::from_str(command).ok()?;
        if config.depth > 256 || (!self.owners.contains_key(id) && self.owners.len() >= 1024) {
            return None;
        }
        let window_style = match config.theme.as_deref() {
            Some("dark" | "DARK") => 1,
            Some("light" | "LIGHT") => 0,
            _ => -1,
        };
        let background = |dark| {
            let palette = Palette::configure(
                &Palette::new(dark),
                &serde_json::json!({"theme":if dark {"dark"} else {"light"}, "colors":config.colors, "themes":config.themes}),
                dark,
            );
            let [r, g, b, a] = palette.get("background").to_srgba_unmultiplied();
            u32::from_be_bytes([a, r, g, b])
        };
        let background_light = background(false);
        let background_dark = background(true);
        let theme = config.options.theme.or(config.theme);
        let dark = Palette::configure(&Palette::new(config.system_dark), &serde_json::json!({"theme":theme}), config.system_dark).dark;
        let light = |style| {
            i32::from(match style {
                Style::Auto => dark,
                Style::Light => true,
                Style::Dark => false,
            })
        };
        let bars = SystemBars {
            enabled: 1,
            status_light: light(config.options.status_bar_style),
            navigation_light: light(config.options.navigation_bar_style),
            status_hidden: config.options.status_bar_hidden.map_or(-1, i32::from),
            navigation_hidden: config.options.navigation_bar_hidden.map_or(-1, i32::from),
            window_style,
            background_light,
            background_dark,
            remember_window: i32::from(config.depth == 0),
        };
        let order = self.owners.get(id).map_or_else(
            || {
                self.next += 1;
                self.next
            },
            |scope| scope.order,
        );
        self.owners.insert(
            id.into(),
            Scope {
                order,
                depth: config.depth,
                bars,
            },
        );
        Some(self.current())
    }
    fn remove(&mut self, id: &str) -> SystemBars {
        self.owners.remove(id);
        self.current()
    }
    fn current(&self) -> SystemBars {
        let mut scopes: Vec<_> = self.owners.values().collect();
        scopes.sort_unstable_by_key(|scope| (scope.depth, scope.order));
        let mut result = SystemBars::default();
        for scope in &scopes {
            let previous = result;
            result = scope.bars;
            if result.status_hidden == -1 {
                result.status_hidden = previous.status_hidden;
            }
            if result.navigation_hidden == -1 {
                result.navigation_hidden = previous.navigation_hidden;
            }
        }
        // Bars may follow a focused game's override, but the shallowest NTheme owns the
        // application's window background. Never persist a temporary nested screen theme.
        if let Some(first) = scopes.first() {
            let window = scopes.iter().rev().find(|scope| scope.depth == first.depth).unwrap().bars;
            result.window_style = window.window_style;
            result.background_light = window.background_light;
            result.background_dark = window.background_dark;
            result.remember_window = window.remember_window;
        }
        result
    }
}
fn scopes() -> &'static Mutex<Scopes> {
    static SCOPES: OnceLock<Mutex<Scopes>> = OnceLock::new();
    SCOPES.get_or_init(|| Mutex::new(Scopes::default()))
}
pub fn set(id: &str, configuration: &str) -> Option<SystemBars> {
    scopes().lock().ok()?.set(id, configuration)
}
pub fn remove(id: &str) -> Option<SystemBars> {
    Some(scopes().lock().ok()?.remove(id))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn resolves_theme_and_system_appearance_in_rust() {
        let mut scopes = Scopes::default();
        for (theme, system, expected) in [("dark", false, 1), ("light", true, 0), ("system", true, 1), ("system", false, 0)] {
            let bars = scopes
                .set("app", &serde_json::json!({"theme":theme,"systemDark":system}).to_string())
                .unwrap();
            assert_eq!((bars.status_light, bars.navigation_light), (expected, expected));
            assert_eq!((bars.status_hidden, bars.navigation_hidden), (-1, -1));
        }
    }
    #[test]
    fn nested_game_wins_even_if_parent_registers_later_or_changes_theme() {
        let mut scopes = Scopes::default();
        scopes.set("game", r#"{"theme":"dark","depth":1}"#).unwrap();
        assert_eq!(scopes.set("app", r#"{"theme":"light"}"#).unwrap().status_light, 1);
        scopes.set("app", r#"{"theme":"dark"}"#).unwrap();
        scopes.set("app", r#"{"theme":"light"}"#).unwrap();
        assert_eq!(scopes.remove("game").status_light, 0);
        assert_eq!(scopes.remove("app"), SystemBars::default());
    }
    #[test]
    fn updates_preserve_peer_priority_and_refocusing_reactivates_it() {
        let mut scopes = Scopes::default();
        scopes.set("first", r#"{"theme":"dark","depth":1}"#).unwrap();
        scopes.set("second", r#"{"theme":"light","depth":1}"#).unwrap();
        assert_eq!(scopes.set("first", r#"{"theme":"dark","depth":1}"#).unwrap().status_light, 0);
        scopes.remove("first");
        assert_eq!(scopes.set("first", r#"{"theme":"dark","depth":1}"#).unwrap().status_light, 1);
    }
    #[test]
    fn explicit_styles_and_visibility_are_scoped_and_restored() {
        let mut scopes = Scopes::default();
        scopes.set("app", r#"{"theme":"light","options":{"statusBarHidden":true}}"#).unwrap();
        let bars = scopes.set("game", r#"{"theme":"light","depth":1,"options":{"theme":"dark","statusBarStyle":"dark","navigationBarStyle":"light","navigationBarHidden":true}}"#).unwrap();
        assert_eq!(
            (bars.status_light, bars.navigation_light, bars.status_hidden, bars.navigation_hidden),
            (0, 1, 1, 1)
        );
        let restored = scopes.remove("game");
        assert_eq!((restored.status_hidden, restored.navigation_hidden), (1, -1));
    }
    #[test]
    fn rejects_invalid_commands_without_losing_the_previous_theme() {
        let mut scopes = Scopes::default();
        let original = scopes.set("app", r#"{"theme":"dark"}"#).unwrap();
        for command in [
            "null",
            "{} garbage",
            r#"{"depth":257}"#,
            r#"{"options":{"statusBarStyle":"invalid"}}"#,
            r#"{"options":{"statusBarHidden":"yes"}}"#,
        ] {
            assert!(scopes.set("app", command).is_none());
            assert_eq!(scopes.current(), original);
        }
        assert!(scopes.set("", "{}").is_none());
        assert_eq!(scopes.remove("unknown"), original);
    }
    #[test]
    fn window_colors_use_the_same_palette_variants_and_alpha_as_the_ui() {
        let mut scopes = Scopes::default();
        let state = scopes
            .set(
                "app",
                r##"{"theme":"system","colors":{"background":"#123"},"themes":{"dark":{"background":"#ff000080"}}}"##,
            )
            .unwrap();
        assert_eq!(state.window_style, -1);
        assert_eq!(state.background_light, 0xff112233);
        assert_eq!(state.background_dark, 0x80ff0000);
        assert_eq!(state.remember_window, 1);
    }
    #[test]
    fn focused_bar_overrides_never_replace_the_saved_app_window_palette() {
        let mut scopes = Scopes::default();
        let game = scopes
            .set("game", r##"{"theme":"dark","depth":1,"colors":{"background":"#abcdef"}}"##)
            .unwrap();
        assert_eq!(game.remember_window, 0);
        let state = scopes.set("app", r##"{"theme":"light","colors":{"background":"#123456"}}"##).unwrap();
        assert_eq!(state.status_light, 1);
        assert_eq!(state.window_style, 0);
        assert_eq!(state.background_light, 0xff123456);
        assert_eq!(state.remember_window, 1);
        let state = scopes.set("app", r##"{"theme":"dark","colors":{"background":"#654321"}}"##).unwrap();
        assert_eq!(state.window_style, 1);
        assert_eq!(state.background_dark, 0xff654321);
        assert_eq!(scopes.remove("game").background_dark, 0xff654321);
        assert_eq!(scopes.remove("app"), SystemBars::default());
    }
    #[test]
    fn bar_only_theme_overrides_do_not_force_native_interface_style() {
        let mut scopes = Scopes::default();
        let state = scopes.set("app", r#"{"theme":"light","options":{"theme":"dark"}}"#).unwrap();
        assert_eq!(state.status_light, 1);
        assert_eq!(state.window_style, 0);
        assert_eq!(state.background_light, 0xfff5f5f5);
    }
}
