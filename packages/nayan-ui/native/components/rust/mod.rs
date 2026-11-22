//! Declarative UI on the engine's existing GPU. React only describes nodes and handles events;
//! layout, control state, hit testing, focus, text and tessellation stay in Rust.
pub(crate) mod capture;
mod carousel;
mod confetti;
#[cfg(any(target_arch = "wasm32", test))]
mod css;
mod date;
mod flow_list;
mod fonts;
mod glyphs;
pub(crate) mod icon;
mod image;
pub(crate) mod image_decode;
mod keyboard;
mod layout;
mod linkify;
mod list;
mod loading;
mod palette;
mod pattern;
pub(crate) mod platform_style;
mod press;
mod rich_text;
mod scroll;
mod select;
mod style;
pub(crate) mod surface;
pub(crate) mod system_bars;
mod text_selection;
mod theme;
pub(crate) mod toast;
#[cfg(any(target_arch = "wasm32", test))]
pub(crate) mod utilities;
use egui::{Color32, Event, Key, Modifiers, PointerButton, Pos2, RawInput, Rect, Response, Vec2};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{
    collections::{BTreeMap, HashMap, HashSet},
    sync::Arc,
};

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Node {
    pub id: String,
    pub kind: String,
    #[serde(default)]
    pub props: Value,
    #[serde(default)]
    pub children: Vec<Node>,
}

/// A paint-order marker consumed by the GPU before the element's fill and children.
#[derive(Clone, Copy)]
pub(crate) struct Backdrop {
    pub blur: f32,
    pub corners: egui::CornerRadius,
}

#[derive(Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Semantic {
    id: String,
    kind: String,
    label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    heading_level: Option<u8>,
    value: Value,
    disabled: bool,
    rect: [f32; 4],
    #[serde(skip)]
    focus_id: egui::Id,
    read_only: bool,
    max_length: Option<usize>,
    secret: bool,
    multiline: bool,
    input_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    keyboard_type: Option<String>,
    platform_edit: bool,
    min: f64,
    max: f64,
    step: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    expanded: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    multiple: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    selected: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    select_owner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    active_descendant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    value_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    editor: Option<Value>,
}

#[derive(Default)]
pub struct ComponentDocument {
    pub context: egui::Context,
    #[cfg(any(target_arch = "wasm32", test))]
    css: Option<css::Document>,
    #[cfg(any(target_arch = "wasm32", test))]
    entrance_started: HashMap<String, css::EntrancePlayback>,
    #[cfg(any(target_arch = "wasm32", test))]
    entrances_paused: bool,
    #[cfg(any(target_arch = "wasm32", test))]
    settle_visible_entrances: bool,
    root_scroll: f32,
    tree: Arc<[Node]>,
    select_keys: HashMap<String, Vec<Key>>,
    values: HashMap<String, Value>,
    platform_edits: HashSet<String>,
    platform_inputs: bool,
    input_cache: HashMap<String, Semantic>,
    input: Vec<Event>,
    input_fields: Vec<String>,
    input_focus: Option<String>,
    semantics: Vec<Semantic>,
    events: Vec<Value>,
    revision: u64,
    elapsed: f64,
    last_present: Option<f64>,
    semantics_sent: Option<f64>,
    semantics_stale: bool,
    cursor: &'static str,
    selection: text_selection::Selection,
    pointer_down: bool,
    touch_origin: Option<Pos2>,
    drag_target: Option<egui::Id>,
    scroll_targets: Vec<scroll::ScrollTarget>,
    palette: theme::Palette,
    previous_semantics: Vec<Semantic>,
    previous_focus: Option<(egui::Id, Option<String>)>,
    layout_rects: HashMap<String, Rect>,
    layout_clips: HashMap<String, Rect>,
    interaction_clip: Option<Rect>,
    pub(crate) background: Color32,
    surface_background: Option<Color32>,
    font_scale: f32,
    dark: bool,
    native: bool,
    reduced_motion: bool,
    overlay_ids: HashSet<String>,
    fonts_ready: bool,
    #[cfg(any(target_arch = "wasm32", test))]
    stylesheet_fonts: Option<egui::FontDefinitions>,
    images: image::Images,
    content_size: [f32; 2],
    lists: HashMap<String, list::ListState>,
    flow_lists: HashMap<String, flow_list::FlowListState>,
    carousels: HashMap<String, carousel::CarouselState>,
    confetti: HashMap<String, (u64, f64)>,
    icons: HashMap<String, egui::TextureHandle>,
    patterns: HashMap<String, pattern::Pattern>,
    row_widths: HashMap<String, f32>,
    presses: HashMap<String, press::PressState>,
}

fn string(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        _ => String::new(),
    }
}

/// Only the surface's page owns its indicator; nested lists retain their own policies.
fn root_scrollbar(nodes: &[Node]) -> egui::scroll_area::ScrollBarVisibility {
    match nodes.first() {
        Some(node) if node.kind == "NTheme" => root_scrollbar(&node.children),
        Some(node) if node.props["showsVerticalScrollIndicator"] == false => egui::scroll_area::ScrollBarVisibility::AlwaysHidden,
        _ => egui::scroll_area::ScrollBarVisibility::VisibleWhenNeeded,
    }
}

fn complex_button(n: &Node) -> bool {
    n.kind == "NButton" && n.children.iter().any(|child| child.kind != "NText")
}

fn text(n: &Node) -> String {
    let p = &n.props;
    if n.kind == "NIcon" {
        return ["accessibilityLabel", "aria-label", "ariaLabel"]
            .iter()
            .find_map(|key| p[*key].as_str())
            .unwrap_or("")
            .to_owned();
    }
    for key in ["label", "title", "name", "text", "message", "fallback", "alt"] {
        let s = string(&p[key]);
        if !s.is_empty() {
            return s;
        }
    }
    let value = n.children.iter().map(text).collect::<Vec<_>>().join("");
    if value.is_empty() {
        match n.kind.as_str() {
            "NProgress" => "Progress".into(),
            "NLoading" => "Loading".into(),
            "NCloseButton" => "Close".into(),
            _ => value,
        }
    } else {
        value
    }
}

fn flag(p: &Value, keys: &[&str]) -> bool {
    keys.iter().any(|k| p[*k] == true)
}

fn numeric(p: &Value, keys: &[&str], default: f64) -> f64 {
    keys.iter().find_map(|k| p[*k].as_f64()).filter(|v| v.is_finite()).unwrap_or(default)
}
const SEMANTICS_INTERVAL: f64 = 0.1;
fn absolute(node: &Node) -> bool {
    node.props["className"]
        .as_str()
        .is_some_and(|c| c.split_whitespace().any(|class| class == "absolute"))
}

/// Outer shadows must not add another tint beneath translucent fills.
fn outer_shadow_clips(rect: Rect, clip: Rect) -> [Rect; 4] {
    [
        Rect::from_min_max(clip.min, Pos2::new(clip.right(), rect.top())),
        Rect::from_min_max(Pos2::new(clip.left(), rect.bottom()), clip.max),
        Rect::from_min_max(Pos2::new(clip.left(), rect.top()), Pos2::new(rect.left(), rect.bottom())),
        Rect::from_min_max(Pos2::new(rect.right(), rect.top()), Pos2::new(clip.right(), rect.bottom())),
    ]
    .map(|outside| outside.intersect(clip))
}

/// A rounded box filled with a vertical gradient; colors are premultiplied, so a transparent stop
/// fades the other color's coverage without darkening it.
fn gradient_shape(rect: Rect, corners: egui::CornerRadius, gradient: style::Gradient) -> egui::Shape {
    use std::f32::consts::{FRAC_PI_2, PI};
    if !rect.is_positive() {
        return egui::Shape::Noop;
    }
    let limit = rect.width().min(rect.height()) / 2.;
    let radius = |r: u8| (r as f32).min(limit);
    let (nw, ne, sw, se) = (radius(corners.nw), radius(corners.ne), radius(corners.sw), radius(corners.se));
    let mut ring = Vec::new();
    for (center, r, start) in [
        (Pos2::new(rect.left() + nw, rect.top() + nw), nw, PI),
        (Pos2::new(rect.right() - ne, rect.top() + ne), ne, PI * 1.5),
        (Pos2::new(rect.right() - se, rect.bottom() - se), se, 0.),
        (Pos2::new(rect.left() + sw, rect.bottom() - sw), sw, FRAC_PI_2),
    ] {
        let steps = if r > 0. { 8 } else { 0 };
        for step in 0..=steps {
            ring.push(center + r * Vec2::angled(start + FRAC_PI_2 * step as f32 / steps.max(1) as f32));
        }
    }
    let (top, bottom) = if gradient.down {
        (gradient.from, gradient.to)
    } else {
        (gradient.to, gradient.from)
    };
    let color = |y: f32| {
        let t = ((y - rect.top()) / rect.height()).clamp(0., 1.);
        let mix = |a: u8, b: u8| (a as f32 + (b as f32 - a as f32) * t).round() as u8;
        Color32::from_rgba_premultiplied(
            mix(top.r(), bottom.r()),
            mix(top.g(), bottom.g()),
            mix(top.b(), bottom.b()),
            mix(top.a(), bottom.a()),
        )
    };
    let mut mesh = egui::Mesh::default();
    mesh.colored_vertex(rect.center(), color(rect.center().y));
    for point in &ring {
        mesh.colored_vertex(*point, color(point.y));
    }
    let count = ring.len() as u32;
    for index in 0..count {
        mesh.add_triangle(0, 1 + index, 1 + (index + 1) % count);
    }
    egui::Shape::mesh(mesh)
}

fn clock_seconds() -> f64 {
    #[cfg(not(target_arch = "wasm32"))]
    {
        static START: std::sync::LazyLock<std::time::Instant> = std::sync::LazyLock::new(std::time::Instant::now);
        START.elapsed().as_secs_f64()
    }
    #[cfg(target_arch = "wasm32")]
    {
        js_sys::Date::now() / 1000.
    }
}

