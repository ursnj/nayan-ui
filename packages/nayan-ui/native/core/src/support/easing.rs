#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Easing {
    Linear,
    /// Starts slow.
    In,
    /// Ends slow (the default: feels responsive).
    #[default]
    Out,
    InOut,
    /// Overshoots a little, then settles.
    Back,
    /// Bounces at the end, like a dropped ball.
    Bounce,
    /// Springs past the target and wobbles in.
    Elastic,
}

impl Easing {
    #[cfg(feature = "games")]
    pub(crate) fn from_index(i: f64) -> Option<Easing> {
        Some(match i as i64 {
            0 => Easing::Linear,
            1 => Easing::In,
            2 => Easing::Out,
            3 => Easing::InOut,
            4 => Easing::Back,
            5 => Easing::Bounce,
            6 => Easing::Elastic,
            _ => return None,
        })
    }

    /// Maps progress 0..1 to eased progress (0 at 0, 1 at 1; Back and Elastic overshoot).
    pub fn apply(self, t: f32) -> f32 {
        match self {
            Easing::Linear => t,
            Easing::In => t * t * t,
            Easing::Out => 1.0 - (1.0 - t).powi(3),
            Easing::InOut if t < 0.5 => 4.0 * t * t * t,
            Easing::InOut => 1.0 - (-2.0 * t + 2.0).powi(3) / 2.0,
            Easing::Back => {
                let (c1, u) = (1.70158, t - 1.0);
                1.0 + (c1 + 1.0) * u * u * u + c1 * u * u
            }
            Easing::Bounce => bounce(t),
            Easing::Elastic if t <= 0.0 || t >= 1.0 => t,
            Easing::Elastic => 2f32.powf(-10.0 * t) * ((t * 10.0 - 0.75) * std::f32::consts::TAU / 3.0).sin() + 1.0,
        }
    }
}

fn bounce(t: f32) -> f32 {
    let (n, d) = (7.5625, 2.75);
    if t < 1.0 / d {
        n * t * t
    } else if t < 2.0 / d {
        let t = t - 1.5 / d;
        n * t * t + 0.75
    } else if t < 2.5 / d {
        let t = t - 2.25 / d;
        n * t * t + 0.9375
    } else {
        let t = t - 2.625 / d;
        n * t * t + 0.984375
    }
}
