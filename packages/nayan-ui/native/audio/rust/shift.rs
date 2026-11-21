//! Offline pitch and tempo changes for a recorded sound (a talking pet's voice): the pitch goes up
//! without the words racing, which playing a recording faster (`audio.play`'s `pitch`) can't do.
//!
//! Two steps, both on whole buffers (never on the audio thread):
//! 1. WSOLA time stretching by `pitch / tempo`: Hann-windowed 32 ms grains overlap by half, each one
//!    taken within ±10 ms of its nominal place where it best continues the last (normalised
//!    cross-correlation), so pitch periods line up and the voice keeps its tone.
//! 2. Resampling by `pitch` through a windowed-sinc low-pass at the new Nyquist frequency, so
//!    nothing above it folds back into the audible band as hiss or a metallic edge.
//!
//! The result lasts `1 / tempo` as long and sounds `pitch` times higher. For a voice taken from a
//! microphone, `clean` first removes rumble (a 100 Hz high-pass) and turns the room down between
//! words (a gentle noise gate), and `loudness` levels the speech itself (its average, not one
//! peak) with a soft limiter over the loudest syllables, so quiet and loud takes play alike and
//! clearly. Dependency-free and deterministic (tested without a device).

/// Grain length and search tolerance, seconds.
const GRAIN_SECONDS: f32 = 0.032;
const TOLERANCE_SECONDS: f32 = 0.010;
/// Correlations are measured at about this rate (then refined at full rate around the best match).
const SEARCH_RATE: f32 = 8000.0;
/// Levelling never amplifies more than this (+30 dB: a far-off voice comes up, silence stays quiet).
const MAX_GAIN: f32 = 31.6;
/// The limiter: transparent below the knee, easing towards the ceiling above it.
const LIMIT_KNEE: f32 = 0.6;
const LIMIT_CEILING: f32 = 0.97;
/// Rumble below this goes (handling noise, traffic, the table the phone lies on).
const HIGH_PASS_HZ: f32 = 100.0;
/// The gate: loudness measured every 10 ms; below its threshold the sound is turned down (by as much
/// again as it's below, at most this far), held open a moment after speech and eased in and out.
const GATE_WINDOW_SECONDS: f32 = 0.010;
const GATE_FLOOR: f32 = 0.15;
const GATE_HOLD_SECONDS: f32 = 0.06;
const GATE_RELEASE_SECONDS: f32 = 0.08;
/// Fade at each end, seconds (no click where the sound starts and stops).
const FADE_SECONDS: f32 = 0.005;

/// Sensible limits: a talking voice, not a special effect generator.
pub const MIN_FACTOR: f32 = 0.25;
pub const MAX_FACTOR: f32 = 4.0;

/// `frames` (stereo, at `rate`) `pitch` times higher and `tempo` times faster. With `clean`, rumble
/// and the room between words are turned down first; with `loudness` > 0 the speech's average level
/// (RMS) is brought to it (at most 30 dB louder) under a soft limiter. None for empty input or
/// factors outside 0.25..4.
pub fn shift(frames: &[[f32; 2]], rate: u32, pitch: f32, tempo: f32, loudness: f32, clean: bool) -> Option<Vec<[f32; 2]>> {
    let valid = |f: f32| f.is_finite() && (MIN_FACTOR..=MAX_FACTOR).contains(&f);
    if frames.is_empty() || rate == 0 || !valid(pitch) || !valid(tempo) || !loudness.is_finite() {
        return None;
    }
    let mut left: Vec<f32> = frames.iter().map(|f| f[0]).collect();
    let mono = frames.iter().all(|f| f[0] == f[1]);
    let mut right: Vec<f32> = if mono { Vec::new() } else { frames.iter().map(|f| f[1]).collect() };
    if clean {
        high_pass(&mut left, rate);
        if !mono {
            high_pass(&mut right, rate);
        }
    }
    let mid: Vec<f32> = if mono {
        left.clone()
    } else {
        left.iter().zip(&right).map(|(a, b)| (a + b) * 0.5).collect()
    };
    if clean {
        let gains = gate(&mid, rate);
        apply(&mut left, &gains);
        if !mono {
            apply(&mut right, &gains);
        }
    }

    // 1. Stretch by pitch / tempo (both channels follow the grains chosen on their mid signal)
    let stretch = pitch / tempo;
    let starts = grain_starts(&mid, rate, stretch);
    let grain = grain_len(rate);
    let mut l = overlap_add(&left, &starts, grain);
    let mut r = if mono { Vec::new() } else { overlap_add(&right, &starts, grain) };
    // 2. Resample by pitch, band-limited when it goes up
    l = resample(&l, pitch);
    if !mono {
        r = resample(&r, pitch);
    }
    let target = ((frames.len() as f64 / tempo as f64).round() as usize).max(1);
    l.resize(target, 0.0);
    if !mono {
        r.resize(target, 0.0);
    }

    let mut out: Vec<[f32; 2]> = if mono {
        l.iter().map(|&s| [s, s]).collect()
    } else {
        l.iter().zip(&r).map(|(&a, &b)| [a, b]).collect()
    };
    level(&mut out, rate, loudness);
    fade(&mut out, rate);
    Some(out)
}

