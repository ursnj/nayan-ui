//! Small POD output; no allocation or JS-side policy is needed to update native system bars.
#[repr(C)]
pub struct EngineSystemBars {
    pub enabled: i32,
    pub status_light: i32,
    pub navigation_light: i32,
    pub status_hidden: i32,
    pub navigation_hidden: i32,
    pub window_style: i32,
    pub background_light: u32,
    pub background_dark: u32,
    pub remember_window: i32,
}
unsafe fn text<'a>(ptr: *const u8, len: usize, limit: usize) -> Option<&'a str> {
    if ptr.is_null() || len > limit {
        return None;
    }
    std::str::from_utf8(unsafe { std::slice::from_raw_parts(ptr, len) }).ok()
}
#[cfg(feature = "components")]
fn write(out: &mut EngineSystemBars, state: crate::components::system_bars::SystemBars) {
    *out = EngineSystemBars {
        enabled: state.enabled,
        status_light: state.status_light,
        navigation_light: state.navigation_light,
        status_hidden: state.status_hidden,
        navigation_hidden: state.navigation_hidden,
        window_style: state.window_style,
        background_light: state.background_light,
        background_dark: state.background_dark,
        remember_window: state.remember_window,
    };
}
/// # Safety
/// The input buffers must be readable for their given lengths; `out` points to writable output.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_system_bars_set(id: *const u8, id_len: usize, config: *const u8, len: usize, out: *mut EngineSystemBars) -> i32 {
    let (Some(id), Some(config), Some(out)) = (unsafe { text(id, id_len, 128) }, unsafe { text(config, len, 65536) }, unsafe {
        out.as_mut()
    }) else {
        return 0;
    };
    #[cfg(feature = "components")]
    if let Some(state) = crate::components::system_bars::set(id, config) {
        write(out, state);
        return 1;
    }
    let _ = (id, config, out);
    0
}
/// # Safety
/// `id` is readable for `len` bytes; `out` points to writable output.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_system_bars_remove(id: *const u8, len: usize, out: *mut EngineSystemBars) -> i32 {
    let (Some(id), Some(out)) = (unsafe { text(id, len, 128) }, unsafe { out.as_mut() }) else {
        return 0;
    };
    #[cfg(feature = "components")]
    if let Some(state) = crate::components::system_bars::remove(id) {
        write(out, state);
        return 1;
    }
    let _ = (id, out);
    0
}
