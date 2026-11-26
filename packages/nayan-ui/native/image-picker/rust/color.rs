const MATRICES: [[f64; 9]; 4] = [
    [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0],
    [
        0.213, 0.715, 0.072, 0.213, 0.715, 0.072, 0.213, 0.715, 0.072,
    ],
    [
        0.393, 0.769, 0.189, 0.349, 0.686, 0.168, 0.272, 0.534, 0.131,
    ],
    [
        1.3148, -0.286, -0.0288, -0.0852, 1.114, -0.0288, -0.0852, -0.286, 1.3712,
    ],
];

fn matrix(preset: u32) -> &'static [f64; 9] {
    MATRICES.get(preset as usize).unwrap_or(&MATRICES[0])
}

/// # Safety
/// out_rgb must be writable for nine doubles in row-major order.
#[cfg(not(target_arch = "wasm32"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_image_color_matrix(
    preset: u32,
    brightness: f64,
    out_rgb: *mut f64,
) {
    if !out_rgb.is_null() {
        let adjusted = matrix(preset).map(|value| value * brightness);
        unsafe { std::ptr::copy_nonoverlapping(adjusted.as_ptr(), out_rgb, adjusted.len()) };
    }
}

#[cfg(any(target_arch = "wasm32", test))]
#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
pub fn image_filter_rgba(pixels: &mut [u8], preset: u32, brightness: f64) {
    let matrix = matrix(preset);
    for pixel in pixels.chunks_exact_mut(4) {
        let [r, g, b] = [
            f64::from(pixel[0]),
            f64::from(pixel[1]),
            f64::from(pixel[2]),
        ];
        for (channel, row) in matrix.chunks_exact(3).enumerate() {
            let adjusted = (row[0] * r + row[1] * g + row[2] * b) * brightness;
            pixel[channel] = adjusted.round_ties_even().clamp(0.0, 255.0) as u8;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn applies_shared_color_and_brightness_without_changing_alpha() {
        let mut pixel = [100, 50, 0, 17];
        image_filter_rgba(&mut pixel, 1, 1.5);
        assert_eq!(pixel, [86, 86, 86, 17]);
        let mut pixel = [1, 3, 255, 64];
        image_filter_rgba(&mut pixel, 0, 0.5);
        assert_eq!(pixel, [0, 2, 128, 64]);
    }
}
