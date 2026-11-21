use super::{Command, Pending, Reply, Response};
use jni::objects::{JClass, JObject, JString, JValue};
use jni::refs::Global;
use jni::strings::JNIString;
use jni::sys::{JNIEnv, jclass, jint, jlong, jobject};
use jni::{Env, JavaVM, jni_sig};
use serde_json::{Value, json};
use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::{
    Mutex,
    atomic::{AtomicI64, Ordering},
};

type Job = (Command, Reply);
static JOBS: Mutex<Option<HashMap<i64, Job>>> = Mutex::new(None);
static NEXT: AtomicI64 = AtomicI64::new(1);
#[derive(Default)]
struct State {
    synth: Option<Global<JObject<'static>>>,
    pending: Pending,
    opening: Option<Global<JObject<'static>>>,
}
thread_local! { static STATE: RefCell<State> = RefCell::new(State::default()); }

fn with_env<R>(f: impl for<'j> FnOnce(&mut Env<'j>, &JObject<'j>) -> jni::errors::Result<R>) -> Result<R, String> {
    if !crate::android::is_initialized() {
        return Err("Android speech context is unavailable".into());
    }
    let ctx = ndk_context::android_context();
    // SAFETY: initialized once with the process VM and a process-lived global application context.
    let vm = unsafe { JavaVM::from_raw(ctx.vm().cast()) };
    vm.attach_current_thread(|env: &mut Env<'_>| -> jni::errors::Result<Result<R, String>> {
        let context = unsafe { JObject::from_raw(env, ctx.context() as jobject) };
        let result = f(env, &context).map_err(|e| format!("Android system speech: {e}"));
        if env.exception_check() {
            env.exception_clear();
        }
        Ok(result)
    })
    .map_err(|e| e.to_string())?
}
fn adapter<'j>(env: &mut Env<'j>, context: &JObject<'j>) -> jni::errors::Result<JClass<'j>> {
    // Application classes aren't visible through FindClass from an attached native thread.
    let loader = env
        .call_method(context, JNIString::new("getClassLoader"), jni_sig!("()Ljava/lang/ClassLoader;"), &[])?
        .l()?;
    let name = env.new_string("com.nayanui.engine.EngineSpeech")?;
    let class = env
        .call_method(
            &loader,
            JNIString::new("loadClass"),
            jni_sig!("(Ljava/lang/String;)Ljava/lang/Class;"),
            &[JValue::Object(&name)],
        )?
        .l()?;
    JClass::cast_local(env, class)
}
pub fn request(command: Command, reply: Reply) {
    let token = NEXT.fetch_add(1, Ordering::Relaxed);
    JOBS.lock().unwrap().get_or_insert_with(HashMap::new).insert(token, (command, reply));
    let result = with_env(|env, context| {
        let class = adapter(env, context)?;
        env.call_static_method(class, JNIString::new("dispatch"), jni_sig!("(J)Z"), &[JValue::Long(token)])?
            .z()
    });
    if !matches!(result, Ok(true)) {
        let error = result.err().unwrap_or_else(|| "Android main thread rejected the speech command".into());
        let job = JOBS.lock().unwrap().as_mut().and_then(|jobs| jobs.remove(&token));
        if let Some((_, reply)) = job {
            reply(Err(error));
        }
    }
}
// Called only on the Android main thread, as is nativeInitialized below.
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_nayanui_engine_EngineSpeech_nativeRun(_: *mut JNIEnv, _: jclass, token: jlong) {
    let job = JOBS.lock().unwrap().as_mut().and_then(|jobs| jobs.remove(&token));
    let Some((command, reply)) = job else {
        return;
    };
    STATE.with(|cell| {
        let mut state = cell.borrow_mut();
        if matches!(command, Command::Shutdown) {
            for (_, reply) in state.pending.reset() {
                reply(Err("Speech shut down during initialization".into()));
            }
            if let Some(synth) = state.synth.take() {
                close(&synth);
            }
            if let Some(synth) = state.opening.take() {
                close(&synth);
            }
            reply(Ok(Value::Null));
        } else if matches!(command, Command::Pause | Command::Resume) {
            reply(Err("System speech pause/resume is unavailable on Android".into()));
        } else if let Some(synth) = &state.synth {
            reply(execute(synth, command));
        } else if matches!(command, Command::Stop) {
            state.pending.cancel_speech();
            reply(Ok(Value::Null));
        } else if matches!(command, Command::IsSpeaking) {
            reply(Ok(json!(state.pending.has_speech())));
        } else if state.pending.push(token, command, reply) {
            let result = with_env(|env, context| {
                let class = adapter(env, context)?;
                let synth = env
                    .call_static_method(
                        class,
                        JNIString::new("create"),
                        jni_sig!("(Landroid/content/Context;J)Landroid/speech/tts/TextToSpeech;"),
                        &[JValue::Object(context), JValue::Long(token)],
                    )?
                    .l()?;
                env.new_global_ref(synth)
            });
            match result {
                Ok(synth) if !synth.is_null() => state.opening = Some(synth),
                result => {
                    let error = result.err().unwrap_or_else(|| "Unable to create system speech synthesizer".into());
                    for (_, reply) in state.pending.take(token).unwrap_or_default() {
                        reply(Err(error.clone()));
                    }
                }
            }
        }
    });
}
fn close(synth: &Global<JObject<'static>>) {
    let _ = with_env(|env, _| {
        env.call_method(synth.as_obj(), JNIString::new("shutdown"), jni_sig!("()V"), &[])?;
        Ok(())
    });
}
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_nayanui_engine_EngineSpeech_nativeInitTimeout(_: *mut JNIEnv, _: jclass, generation: jlong) {
    STATE.with(|cell| {
        let mut state = cell.borrow_mut();
        if let Some(jobs) = state.pending.take(generation) {
            if let Some(synth) = state.opening.take() {
                close(&synth);
            }
            for (_, reply) in jobs {
                reply(Err("System speech initialization timed out; try again".into()));
            }
        }
    });
}
#[unsafe(no_mangle)]
pub extern "system" fn Java_com_nayanui_engine_EngineSpeech_nativeInitialized(
    _: *mut JNIEnv,
    _: jclass,
    object: jobject,
    status: jint,
    generation: jlong,
) {
    let result = with_env(|env, _| {
        // SAFETY: Java passes its live synthesizer; promote it before this JNI call returns.
        let object = unsafe { JObject::from_raw(env, object) };
        env.new_global_ref(object)
    });
    STATE.with(|cell| {
        let mut state = cell.borrow_mut();
        let Some(jobs) = state.pending.take(generation) else {
            if let Ok(synth) = result {
                if !synth.is_null() {
                    close(&synth);
                }
            }
            return;
        };
        let opening = state.opening.take();
        match result {
            Ok(synth) if status == 0 && !synth.is_null() => state.synth = Some(synth),
            _ => {
                if let Some(synth) = opening {
                    close(&synth);
                }
            }
        }
        for (command, reply) in jobs {
            reply(match &state.synth {
                Some(synth) => execute(synth, command),
                None => Err("System text-to-speech initialization failed; try again".into()),
            });
        }
    });
}

