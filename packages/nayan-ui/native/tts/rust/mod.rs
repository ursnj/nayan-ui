//! System speech. Rust owns validation, commands and lifecycle; platform APIs synthesize/play audio.
use serde::Deserialize;
use serde_json::{Value, json};

#[derive(Debug, Deserialize)]
#[serde(tag = "action")]
pub enum Command {
    #[serde(rename = "speak")]
    Speak {
        text: String,
        language: Option<String>,
        voice: Option<String>,
        #[serde(default = "one")]
        rate: f32,
        #[serde(default = "one")]
        pitch: f32,
        #[serde(default = "one")]
        volume: f32,
    },
    #[serde(rename = "stop")]
    Stop,
    #[serde(rename = "pause")]
    Pause,
    #[serde(rename = "resume")]
    Resume,
    #[serde(rename = "isSpeaking")]
    IsSpeaking,
    #[serde(rename = "voices")]
    Voices,
    #[serde(skip)]
    Shutdown,
}
fn one() -> f32 {
    1.0
}
pub type Response = Result<Value, String>;
#[cfg(not(target_arch = "wasm32"))]
pub type Reply = Box<dyn FnOnce(Response) + Send>;

pub fn parse(command: &str) -> Result<Command, String> {
    let command: Command = serde_json::from_str(command).map_err(|e| format!("Invalid speech command: {e}"))?;
    if let Command::Speak { rate, pitch, volume, .. } = &command {
        for (name, value, min, max) in [("rate", *rate, 0.1, 2.0), ("pitch", *pitch, 0.5, 2.0), ("volume", *volume, 0.0, 1.0)] {
            if !value.is_finite() || !(min..=max).contains(&value) {
                return Err(format!("Speech {name} must be between {min} and {max}"));
            }
        }
    }
    Ok(command)
}
pub fn envelope(result: Response) -> String {
    match result {
        Ok(value) => json!({"value": value}),
        Err(error) => json!({"error": error}),
    }
    .to_string()
}
#[cfg(not(target_arch = "wasm32"))]
pub fn request(command: &str, reply: Reply) {
    match parse(command) {
        Ok(command) => platform::request(command, reply),
        Err(error) => reply(Err(error)),
    }
}
#[cfg(not(target_arch = "wasm32"))]
pub fn shutdown() {
    platform::request(Command::Shutdown, Box::new(|_| {}));
}

/// Pending initialization is separate from JNI so cancellation, stale callbacks and retry are testable.
#[cfg(any(target_os = "android", test))]
#[derive(Default)]
pub(crate) struct Pending {
    generation: Option<i64>,
    jobs: Vec<(Command, Reply)>,
}
#[cfg(any(target_os = "android", test))]
impl Pending {
    pub fn push(&mut self, generation: i64, command: Command, reply: Reply) -> bool {
        self.jobs.push((command, reply));
        if self.generation.is_some() {
            return false;
        }
        self.generation = Some(generation);
        true
    }
    pub fn take(&mut self, generation: i64) -> Option<Vec<(Command, Reply)>> {
        if self.generation != Some(generation) {
            return None;
        }
        self.generation = None;
        Some(std::mem::take(&mut self.jobs))
    }
    pub fn reset(&mut self) -> Vec<(Command, Reply)> {
        self.generation = None;
        std::mem::take(&mut self.jobs)
    }
    pub fn has_speech(&self) -> bool {
        self.jobs.iter().any(|(command, _)| matches!(command, Command::Speak { .. }))
    }
    pub fn cancel_speech(&mut self) {
        let mut retained = Vec::new();
        for (command, reply) in self.jobs.drain(..) {
            if matches!(command, Command::Speak { .. }) {
                reply(Err("Speech cancelled before initialization completed".into()));
            } else {
                retained.push((command, reply));
            }
        }
        self.jobs = retained;
    }
}

#[cfg(target_os = "android")]
#[path = "android.rs"]
mod platform;
#[cfg(target_os = "ios")]
#[path = "ios.rs"]
mod platform;
#[cfg(target_arch = "wasm32")]
pub mod web;
#[cfg(not(any(target_os = "ios", target_os = "android", target_arch = "wasm32")))]
mod platform {
    pub fn request(_: super::Command, reply: super::Reply) {
        reply(Err("System speech is unavailable on this platform".into()));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_options_without_leaking_previous_values() {
        assert!(matches!(
            parse(r#"{"action":"speak","text":"Hello","volume":0,"rate":0.8,"voice":"test"}"#).unwrap(),
            Command::Speak { volume: 0.0, .. }
        ));
        assert!(matches!(
            parse(r#"{"action":"speak","text":"Next"}"#).unwrap(),
            Command::Speak {
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                voice: None,
                ..
            }
        ));
    }
    #[test]
    fn rejects_bad_commands_and_options_before_platform_calls() {
        for input in [
            r#"{"action":"speak","text":"x","rate":0}"#,
            r#"{"action":"speak","text":"x","pitch":3}"#,
            r#"{"action":"speak","text":"x","volume":-1}"#,
            r#"{"action":"speak"}"#,
            r#"{"action":"shutdown"}"#,
            "not json",
        ] {
            assert!(parse(input).is_err(), "{input}");
        }
        assert_eq!(serde_json::from_str::<Value>(&envelope(Err("failed".into()))).unwrap()["error"], "failed");
    }
    #[test]
    fn initialization_cancellation_keeps_voice_queries_but_never_plays_cancelled_text() {
        use std::sync::{Arc, Mutex};
        let replies = Arc::new(Mutex::new(Vec::new()));
        let mut pending = Pending::default();
        let results = replies.clone();
        assert!(pending.push(
            10,
            parse(r#"{"action":"speak","text":"cancel me"}"#).unwrap(),
            Box::new(move |result| results.lock().unwrap().push(result))
        ));
        assert!(!pending.push(11, Command::Voices, Box::new(|_| {})));
        assert!(pending.has_speech());
        pending.cancel_speech();
        assert!(!pending.has_speech());
        assert_eq!(replies.lock().unwrap().len(), 1);
        assert!(replies.lock().unwrap()[0].as_ref().unwrap_err().contains("cancelled"));
        let jobs = pending.take(10).unwrap();
        assert_eq!(jobs.len(), 1);
        assert!(matches!(jobs[0].0, Command::Voices));
        assert!(pending.take(10).is_none(), "duplicate completion cannot reply twice");
    }
    #[test]
    fn initialization_timeout_and_shutdown_allow_retry_and_ignore_stale_callbacks() {
        let mut pending = Pending::default();
        assert!(pending.push(10, Command::Voices, Box::new(|_| {})));
        assert!(pending.take(9).is_none(), "old timeout leaves the live initialization alone");
        assert_eq!(pending.take(10).unwrap().len(), 1);
        assert!(pending.push(20, Command::Voices, Box::new(|_| {})), "retry starts a new generation");
        assert!(pending.take(10).is_none(), "late callback cannot complete the retry");
        assert_eq!(pending.reset().len(), 1);
        assert!(pending.take(20).is_none(), "shutdown invalidates pending callbacks");
        assert!(pending.push(30, Command::Voices, Box::new(|_| {})));
        assert_eq!(pending.take(30).unwrap().len(), 1);
    }
}
