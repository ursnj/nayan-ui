//! Bounded UI thumbnails. PNG rows stream into the target; JPEG uses scaled IDCT first.
use crate::assets::texture::{self, Image};
use std::io::Cursor;

struct Resize {
    width: u32,
    height: u32,
    crop: [f64; 4],
    sums: Vec<[f64; 4]>,
    rgba: Vec<u8>,
    row: u32,
}
impl Resize {
    fn new(width: u32, height: u32, target: [u32; 2], fit: u32) -> Self {
        let (w, h) = (width as f64, height as f64);
        let mut crop = [0., 0., w, h];
        let (out_w, out_h) = if fit == 3 || target.contains(&0) {
            (width, height)
        } else {
            let (tw, th) = (target[0].clamp(1, 4096) as f64, target[1].clamp(1, 4096) as f64);
            if fit == 0 {
                let scale = (tw / w).max(th / h).min(1.);
                let cw = (tw / scale).min(w);
                let ch = (th / scale).min(h);
                crop = [(w - cw) / 2., (h - ch) / 2., cw, ch];
                ((cw * scale).ceil() as u32, (ch * scale).ceil() as u32)
            } else if fit == 2 {
                (target[0].min(width).max(1), target[1].min(height).max(1))
            } else {
                let scale = (tw / w).min(th / h).min(1.);
                ((w * scale).ceil() as u32, (h * scale).ceil() as u32)
            }
        };
        Self {
            width: out_w,
            height: out_h,
            crop,
            sums: vec![[0.; 4]; out_w as usize],
            rgba: vec![0; out_w as usize * out_h as usize * 4],
            row: 0,
        }
    }
    // Area filtering in premultiplied alpha avoids dark/colored fringes around cutouts.
    fn row(&mut self, y: u32, pixels: &[u8], channels: usize) {
        let [cx, cy, cw, ch] = self.crop;
        let y0 = (y as f64).max(cy);
        let y1 = (y as f64 + 1.).min(cy + ch);
        if y0 >= y1 {
            return;
        }
        let sy = self.height as f64 / ch;
        let sx = self.width as f64 / cw;
        let start_y = ((y0 - cy) * sy).floor() as u32;
        let end_y = (((y1 - cy) * sy).ceil() as u32).min(self.height);
        for oy in start_y..end_y {
            if oy != self.row {
                self.flush();
                self.row = oy;
            }
            let wy = (y1.min(cy + (oy + 1) as f64 / sy) - y0.max(cy + oy as f64 / sy)).max(0.);
            for (x, pixel) in pixels
                .chunks_exact(channels)
                .enumerate()
                .skip(cx.floor() as usize)
                .take(cw.ceil() as usize + 1)
            {
                let x0 = (x as f64).max(cx);
                let x1 = (x as f64 + 1.).min(cx + cw);
                if x0 >= x1 {
                    continue;
                }
                let (r, g, b, a) = match channels {
                    1 => (pixel[0], pixel[0], pixel[0], 255),
                    2 => (pixel[0], pixel[0], pixel[0], pixel[1]),
                    3 => (pixel[0], pixel[1], pixel[2], 255),
                    _ => (pixel[0], pixel[1], pixel[2], pixel[3]),
                };
                let start_x = ((x0 - cx) * sx).floor() as u32;
                let end_x = (((x1 - cx) * sx).ceil() as u32).min(self.width);
                for ox in start_x..end_x {
                    let wx = (x1.min(cx + (ox + 1) as f64 / sx) - x0.max(cx + ox as f64 / sx)).max(0.);
                    let weight = wx * wy;
                    let sum = &mut self.sums[ox as usize];
                    sum[0] += r as f64 * a as f64 * weight;
                    sum[1] += g as f64 * a as f64 * weight;
                    sum[2] += b as f64 * a as f64 * weight;
                    sum[3] += a as f64 * weight;
                }
            }
        }
    }
    fn flush(&mut self) {
        let area = self.crop[2] * self.crop[3] / (self.width as f64 * self.height as f64);
        let start = self.row as usize * self.width as usize * 4;
        for (s, pixel) in self
            .sums
            .iter_mut()
            .zip(self.rgba[start..start + self.width as usize * 4].chunks_exact_mut(4))
        {
            if s[3] > 0. {
                pixel.copy_from_slice(&[
                    (s[0] / s[3]).round() as u8,
                    (s[1] / s[3]).round() as u8,
                    (s[2] / s[3]).round() as u8,
                    (s[3] / area).round().clamp(0., 255.) as u8,
                ]);
            }
            *s = [0.; 4];
        }
    }
    fn finish(mut self, source: [u32; 2]) -> Image {
        self.flush();
        Image {
            source_size: Some(source),
            width: self.width,
            height: self.height,
            rgba: self.rgba,
        }
    }
}

