//! Textures: PNG and JPEG images decoded to RGBA8 and kept in a global registry. The renderer
//! uploads them; meshes refer to them by id.

use std::collections::HashMap;
#[cfg(feature = "image-codecs")]
use std::io::Cursor;
use std::sync::{Arc, LazyLock, Mutex};

/// Larger images are rejected: they would cost too much GPU memory on phones.
pub const MAX_SIZE: u32 = 4096;

/// A decoded image: `width * height` RGBA8 pixels, top row first.
pub struct Image {
    /// Intrinsic source pixels, before UI thumbnail decoding.
    pub source_size: Option<[u32; 2]>,
    pub width: u32,
    pub height: u32,
    pub rgba: Vec<u8>,
}

/// Decodes a PNG or JPEG file.
#[cfg(feature = "image-codecs")]
pub fn decode(bytes: &[u8]) -> Result<Image, String> {
    if bytes.starts_with(b"\x89PNG") {
        decode_png(bytes)
    } else if bytes.starts_with(&[0xff, 0xd8]) {
        decode_jpeg(bytes)
    } else if cfg!(feature = "components") && bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP") {
        #[cfg(feature = "components")]
        {
            decode_webp(bytes)
        }
        #[cfg(not(feature = "components"))]
        {
            Err("WebP decoding requires the ui feature".into())
        }
    } else {
        Err("not a PNG or JPEG image".into())
    }
}

#[cfg(feature = "components")]
fn decode_webp(bytes: &[u8]) -> Result<Image, String> {
    let mut decoder = image_webp::WebPDecoder::new(Cursor::new(bytes)).map_err(|e| format!("bad WebP: {e}"))?;
    let (width, height) = decoder.dimensions();
    check_size(width, height)?;
    decoder.set_memory_limit(64 * 1024 * 1024);
    let mut pixels = vec![0; decoder.output_buffer_size().ok_or("WebP too large")?];
    decoder.read_image(&mut pixels).map_err(|e| format!("bad WebP: {e}"))?;
    let rgba = if decoder.has_alpha() {
        pixels
    } else {
        pixels.as_chunks::<3>().0.iter().flat_map(|p| [p[0], p[1], p[2], 255]).collect()
    };
    Ok(Image {
        source_size: None,
        width,
        height,
        rgba,
    })
}

/// Checked from the header, before decoding: a few bytes can claim gigabytes of pixels.
pub(crate) fn check_size(width: u32, height: u32) -> Result<(), String> {
    if width == 0 || height == 0 || width > MAX_SIZE || height > MAX_SIZE {
        return Err(format!("image is {width}x{height} (must be 1..{MAX_SIZE} on each side)"));
    }
    Ok(())
}

#[cfg(feature = "image-codecs")]
fn decode_png(bytes: &[u8]) -> Result<Image, String> {
    let mut decoder = png::Decoder::new(Cursor::new(bytes));
    // 16-bit -> 8-bit, palette / low bit depths -> 8-bit channels.
    decoder.set_transformations(png::Transformations::normalize_to_color8());
    let mut reader = decoder.read_info().map_err(|e| format!("bad PNG: {e}"))?;
    check_size(reader.info().width, reader.info().height)?;
    let size = reader.output_buffer_size().ok_or("PNG too large")?;
    let mut buf = vec![0; size];
    let info = reader.next_frame(&mut buf).map_err(|e| format!("bad PNG: {e}"))?;
    buf.truncate(info.buffer_size());
    let (width, height) = (info.width, info.height);
    let rgba = match info.color_type {
        png::ColorType::Rgba => buf,
        png::ColorType::Rgb => buf.as_chunks::<3>().0.iter().flat_map(|p| [p[0], p[1], p[2], 255]).collect(),
        png::ColorType::GrayscaleAlpha => buf.as_chunks::<2>().0.iter().flat_map(|p| [p[0], p[0], p[0], p[1]]).collect(),
        png::ColorType::Grayscale => buf.iter().flat_map(|&g| [g, g, g, 255]).collect(),
        png::ColorType::Indexed => return Err("unexpected indexed PNG output".into()),
    };
    Ok(Image {
        source_size: None,
        width,
        height,
        rgba,
    })
}

