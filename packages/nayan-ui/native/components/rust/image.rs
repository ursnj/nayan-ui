//! Image lifetimes, request ordering, decoded caching and GPU handles belong to Rust.
use super::*;
use crate::assets::texture::Image;
use std::sync::{
    Arc, LazyLock, Mutex,
    atomic::{AtomicU64, Ordering},
};
const CACHE_BYTES: usize = 32 * 1024 * 1024;
const RETAINED_IMAGE_BYTES: usize = 16 * 1024 * 1024;
const MAX_RETAINED_IMAGES: usize = 64;
static NEXT_REQUEST: AtomicU64 = AtomicU64::new(1);
struct CachedImage {
    image: Arc<Image>,
    last_used: u64,
    disk_requested: bool,
}

#[derive(Default)]
struct Cache {
    items: HashMap<String, CachedImage>,
    clock: u64,
    bytes: usize,
}
static CACHE: LazyLock<Mutex<Cache>> = LazyLock::new(Default::default);
impl Cache {
    fn get(&mut self, key: &str, disk: bool) -> Option<Arc<Image>> {
        self.clock += 1;
        let entry = self.items.get_mut(key)?;
        // The source loader must see the disk policy to persist previously memory-only bytes.
        if disk && !entry.disk_requested {
            return None;
        }
        entry.last_used = self.clock;
        Some(entry.image.clone())
    }

    fn insert(&mut self, key: String, image: Arc<Image>, disk: bool) {
        let size = image.rgba.len();
        if size > CACHE_BYTES {
            return;
        }
        if let Some(old) = self.items.remove(&key) {
            self.bytes -= old.image.rgba.len();
        }
        self.clock += 1;
        self.bytes += size;
        self.items.insert(
            key,
            CachedImage {
                image,
                last_used: self.clock,
                disk_requested: disk,
            },
        );
        while self.bytes > CACHE_BYTES {
            let Some(oldest) = self.items.iter().min_by_key(|(_, entry)| entry.last_used).map(|(key, _)| key.clone()) else {
                break;
            };
            if let Some(old) = self.items.remove(&oldest) {
                self.bytes -= old.image.rgba.len();
            }
        }
    }
}

enum State {
    Pending,
    Ready(Arc<Image>, Option<egui::TextureHandle>),
    Error(String),
}

struct Resource {
    request: u64,
    source: Value,
    policy: String,
    cache_key: String,
    started: bool,
    state: State,
    mask: Option<egui::TextureHandle>,
    target: Option<Target>,
    last_painted: u64,
}

