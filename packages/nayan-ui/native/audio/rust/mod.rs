//! Sound: a small realtime mixer (voices, pitch, pan, looping) fed by WAV files and played through
//! cpal (CoreAudio on iOS, AAudio on Android).
//!
//! The game thread never touches audio memory directly: it sends commands through a lock-free
//! single-producer ring buffer, and the audio thread mixes. Nothing on the audio thread blocks.
//!
//! - `mod.rs`     the public API and the global audio system
//! - `mixer.rs`   decoding and mixing (audio thread)
//! - `output.rs`  the cpal output stream and the iOS audio session
//! - `capture.rs` the microphone's recent input and level
//! - `shift.rs`   offline pitch and tempo changes (a recorded voice made higher, not faster)
//! - `input.rs`   the cpal input stream and the iOS microphone permission

#[cfg(feature = "microphone")]
#[path = "../../microphone/rust/capture.rs"]
mod capture;
#[cfg(all(feature = "microphone", not(test), not(target_arch = "wasm32")))]
#[path = "../../microphone/rust/input.rs"]
mod input;
mod mixer;
#[cfg(all(not(test), not(target_arch = "wasm32")))]
mod output;
mod shift;

#[cfg(feature = "microphone")]
pub use capture::Capture;
pub use mixer::{MAX_VOICES, Mixer, Sound};

use mixer::{Command, VoiceChange, pan_gains};
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};

const COMMAND_QUEUE: usize = 256;

struct System {
    producer: Mutex<rtrb::Producer<Command>>,
    sounds: Mutex<Vec<Arc<Sound>>>,
    next_voice: AtomicU64,
    volume: Arc<AtomicU32>,
    muted: Arc<AtomicBool>,
    running: Arc<AtomicBool>,
}

static SYSTEM: OnceLock<System> = OnceLock::new();

/// The global audio system. The output stream starts on first use, on its own thread.
fn system() -> &'static System {
    SYSTEM.get_or_init(|| {
        let (producer, consumer) = rtrb::RingBuffer::new(COMMAND_QUEUE);
        let volume = Arc::new(AtomicU32::new(1.0f32.to_bits()));
        let muted = Arc::new(AtomicBool::new(false));
        let running = Arc::new(AtomicBool::new(false));
        output::start(consumer, volume.clone(), muted.clone(), running.clone());
        System {
            producer: Mutex::new(producer),
            sounds: Mutex::new(Vec::new()),
            next_voice: AtomicU64::new(1),
            volume,
            muted,
            running,
        }
    })
}

/// Decodes and registers a WAV file. Returns its sound id.
pub fn load_wav(bytes: &[u8]) -> Option<u32> {
    register(Sound::from_wav(bytes)?)
}

fn register(sound: Sound) -> Option<u32> {
    let mut sounds = system().sounds.lock().ok()?;
    sounds.push(Arc::new(sound));
    Some(sounds.len() as u32 - 1)
}

/// Frees a sound's samples (a recording that was played): its id then plays nothing. Voices
/// already playing it finish first.
pub fn release(sound: u32) {
    if let Some(slot) = system().sounds.lock().ok().as_mut().and_then(|s| s.get_mut(sound as usize)) {
        *slot = Arc::new(Sound::empty());
    }
}

/// A sound's length in seconds (0 if unknown or released).
pub fn duration(sound: u32) -> f32 {
    system()
        .sounds
        .lock()
        .ok()
        .and_then(|s| s.get(sound as usize).map(|s| s.duration()))
        .unwrap_or(0.0)
}

/// A new sound: `sound` `pitch` times higher and `tempo` times faster; `clean` turns rumble and the
/// room between words down, and `loudness` > 0 levels the speech to that RMS (see `shift.rs`). Runs
/// on the calling thread (a few milliseconds a second of audio). Free it with `release` once
/// played. None for an unknown or released sound or bad factors.
pub fn shift(sound: u32, pitch: f32, tempo: f32, loudness: f32, clean: bool) -> Option<u32> {
    let source = system().sounds.lock().ok()?.get(sound as usize)?.clone();
    register(source.shifted(pitch, tempo, loudness, clean)?)
}