#[cfg(feature = "image-codecs")]
fn decode_jpeg(bytes: &[u8]) -> Result<Image, String> {
    let mut decoder = jpeg_decoder::Decoder::new(Cursor::new(bytes));
    decoder.read_info().map_err(|e| format!("bad JPEG: {e}"))?;
    let info = decoder.info().ok_or("bad JPEG: no header")?;
    check_size(info.width as u32, info.height as u32)?;
    let pixels = decoder.decode().map_err(|e| format!("bad JPEG: {e}"))?;
    let rgba = match info.pixel_format {
        jpeg_decoder::PixelFormat::RGB24 => pixels.as_chunks::<3>().0.iter().flat_map(|p| [p[0], p[1], p[2], 255]).collect(),
        jpeg_decoder::PixelFormat::L8 => pixels.iter().flat_map(|&g| [g, g, g, 255]).collect(),
        _ => return Err("unsupported JPEG pixel format (use RGB or grayscale)".into()),
    };
    Ok(Image {
        source_size: None,
        width: info.width as u32,
        height: info.height as u32,
        rgba,
    })
}

// ── Registry ─────────────────────────────────────────────────────────────

static TEXTURES: Mutex<Vec<Option<Arc<Image>>>> = Mutex::new(Vec::new());

/// Registers a decoded image. Textures live for the whole process, so pointers stay valid.
pub fn register(image: Image) -> Result<u32, String> {
    let mut textures = TEXTURES.lock().map_err(|_| "texture registry unavailable".to_string())?;
    textures.push(Some(Arc::new(image)));
    Ok(textures.len() as u32 - 1)
}

/// Temporary UI decode handles are consumed before GPU upload; recycle their empty registry slots.
#[cfg(feature = "components")]
pub(crate) fn register_temporary(image: Image) -> Result<u32, String> {
    let mut textures = TEXTURES.lock().map_err(|_| "texture registry unavailable".to_string())?;
    if let Some(index) = textures.iter().position(Option::is_none) {
        textures[index] = Some(Arc::new(image));
        return Ok(index as u32);
    }
    textures.push(Some(Arc::new(image)));
    Ok(textures.len() as u32 - 1)
}

/// Decodes and registers an image. Returns its texture id.
#[cfg(feature = "image-codecs")]
pub fn load(bytes: &[u8]) -> Result<u32, String> {
    crate::assets::record_error(decode(bytes).and_then(register))
}

pub fn get(id: u32) -> Option<Arc<Image>> {
    TEXTURES.lock().ok()?.get(id as usize).cloned().flatten()
}

/// UI loaders transfer temporary decode handles into their own bounded lifetimes.
#[cfg(feature = "components")]
pub(crate) fn take(id: u32) -> Option<Arc<Image>> {
    TEXTURES.lock().ok()?.get_mut(id as usize)?.take()
}

// ── Dynamic textures ─────────────────────────────────────────────────────
// Pixels a producer (such as a drawing document) rewrites while games sample them. The registry
// entry keeps only the size; the current pixels and the pending dirty rectangle live here, so the
// renderer uploads changed rows instead of the whole image.

struct Dynamic {
    width: u32,
    height: u32,
    rgba: Vec<u8>,
    /// x, y, width, height still to upload; `None` when the GPU copy is current.
    dirty: Option<[u32; 4]>,
}

static DYNAMIC: LazyLock<Mutex<HashMap<u32, Dynamic>>> = LazyLock::new(Default::default);

/// Registers a fixed-size, initially transparent dynamic texture and returns its id. Ids share the
/// regular texture space, so entities use them like any loaded texture.
pub fn register_dynamic(width: u32, height: u32) -> Result<u32, String> {
    check_size(width, height)?;
    let id = register(Image {
        source_size: None,
        width,
        height,
        rgba: Vec::new(),
    })?;
    let rgba = vec![0; width as usize * height as usize * 4];
    let entry = Dynamic {
        width,
        height,
        rgba,
        dirty: Some([0, 0, width, height]),
    };
    DYNAMIC.lock().map_err(|_| "texture registry unavailable".to_string())?.insert(id, entry);
    Ok(id)
}

pub fn is_dynamic(id: u32) -> bool {
    DYNAMIC.lock().is_ok_and(|d| d.contains_key(&id))
}

/// Rewrites rows `y..y + height` of columns `x..x + width`; `write` receives each destination row
/// (straight-alpha RGBA8) and its source row index. Out-of-range rectangles are ignored.
pub fn write_dynamic(id: u32, [x, y, width, height]: [u32; 4], mut write: impl FnMut(u32, &mut [u8])) -> bool {
    let Ok(mut all) = DYNAMIC.lock() else { return false };
    let Some(d) = all.get_mut(&id) else { return false };
    if width == 0 || height == 0 || x + width > d.width || y + height > d.height {
        return false;
    }
    for row in y..y + height {
        let start = ((row * d.width + x) * 4) as usize;
        write(row, &mut d.rgba[start..start + (width * 4) as usize]);
    }
    let rect = [x, y, width, height];
    d.dirty = Some(d.dirty.map_or(rect, |r| {
        let (x0, y0) = (r[0].min(x), r[1].min(y));
        let (x1, y1) = ((r[0] + r[2]).max(x + width), (r[1] + r[3]).max(y + height));
        [x0, y0, x1 - x0, y1 - y0]
    }));
    true
}