pub(crate) fn decode(bytes: &[u8], width: u32, height: u32, fit: u32) -> Result<Image, String> {
    if bytes.len() > 32 * 1024 * 1024 {
        return Err("Image file exceeds 32 MiB".into());
    }
    let target = [width.min(4096), height.min(4096)];
    if fit == 3 || target.contains(&0) {
        return texture::decode(bytes);
    }
    if bytes.starts_with(b"\x89PNG") {
        let mut decoder = png::Decoder::new(Cursor::new(bytes));
        decoder.set_transformations(png::Transformations::normalize_to_color8());
        let mut reader = decoder.read_info().map_err(|e| format!("bad PNG: {e}"))?;
        let source = [reader.info().width, reader.info().height];
        texture::check_size(source[0], source[1])?;
        if !reader.info().interlaced {
            let mut resize = Resize::new(source[0], source[1], target, fit);
            let channels = reader.output_color_type().0.samples();
            for y in 0..source[1] {
                let row = reader
                    .next_row()
                    .map_err(|e| format!("bad PNG: {e}"))?
                    .ok_or("PNG ended before its last row")?;
                resize.row(y, row.data(), channels);
            }
            reader.finish().map_err(|e| format!("bad PNG: {e}"))?;
            return Ok(resize.finish(source));
        }
    } else if bytes.starts_with(&[0xff, 0xd8]) {
        let mut decoder = jpeg_decoder::Decoder::new(Cursor::new(bytes));
        decoder.set_max_decoding_buffer_size(64 * 1024 * 1024);
        decoder.read_info().map_err(|e| format!("bad JPEG: {e}"))?;
        let info = decoder.info().ok_or("bad JPEG: no header")?;
        let source = [info.width as u32, info.height as u32];
        texture::check_size(source[0], source[1])?;
        let requested = Resize::new(source[0], source[1], target, fit);
        // Match the crop's sampling density, not just the destination box.
        let scale = (requested.width as f64 / requested.crop[2]).max(requested.height as f64 / requested.crop[3]);
        drop(requested);
        decoder
            .scale(
                (source[0] as f64 * scale).ceil().max(1.) as u16,
                (source[1] as f64 * scale).ceil().max(1.) as u16,
            )
            .map_err(|e| format!("bad JPEG: {e}"))?;
        let pixels = decoder.decode().map_err(|e| format!("bad JPEG: {e}"))?;
        let info = decoder.info().ok_or("bad JPEG: no header")?;
        let channels = match info.pixel_format {
            jpeg_decoder::PixelFormat::RGB24 => 3,
            jpeg_decoder::PixelFormat::L8 => 1,
            _ => return Err("unsupported JPEG pixel format (use RGB or grayscale)".into()),
        };
        let mut resize = Resize::new(info.width as u32, info.height as u32, target, fit);
        for (y, row) in pixels.chunks_exact(info.width as usize * channels).enumerate() {
            resize.row(y as u32, row, channels);
        }
        return Ok(resize.finish(source));
    }
    // Interlaced PNG and WebP require a complete decoded frame with these codecs.
    let image = texture::decode(bytes)?;
    let mut resize = Resize::new(image.width, image.height, target, fit);
    for (y, row) in image.rgba.chunks_exact(image.width as usize * 4).enumerate() {
        resize.row(y as u32, row, 4);
    }
    Ok(resize.finish([image.width, image.height]))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::assets::texture::tests::png;
    #[test]
    fn large_png_streams_to_a_small_texture_and_keeps_intrinsic_dimensions() {
        let bytes = png(2048, 2048, &[230, 40, 10, 255].repeat(2048 * 2048));
        let image = decode(&bytes, 128, 128, 0).unwrap();
        assert_eq!((image.width, image.height), (128, 128));
        assert_eq!(image.source_size, Some([2048, 2048]));
        assert_eq!(image.rgba.len(), 128 * 128 * 4);
        assert!(image.rgba.chunks_exact(4).all(|p| p == [230, 40, 10, 255]));
        let resize = Resize::new(2048, 2048, [128, 128], 0);
        assert_eq!(resize.sums.len(), 128, "filter accumulates one target row, not a full float frame");
    }
    #[test]
    fn area_filter_preserves_transparency_without_blue_fringes() {
        let bytes = png(2, 1, &[255, 0, 0, 255, 0, 0, 255, 0]);
        let image = decode(&bytes, 1, 1, 1).unwrap();
        assert_eq!(image.rgba, [255, 0, 0, 128]);
    }
    #[test]
    fn cover_crops_the_center_contain_keeps_aspect_and_original_never_resizes() {
        let bytes = png(4, 2, &[0, 255, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255].repeat(2));
        let cover = decode(&bytes, 2, 2, 0).unwrap();
        assert_eq!((cover.width, cover.height), (2, 2));
        assert!(cover.rgba.chunks_exact(4).all(|p| p == [255, 0, 0, 255]));
        let contain = decode(&bytes, 2, 2, 1).unwrap();
        assert_eq!((contain.width, contain.height), (2, 1));
        let original = decode(&bytes, 1, 1, 3).unwrap();
        assert_eq!((original.width, original.height), (4, 2));
        let small = decode(&png(1, 1, &[255; 4]), 512, 512, 0).unwrap();
        assert_eq!((small.width, small.height), (1, 1), "small sources are never upscaled during decode");
    }
}

#[cfg(test)]
mod format_tests {
    use super::*;
    #[test]
    fn jpeg_scaled_decode_keeps_intrinsic_size_and_webp_resizes_after_bounded_decode() {
        let jpeg = decode(include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/component-thumbnail.jpg")), 64, 64, 1).unwrap();
        assert_eq!((jpeg.width, jpeg.height), (64, 32));
        assert_eq!(jpeg.source_size, Some([512, 256]));
        assert!(jpeg.rgba.chunks_exact(4).all(|p| p[0] > 210 && p[1] < 45 && p[3] == 255));
        let mut bytes = Vec::new();
        image_webp::WebPEncoder::new(&mut bytes)
            .encode(&[255, 0, 0, 128].repeat(128 * 64), 128, 64, image_webp::ColorType::Rgba8)
            .unwrap();
        let webp = decode(&bytes, 16, 16, 1).unwrap();
        assert_eq!((webp.width, webp.height), (16, 8));
        assert_eq!(webp.source_size, Some([128, 64]));
        assert!(webp.rgba.chunks_exact(4).all(|p| p == [255, 0, 0, 128]));
    }
}
