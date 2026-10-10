//! Device output through cpal, on a dedicated thread that owns the stream.

use super::mixer::{Command, Mixer};
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
        ios::configure_session();
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
