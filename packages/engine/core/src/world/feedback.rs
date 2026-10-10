//! Impact feedback: sounds and haptics the core plays straight from collision events.

use super::{Entity, NO_ENTITY, World};

/// Sound and haptic played by the core itself when this entity starts touching something.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ImpactFeedback {
    /// Sound id from `audio::load_wav`, or None for haptics only.
    pub sound: Option<u32>,
    /// Impacts slower than this are silent; at `max_speed` and above, full volume/strength.
    pub min_speed: f32,
    pub max_speed: f32,
    /// Volume at full strength (0..2).
    pub volume: f32,
    /// Haptic intensity at full strength (0..1); 0 = no haptic.
    pub haptic: f32,
}

impl World {
    /// Plays a sound/haptic from the core whenever this entity starts touching something solid
    /// (sensor contacts don't count), scaled
    /// by impact speed and panned relative to the listener. `None` removes it.
    pub fn set_impact_feedback(&mut self, e: Entity, feedback: Option<ImpactFeedback>) {
        let valid = feedback.is_none_or(|f| {
            f.min_speed.is_finite()
                && f.max_speed.is_finite()
                && f.max_speed > f.min_speed
                && f.volume.is_finite()
                && f.haptic.is_finite()
        });
        if let Some(i) = self.dense(e).filter(|_| valid) {
            self.feedback[i] = feedback;
        }
    }

    /// Impact sounds are panned and attenuated relative to this entity (usually the player or the
    /// camera's focus). `None` plays them centred at full volume.
    pub fn set_listener(&mut self, e: Option<Entity>) {
        self.listener = e.map_or(NO_ENTITY, |e| e.0);
    }

    /// Plays the configured impact feedback for either side of a contact that just started.
    pub(super) fn impact_feedback(&mut self, a: Entity, b: Entity, speed: f32) {
        let listener = self.dense(Entity(self.listener)).map(|l| self.position[l]);
        let mut played: Option<u32> = None;
        for e in [a, b] {
            let Some(i) = self.dense(e) else { continue };
            let Some(f) = self.feedback[i] else { continue };
            let strength = ((speed - f.min_speed) / (f.max_speed - f.min_speed)).clamp(0.0, 1.0);
            if strength <= 0.0 {
                continue;
            }
            let (pan, attenuation) = match listener {
                Some(l) => {
                    let d = self.position[i] - l;
                    ((d.x / 12.0).clamp(-1.0, 1.0), 1.0 / (1.0 + d.length() / 20.0))
                }
                None => (0.0, 1.0),
            };
            if let Some(sound) = f.sound.filter(|&s| played != Some(s)) {
                play_sound(sound, f.volume * strength * attenuation, pan);
                played = Some(sound);
            }
            if f.haptic > 0.0 {
                play_haptic(f.haptic * strength, 0.4 + 0.5 * strength);
            }
        }
    }
}

// Where feedback goes: the audio/haptics systems, or a log in tests.

#[cfg(not(test))]
pub fn play_sound(sound: u32, volume: f32, pan: f32) {
    crate::audio::play(sound, volume, pan, 1.0, false);
}

#[cfg(not(test))]
pub fn play_haptic(intensity: f32, sharpness: f32) {
    crate::haptics::impact(intensity, sharpness);
}

#[cfg(test)]
thread_local! {
    pub static LOG: std::cell::RefCell<Vec<(&'static str, f32, f32)>> = const { std::cell::RefCell::new(Vec::new()) };
}

#[cfg(test)]
pub fn play_sound(sound: u32, volume: f32, pan: f32) {
    let _ = sound;
    LOG.with(|l| l.borrow_mut().push(("sound", volume, pan)));
}

#[cfg(test)]
pub fn play_haptic(intensity: f32, sharpness: f32) {
    LOG.with(|l| l.borrow_mut().push(("haptic", intensity, sharpness)));
}
