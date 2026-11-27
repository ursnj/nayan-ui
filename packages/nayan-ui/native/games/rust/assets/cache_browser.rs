//! Rust policy and validation; the host implements only asynchronous IndexedDB I/O.
use super::cache::{decode, encode, fingerprint};
use std::{cell::RefCell, collections::HashMap};
use wasm_bindgen::{JsCast, prelude::*};
use wasm_bindgen_futures::JsFuture;

const WARM_BYTES: usize = 64 * 1024 * 1024;
const WARM_RECORDS: usize = 1024;
#[derive(Default)]
struct State {
    driver: Option<JsValue>,
    records: HashMap<String, Vec<u8>>,
    bytes: usize,
}
thread_local! { static STATE: RefCell<State> = RefCell::new(State::default()); }
fn call(name: &str, args: &[JsValue]) -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let state = state.borrow();
        let driver = state.driver.as_ref().ok_or_else(|| JsValue::from_str("IndexedDB unavailable"))?;
        let function: js_sys::Function = js_sys::Reflect::get(driver, &name.into())?.dyn_into()?;
        let parameters = js_sys::Array::new();
        for arg in args {
            parameters.push(arg);
        }
        function.apply(driver, &parameters)
    })
}
pub fn install(driver: JsValue) {
    STATE.with(|state| {
        state.borrow_mut().driver = (!driver.is_null() && !driver.is_undefined()).then_some(driver);
    });
}
pub fn can_warm(bytes: usize) -> bool {
    STATE.with(|state| {
        let s = state.borrow();
        s.records.len() < WARM_RECORDS && s.bytes.saturating_add(bytes) <= WARM_BYTES
    })
}
fn key_of(raw: &[u8]) -> Option<&str> {
    if raw.len() < 52 {
        return None;
    }
    let length = u32::from_le_bytes(raw[8..12].try_into().ok()?) as usize;
    std::str::from_utf8(raw.get(52..52usize.checked_add(length)?)?).ok()
}
pub fn restore(name: String, raw: Vec<u8>) -> bool {
    let Some(key) = key_of(&raw) else { return false };
    if key.starts_with("source:") || fingerprint(&[key.as_bytes()]) != name || decode(key, &raw).is_none() || !can_warm(raw.len()) {
        return false;
    }
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        if let Some(old) = state.records.remove(&name) {
            state.bytes -= old.len();
        }
        state.bytes += raw.len();
        state.records.insert(name, raw);
    });
    true
}
pub fn read(key: &str) -> Option<Vec<u8>> {
    let name = fingerprint(&[key.as_bytes()]);
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        if key.starts_with("prepared-") {
            // Registered prepared models retain their native geometry; release the warm-up snapshot.
            let bytes = state.records.remove(&name)?;
            state.bytes -= bytes.len();
            decode(key, &bytes)
        } else {
            decode(key, state.records.get(&name)?)
        }
    })
}
pub fn write(key: &str, payload: &[u8]) -> Result<(), String> {
    let raw = encode(key, payload)?;
    let name = fingerprint(&[key.as_bytes()]);
    let geometry = !key.starts_with("source:");
    let bytes = js_sys::Uint8Array::from(raw.as_slice()); // Own the copy before WASM memory grows.
    call("write", &[name.clone().into(), bytes.into(), geometry.into()]).map_err(|_| "IndexedDB write unavailable")?;
    if key.starts_with("procedural:") {
        restore(name, raw);
    }
    Ok(()) // Prepared factories are synchronous; async I/O errors fall back to native session reuse.
}
pub fn remove(key: &str) -> Result<(), String> {
    let name = fingerprint(&[key.as_bytes()]);
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        if let Some(old) = state.records.remove(&name) {
            state.bytes -= old.len();
        }
    });
    call("remove", &[name.into()]).map_err(|_| "IndexedDB remove unavailable")?;
    Ok(())
}
pub fn clear() -> Result<(), String> {
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        state.records.clear();
        state.bytes = 0;
    });
    call("clear", &[]).map_err(|_| "IndexedDB clear unavailable")?;
    Ok(())
}
pub async fn load(key: String) -> Result<js_sys::Uint8Array, JsValue> {
    let pending = call("read", &[fingerprint(&[key.as_bytes()]).into()])?;
    let raw = JsFuture::from(js_sys::Promise::resolve(&pending)).await?;
    if raw.is_undefined() || raw.is_null() {
        return Ok(js_sys::Uint8Array::new_with_length(0));
    }
    let bytes = js_sys::Uint8Array::new(&raw).to_vec();
    let payload = decode(&key, &bytes).unwrap_or_default();
    Ok(js_sys::Uint8Array::from(payload.as_slice()))
}