fn grain_len(rate: u32) -> usize {
    // Even, so half a grain is a whole number of samples
    (((rate as f32 * GRAIN_SECONDS) as usize) & !1).max(4)
}

/// Where each grain of the stretched signal is read from. Grain `k` is written at `k * half` and
/// read near `(k - 1) * half / stretch` (the output starts half a grain in, see `overlap_add`), moved
/// within the tolerance to where it best continues the previous grain's natural continuation.
fn grain_starts(signal: &[f32], rate: u32, stretch: f32) -> Vec<isize> {
    let grain = grain_len(rate);
    let half = grain / 2;
    let tolerance = (rate as f32 * TOLERANCE_SECONDS) as isize;
    let step = ((rate as f32 / SEARCH_RATE).round() as usize).max(1);
    let read_hop = half as f64 / stretch as f64;
    let count = (signal.len() as f64 * stretch as f64 / half as f64).ceil() as usize + 3;
    let mut starts = Vec::with_capacity(count);
    let mut previous: isize = 0;
    for k in 0..count {
        let nominal = ((k as f64 - 1.0) * read_hop).round() as isize;
        let start = if k == 0 {
            nominal
        } else {
            // The previous grain, continued: what would have followed it in the input
            let natural = previous + half as isize;
            best_match(signal, natural, nominal, tolerance, grain, step)
        };
        starts.push(start);
        previous = start;
    }
    starts
}

/// The offset within `nominal ± tolerance` whose grain best matches the one at `natural`: a coarse
/// search every `step` samples, then every sample around the best.
fn best_match(signal: &[f32], natural: isize, nominal: isize, tolerance: isize, grain: usize, step: usize) -> isize {
    let score = |candidate: isize, stride: usize| {
        let (mut dot, mut energy) = (0.0f32, 0.0f32);
        let mut i = 0;
        while i < grain {
            let a = sample(signal, natural + i as isize);
            let b = sample(signal, candidate + i as isize);
            dot += a * b;
            energy += b * b;
            i += stride;
        }
        if energy > 1e-9 { dot / energy.sqrt() } else { 0.0 }
    };
    let mut best = nominal;
    let mut best_score = f32::NEG_INFINITY;
    let mut delta = -tolerance;
    while delta <= tolerance {
        let s = score(nominal + delta, step);
        if s > best_score {
            best_score = s;
            best = nominal + delta;
        }
        delta += step as isize;
    }
    let coarse = best;
    for candidate in coarse - step as isize..=coarse + step as isize {
        if candidate == coarse || (candidate - nominal).abs() > tolerance {
            continue;
        }
        let s = score(candidate, step);
        if s > best_score {
            best_score = s;
            best = candidate;
        }
    }
    best
}

