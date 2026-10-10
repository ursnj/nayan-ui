//! Textures: PNG and JPEG images decoded to RGBA8 and kept in a global registry. The renderer
//! uploads them; meshes refer to them by id.

use std::io::Cursor;
use std::sync::{Arc, Mutex};

/// Larger images are rejected: they would cost too much GPU memory on phones.
pub const MAX_SIZE: u32 = 4096;

/// A decoded image: `width * height` RGBA8 pixels, top row first.
pub struct Image {
    pub width: u32,
    pub height: u32,
    pub rgba: Vec<u8>,
}

/// Decodes a PNG or JPEG file.
pub fn decode(bytes: &[u8]) -> Result<Image, String> {
    if bytes.starts_with(b"\x89PNG") {
        decode_png(bytes)
    } else if bytes.starts_with(&[0xff, 0xd8]) {
        decode_jpeg(bytes)
    } else {
        Err("not a PNG or JPEG image".into())
    }
}

/// Checked from the header, before decoding: a few bytes can claim gigabytes of pixels.
fn check_size(width: u32, height: u32) -> Result<(), String> {
    if width == 0 || height == 0 || width > MAX_SIZE || height > MAX_SIZE {
        return Err(format!("image is {width}x{height} (must be 1..{MAX_SIZE} on each side)"));
    }
    Ok(())
}

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
    Ok(Image { width, height, rgba })
}

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
        width: info.width as u32,
        height: info.height as u32,
        rgba,
    })
}

// ── Registry ─────────────────────────────────────────────────────────────

static TEXTURES: Mutex<Vec<Arc<Image>>> = Mutex::new(Vec::new());

/// Registers a decoded image. Textures live for the whole process, so pointers stay valid.
pub fn register(image: Image) -> Result<u32, String> {
    let mut textures = TEXTURES.lock().map_err(|_| "texture registry unavailable".to_string())?;
    textures.push(Arc::new(image));
    Ok(textures.len() as u32 - 1)
}

/// Decodes and registers an image. Returns its texture id.
pub fn load(bytes: &[u8]) -> Result<u32, String> {
    crate::model::record_error(decode(bytes).and_then(register))
}

pub fn get(id: u32) -> Option<Arc<Image>> {
    TEXTURES.lock().ok()?.get(id as usize).cloned()
}

#[cfg(test)]
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