impl ComponentDocument {
    pub fn set_tree(&mut self, value: &Value) -> Result<(), String> {
        let mut tree: Vec<Node> = serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
        fn validate(nodes: &[Node], depth: usize, ids: &mut HashSet<String>) -> Result<(), String> {
            if depth > 64 {
                return Err("UI exceeds 64 levels".into());
            }
            for n in nodes {
                if n.id.is_empty() || !ids.insert(n.id.clone()) || ids.len() > 5000 {
                    return Err("UI requires unique ids and at most 5000 nodes".into());
                }
                if !matches!(
                    n.kind.as_str(),
                    "NTheme"
                        | "NConfetti"
                        | "NCarousel"
                        | "NList"
                        | "NListFooter"
                        | "NListItem"
                        | "NListHeader"
                        | "NListStickyHeader"
                        | "NListEmpty"
                        | "NCard"
                        | "NView"
                        | "NImage"
                        | "NPattern"
                        | "NText"
                        | "NButton"
                        | "NPress"
                        | "NCloseButton"
                        | "NCheck"
                        | "NSwitch"
                        | "NToggleButton"
                        | "NInput"
                        | "NTextarea"
                        | "NSearchField"
                        | "NInputOtp"
                        | "NSlider"
                        | "NNumberField"
                        | "NProgress"
                        | "NLoading"
                        | "NDivider"
                        | "NChip"
                        | "NBadge"
                        | "NRequired"
                        | "NKbd"
                        | "NCode"
                        | "NLink"
                        | "NTooltip"
                        | "NScrollShadow"
                        | "NRadio"
                        | "NRadioGroup"
                        | "NButtonGroup"
                        | "NTabs"
                        | "NTabsContent"
                        | "NSelect"
                        | "NDatePicker"
                        | "NAlert"
                        | "NEmptyState"
                        | "NActionItem"
                        | "NMenuItem"
                        | "NSkeleton"
                        | "NSkeletonGroup"
                        | "NIcon"
                ) {
                    return Err(format!("Unsupported engine UI component: {}", n.kind));
                }
                if n.kind == "NList" {
                    list::validate(&n.props)?;
                }
                if n.kind == "NPattern" {
                    pattern::validate(&n.props["recipe"])?;
                }
                validate(&n.children, depth + 1, ids)?;
            }
            Ok(())
        }

        fn input_aliases(nodes: &mut [Node]) {
            for node in nodes {
                fn flatten(value: &Value, output: &mut serde_json::Map<String, Value>) {
                    if let Some(values) = value.as_array() {
                        for v in values {
                            flatten(v, output);
                        }
                    } else if let Some(values) = value.as_object() {
                        output.extend(values.clone());
                    }
                }
                for key in ["style", "linkStyle"] {
                    if node.props[key].is_array() {
                        let mut style = serde_json::Map::new();
                        flatten(&node.props[key], &mut style);
                        node.props[key] = Value::Object(style);
                    }
                }
                if node.kind == "NSelect" {
                    for key in ["selectClassName", "triggerClassName"] {
                        if let Some(class) = node.props[key].as_str() {
                            node.props["className"] = json!(format!("{} {}", node.props["className"].as_str().unwrap_or(""), class));
                        }
                    }
                }
                if matches!(node.kind.as_str(), "NInput" | "NTextarea" | "NSearchField" | "NInputOtp") {
                    let area = node.kind == "NTextarea" || node.props["multiline"] == true;
                    let nested = node.props[if area { "textAreaProps" } else { "inputProps" }].clone();
                    for key in [
                        "maxLength",
                        "secureTextEntry",
                        "keyboardType",
                        "autoCapitalize",
                        "autoComplete",
                        "autoCorrect",
                        "autoFocus",
                        "inputMode",
                        "returnKeyType",
                    ] {
                        if let Some(value) = nested.get(key) {
                            node.props[key] = value.clone();
                        }
                    }
                    if let Some(class) = nested["className"].as_str() {
                        node.props["className"] = json!(format!("{} {}", node.props["className"].as_str().unwrap_or(""), class));
                    }
                }
                input_aliases(&mut node.children);
            }
        }
        input_aliases(&mut tree);
        layout::page_safe_area(&mut tree);
        #[cfg(feature = "markdown")]
        crate::markdown::expand(&mut tree)?;
        let mut ids = HashSet::new();
        validate(&tree, 0, &mut ids)?;
        fn sync_inputs(nodes: &[Node], values: &mut HashMap<String, Value>, platform: &mut HashSet<String>) {
            for node in nodes {
                if matches!(node.kind.as_str(), "NInput" | "NTextarea" | "NSearchField" | "NInputOtp") {
                    if let Some(value) = node.props.get("value") {
                        if values.get(&node.id) != Some(value) {
                            platform.remove(&node.id);
                        }
                        values.insert(node.id.clone(), value.clone());
                    }
                }
                sync_inputs(&node.children, values, platform);
            }
        }
        sync_inputs(&tree, &mut self.values, &mut self.platform_edits);
        self.select_keys.retain(|id, _| ids.contains(id));
        self.values.retain(|id, _| {
            ids.contains(id)
                || id
                    .rsplit_once(':')
                    .is_some_and(|(owner, state)| matches!(state, "search" | "cursor" | "filter") && ids.contains(owner))
        });
        self.platform_edits.retain(|id| ids.contains(id));
        self.input_cache.retain(|id, _| ids.contains(id));
        self.layout_rects.retain(|id, _| ids.contains(id));
        self.layout_clips.retain(|id, _| ids.contains(id));
        self.lists.retain(|id, _| ids.contains(id));
        self.flow_lists.retain(|id, _| ids.contains(id));
        self.carousels.retain(|id, _| ids.contains(id));
        self.confetti.retain(|id, _| ids.contains(id));
        self.row_widths.retain(|id, _| ids.contains(id));
        self.presses.retain(|id, _| ids.contains(id));
        self.patterns.retain(|id, _| ids.contains(id));
        self.images.sync(&tree);
        self.drain_image_events();
        #[cfg(any(target_arch = "wasm32", test))]
        if let Some(css) = &mut self.css {
            css.invalidate();
        }
        self.tree = tree.into();
        self.revision += 1;
        Ok(())
    }

    pub fn touch(&mut self, phase: i32, x: f32, y: f32) {
        if !x.is_finite() || !y.is_finite() {
            return;
        }
        let pos = Pos2::new(x, y);
        if phase == 0 {
            // A fresh contact has no movement delta from an earlier mouse hover or wheel
            // target. Otherwise egui's drag-to-scroll applies that gap on the press frame.
            self.context.input_mut(|input| input.pointer = Default::default());
            self.touch_origin = Some(pos);
            self.drag_target = None;
        }
        if phase == 1 && self.drag_target.is_none() {
            if let Some(start) = self.touch_origin {
                let delta = pos - start;
                if delta.length() >= 8. {
                    let horizontal = delta.x.abs() > delta.y.abs();
                    self.drag_target = self
                        .scroll_targets
                        .iter()
                        .find(|target| target.horizontal == horizontal && target.rect.contains(start))
                        .map(|target| target.drag_id);
                }
            }
        }
        if phase == 3 {
            self.pointer_down = false;
            self.touch_origin = None;
            self.drag_target = None;
            self.context.stop_dragging();
            self.input.clear();
            self.context.input_mut(|input| input.pointer = Default::default());
            self.input.push(Event::Touch {
                device_id: egui::TouchDeviceId(0),
                id: egui::TouchId(0),
                phase: egui::TouchPhase::Cancel,
                pos,
                force: None,
            });
            self.input.push(Event::PointerGone);
            return;
        }
        self.input.push(Event::Touch {
            device_id: egui::TouchDeviceId(0),
            id: egui::TouchId(0),
            phase: match phase {
                0 => egui::TouchPhase::Start,
                2 => egui::TouchPhase::End,
                _ => egui::TouchPhase::Move,
            },
            pos,
            force: None,
        });
        self.input.push(Event::PointerMoved(pos));
        if phase == 0 || phase == 2 {
            self.pointer_down = phase == 0;
            self.input.push(Event::PointerButton {
                pos,
                button: PointerButton::Primary,
                pressed: phase == 0,
                modifiers: Modifiers::NONE,
            });
        }
        if phase == 2 {
            // Touches have no hover. A remembered lift point would make the next touch's first
            // frame a drag from there, jumping a scroll area by the distance between the two.
            self.input.push(Event::PointerGone);
        }
    }

    pub fn scroll(&mut self, x: f32, y: f32) {
        self.input.push(Event::MouseWheel {
            unit: egui::MouseWheelUnit::Point,
            phase: egui::TouchPhase::Move,
            source: egui::MouseWheelSource::Unknown,
            delta: Vec2::new(x, y),
            modifiers: Modifiers::NONE,
        });
    }