fn sample(signal: &[f32], i: isize) -> f32 {
    if i < 0 { 0.0 } else { signal.get(i as usize).copied().unwrap_or(0.0) }
}

/// Hann-windowed grains read at `starts`, written every half grain. A periodic Hann at 50% overlap
/// sums to one, so the level is unchanged; the first half grain (covered by one window only) is
/// dropped, which is why grain 0 reads from half a grain before the start.
fn overlap_add(signal: &[f32], starts: &[isize], grain: usize) -> Vec<f32> {
    let half = grain / 2;
    let mut out = vec![0.0f32; starts.len() * half + grain];
    let window: Vec<f32> = (0..grain)
        .map(|n| 0.5 - 0.5 * (std::f32::consts::TAU * n as f32 / grain as f32).cos())
        .collect();
    for (k, &start) in starts.iter().enumerate() {
        let at = k * half;
        for (n, w) in window.iter().enumerate() {
            out[at + n] += w * sample(signal, start + n as isize);
        }
    }
    out.drain(..half);
    out
}

/// `signal` played `factor` times faster: band-limited to the new Nyquist frequency when it rises,
/// then read with linear interpolation (accurate once the band is limited).
fn resample(signal: &[f32], factor: f32) -> Vec<f32> {
    if (factor - 1.0).abs() < 1e-6 {
        return signal.to_vec();
    }
    let filtered = if factor > 1.0 {
        low_pass(signal, 0.5 / factor * 0.92)
    } else {
        signal.to_vec()
    };
    let len = (signal.len() as f64 / factor as f64).floor() as usize;
    (0..len)
        .map(|j| {
            let x = j as f64 * factor as f64;
            let i = x as usize;
            let t = (x - i as f64) as f32;
            let a = filtered.get(i).copied().unwrap_or(0.0);
            let b = filtered.get(i + 1).copied().unwrap_or(a);
            a + (b - a) * t
        })
        .collect()
}

/// A windowed-sinc (Blackman) low-pass at `cutoff` cycles per sample.
fn low_pass(signal: &[f32], cutoff: f32) -> Vec<f32> {
    const HALF: isize = 32;
    let taps: Vec<f32> = (-HALF..=HALF)
        .map(|n| {
            let x = n as f32;
            let sinc = if n == 0 {
                2.0 * cutoff
            } else {
                (std::f32::consts::TAU * cutoff * x).sin() / (std::f32::consts::PI * x)
            };
            let m = (n + HALF) as f32 / (2 * HALF) as f32;
            let blackman = 0.42 - 0.5 * (std::f32::consts::TAU * m).cos() + 0.08 * (2.0 * std::f32::consts::TAU * m).cos();
            sinc * blackman
        })
        .collect();
    let gain: f32 = taps.iter().sum();
    (0..signal.len() as isize)
        .map(|i| {
            let mut acc = 0.0f32;
            for (k, tap) in taps.iter().enumerate() {
                acc += tap * sample(signal, i + k as isize - HALF);
            }
            acc / gain
        })
        .collect()
}

/// A second-order Butterworth high-pass at `HIGH_PASS_HZ`, in place.
fn high_pass(signal: &mut [f32], rate: u32) {
    let w = std::f32::consts::TAU * HIGH_PASS_HZ / rate as f32;
    let (sin, cos) = w.sin_cos();
    let alpha = sin / std::f32::consts::SQRT_2; // Q = 1/sqrt(2)
    let a0 = 1.0 + alpha;
    let (b0, b1, b2) = ((1.0 + cos) / 2.0 / a0, -(1.0 + cos) / a0, (1.0 + cos) / 2.0 / a0);
    let (a1, a2) = (-2.0 * cos / a0, (1.0 - alpha) / a0);
    let (mut x1, mut x2, mut y1, mut y2) = (0.0f32, 0.0f32, 0.0f32, 0.0f32);
    for s in signal.iter_mut() {
        let x = *s;
        let y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        (x2, x1, y2, y1) = (x1, x, y1, y);
        *s = y;
    }
}

