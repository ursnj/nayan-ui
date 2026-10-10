//! Sound: a small realtime mixer (voices, pitch, pan, looping) fed by WAV files and played through
//! cpal (CoreAudio on iOS, AAudio on Android).
//!
//! The game thread never touches audio memory directly: it sends commands through a lock-free
//! single-producer ring buffer, and the audio thread mixes. Nothing on the audio thread blocks.

use std::io::Cursor;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};

/// Simultaneous voices. When full, a new sound replaces the oldest non-looping one.
pub const MAX_VOICES: usize = 32;
const COMMAND_QUEUE: usize = 256;

/// Decoded audio, stored as stereo frames at the file's sample rate.
pub struct Sound {
    frames: Vec<[f32; 2]>,
    rate: u32,
}

impl Sound {
    /// Decodes a PCM (8/16/24/32-bit int or 32-bit float) WAV file, mono or stereo.
    pub fn from_wav(bytes: &[u8]) -> Option<Sound> {
        let mut reader = hound::WavReader::new(Cursor::new(bytes)).ok()?;
        let spec = reader.spec();
        let channels = spec.channels as usize;
        if channels == 0 || channels > 2 || spec.sample_rate == 0 {
            return None;
        }
        let samples: Vec<f32> = match spec.sample_format {
            hound::SampleFormat::Float => reader.samples::<f32>().collect::<Result<_, _>>().ok()?,
            hound::SampleFormat::Int => {
                let scale = 1.0 / (1u64 << (spec.bits_per_sample - 1)) as f32;
                reader.samples::<i32>().map(|s| s.map(|v| v as f32 * scale)).collect::<Result<_, _>>().ok()?
            }
        };
        let frames = samples
            .chunks_exact(channels)
            .map(|f| if channels == 2 { [f[0], f[1]] } else { [f[0], f[0]] })
            .collect::<Vec<_>>();
        (!frames.is_empty()).then_some(Sound { frames, rate: spec.sample_rate })
    }

    pub fn duration(&self) -> f32 {
        self.frames.len() as f32 / self.rate as f32
    }
}

enum Command {
    Play { id: u64, sound: Arc<Sound>, gain: [f32; 2], pitch: f32, looping: bool },
    Stop(u64),
}

struct Voice {
    id: u64,
    sound: Arc<Sound>,
    position: f64,
    step: f64,
    gain: [f32; 2],
    looping: bool,
}

/// Mixes voices into an output buffer. Runs on the audio thread; testable without a device.
pub struct Mixer {
    voices: Vec<Voice>,
    commands: rtrb::Consumer<Command>,
    output_rate: u32,
    volume: Arc<AtomicU32>,
    muted: Arc<AtomicBool>,
}

impl Mixer {
    fn new(commands: rtrb::Consumer<Command>, output_rate: u32, volume: Arc<AtomicU32>, muted: Arc<AtomicBool>) -> Self {
        Self { voices: Vec::with_capacity(MAX_VOICES), commands, output_rate, volume, muted }
    }