/// A sound's loudness per `1 / per_second` window (see `Sound::levels`).
pub fn levels(sound: u32, per_second: f32) -> Vec<f32> {
    let sound = system().sounds.lock().ok().and_then(|s| s.get(sound as usize).cloned());
    sound.map(|s| s.levels(per_second)).unwrap_or_default()
}

/// Starts a sound. `volume` 0..2, `pan` -1 (left) ..1 (right), `pitch` playback speed.
/// Returns a voice id for `stop`, or None if the sound id is unknown or the queue is full.
pub fn play(sound: u32, volume: f32, pan: f32, pitch: f32, looping: bool) -> Option<u64> {
    if !(volume.is_finite() && pan.is_finite() && pitch.is_finite()) || volume <= 0.0 {
        return None;
    }
    let system = system();
    let sound = system.sounds.lock().ok()?.get(sound as usize)?.clone();
    if sound.duration() == 0.0 {
        return None;
    }
    let id = system.next_voice.fetch_add(1, Ordering::Relaxed);
    let command = Command::Play {
        id,
        sound,
        gain: pan_gains(volume.min(2.0), pan),
        pitch: pitch.clamp(0.1, 4.0),
        looping,
    };
    let queued = system.producer.lock().ok()?.push(command).is_ok();
    #[cfg(all(target_os = "ios", not(test)))]
    output::retry_failed_open();
    queued.then_some(id)
}

pub fn stop(voice: u64) {
    if let Ok(mut producer) = system().producer.lock() {
        let _ = producer.push(Command::Stop(voice));
    }
}

pub fn control(voice: u64, action: u32, value: f64, pan: f32) -> bool {
    let command = match action {
        0 if voice > 0 && (value == 0. || value == 1.) => Command::Update(voice, VoiceChange::Paused(value == 1.)),
        1 if voice > 0 && value.is_finite() && value >= 0. => Command::Update(voice, VoiceChange::Seek(value)),
        2 if voice > 0 && (0. ..=2.).contains(&value) && (-1. ..=1.).contains(&pan) => {
            Command::Update(voice, VoiceChange::Mix(pan_gains(value as f32, pan)))
        }
        3 => Command::StopAll,
        4 => return true, // capability query, also available before initialization
        _ => return false,
    };
    SYSTEM.get().map_or(action == 3, |system| {
        system.producer.lock().is_ok_and(|mut producer| producer.push(command).is_ok())
    })
}

pub fn set_volume(volume: f32) {
    if volume.is_finite() {
        system().volume.store(volume.clamp(0.0, 2.0).to_bits(), Ordering::Relaxed);
    }
}

pub fn set_muted(muted: bool) {
    #[cfg(all(target_os = "ios", not(test)))]
    {
        let was_muted = system().muted.swap(muted, Ordering::Relaxed);
        if muted {
            return;
        }
        if was_muted {
            // iOS can end an interruption without resuming the existing Audio Unit.
            output::restart();
        } else {
            output::retry_failed_open();
        }
    }
    #[cfg(not(all(target_os = "ios", not(test))))]
    system().muted.store(muted, Ordering::Relaxed);
}

/// True once the output stream is playing (false on devices without audio output).
pub fn is_running() -> bool {
    system().running.load(Ordering::Relaxed)
}

#[cfg(feature = "microphone")]
mod mic {
    use super::*;
    use std::sync::atomic::AtomicI32;

    /// Not capturing.
    pub const MIC_OFF: i32 = 0;
    /// Opening the input.
    pub const MIC_STARTING: i32 = 1;
    /// Capturing.
    pub const MIC_LISTENING: i32 = 2;
    /// No input device, no permission, or the input failed to open.
    pub const MIC_FAILED: i32 = -1;

