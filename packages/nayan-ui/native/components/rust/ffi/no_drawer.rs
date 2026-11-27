//! Keeps the platform view ABI linkable when UI is disabled.
pub enum Drawer {}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawer_new() -> *mut Drawer {
    std::ptr::null_mut()
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawer_free(_: *mut Drawer) {}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawer_configure(_: *mut Drawer, _: f32, _: f32, _: f32, _: u32) -> f64 {
    0.
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawer_input(_: *mut Drawer, _: i32, _: f32, _: f32, _: f64) -> f64 {
    0.
}