    /// Fills `out` (interleaved, `channels` per frame) with the mix.
    pub fn render(&mut self, out: &mut [f32], channels: usize) {
        while let Ok(command) = self.commands.pop() {
            match command {
                Command::Play { id, sound, gain, pitch, looping } => {
                    if self.voices.len() == MAX_VOICES {
                        match self.voices.iter().position(|v| !v.looping) {
                            Some(oldest) => {
                                self.voices.remove(oldest);
                            }
                            None => continue, // all voices are music loops: drop the effect
                        }
                    }
                    let step = sound.rate as f64 / self.output_rate as f64 * pitch as f64;
                    self.voices.push(Voice { id, sound, position: 0.0, step, gain, looping });
                }
                Command::Stop(id) => self.voices.retain(|v| v.id != id),
            }
        }

        out.fill(0.0);
        let channels = channels.max(1);
        for voice in &mut self.voices {
            let frames = &voice.sound.frames;
            let len = frames.len();
            for frame in out.chunks_exact_mut(channels) {
                if voice.position >= len as f64 {
                    if !voice.looping {
                        break;
                    }
                    voice.position -= len as f64;
                }
                let i = voice.position as usize;
                let t = (voice.position - i as f64) as f32;
                let next = if i + 1 < len { i + 1 } else if voice.looping { 0 } else { i };
                let l = frames[i][0] + (frames[next][0] - frames[i][0]) * t;
                let r = frames[i][1] + (frames[next][1] - frames[i][1]) * t;
                if channels == 1 {
                    frame[0] += (l * voice.gain[0] + r * voice.gain[1]) * 0.5;
                } else {
                    frame[0] += l * voice.gain[0];
                    frame[1] += r * voice.gain[1];
                }
                voice.position += voice.step;
            }
        }
        self.voices.retain(|v| v.looping || v.position < v.sound.frames.len() as f64);

        let volume = if self.muted.load(Ordering::Relaxed) { 0.0 } else { f32::from_bits(self.volume.load(Ordering::Relaxed)) };
        for s in out.iter_mut() {
            *s = soft_clip(*s * volume);
        }
    }

    pub fn active_voices(&self) -> usize {
        self.voices.len()
    }
}

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
    let command = Command::Play { id, sound, gain: pan_gains(volume.min(2.0), pan), pitch: pitch.clamp(0.1, 4.0), looping };
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
        system().volume.store(volume.clamp(0.0, 2.0).to_bits(), Ordering::Relaxed);
    }
}

pub fn set_muted(muted: bool) {
    system().muted.store(muted, Ordering::Relaxed);
}

/// True once the output stream is playing (false on devices without audio output).
pub fn is_running() -> bool {
    system().running.load(Ordering::Relaxed)
}

/// Transparent below 0.8; above that, eases towards ±1 so stacked sounds never hard-clip.
fn soft_clip(x: f32) -> f32 {
    const KNEE: f32 = 0.8;
    let a = x.abs();
    if a <= KNEE {
        x
    } else {
        x.signum() * (KNEE + (1.0 - KNEE) * ((a - KNEE) / (1.0 - KNEE)).tanh())
    }
}

/// Constant-power pan: equal loudness across the stereo field.
fn pan_gains(volume: f32, pan: f32) -> [f32; 2] {
    let angle = (pan.clamp(-1.0, 1.0) + 1.0) * std::f32::consts::FRAC_PI_4;
    [angle.cos() * volume * std::f32::consts::SQRT_2, angle.sin() * volume * std::f32::consts::SQRT_2]
}

#[cfg(not(test))]
mod output {
    use super::{Command, Mixer};
    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
    use cpal::{FromSample, SampleFormat, SizedSample, StreamConfig};
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

    /// Opens the default output on a dedicated thread that owns the stream for the app's lifetime
    /// (cpal streams aren't `Send` on every platform). Failures leave audio silent, never crash.
    pub fn start(
        consumer: rtrb::Consumer<Command>,
        volume: Arc<AtomicU32>,
        muted: Arc<AtomicBool>,
        running: Arc<AtomicBool>,
    ) {
        let spawned = std::thread::Builder::new().name("engine-audio".into()).spawn(move || {
            #[cfg(target_os = "ios")]
            super::ios::configure_session();
            let Some(device) = cpal::default_host().default_output_device() else { return };
            let Ok(supported) = device.default_output_config() else { return };
            let format = supported.sample_format();
            let config: StreamConfig = supported.into();
            let mixer = Mixer::new(consumer, config.sample_rate, volume, muted);
            let stream = match format {
                SampleFormat::F32 => build::<f32>(&device, config, mixer),
                SampleFormat::I16 => build::<i16>(&device, config, mixer),
                SampleFormat::I32 => build::<i32>(&device, config, mixer),
                SampleFormat::U16 => build::<u16>(&device, config, mixer),
                _ => return,
            };
            let Some(stream) = stream else { return };
            if stream.play().is_err() {
                return;
            }
            running.store(true, Ordering::Relaxed);
            loop {
                std::thread::park(); // keep `stream` alive
            }
        });
        let _ = spawned;
    }