    /// What the microphone has heard lately, shared by the input stream (writer) and the game thread.
    struct Mic {
        capture: Mutex<Option<Capture>>,
        level: AtomicU32,
        state: AtomicI32,
        /// How much input to keep (f32 seconds).
        seconds: AtomicU32,
    }

    static MIC: Mic = Mic {
        capture: Mutex::new(None),
        level: AtomicU32::new(0),
        state: AtomicI32::new(MIC_OFF),
        seconds: AtomicU32::new(0x4120_0000), // 10.0
    };

    /// Starts capturing, keeping the last `max_seconds` of input. The microphone permission must be
    /// granted first (`mic_permission`). Opens asynchronously: `mic_state` says when it's listening or
    /// failed. On iOS the audio session switches to play-and-record (to the speaker) while listening.
    pub fn mic_start(max_seconds: f32) -> bool {
        let seconds = if max_seconds.is_finite() { max_seconds.clamp(0.5, 30.0) } else { 10.0 };
        MIC.seconds.store(seconds.to_bits(), Ordering::Relaxed);
        if let Ok(mut capture) = MIC.capture.lock() {
            *capture = None; // opened at the input's rate by its first block
        }
        #[cfg(any(test, target_arch = "wasm32"))]
        {
            // The browser feeds input with `mic_push` from the page's microphone node.
            MIC.state.store(MIC_LISTENING, Ordering::Relaxed);
            true
        }
        #[cfg(all(not(test), not(target_arch = "wasm32")))]
        {
            system(); // the output runs first: iOS's session changes restart it
            input::start()
        }
    }

    #[cfg_attr(any(test, target_arch = "wasm32"), allow(dead_code))]
    pub(super) fn mic_set_state(state: i32) {
        MIC.state.store(state, Ordering::Relaxed);
    }

    /// Stops capturing and forgets what was heard. On iOS the session returns to ambient audio.
    pub fn mic_stop() {
        #[cfg(all(not(test), not(target_arch = "wasm32")))]
        input::stop();
        if let Ok(mut capture) = MIC.capture.lock() {
            *capture = None;
        }
        MIC.level.store(0, Ordering::Relaxed);
        MIC.state.store(MIC_OFF, Ordering::Relaxed);
    }

    /// MIC_OFF, MIC_STARTING, MIC_LISTENING or MIC_FAILED.
    pub fn mic_state() -> i32 {
        MIC.state.load(Ordering::Relaxed)
    }

    /// How loud the input is now, 0..1 (see `Capture::level`); 0 when not listening.
    pub fn mic_level() -> f32 {
        f32::from_bits(MIC.level.load(Ordering::Relaxed))
    }

    /// Seconds of input held (up to `max_seconds`).
    pub fn mic_held() -> f32 {
        MIC.capture.lock().ok().and_then(|c| c.as_ref().map(Capture::held)).unwrap_or(0.0)
    }

    /// Makes a sound of the `seconds` of input that ended `skip_end` seconds ago (the trailing
    /// silence after someone stops talking) and forgets everything heard so far, so the next take
    /// starts fresh. Returns its sound id; free it with `release` once played.
    pub fn mic_take(seconds: f32, skip_end: f32) -> Option<u32> {
        let (samples, rate) = {
            let mut guard = MIC.capture.lock().ok()?;
            let capture = guard.as_mut()?;
            let samples = capture.recent(seconds, skip_end);
            capture.clear();
            (samples, capture.rate())
        };
        MIC.level.store(0, Ordering::Relaxed);
        register(Sound::from_mono(&samples, rate)?)
    }

    /// Input from the device or the page: mono samples at `rate` (the buffer follows a new rate).
    pub fn mic_push(samples: &[f32], rate: u32) {
        if MIC.state.load(Ordering::Relaxed) != MIC_LISTENING || rate == 0 {
            return;
        }
        let Ok(mut guard) = MIC.capture.lock() else { return };
        if guard.as_ref().is_none_or(|c| c.rate() != rate) {
            *guard = Some(Capture::new(rate, f32::from_bits(MIC.seconds.load(Ordering::Relaxed))));
        }
        if let Some(capture) = guard.as_mut() {
            MIC.level.store(capture.push(samples).to_bits(), Ordering::Relaxed);
        }
    }