fn int(env: &mut Env<'_>, object: &JObject<'_>, name: &str) -> jni::errors::Result<i32> {
    env.call_method(object, JNIString::new(name), jni_sig!("()I"), &[])?.i()
}
fn string(env: &mut Env<'_>, object: &JObject<'_>, name: &str) -> jni::errors::Result<String> {
    let value = env
        .call_method(object, JNIString::new(name), jni_sig!("()Ljava/lang/String;"), &[])?
        .l()?;
    JString::cast_local(env, value)?.try_to_string(env)
}
fn execute(synth: &Global<JObject<'static>>, command: Command) -> Response {
    with_env(|env, _| -> jni::errors::Result<Response> {
        let synth = synth.as_obj();
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
                    return Ok(Ok(Value::Null));
                }
                let max = env
                    .call_static_method(
                        JNIString::new("android/speech/tts/TextToSpeech"),
                        JNIString::new("getMaxSpeechInputLength"),
                        jni_sig!("()I"),
                        &[],
                    )?
                    .i()?;
                if text.encode_utf16().count() > max as usize {
                    return Ok(Err(format!("Speech text exceeds system input limit: {max}")));
                }
                if let Some(id) = voice {
                    let voices = voice_objects(env, synth)?;
                    let mut selected = None;
                    for v in voices {
                        if string(env, &v, "getName")? == id {
                            selected = Some(v);
                            break;
                        }
                    }
                    let Some(selected) = selected else {
                        return Ok(Err("Unknown or unavailable speech voice".into()));
                    };
                    if env
                        .call_method(
                            synth,
                            JNIString::new("setVoice"),
                            jni_sig!("(Landroid/speech/tts/Voice;)I"),
                            &[JValue::Object(&selected)],
                        )?
                        .i()?
                        != 0
                    {
                        return Ok(Err("Unable to set speech voice".into()));
                    }
                } else {
                    let locale = if let Some(language) = language {
                        let tag = env.new_string(language)?;
                        env.call_static_method(
                            JNIString::new("java/util/Locale"),
                            JNIString::new("forLanguageTag"),
                            jni_sig!("(Ljava/lang/String;)Ljava/util/Locale;"),
                            &[JValue::Object(&tag)],
                        )?
                        .l()?
                    } else {
                        env.call_static_method(
                            JNIString::new("java/util/Locale"),
                            JNIString::new("getDefault"),
                            jni_sig!("()Ljava/util/Locale;"),
                            &[],
                        )?
                        .l()?
                    };
                    if env
                        .call_method(
                            synth,
                            JNIString::new("setLanguage"),
                            jni_sig!("(Ljava/util/Locale;)I"),
                            &[JValue::Object(&locale)],
                        )?
                        .i()?
                        < 0
                    {
                        return Ok(Err("Speech language is unavailable".into()));
                    }
                }
                for (name, value) in [("setSpeechRate", rate), ("setPitch", pitch)] {
                    if env
                        .call_method(synth, JNIString::new(name), jni_sig!("(F)I"), &[JValue::Float(value)])?
                        .i()?
                        != 0
                    {
                        return Ok(Err("Unable to set speech options".into()));
                    }
                }
                let params = env.new_object(JNIString::new("android/os/Bundle"), jni_sig!("()V"), &[])?;
                let key = env.new_string("volume")?;
                env.call_method(
                    &params,
                    JNIString::new("putFloat"),
                    jni_sig!("(Ljava/lang/String;F)V"),
                    &[JValue::Object(&key), JValue::Float(volume)],
                )?;
                let text = env.new_string(text)?;
                let id = env.new_string(NEXT.fetch_add(1, Ordering::Relaxed).to_string())?;
                if env
                    .call_method(
                        synth,
                        JNIString::new("speak"),
                        jni_sig!("(Ljava/lang/CharSequence;ILandroid/os/Bundle;Ljava/lang/String;)I"),
                        &[JValue::Object(&text), JValue::Int(1), JValue::Object(&params), JValue::Object(&id)],
                    )?
                    .i()?
                    != 0
                {
                    return Ok(Err("Unable to queue system speech".into()));
                }
            }
            Command::Stop => {
                if int(env, synth, "stop")? != 0 {
                    return Ok(Err("Unable to stop system speech".into()));
                }
            }
            Command::IsSpeaking => {
                return Ok(Ok(json!(
                    env.call_method(synth, JNIString::new("isSpeaking"), jni_sig!("()Z"), &[])?.z()?
                )));
            }
            Command::Voices => {
                let mut voices = Vec::new();
                for voice in voice_objects(env, synth)? {
                    if env
                        .call_method(&voice, JNIString::new("isNetworkConnectionRequired"), jni_sig!("()Z"), &[])?
                        .z()?
                    {
                        continue;
                    }
                    let features = env
                        .call_method(&voice, JNIString::new("getFeatures"), jni_sig!("()Ljava/util/Set;"), &[])?
                        .l()?;
                    let missing = env.new_string("notInstalled")?;
                    if !features.is_null()
                        && env
                            .call_method(
                                &features,
                                JNIString::new("contains"),
                                jni_sig!("(Ljava/lang/Object;)Z"),
                                &[JValue::Object(&missing)],
                            )?
                            .z()?
                    {
                        continue;
                    }
                    let locale = env
                        .call_method(&voice, JNIString::new("getLocale"), jni_sig!("()Ljava/util/Locale;"), &[])?
                        .l()?;
                    let name = string(env, &voice, "getName")?;
                    voices.push(json!({"identifier": name, "name": name, "language": string(env, &locale, "toLanguageTag")?, "quality": if int(env, &voice, "getQuality")? > 300 { "Enhanced" } else { "Default" }}));
                }
                return Ok(Ok(Value::Array(voices)));
            }
            _ => return Ok(Err("Unsupported system speech command".into())),
        }
        Ok(Ok(Value::Null))
    })?
}
fn voice_objects<'j>(env: &mut Env<'j>, synth: &JObject<'_>) -> jni::errors::Result<Vec<JObject<'j>>> {
    let set = env
        .call_method(synth, JNIString::new("getVoices"), jni_sig!("()Ljava/util/Set;"), &[])?
        .l()?;
    if set.is_null() {
        return Ok(Vec::new());
    }
    let iterator = env
        .call_method(&set, JNIString::new("iterator"), jni_sig!("()Ljava/util/Iterator;"), &[])?
        .l()?;
    let mut voices = Vec::new();
    while env.call_method(&iterator, JNIString::new("hasNext"), jni_sig!("()Z"), &[])?.z()? {
        voices.push(
            env.call_method(&iterator, JNIString::new("next"), jni_sig!("()Ljava/lang/Object;"), &[])?
                .l()?,
        );
    }
    Ok(voices)
}
