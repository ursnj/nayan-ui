//! Linear-time, premultiplied RGBA fallback for downsampled Android backdrop captures.

use std::cell::RefCell;
thread_local! { static SCRATCH: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) }; }

#[cfg(feature = "components")]
fn pass(source: &[u8], target: &mut [u8], width: usize, height: usize, radius: usize, vertical: bool) {
    let (lines, length) = if vertical { (width, height) } else { (height, width) };
    let offset = |line: usize, point: usize| {
        if vertical {
            (point * width + line) * 4
        } else {
            (line * width + point) * 4
        }
    };
    let span = (radius * 2 + 1) as u32;
    for line in 0..lines {
        let mut sum = [0u32; 4];
        for tap in 0..radius * 2 + 1 {
            let index = offset(line, tap.saturating_sub(radius).min(length - 1));
            for c in 0..4 {
                sum[c] += source[index + c] as u32;
            }
        }
        for point in 0..length {
            let index = offset(line, point);
            let leaving = offset(line, point.saturating_sub(radius));
            let entering = offset(line, (point + radius + 1).min(length - 1));
            for c in 0..4 {
                target[index + c] = ((sum[c] + span / 2) / span) as u8;
                sum[c] = sum[c] + source[entering + c] as u32 - source[leaving + c] as u32;
            }
        }
    }
}

#[cfg(feature = "components")]
pub(crate) fn rgba(pixels: &mut [u8], width: usize, height: usize, radius: usize) -> bool {
    let Some(length) = width.checked_mul(height).and_then(|n| n.checked_mul(4)) else {
        return false;
    };
    if width == 0 || height == 0 || length > 4_194_304 || pixels.len() != length {
        return false;
    }
    let radius = radius.min(32);
    if radius == 0 {
        return true;
    }
    SCRATCH.with(|scratch| {
        let mut scratch = scratch.borrow_mut();
        scratch.resize(length, 0);
        // Three separable box filters approximate a Gaussian without radius-dependent per-pixel work.
        for _ in 0..3 {
            pass(pixels, &mut scratch, width, height, radius, false);
            pass(&scratch, pixels, width, height, radius, true);
        }
    });
    true
}

/// # Safety
/// `pixels` must point to `length` writable, exclusively owned bytes for this call.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_blur_rgba(pixels: *mut u8, length: usize, width: u32, height: u32, radius: u32) -> i32 {
    #[cfg(not(feature = "components"))]
    {
        let _ = (pixels, length, width, height, radius);
        0
    }
    #[cfg(feature = "components")]
    {
        if pixels.is_null() || length > 4_194_304 {
            return 0;
        }
        i32::from(rgba(
            unsafe { std::slice::from_raw_parts_mut(pixels, length) },
            width as usize,
            height as usize,
            radius as usize,
        ))
    }
}

#[cfg(all(test, feature = "components"))]
mod tests {
    use super::*;
    #[test]
    fn preserves_solid_premultiplied_color_and_clamped_edges() {
        let mut image = [40, 80, 120, 160].repeat(35);
        let original = image.clone();
        assert!(rgba(&mut image, 5, 7, 3));
        assert_eq!(image, original);
    }
    #[test]
    fn softens_a_sharp_edge_without_darkening_opaque_alpha() {
        let mut image = vec![0u8; 9 * 9 * 4];
        for (i, pixel) in image.chunks_exact_mut(4).enumerate() {
            pixel[3] = 255;
            if i % 9 >= 4 {
                pixel[..3].fill(255);
            }
        }
        assert!(rgba(&mut image, 9, 9, 1));
        assert!(image.chunks_exact(4).all(|p| p[3] == 255));
        assert!(image[4 * (4 * 9 + 3)] > 0);
        assert!(image[4 * (4 * 9 + 4)] < 255);
        for row in image.chunks_exact(9 * 4) {
            assert!(row.chunks_exact(4).map(|p| p[0]).is_sorted());
        }
    }
    #[test]
    fn validates_dimensions_and_handles_single_pixels_and_zero_radius() {
        assert!(!rgba(&mut [], 0, 3, 1));
        assert!(!rgba(&mut [0; 4], usize::MAX, 3, 1));
        let mut pixel = [30, 40, 50, 255];
        assert!(rgba(&mut pixel, 1, 1, 32));
        assert_eq!(pixel, [30, 40, 50, 255]);
        assert!(rgba(&mut pixel, 1, 1, 0));
    }
}