    /// Whether the app may record: 1 granted, 0 not asked yet, -1 denied. Only iOS answers here
    /// (Android asks through the app's activity, the browser through the page); elsewhere 1.
    pub fn mic_permission() -> i32 {
        #[cfg(all(not(test), target_os = "ios"))]
        return input::permission();
        #[allow(unreachable_code)]
        1
    }

    /// Asks for the microphone (the system prompt, the first time) and calls `done` with the answer,
    /// possibly on another thread. Only iOS asks here; elsewhere it answers true at once.
    pub fn mic_request(done: impl FnOnce(bool) + Send + 'static) {
        #[cfg(all(not(test), target_os = "ios"))]
        return input::request(done);
        #[allow(unreachable_code)]
        done(true)
    }
}
#[cfg(all(feature = "microphone", not(test), not(target_arch = "wasm32")))]
use mic::mic_set_state;
#[cfg(feature = "microphone")]
pub use mic::*;

/// Tests never open an audio device.
#[cfg(test)]
mod output {
    use super::mixer::Command;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, AtomicU32};
    pub fn start(_: rtrb::Consumer<Command>, _: Arc<AtomicU32>, _: Arc<AtomicBool>, _: Arc<AtomicBool>) {}
}

#[cfg(all(not(test), target_arch = "wasm32"))]
mod output {
    use super::*;
    use std::cell::RefCell;
    thread_local! { static MIXER: RefCell<Option<Mixer>> = const { RefCell::new(None) }; }
    pub fn start(consumer: rtrb::Consumer<Command>, volume: Arc<AtomicU32>, muted: Arc<AtomicBool>, _: Arc<AtomicBool>) {
        MIXER.with(|m| *m.borrow_mut() = Some(Mixer::new(consumer, 48000, volume, muted)));
    }
    pub fn render(data: &mut [f32]) {
        MIXER.with(|m| {
            if let Some(mixer) = m.borrow_mut().as_mut() {
                mixer.render(data, 2);
            } else {
                data.fill(0.0);
            }
        });
    }
}

#[cfg(target_arch = "wasm32")]
pub fn web_render(data: &mut [f32]) {
    system().running.store(true, Ordering::Relaxed);
    output::render(data);
}

#[cfg(all(test, feature = "microphone"))]
mod tests {
    use super::*;

    #[test]
    fn a_take_turns_what_the_microphone_heard_into_a_sound_that_can_be_released() {
        assert!(mic_start(2.0));
        assert_eq!(mic_state(), MIC_LISTENING);
        // 0.5 s of speech-like tone, then 0.3 s of silence, at 16 kHz
        let tone: Vec<f32> = (0..8000).map(|i| (i as f32 * 0.2).sin() * 0.3).collect();
        mic_push(&tone, 16_000);
        assert!(mic_level() > 0.6);
        mic_push(&[0.0; 4800], 16_000);
        assert!((mic_held() - 0.8).abs() < 1e-3);
        // The speech without its trailing silence
        let sound = mic_take(0.5, 0.3).expect("a recording");
        assert!((duration(sound) - 0.5).abs() < 1e-3);
        let loudness = levels(sound, 20.0);
        assert_eq!(loudness.len(), 10);
        assert!(loudness[1..9].iter().all(|&l| l > 0.15), "{loudness:?}");
        // Faded in, so it starts without a click
        assert!(loudness[0] < loudness[1]);
        // Taking forgets what was heard
        assert_eq!(mic_held(), 0.0);
        assert!(mic_take(1.0, 0.0).is_none());
        release(sound);
        assert_eq!(duration(sound), 0.0);
        assert!(levels(sound, 20.0).is_empty());
        mic_stop();
        assert_eq!(mic_state(), MIC_OFF);
        mic_push(&tone, 16_000); // ignored while off
        assert_eq!(mic_held(), 0.0);
    }
}