    pub fn command(&mut self, v: &Value) -> Result<Value, String> {
        match v["action"].as_str().unwrap_or("") {
            "textSelection" => {
                let revision = self.selection.revision;
                let point = Pos2::new(numeric(v, &["x"], 0.) as f32, numeric(v, &["y"], 0.) as f32);
                if matches!(
                    v["phase"].as_str(),
                    Some("start" | "move" | "end" | "touchStart" | "touchMove" | "touchEnd" | "word" | "block")
                ) && self.semantics.iter().any(|node| {
                    node.id == text_selection::COPY_ID
                        && Rect::from_min_size(Pos2::new(node.rect[0], node.rect[1]), Vec2::new(node.rect[2], node.rect[3])).contains(point)
                }) {
                    return Ok(json!({"handled":false,"text":self.selection.text,"revision":self.revision}));
                }
                let blocked = matches!(v["phase"].as_str(), Some("start" | "touchStart" | "word" | "block"))
                    && self
                        .semantics
                        .iter()
                        .rev()
                        .find(|node| {
                            Rect::from_min_size(Pos2::new(node.rect[0], node.rect[1]), Vec2::new(node.rect[2], node.rect[3])).contains(point)
                        })
                        .is_some_and(|node| {
                            matches!(
                                node.kind.as_str(),
                                "NButton"
                                    | "NPress"
                                    | "NCloseButton"
                                    | "NCheck"
                                    | "NSwitch"
                                    | "NSelect"
                                    | "NDatePicker"
                                    | "NInput"
                                    | "NTextarea"
                                    | "NSearchField"
                                    | "NInputOtp"
                                    | "NSlider"
                                    | "NMenuItem"
                                    | "NActionItem"
                            )
                        });
                let cleared = json!({"phase":"clear"});
                let handled = self.selection.command(if blocked { &cleared } else { v });
                if self.selection.revision != revision {
                    self.revision += 1;
                }
                return Ok(json!({"handled":handled,"text":self.selection.text,"revision":self.revision}));
            }
            "tree" => self.set_tree(&v["nodes"])?,
            "environment" => {
                if let Some(platform) = v["platformInputs"].as_bool() {
                    self.platform_inputs = platform;
                }
                if v.get("surfaceBackground").is_some() {
                    self.surface_background = v["surfaceBackground"].as_str().and_then(theme::parse_color);
                    self.revision += 1;
                }
                if let Some(ids) = v["overlays"].as_array() {
                    self.overlay_ids = ids.iter().filter_map(Value::as_str).map(str::to_owned).collect();
                    self.revision += 1;
                }
                if v.get("fontScale").is_some() {
                    self.font_scale = numeric(v, &["fontScale"], 1.).clamp(0.5, 4.) as f32;
                }
                if let Some(native) = v["native"].as_bool() {
                    self.native = native;
                }
                if let Some(dark) = v["dark"].as_bool() {
                    self.dark = dark;
                }
                if let Some(reduced) = v["reducedMotion"].as_bool() {
                    self.reduced_motion = reduced;
                }
                #[cfg(any(target_arch = "wasm32", test))]
                {
                    if let Some(ready) = v["entrancesReady"].as_bool() {
                        self.entrances_paused = !ready;
                    }
                    if let Some(settle) = v["settleVisibleEntrances"].as_bool() {
                        self.settle_visible_entrances = settle;
                    }
                }
            }
            "inputSelection" => self.input_selection(v)?,
            "focusInput" => {
                let id = v["id"].as_str().ok_or("Missing input id")?;
                if !self.input_fields.iter().any(|field| field == id) {
                    return Err("Input is hidden, disabled, read-only or unavailable".into());
                }
                self.close_selects_on_focus(id);
                self.input_focus = Some(id.into());
                #[cfg(any(target_arch = "wasm32", test))]
                if let Some(css) = self.css.as_mut() {
                    css.scroll(Some(id), None);
                }
                self.context.request_repaint();
            }
            "activate" | "value" | "focus" | "increment" | "decrement" => {
                let id = v["id"].as_str().ok_or("Missing UI id")?;
                let node = self
                    .semantics
                    .iter()
                    .find(|n| n.id == id && !n.disabled)
                    .cloned()
                    .or_else(|| {
                        (v["platform"] == true && self.input_fields.iter().any(|field| field == id))
                            .then(|| self.input_cache.get(id).cloned())
                            .flatten()
                    })
                    .ok_or("UI node is unavailable")?;
                if v["action"] == "focus" {
                    self.close_selects_on_focus(id);
                    self.context.memory_mut(|m| m.request_focus(node.focus_id));
                    if let Some(owner) = &node.select_owner {
                        if let Some(index) = node
                            .id
                            .strip_prefix(&format!("{owner}:option:"))
                            .and_then(|value| value.parse::<usize>().ok())
                        {
                            self.values.insert(format!("{owner}:cursor"), json!(index));
                        }
                    }
                } else if v["action"] == "activate" {
                    let [x, y, w, h] = node.rect;
                    self.touch(0, x + w / 2., y + h / 2.);
                    self.touch(2, x + w / 2., y + h / 2.);
                } else {
                    if node.read_only {
                        return Err("UI node is read only".into());
                    }
                    let value = if matches!(node.kind.as_str(), "NSlider" | "NNumberField" | "NCarousel") {
                        let step = node.step.max(f64::EPSILON);
                        let value = match v["action"].as_str() {
                            Some("increment" | "decrement") => {
                                let current = self.values.get(id).unwrap_or(&node.value).as_f64().unwrap_or(node.min);
                                current + if v["action"] == "increment" { step } else { -step }
                            }
                            _ => v["value"].as_f64().filter(|v| v.is_finite()).ok_or("Expected a finite number")?,
                        };
                        let snapped = ((value - node.min) / step).round() * step + node.min;
                        json!(snapped.clamp(node.min, node.max.max(node.min)))
                    } else if matches!(node.kind.as_str(), "NInput" | "NTextarea" | "NSearchField" | "NInputOtp") {
                        if !v["value"].is_string() {
                            return Err("Expected text".into());
                        }
                        let text = v["value"].as_str().unwrap();
                        json!(text.chars().take(node.max_length.unwrap_or(usize::MAX)).collect::<String>())
                    } else {
                        return Err("UI node does not accept text or numeric input".into());
                    };
                    self.values.insert(id.into(), value.clone());
                    let platform = v["platform"] == true;
                    if platform {
                        self.platform_edits.insert(id.into());
                    } else {
                        self.platform_edits.remove(id);
                    }
                    if let Some(semantic) = self.semantics.iter_mut().find(|node| node.id == id) {
                        semantic.value = value.clone();
                        semantic.platform_edit = platform;
                    }
                    if v["selection"].is_object() {
                        self.input_selection(&json!({"id":id,"value":value,"start":v["selection"]["start"],"end":v["selection"]["end"]}))?;
                    }
                    self.change(id, value);
                }
            }
            "sheetDrag" => {
                let x = v["x"].as_f64().filter(|x| x.is_finite()).ok_or("Expected a finite x coordinate")? as f32;
                let y = v["y"].as_f64().filter(|y| y.is_finite()).ok_or("Expected a finite y coordinate")? as f32;
                return Ok(json!({"allowed":self.can_start_sheet_drag(Pos2::new(x, y))}));
            }
            "bounds" => {
                let id = v["id"].as_str().ok_or("Missing UI id")?;
                let rect = self.layout_rects.get(id).ok_or("UI node is not laid out")?;
                return Ok(json!({"rect":[rect.min.x,rect.min.y,rect.width(),rect.height()]}));
            }
            "listPlan" => return self.plan_list(v),
            "listScroll" => self.scroll_list(v)?,
            "pointer" => {
                if v["gone"] == true {
                    self.input.push(Event::PointerGone);
                } else {
                    self.input.push(Event::PointerMoved(Pos2::new(
                        numeric(v, &["x"], 0.) as f32,
                        numeric(v, &["y"], 0.) as f32,
                    )));
                }
            }
            "key" => {
                let key = match v["key"].as_str().unwrap_or("") {
                    "Tab" => Key::Tab,
                    "Enter" => Key::Enter,
                    " " => Key::Space,
                    "Escape" => Key::Escape,
                    "ArrowLeft" => Key::ArrowLeft,
                    "ArrowRight" => Key::ArrowRight,
                    "ArrowUp" => Key::ArrowUp,
                    "ArrowDown" => Key::ArrowDown,
                    "Backspace" => Key::Backspace,
                    "Delete" => Key::Delete,
                    "Home" => Key::Home,
                    "End" => Key::End,
                    _ => return Err("Unknown UI key".into()),
                };
                let modifiers = Modifiers {
                    shift: v["shift"] == true,
                    ctrl: v["ctrl"] == true,
                    command: v["command"] == true,
                    ..Default::default()
                };
                let target = self.select_key_target(v["id"].as_str(), key);
                let handled = target.is_some();
                if let Some(id) = target {
                    if v["pressed"] != false {
                        self.select_keys.entry(id).or_default().push(key);
                    }
                } else if v["selectOnly"] != true {
                    self.input.push(Event::Key {
                        key,
                        physical_key: None,
                        pressed: v["pressed"] != false,
                        repeat: false,
                        modifiers,
                    });
                }
                if v["selectOnly"] == true {
                    return Ok(json!({"handled":handled}));
                }
            }
            "scroll" => self.input.push(Event::MouseWheel {
                unit: egui::MouseWheelUnit::Point,
                phase: egui::TouchPhase::Move,
                source: egui::MouseWheelSource::Unknown,
                delta: Vec2::new(numeric(v, &["x"], 0.) as f32, numeric(v, &["y"], 0.) as f32),
                modifiers: Modifiers::NONE,
            }),
            "cancel" => self.touch(3, 0., 0.),
            #[cfg(any(target_arch = "wasm32", test))]
            "submit" => {
                if let Some(css) = self.css.take() {
                    css.submit(self, v["id"].as_str().unwrap_or(""));
                    self.css = Some(css);
                }
            }
            #[cfg(any(target_arch = "wasm32", test))]
            "scrollToId" | "pageScroll" => {
                if let Some(css) = self.css.as_mut() {
                    let offset = if v["action"] == "pageScroll" {
                        Some(
                            v["offset"]
                                .as_f64()
                                .unwrap_or(self.root_scroll as f64 + v["delta"].as_f64().unwrap_or(0.)) as f32,
                        )
                    } else {
                        None
                    };
                    css.scroll(v["id"].as_str(), offset);
                }
            }
            #[cfg(any(target_arch = "wasm32", test))]
            "stylesheetLayout" => {
                return Ok(self.css.as_ref().map_or(Value::Null, css::Document::inspect));
            }
            #[cfg(any(target_arch = "wasm32", test))]
            "stylesheet" => {
                let stylesheet = &v["stylesheet"];
                let css = css::Document::load(stylesheet)?;
                let definitions = stylesheet
                    .get("font")
                    .map(|value| fonts::custom(fonts::decode(value)?, None))
                    .transpose()?;
                if let Some(definitions) = &definitions {
                    fonts::install(&self.context, definitions.clone());
                    self.fonts_ready = true;
                }
                self.stylesheet_fonts = definitions;
                self.css = Some(css);
            }
            "fonts" | "resetFonts" => {
                let definitions = if v["action"] == "fonts" {
                    Some(fonts::custom(
                        fonts::decode(&v["regular"])?,
                        v.get("bold").filter(|v| !v.is_null()).map(fonts::decode).transpose()?,
                    )?)
                } else {
                    #[cfg(any(target_arch = "wasm32", test))]
                    let restored = self.stylesheet_fonts.clone();
                    #[cfg(not(any(target_arch = "wasm32", test)))]
                    let restored = None;
                    restored
                };
                match definitions {
                    Some(definitions) => fonts::install(&self.context, definitions),
                    None => fonts::configure(&self.context),
                }
                self.fonts_ready = true;
                for list in self.flow_lists.values_mut() {
                    list.invalidate_measurements();
                }
                #[cfg(any(target_arch = "wasm32", test))]
                if let Some(css) = &mut self.css {
                    css.invalidate();
                }
            }
            "state" => {}
            _ => return Err("Unknown UI action".into()),
        }
        Ok(if v["snapshot"] == false {
            Value::Null
        } else if v["acknowledge"] == true && v["compact"] == true {
            json!({"partial":true,"revision":self.revision,"nodes":self.semantics.iter().filter(|node| Some(node.id.as_str()) == v["id"].as_str()).collect::<Vec<_>>(),"events":std::mem::take(&mut self.events)})
        } else if v["acknowledge"] == true {
            self.take_snapshot()
        } else {
            self.snapshot()
        })
    }
    /// Actual layout bounds before viewport clipping, for native layout diagnostics.
    pub fn layout_bounds(&self, id: &str) -> Option<[f32; 4]> {
        self.layout_rects.get(id).map(|r| [r.min.x, r.min.y, r.width(), r.height()])
    }

    pub(crate) fn overlay_bounds(&self) -> BTreeMap<&str, [f32; 4]> {
        self.overlay_ids
            .iter()
            .filter_map(|id| self.overlay_rect(id).map(|rect| (id.as_str(), rect)))
            .collect()
    }

    fn overlay_rect(&self, id: &str) -> Option<[f32; 4]> {
        self.layout_bounds(id)
            .filter(|_| self.layout_clips.get(id).is_none_or(|clip| clip.is_positive()))
    }

    pub(crate) fn overlay_clips(&self) -> BTreeMap<&str, [f32; 4]> {
        self.overlay_ids
            .iter()
            .filter_map(|id| {
                self.layout_clips
                    .get(id)
                    .filter(|r| r.is_positive())
                    .map(|r| (id.as_str(), [r.min.x, r.min.y, r.width(), r.height()]))
            })
            .collect()
    }

    pub(crate) fn revision(&self) -> u64 {
        self.revision
    }

    pub fn snapshot(&self) -> Value {
        let overlays = self.overlay_bounds();
        let focused = self.context.memory(|memory| memory.focused());
        let focused = self.semantics.iter().find(|node| Some(node.focus_id) == focused).map(|node| &node.id);
        json!({"revision": self.revision, "focused":focused,"selectionText":self.selection.text,"cursor": if self.cursor.is_empty() { "default" } else { self.cursor }, "nodes": self.semantics, "inputFields": self.input_fields, "events": self.events, "overlays": overlays,"overlayClips":self.overlay_clips(),"imageRequests":self.images.requests(),"priorityImagesPending":self.images.priority_pending(),"contentSize":self.content_size})
    }

    fn drain_image_events(&mut self) {
        for event in self.images.events() {
            self.revision += 1;
            self.events
                .push(json!({"id":event.id,"type":event.kind,"value":event.value,"sequence":self.revision}));
        }
    }

