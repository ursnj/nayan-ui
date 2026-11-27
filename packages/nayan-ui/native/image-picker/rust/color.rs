use std::sync::LazyLock;

static MATRICES: LazyLock<[[f64; 9]; 4]> = LazyLock::new(|| {
    serde_json::from_str(include_str!("color-matrices.json"))
        .expect("shared image filter matrices are valid")
});

fn matrix(preset: u32, brightness: f64) -> [f64; 9] {
    MATRICES
        .get(preset as usize)
        .unwrap_or(&MATRICES[0])
        .map(|value| value * brightness)
}

/// # Safety
/// out_rgb must be writable for nine doubles in row-major order.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_image_color_matrix(
    preset: u32,
    brightness: f64,
    out_rgb: *mut f64,
) {
    if !out_rgb.is_null() {
        let adjusted = matrix(preset, brightness);
        unsafe { std::ptr::copy_nonoverlapping(adjusted.as_ptr(), out_rgb, adjusted.len()) };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scales_shared_presets_and_falls_back_to_original() {
        assert_eq!(matrix(1, 1.5), MATRICES[1].map(|value| value * 1.5));
        assert_eq!(matrix(99, 0.5), [0.5, 0., 0., 0., 0.5, 0., 0., 0., 0.5]);
    }
}
