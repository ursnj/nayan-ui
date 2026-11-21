//! Microphone capture: the last few seconds of input as mono samples, and how loud it is right now.
//! Fed by the device's input stream (`input.rs`) or, in the browser, by the page's microphone node;
//! read by the game thread. Platform-independent and tested without a device.

/// Loudness at or below this (dBFS) reads as 0; full scale reads as 1.
const FLOOR_DB: f32 = -60.0;
/// How quickly the level falls back after a sound, in seconds (it rises at once).
const RELEASE_SECONDS: f32 = 0.15;

/// A ring of the most recent mono samples at the device's rate.
pub struct Capture {
    ring: Vec<f32>,
    /// Where the next sample goes.
    write: usize,
    /// Samples held (up to the ring's length).
    filled: usize,
    rate: u32,
    level: f32,
}

impl Capture {
    /// Keeps the last `seconds` (0.5..30) of input at `rate`.
    pub fn new(rate: u32, seconds: f32) -> Capture {
        let rate = rate.max(1);
        let seconds = if seconds.is_finite() { seconds.clamp(0.5, 30.0) } else { 10.0 };
        Capture {
            ring: vec![0.0; (rate as f32 * seconds).ceil() as usize],
            write: 0,
            filled: 0,
            rate,
            level: 0.0,
        }
    }

    pub fn rate(&self) -> u32 {
        self.rate
    }

    /// Seconds of input held.
    pub fn held(&self) -> f32 {
        self.filled as f32 / self.rate as f32
    }

    /// Appends a block of mono samples and returns the level after it (0..1, see `level`).
    pub fn push(&mut self, samples: &[f32]) -> f32 {
        if samples.is_empty() {
            return self.level;
        }
        let mut sum = 0.0f32;
        let len = self.ring.len();
        for &s in samples {
            let s = if s.is_finite() { s.clamp(-1.0, 1.0) } else { 0.0 };
            sum += s * s;
            self.ring[self.write] = s;
            self.write = (self.write + 1) % len;
        }
        self.filled = (self.filled + samples.len()).min(len);
        let rms = (sum / samples.len() as f32).sqrt();
        let loudness = if rms > 0.0 {
            ((20.0 * rms.log10() - FLOOR_DB) / -FLOOR_DB).clamp(0.0, 1.0)
        } else {
            0.0
        };
        let block = samples.len() as f32 / self.rate as f32;
        let fallen = self.level * (-block / RELEASE_SECONDS).exp();
        self.level = loudness.max(fallen);
        self.level
    }

    /// How loud the input is: 0 at -60 dBFS or quieter, 1 at full scale (speech near the phone is
    /// usually 0.4..0.8). Rises at once and falls back over ~0.15 s.
    pub fn level(&self) -> f32 {
        self.level
    }

    /// The `seconds` of input that ended `skip_end` seconds ago (clamped to what's held), oldest first.
    pub fn recent(&self, seconds: f32, skip_end: f32) -> Vec<f32> {
        let to_samples = |s: f32| if s.is_finite() && s > 0.0 { (s * self.rate as f32) as usize } else { 0 };
        let skip = to_samples(skip_end).min(self.filled);
        let count = to_samples(seconds).min(self.filled - skip);
        let len = self.ring.len();
        // The newest held sample is just before `write`; the window ends `skip` samples before it.
        let end = (self.write + len - skip) % len;
        let start = (end + len - count) % len;
        (0..count).map(|i| self.ring[(start + i) % len]).collect()
    }

    /// Forgets what was heard (the level too), keeping the ring.
    pub fn clear(&mut self) {
        self.filled = 0;
        self.level = 0.0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recent_returns_the_window_before_the_skipped_tail() {
        let mut c = Capture::new(10, 1.0); // 10 samples
        c.push(&(0..7).map(|i| i as f32 / 10.0).collect::<Vec<_>>());
        assert_eq!(c.recent(0.3, 0.2), vec![0.2, 0.3, 0.4]);
        // Asking for more than is held returns what there is
        assert_eq!(c.recent(5.0, 0.0).len(), 7);
        // Wrapping round the ring keeps the newest samples
        c.push(&[0.7, 0.8, 0.9, 1.0, 1.0]);
        assert_eq!(c.held(), 1.0);
        assert_eq!(c.recent(0.4, 0.0), vec![0.8, 0.9, 1.0, 1.0]);
        assert_eq!(c.recent(1.0, 0.0)[0], 0.2);
        c.clear();
        assert!(c.recent(1.0, 0.0).is_empty());
    }

    #[test]
    fn level_maps_loudness_to_a_unit_scale_and_falls_back() {
        let mut c = Capture::new(1000, 1.0);
        assert_eq!(c.push(&[0.0; 100]), 0.0);
        // Full-scale input reads 1; -30 dBFS reads half
        assert!((c.push(&[1.0, -1.0].repeat(50)) - 1.0).abs() < 1e-6);
        let mut quiet = Capture::new(1000, 1.0);
        assert!((quiet.push(&[0.0316, -0.0316].repeat(50)) - 0.5).abs() < 0.01);
        // Silence after a loud block decays instead of dropping straight to 0
        let after = c.push(&[0.0; 50]); // 50 ms
        assert!(after > 0.6 && after < 0.8, "{after}");
        for _ in 0..20 {
            c.push(&[0.0; 50]);
        }
        assert!(c.level() < 0.01);
        // Non-finite input is silenced
        assert_eq!(Capture::new(1000, 1.0).push(&[f32::NAN; 10]), 0.0);
    }
}