    pub(crate) fn image_result(&mut self, request: u64, image: Option<std::sync::Arc<crate::assets::texture::Image>>, error: Option<&str>) -> Value {
        self.images.complete(request, image, error);
        self.drain_image_events();
        self.revision += 1;
        self.snapshot()
    }

    pub fn take_snapshot(&mut self) -> Value {
        let result = self.snapshot();
        self.events.clear();
        result
    }

    fn change(&mut self, id: &str, value: Value) {
        self.revision += 1;
        self.events.push(json!({"id":id,"type":"change","value":value,"sequence":self.revision}));
    }

    fn click(&mut self, id: &str) {
        if self.interaction_clip.is_some_and(|clip| {
            self.context
                .input(|i| i.pointer.any_released() && i.pointer.interact_pos().is_some_and(|p| !clip.contains(p)))
        }) {
            return;
        }
        self.revision += 1;
        self.events.push(json!({"id":id,"type":"press","sequence":self.revision}));
    }

    fn value(&mut self, n: &Node, keys: &[&str], default: Value) -> Value {
        if let Some(value) = keys.iter().find_map(|key| n.props.get(*key)) {
            // The OS buffer is newer than the last React tree while a controlled echo is pending.
            if matches!(n.kind.as_str(), "NInput" | "NTextarea" | "NSearchField" | "NInputOtp") && self.platform_edits.contains(&n.id) {
                if let Some(edited) = self.values.get(&n.id) {
                    return edited.clone();
                }
            }
            if self.values.get(&n.id) != Some(value) {
                self.platform_edits.remove(&n.id);
            }
            self.values.insert(n.id.clone(), value.clone());
            return value.clone();
        }
        self.values
            .entry(n.id.clone())
            .or_insert_with(|| n.props.get("defaultValue").cloned().unwrap_or(default))
            .clone()
    }

    fn semantic(&mut self, ui: &egui::Ui, n: &Node, response: &Response, value: Value) {
        let stroke_kind = if matches!(n.kind.as_str(), "NInput" | "NTextarea" | "NSearchField" | "NInputOtp") {
            egui::StrokeKind::Inside
        } else {
            egui::StrokeKind::Outside
        };
        self.focus_outline(
            ui.painter(),
            response,
            response.rect,
            ui.visuals().widgets.active.corner_radius,
            stroke_kind,
        );
        self.record_semantic(n, response, value);
    }

    // Use the painted box for the keyboard indicator, independently of the hit target.
    fn focus_outline(&self, painter: &egui::Painter, response: &Response, bounds: Rect, corners: egui::CornerRadius, stroke_kind: egui::StrokeKind) {
        if !response.enabled() || !response.has_focus() || !bounds.is_positive() {
            return;
        }
        let clip = self.interaction_clip.unwrap_or(painter.clip_rect());
        let radius = corners.at_most((bounds.width().min(bounds.height()) * 0.5) as u8);
        let gap = if stroke_kind == egui::StrokeKind::Outside { 2 } else { 0 };
        painter.with_clip_rect(clip).with_layer_id(response.layer_id).rect_stroke(
            bounds.expand(f32::from(gap)),
            radius + gap,
            egui::Stroke::new(2., self.palette.get("focus")),
            stroke_kind,
        );
    }

    fn record_semantic(&mut self, n: &Node, response: &Response, value: Value) {
        self.input_semantic(n, response);
        self.layout_rects.insert(n.id.clone(), response.rect);
        let rect = response.rect.intersect(response.interact_rect).intersect(response.ctx.viewport_rect());
        let rect = self.interaction_clip.map_or(rect, |clip| rect.intersect(clip));
        if !rect.is_positive() {
            return;
        }
        if response.contains_pointer()
            && matches!(
                n.kind.as_str(),
                "NButton"
                    | "NPress"
                    | "NCloseButton"
                    | "NLink"
                    | "NMenuItem"
                    | "NActionItem"
                    | "NSelect"
                    | "NDatePicker"
                    | "NCheck"
                    | "NSwitch"
                    | "NToggleButton"
                    | "NRadio"
                    | "NSlider"
                    | "NNumberField"
                    | "NCarousel"
            )
        {
            response
                .ctx
                .set_cursor_icon(if !response.enabled() || flag(&n.props, &["disabled", "isDisabled"]) {
                    egui::CursorIcon::NotAllowed
                } else {
                    egui::CursorIcon::PointingHand
                });
        }
        let label = ["accessibilityLabel", "aria-label", "ariaLabel"]
            .iter()
            .find_map(|k| n.props[*k].as_str())
            .map(str::to_owned)
            .unwrap_or_else(|| text(n));
        self.semantics.push(Semantic {
            id: n.id.clone(),
            kind: n.kind.clone(),
            label,
            heading_level: n.props["tag"]
                .as_str()
                .and_then(|tag| tag.strip_prefix('h'))
                .and_then(|level| level.parse::<u8>().ok())
                .filter(|level| (1..=6).contains(level)),
            value,
            disabled: !response.enabled(),
            rect: [rect.min.x, rect.min.y, rect.width(), rect.height()],
            focus_id: response.id,
            max_length: n.props["maxLength"].as_u64().map(|n| n.min(1_000_000) as usize),
            read_only: flag(&n.props, &["isReadOnly", "readOnly"]),
            secret: n.props["type"] == "password" || n.props["secureTextEntry"] == true,
            multiline: n.kind == "NTextarea" || n.props["multiline"] == true,
            input_type: n.props["type"].as_str().unwrap_or("text").into(),
            keyboard_type: n.props["keyboardType"]
                .as_str()
                .or(n.props["inputProps"]["keyboardType"].as_str())
                .map(str::to_owned),
            platform_edit: self.platform_edits.contains(&n.id),
            min: numeric(&n.props, &["min", "minValue", "minimumValue"], 0.),
            max: numeric(&n.props, &["max", "maxValue", "maximumValue"], 100.),
            step: numeric(&n.props, &["step"], 1.),
            expanded: n.props["_expanded"].as_bool(),
            multiple: n.props["_multiple"].as_bool(),
            selected: n.props["_selected"].as_bool(),
            select_owner: n.props["_selectOwner"].as_str().map(str::to_owned),
            active_descendant: n.props["_activeDescendant"].as_str().map(str::to_owned),
            value_label: n.props["_valueLabel"].as_str().map(str::to_owned),
            editor: None,
        });
    }
    /// egui sends only texture changes, so a new GPU renderer (the surface was detached, e.g. while
    /// another screen covered it) needs everything again: the full font atlas, images and icons.
    pub(crate) fn reupload_textures(&mut self) {
        if self.fonts_ready && self.context.cumulative_frame_nr() > 0 {
            let atlas = self.context.fonts(|fonts| fonts.image());
            self.context.tex_manager().write().set(
                egui::TextureId::default(),
                egui::epaint::ImageDelta::full(atlas, egui::epaint::TextureAtlas::texture_options()),
            );
        }
        self.images.forget_textures();
        self.icons.clear();
    }

    pub fn frame(&mut self, width: f32, height: f32, pixels_per_point: f32) -> egui::FullOutput {
        self.frame_after(width, height, pixels_per_point, 1. / 60.)
    }
    /// Displays present at 60–120 Hz and can drop frames; egui derives fling velocity and inertia
    /// from frame time, so a fixed step would shorten flings on fast displays.
    pub fn present_frame(&mut self, width: f32, height: f32, pixels_per_point: f32) -> egui::FullOutput {
        let now = clock_seconds();
        let dt = self.last_present.map_or(1. / 60., |last| (now - last).clamp(0., 0.1));
        self.last_present = Some(now);
        self.frame_after(width, height, pixels_per_point, dt)
    }

    fn frame_after(&mut self, width: f32, height: f32, pixels_per_point: f32, dt: f64) -> egui::FullOutput {
        if !self.fonts_ready {
            fonts::configure(&self.context);
            self.fonts_ready = true;
        }
        self.elapsed += dt;
        self.palette = theme::Palette::platform(self.dark, self.native);
        self.background = self
            .tree
            .iter()
            .find(|n| n.kind == "NTheme")
            .map(|root| theme::Palette::configure(&self.palette, &root.props, self.dark).get("background"))
            .unwrap_or_else(|| self.palette.get("background"));
        if let Some(background) = self.surface_background {
            self.background = background;
        }
        self.context.set_visuals(self.palette.visuals());
        std::mem::swap(&mut self.previous_semantics, &mut self.semantics);
        self.previous_focus = None;
        let old_selection = self.selection.revision;
        if self.selection.tick(self.elapsed) {
            self.touch(3, 0., 0.);
        }
        let input = RawInput {
            screen_rect: Some(Rect::from_min_size(Pos2::ZERO, Vec2::new(width, height))),
            events: std::mem::take(&mut self.input),
            time: Some(self.elapsed),
            ..Default::default()
        };
        self.context.set_pixels_per_point(pixels_per_point);
        let context = self.context.clone();
        let tree = Arc::clone(&self.tree);
        // Overlay ids are set by an environment command and stay fixed during this frame.
        let old_overlays: Vec<_> = self.overlay_ids.iter().map(|id| self.overlay_rect(id)).collect();
        let old_requests = self.images.request_revision();
        let old_content_size = self.content_size;
        self.selection.begin_frame();
        let output = context.run_ui(input, |ui| {
            self.semantics.clear();
            self.input_fields.clear();
            self.scroll_targets.clear();
            if self.pointer_down {
                if let Some(id) = self.drag_target {
                    ui.ctx().set_dragged_id(id);
                }
            }
            ui.spacing_mut().interact_size.y = 44.;
            ui.style_mut().override_font_id = Some(egui::FontId::proportional(16. * if self.font_scale > 0. { self.font_scale } else { 1. }));
            if self.reduced_motion {
                ui.style_mut().animation_time = 0.;
            }
            #[cfg(any(target_arch = "wasm32", test))]
            if let Some(mut css) = self.css.take() {
                css.render(self, ui, &tree, Vec2::new(width, height));
                self.css = Some(css);
                self.selection_menu(ui);
                return;
            }
            let root = egui::ScrollArea::vertical()
                .id_salt("engine-ui-root")
                .scroll_bar_visibility(root_scrollbar(&tree))
                .show(ui, |ui| self.nodes(ui, &tree));
            self.content_size = [root.content_size.x, root.content_size.y];
            if root.content_size.y > root.inner_rect.height() {
                self.register_scroll_target(ui, root.id, root.inner_rect, false);
            }
        });
        self.images.finish_layout();
        if !self.input_cache.is_empty() {
            // Preserve traversal order for platform keyboard navigation.
            let fields: HashSet<&str> = self.input_fields.iter().map(String::as_str).collect();
            self.input_cache.retain(|id, _| fields.contains(id.as_str()));
        }
        self.selection.finish_frame();
        self.drain_image_events();
        let icon = if context.input(|input| input.pointer.hover_pos().is_none()) {
            egui::CursorIcon::Default
        } else {
            output.platform_output.cursor_icon
        };
        let cursor = match icon {
            egui::CursorIcon::PointingHand => "pointer",
            egui::CursorIcon::NotAllowed => "not-allowed",
            egui::CursorIcon::Text => "text",
            egui::CursorIcon::Grab => "grab",
            egui::CursorIcon::Grabbing => "grabbing",
            egui::CursorIcon::ResizeHorizontal => "ew-resize",
            egui::CursorIcon::ResizeVertical => "ns-resize",
            _ => "default",
        };
        let cursor_changed = self.cursor != cursor;
        self.cursor = cursor;
        let images_changed = old_requests != self.images.request_revision() || old_content_size != self.content_size;
        // Visible platform editors must follow their GPU field on every scroll frame. The usual
        // accessibility throttling would make their text trail the field's chrome while moving.
        let editors_moved = self.platform_inputs && {
            fn editors(nodes: &[Semantic]) -> impl Iterator<Item = (&str, [f32; 4], Option<&Value>)> {
                nodes
                    .iter()
                    .filter_map(|node| Some((node.id.as_str(), node.rect, node.editor.as_ref()?.get("rect"))))
            }
            editors(&self.semantics).ne(editors(&self.previous_semantics))
        };
        let changed = self.previous_semantics != self.semantics;
        let overlays_changed = old_overlays.into_iter().ne(self.overlay_ids.iter().map(|id| self.overlay_rect(id)));
        // Scrolling changes the semantics every frame, and each snapshot is parsed in JS and
        // repositions platform views on the main thread. Continuous changes are sent at a bounded
        // rate and once they settle; events and attachment positions still go out every frame.
        let send = cursor_changed
            || editors_moved
            || old_selection != self.selection.revision
            || images_changed
            || overlays_changed
            || (changed && self.semantics_sent.is_none_or(|sent| self.elapsed - sent >= SEMANTICS_INTERVAL))
            || (!changed && self.semantics_stale);
        if send {
            self.revision += 1;
            self.semantics_sent = Some(self.elapsed);
            self.semantics_stale = false;
        } else if changed {
            self.semantics_stale = true;
        }
        output
    }

