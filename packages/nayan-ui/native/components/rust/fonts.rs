//! Load installed system faces on native platforms and use platform glyphs where no face is available.
use egui::{FontData, FontDefinitions, FontFamily};
use serde_json::Value;
use skrifa::{FontRef, raw::TableProvider};
use std::sync::{Arc, LazyLock};

const WEIGHTS: [(&str, u16); 5] = [
    ("native-medium", 500),
    ("native-semibold", 600),
    ("native-bold", 700),
    ("native-extrabold", 800),
    ("native-black", 900),
];
/// The family name registered for a CSS font weight above normal.
pub(super) fn family(weight: u16) -> &'static str {
    #[cfg(any(target_arch = "wasm32", test))]
    if weight <= 450 {
        return "web-regular";
    }
    WEIGHTS
        .iter()
        .min_by_key(|(_, registered)| registered.abs_diff(weight))
        .map_or("native-medium", |(name, _)| name)
}

#[cfg(target_arch = "wasm32")]
pub(super) fn css_weight(family: &FontFamily) -> u16 {
    match family {
        FontFamily::Name(name) => WEIGHTS
            .iter()
            .find(|(family, _)| *family == name.as_ref())
            .map_or(400, |(_, weight)| *weight),
        _ => 400,
    }
}

fn variable(bytes: &[u8]) -> bool {
    let tables = bytes.get(4..6).map_or(0, |n| u16::from_be_bytes([n[0], n[1]]) as usize);
    (0..tables).any(|index| bytes.get(12 + index * 16..16 + index * 16) == Some(b"fvar"))
}

pub(super) fn configure(context: &egui::Context) {
    install(context, platform_definitions().clone());
}

pub(super) fn install(context: &egui::Context, definitions: FontDefinitions) {
    context.set_fonts(definitions);
    super::glyphs::install(context);
}

fn platform_definitions() -> &'static FontDefinitions {
    static DEFINITIONS: LazyLock<FontDefinitions> = LazyLock::new(|| {
        let mut definitions = FontDefinitions::empty();
        let regular = system_font(false).and_then(font_data);
        if let Some(font) = &regular {
            definitions.font_data.insert("native-system".into(), Arc::new(font.clone()));
            definitions.families.insert(FontFamily::Proportional, vec!["native-system".into()]);
        }
        if let Some(monospace) = system_font(true).and_then(font_data) {
            definitions.font_data.insert("native-monospace".into(), Arc::new(monospace));
            definitions.families.insert(FontFamily::Monospace, vec!["native-monospace".into()]);
        }
        let fallback = definitions.families[&FontFamily::Proportional].clone();
        for (name, weight) in WEIGHTS {
            let face = match &regular {
                Some(font) if variable(font.font.as_ref().as_ref()) => Some(at_weight(font.clone(), weight)),
                _ => weighted_font(weight).and_then(font_data),
            };
            let mut chain = fallback.clone();
            if let Some(face) = face {
                definitions.font_data.insert(name.into(), Arc::new(face));
                chain.insert(0, name.into());
            }
            definitions.families.insert(FontFamily::Name(name.into()), chain);
        }
        definitions.families.insert(FontFamily::Name("web-regular".into()), fallback);
        definitions
    });
    &DEFINITIONS
}

fn parse(bytes: &[u8]) -> Option<FontRef<'_>> {
    let font = FontRef::from_index(bytes, 0).ok()?;
    font.head().ok()?;
    font.hhea().ok()?;
    font.maxp().ok()?;
    Some(font)
}

fn font_data(bytes: Vec<u8>) -> Option<FontData> {
    parse(&bytes)?;
    let mut font = FontData::from_owned(bytes);
    // Use the system text optical size when a variable face supports it.
    font.tweak.coords.push(*b"opsz", 17.);
    Some(font)
}

fn at_weight(mut font: FontData, weight: u16) -> FontData {
    font.tweak.coords.push(*b"wght", weight as f32);
    font
}

#[cfg(target_os = "android")]
fn weighted_font(weight: u16) -> Option<Vec<u8>> {
    let files: &[&str] = match weight {
        ..=550 => &["Roboto-Medium.ttf"],
        ..=750 => &["Roboto-Bold.ttf"],
        _ => &["Roboto-Black.ttf", "Roboto-Bold.ttf"],
    };
    files.iter().find_map(|file| std::fs::read(format!("/system/fonts/{file}")).ok())
}

