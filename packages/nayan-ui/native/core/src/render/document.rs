//! Shared document handles and surface input for the UI and drawing features.
use serde_json::Value;

#[cfg(any(feature = "components", feature = "drawing"))]
use std::{
    collections::HashMap,
    sync::{LazyLock, Mutex},
};

#[cfg(any(feature = "components", feature = "drawing"))]
enum Document {
    #[cfg(feature = "drawing")]
    Drawing(Box<crate::drawing::Document>),
    #[cfg(feature = "components")]
    Components(Box<crate::components::surface::Surface>),
}

#[cfg(any(feature = "components", feature = "drawing"))]
struct Registry {
    next: i32,
    documents: HashMap<i32, Document>,
}

#[cfg(any(feature = "components", feature = "drawing"))]
static DOCUMENTS: LazyLock<Mutex<Registry>> = LazyLock::new(|| {
    Mutex::new(Registry {
        next: 500_000,
        documents: HashMap::new(),
    })
});

#[cfg(any(feature = "components", feature = "drawing"))]
fn insert(document: Document) -> Result<i32, String> {
    let mut registry = DOCUMENTS.lock().map_err(|_| "Surface registry unavailable")?;
    let id = registry.next;
    registry.next = id.checked_add(1).ok_or("Surface identifiers exhausted")?;
    registry.documents.insert(id, document);
    Ok(id)
}

#[cfg(feature = "drawing")]
pub(crate) fn create_art(document: crate::drawing::Document) -> Result<i32, String> {
    insert(Document::Drawing(Box::new(document)))
}

#[cfg(feature = "components")]
pub(crate) fn create_component() -> Result<i32, String> {
    insert(Document::Components(Box::default()))
}

#[cfg(feature = "drawing")]
pub(crate) fn with_art<T>(id: i32, f: impl FnOnce(&mut crate::drawing::Document) -> T) -> Option<T> {
    with(id, |doc| match doc {
        Document::Drawing(art) => Some(f(art)),
        #[cfg(feature = "components")]
        Document::Components(_) => None,
    })
    .flatten()
}

pub(crate) fn destroy(id: i32) {
    #[cfg(any(feature = "components", feature = "drawing"))]
    if let Ok(mut registry) = DOCUMENTS.lock() {
        registry.documents.remove(&id);
    }
    let _ = id;
}

#[cfg(any(feature = "components", feature = "drawing"))]
fn with<T>(id: i32, f: impl FnOnce(&mut Document) -> T) -> Option<T> {
    DOCUMENTS.lock().ok()?.documents.get_mut(&id).map(f)
}

/// Refresh drawing textures before the game renderer takes its own lock.
#[cfg(all(feature = "games", feature = "drawing"))]
pub(crate) fn sync_textures() {
    if let Ok(mut registry) = DOCUMENTS.lock() {
        for entry in registry.documents.values_mut() {
            match entry {
                Document::Drawing(art) => art.sync_texture(),
                #[cfg(feature = "components")]
                Document::Components(_) => {}
            }
        }
    }
}

#[cfg(any(feature = "components", feature = "drawing"))]
pub fn number(v: &Value, key: &str, default: f32) -> f32 {
    v.get(key)
        .and_then(|v| v.as_f64().or_else(|| v.as_str()?.parse().ok()))
        .filter(|n| n.is_finite())
        .map_or(default, |n| n as f32)
}

pub(crate) fn command(id: i32, value: Value) -> Result<Value, String> {
    #[cfg(feature = "components")]
    match value["op"].as_str() {
        Some("componentStyle") => return crate::components::platform_style::resolve(&value),
        Some("componentToast") => return crate::components::toast::command(&value),
        Some("componentCropImage") => return crate::components::capture::crop(&value),
        Some("componentImage") => {
            // Decoding can complete after disposal. Always take and release the temporary image.
            let image = value["texture"]
                .as_u64()
                .and_then(|id| u32::try_from(id).ok())
                .and_then(crate::assets::texture::take);
            return Ok(with(id, |doc| match doc {
                Document::Components(ui) => ui.image_result(&value, image),
                #[cfg(feature = "drawing")]
                Document::Drawing(_) => Value::Null,
            })
            .unwrap_or(Value::Null));
        }
        _ => {}
    }
    #[cfg(any(feature = "components", feature = "drawing"))]
    {
        return with(id, |document| {
            // Older React Native bundles initialize UI by creating a drawing-backed handle first.
            #[cfg(all(feature = "components", feature = "drawing"))]
            if matches!(document, Document::Drawing(_)) && value["op"] == "components" && value["action"] == "tree" {
                *document = Document::Components(Box::default());
            }
            match document {
                #[cfg(feature = "drawing")]
                Document::Drawing(art) => art.surface_command(id, value),
                #[cfg(feature = "components")]
                Document::Components(ui) => ui.command(id, &value),
            }
        })
        .ok_or_else(|| "Surface document has been disposed".to_owned())?;
    }
    #[cfg(not(any(feature = "components", feature = "drawing")))]
    {
        let _ = (id, value);
        Err("Engine surface support was disabled in this build".into())
    }
}

macro_rules! route {
    ($name:ident($($arg:ident: $ty:ty),*) -> $ret:ty = $fallback:expr, $art:expr, $ui:expr) => {
        pub(crate) fn $name(id: i32, $($arg: $ty),*) -> $ret {
            #[cfg(any(feature = "components", feature = "drawing"))]
            {
                let _ = ($(&$arg),*);
                return with(id, |document| match document {
                    #[cfg(feature = "drawing")]
                    Document::Drawing(art) => ($art)(art),
                    #[cfg(feature = "components")]
                    Document::Components(ui) => ($ui)(ui),
                }).unwrap_or($fallback);
            }
            #[cfg(not(any(feature = "components", feature = "drawing")))]
            { let _ = (id, $($arg),*); $fallback }
        }
    };
}

route!(touch(phase: i32, x: f32, y: f32, pressure: f32) -> () = (), |art: &mut crate::drawing::Document| art.touch(phase, x, y, pressure), |ui: &mut crate::components::surface::Surface| ui.touch(phase, x, y));
route!(transform(dx: f32, dy: f32, scale: f32) -> () = (), |art: &mut crate::drawing::Document| art.transform(dx, dy, scale), |ui: &mut crate::components::surface::Surface| ui.scroll(dx, dy));
route!(invalidate() -> () = (), crate::drawing::Document::invalidate, crate::components::surface::Surface::invalidate);
route!(event() -> Option<Value> = None, crate::drawing::Document::take_event, crate::components::surface::Surface::take_event);
route!(present(surface: i32, width: f32, height: f32, color: u32) -> Result<bool, String> = Ok(false),
    |art: &mut crate::drawing::Document| art.present_rgb(surface, width, height, [(color >> 16) as u8, (color >> 8) as u8, color as u8]),
    |ui: &mut crate::components::surface::Surface| ui.present(surface, width, height));
