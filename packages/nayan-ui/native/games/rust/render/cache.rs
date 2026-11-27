//! CPU mirrors of GPU instance buffers. Keep unchanged data resident, and upload only the
//! changed span. The mirror belongs to the buffer, so surface recreation and growth reset it.

use std::ops::Range;

#[derive(Default)]
pub(super) struct FloatCache(Vec<f32>);

/// Floats compared per block (as bytes, so the comparison is a `memcmp`).
const BLOCK: usize = 64;

fn as_bytes(data: &[f32]) -> &[u8] {
    // SAFETY: f32 has no padding and every byte pattern is a valid u8.
    unsafe { std::slice::from_raw_parts(data.as_ptr().cast(), std::mem::size_of_val(data)) }
}

/// Bitwise inequality: a NaN that is still the same NaN is unchanged; 0.0 vs -0.0 is a change.
fn differs(a: &f32, b: &f32) -> bool {
    a.to_bits() != b.to_bits()
}

/// Index of the first float that differs, or `a.len()` (both slices have the same length).
fn first_difference(a: &[f32], b: &[f32]) -> usize {
    let block = a
        .chunks(BLOCK)
        .zip(b.chunks(BLOCK))
        .position(|(x, y)| as_bytes(x) != as_bytes(y))
        .unwrap_or(a.len().div_ceil(BLOCK));
    let start = (block * BLOCK).min(a.len());
    let end = (start + BLOCK).min(a.len());
    start
        + a[start..end]
            .iter()
            .zip(&b[start..end])
            .position(|(x, y)| differs(x, y))
            .unwrap_or(end - start)
}

/// One past the last float that differs, or 0 (both slices have the same length).
fn last_difference(a: &[f32], b: &[f32]) -> usize {
    // Blocks aligned to the end, so the scan is the mirror of `first_difference`.
    let tail = a.len() % BLOCK;
    let blocks = a.len() / BLOCK;
    let end = (0..blocks)
        .rev()
        .find(|&k| {
            let r = tail + k * BLOCK..tail + (k + 1) * BLOCK;
            as_bytes(&a[r.clone()]) != as_bytes(&b[r])
        })
        .map_or(tail, |k| tail + (k + 1) * BLOCK);
    let start = end.saturating_sub(if end == tail { tail } else { BLOCK });
    a[start..end]
        .iter()
        .zip(&b[start..end])
        .rposition(|(x, y)| differs(x, y))
        .map_or(0, |i| start + i + 1)
}

impl FloatCache {
    /// Stores `data` and returns the span that differs from the previous contents (bitwise), if
    /// any. Floats past the end of a shorter `data` are kept, so a later regrowth only uploads
    /// what really changed.
    pub fn changed(&mut self, data: &[f32]) -> Option<Range<usize>> {
        let common = self.0.len().min(data.len());
        let first = first_difference(&self.0[..common], &data[..common]);
        if first == data.len() {
            return None;
        }
        let end = if data.len() > self.0.len() {
            self.0.resize(data.len(), 0.0);
            data.len()
        } else {
            last_difference(&self.0[first..common], &data[first..common]) + first
        };
        self.0[first..end].copy_from_slice(&data[first..end]);
        Some(first..end)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uploads_only_changed_span_and_keeps_hidden_tail() {
        let mut c = FloatCache::default();
        assert_eq!(c.changed(&[1., 2., 3., 4.]), Some(0..4));
        assert_eq!(c.changed(&[1., 2., 3., 4.]), None);
        assert_eq!(c.changed(&[1., 5., 3., 4.]), Some(1..2));
        assert_eq!(c.changed(&[1.]), None);
        assert_eq!(c.changed(&[1., 5., 3., 4.]), None);
        assert_eq!(c.changed(&[1., 5., 8., 4., 0.]), Some(2..5));
        assert_eq!(c.changed(&[]), None);
        assert_eq!(c.changed(&[9., 5., 8., 7., 0.]), Some(0..4));
    }

    #[test]
    fn finds_exact_spans_across_block_boundaries() {
        for len in [1, 63, 64, 65, 128, 200, 1000] {
            for a in [0, 1, len / 2, len - 1].into_iter().filter(|&a| a < len) {
                for b in [a, (a + 1).min(len - 1), (a + 70).min(len - 1), len - 1] {
                    let mut c = FloatCache::default();
                    let mut data = vec![1.0; len];
                    c.changed(&data);
                    data[a] = 2.0;
                    data[b] = 3.0;
                    assert_eq!(c.changed(&data), Some(a..b + 1), "len {len} changes {a} {b}");
                    assert_eq!(c.changed(&data), None);
                }
            }
        }
    }

    #[test]
    fn compares_bits_not_float_equality() {
        let mut c = FloatCache::default();
        assert_eq!(c.changed(&[f32::NAN, 0.0]), Some(0..2));
        assert_eq!(c.changed(&[f32::NAN, 0.0]), None, "the same NaN is unchanged");
        assert_eq!(c.changed(&[f32::NAN, -0.0]), Some(1..2), "the GPU must receive -0.0");
    }

    #[test]
    fn partial_uploads_match_full_uploads_under_churn() {
        let mut cache = FloatCache::default();
        let mut gpu = vec![0.0; 4096];
        let mut source = gpu.clone();
        for frame in 0..1000 {
            let used = (frame * 71) % source.len();
            source[(frame * 37) % 4096] = frame as f32;
            if let Some(span) = cache.changed(&source[..used]) {
                gpu[span.clone()].copy_from_slice(&source[span]);
            }
            assert_eq!(&gpu[..used], &source[..used]);
        }
    }
}
