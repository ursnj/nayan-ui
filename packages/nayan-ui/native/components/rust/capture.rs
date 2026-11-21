//! Crop a platform compositor snapshot using Rust layout bounds. Consumes the temporary texture.
use super::*;
use base64::Engine;

pub(crate) fn crop(value: &Value) -> Result<Value, String> {
    let image = value["texture"]
        .as_u64()
        .and_then(|id| u32::try_from(id).ok())
        .and_then(crate::assets::texture::take)
        .ok_or("Missing snapshot image")?;
    let number = |v: &Value| v.as_f64().filter(|v| v.is_finite()).ok_or("Invalid snapshot geometry");
    let screen_width = number(&value["screen"]["width"])?;
    let screen_height = number(&value["screen"]["height"])?;
    if screen_width <= 0. || screen_height <= 0. {
        return Err("Invalid snapshot extent".into());
    }
    let sx = image.width as f64 / screen_width;
    let sy = image.height as f64 / screen_height;
    let x = number(&value["origin"]["x"])? + number(&value["rect"][0])?;
    let y = number(&value["origin"]["y"])? + number(&value["rect"][1])?;
    let width = number(&value["rect"][2])?;
    let height = number(&value["rect"][3])?;
    let left = (x * sx).floor().clamp(0., image.width as f64) as u32;
    let top = (y * sy).floor().clamp(0., image.height as f64) as u32;
    let right = ((x + width) * sx).ceil().clamp(0., image.width as f64) as u32;
    let bottom = ((y + height) * sy).ceil().clamp(0., image.height as f64) as u32;
    if right <= left || bottom <= top {
        return Err("Snapshot region is outside the screen".into());
    }
    let width = right - left;
    let height = bottom - top;
    let mut rgba = Vec::with_capacity(width as usize * height as usize * 4);
    for y in top..bottom {
        let start = (y as usize * image.width as usize + left as usize) * 4;
        rgba.extend_from_slice(&image.rgba[start..start + width as usize * 4]);
    }
    let mut bytes = Vec::new();
    {
        let mut encoder = png::Encoder::new(&mut bytes, width, height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        encoder
            .write_header()
            .map_err(|e| e.to_string())?
            .write_image_data(&rgba)
            .map_err(|e| e.to_string())?;
    }
    Ok(json!({"base64":base64::engine::general_purpose::STANDARD.encode(bytes),"width":width,"height":height}))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn crop_uses_screen_scale_and_consumes_the_temporary_image() {
        let rgba: Vec<_> = (0..16).flat_map(|n| [n, 0, 0, 255]).collect();
        let texture = crate::assets::texture::register(crate::assets::texture::Image {
            source_size: None,
            width: 4,
            height: 4,
            rgba,
        })
        .unwrap();
        let output = crop(&json!({"texture":texture,"screen":{"width":2,"height":2},"origin":{"x":0,"y":0},"rect":[0.5,0.5,1,1]})).unwrap();
        assert_eq!(output["width"], 2);
        assert_eq!(output["height"], 2);
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(output["base64"].as_str().unwrap())
            .unwrap();
        let image = crate::assets::texture::decode(&bytes).unwrap();
        assert_eq!(image.rgba.iter().step_by(4).copied().collect::<Vec<_>>(), [5, 6, 9, 10]);
        assert!(crate::assets::texture::get(texture).is_none());
    }
}