#[cfg(not(target_os = "android"))]
fn weighted_font(_weight: u16) -> Option<Vec<u8>> {
    None
}

#[cfg(any(target_os = "ios", target_os = "macos"))]
fn system_font(monospace: bool) -> Option<Vec<u8>> {
    use std::{
        ffi::{CStr, c_void},
        os::unix::ffi::OsStrExt,
    };
    #[link(name = "CoreText", kind = "framework")]
    unsafe extern "C" {
        fn CTFontCreateUIFontForLanguage(kind: u32, size: f64, language: *const c_void) -> *const c_void;
        fn CTFontCopyAttribute(font: *const c_void, name: *const c_void) -> *const c_void;
        static kCTFontURLAttribute: *const c_void;
    }
    #[link(name = "CoreFoundation", kind = "framework")]
    unsafe extern "C" {
        fn CFURLGetFileSystemRepresentation(url: *const c_void, resolve: u8, buffer: *mut u8, size: isize) -> u8;
        fn CFRelease(value: *const c_void);
    }
    unsafe {
        // kCTFontUIFontUserFixedPitch and kCTFontUIFontSystem select the installed UI faces.
        let font = CTFontCreateUIFontForLanguage(if monospace { 1 } else { 2 }, 16., std::ptr::null());
        if font.is_null() {
            return None;
        }
        let url = CTFontCopyAttribute(font, kCTFontURLAttribute);
        CFRelease(font);
        if url.is_null() {
            return None;
        }
        let mut path = [0u8; 4096];
        let valid = CFURLGetFileSystemRepresentation(url, 1, path.as_mut_ptr(), path.len() as isize);
        CFRelease(url);
        if valid == 0 {
            return None;
        }
        let path = CStr::from_ptr(path.as_ptr().cast()).to_bytes();
        std::fs::read(std::path::Path::new(std::ffi::OsStr::from_bytes(path))).ok()
    }
}

#[cfg(target_os = "android")]
fn system_font(monospace: bool) -> Option<Vec<u8>> {
    let files: &[&str] = if monospace {
        &["RobotoMono-Regular.ttf", "DroidSansMono.ttf"]
    } else {
        &["Roboto-Regular.ttf", "RobotoVar.ttf", "NotoSans-Regular.ttf"]
    };
    files.iter().find_map(|file| std::fs::read(format!("/system/fonts/{file}")).ok())
}

#[cfg(not(any(target_os = "ios", target_os = "macos", target_os = "android")))]
fn system_font(_monospace: bool) -> Option<Vec<u8>> {
    // The browser supplies glyphs through Canvas. Headless tests on other hosts use the fixture.
    #[cfg(all(test, not(target_arch = "wasm32")))]
    return Some(include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/Inter-Bold.ttf")).to_vec());
    #[cfg(not(all(test, not(target_arch = "wasm32"))))]
    None
}

pub(super) fn decode(value: &Value) -> Result<Vec<u8>, String> {
    use base64::Engine;
    let value = value.as_str().ok_or("Missing UI font")?;
    if value.len() > 8 * 1024 * 1024 {
        return Err("UI font exceeds size limit".into());
    }
    base64::engine::general_purpose::STANDARD
        .decode(value)
        .map_err(|_| "Invalid UI font encoding".into())
}

pub(super) fn custom(bytes: Vec<u8>, bold: Option<Vec<u8>>) -> Result<FontDefinitions, String> {
    let regular = font_data(bytes).ok_or("Invalid UI font")?;
    let bold = bold.map(|bytes| font_data(bytes).ok_or("Invalid bold UI font")).transpose()?;
    let mut definitions = platform_definitions().clone();
    definitions
        .font_data
        .insert("app-regular".into(), Arc::new(at_weight(regular.clone(), 400)));
    let proportional = definitions.families.get_mut(&FontFamily::Proportional).unwrap();
    proportional.insert(0, "app-regular".into());
    let proportional = proportional.clone();
    definitions.families.insert(FontFamily::Name("web-regular".into()), proportional);
    for (name, weight) in WEIGHTS {
        let family = definitions.families.get_mut(&FontFamily::Name(name.into())).unwrap();
        let face = if weight >= 600 { bold.as_ref().unwrap_or(&regular) } else { &regular };
        // Keep the platform's weight-specific face as a fallback when the app face lacks a glyph.
        let name = format!("app-{weight}");
        definitions.font_data.insert(name.clone(), Arc::new(at_weight(face.clone(), weight)));
        family.insert(0, name);
    }
    Ok(definitions)
}
