//! The device's microphone through cpal (CoreAudio on iOS, AAudio on Android), on a dedicated thread
//! that owns the input stream while listening (cpal streams aren't `Send` on every platform). Each
//! block is mixed to mono and handed to the capture buffer. On iOS the audio session switches to
//! play-and-record (to the speaker, mixing with other apps) while listening and back to ambient
//! after, and the output stream reopens on each new route. Failures set MIC_FAILED, never crash.

use super::{MIC_FAILED, MIC_LISTENING, MIC_STARTING, mic_push, mic_set_state};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, SampleFormat, SizedSample, StreamConfig};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::Duration;

/// The listening thread and the flag that ends it.
static LISTENER: Mutex<Option<(JoinHandle<()>, Arc<AtomicBool>)>> = Mutex::new(None);

/// Opens the default input on a new thread (closing any previous one first).
pub fn start() -> bool {
    stop();
    mic_set_state(MIC_STARTING);
    let done = Arc::new(AtomicBool::new(false));
    let flag = done.clone();
    match std::thread::Builder::new().name("engine-mic".into()).spawn(move || listen(flag)) {
        Ok(handle) => {
            if let Ok(mut listener) = LISTENER.lock() {
                *listener = Some((handle, done));
            }
            true
        }
        Err(_) => {
            mic_set_state(MIC_FAILED);
            false
        }
    }
}

/// Closes the input and waits for its thread (a few milliseconds).
pub fn stop() {
    let listener = LISTENER.lock().ok().and_then(|mut l| l.take());
    if let Some((handle, done)) = listener {
        done.store(true, Ordering::Relaxed);
        handle.thread().unpark();
        let _ = handle.join();
    }
}

fn listen(done: Arc<AtomicBool>) {
    #[cfg(target_os = "ios")]
    ios::record_session(true);
    match open().filter(|stream| stream.play().is_ok()) {
        Some(stream) => {
            mic_set_state(MIC_LISTENING);
            while !done.load(Ordering::Relaxed) {
                std::thread::park_timeout(Duration::from_millis(250));
            }
            drop(stream);
        }
        None if !done.load(Ordering::Relaxed) => mic_set_state(MIC_FAILED),
        None => {}
    }
    #[cfg(target_os = "ios")]
    ios::record_session(false);
}

fn open() -> Option<cpal::Stream> {
    // cpal's AAudio backend needs the Android context; without it, fail rather than panic.
    #[cfg(target_os = "android")]
    if !crate::android::is_initialized() {
        return None;
    }
    let device = cpal::default_host().default_input_device()?;
    let supported = device.default_input_config().ok()?;
    let format = supported.sample_format();
    let config: StreamConfig = supported.into();
    match format {
        SampleFormat::F32 => build::<f32>(&device, config),
        SampleFormat::I16 => build::<i16>(&device, config),
        SampleFormat::I32 => build::<i32>(&device, config),
        SampleFormat::U16 => build::<u16>(&device, config),
        _ => None,
    }
}

fn build<T: SizedSample>(device: &cpal::Device, config: StreamConfig) -> Option<cpal::Stream>
where
    f32: FromSample<T>,
{
    let channels = (config.channels as usize).max(1);
    let rate = config.sample_rate;
    let mut mono: Vec<f32> = Vec::with_capacity(8192);
    device
        .build_input_stream(
            config,
            move |data: &[T], _: &cpal::InputCallbackInfo| {
                mono.clear();
                for frame in data.chunks(channels) {
                    let sum: f32 = frame.iter().map(|&s| s.to_sample::<f32>()).sum();
                    mono.push(sum / frame.len() as f32);
                }
                mic_push(&mono, rate);
            },
            |_| {}, // a lost route ends the input; the game sees the level stay at 0
            None,
        )
        .ok()
}

#[cfg(target_os = "ios")]
pub use ios::{permission, request};

#[cfg(target_os = "ios")]
mod ios {
    #![allow(deprecated)] // AVAudioSession's record permission: AVAudioApplication's needs iOS 17
    use block2::RcBlock;
    use objc2::runtime::Bool;
    use objc2_avf_audio::{
        AVAudioSession, AVAudioSessionCategoryAmbient, AVAudioSessionCategoryOptions, AVAudioSessionCategoryPlayAndRecord,
        AVAudioSessionRecordPermission,
    };
    use std::sync::Mutex;

    /// Play-and-record while listening (output to the speaker rather than the earpiece, mixing with
    /// other apps' audio), ambient otherwise; the output stream then reopens on the new route.
    pub fn record_session(listening: bool) {
        // SAFETY: the shared session is a process-wide singleton; the category constants are
        // framework-provided static strings.
        unsafe {
            let session = AVAudioSession::sharedInstance();
            if listening {
                if let Some(category) = AVAudioSessionCategoryPlayAndRecord {
                    let options = AVAudioSessionCategoryOptions::DefaultToSpeaker
                        | AVAudioSessionCategoryOptions::MixWithOthers
                        | AVAudioSessionCategoryOptions::AllowBluetoothA2DP;
                    let _ = session.setCategory_withOptions_error(category, options);
                }
                let _ = session.setActive_error(true);
            } else if let Some(ambient) = AVAudioSessionCategoryAmbient {
                let _ = session.setCategory_error(ambient);
            }
        }
        super::super::output::restart();
    }

    /// 1 granted, 0 not asked yet, -1 denied.
    pub fn permission() -> i32 {
        // SAFETY: as above.
        match unsafe { AVAudioSession::sharedInstance().recordPermission() } {
            AVAudioSessionRecordPermission::Granted => 1,
            AVAudioSessionRecordPermission::Denied => -1,
            _ => 0,
        }
    }

    /// Shows the system prompt the first time; answers at once after that.
    pub fn request(done: impl FnOnce(bool) + Send + 'static) {
        let done: Mutex<Option<Box<dyn FnOnce(bool) + Send>>> = Mutex::new(Some(Box::new(done)));
        let block = RcBlock::new(move |granted: Bool| {
            if let Some(done) = done.lock().ok().and_then(|mut d| d.take()) {
                done(granted.as_bool());
            }
        });
        // SAFETY: the session retains the block until it has called it.
        unsafe { AVAudioSession::sharedInstance().requestRecordPermission(&block) };
    }
}
