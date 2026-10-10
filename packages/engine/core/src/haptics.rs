//! Haptics: transient taps with continuous intensity and sharpness (Core Haptics on iOS).
//! Other platforms are a no-op for now.

/// One tap in a pattern: when (seconds from now), how strong (0..1), how crisp (0..1).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Tap {
    pub time: f32,
    pub intensity: f32,
    pub sharpness: f32,
}

/// Single impacts closer together than this are dropped, so a pile-up of collisions doesn't buzz.
const MIN_IMPACT_INTERVAL: f32 = 0.035;

/// Plays taps. With `throttle`, a single-tap call within `MIN_IMPACT_INTERVAL` of the last one is
/// ignored. Values are clamped; non-finite taps are skipped.
pub fn play(taps: &[Tap], throttle: bool) {
    let taps: Vec<Tap> = taps
        .iter()
        .filter(|t| t.time.is_finite() && t.intensity.is_finite() && t.sharpness.is_finite())
        .map(|t| Tap {
            time: t.time.max(0.0),
            intensity: t.intensity.clamp(0.0, 1.0),
            sharpness: t.sharpness.clamp(0.0, 1.0),
        })
        .filter(|t| t.intensity > 0.0)
        .collect();
    if taps.is_empty() || (throttle && taps.len() == 1 && !gate::allow(MIN_IMPACT_INTERVAL)) {
        return;
    }
    platform::play(&taps);
}

pub fn impact(intensity: f32, sharpness: f32) {
    play(
        &[Tap {
            time: 0.0,
            intensity,
            sharpness,
        }],
        true,
    );
}

/// True if the device has a haptic actuator the engine can drive.
pub fn supported() -> bool {
    platform::supported()
}

mod gate {
    use std::cell::Cell;
    use std::time::Instant;

    thread_local! {
        static LAST: Cell<Option<Instant>> = const { Cell::new(None) };
    }

    pub fn allow(min_interval: f32) -> bool {
        LAST.with(|last| {
            let now = Instant::now();
            if last
                .get()
                .is_some_and(|t| now.duration_since(t).as_secs_f32() < min_interval)
            {
                return false;
            }
            last.set(Some(now));
            true
        })
    }
}

#[cfg(all(target_os = "ios", not(test)))]
mod platform {
    use super::Tap;
    use objc2::AnyThread;
    use objc2::rc::Retained;
    use objc2_core_haptics::{
        CHHapticDeviceCapability, CHHapticEngine, CHHapticEvent, CHHapticEventParameter,
        CHHapticEventParameterIDHapticIntensity, CHHapticEventParameterIDHapticSharpness,
        CHHapticEventTypeHapticTransient, CHHapticPattern, CHHapticPatternPlayer, CHHapticTimeImmediate,
    };
    use objc2_foundation::NSArray;
    use std::cell::RefCell;

    thread_local! {
        // Created lazily on the calling (JS) thread. Core Haptics objects aren't Send, so the
        // engine stays on the thread that made it.
        static ENGINE: RefCell<Option<Retained<CHHapticEngine>>> = const { RefCell::new(None) };
    }

    pub fn supported() -> bool {
        // SAFETY: class method on the framework; returns a capability object.
        unsafe { CHHapticEngine::capabilitiesForHardware().supportsHaptics() }
    }

    fn engine() -> Option<Retained<CHHapticEngine>> {
        ENGINE.with(|cell| {
            if let Some(engine) = cell.borrow().as_ref() {
                return Some(engine.clone());
            }
            if !supported() {
                return None;
            }
            // SAFETY: standard Core Haptics setup; errors are returned, not thrown.
            let engine = unsafe { CHHapticEngine::initAndReturnError(CHHapticEngine::alloc()) }.ok()?;
            unsafe {
                engine.setAutoShutdownEnabled(true); // the system powers it down when idle
                engine.startAndReturnError().ok()?;
            }
            *cell.borrow_mut() = Some(engine.clone());
            Some(engine)
        })
    }

    pub fn play(taps: &[Tap]) {
        let Some(engine) = engine() else { return };
        // SAFETY: building immutable pattern objects from framework constants and plain floats.
        let pattern = unsafe {
            let events: Vec<Retained<CHHapticEvent>> = taps
                .iter()
                .map(|t| {
                    let params = NSArray::from_retained_slice(&[
                        CHHapticEventParameter::initWithParameterID_value(
                            CHHapticEventParameter::alloc(),
                            CHHapticEventParameterIDHapticIntensity,
                            t.intensity,
                        ),
                        CHHapticEventParameter::initWithParameterID_value(
                            CHHapticEventParameter::alloc(),
                            CHHapticEventParameterIDHapticSharpness,
                            t.sharpness,
                        ),
                    ]);
                    CHHapticEvent::initWithEventType_parameters_relativeTime(
                        CHHapticEvent::alloc(),
                        CHHapticEventTypeHapticTransient,
                        &params,
                        t.time as f64,
                    )
                })
                .collect();
            CHHapticPattern::initWithEvents_parameters_error(
                CHHapticPattern::alloc(),
                &NSArray::from_retained_slice(&events),
                &NSArray::new(),
            )
        };
        let Ok(pattern) = pattern else { return };
        let start = |engine: &CHHapticEngine| unsafe {
            engine
                .createPlayerWithPattern_error(&pattern)
                .and_then(|player| player.startAtTime_error(CHHapticTimeImmediate))
                .is_ok()
        };
        // The engine stops when the app backgrounds or after auto-shutdown: restart and retry once.
        if !start(&engine) && unsafe { engine.startAndReturnError() }.is_ok() {
            start(&engine);
        }
    }
}

#[cfg(any(not(target_os = "ios"), test))]
mod platform {
    use super::Tap;

    pub fn supported() -> bool {
        false
    }

    pub fn play(_: &[Tap]) {}
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn throttle_drops_rapid_single_impacts_only() {
        assert!(gate::allow(10.0));
        assert!(!gate::allow(10.0), "second call inside the interval is dropped");
        // Patterns are never throttled (exercised through `play`, which is a no-op off-device).
        play(
            &[
                Tap {
                    time: 0.0,
                    intensity: 1.0,
                    sharpness: 0.5,
                },
                Tap {
                    time: 0.1,
                    intensity: 0.5,
                    sharpness: 0.5,
                },
            ],
            true,
        );
        play(
            &[Tap {
                time: f32::NAN,
                intensity: 1.0,
                sharpness: 0.5,
            }],
            false,
        );
        assert!(!supported(), "no actuator in tests");
    }
}