/// RMS of each `window`-sample block.
fn window_rms(signal: &[f32], window: usize) -> Vec<f32> {
    signal
        .chunks(window.max(1))
        .map(|c| (c.iter().map(|s| s * s).sum::<f32>() / c.len() as f32).sqrt())
        .collect()
}

/// The value `fraction` of the way up the sorted `values`.
fn percentile(values: &[f32], fraction: f32) -> f32 {
    let mut sorted = values.to_vec();
    sorted.sort_by(f32::total_cmp);
    sorted.get(((sorted.len() - 1) as f32 * fraction) as usize).copied().unwrap_or(0.0)
}

/// Per-sample gains that turn the room down between words: the threshold sits halfway (in dB)
/// between the take's quiet floor and its speech; below it the level falls twice as fast (down to
/// `GATE_FLOOR`), held open after speech and eased in quickly and out slowly. All ones when the
/// take has no clear speech above its noise.
fn gate(signal: &[f32], rate: u32) -> Vec<f32> {
    let window = ((rate as f32 * GATE_WINDOW_SECONDS) as usize).max(1);
    let rms = window_rms(signal, window);
    let (floor, speech) = (percentile(&rms, 0.15), percentile(&rms, 0.95));
    if rms.is_empty() || speech < 1e-5 || speech < floor * 4.0 {
        return vec![1.0; signal.len()];
    }
    let threshold = (floor.max(1e-6) * speech).sqrt();
    let hold = (GATE_HOLD_SECONDS / GATE_WINDOW_SECONDS).ceil() as usize;
    let release = (-GATE_WINDOW_SECONDS / GATE_RELEASE_SECONDS).exp();
    let mut gains = Vec::with_capacity(rms.len());
    let (mut gain, mut held) = (1.0f32, 0usize);
    for &r in &rms {
        let target = if r >= threshold {
            held = hold;
            1.0
        } else if held > 0 {
            held -= 1;
            1.0
        } else {
            (r / threshold).clamp(GATE_FLOOR, 1.0)
        };
        // Open at once (no clipped first syllable), close gradually
        gain = if target > gain { target } else { target + (gain - target) * release };
        gains.push(gain);
    }
    // Interpolate between window centres, so the gain never steps
    (0..signal.len())
        .map(|i| {
            let x = (i as f32 + 0.5) / window as f32 - 0.5;
            let k = x.floor().max(0.0) as usize;
            let t = (x - k as f32).clamp(0.0, 1.0);
            let a = gains[k.min(gains.len() - 1)];
            let b = gains[(k + 1).min(gains.len() - 1)];
            a + (b - a) * t
        })
        .collect()
}

fn apply(signal: &mut [f32], gains: &[f32]) {
    for (s, g) in signal.iter_mut().zip(gains) {
        *s *= g;
    }
}

/// Brings the speech's average loudness (RMS over the 20 ms blocks that carry it) to `target`, at
/// most `MAX_GAIN` louder, then eases anything above the limiter's knee towards its ceiling.
fn level(frames: &mut [[f32; 2]], rate: u32, target: f32) {
    if target > 0.0 {
        let mid: Vec<f32> = frames.iter().map(|f| (f[0] + f[1]) * 0.5).collect();
        let rms = window_rms(&mid, ((rate as f32 * 0.02) as usize).max(1));
        let loud = percentile(&rms, 0.95);
        let speaking: Vec<f32> = rms.iter().copied().filter(|&r| r > loud * 0.2).collect();
        if !speaking.is_empty() && loud > 1e-6 {
            let level = (speaking.iter().map(|r| r * r).sum::<f32>() / speaking.len() as f32).sqrt();
            let gain = (target / level).min(MAX_GAIN);
            for f in frames.iter_mut() {
                for s in f.iter_mut() {
                    *s *= gain;
                }
            }
        }
    }
    for f in frames.iter_mut() {
        for s in f.iter_mut() {
            *s = limit(*s);
        }
    }
}