    fn nodes(&mut self, ui: &mut egui::Ui, nodes: &[Node]) {
        for n in nodes {
            self.one(ui, n);
        }
    }

    fn selection_menu(&mut self, ui: &mut egui::Ui) {
        let Some(point) = self.selection.menu else {
            return;
        };
        if self.selection.text.is_empty() {
            return;
        }
        let screen = ui.ctx().viewport_rect();
        let position = Pos2::new(
            point.x.clamp(0., (screen.width() - 100.).max(0.)),
            (point.y - 52.).clamp(0., (screen.height() - 48.).max(0.)),
        );
        let response = egui::Area::new(egui::Id::unique(text_selection::COPY_ID))
            .order(egui::Order::Foreground)
            .fixed_pos(position)
            .show(ui.ctx(), |ui| {
                *ui.visuals_mut() = self.palette.visuals();
                egui::Frame::popup(ui.style())
                    .show(ui, |ui| ui.add_sized([76., 36.], egui::Button::new("Copy")))
                    .inner
            })
            .inner;
        self.semantic(
            ui,
            &Node {
                id: text_selection::COPY_ID.into(),
                kind: "NButton".into(),
                props: json!({"accessibilityLabel":"Copy selected text"}),
                children: vec![],
            },
            &response,
            Value::Null,
        );
        if response.clicked() {
            self.selection.menu = None;
            self.revision += 1;
            self.events
                .push(json!({"id":text_selection::COPY_ID,"type":"copy","value":self.selection.text,"sequence":self.revision}));
        }
    }
    /// Flow children first, then `absolute` children over the padding box, painted on top.
    fn container(&mut self, ui: &mut egui::Ui, n: &Node, resolved: &style::Style) {
        let start = ui.max_rect();
        let flow: Vec<&Node> = n.children.iter().filter(|child| !absolute(child)).collect();
        if flow.is_empty() {
            ui.allocate_exact_size(
                Vec2::new(resolved.width.unwrap_or(ui.available_width()), resolved.height.unwrap_or(0.)),
                egui::Sense::hover(),
            );
        } else if resolved.horizontal && self.flow_row(ui, n, resolved) {
            // Flexible rows have already allocated their exact children.
        } else {
            // egui places a row's widgets from its start; justify uses the width measured last frame.
            let justified = resolved.horizontal && resolved.justify != egui::Align::Min;
            if let Some(used) = self.row_widths.get(&n.id).filter(|_| justified) {
                let free = (ui.available_width() - used).max(0.);
                ui.add_space(if resolved.justify == egui::Align::Center { free / 2. } else { free });
            }
            let left = ui.cursor().min.x;
            for child in flow {
                self.one(ui, child);
            }
            if justified {
                self.row_widths.insert(n.id.clone(), (ui.min_rect().max.x - left).max(0.));
            }
        }
        if !n.children.iter().any(absolute) {
            return;
        }
        let content = Rect::from_min_max(start.min, Pos2::new(start.max.x, ui.min_rect().max.y.max(start.min.y)));
        let padding = resolved.padding;
        let containing = Rect::from_min_max(
            content.min - Vec2::new(padding.left, padding.top),
            content.max + Vec2::new(padding.right, padding.bottom),
        );
        for child in n.children.iter().filter(|child| absolute(child)) {
            let style = style::Style::resolve(
                &child.kind,
                &child.props,
                &self.palette,
                style::Conditions {
                    dark: self.palette.dark,
                    viewport: ui.ctx().viewport_rect().width(),
                    ..Default::default()
                },
                containing.size(),
            );
            let [top, right, bottom, left] = style.inset;
            let mut rect = Rect::from_min_max(
                Pos2::new(
                    left.map_or(containing.left(), |v| containing.left() + v),
                    top.map_or(containing.top(), |v| containing.top() + v),
                ),
                Pos2::new(
                    right.map_or(containing.right(), |v| containing.right() - v),
                    bottom.map_or(containing.bottom(), |v| containing.bottom() - v),
                ),
            );
            let mut placed = child.clone();
            if left.is_some() && right.is_some() && style.width.is_none() {
                placed.props["width"] = json!(rect.width().max(0.));
            }
            if top.is_some() && bottom.is_some() && style.height.is_none() {
                placed.props["height"] = json!(rect.height().max(0.));
            }
            let mut builder = egui::UiBuilder::new().layout(egui::Layout::top_down(egui::Align::Min));
            // Right- or bottom-aligned egui layouts stretch a box to that edge, so boxes anchored only
            // there are placed at their own size: declared, or measured on the previous frame.
            let previous = self.layout_rects.get(&child.id).map(|previous| previous.size());
            if left.is_none() && right.is_some() {
                match style.width.or(previous.map(|size| size.x)) {
                    Some(width) => rect.min.x = (rect.max.x - width).max(containing.left()),
                    None => builder = builder.invisible(),
                }
            }
            if top.is_none() && bottom.is_some() {
                match style.height.or(previous.map(|size| size.y)) {
                    Some(height) => rect.min.y = (rect.max.y - height).max(containing.top()),
                    None => builder = builder.invisible(),
                }
            }
            let mut child_ui = ui.new_child(builder.max_rect(rect));
            self.one(&mut child_ui, &placed);
        }
    }

    fn icon(&mut self, ui: &egui::Ui, n: &Node, size: f32) -> Option<egui::TextureId> {
        let p = &n.props;
        let paths: Vec<String> = match &p["paths"] {
            Value::Array(paths) => paths.iter().filter_map(|d| d.as_str().map(str::to_owned)).collect(),
            Value::String(d) => vec![d.clone()],
            _ => vec![],
        };
        let view = match &p["viewBox"] {
            Value::Number(side) => {
                let side = side.as_f64().unwrap_or(24.) as f32;
                [0., 0., side, side]
            }
            Value::Array(values) if values.len() == 4 => {
                let v: Vec<f32> = values.iter().map(|v| v.as_f64().unwrap_or(0.) as f32).collect();
                [v[0], v[1], v[2], v[3]]
            }
            _ => [0., 0., 24., 24.],
        };
        let stroke = p["strokeWidth"].as_f64().filter(|w| w.is_finite() && *w > 0.).map(|w| w as f32);
        let even_odd = p["fillRule"] == "evenodd";
        let pixels = (size * ui.ctx().pixels_per_point()).round().clamp(1., icon::MAX_PIXELS as f32) as usize;
        let key = format!("{pixels}:{view:?}:{stroke:?}:{even_odd}:{}", paths.join("|"));
        if let Some(texture) = self.icons.get(&key) {
            return Some(texture.id());
        }
        let alpha = icon::mask(&paths, view, pixels, stroke, even_odd).ok()?;
        if self.icons.len() >= 256 {
            self.icons.clear();
        }
        let rgba: Vec<u8> = alpha.iter().flat_map(|a| [255, 255, 255, *a]).collect();
        let texture = ui.ctx().load_texture(
            format!("ui-icon-{key}"),
            egui::ColorImage::from_rgba_unmultiplied([pixels, pixels], &rgba),
            egui::TextureOptions::LINEAR,
        );
        let id = texture.id();
        self.icons.insert(key, texture);
        Some(id)
    }