impl Resource {
    fn retained_bytes(&self) -> Option<usize> {
        let State::Ready(image, texture) = &self.state else {
            return None;
        };
        let textures = usize::from(texture.is_some()) + usize::from(self.mask.is_some());
        let bytes = image.rgba.len() * (1 + textures);
        (textures > 0
            && bytes <= RETAINED_IMAGE_BYTES
            && matches!(self.policy.as_str(), "memory" | "memory-disk")
            && self.source["cache"] != "reload")
            .then_some(bytes)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
struct Target {
    width: u32,
    height: u32,
    fit: u32,
}
impl Target {
    fn layout(size: Vec2, density: f32, props: &Value) -> Self {
        let fit = match props["contentFit"].as_str().or(props["resizeMode"].as_str()).unwrap_or("cover") {
            "contain" | "center" | "scale-down" => 1,
            "fill" | "stretch" => 2,
            "none" | "repeat" => 3,
            _ => 0,
        };
        if props["allowDownscaling"] == false || fit == 3 {
            return Self { width: 0, height: 0, fit: 3 };
        }
        // Stable buckets prevent a new decode for tiny layout changes. Bound each thumbnail to 4 MP.
        let size = size * density.clamp(0.5, 4.);
        let ratio = (4_194_304. / (size.x * size.y).max(1.)).sqrt().min(1.);
        let bucket = |v: f32| (((v * ratio).ceil() as u32).div_ceil(64) * 64).clamp(64, 4096);
        Self {
            width: bucket(size.x),
            height: bucket(size.y),
            fit,
        }
    }
}

fn source_for(source: &Value, target: Option<Target>) -> &Value {
    let Some(sources) = source.as_array() else { return source };
    let target = target.unwrap_or(Target {
        width: 64,
        height: 64,
        fit: 0,
    });
    let dimensions = |s: &Value| {
        let scale = s["scale"].as_f64().unwrap_or(1.).max(0.01);
        (s["width"].as_f64().unwrap_or(0.) * scale, s["height"].as_f64().unwrap_or(0.) * scale)
    };
    let adequate = |s: &&Value| {
        let (w, h) = dimensions(s);
        if target.fit == 3 {
            return false;
        }
        if target.fit == 1 {
            w >= target.width as f64 || h >= target.height as f64
        } else {
            w >= target.width as f64 && h >= target.height as f64
        }
    };
    sources
        .iter()
        .filter(adequate)
        .min_by(|a, b| {
            let (aw, ah) = dimensions(a);
            let (bw, bh) = dimensions(b);
            (aw * ah).total_cmp(&(bw * bh))
        })
        .or_else(|| {
            sources.iter().max_by(|a, b| {
                let (aw, ah) = dimensions(a);
                let (bw, bh) = dimensions(b);
                (aw * ah).total_cmp(&(bw * bh))
            })
        })
        .unwrap_or(&Value::Null)
}

#[derive(Clone)]
struct Widget {
    primary: Option<String>,
    placeholder: Option<String>,
    fallback: Option<String>,
    status: &'static str,
    target: Option<Target>,
    displayed: Option<String>,
    props: Value,
}

impl Widget {
    fn priority_source(&self) -> Option<&str> {
        if self.target.is_none() || self.props["priority"] != true {
            return None;
        }
        match self.status {
            "loading" => self.primary.as_deref(),
            "error" => self.fallback.as_deref(),
            _ => None,
        }
    }
}

pub(super) struct ImageEvent {
    pub id: String,
    pub kind: &'static str,
    pub value: Value,
}

#[derive(Default)]
pub(super) struct Images {
    resources: HashMap<String, Resource>,
    widgets: HashMap<String, Widget>,
    events: Vec<ImageEvent>,
    references_changed: bool,
    request_revision: u64,
    paint_clock: u64,
}

impl Images {
    fn resource(&mut self, input: &Value, policy: &str, recycling: &Value, target: Option<Target>) -> Option<String> {
        let source = source_for(input, target);
        if source.is_null() {
            return None;
        }
        let mut identity = source.clone();
        if let Some(object) = identity.as_object_mut() {
            object.remove("cache");
        }
        if let Some(object) = identity.as_object_mut() {
            object.remove("width");
            object.remove("height");
            object.remove("scale");
        }
        let cache_key = format!("{}:{:?}", serde_json::to_string(&identity).unwrap_or_default(), target);
        let key = format!("{}:{}:{}:{}", cache_key, policy, recycling, source["cache"]);
        if !self.resources.contains_key(&key) {
            let cacheable = matches!(policy, "memory" | "memory-disk") && source["cache"] != "reload";
            let cached = cacheable
                .then(|| CACHE.lock().ok().and_then(|mut cache| cache.get(&cache_key, policy == "memory-disk")))
                .flatten();
            let state = if source["uri"].as_str().is_none_or(str::is_empty) {
                State::Error(source["error"].as_str().unwrap_or("Image source is empty").into())
            } else if let Some(image) = cached {
                State::Ready(image, None)
            } else {
                State::Pending
            };
            self.resources.insert(
                key.clone(),
                Resource {
                    request: NEXT_REQUEST.fetch_add(1, Ordering::Relaxed),
                    source: source.clone(),
                    policy: policy.into(),
                    cache_key,
                    started: false,
                    state,
                    mask: None,
                    target,
                    last_painted: 0,
                },
            );
        }
        Some(key)
    }

    pub fn sync(&mut self, nodes: &[Node]) {
        let mut live = HashSet::new();
        self.sync_nodes(nodes, &mut live);
        let previous = self.widgets.len();
        self.widgets.retain(|id, _| live.contains(id));
        self.references_changed |= self.widgets.len() != previous;
        self.notify();
        self.finish_layout();
    }

    fn sync_nodes(&mut self, nodes: &[Node], live: &mut HashSet<String>) {
        for node in nodes {
            if node.kind == "NImage" {
                live.insert(node.id.clone());
                if self.widgets.get(&node.id).is_some_and(|widget| widget.props == node.props) {
                    self.sync_nodes(&node.children, live);
                    continue;
                }
                self.references_changed = true;
                let target = self.widgets.get(&node.id).and_then(|w| w.target);
                let policy = node.props["cachePolicy"].as_str().unwrap_or("memory-disk");
                let primary = self.resource(&node.props["source"], policy, &node.props["recyclingKey"], target);
                let placeholder = self.resource(&node.props["placeholder"], policy, &Value::Null, target);
                let fallback = self.resource(&node.props["fallbackSource"], policy, &Value::Null, target);
                let changed = self.widgets.get(&node.id).is_none_or(|old| old.primary != primary);
                let status = if changed {
                    if primary.is_some() { "loading" } else { "empty" }
                } else {
                    self.widgets[&node.id].status
                };
                if changed && primary.is_some() {
                    self.events.push(ImageEvent {
                        id: node.id.clone(),
                        kind: "loadStart",
                        value: Value::Null,
                    });
                }
                self.widgets.insert(
                    node.id.clone(),
                    Widget {
                        primary,
                        placeholder,
                        fallback,
                        status,
                        target,
                        displayed: if changed {
                            None
                        } else {
                            self.widgets.get(&node.id).and_then(|w| w.displayed.clone())
                        },
                        props: node.props.clone(),
                    },
                );
            }
            self.sync_nodes(&node.children, live);
        }
    }

    fn notify(&mut self) {
        for (id, widget) in &mut self.widgets {
            if !matches!(widget.status, "loading" | "resizing") {
                continue;
            }
            let Some(resource) = widget.primary.as_ref().and_then(|key| self.resources.get(key)) else {
                continue;
            };
            let (kind, value, status) = match &resource.state {
                State::Pending => continue,
                State::Ready(image, _) => (
                    "load",
                    json!({"width":image.source_size.unwrap_or([image.width,image.height])[0],"height":image.source_size.unwrap_or([image.width,image.height])[1],"uri":resource.source["uri"]}),
                    "loaded",
                ),
                State::Error(error) => ("error", json!({"error":error}), "error"),
            };
            if widget.status == "resizing" {
                if status == "loaded" {
                    self.references_changed |= widget.displayed.take().is_some();
                }
                widget.status = if status == "error" && widget.displayed.is_some() {
                    "loaded"
                } else {
                    status
                };
                continue;
            }
            widget.status = status;
            self.events.push(ImageEvent { id: id.clone(), kind, value });
            self.events.push(ImageEvent {
                id: id.clone(),
                kind: "loadEnd",
                value: Value::Null,
            });
        }
    }

    fn schedule(&mut self) {
        let slots = 4usize.saturating_sub(self.active_requests().count());
        if slots == 0 {
            return;
        }
        let mut needed = HashSet::new();
        let mut priority = HashSet::new();
        for widget in self.widgets.values() {
            priority.extend(widget.priority_source());
            needed.extend(widget.primary.as_deref());
            let extra = if widget.status == "error" {
                widget.fallback.as_deref()
            } else if widget.status == "loaded" {
                None
            } else {
                widget.placeholder.as_deref()
            };
            needed.extend(extra);
        }
        let mut waiting: Vec<_> = self
            .resources
            .iter_mut()
            .filter(|(key, r)| needed.contains(key.as_str()) && !r.started && r.target.is_some() && matches!(r.state, State::Pending))
            .map(|(key, resource)| (priority.contains(key.as_str()), resource))
            .collect();
        waiting.sort_unstable_by_key(|(priority, resource)| (!priority, resource.request));
        for (_, resource) in waiting.into_iter().take(slots) {
            resource.started = true;
            self.request_revision = self.request_revision.wrapping_add(1);
        }
    }

    fn active_requests(&self) -> impl Iterator<Item = &Resource> {
        self.resources.values().filter(|r| r.started && matches!(r.state, State::Pending))
    }

    pub fn request_revision(&self) -> u64 {
        self.request_revision
    }

    pub fn priority_pending(&self) -> bool {
        self.widgets
            .values()
            .filter_map(Widget::priority_source)
            .any(|key| self.resources.get(key).is_some_and(|resource| matches!(resource.state, State::Pending)))
    }

    pub fn requests(&self) -> Vec<Value> {
        let mut requests: Vec<_> = self.active_requests().collect();
        requests.sort_unstable_by_key(|r| r.request);
        requests
            .into_iter()
            .map(|r| json!({"request":r.request,"source":r.source,"cachePolicy":r.policy,"decode":r.target}))
            .collect()
    }

    pub fn complete(&mut self, request: u64, image: Option<Arc<Image>>, error: Option<&str>) {
        let Some(resource) = self
            .resources
            .values_mut()
            .find(|r| r.request == request && matches!(r.state, State::Pending))
        else {
            return;
        };
        if resource.started {
            self.request_revision = self.request_revision.wrapping_add(1);
        }
        resource.state = if let Some(image) = image {
            if matches!(resource.policy.as_str(), "memory" | "memory-disk") {
                if let Ok(mut cache) = CACHE.lock() {
                    cache.insert(resource.cache_key.clone(), image.clone(), resource.policy == "memory-disk");
                }
            }
            State::Ready(image, None)
        } else {
            State::Error(error.unwrap_or("Image could not be decoded").into())
        };
        self.notify();
        self.schedule();
    }
    /// Decoded pixels stay; each image uploads again the next time it is painted.
    pub fn forget_textures(&mut self) {
        for resource in self.resources.values_mut() {
            resource.mask = None;
            if let State::Ready(_, texture) = &mut resource.state {
                *texture = None;
            }
        }
        self.references_changed = true;
    }

    pub fn events(&mut self) -> Vec<ImageEvent> {
        std::mem::take(&mut self.events)
    }

    fn prepare(&mut self, id: &str, target: Target) {
        let Some(old) = self.widgets.get(id) else {
            return;
        };
        if old.target == Some(target) {
            return;
        }
        let old = old.clone();
        let props = &old.props;
        let policy = props["cachePolicy"].as_str().unwrap_or("memory-disk");
        let primary = self.resource(&props["source"], policy, &props["recyclingKey"], Some(target));
        let placeholder = self.resource(&props["placeholder"], policy, &Value::Null, Some(target));
        let fallback = self.resource(&props["fallbackSource"], policy, &Value::Null, Some(target));
        let widget = self.widgets.get_mut(id).unwrap();
        if old.status == "loaded" && widget.displayed.is_none() {
            widget.displayed = old.primary;
            widget.status = "resizing";
        }
        widget.primary = primary;
        widget.placeholder = placeholder;
        widget.fallback = fallback;
        widget.target = Some(target);
        self.references_changed = true;
        self.notify();
    }
    fn dimensions(&self, key: Option<&String>) -> Option<[u32; 2]> {
        match &self.resources.get(key?)?.state {
            State::Ready(image, _) => Some(image.source_size.unwrap_or([image.width, image.height])),
            _ => None,
        }
    }
    pub fn finish_layout(&mut self) {
        if !std::mem::take(&mut self.references_changed) || self.resources.is_empty() {
            return;
        }
        let used: HashSet<_> = self
            .widgets
            .values()
            .flat_map(|w| {
                [
                    w.primary.as_deref(),
                    w.placeholder.as_deref(),
                    w.fallback.as_deref(),
                    w.displayed.as_deref(),
                ]
            })
            .flatten()
            .collect();
        let mut retained_count = 0;
        let mut retained_bytes = 0;
        let revision = &mut self.request_revision;
        self.resources.retain(|key, resource| {
            if used.contains(key.as_str()) {
                return true;
            }
            // A row can leave the React window and return in the same fling. Keep its
            // uploaded texture in this document, where the texture ID is still valid.
            if let Some(bytes) = resource.retained_bytes() {
                retained_bytes += bytes;
                retained_count += 1;
                return true;
            }
            if resource.started && matches!(resource.state, State::Pending) {
                *revision = revision.wrapping_add(1);
            }
            false
        });
        if retained_bytes > RETAINED_IMAGE_BYTES || retained_count > MAX_RETAINED_IMAGES {
            let mut retained: Vec<_> = self
                .resources
                .iter()
                .filter(|(key, _)| !used.contains(key.as_str()))
                .filter_map(|(key, resource)| Some((resource.last_painted, resource.retained_bytes()?, key.clone())))
                .collect();
            retained.sort_unstable_by_key(|entry| entry.0);
            for (_, bytes, key) in retained {
                if retained_bytes <= RETAINED_IMAGE_BYTES && retained_count <= MAX_RETAINED_IMAGES {
                    break;
                }
                self.resources.remove(&key);
                retained_bytes -= bytes;
                retained_count -= 1;
            }
        }
        // Prioritize after the entire visible layout has registered its images.
        self.schedule();
    }

    pub fn paint(&mut self, ui: &mut egui::Ui, node: &Node, style: &style::Style) -> (egui::Response, Value) {
        let widget = self.widgets.get(&node.id);
        let source = source_for(&node.props["source"], widget.and_then(|w| w.target));
        let intrinsic = self
            .dimensions(widget.and_then(|w| w.displayed.as_ref().or(w.primary.as_ref())))
            .unwrap_or([64, 64]);
        let natural = Vec2::new(
            source["width"].as_f64().map(|v| v as f32).unwrap_or_else(|| intrinsic[0] as f32),
            source["height"].as_f64().map(|v| v as f32).unwrap_or_else(|| intrinsic[1] as f32),
        );
        let width = style.width.unwrap_or(natural.x).min(ui.available_width()).max(0.);
        let height = style
            .height
            .unwrap_or_else(|| {
                style
                    .aspect_ratio
                    .map(|v| v as f64)
                    .or_else(|| node.props["style"]["aspectRatio"].as_f64())
                    .filter(|v| *v > 0.)
                    .map(|v| width / v as f32)
                    .unwrap_or(width * natural.y / natural.x.max(1.))
            })
            .max(0.);
        let (rect, response) = ui.allocate_exact_size(Vec2::new(width, height), egui::Sense::hover());
        let visible = rect.intersects(ui.clip_rect()) && rect.is_positive();
        if visible {
            self.prepare(&node.id, Target::layout(rect.size(), ui.ctx().pixels_per_point(), &node.props));
        }
        let widget = self.widgets.get(&node.id);
        let status = widget.map_or("empty", |w| w.status);
        if !visible {
            return (response, json!({"status":status,"width":natural.x,"height":natural.y}));
        }
        let chosen = widget.and_then(|w| {
            w.displayed.as_ref().or(match status {
                "loaded" => w.primary.as_ref(),
                "error" => w.fallback.as_ref(),
                _ => w.placeholder.as_ref(),
            })
        });
        let tint = node.props["tintColor"].as_str().and_then(theme::parse_color);
        let tinted = tint.is_some();
        let image = chosen.and_then(|key| self.resources.get_mut(key)).and_then(|r| match &mut r.state {
            State::Ready(image, texture) => {
                self.paint_clock += 1;
                r.last_painted = self.paint_clock;
                let target = if tinted { &mut r.mask } else { texture };
                let texture = target.get_or_insert_with(|| {
                    let mask = tinted.then(|| image.rgba.chunks_exact(4).flat_map(|p| [255, 255, 255, p[3]]).collect::<Vec<u8>>());
                    ui.ctx().load_texture(
                        format!("ui-image-{}-{tinted}", r.request),
                        egui::ColorImage::from_rgba_unmultiplied(
                            [image.width as usize, image.height as usize],
                            mask.as_deref().unwrap_or(&image.rgba),
                        ),
                        egui::TextureOptions {
                            wrap_mode: egui::TextureWrapMode::Repeat,
                            ..egui::TextureOptions::LINEAR
                        },
                    )
                });
                Some((texture.id(), image.width as f32, image.height as f32))
            }
            _ => None,
        });
        if let Some(color) = style.background {
            ui.painter().rect_filled(rect, style.corner_radius(), color);
        }
        if let Some((texture, w, h)) = image {
            let fit = node.props["contentFit"].as_str().or(node.props["resizeMode"].as_str()).unwrap_or("cover");
            let (dest, uv) = fit_rect(rect, Vec2::new(w, h), fit);
            egui::Image::new((texture, Vec2::new(w, h)))
                .uv(uv)
                .fit_to_exact_size(dest.size())
                .corner_radius(style.corner_radius())
                .tint(tint.unwrap_or(Color32::WHITE))
                .paint_at(ui, dest);
        } else if status == "error" {
            let alt = node.props["alt"].as_str().unwrap_or("");
            ui.painter().text(
                rect.center(),
                egui::Align2::CENTER_CENTER,
                alt,
                egui::FontId::proportional(14.),
                ui.visuals().weak_text_color(),
            );
        }
        if style.border_width > 0. {
            ui.painter().rect_stroke(
                rect,
                style.corner_radius(),
                egui::Stroke::new(style.border_width, style.border.unwrap_or(Color32::TRANSPARENT)),
                egui::StrokeKind::Inside,
            );
        }
        (response, json!({"status":status,"width":natural.x,"height":natural.y}))
    }
}

pub(super) fn fit_rect(rect: Rect, image: Vec2, fit: &str) -> (Rect, Rect) {
    let full = Rect::from_min_max(Pos2::ZERO, Pos2::new(1., 1.));
    if fit == "cover" {
        let ratio = rect.aspect_ratio() / (image.x / image.y.max(1.));
        let extent = if ratio < 1. { Vec2::new(ratio, 1.) } else { Vec2::new(1., 1. / ratio) };
        return (rect, Rect::from_center_size(Pos2::new(0.5, 0.5), extent));
    }
    if fit == "none" {
        let size = rect.size().min(image);
        return (
            Rect::from_center_size(rect.center(), size),
            Rect::from_center_size(Pos2::new(0.5, 0.5), size / image),
        );
    }
    if matches!(fit, "contain" | "center" | "scale-down") {
        let mut scale = (rect.width() / image.x).min(rect.height() / image.y);
        if matches!(fit, "center" | "scale-down") {
            scale = scale.min(1.);
        }
        return (Rect::from_center_size(rect.center(), image * scale), full);
    }
    if fit == "repeat" {
        return (rect, Rect::from_min_size(Pos2::ZERO, rect.size() / image));
    }
    (rect, full)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn tree(uri: &str, extra: Value) -> Vec<Node> {
        let mut props = json!({"source":{"uri":uri},"cachePolicy":"none"});
        props.as_object_mut().unwrap().extend(extra.as_object().unwrap().clone());
        serde_json::from_value(json!([{"id":"image","kind":"NImage","props":props}])).unwrap()
    }

    fn sync(images: &mut Images, nodes: &[Node]) {
        images.sync(nodes);
        for node in nodes {
            images.prepare(
                &node.id,
                Target {
                    width: 64,
                    height: 64,
                    fit: 0,
                },
            );
        }
        images.finish_layout();
    }
    fn pixels() -> Arc<Image> {
        Arc::new(Image {
            source_size: None,
            width: 2,
            height: 1,
            rgba: vec![255; 8],
        })
    }
    #[test]
    fn webp_decode_preserves_dimensions_and_transparency() {
        let pixels = [255, 0, 0, 255, 0, 255, 0, 128];
        let mut bytes = Vec::new();
        image_webp::WebPEncoder::new(&mut bytes)
            .encode(&pixels, 2, 1, image_webp::ColorType::Rgba8)
            .unwrap();
        let decoded = crate::assets::texture::decode(&bytes).unwrap();
        assert_eq!((decoded.width, decoded.height), (2, 1));
        assert_eq!(decoded.rgba, pixels);
        let temporary = crate::assets::texture::register(decoded).unwrap();
        let transferred = crate::assets::texture::take(temporary).unwrap();
        assert_eq!(transferred.rgba, pixels);
        assert!(crate::assets::texture::get(temporary).is_none());
        assert!(crate::assets::texture::take(temporary).is_none());
    }
    #[test]
    fn replacing_source_ignores_stale_decode_and_emits_each_callback_once() {
        let mut images = Images::default();
        sync(&mut images, &tree("old", json!({})));
        let old = images.requests()[0]["request"].as_u64().unwrap();
        assert_eq!(images.events().len(), 1);
        sync(&mut images, &tree("new", json!({})));
        let new = images.requests()[0]["request"].as_u64().unwrap();
        images.events();
        images.complete(old, Some(pixels()), None);
        assert!(images.events().is_empty());
        images.complete(new, Some(pixels()), None);
        assert_eq!(images.events().iter().map(|e| e.kind).collect::<Vec<_>>(), vec!["load", "loadEnd"]);
        images.complete(new, None, Some("late"));
        sync(&mut images, &tree("new", json!({})));
        assert!(images.events().is_empty());
        assert!(images.requests().is_empty());
        sync(&mut images, &[]);
        assert!(images.resources.is_empty());
    }
    #[test]
    fn placeholder_and_fallback_are_loaded_only_when_needed() {
        let mut images = Images::default();
        sync(
            &mut images,
            &tree("primary", json!({"placeholder":{"uri":"pending"},"fallbackSource":{"uri":"fallback"}})),
        );
        assert_eq!(images.requests().len(), 2);
        assert!(!images.requests().iter().any(|r| r["source"]["uri"] == "fallback"));
        let token = images.requests().iter().find(|r| r["source"]["uri"] == "primary").unwrap()["request"]
            .as_u64()
            .unwrap();
        images.complete(token, None, Some("HTTP 404"));
        assert!(images.requests().iter().any(|r| r["source"]["uri"] == "fallback"));
        let events = images.events();
        assert_eq!(events.iter().map(|e| e.kind).collect::<Vec<_>>(), vec!["loadStart", "error", "loadEnd"]);
        assert_eq!(events[1].value["error"], "HTTP 404");
    }
    #[test]
    fn duplicate_images_share_one_request_and_load_queue_is_bounded() {
        let mut images = Images::default();
        let mut nodes = tree("shared", json!({}));
        for i in 0..10 {
            let mut node = nodes[0].clone();
            node.id = format!("image{i}");
            if i > 0 {
                node.props["source"]["uri"] = json!(format!("uri{i}"));
            }
            nodes.push(node);
        }
        sync(&mut images, &nodes);
        assert_eq!(images.resources.len(), 10);
        assert_eq!(images.requests().len(), 4);
        let request = images.requests()[0]["request"].as_u64().unwrap();
        images.complete(request, Some(pixels()), None);
        assert_eq!(images.requests().len(), 4);
    }
    #[test]
    fn visible_priority_images_take_queue_slots_before_normal_images() {
        let mut images = Images::default();
        let mut nodes = Vec::new();
        for index in 0..6 {
            let mut node = tree(&format!("queue-{index}"), json!({"priority": index >= 4})).remove(0);
            node.id = index.to_string();
            nodes.push(node);
        }
        sync(&mut images, &nodes[..5]);
        assert!(images.priority_pending());
        assert!(!images.requests().iter().any(|r| r["source"]["uri"] == "queue-3"));
        let urgent = images.requests().into_iter().find(|r| r["source"]["uri"] == "queue-4").unwrap();
        images.complete(urgent["request"].as_u64().unwrap(), Some(pixels()), None);
        assert!(!images.priority_pending());
        // A priority image without layout is offscreen and never blocks startup.
        images.sync(&nodes);
        assert!(!images.priority_pending());
    }
    #[test]
    fn decoded_memory_cache_is_reused_but_reload_bypasses_it() {
        let mut images = Images::default();
        let props = json!({"cachePolicy":"memory"});
        sync(&mut images, &tree("unit-memory-cache", props.clone()));
        let token = images.requests()[0]["request"].as_u64().unwrap();
        images.complete(token, Some(pixels()), None);
        let mut next = Images::default();
        sync(&mut next, &tree("unit-memory-cache", props));
        assert!(next.requests().is_empty());
        assert_eq!(next.widgets["image"].status, "loaded");
        sync(
            &mut next,
            &tree(
                "unit-memory-cache",
                json!({"cachePolicy":"memory","source":{"uri":"unit-memory-cache","cache":"reload"}}),
            ),
        );
        assert_eq!(next.requests().len(), 1);
    }
    #[test]
    fn memory_only_pixels_do_not_prevent_later_disk_caching() {
        let mut images = Images::default();
        sync(&mut images, &tree("upgrade-to-disk", json!({"cachePolicy":"memory"})));
        let request = images.requests()[0]["request"].as_u64().unwrap();
        images.complete(request, Some(pixels()), None);

        for expect_request in [true, false] {
            let mut next = Images::default();
            sync(&mut next, &tree("upgrade-to-disk", json!({"cachePolicy":"memory-disk"})));
            assert_eq!(next.requests().len(), usize::from(expect_request));
            if expect_request {
                next.complete(next.requests()[0]["request"].as_u64().unwrap(), Some(pixels()), None);
            }
        }
    }
    #[test]
    fn remounted_list_images_reuse_the_uploaded_texture_when_cached() {
        for (policy, directive, retained) in [
            ("memory-disk", "default", true),
            ("none", "default", false),
            ("memory", "reload", false),
        ] {
            let mut doc = ComponentDocument::default();
            let mut nodes = tree(
                "",
                json!({
                    "source":{"uri":format!("remount-{policy}-{directive}"),"cache":directive},
                    "cachePolicy":policy,"recyclingKey":"same-item","width":64,"height":64
                }),
            );
            let set = |doc: &mut ComponentDocument, nodes: &[Node]| {
                doc.set_tree(&json!(nodes)).unwrap();
            };
            set(&mut doc, &nodes);
            doc.frame(400., 600., 1.).drop_without_applying_deltas();
            let request = doc.images.requests()[0]["request"].as_u64().unwrap();
            doc.images.complete(request, Some(pixels()), None);
            let output = doc.frame(400., 600., 1.);
            let texture = output
                .textures_delta
                .set
                .iter()
                .find_map(|(id, _)| (*id != egui::TextureId::default()).then_some(*id))
                .unwrap();
            output.drop_without_applying_deltas();

            set(&mut doc, &[]);
            let output = doc.frame(400., 600., 1.);
            let freed = output.textures_delta.free.contains(&texture);
            output.drop_without_applying_deltas();
            assert_eq!(freed, !retained);
            // A remounted React item can receive a new host ID while its source stays stable.
            nodes[0].id = "remounted-image".into();
            set(&mut doc, &nodes);
            let output = doc.frame(400., 600., 1.);
            let uploaded = !output.textures_delta.set.is_empty();
            output.drop_without_applying_deltas();
            assert!(!uploaded);
            assert_eq!(doc.images.requests().is_empty(), retained);
            assert_eq!(doc.images.widgets["remounted-image"].status, if retained { "loaded" } else { "loading" });
        }
    }
    #[test]
    fn image_fit_crops_cover_centers_contain_and_preserves_none_pixels() {
        let rect = Rect::from_min_size(Pos2::ZERO, Vec2::splat(100.));
        let image = Vec2::new(200., 100.);
        let (dest, uv) = fit_rect(rect, image, "cover");
        assert_eq!(dest, rect);
        assert_eq!(uv.min.x, 0.25);
        assert_eq!(uv.width(), 0.5);
        let (dest, uv) = fit_rect(rect, image, "contain");
        assert_eq!(dest.min.y, 25.);
        assert_eq!(dest.size(), Vec2::new(100., 50.));
        assert_eq!(uv.width(), 1.);
        let (dest, uv) = fit_rect(rect, image, "none");
        assert_eq!(dest, rect);
        assert_eq!(uv.width(), 0.5);
        assert_eq!(fit_rect(rect, Vec2::splat(25.), "scale-down").0.size(), Vec2::splat(25.));
        assert_eq!(fit_rect(rect, Vec2::splat(25.), "repeat").1.size(), Vec2::splat(4.));
    }
    #[test]
    fn layout_defers_io_selects_density_appropriate_variants_and_reuses_buckets() {
        let mut images = Images::default();
        let nodes = tree(
            "",
            json!({"source":[{"uri":"thumb","width":256,"height":256},{"uri":"large","width":1024,"height":1024}]}),
        );
        images.sync(&nodes);
        assert!(images.requests().is_empty(), "no decode before layout");
        let target = Target::layout(Vec2::splat(80.), 3., &nodes[0].props);
        images.prepare("image", target);
        images.finish_layout();
        let request = images.requests()[0].clone();
        assert_eq!(request["source"]["uri"], "thumb");
        assert_eq!(request["decode"]["width"], 256);
        images.prepare("image", Target::layout(Vec2::splat(81.), 3., &nodes[0].props));
        assert_eq!(images.requests()[0]["request"], request["request"]);
        images.prepare("image", Target::layout(Vec2::splat(180.), 3., &nodes[0].props));
        images.finish_layout();
        assert_eq!(images.requests()[0]["source"]["uri"], "large");
        assert_eq!(images.requests().len(), 1, "obsolete decode tokens leave the I/O queue");
    }
    #[test]
    fn resizing_keeps_old_pixels_and_does_not_repeat_load_callbacks() {
        let mut images = Images::default();
        sync(&mut images, &tree("resizing", json!({})));
        let token = images.requests()[0]["request"].as_u64().unwrap();
        images.complete(token, Some(pixels()), None);
        images.events();
        images.prepare(
            "image",
            Target {
                width: 512,
                height: 512,
                fit: 0,
            },
        );
        assert!(images.widgets["image"].displayed.is_some());
        images.finish_layout();
        let next = images.requests()[0]["request"].as_u64().unwrap();
        images.complete(next, Some(pixels()), None);
        images.finish_layout();
        assert!(images.widgets["image"].displayed.is_none());
        assert!(images.events().is_empty());
        assert_eq!(images.resources.len(), 1);
    }
}