    fn build<T: SizedSample + FromSample<f32>>(
        device: &cpal::Device,
        config: StreamConfig,
        mut mixer: Mixer,
    ) -> Option<cpal::Stream> {
        let channels = config.channels as usize;
        let mut scratch: Vec<f32> = Vec::with_capacity(8192);
        device
            .build_output_stream(
                config,
                move |data: &mut [T], _: &cpal::OutputCallbackInfo| {
                    if scratch.len() < data.len() {
                        scratch.resize(data.len(), 0.0); // only grows if the device asks for a bigger buffer
                    }
                    let mix = &mut scratch[..data.len()];
                    mixer.render(mix, channels);
                    for (out, &s) in data.iter_mut().zip(mix.iter()) {
                        *out = T::from_sample(s);
                    }
                },
                |_| {}, // device errors: cpal stops/restarts the stream on iOS interruptions itself
                None,
            )
            .ok()
    }
}

/// Tests never open an audio device.
#[cfg(test)]
mod output {
    use super::Command;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, AtomicU32};
    pub fn start(_: rtrb::Consumer<Command>, _: Arc<AtomicU32>, _: Arc<AtomicBool>, _: Arc<AtomicBool>) {}
}

#[cfg(target_os = "ios")]
mod ios {
    use objc2_avf_audio::{AVAudioSession, AVAudioSessionCategoryAmbient};

