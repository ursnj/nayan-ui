//! Mulberry32: tiny, fast and identical to the common JavaScript implementation, so a game can draw
//! the same sequence on either side of the bridge.

#[derive(Clone)]
pub struct Rng(u32);

impl Rng {
    pub fn new(seed: u32) -> Rng {
        Rng(seed)
    }

    /// The next value in [0, 1).
    pub fn next_f64(&mut self) -> f64 {
        self.0 = self.0.wrapping_add(0x6d2b79f5);
        let v = self.0;
        let mut t = ((v ^ (v >> 15)) as i32).wrapping_mul((1 | v) as i32);
        let u = t as u32;
        t ^= t.wrapping_add(((u ^ (u >> 7)) as i32).wrapping_mul(61 | t));
        let u = t as u32;
        (u ^ (u >> 14)) as f64 / 4294967296.0
    }
}

/// A seed for the `n`th independent stream of `seed` (runs, retries, steps).
pub fn derive(seed: u32, n: u32) -> u32 {
    seed ^ n.wrapping_mul(0x9e3779b9)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_the_javascript_sequence() {
        // random(1) in JS: 0.6270739405881613, 0.002735721180215478, 0.5274470399599522
        let mut rng = Rng::new(1);
        assert_eq!(rng.next_f64(), 0.6270739405881613);
        assert_eq!(rng.next_f64(), 0.002735721180215478);
        assert_eq!(rng.next_f64(), 0.5274470399599522);
    }
}
