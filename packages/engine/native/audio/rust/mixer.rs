//! The realtime mixer and decoded sounds. Runs on the audio thread; tested without a device.

use std::io::Cursor;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

/// Simultaneous voices. When full, a new sound replaces the oldest non-looping one.
pub const MAX_VOICES: usize = 32;

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
        // WAVE_FORMAT_EXTENSIBLE headers can claim any bit depth.
        let int_bits_ok = spec.sample_format == hound::SampleFormat::Float || (1..=32).contains(&spec.bits_per_sample);
        if channels == 0 || channels > 2 || spec.sample_rate == 0 || !int_bits_ok {
            return None;
        }
        let samples: Vec<f32> = match spec.sample_format {
            // NaN samples would turn the whole mix to NaN while the sound plays.
            hound::SampleFormat::Float => reader
                .samples::<f32>()
                .map(|s| s.map(|v| if v.is_finite() { v } else { 0.0 }))
                .collect::<Result<_, _>>()
                .ok()?,
            hound::SampleFormat::Int => {
                let scale = 1.0 / (1u64 << (spec.bits_per_sample - 1)) as f32;
                reader
                    .samples::<i32>()
                    .map(|s| s.map(|v| v as f32 * scale))
                    .collect::<Result<_, _>>()
                    .ok()?
            }
        };
        let frames = samples
            .chunks_exact(channels)
            .map(|f| if channels == 2 { [f[0], f[1]] } else { [f[0], f[0]] })
            .collect::<Vec<_>>();
        (!frames.is_empty()).then_some(Sound {
            frames,
            rate: spec.sample_rate,
        })
    }

    /// A recording: mono samples at `rate`, faded in and out over 5 ms so it starts and stops without
    /// a click. Non-finite samples are silenced. None if there are no samples.
    pub fn from_mono(samples: &[f32], rate: u32) -> Option<Sound> {
        if samples.is_empty() || rate == 0 {
            return None;
        }
        let fade = ((rate as usize) / 200).clamp(1, samples.len().div_ceil(2));
        let len = samples.len();
        let frames = samples
            .iter()
            .enumerate()
            .map(|(i, &s)| {
                let s = if s.is_finite() { s.clamp(-1.0, 1.0) } else { 0.0 };
                let edge = i.min(len - 1 - i);
                let v = if edge < fade { s * edge as f32 / fade as f32 } else { s };
                [v, v]
            })
            .collect();
        Some(Sound { frames, rate })
    }

    /// This sound `pitch` times higher and `tempo` times faster (see `shift.rs` for `loudness` and `clean`).
    pub fn shifted(&self, pitch: f32, tempo: f32, loudness: f32, clean: bool) -> Option<Sound> {
        let frames = super::shift::shift(&self.frames, self.rate, pitch, tempo, loudness, clean)?;
        Some(Sound { frames, rate: self.rate })
    }

    /// A released sound: plays nothing.
    pub(super) fn empty() -> Sound {
        Sound { frames: Vec::new(), rate: 1 }
    }

    pub fn duration(&self) -> f32 {
        self.frames.len() as f32 / self.rate as f32
    }

    /// Loudness (RMS of both channels) per window of `1 / per_second` seconds, from the start: for
    /// lip-sync, talking motion or meters. Empty for a released sound.
    pub fn levels(&self, per_second: f32) -> Vec<f32> {
        if !(per_second.is_finite() && per_second > 0.0) || self.frames.is_empty() {
            return Vec::new();
        }
        let window = ((self.rate as f32 / per_second).round() as usize).max(1);
        self.frames
            .chunks(window)
            .map(|chunk| {
                let sum: f32 = chunk.iter().map(|[l, r]| (l * l + r * r) * 0.5).sum();
                (sum / chunk.len() as f32).sqrt()
            })
            .collect()
    }
}

pub(super) enum Command {
    Play {
        id: u64,
        sound: Arc<Sound>,
        gain: [f32; 2],
        pitch: f32,
        looping: bool,
    },
    Stop(u64),
    StopAll,
    Update(u64, VoiceChange),
}

