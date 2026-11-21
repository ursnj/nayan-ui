use super::*;
use egui::Color32;
use jni::{
    Env, JavaVM, jni_sig, jni_str,
    objects::{JIntArray, JValue},
};

pub(super) fn rasterize(request: &GlyphRasterizerRequest<'_>, color: bool) -> Option<RasterizedGlyph> {
    if !crate::android::is_initialized() {
        return None;
    }
    // Only framework classes are used, so a render-thread attachment needs no application class loader.
    let vm = unsafe { JavaVM::from_raw(ndk_context::android_context().vm().cast()) };
    vm.attach_current_thread(|env: &mut Env<'_>| -> jni::errors::Result<Option<RasterizedGlyph>> {
        let result = env.with_local_frame(64, |env| draw(env, request, color));
        if env.exception_check() {
            env.exception_clear();
        }
        Ok(result.ok().flatten())
    })
    .ok()
    .flatten()
}

fn draw(env: &mut Env<'_>, request: &GlyphRasterizerRequest<'_>, color: bool) -> jni::errors::Result<Option<RasterizedGlyph>> {
    let text = env.new_string(request.cluster)?;
    let paint = env.new_object(jni_str!("android/graphics/Paint"), jni_sig!("(I)V"), &[JValue::Int(3)])?;
    env.call_method(&paint, jni_str!("setTextSize"), jni_sig!("(F)V"), &[JValue::Float(request.font_size_px)])?;
    env.call_method(&paint, jni_str!("setColor"), jni_sig!("(I)V"), &[JValue::Int(-1)])?;
    let family = env.new_string(if matches!(request.family, FontFamily::Monospace) {
        "monospace"
    } else {
        "sans-serif"
    })?;
    let typeface = env
        .call_static_method(
            jni_str!("android/graphics/Typeface"),
            jni_str!("create"),
            jni_sig!("(Ljava/lang/String;I)Landroid/graphics/Typeface;"),
            &[JValue::Object(&family), JValue::Int(i32::from(bold(request.family)))],
        )?
        .l()?;
    env.call_method(
        &paint,
        jni_str!("setTypeface"),
        jni_sig!("(Landroid/graphics/Typeface;)Landroid/graphics/Typeface;"),
        &[JValue::Object(&typeface)],
    )?;
    if !env
        .call_method(&paint, jni_str!("hasGlyph"), jni_sig!("(Ljava/lang/String;)Z"), &[JValue::Object(&text)])?
        .z()?
    {
        return Ok(None);
    }
    let advance = env
        .call_method(
            &paint,
            jni_str!("measureText"),
            jni_sig!("(Ljava/lang/String;)F"),
            &[JValue::Object(&text)],
        )?
        .f()?;
    let metrics = env
        .call_method(
            &paint,
            jni_str!("getFontMetrics"),
            jni_sig!("()Landroid/graphics/Paint$FontMetrics;"),
            &[],
        )?
        .l()?;
    let top = env.get_field(&metrics, jni_str!("top"), jni_sig!("F"))?.f()? as f64;
    let bottom = env.get_field(&metrics, jni_str!("bottom"), jni_sig!("F"))?.f()? as f64;
    let rect = env.new_object(jni_str!("android/graphics/Rect"), jni_sig!("()V"), &[])?;
    env.call_method(
        &paint,
        jni_str!("getTextBounds"),
        jni_sig!("(Ljava/lang/String;IILandroid/graphics/Rect;)V"),
        &[
            JValue::Object(&text),
            JValue::Int(0),
            JValue::Int(request.cluster.encode_utf16().count() as i32),
            JValue::Object(&rect),
        ],
    )?;
    let left = env.get_field(&rect, jni_str!("left"), jni_sig!("I"))?.i()?.min(0) as f64 - 1.;
    let right = (env.get_field(&rect, jni_str!("right"), jni_sig!("I"))?.i()? as f64)
        .max(advance as f64)
        .ceil()
        + 1.;
    let top = top.min(env.get_field(&rect, jni_str!("top"), jni_sig!("I"))?.i()? as f64).floor() - 1.;
    let bottom = bottom.max(env.get_field(&rect, jni_str!("bottom"), jni_sig!("I"))?.i()? as f64).ceil() + 1.;
    let Some((width, height)) = extent(left, top, right, bottom) else {
        return Ok(None);
    };
    if !advance.is_finite() || advance <= 0. {
        return Ok(None);
    }
    let config = env
        .get_static_field(
            jni_str!("android/graphics/Bitmap$Config"),
            jni_str!("ARGB_8888"),
            jni_sig!("Landroid/graphics/Bitmap$Config;"),
        )?
        .l()?;
    let bitmap = env
        .call_static_method(
            jni_str!("android/graphics/Bitmap"),
            jni_str!("createBitmap"),
            jni_sig!("(IILandroid/graphics/Bitmap$Config;)Landroid/graphics/Bitmap;"),
            &[JValue::Int(width as i32), JValue::Int(height as i32), JValue::Object(&config)],
        )?
        .l()?;
    let canvas = env.new_object(
        jni_str!("android/graphics/Canvas"),
        jni_sig!("(Landroid/graphics/Bitmap;)V"),
        &[JValue::Object(&bitmap)],
    )?;
    env.call_method(
        &canvas,
        jni_str!("drawText"),
        jni_sig!("(Ljava/lang/String;FFLandroid/graphics/Paint;)V"),
        &[
            JValue::Object(&text),
            JValue::Float(-left as f32),
            JValue::Float(-top as f32),
            JValue::Object(&paint),
        ],
    )?;
    let array: JIntArray = env.new_int_array(width * height)?;
    env.call_method(
        &bitmap,
        jni_str!("getPixels"),
        jni_sig!("([IIIIIII)V"),
        &[
            JValue::Object(&array),
            JValue::Int(0),
            JValue::Int(width as i32),
            JValue::Int(0),
            JValue::Int(0),
            JValue::Int(width as i32),
            JValue::Int(height as i32),
        ],
    )?;
    let mut pixels = vec![0i32; width * height];
    array.get_region(env, 0, &mut pixels)?;
    env.call_method(&bitmap, jni_str!("recycle"), jni_sig!("()V"), &[])?;
    let image = ColorImage::new(
        [width, height],
        pixels
            .into_iter()
            .map(|p| {
                let p = p as u32;
                Color32::from_rgba_unmultiplied((p >> 16) as u8, (p >> 8) as u8, p as u8, (p >> 24) as u8)
            })
            .collect(),
    );
    Ok(Some(RasterizedGlyph {
        bitmap: GlyphBitmap {
            image,
            offset_px: Vec2::new(left as f32, top as f32),
            is_color: color,
        },
        advance_px: advance,
    }))
}