    fn one(&mut self, ui: &mut egui::Ui, n: &Node) {
        ui.push_id(&n.id, |ui| {
            let saved = if n.kind == "NTheme" {
                let palette = theme::Palette::configure(&self.palette, &n.props, self.dark);
                let saved = std::mem::replace(&mut self.palette, palette);
                *ui.visuals_mut() = self.palette.visuals();
                Some(saved)
            } else {
                None
            };
            let disabled = !ui.is_enabled() || flag(&n.props, &["disabled", "isDisabled", "isLoading"]);
            let focused = ui.memory(|m| m.focused()).is_some_and(|focus| {
                if self.previous_focus.as_ref().is_none_or(|(previous, _)| *previous != focus) {
                    let id = self.previous_semantics.iter().find(|s| s.focus_id == focus).map(|s| s.id.clone());
                    self.previous_focus = Some((focus, id));
                }
                self.previous_focus.as_ref().and_then(|(_, id)| id.as_deref()) == Some(n.id.as_str())
            });
            let hovered = (!self.native || self.pointer_down)
                && self.layout_rects.get(&n.id).is_some_and(|r| {
                    ui.input(|i| {
                        i.pointer
                            .hover_pos()
                            .is_some_and(|p| r.contains(p) && self.interaction_clip.is_none_or(|clip| clip.contains(p)))
                    })
                });
            let conditions = style::Conditions {
                dark: self.palette.dark,
                disabled,
                hovered,
                focused,
                active: hovered && ui.input(|i| i.pointer.any_down()),
                viewport: ui.ctx().viewport_rect().width(),
            };
            let resolved = style::Style::resolve(
                &n.kind,
                &n.props,
                &self.palette,
                conditions,
                Vec2::new(ui.available_width(), ui.available_height().min(ui.ctx().viewport_rect().height())),
            );
            if !resolved.hidden {
                ui.add_enabled_ui(!disabled, |ui| {
                    resolved.apply(ui, if self.font_scale > 0. { self.font_scale } else { 1. });
                    let control = !complex_button(n)
                        && matches!(
                            n.kind.as_str(),
                            "NButton" | "NCloseButton" | "NMenuItem" | "NImage" | "NInput" | "NTextarea" | "NSearchField" | "NInputOtp" | "NSelect"
                        );
                    let backdrop = (resolved.backdrop_blur > 0.).then(|| ui.painter().add(egui::Shape::Noop));
                    let frame = resolved.frame(control);
                    let shadow = resolved.shadow.map(|_| [(); 4].map(|_| ui.painter().add(egui::Shape::Noop)));
                    let gradient = resolved.gradient().map(|gradient| (gradient, ui.painter().add(egui::Shape::Noop)));
                    let rendered = frame.show(ui, |ui| {
                        let badge = matches!(n.kind.as_str(), "NBadge" | "NChip");
                        if let Some(width) = resolved.width.or(resolved.min_width.filter(|_| badge)) {
                            let inset = if control {
                                0.
                            } else {
                                resolved.padding.left + resolved.padding.right + resolved.border_width * 2.
                            };
                            ui.set_min_width((width - inset).max(0.));
                        }
                        if let Some(height) = resolved
                            .height
                            .or(resolved.min_height.filter(|_| badge))
                            .filter(|_| !control && (!resolved.horizontal || badge))
                        {
                            let inset = resolved.padding.top + resolved.padding.bottom + resolved.border_width * 2.;
                            ui.set_min_height((height - inset).max(0.));
                        }
                        if badge {
                            self.node(ui, n, &resolved);
                        } else if resolved.horizontal {
                            let height = (self.preferred_height(n, ui.available_width())
                                - resolved.padding.top
                                - resolved.padding.bottom
                                - resolved.margin.top
                                - resolved.margin.bottom
                                - if control { 0. } else { resolved.border_width * 2. })
                            .max(0.);
                            ui.allocate_ui_with_layout(Vec2::new(ui.available_width(), height), resolved.layout(), |ui| {
                                self.node(ui, n, &resolved)
                            });
                        } else {
                            // Leaves follow their parent's alignment; a different cross alignment
                            // would stretch their frame toward the parent's anchor.
                            let leaf = matches!(
                                n.kind.as_str(),
                                "NText" | "NLink" | "NChip" | "NRequired" | "NKbd" | "NCode" | "NIcon" | "NImage"
                            );
                            let layout = if matches!(n.kind.as_str(), "NText" | "NLink") {
                                (*ui.layout()).with_cross_justify(false)
                            } else if leaf {
                                *ui.layout()
                            } else {
                                resolved.layout()
                            };
                            ui.with_layout(layout, |ui| self.node(ui, n, &resolved));
                        }
                        ui.min_rect()
                    });
                    let bounds = frame.widget_rect(rendered.inner);
                    if let Some(index) = backdrop {
                        ui.painter().set(
                            index,
                            egui::Shape::Callback(egui::epaint::PaintCallback {
                                rect: bounds,
                                callback: std::sync::Arc::new(Backdrop {
                                    blur: resolved.backdrop_blur,
                                    corners: resolved.corner_radius(),
                                }),
                            }),
                        );
                    }
                    if matches!(n.kind.as_str(), "NPress" | "NActionItem") || complex_button(n) {
                        let response = ui.interact(
                            press::hit_rect(n, bounds).intersect(ui.clip_rect()),
                            egui::Id::unique(&n.id),
                            egui::Sense::click(),
                        );
                        if n.kind == "NPress" {
                            self.press_interaction(n, &response);
                        } else if response.clicked() {
                            self.click(&n.id);
                        }
                        self.focus_outline(ui.painter(), &response, bounds, resolved.corner_radius(), egui::StrokeKind::Outside);
                        self.record_semantic(n, &response, Value::Null);
                    }

                    if let (Some(indices), Some((shadow, spread))) = (shadow, resolved.shadow) {
                        let shape = shadow.as_shape(bounds.expand(spread), (resolved.radius + spread).max(0.) as u8);
                        for (index, outside) in indices.into_iter().zip(outer_shadow_clips(bounds, ui.clip_rect())) {
                            if outside.is_positive() {
                                ui.painter().with_clip_rect(outside).set(index, shape.clone());
                            }
                        }
                    }
                    if let Some((gradient, index)) = gradient {
                        ui.painter().set(index, gradient_shape(bounds, resolved.corner_radius(), gradient));
                    }
                    self.layout_rects.insert(n.id.clone(), bounds);
                    let clip = bounds.intersect(ui.clip_rect());
                    self.layout_clips
                        .insert(n.id.clone(), self.interaction_clip.map_or(clip, |limit| clip.intersect(limit)));
                });
            } else {
                self.layout_rects.remove(&n.id);
                self.layout_clips.remove(&n.id);
            }
            if let Some(saved) = saved {
                self.palette = saved;
            }
        });
    }

    fn has_backdrop(&self, node: &Node, width: f32) -> bool {
        style::Style::resolve(
            &node.kind,
            &node.props,
            &self.palette,
            style::Conditions {
                dark: self.palette.dark,
                viewport: self.context.viewport_rect().width(),
                ..Default::default()
            },
            Vec2::new(width, 16384.),
        )
        .backdrop_blur
            > 0.
            || node.children.iter().any(|child| self.has_backdrop(child, width))
    }

    fn preferred_height(&self, node: &Node, width: f32) -> f32 {
        let style = style::Style::resolve(
            &node.kind,
            &node.props,
            &self.palette,
            style::Conditions {
                dark: self.palette.dark,
                viewport: self.context.viewport_rect().width(),
                ..Default::default()
            },
            Vec2::new(width, 16384.),
        );
        if let Some(height) = style.height {
            return height + style.margin.top + style.margin.bottom;
        }
        if matches!(node.kind.as_str(), "NText" | "NLink" | "NBadge" | "NChip") {
            return self.measured_text_height(node, &style, width);
        }
        if node.kind == "NLoading" {
            return loading::measure(&self.context, node, &style, width, self.font_scale).0.y
                + style.padding.top
                + style.padding.bottom
                + style.margin.top
                + style.margin.bottom;
        }
        if node.kind == "NIcon" {
            return style.width.unwrap_or_else(|| numeric(&node.props, &["size"], 24.) as f32) + style.margin.top + style.margin.bottom;
        }
        if node.children.is_empty() {
            return if node.kind == "NButton" { 48. } else { 0. };
        }
        let inner_width = (width - style.padding.left - style.padding.right - style.border_width * 2.).max(1.);
        let children = node.children.iter().filter(|child| !absolute(child));
        let count = children.clone().count();
        let heights = children.map(|child| self.preferred_height(child, inner_width));
        let content = if style.horizontal {
            heights.fold(0f32, f32::max)
        } else {
            heights.sum::<f32>() + style.gap.map_or(0., |gap| gap.y) * count.saturating_sub(1) as f32
        };
        content + style.padding.top + style.padding.bottom + style.border_width * 2. + style.margin.top + style.margin.bottom
    }