/// Transparent up to the knee; above it, eases towards the ceiling so loud syllables never clip.
fn limit(x: f32) -> f32 {
    let a = x.abs();
    if !a.is_finite() {
        return 0.0;
    }
    if a <= LIMIT_KNEE {
        x
    } else {
        let room = LIMIT_CEILING - LIMIT_KNEE;
        x.signum() * (LIMIT_KNEE + room * ((a - LIMIT_KNEE) / room).tanh())
    }
}

fn fade(frames: &mut [[f32; 2]], rate: u32) {
    let len = frames.len();
    let n = ((rate as f32 * FADE_SECONDS) as usize).clamp(1, len.div_ceil(2));
    for i in 0..n {
        let g = i as f32 / n as f32;
        for s in frames[i].iter_mut() {
            *s *= g;
        }
        for s in frames[len - 1 - i].iter_mut() {
            *s *= g;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const RATE: u32 = 48_000;

    fn tone(freq: f32, seconds: f32, amplitude: f32) -> Vec<[f32; 2]> {
        (0..(RATE as f32 * seconds) as usize)
            .map(|i| {
                let s = amplitude * (std::f32::consts::TAU * freq * i as f32 / RATE as f32).sin();
                [s, s]
            })
            .collect()
    }

    /// Frequency from zero crossings over the middle half (away from the fades).
    fn frequency(frames: &[[f32; 2]]) -> f32 {
        let (a, b) = (frames.len() / 4, frames.len() * 3 / 4);
        let crossings = frames[a..b].windows(2).filter(|w| (w[0][0] < 0.0) != (w[1][0] < 0.0)).count();
        crossings as f32 / 2.0 / ((b - a) as f32 / RATE as f32)
    }

    fn rms(frames: &[[f32; 2]]) -> f32 {
        let (a, b) = (frames.len() / 4, frames.len() * 3 / 4);
        (frames[a..b].iter().map(|f| f[0] * f[0]).sum::<f32>() / (b - a) as f32).sqrt()
    }

    #[test]
    fn raises_the_pitch_and_keeps_or_sets_the_length() {
        let input = tone(220.0, 1.0, 0.5);
        for (pitch, tempo) in [(1.0, 1.0), (1.6, 1.0), (1.6, 1.15), (2.0, 1.3), (0.8, 1.0)] {
            let out = shift(&input, RATE, pitch, tempo, 0.0, false).unwrap();
            let expected = (input.len() as f32 / tempo).round() as usize;
            assert_eq!(out.len(), expected, "pitch {pitch} tempo {tempo}");
            let f = frequency(&out);
            assert!((f / (220.0 * pitch) - 1.0).abs() < 0.03, "pitch {pitch} tempo {tempo}: {f} Hz");
            // The level holds through the stretch (no gaps or doubled grains)
            let level = rms(&out);
            assert!((level / rms(&input) - 1.0).abs() < 0.12, "pitch {pitch} tempo {tempo}: rms {level}");
        }
    }

    #[test]
    fn nothing_above_the_new_nyquist_folds_back() {
        // 15 kHz pitched up 2x would be 30 kHz, above 24 kHz: it must vanish, not fold to 18 kHz
        let out = shift(&tone(15_000.0, 0.5, 0.5), RATE, 2.0, 1.0, 0.0, false).unwrap();
        assert!(rms(&out) < 0.02, "aliased energy {}", rms(&out));
        // Speech-range content passes
        let voice = shift(&tone(3_000.0, 0.5, 0.5), RATE, 2.0, 1.0, 0.0, false).unwrap();
        assert!(rms(&voice) > 0.3, "{}", rms(&voice));
    }

    #[test]
    fn levels_the_speech_loudness_under_a_limiter_without_boosting_silence_into_hiss() {
        // A quiet voice comes up to the target loudness
        let out = shift(&tone(300.0, 0.5, 0.05), RATE, 1.5, 1.1, 0.2, false).unwrap();
        assert!((rms(&out) - 0.2).abs() < 0.01, "{}", rms(&out));
        // A loud one is eased under the ceiling rather than clipped
        let hot = shift(&tone(300.0, 0.5, 0.9), RATE, 1.5, 1.1, 0.5, false).unwrap();
        let loudest = hot.iter().fold(0.0f32, |m, f| m.max(f[0].abs()));
        assert!(loudest <= LIMIT_CEILING && loudest > LIMIT_KNEE, "{loudest}");
        // Near silence rises at most 30 dB
        let hum = shift(&tone(300.0, 0.5, 0.0005), RATE, 1.5, 1.1, 0.2, false).unwrap();
        assert!(rms(&hum) <= 0.0005 * 0.7072 * MAX_GAIN * 1.05, "{}", rms(&hum));
    }

    #[test]
    fn cleaning_removes_rumble_and_turns_the_room_down_between_words() {
        // Rumble at 30 Hz under a 400 Hz voice: the rumble goes, the voice stays
        let mixed: Vec<[f32; 2]> = tone(30.0, 1.0, 0.3)
            .iter()
            .zip(tone(400.0, 1.0, 0.3))
            .map(|(a, b)| [a[0] + b[0], a[0] + b[0]])
            .collect();
        let out = shift(&mixed, RATE, 1.0, 1.0, 0.0, true).unwrap();
        let voice_only = shift(&tone(400.0, 1.0, 0.3), RATE, 1.0, 1.0, 0.0, true).unwrap();
        let rumble = (rms(&out) - rms(&voice_only)).abs();
        assert!(rumble < 0.03, "rumble left {rumble}");
        // Words (loud bursts) with faint room noise between them
        let mut take = Vec::new();
        for burst in 0..4 {
            let word = tone(300.0 + burst as f32 * 50.0, 0.25, 0.4);
            take.extend(word);
            take.extend((0..(RATE as f32 * 0.3) as usize).map(|i| {
                let n = 0.01 * ((i as f32 * 12.9898).sin() * 43758.547).fract();
                [n, n]
            }));
        }
        let cleaned = shift(&take, RATE, 1.0, 1.0, 0.0, true).unwrap();
        let raw = shift(&take, RATE, 1.0, 1.0, 0.0, false).unwrap();
        let gap = |f: &[[f32; 2]]| {
            let (a, b) = ((RATE as f32 * 0.42) as usize, (RATE as f32 * 0.52) as usize);
            (f[a..b].iter().map(|x| x[0] * x[0]).sum::<f32>() / (b - a) as f32).sqrt()
        };
        let word = |f: &[[f32; 2]]| {
            let (a, b) = ((RATE as f32 * 0.05) as usize, (RATE as f32 * 0.2) as usize);
            (f[a..b].iter().map(|x| x[0] * x[0]).sum::<f32>() / (b - a) as f32).sqrt()
        };
        assert!(gap(&cleaned) < gap(&raw) * 0.35, "room {} vs {}", gap(&cleaned), gap(&raw));
        assert!(word(&cleaned) > word(&raw) * 0.95, "word {} vs {}", word(&cleaned), word(&raw));
    }

    #[test]
    fn stereo_channels_stay_apart_and_bad_factors_are_refused() {
        let input: Vec<[f32; 2]> = tone(200.0, 0.4, 0.5).iter().map(|f| [f[0], 0.0]).collect();
        let out = shift(&input, RATE, 1.5, 1.0, 0.0, false).unwrap();
        assert!(rms(&out) > 0.2 && out.iter().all(|f| f[1] == 0.0));
        assert!(shift(&input, RATE, 0.0, 1.0, 0.0, false).is_none());
        assert!(shift(&input, RATE, 1.5, f32::NAN, 0.0, false).is_none());
        assert!(shift(&input, RATE, 5.0, 1.0, 0.0, false).is_none());
        assert!(shift(&[], RATE, 1.5, 1.0, 0.0, false).is_none());
    }
}
