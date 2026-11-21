use super::*;
use egui::Color32;
use std::{ffi::c_void, ptr};
#[repr(C)]
#[derive(Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}
#[repr(C)]
#[derive(Clone, Copy)]
struct Size {
    width: f64,
    height: f64,
}
#[repr(C)]
#[derive(Clone, Copy)]
struct Rect {
    origin: Point,
    size: Size,
}
#[repr(C)]
struct Range {
    location: isize,
    length: isize,
}
#[link(name = "CoreFoundation", kind = "framework")]
unsafe extern "C" {
    fn CFRelease(value: *const c_void);
    fn CFStringCreateWithBytes(allocator: *const c_void, bytes: *const u8, length: isize, encoding: u32, external: u8) -> *const c_void;
    fn CFDictionaryCreate(
        allocator: *const c_void,
        keys: *const *const c_void,
        values: *const *const c_void,
        count: isize,
        key_callbacks: *const c_void,
        value_callbacks: *const c_void,
    ) -> *const c_void;
    fn CFAttributedStringCreate(allocator: *const c_void, text: *const c_void, attributes: *const c_void) -> *const c_void;
    fn CFArrayGetCount(array: *const c_void) -> isize;
    fn CFArrayGetValueAtIndex(array: *const c_void, index: isize) -> *const c_void;
    static kCFTypeDictionaryKeyCallBacks: c_void;
    static kCFTypeDictionaryValueCallBacks: c_void;
    static kCFBooleanTrue: *const c_void;
}
#[link(name = "CoreText", kind = "framework")]
unsafe extern "C" {
    fn CTFontCreateUIFontForLanguage(kind: u32, size: f64, language: *const c_void) -> *const c_void;
    fn CTFontCreateWithName(name: *const c_void, size: f64, matrix: *const c_void) -> *const c_void;
    fn CTFontCreateCopyWithSymbolicTraits(font: *const c_void, size: f64, matrix: *const c_void, value: u32, mask: u32) -> *const c_void;
    fn CTLineCreateWithAttributedString(text: *const c_void) -> *const c_void;
    fn CTLineGetBoundsWithOptions(line: *const c_void, options: usize) -> Rect;
    fn CTLineGetTypographicBounds(line: *const c_void, ascent: *mut f64, descent: *mut f64, leading: *mut f64) -> f64;
    fn CTLineGetGlyphRuns(line: *const c_void) -> *const c_void;
    fn CTRunGetGlyphCount(run: *const c_void) -> isize;
    fn CTRunGetGlyphs(run: *const c_void, range: Range, glyphs: *mut u16);
    fn CTLineDraw(line: *const c_void, context: *const c_void);
    static kCTFontAttributeName: *const c_void;
    static kCTForegroundColorFromContextAttributeName: *const c_void;
}
#[link(name = "CoreGraphics", kind = "framework")]
unsafe extern "C" {
    fn CGColorSpaceCreateDeviceRGB() -> *const c_void;
    fn CGColorSpaceRelease(space: *const c_void);
    fn CGBitmapContextCreate(
        data: *mut c_void,
        width: usize,
        height: usize,
        bits: usize,
        stride: usize,
        space: *const c_void,
        info: u32,
    ) -> *const c_void;
    fn CGContextRelease(context: *const c_void);
    fn CGContextSetRGBFillColor(context: *const c_void, r: f64, g: f64, b: f64, a: f64);
    fn CGContextSetTextPosition(context: *const c_void, x: f64, y: f64);
}
struct Owned(*const c_void, unsafe extern "C" fn(*const c_void));
impl Owned {
    fn new(value: *const c_void, release: unsafe extern "C" fn(*const c_void)) -> Option<Self> {
        (!value.is_null()).then_some(Self(value, release))
    }
    fn cf(value: *const c_void) -> Option<Self> {
        Self::new(value, CFRelease)
    }
}
impl Drop for Owned {
    fn drop(&mut self) {
        unsafe { (self.1)(self.0) }
    }
}
unsafe fn string(value: &str) -> Option<Owned> {
    Owned::cf(unsafe { CFStringCreateWithBytes(ptr::null(), value.as_ptr(), value.len() as isize, 0x08000100, 0) })
}