    fn node(&mut self, ui: &mut egui::Ui, n: &Node, resolved: &style::Style) {
        let p = &n.props;
        let label = text(n);
        match n.kind.as_str() {
            "NList" => self.virtual_list(ui, n, resolved),
            "NCarousel" => self.carousel(ui, n, resolved),
            "NConfetti" => {
                let size = Vec2::new(
                    resolved.width.unwrap_or(ui.available_width()),
                    resolved.height.unwrap_or(ui.available_height()),
                )
                .max(Vec2::ZERO);
                let (rect, _) = ui.allocate_exact_size(size, egui::Sense::hover());
                self.paint_confetti(ui.painter(), n, rect);
            }
            "NDatePicker" => self.date_picker(ui, n),
            "NListItem" | "NListHeader" | "NListStickyHeader" | "NListEmpty" | "NListFooter" => self.nodes(ui, &n.children),
            "NTheme" | "NCard" | "NView" => self.container(ui, n, resolved),
            "NPattern" => {
                let size = Vec2::new(
                    resolved.width.unwrap_or(ui.available_width()),
                    resolved.height.unwrap_or(ui.available_height()),
                );
                let (rect, _) = ui.allocate_exact_size(size.max(Vec2::ZERO), egui::Sense::hover());
                self.paint_pattern(ui.painter(), n, rect);
            }
            "NIcon" => {
                let size = resolved
                    .width
                    .or(resolved.height)
                    .unwrap_or_else(|| numeric(p, &["size"], 24.) as f32)
                    .clamp(1., 512.);
                let (rect, response) = ui.allocate_exact_size(Vec2::splat(size), egui::Sense::hover());
                if ui.is_rect_visible(rect) {
                    if p["paths"].is_null() && p["name"].as_str().is_some_and(|name| !name.is_ascii()) {
                        let color = resolved
                            .foreground
                            .or_else(|| p["color"].as_str().and_then(theme::parse_color))
                            .unwrap_or_else(|| ui.visuals().text_color());
                        let galley = ui
                            .painter()
                            .layout_no_wrap(string(&p["name"]), egui::FontId::new(size, resolved.font_family()), color);
                        ui.painter().galley(rect.center() - galley.size() * 0.5, galley, color);
                    } else if let Some(texture) = self.icon(ui, n, size) {
                        let color = resolved
                            .foreground
                            .or_else(|| p["color"].as_str().and_then(theme::parse_color))
                            .unwrap_or_else(|| ui.visuals().text_color());
                        ui.painter()
                            .image(texture, rect, Rect::from_min_max(Pos2::ZERO, Pos2::new(1., 1.)), color);
                    }
                }
                if ["accessibilityLabel", "aria-label", "ariaLabel"]
                    .iter()
                    .any(|key| p[*key].as_str().is_some_and(|label| !label.is_empty()))
                {
                    self.semantic(ui, n, &response, Value::Null);
                }
            }
            "NImage" => {
                let (response, value) = self.images.paint(ui, n, resolved);
                self.semantic(ui, n, &response, value);
            }
            "NText" | "NChip" | "NBadge" | "NRequired" | "NKbd" | "NCode" => {
                if n.kind == "NText" && self.rich_text(ui, n, resolved) {
                    return;
                }
                let text = if n.kind == "NRequired" {
                    "*".into()
                } else if n.kind == "NCode" {
                    string(&p["code"])
                } else {
                    label
                };
                let text = resolved.text_transform.unwrap_or(style::TextTransform::Normal).apply(text);
                let scale = self.font_scale.max(1.);
                let size = resolved.text_size.unwrap_or(16.);
                let caption = if matches!(n.kind.as_str(), "NKbd" | "NCode") {
                    egui::RichText::new(text).monospace()
                } else {
                    let line_height = match resolved.line_height {
                        Some(height) => Some(height.points(size) * scale),
                        None => self.native.then_some(size * 1.625 * scale),
                    };
                    let caption = egui::RichText::new(text).line_height(line_height);
                    match resolved.tracking {
                        Some(tracking) => caption.extra_letter_spacing(tracking.points(size) * scale),
                        None => caption,
                    }
                };
                let mut label = if let Some(lines) = p["numberOfLines"].as_u64().filter(|n| *n > 0) {
                    let mut job =
                        (*egui::WidgetText::from(caption).into_layout_job(ui.style(), egui::FontSelection::Default, egui::Align::Min)).clone();
                    job.wrap.max_rows = lines.min(100) as usize;
                    job.wrap.max_width = ui.available_width();
                    job.wrap.break_anywhere = false;
                    egui::Label::new(job)
                } else {
                    egui::Label::new(caption)
                };
                let badge = matches!(n.kind.as_str(), "NBadge" | "NChip");
                let text_align = resolved.text_align.or(badge.then_some(egui::Align::Center));
                if let Some(align) = text_align {
                    label = label.halign(align);
                }
                let response = if badge || resolved.text_shadow.is_some() {
                    let (mut pos, galley, mut response) = label.layout_in_ui(ui);
                    if badge {
                        let align = egui::Align2([text_align.unwrap_or(egui::Align::Center), egui::Align::Center]);
                        let label_rect = align.align_size_within_rect(galley.size(), ui.min_rect());
                        pos = label_rect.min - galley.rect.min.to_vec2();
                        response.rect = label_rect;
                        response.interact_rect = label_rect.intersect(ui.clip_rect());
                    }
                    if ui.is_rect_visible(response.rect) {
                        let painter = ui.painter();
                        if let Some(shadow) = resolved.text_shadow {
                            // A soft halo: rings of faint copies stand in for the platform's blurred shadow.
                            let rings = (shadow.radius / 2.).ceil().clamp(1., 4.) as usize;
                            for ring in 1..=rings {
                                let distance = shadow.radius * ring as f32 / rings as f32 / 2.;
                                let color = shadow.color.gamma_multiply(0.5 / rings as f32);
                                for step in 0..8 {
                                    let offset = shadow.offset + distance * Vec2::angled(step as f32 * std::f32::consts::FRAC_PI_4);
                                    painter.galley_with_override_text_color(pos + offset, galley.clone(), color);
                                }
                            }
                            painter.galley_with_override_text_color(pos + shadow.offset, galley.clone(), shadow.color.gamma_multiply(0.5));
                        }
                        let color = ui.visuals().text_color();
                        if badge && ui.style().interaction.selectable_labels && resolved.text_shadow.is_none() {
                            egui::text_selection::LabelSelectionState::label_text_selection(ui, &response, pos, galley, color, egui::Stroke::NONE);
                        } else {
                            painter.galley(pos, galley, color);
                        }
                    }
                    response
                } else {
                    ui.add(label)
                };
                self.semantic(ui, n, &response, Value::Null);
            }
            "NPress" | "NActionItem" => self.container(ui, n, resolved),
            "NButton" if complex_button(n) => self.container(ui, n, resolved),
            "NButton" | "NCloseButton" | "NMenuItem" => {
                let label = if flag(p, &["isLoading"]) {
                    p["loadingText"].as_str().unwrap_or("Loading…").into()
                } else if n.kind == "NCloseButton" {
                    "×".into()
                } else {
                    label
                };
                let mut caption = egui::RichText::new(label.clone());
                if let Some(child) = n.children.iter().find(|child| child.kind == "NText") {
                    let child_style = style::Style::resolve(
                        "NText",
                        &child.props,
                        &self.palette,
                        style::Conditions {
                            viewport: ui.ctx().viewport_rect().width(),
                            dark: self.palette.dark,
                            ..Default::default()
                        },
                        ui.available_size(),
                    );
                    if let Some(color) = child_style.foreground {
                        caption = caption.color(color);
                    }
                }
                let height = resolved.height.unwrap_or(if self.native { 48. } else { 36. }).max(if self.native { 44. } else { 32. });
                let font = ui.style().override_font_id.clone().unwrap_or(egui::FontId::proportional(16.));
                let measured = ui.painter().layout_no_wrap(label, font, ui.visuals().text_color()).size().x + ui.spacing().button_padding.x * 2.;
                let width = resolved.width.unwrap_or(measured.max(44.)).min(ui.available_width());
                let response = ui
                    .allocate_ui_with_layout(
                        Vec2::new(width, height),
                        egui::Layout::left_to_right(egui::Align::Center).with_main_align(egui::Align::Center),
                        |ui| ui.add_sized(Vec2::new(width, height), egui::Button::new(caption).wrap()),
                    )
                    .inner;
                if response.clicked() {
                    self.click(&n.id);
                }
                self.semantic(ui, n, &response, Value::Null);
                if flag(p, &["separator", "hasSeparator"]) {
                    ui.separator();
                }
            }
            "NCheck" | "NSwitch" | "NToggleButton" => {
                let mut value = self
                    .value(
                        n,
                        &["checked", "enabled", "isSelected"],
                        json!(flag(p, &["defaultChecked", "defaultSelected"])),
                    )
                    .as_bool()
                    .unwrap_or(false);
                let response = if n.kind == "NSwitch" {
                    let font = ui.style().override_font_id.clone().unwrap_or(egui::FontId::proportional(14.));
                    let caption = ui.painter().layout(label, font, ui.visuals().text_color(), (ui.available_width() - 44.).max(0.));
                    let (rect, response) = ui.allocate_exact_size(Vec2::new(44. + caption.size().x, caption.size().y.max(32.)), egui::Sense::click());
                    if response.clicked() {
                        value = !value;
                    }
                    let track = Rect::from_center_size(Pos2::new(rect.left() + 18., rect.center().y), Vec2::new(36., 20.));
                    let color = self.palette.get(if value { "accent" } else { "default" });
                    ui.painter().rect_filled(track, 8., if response.enabled() { color } else { color.gamma_multiply(0.5) });
                    ui.painter().circle_filled(Pos2::new(if value { track.right() - 10. } else { track.left() + 10. }, track.center().y), 8., Color32::WHITE);
                    let position = Pos2::new(track.right() + 8., rect.center().y - caption.size().y * 0.5);
                    ui.painter().galley(position, caption, ui.visuals().text_color());
                    response
                } else if n.kind == "NToggleButton" {
                    let r = ui.selectable_label(value, label);
                    if r.clicked() {
                        value = !value;
                    }
                    r
                } else {
                    ui.checkbox(&mut value, label)
                };
                if response.changed() || (matches!(n.kind.as_str(), "NSwitch" | "NToggleButton") && response.clicked()) {
                    self.values.insert(n.id.clone(), json!(value));
                    self.change(&n.id, json!(value));
                }
                self.semantic(ui, n, &response, json!(value));
            }
            "NInput" | "NTextarea" | "NSearchField" | "NInputOtp" => {
                ui.spacing_mut().item_spacing.y = if self.native { 6. } else { ui.spacing().item_spacing.y };
                if !label.is_empty() {
                    let label = egui::RichText::new(&label).line_height(self.native.then_some(24. * self.font_scale.max(1.)));
                    ui.label(if self.native {
                        label.family(egui::FontFamily::Name("native-medium".into()))
                    } else {
                        label
                    });
                }
                let mut value = string(&self.value(n, &["value"], json!("")));
                let mut platform_value = String::new();
                let buffer = if self.platform_inputs { &mut platform_value } else { &mut value };
                let multiline = n.kind == "NTextarea" || p["multiline"] == true;
                let otp = n.kind == "NInputOtp";
                let mut edit = if multiline {
                    egui::TextEdit::multiline(buffer)
                } else {
                    egui::TextEdit::singleline(buffer)
                };
                let visuals = ui.visuals();
                let field_frame = egui::Frame::new()
                    .fill(visuals.text_edit_bg_color())
                    .corner_radius(resolved.corner_radius())
                    .inner_margin(resolved.padding.margin())
                    .apply_stroke_and_expansion_without_layout_shift(visuals.widgets.inactive.bg_stroke, 0.);
                edit = edit
                    .id(egui::Id::unique(&n.id))
                    .hint_text(if self.platform_inputs {
                        String::new()
                    } else {
                        string(&p["placeholder"])
                    })
                    .password(p["type"] == "password" || p["secureTextEntry"] == true)
                    .interactive(!flag(p, &["isReadOnly", "readOnly"]))
                    .align(if multiline { egui::Align2::LEFT_TOP } else { egui::Align2::LEFT_CENTER })
                    .frame(if otp { egui::Frame::NONE } else { field_frame });
                if otp {
                    edit = edit.text_color(Color32::TRANSPARENT);
                }
                if let Some(limit) = p["maxLength"].as_u64() {
                    edit = edit.char_limit(limit as usize);
                }
                let width = if otp {
                    let slots = otp_slots(n);
                    let separators = otp_separators(n, slots).len() as f32;
                    (slots as f32 * 46. - 6. + separators * 12.).min(ui.available_width())
                } else {
                    ui.available_width()
                };
                let size = Vec2::new(
                    resolved.width.unwrap_or(width).max(0.),
                    resolved
                        .height
                        .unwrap_or(if multiline {
                            if self.native { 128. } else { 58. }
                        } else if self.native {
                            48.
                        } else if otp {
                            40.
                        } else {
                            38.
                        })
                        .max(if self.native { 44. } else { 32. }),
                );
                let original_cursor = ui.visuals().text_cursor.stroke;
                if self.platform_inputs {
                    ui.visuals_mut().text_cursor.stroke = egui::Stroke::NONE;
                }
                let response = if multiline {
                    ui.add_sized(size, edit)
                } else {
                    ui.allocate_ui_with_layout(size, egui::Layout::left_to_right(egui::Align::Center), |ui| ui.add_sized(size, edit))
                        .inner
                };
                ui.visuals_mut().text_cursor.stroke = original_cursor;
                if response.changed() && !self.platform_inputs {
                    self.values.insert(n.id.clone(), json!(value));
                    self.change(&n.id, json!(value));
                }
                if otp {
                    self.paint_otp(ui, n, &response, &value);
                }
                self.semantic(ui, n, &response, json!(value));
                self.input_editor(n, &resolved, resolved.padding);
                for key in ["helperText", "description", "error", "errorMessage"] {
                    if let Some(s) = p[key].as_str() {
                        ui.label(s);
                    }
                }
            }
            "NSlider" | "NNumberField" => {
                let mut value = self.value(n, &["value"], json!(0.)).as_f64().unwrap_or(0.);
                let min = numeric(p, &["min", "minValue", "minimumValue"], 0.);
                let max = numeric(p, &["max", "maxValue", "maximumValue"], 100.).max(min);
                let step = numeric(p, &["step"], 1.).max(f64::EPSILON);
                if !label.is_empty() {
                    ui.label(&label);
                }
                let response = if n.kind == "NSlider" {
                    // Keep captions and output outside the track: inline labels overflow on
                    // narrow screens and at large accessibility font scales.
                    ui.spacing_mut().slider_width = resolved.width.unwrap_or(ui.available_width()).max(0.);
                    ui.add(egui::Slider::new(&mut value, min..=max).step_by(step).show_value(false))
                } else {
                    let size = ui.style().override_font_id.as_ref().map_or(16., |font| font.size);
                    let characters = ((ui.available_width() - 72.) / (size * 0.6)).max(6.) as usize;
                    ui.horizontal(|ui| {
                        let previous = value;
                        let decrease = ui.add_enabled(value > min, egui::Button::new("−").min_size(Vec2::new(32., 32.)));
                        if decrease.clicked() {
                            value = (value - step).max(min);
                        }
                        let edit = ui.add(egui::DragValue::new(&mut value).range(min..=max).speed(step).custom_formatter(move |value, _| {
                            let formatted = value.to_string();
                            if formatted.len() > characters { format!("{value:.2e}") } else { formatted }
                        }));
                        let increase = ui.add_enabled(value < max, egui::Button::new("+").min_size(Vec2::new(32., 32.)));
                        if increase.clicked() {
                            value = (value + step).min(max);
                        }
                        let mut response = edit.union(decrease).union(increase);
                        if value != previous {
                            response.mark_changed();
                        }
                        response
                    }).inner
                };
                if n.kind == "NSlider" && p["showOutput"] != false {
                    ui.label(value.to_string());
                }
                if response.changed() {
                    self.values.insert(n.id.clone(), json!(value));
                    self.change(&n.id, json!(value));
                }
                self.semantic(ui, n, &response, json!(value));
            }
            "NProgress" => {
                let value = numeric(p, &["value"], 0.).clamp(0., 100.);
                if p["showLabel"] == true {
                    ui.label(format!("{} — {}%", if label.is_empty() { "Progress" } else { &label }, value));
                }
                ui.visuals_mut().extreme_bg_color = resolved.background.unwrap_or_else(|| self.palette.get("default"));
                let color = p["color"]
                    .as_str()
                    .and_then(|name| self.palette.color(name).or_else(|| theme::parse_color(name)));
                let height = match p["size"].as_str() {
                    Some("sm") => 4.,
                    Some("lg") => 16.,
                    _ => 8.,
                };
                let response = ui.add(
                    egui::ProgressBar::new(value as f32 / 100.)
                        .fill(color.unwrap_or_else(|| self.palette.get("accent")))
                        .desired_width(resolved.width.unwrap_or(ui.available_width()))
                        .desired_height(resolved.height.unwrap_or(height)),
                );
                self.semantic(ui, n, &response, json!(value));
            }
            "NLoading" => self.loading(ui, n, resolved),
            "NDivider" => {
                ui.separator();
            }
            "NLink" => {
                let size = resolved.text_size.unwrap_or(16.);
                let scale = self.font_scale.max(1.);
                let mut caption = egui::RichText::new(label).line_height(Some(resolved.line_height.map_or(size * 1.625, |h| h.points(size)) * scale));
                if p["className"].as_str().unwrap_or("").split_whitespace().any(|s| s == "underline") {
                    caption = caption.underline();
                }
                let mut label = egui::Label::new(caption).sense(egui::Sense::click());
                if let Some(align) = resolved.text_align {
                    label = label.halign(align);
                }
                let response = ui.add(label);
                if response.clicked() {
                    self.click(&n.id);
                }
                self.semantic(ui, n, &response, p["href"].clone());
            }
            "NTooltip" => {
                let response = ui.scope(|ui| self.nodes(ui, &n.children)).response;
                response.on_hover_text(string(&p["message"]));
            }
            "NScrollShadow" => {
                let horizontal = p["orientation"] == "horizontal";
                if horizontal {
                    ui.style_mut().always_scroll_the_only_direction = false;
                }
                let area = if horizontal {
                    egui::ScrollArea::horizontal()
                } else {
                    egui::ScrollArea::vertical()
                };
                let height = resolved
                    .height
                    .unwrap_or_else(|| ui.available_height().min(ui.ctx().viewport_rect().height()));
                let mut area = area.id_salt(&n.id);
                if resolved.height.is_some() {
                    area = area.max_height(height).min_scrolled_height(height).auto_shrink([false, false]);
                }
                let output = area
                    .scroll_bar_visibility(if p["showsScrollIndicator"] == false {
                        egui::scroll_area::ScrollBarVisibility::AlwaysHidden
                    } else {
                        egui::scroll_area::ScrollBarVisibility::VisibleWhenNeeded
                    })
                    .show(ui, |ui| self.nodes(ui, &n.children));
                if output.content_size.x > output.inner_rect.width() {
                    self.register_scroll_target(ui, output.id, output.inner_rect, true);
                }
                if !horizontal && output.content_size.y > output.inner_rect.height() {
                    self.register_scroll_target(ui, output.id, output.inner_rect, false);
                }
                let rect = output.inner_rect;
                let offset = output.state.clamped_offset();
                let remaining = output.content_size - rect.size() - offset;
                let (leading, trailing) = if horizontal { (offset.x, remaining.x) } else { (offset.y, remaining.y) };
                let color = resolved.background.unwrap_or_else(|| self.palette.get("background"));
                for (at_start, distance) in [(true, leading), (false, trailing)] {
                    if distance > 0.5 {
                        ui.painter().add(scroll_edge(rect, horizontal, at_start, distance.min(12.), color));
                    }
                }
            }
            "NRadio" | "NRadioGroup" | "NButtonGroup" | "NTabs" => self.selection(ui, n),
            "NSelect" => {
                self.select(ui, n, resolved, false);
            }
            "NTabsContent" => self.nodes(ui, &n.children),
            "NAlert" | "NEmptyState" => {
                let alert = n.kind == "NAlert";
                let message = ["message", "description"]
                    .iter()
                    .find_map(|key| p[*key].as_str().filter(|text| !alert || !text.is_empty()));
                let heading = if alert {
                    ["label", "title", "name", "text", "fallback", "alt"]
                        .iter()
                        .find_map(|key| p[*key].as_str().filter(|text| !text.is_empty()))
                } else {
                    Some(label.as_str())
                };
                if alert && heading.is_none() && message.is_none() {
                    self.container(ui, n, resolved);
                } else {
                    egui::Frame::group(ui.style()).show(ui, |ui| {
                        if let Some(heading) = heading {
                            ui.heading(heading);
                        }
                        if let Some(message) = message {
                            ui.label(message);
                        }
                        self.nodes(ui, &n.children);
                    });
                }
            }
            "NSkeleton" | "NSkeletonGroup" => {
                let (rect, _) = ui.allocate_exact_size(
                    Vec2::new(resolved.width.unwrap_or(ui.available_width()), resolved.height.unwrap_or(24.)),
                    egui::Sense::hover(),
                );
                ui.painter().rect_filled(rect, resolved.corner_radius(), resolved.background.unwrap_or_else(|| self.palette.get("default")));
            }
            _ => unreachable!("validated UI kind"),
        }
    }