pub(super) enum VoiceChange {
    Paused(bool),
    Seek(f64),
    Mix([f32; 2]),
}

struct Voice {
    id: u64,
    sound: Arc<Sound>,
    position: f64,
    step: f64,
    gain: [f32; 2],
    looping: bool,
    paused: bool,
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
    pub(super) fn new(commands: rtrb::Consumer<Command>, output_rate: u32, volume: Arc<AtomicU32>, muted: Arc<AtomicBool>) -> Self {
        Self {
            voices: Vec::with_capacity(MAX_VOICES),
            commands,
            output_rate,
            volume,
            muted,
        }
    }

    /// Fills `out` (interleaved, `channels` per frame) with the mix.
    pub fn render(&mut self, out: &mut [f32], channels: usize) {
        while let Ok(command) = self.commands.pop() {
            match command {
                Command::Play {
                    id,
                    sound,
                    gain,
                    pitch,
                    looping,
                } => {
                    if self.voices.len() == MAX_VOICES {
                        match self.voices.iter().position(|v| !v.looping) {
                            Some(oldest) => {
                                self.voices.remove(oldest);
                            }
                            None => continue, // all voices are music loops: drop the effect
                        }
                    }
                    let step = sound.rate as f64 / self.output_rate as f64 * pitch as f64;
                    self.voices.push(Voice {
                        id,
                        sound,
                        position: 0.0,
                        step,
                        gain,
                        looping,
                        paused: false,
                    });
                }
                Command::Stop(id) => self.voices.retain(|v| v.id != id),
                Command::StopAll => self.voices.clear(),
                Command::Update(id, change) => {
                    if let Some(voice) = self.voices.iter_mut().find(|voice| voice.id == id) {
                        match change {
                            VoiceChange::Paused(paused) => voice.paused = paused,
                            VoiceChange::Seek(seconds) => {
                                voice.position = (seconds * f64::from(voice.sound.rate)).min(voice.sound.frames.len() as f64);
                            }
                            VoiceChange::Mix(gain) => voice.gain = gain,
                        }
                    }
                }
            }
        }

        out.fill(0.0);
        let channels = channels.max(1);
        for voice in &mut self.voices {
            if voice.paused {
                continue;
            }
            let frames = &voice.sound.frames;
            let len = frames.len();
            for frame in out.chunks_exact_mut(channels) {
                if voice.position >= len as f64 {
                    if !voice.looping {
                        break;
                    }
                    voice.position %= len as f64; // a step can be longer than a short sound
                }
                let i = voice.position as usize;
                let t = (voice.position - i as f64) as f32;
                let next = if i + 1 < len {
                    i + 1
                } else if voice.looping {
                    0
                } else {
                    i
                };
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

        let volume = if self.muted.load(Ordering::Relaxed) {
            0.0
        } else {
            f32::from_bits(self.volume.load(Ordering::Relaxed))
        };
        for s in out.iter_mut() {
            *s = soft_clip(*s * volume);
        }
    }

    pub fn active_voices(&self) -> usize {
        self.voices.len()
    }

    /// The device's rate after the output stream was opened again (a new route); voices started
    /// from here on step at it.
    #[cfg_attr(any(test, target_arch = "wasm32"), allow(dead_code))]
    pub(super) fn set_output_rate(&mut self, rate: u32) {
        if rate > 0 {
            self.output_rate = rate;
        }
    }
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
pub(super) fn pan_gains(volume: f32, pan: f32) -> [f32; 2] {
    let angle = (pan.clamp(-1.0, 1.0) + 1.0) * std::f32::consts::FRAC_PI_4;
    [
        angle.cos() * volume * std::f32::consts::SQRT_2,
        angle.sin() * volume * std::f32::consts::SQRT_2,
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    fn wav(samples: &[i16], channels: u16, rate: u32) -> Vec<u8> {
        let mut out = Cursor::new(Vec::new());
        let spec = hound::WavSpec {
            channels,
            sample_rate: rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
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
        p.push(Command::Play {
            id,
            sound: sound.clone(),
            gain,
            pitch,
            looping,
        })
        .ok()
        .unwrap();
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
        let sound = Arc::new(Sound {
            frames: vec![[0.5, 0.5]; 4],
            rate: 48_000,
        });
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
        let sound = Arc::new(Sound {
            frames: vec![[0.5, 0.5]; 4],
            rate: 24_000,
        }); // half the output rate
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
    fn live_voice_updates_preserve_position_while_paused_and_stop_all_clears_loops() {
        let (mut p, mut m) = mixer();
        let sound = Arc::new(Sound {
            frames: vec![[0.2, 0.2], [0.4, 0.4], [0.6, 0.6]],
            rate: 48_000,
        });
        play(&mut p, 1, &sound, 1.0, true);
        let mut out = [0.; 2];
        m.render(&mut out, 2);
        assert!((out[0] - 0.2).abs() < 1e-5);
        p.push(Command::Update(1, VoiceChange::Paused(true))).ok().unwrap();
        m.render(&mut out, 2);
        assert_eq!(out, [0., 0.]);
        assert_eq!(m.voices[0].position, 1.);
        p.push(Command::Update(1, VoiceChange::Seek(2. / 48_000.))).ok().unwrap();
        p.push(Command::Update(1, VoiceChange::Mix(pan_gains(0.5, -1.)))).ok().unwrap();
        p.push(Command::Update(1, VoiceChange::Paused(false))).ok().unwrap();
        m.render(&mut out, 2);
        assert!((out[0] - 0.6 * pan_gains(0.5, -1.)[0]).abs() < 1e-5);
        assert_eq!(out[1], 0.);
        p.push(Command::StopAll).ok().unwrap();
        m.render(&mut out, 2);
        assert_eq!(out, [0., 0.]);
        assert_eq!(m.active_voices(), 0);
    }

    #[test]
    fn loops_sounds_shorter_than_one_step() {
        let (mut p, mut m) = mixer();
        // 2 frames at 4x the output rate, pitched up 4x: each output frame steps 16 frames.
        let tiny = Arc::new(Sound {
            frames: vec![[0.5, 0.5]; 2],
            rate: 192_000,
        });
        play(&mut p, 1, &tiny, 4.0, true);
        let mut out = [0.0f32; 16];
        m.render(&mut out, 2);
        assert!(out.iter().all(|&s| s > 0.3), "{out:?}");
        assert_eq!(m.active_voices(), 1);
    }

    #[test]
    fn non_finite_float_samples_are_silenced() {
        let mut out = Cursor::new(Vec::new());
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate: 48_000,
            bits_per_sample: 32,
            sample_format: hound::SampleFormat::Float,
        };
        let mut w = hound::WavWriter::new(&mut out, spec).unwrap();
        for s in [0.5, f32::NAN, f32::INFINITY] {
            w.write_sample(s).unwrap();
        }
        w.finalize().unwrap();
        let sound = Sound::from_wav(&out.into_inner()).unwrap();
        assert_eq!(sound.frames, vec![[0.5, 0.5], [0.0, 0.0], [0.0, 0.0]]);
    }

    #[test]
    fn steals_the_oldest_effect_when_full_but_keeps_music() {
        let (p, c) = rtrb::RingBuffer::new(MAX_VOICES * 2 + 4);
        let mut p = p;
        let mut m = Mixer::new(c, 48_000, Arc::new(AtomicU32::new(1.0f32.to_bits())), Arc::new(AtomicBool::new(false)));
        let long = Arc::new(Sound {
            frames: vec![[0.1, 0.1]; 48_000],
            rate: 48_000,
        });
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
        let loud = Arc::new(Sound {
            frames: vec![[1.0, 1.0]; 64],
            rate: 48_000,
        });
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
