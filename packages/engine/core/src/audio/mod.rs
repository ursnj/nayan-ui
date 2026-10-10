//! Sound: a small realtime mixer (voices, pitch, pan, looping) fed by WAV files and played through
//! cpal (CoreAudio on iOS, AAudio on Android).
//!
//! The game thread never touches audio memory directly: it sends commands through a lock-free
//! single-producer ring buffer, and the audio thread mixes. Nothing on the audio thread blocks.
//!
//! - `mod.rs`    the public API and the global audio system
//! - `mixer.rs`  decoding and mixing (audio thread)
//! - `output.rs` the cpal output stream and the iOS audio session

mod mixer;
#[cfg(not(test))]
mod output;

pub use mixer::{MAX_VOICES, Mixer, Sound};

use mixer::{Command, pan_gains};
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
    let sound = Arc::new(Sound::from_wav(bytes)?);
    let mut sounds = system().sounds.lock().ok()?;
    sounds.push(sound);
    Some(sounds.len() as u32 - 1)
}

/// Starts a sound. `volume` 0..2, `pan` -1 (left) ..1 (right), `pitch` playback speed.
/// Returns a voice id for `stop`, or None if the sound id is unknown or the queue is full.
pub fn play(sound: u32, volume: f32, pan: f32, pitch: f32, looping: bool) -> Option<u64> {
    if !(volume.is_finite() && pan.is_finite() && pitch.is_finite()) || volume <= 0.0 {
        return None;
    }
    let system = system();
    let sound = system.sounds.lock().ok()?.get(sound as usize)?.clone();
    let id = system.next_voice.fetch_add(1, Ordering::Relaxed);
    let command = Command::Play {
        id,
        sound,
        gain: pan_gains(volume.min(2.0), pan),
        pitch: pitch.clamp(0.1, 4.0),
        looping,
    };
    system.producer.lock().ok()?.push(command).ok()?;
    Some(id)
}

pub fn stop(voice: u64) {
    if let Ok(mut producer) = system().producer.lock() {
        let _ = producer.push(Command::Stop(voice));
    }
}

pub fn set_volume(volume: f32) {
    if volume.is_finite() {
        system()
            .volume
            .store(volume.clamp(0.0, 2.0).to_bits(), Ordering::Relaxed);
    }
}

pub fn set_muted(muted: bool) {
    system().muted.store(muted, Ordering::Relaxed);
}

/// True once the output stream is playing (false on devices without audio output).
pub fn is_running() -> bool {
    system().running.load(Ordering::Relaxed)
}

/// Tests never open an audio device.
#[cfg(test)]
mod output {
    use super::mixer::Command;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, AtomicU32};
    pub fn start(_: rtrb::Consumer<Command>, _: Arc<AtomicU32>, _: Arc<AtomicBool>, _: Arc<AtomicBool>) {}
}