    fn paint_otp(&self, ui: &egui::Ui, node: &Node, response: &Response, value: &str) {
        let slots = otp_slots(node);
        let separators = otp_separators(node, slots);
        let gap = 6_f32.min(response.rect.width() / (slots as f32 * 3.));
        let separator_width = gap * 2.;
        let width = ((response.rect.width() + gap - separator_width * separators.len() as f32) / slots as f32 - gap).max(0.);
        let secret = flag(&node.props, &["secureTextEntry"]) || node.props["type"] == "password";
        let active = value.chars().count().min(slots - 1);
        let appearance = if response.enabled() { 1. } else { 0.55 };
        let mut characters = value.chars();
        let font = ui.style().override_font_id.clone().unwrap_or(egui::FontId::proportional(16.));
        let mut pos = response.rect.min;
        for index in 0..slots {
            let rect = Rect::from_min_size(pos, Vec2::new(width, response.rect.height()));
            ui.painter().rect_filled(rect, 8., self.palette.get("field-background").gamma_multiply(appearance));
            let border = self.palette.get(if response.has_focus() && index == active { "focus" } else { "border" });
            ui.painter().rect_stroke(rect, 8., egui::Stroke::new(1., border.gamma_multiply(appearance)), egui::StrokeKind::Inside);
            if let Some(character) = characters.next() {
                ui.painter().text(rect.center(), egui::Align2::CENTER_CENTER, if secret { '•' } else { character }, font.clone(), ui.visuals().text_color());
            }
            pos.x += width + gap;
            if separators.contains(&index) {
                let center = Pos2::new(rect.right() + (gap + separator_width) * 0.5, rect.center().y);
                let half = Vec2::new(separator_width * 0.25, 0.);
                ui.painter().line_segment([center - half, center + half], egui::Stroke::new(1.5, self.palette.get("muted")));
                pos.x += separator_width;
            }
        }
    }

    fn selection(&mut self, ui: &mut egui::Ui, n: &Node) {
        let p = &n.props;
        let items = p["options"].as_array().or_else(|| p["items"].as_array()).cloned().unwrap_or_default();
        let selected = self.value(n, &["value", "selected"], Value::Null);
        if let Some(label) = p["label"].as_str() {
            ui.label(label);
        }
        let mut render = |ui: &mut egui::Ui| {
            for (index, item) in items.iter().enumerate() {
                let value = item.get("value").cloned().unwrap_or_else(|| item.clone());
                let label = item["label"].as_str().map(str::to_owned).unwrap_or_else(|| string(item));
                let enabled = !flag(item, &["disabled", "isDisabled"]);
                let checked = selected == value || selected == *item;
                let response = if matches!(n.kind.as_str(), "NRadio" | "NRadioGroup") {
                    ui.add_enabled(enabled, egui::RadioButton::new(checked, &label))
                } else {
                    ui.add_enabled(enabled, egui::Button::new(&label).wrap().selected(checked))
                };
                let mut entry = n.clone();
                entry.id = format!("{}:option:{}", n.id, index);
                entry.props = json!({"label":label,"_selected":checked});
                self.semantic(ui, &entry, &response, value.clone());
                if response.clicked() {
                    let result = value;
                    self.values.insert(n.id.clone(), result.clone());
                    self.change(&n.id, result);
                }
            }
        };
        if matches!(n.kind.as_str(), "NTabs" | "NButtonGroup") || p["orientation"] == "horizontal" {
            ui.horizontal_wrapped(&mut render);
        } else {
            render(ui);
        }
        if n.kind == "NTabs" {
            for child in &n.children {
                if child.kind != "NTabsContent" || child.props["item"] == selected {
                    self.nodes(ui, std::slice::from_ref(child));
                }
            }
        }
    }
}

fn otp_slots(node: &Node) -> usize {
    node.props["maxLength"].as_u64().unwrap_or(6).clamp(1, 32) as usize
}

fn otp_separators(node: &Node, slots: usize) -> HashSet<usize> {
    node.props["separatorIndices"].as_array().into_iter().flatten()
        .filter_map(Value::as_u64)
        .filter(|index| *index < slots as u64 - 1)
        .map(|index| index as usize)
        .collect()
}

fn scroll_edge(rect: Rect, horizontal: bool, at_start: bool, depth: f32, color: Color32) -> egui::Shape {
    let axis = if horizontal { Vec2::X } else { Vec2::Y };
    let offset = axis * depth.min(if horizontal { rect.width() } else { rect.height() });
    let (start, end) = match (horizontal, at_start) {
        (true, true) => (rect.left_top(), rect.left_bottom()),
        (true, false) => (rect.right_top(), rect.right_bottom()),
        (false, true) => (rect.left_top(), rect.right_top()),
        (false, false) => (rect.left_bottom(), rect.right_bottom()),
    };
    let inward = if at_start { offset } else { -offset };
    let mut mesh = egui::Mesh::default();
    mesh.colored_vertex(start, color);
    mesh.colored_vertex(end, color);
    mesh.colored_vertex(end + inward, Color32::TRANSPARENT);
    mesh.colored_vertex(start + inward, Color32::TRANSPARENT);
    mesh.add_triangle(0, 1, 2);
    mesh.add_triangle(0, 2, 3);
    egui::Shape::mesh(mesh)
}

#[cfg(test)]
mod tests;
