use egui::Rect;
use serde_json::Value;

#[derive(Clone, Copy)]
pub(super) struct Entrance {
    pub(super) replay: bool,
    delay: f64,
    duration: f64,
    opacity: f32,
    translate_y: f32,
}

impl Entrance {
    pub(super) fn visible_enough(rect: Rect, clip: Rect) -> bool {
        let visible = rect.intersect(clip);
        // Short rows should reveal quickly, while tall sections only need a visible portion.
        visible.is_positive() && visible.height() >= (rect.height() * 0.45).min(clip.height() * 0.25).min(96.)
    }

    pub(super) fn read(value: &Value) -> Option<Self> {
        let duration = value["duration"].as_f64()?.clamp(0., 2000.);
        if duration == 0. {
            return None;
        }
        Some(Self {
            replay: value["replay"].as_bool().unwrap_or(false),
            delay: value["delay"].as_f64().unwrap_or(0.).clamp(0., 400.) / 1000.,
            duration: duration / 1000.,
            opacity: value["opacity"].as_f64().unwrap_or(0.).clamp(0., 1.) as f32,
            translate_y: value["translateY"].as_f64().unwrap_or(12.).clamp(-64., 64.) as f32,
        })
    }

    /// Opacity and vertical offset while active. A completed entrance stays at its layout.
    pub(super) fn sample(self, elapsed: f64) -> Option<(f32, f32)> {
        if elapsed >= self.delay + self.duration {
            return None;
        }
        let t = ((elapsed - self.delay) / self.duration).clamp(0., 1.) as f32;
        // Smoothstep keeps more of the motion visible after the first few frames.
        let progress = t * t * (3. - 2. * t);
        Some((self.opacity + (1. - self.opacity) * progress, self.translate_y * (1. - progress)))
    }
}