/// What `upload_dynamic` found.
#[derive(Debug, PartialEq)]
pub enum Upload {
    /// The texture was released (or never was dynamic): drop the GPU copy.
    Released,
    /// The GPU copy is current.
    Unchanged,
    Uploaded,
}

/// Hands the pending upload (the whole image when `full`, otherwise only the dirty rectangle) to
/// `upload` while the registry is locked, then marks it uploaded. `upload` receives the rectangle
/// (x, y, width, height) and the pixels from its first texel to its last, rows `image_width * 4`
/// bytes apart, so it can copy straight from the image without packing the rectangle.
pub fn upload_dynamic(id: u32, full: bool, upload: impl FnOnce([u32; 4], &[u8], u32)) -> Upload {
    let Ok(mut all) = DYNAMIC.lock() else { return Upload::Released };
    let Some(d) = all.get_mut(&id) else { return Upload::Released };
    let rect = if full {
        [0, 0, d.width, d.height]
    } else if let Some(rect) = d.dirty {
        rect
    } else {
        return Upload::Unchanged;
    };
    d.dirty = None;
    let [x, y, width, height] = rect;
    let start = ((y * d.width + x) * 4) as usize;
    let end = start + (((height - 1) * d.width + width) * 4) as usize;
    upload(rect, &d.rgba[start..end], d.width);
    Upload::Uploaded
}

/// Takes the pending upload as tightly packed pixels (for tests).
#[cfg(test)]
pub fn take_dynamic(id: u32, full: bool) -> Option<([u32; 4], Vec<u8>)> {
    let mut taken = None;
    upload_dynamic(id, full, |rect @ [_, _, width, height], pixels, stride| {
        let mut packed = Vec::with_capacity((width * height * 4) as usize);
        for row in 0..height {
            let start = (row * stride * 4) as usize;
            packed.extend_from_slice(&pixels[start..start + (width * 4) as usize]);
        }
        taken = Some((rect, packed));
    });
    taken
}

/// Frees a dynamic texture's pixels. The renderer drops its GPU copy on the next frame.
pub fn release_dynamic(id: u32) {
    if let Ok(mut all) = DYNAMIC.lock() {
        all.remove(&id);
    }
}

#[cfg(all(test, feature = "image-codecs"))]
pub(crate) mod tests {
    use super::*;

    /// A tiny RGBA PNG.
    pub fn png(width: u32, height: u32, rgba: &[u8]) -> Vec<u8> {
        let mut out = Vec::new();
        let mut encoder = png::Encoder::new(&mut out, width, height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder.write_header().unwrap();
        writer.write_image_data(rgba).unwrap();
        writer.finish().unwrap();
        out
    }

    #[test]
    fn decodes_png_and_registers() {
        let pixels = [255, 0, 0, 255, 0, 255, 0, 128];
        let image = decode(&png(2, 1, &pixels)).unwrap();
        assert_eq!((image.width, image.height), (2, 1));
        assert_eq!(image.rgba, pixels);
        let id = load(&png(2, 1, &pixels)).unwrap();
        assert_eq!(get(id).unwrap().rgba.len(), 8);
    }

    #[test]
    fn rejects_huge_images_from_the_header() {
        // Just the headers, claiming 100000 x 100000 pixels: 40 GB once decoded.
        let crc32 = |bytes: &[u8]| {
            !bytes.iter().fold(!0u32, |crc, &b| {
                (0..8).fold(crc ^ b as u32, |c, _| if c & 1 != 0 { (c >> 1) ^ 0xedb8_8320 } else { c >> 1 })
            })
        };
        let mut ihdr = b"IHDR".to_vec();
        ihdr.extend_from_slice(&100_000u32.to_be_bytes());
        ihdr.extend_from_slice(&100_000u32.to_be_bytes());
        ihdr.extend_from_slice(&[8, 6, 0, 0, 0]);
        let mut file = b"\x89PNG\r\n\x1a\n".to_vec();
        for chunk in [&ihdr[..], b"IDAT"] {
            file.extend_from_slice(&(chunk.len() as u32 - 4).to_be_bytes());
            file.extend_from_slice(chunk);
            file.extend_from_slice(&crc32(chunk).to_be_bytes());
        }
        let err = decode(&file).err().unwrap();
        assert!(err.contains("100000x100000"), "{err}");
    }

    #[test]
    fn rejects_other_formats() {
        assert!(decode(b"GIF89a....").is_err());
        assert!(decode(b"\x89PNG broken").is_err());
    }
}