pub(super) fn rasterize(request: &GlyphRasterizerRequest<'_>, color: bool) -> Option<RasterizedGlyph> {
    // Each Core Foundation reference is owned until drawing completes, including on early returns.
    unsafe {
        let text = string(request.cluster)?;
        let size = request.font_size_px as f64;
        let mut font = if matches!(request.family, FontFamily::Monospace) {
            let name = string("Menlo")?;
            Owned::cf(CTFontCreateWithName(name.0, size, ptr::null()))?
        } else {
            Owned::cf(CTFontCreateUIFontForLanguage(2, size, ptr::null()))?
        };
        if bold(request.family) {
            if let Some(weighted) = Owned::cf(CTFontCreateCopyWithSymbolicTraits(font.0, size, ptr::null(), 2, 2)) {
                font = weighted;
            }
        }
        let keys = [kCTFontAttributeName, kCTForegroundColorFromContextAttributeName];
        let values = [font.0, kCFBooleanTrue];
        let attributes = Owned::cf(CFDictionaryCreate(
            ptr::null(),
            keys.as_ptr(),
            values.as_ptr(),
            2,
            &raw const kCFTypeDictionaryKeyCallBacks,
            &raw const kCFTypeDictionaryValueCallBacks,
        ))?;
        let attributed = Owned::cf(CFAttributedStringCreate(ptr::null(), text.0, attributes.0))?;
        let line = Owned::cf(CTLineCreateWithAttributedString(attributed.0))?;
        let runs = CTLineGetGlyphRuns(line.0);
        if runs.is_null() {
            return None;
        }
        let mut supported = false;
        for i in 0..CFArrayGetCount(runs) {
            let run = CFArrayGetValueAtIndex(runs, i);
            let count = CTRunGetGlyphCount(run);
            if count > 256 {
                return None;
            }
            let mut glyphs = vec![0; count.max(0) as usize];
            CTRunGetGlyphs(run, Range { location: 0, length: count }, glyphs.as_mut_ptr());
            supported |= glyphs.iter().any(|id| *id != 0);
        }
        if !supported {
            return None;
        }
        let bounds = CTLineGetBoundsWithOptions(line.0, 0);
        let left = bounds.origin.x.floor() - 1.;
        let right = (bounds.origin.x + bounds.size.width).ceil() + 1.;
        let bottom = bounds.origin.y.floor() - 1.;
        let top = (bounds.origin.y + bounds.size.height).ceil() + 1.;
        let (width, height) = extent(left, bottom, right, top)?;
        let advance = CTLineGetTypographicBounds(line.0, ptr::null_mut(), ptr::null_mut(), ptr::null_mut()) as f32;
        if !advance.is_finite() || advance <= 0. {
            return None;
        }
        let mut pixels = vec![0u8; width * height * 4];
        let space = Owned::new(CGColorSpaceCreateDeviceRGB(), CGColorSpaceRelease)?;
        let context = Owned::new(
            CGBitmapContextCreate(pixels.as_mut_ptr().cast(), width, height, 8, width * 4, space.0, 0x4001),
            CGContextRelease,
        )?;
        CGContextSetRGBFillColor(context.0, 1., 1., 1., 1.);
        CGContextSetTextPosition(context.0, -left, -bottom);
        CTLineDraw(line.0, context.0);
        drop(context);
        let image = ColorImage::new(
            [width, height],
            pixels
                .chunks_exact(4)
                .map(|p| Color32::from_rgba_premultiplied(p[0], p[1], p[2], p[3]))
                .collect(),
        );
        Some(RasterizedGlyph {
            bitmap: GlyphBitmap {
                image,
                offset_px: Vec2::new(left as f32, -top as f32),
                is_color: color,
            },
            advance_px: advance,
        })
    }
}
