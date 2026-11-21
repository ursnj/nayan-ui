use crate::haptics;

#[unsafe(no_mangle)]
pub extern "C" fn engine_haptics_supported() -> i32 {
    haptics::supported() as i32
}

/// Plays `count` taps given as `[time, intensity, sharpness]` triples. With `throttle`, a lone tap
/// right after another is dropped.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_haptics_play(taps: *const f32, count: u32, throttle: i32) {
    if taps.is_null() || count == 0 {
        return;
    }
    // SAFETY: caller passes `count * 3` readable floats, used only during this call.
    let raw = unsafe { std::slice::from_raw_parts(taps, count as usize * 3) };
    let taps: Vec<haptics::Tap> = raw
        .as_chunks::<3>()
        .0
        .iter()
        .map(|&[time, intensity, sharpness]| haptics::Tap { time, intensity, sharpness })
        .collect();
    haptics::play(&taps, throttle != 0);
}
