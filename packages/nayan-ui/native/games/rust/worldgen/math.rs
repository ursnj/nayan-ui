#![allow(clippy::excessive_precision)]
//! Deterministic math for seeded generation: only IEEE-exact operations (+ - * / sqrt), so a recipe
//! builds the same world on every device, OS and the WebAssembly core. Platform libm `sin`/`cos`/`hypot`
//! differ in the last bit between Android, iOS and browsers, and seeded placement amplifies that into
//! different layouts. Algorithms follow fdlibm (within a few ulps of the native functions).

/// JavaScript's `Math.round`: halves round towards +infinity.
pub fn round_half_up(x: f64) -> f64 {
    let floor = x.floor();
    if x - floor >= 0.5 { floor + 1.0 } else { floor }
}

fn kernel_sin(x: f64, y: f64, has_tail: bool) -> f64 {
    let z = x * x;
    let v = z * x;
    let r = 8.33333333332248946124e-3
        + z * (-1.98412698298579493134e-4 + z * (2.75573137070700676789e-6 + z * (-2.50507602534068634195e-8 + z * 1.58969099521155010221e-10)));
    if !has_tail {
        return x + v * (-1.66666666666666324348e-1 + z * r);
    }
    x - (z * (0.5 * y - v * r) - y - v * -1.66666666666666324348e-1)
}

fn kernel_cos(x: f64, y: f64) -> f64 {
    let z = x * x;
    let w = z * z;
    let r = z * (4.16666666666666019037e-2 + z * (-1.38888888888741095749e-3 + z * 2.48015872894767294178e-5))
        + w * w * (-2.75573143513906633035e-7 + z * (2.0875723212981748279e-9 + z * -1.13596475577881948265e-11));
    let hz = 0.5 * z;
    let one = 1.0 - hz;
    one + (1.0 - one - hz + (z * r - x * y))
}

/// x = n·π/2 + (y0 + y1), with a three-part Cody-Waite reduction.
fn reduce(x: f64) -> (i64, f64, f64) {
    let n = round_half_up(x * std::f64::consts::FRAC_2_PI);
    let first = x - n * 1.57079632673412561417;
    let second = first - n * 6.0771005063039659766e-11;
    let third = n * 2.0222662487111664558e-21;
    let r = second - third;
    let w = n * 8.47842766036889956997e-32 - (second - r - third);
    let y0 = r - w;
    ((n as i64) & 3, y0, r - y0 - w)
}

fn sin_cos(x: f64, cosine: bool) -> f64 {
    if !x.is_finite() {
        return f64::NAN;
    }
    if x.abs() <= std::f64::consts::FRAC_PI_4 {
        return if cosine { kernel_cos(x, 0.0) } else { kernel_sin(x, 0.0, false) };
    }
    let (quadrant, y0, y1) = reduce(x);
    match (quadrant + cosine as i64) & 3 {
        0 => kernel_sin(y0, y1, true),
        1 => kernel_cos(y0, y1),
        2 => -kernel_sin(y0, y1, true),
        _ => -kernel_cos(y0, y1),
    }
}

pub fn sin(x: f64) -> f64 {
    sin_cos(x, false)
}

pub fn cos(x: f64) -> f64 {
    sin_cos(x, true)
}

/// √(Σ v²) without overflow, scaled by the largest magnitude.
pub fn hypot(values: &[f64]) -> f64 {
    let mut largest = 0.0f64;
    let mut nan = false;
    for &value in values {
        let size = value.abs();
        if size == f64::INFINITY {
            return f64::INFINITY;
        }
        if size.is_nan() {
            nan = true;
        } else if size > largest {
            largest = size;
        }
    }
    if nan {
        return f64::NAN;
    }
    if largest == 0.0 {
        return 0.0;
    }
    let mut sum = 0.0;
    for &value in values {
        sum += (value / largest) * (value / largest);
    }
    largest * sum.sqrt()
}

pub fn hypot2(a: f64, b: f64) -> f64 {
    hypot(&[a, b])
}

/// JavaScript `Math.min` for two values (NaN wins; -0 is below +0).
pub fn min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

/// JavaScript `Math.max` for two values (NaN wins; +0 is above -0).
pub fn max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b || (a == b && a.is_sign_positive()) {
        a
    } else {
        b
    }
}

/// Hermite smoothstep of `n` clamped to 0..1.
pub fn smooth(n: f64) -> f64 {
    let t = max(0.0, min(1.0, n));
    t * t * (3.0 - 2.0 * t)
}

/// e^x (fdlibm's algorithm, in pure Rust: the same bits on every platform).
pub fn exp(x: f64) -> f64 {
    libm::exp(x)
}

/// x^y (fdlibm's algorithm, in pure Rust: the same bits on every platform).
pub fn pow(x: f64, y: f64) -> f64 {
    libm::pow(x, y)
}

/// The common shader hash: fract(sin(x·127.1 + y·311.7) · 43758.5453).
fn hash(x: f64, y: f64) -> f64 {
    let n = sin(x * 127.1 + y * 311.7) * 43758.5453;
    n - n.floor()
}

/// Value noise in 0..1: lattice hashes blended with smoothstep weights. A positive `period` repeats
/// the lattice every `period` cells in x.
pub fn noise(x: f64, y: f64, period: f64) -> f64 {
    let (ix, iy) = (x.floor(), y.floor());
    let fade = |t: f64| t * t * (3.0 - 2.0 * t);
    let (fx, fy) = (fade(x - ix), fade(y - iy));
    let wrap = |i: f64| if period > 0.0 { ((i % period) + period) % period } else { i };
    let h = |i: f64, j: f64| hash(wrap(i), j);
    let (a, b, c, d) = (h(ix, iy), h(ix + 1.0, iy), h(ix, iy + 1.0), h(ix + 1.0, iy + 1.0));
    a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trigonometry_stays_within_a_few_ulps_of_libm() {
        for i in -2000..2000 {
            let x = i as f64 * 0.0371;
            assert!((sin(x) - x.sin()).abs() < 1e-15, "sin {x}");
            assert!((cos(x) - x.cos()).abs() < 1e-15, "cos {x}");
        }
        assert!(sin(f64::NAN).is_nan() && cos(f64::INFINITY).is_nan());
    }

    #[test]
    fn hypot_and_rounding_follow_javascript() {
        assert_eq!(hypot(&[3.0, 4.0]), 5.0);
        assert_eq!(hypot(&[0.0, 0.0, 0.0]), 0.0);
        assert_eq!(round_half_up(-2.5), -2.0);
        assert_eq!(round_half_up(2.5), 3.0);
        assert!(min(0.0, -0.0).is_sign_negative());
        assert!(max(-0.0, 0.0).is_sign_positive());
        assert_eq!(smooth(0.5), 0.5);
        assert_eq!(smooth(-1.0), 0.0);
    }
}
