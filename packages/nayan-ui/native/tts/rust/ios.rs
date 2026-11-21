use super::{Command, Reply, Response};
use dispatch2::DispatchQueue;
use objc2::rc::Retained;
use objc2_avf_audio::{
    AVSpeechBoundary, AVSpeechSynthesisVoice, AVSpeechSynthesisVoiceQuality, AVSpeechSynthesizer, AVSpeechUtterance,
    AVSpeechUtteranceDefaultSpeechRate, AVSpeechUtteranceMaximumSpeechRate, AVSpeechUtteranceMinimumSpeechRate,
};
use objc2_foundation::NSString;
use serde_json::{Value, json};
use std::cell::RefCell;

thread_local! {
    // Accessed exclusively by the main dispatch queue, including shutdown.
    static SYNTH: RefCell<Option<Retained<AVSpeechSynthesizer>>> = const { RefCell::new(None) };
}
pub fn request(command: Command, reply: Reply) {
    DispatchQueue::main().exec_async(move || reply(execute(command)));
}
fn execute(command: Command) -> Response {
    SYNTH.with(|cell| {
        let mut slot = cell.borrow_mut();
        // SAFETY: framework objects stay on the main thread; strings and options are validated.
        unsafe {
            if matches!(command, Command::Stop | Command::Shutdown) {
                // A synthesizer can retain stale speaking/paused state when stopped before its
                // first utterance starts. End that session instead of reusing its queue.
                if let Some(synth) = slot.take() { synth.stopSpeakingAtBoundary(AVSpeechBoundary::Immediate); }
                return Ok(Value::Null);
            }
            if slot.is_none() {
                match command {
                    Command::IsSpeaking => return Ok(json!(false)),
                    Command::Pause | Command::Resume => return Ok(Value::Null),
                    _ => {}
                }
            }
            let synth = slot.get_or_insert_with(|| {
                let synth = AVSpeechSynthesizer::new();
                synth.setUsesApplicationAudioSession(false);
                synth
            });
            match command {
                Command::Speak { text, language, voice, rate, pitch, volume } => {
                    if text.trim().is_empty() { return Ok(Value::Null); }
                    let utterance = AVSpeechUtterance::speechUtteranceWithString(&NSString::from_str(&text));
                    let selected = if let Some(voice) = voice {
                        Some(AVSpeechSynthesisVoice::voiceWithIdentifier(&NSString::from_str(&voice)).ok_or("Unknown speech voice")?)
                    } else if let Some(language) = language {
                        Some(AVSpeechSynthesisVoice::voiceWithLanguage(Some(&NSString::from_str(&language))).ok_or("Speech language is unavailable")?)
                    } else { None };
                    utterance.setVoice(selected.as_deref());
                    utterance.setRate((rate * AVSpeechUtteranceDefaultSpeechRate).clamp(AVSpeechUtteranceMinimumSpeechRate, AVSpeechUtteranceMaximumSpeechRate));
                    utterance.setPitchMultiplier(pitch);
                    utterance.setVolume(volume);
                    synth.speakUtterance(&utterance);
                }
                Command::Pause => { synth.pauseSpeakingAtBoundary(AVSpeechBoundary::Immediate); }
                Command::Resume => { synth.continueSpeaking(); }
                Command::IsSpeaking => return Ok(json!(synth.isSpeaking() || synth.isPaused())),
                Command::Voices => return Ok(Value::Array(AVSpeechSynthesisVoice::speechVoices().iter().map(|voice| json!({
                    "identifier": voice.identifier().to_string(), "name": voice.name().to_string(), "language": voice.language().to_string(),
                    "quality": if voice.quality().0 >= AVSpeechSynthesisVoiceQuality::Enhanced.0 { "Enhanced" } else { "Default" }
                })).collect())),
                Command::Stop | Command::Shutdown => unreachable!(),
            }
            Ok(Value::Null)
        }
    })
}