    /// "Ambient": respects the silent switch and mixes with other apps' audio, as games should.
    pub fn configure_session() {
        // SAFETY: the shared session is a process-wide singleton; the category constant is a
        // framework-provided static string.
        unsafe {
            if let Some(ambient) = AVAudioSessionCategoryAmbient {
                let _ = AVAudioSession::sharedInstance().setCategory_error(ambient);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn wav(samples: &[i16], channels: u16, rate: u32) -> Vec<u8> {
        let mut out = Cursor::new(Vec::new());
        let spec = hound::WavSpec { channels, sample_rate: rate, bits_per_sample: 16, sample_format: hound::SampleFormat::Int };
        let mut w = hound::WavWriter::new(&mut out, spec).unwrap();
        for &s in samples {
            w.write_sample(s).unwrap();
        }
        w.finalize().unwrap();
        out.into_inner()
    }

    fn mixer() -> (rtrb::Producer<Command>, Mixer) {
        let (p, c) = rtrb::RingBuffer::new(16);
        let m = Mixer::new(c, 48_000, Arc::new(AtomicU32::new(1.0f32.to_bits())), Arc::new(AtomicBool::new(false)));
        (p, m)
    }

    fn play(p: &mut rtrb::Producer<Command>, id: u64, sound: &Arc<Sound>, pitch: f32, looping: bool) {
        let gain = pan_gains(1.0, 0.0);
        p.push(Command::Play { id, sound: sound.clone(), gain, pitch, looping }).ok().unwrap();
    }

    #[test]
    fn decodes_mono_and_stereo_wav() {
        let mono = Sound::from_wav(&wav(&[16384, -16384], 1, 24_000)).unwrap();
        assert_eq!(mono.frames, vec![[0.5, 0.5], [-0.5, -0.5]]);
        assert_eq!(mono.rate, 24_000);
        let stereo = Sound::from_wav(&wav(&[16384, 0, 0, -16384], 2, 48_000)).unwrap();
        assert_eq!(stereo.frames, vec![[0.5, 0.0], [0.0, -0.5]]);
        assert!(Sound::from_wav(b"not a wav").is_none());
        assert!(Sound::from_wav(&wav(&[], 1, 48_000)).is_none(), "empty files are rejected");
    }

    #[test]
    fn plays_a_sound_once_then_frees_the_voice() {
        let (mut p, mut m) = mixer();
        let sound = Arc::new(Sound { frames: vec![[0.5, 0.5]; 4], rate: 48_000 });
        play(&mut p, 1, &sound, 1.0, false);
        let mut out = [0.0f32; 12]; // 6 stereo frames
        m.render(&mut out, 2);
        assert!(out[..8].iter().all(|&s| s > 0.3), "4 frames of sound: {out:?}");
        assert!(out[8..].iter().all(|&s| s == 0.0), "then silence: {out:?}");
        assert_eq!(m.active_voices(), 0);
    }

    #[test]
    fn loops_until_stopped_and_resamples() {
        let (mut p, mut m) = mixer();
        let sound = Arc::new(Sound { frames: vec![[0.5, 0.5]; 4], rate: 24_000 }); // half the output rate
        play(&mut p, 7, &sound, 1.0, true);
        let mut out = [0.0f32; 64];
        m.render(&mut out, 2);
        assert!(out.iter().all(|&s| s > 0.3), "looping fills the buffer");
        assert_eq!(m.active_voices(), 1);
        p.push(Command::Stop(7)).ok().unwrap();
        m.render(&mut out, 2);
        assert!(out.iter().all(|&s| s == 0.0));
        assert_eq!(m.active_voices(), 0);
    }

    #[test]
    fn steals_the_oldest_effect_when_full_but_keeps_music() {
        let (p, c) = rtrb::RingBuffer::new(MAX_VOICES * 2 + 4);
        let mut p = p;
        let mut m = Mixer::new(c, 48_000, Arc::new(AtomicU32::new(1.0f32.to_bits())), Arc::new(AtomicBool::new(false)));
        let long = Arc::new(Sound { frames: vec![[0.1, 0.1]; 48_000], rate: 48_000 });
        play(&mut p, 1, &long, 1.0, true); // music
        for id in 2..=MAX_VOICES as u64 + 5 {
            play(&mut p, id, &long, 1.0, false);
        }
        let mut out = [0.0f32; 8];
        m.render(&mut out, 2);
        assert_eq!(m.active_voices(), MAX_VOICES);
        assert!(m.voices.iter().any(|v| v.id == 1), "music survives");
        assert!(m.voices.iter().any(|v| v.id == MAX_VOICES as u64 + 5), "newest effect plays");
        assert!(!m.voices.iter().any(|v| v.id == 2), "oldest effect was stolen");
    }

    #[test]
    fn pan_mute_and_limiter() {
        let (l, r) = (pan_gains(1.0, -1.0), pan_gains(1.0, 1.0));
        assert!(l[0] > 1.0 && l[1].abs() < 1e-6 && r[0].abs() < 1e-6 && r[1] > 1.0);
        let c = pan_gains(1.0, 0.0);
        assert!((c[0] - 1.0).abs() < 1e-5 && (c[1] - 1.0).abs() < 1e-5, "centre is unity: {c:?}");

        let (mut p, mut m) = mixer();
        let loud = Arc::new(Sound { frames: vec![[1.0, 1.0]; 64], rate: 48_000 });
        for id in 0..10 {
            play(&mut p, id, &loud, 1.0, false);
        }
        let mut out = [0.0f32; 16];
        m.render(&mut out, 2);
        assert!(out.iter().all(|&s| s <= 1.0 && s > 0.95), "stacked sounds are limited to ±1: {out:?}");
        assert_eq!(soft_clip(0.5), 0.5, "transparent at normal levels");
        assert_eq!(soft_clip(-0.8), -0.8);
        m.muted.store(true, Ordering::Relaxed);
        m.render(&mut out, 2);
        assert!(out.iter().all(|&s| s == 0.0));
    }
}
