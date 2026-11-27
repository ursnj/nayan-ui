//! Device output through cpal, on a dedicated thread that owns the stream.

use super::mixer::{Command, Mixer};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, SampleFormat, SizedSample, StreamConfig};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread::Thread;

/// The output thread, and whether it should reopen its stream (a new audio route).
static OUTPUT: OnceLock<Thread> = OnceLock::new();
static REOPEN: AtomicBool = AtomicBool::new(false);
#[cfg(target_os = "ios")]
static OPEN_FAILED: AtomicBool = AtomicBool::new(false);

/// Opens the default output on a dedicated thread that owns the stream for the app's lifetime
/// (cpal streams aren't `Send` on every platform), reopening it when `restart` asks. Failures
/// leave audio silent, never crash.
pub fn start(consumer: rtrb::Consumer<Command>, volume: Arc<AtomicU32>, muted: Arc<AtomicBool>, running: Arc<AtomicBool>) {
    let spawned = std::thread::Builder::new().name("engine-audio".into()).spawn(move || {
        #[cfg(target_os = "ios")]
        ios::configure_session();
        // cpal's AAudio backend needs the Android context; without it, stay silent rather than panic.
        #[cfg(target_os = "android")]
        if !crate::android::is_initialized() {
            return;
        }
        // The mixer outlives each stream: voices carry on across a reopen.
        let mixer = Arc::new(Mutex::new(Mixer::new(consumer, 48_000, volume, muted)));
        loop {
            let stream = open(&mixer);
            running.store(stream.is_some(), Ordering::Relaxed);
            #[cfg(target_os = "ios")]
            OPEN_FAILED.store(stream.is_none(), Ordering::Relaxed);
            while !REOPEN.swap(false, Ordering::Relaxed) {
                std::thread::park(); // keep `stream` alive
            }
            drop(stream);
        }
    });
    if let Ok(handle) = spawned {
        let _ = OUTPUT.set(handle.thread().clone());
    }
}

/// Reopens the output on the current route after a session change.
#[cfg_attr(not(target_os = "ios"), allow(dead_code))]
pub fn restart() {
    if let Some(thread) = OUTPUT.get() {
        REOPEN.store(true, Ordering::Relaxed);
        thread.unpark();
    }
}

/// A foreground app or a new playback request can recover from an unavailable audio route.
#[cfg(target_os = "ios")]
pub fn retry_failed_open() {
    if OPEN_FAILED.load(Ordering::Relaxed) {
        restart();
    }
}

fn open(mixer: &Arc<Mutex<Mixer>>) -> Option<cpal::Stream> {
    // Read the hardware format only after iOS has activated the current session and route.
    #[cfg(target_os = "ios")]
    if !ios::activate_session() {
        return None;
    }
    let device = cpal::default_host().default_output_device()?;
    let supported = device.default_output_config().ok()?;
    let format = supported.sample_format();
    let config: StreamConfig = supported.into();
    if let Ok(mut m) = mixer.lock() {
        m.set_output_rate(config.sample_rate);
    }
    let stream = match format {
        SampleFormat::F32 => build::<f32>(&device, config, mixer.clone()),
        SampleFormat::I16 => build::<i16>(&device, config, mixer.clone()),
        SampleFormat::I32 => build::<i32>(&device, config, mixer.clone()),
        SampleFormat::U16 => build::<u16>(&device, config, mixer.clone()),
        _ => None,
    }?;
    stream.play().ok()?;
    Some(stream)
}

fn build<T: SizedSample + FromSample<f32>>(device: &cpal::Device, config: StreamConfig, mixer: Arc<Mutex<Mixer>>) -> Option<cpal::Stream> {
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
                // Only one stream renders at a time; never block the audio thread on a reopen.
                match mixer.try_lock() {
                    Ok(mut mixer) => mixer.render(mix, channels),
                    Err(_) => mix.fill(0.0),
                }
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

    pub fn activate_session() -> bool {
        // SAFETY: the audio session is a process-wide singleton.
        unsafe { AVAudioSession::sharedInstance().setActive_error(true).is_ok() }
    }
}
