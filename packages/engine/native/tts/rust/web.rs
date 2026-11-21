use super::{Command, Response, envelope, parse};
use serde_json::{Value, json};
use wasm_bindgen::{JsCast, prelude::*};
use web_sys::{SpeechSynthesis, SpeechSynthesisUtterance, SpeechSynthesisVoice};

fn synth() -> Result<SpeechSynthesis, String> {
    web_sys::window()
        .ok_or("Speech requires a browser window")?
        .speech_synthesis()
        .map_err(error)
}
fn error(error: JsValue) -> String {
    format!("System speech: {error:?}")
}

#[wasm_bindgen]
pub async fn speech_request(command: String) -> String {
    envelope(match parse(&command) {
        Ok(command) => execute(command).await,
        Err(e) => Err(e),
    })
}
async fn execute(command: Command) -> Response {
    let synth = synth()?;
    match command {
        Command::Speak {
            text,
            language,
            voice,
            rate,
            pitch,
            volume,
        } => {
            if text.trim().is_empty() {
                return Ok(Value::Null);
            }
            let utterance = SpeechSynthesisUtterance::new_with_text(&text).map_err(error)?;
            utterance.set_lang(language.as_deref().unwrap_or(""));
            utterance.set_rate(rate);
            utterance.set_pitch(pitch);
            utterance.set_volume(volume);
            if let Some(id) = voice {
                let selected = synth
                    .get_voices()
                    .iter()
                    .map(|v| v.unchecked_into::<SpeechSynthesisVoice>())
                    .find(|v| v.voice_uri() == id)
                    .ok_or("Unknown speech voice")?;
                utterance.set_voice(Some(&selected));
            }
            synth.speak(&utterance);
        }
        Command::Stop | Command::Shutdown => {
            synth.cancel();
            // cancel() preserves the browser's paused state. Reset it so the next run can speak.
            synth.resume();
        }
        Command::Pause => synth.pause(),
        Command::Resume => synth.resume(),
        Command::IsSpeaking => return Ok(json!(synth.speaking() || synth.pending())),
        Command::Voices => {
            // Browser voices may arrive after initialization. Bound discovery to one second.
            for _ in 0..10 {
                if synth.get_voices().length() > 0 {
                    break;
                }
                let timer = js_sys::Promise::new(&mut |resolve, reject| {
                    if let Some(window) = web_sys::window() {
                        if let Err(e) = window.set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, 100) {
                            let _ = reject.call1(&JsValue::NULL, &e);
                        }
                    }
                });
                wasm_bindgen_futures::JsFuture::from(timer).await.map_err(error)?;
            }
            return Ok(Value::Array(
                synth
                    .get_voices()
                    .iter()
                    .map(|v| {
                        let voice = v.unchecked_into::<SpeechSynthesisVoice>();
                        json!({"identifier": voice.voice_uri(), "name": voice.name(), "language": voice.lang(), "quality": "Default"})
                    })
                    .collect(),
            ));
        }
    }
    Ok(Value::Null)
}
