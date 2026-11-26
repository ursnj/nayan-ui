use super::mixer::Sound;
use std::io::{Cursor, ErrorKind};
use symphonia::core::{
    audio::SampleBuffer,
    codecs::{CODEC_TYPE_NULL, DecoderOptions},
    errors::Error,
    formats::FormatOptions,
    io::{MediaSourceStream, MediaSourceStreamOptions},
    meta::MetadataOptions,
    probe::Hint,
};

pub(super) const MAX_INPUT: usize = 64 * 1024 * 1024;
pub(super) const MAX_FRAMES: usize = (MAX_INPUT - 44) / 4;
pub(super) const MAX_RATE: u32 = 384_000;

pub(super) fn decode(bytes: &[u8]) -> Option<Sound> {
    if bytes.is_empty() || bytes.len() > MAX_INPUT {
        return None;
    }
    if bytes.get(..4) == Some(b"RIFF") && bytes.get(8..12) == Some(b"WAVE") {
        return Sound::from_wav(bytes);
    }
    let stream = MediaSourceStream::new(Box::new(Cursor::new(bytes.to_vec())), MediaSourceStreamOptions::default());
    let mut reader = symphonia::default::get_probe()
        .format(
            &Hint::new(),
            stream,
            &FormatOptions {
                enable_gapless: true,
                ..Default::default()
            },
            &MetadataOptions::default(),
        )
        .ok()?
        .format;
    let track = reader.default_track().filter(|track| track.codec_params.codec != CODEC_TYPE_NULL)?;
    let track_id = track.id;
    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &DecoderOptions::default())
        .ok()?;
    let mut frames = Vec::new();
    let mut rate = 0;
    let mut buffer = None::<SampleBuffer<f32>>;
    loop {
        let packet = match reader.next_packet() {
            Ok(packet) => packet,
            Err(Error::IoError(error)) if error.kind() == ErrorKind::UnexpectedEof => break,
            Err(_) => return None,
        };
        if packet.track_id() != track_id {
            continue;
        }
        let decoded = decoder.decode(&packet).ok()?;
        let spec = *decoded.spec();
        let channels = spec.channels.count();
        if !(1..=2).contains(&channels) || !(1..=MAX_RATE).contains(&spec.rate) || (rate != 0 && rate != spec.rate) {
            return None;
        }
        if decoded.frames() > MAX_FRAMES - frames.len() || decoded.capacity() > MAX_FRAMES {
            return None;
        }
        rate = spec.rate;
        if buffer.as_ref().is_none_or(|buffer| buffer.capacity() < decoded.capacity() * channels) {
            buffer = Some(SampleBuffer::new(decoded.capacity() as u64, spec));
        }
        let buffer = buffer.as_mut()?;
        buffer.copy_interleaved_ref(decoded);
        frames.extend(buffer.samples().chunks_exact(channels).map(|samples| {
            let clean = |v: f32| if v.is_finite() { v.clamp(-1.0, 1.0) } else { 0.0 };
            [clean(samples[0]), clean(samples[channels - 1])]
        }));
    }
    Sound::from_frames(frames, rate)
}
