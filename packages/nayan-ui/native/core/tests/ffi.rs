//! Exercise the shipped C ABI with owned buffers, null handles and malformed payloads.
//! No GPU surface, audio device or mobile host is required.
use engine_core::ffi::{cache::*, media::*, model::*, modelling::*};
#[cfg(feature = "games")]
use engine_core::{DESC_LEN, NO_ENTITY, World, ffi::world::*};
use std::{ffi::CStr, ptr, sync::Mutex};

// Cache configuration and the last decoder error are process-global ABI state.
static ABI: Mutex<()> = Mutex::new(());

#[cfg(feature = "games")]
struct OwnedWorld(*mut World);
#[cfg(feature = "games")]
impl Drop for OwnedWorld {
    fn drop(&mut self) {
        unsafe { engine_world_free(self.0) };
    }
}

#[cfg(feature = "games")]
#[test]
fn null_world_handles_return_empty_results_without_touching_output_buffers() {
    let _guard = ABI.lock().unwrap();
    unsafe {
        let w = ptr::null_mut();
        assert_eq!(engine_world_spawn_desc(w, ptr::null(), 0), NO_ENTITY);
        assert_eq!(engine_world_set_desc(w, 0, ptr::null(), 0), 0);
        assert_eq!(engine_world_set_transforms(w, ptr::null(), 0, 1), 0);
        assert_eq!(engine_world_animate(w, ptr::null(), 0), 0);
        assert_eq!(engine_world_stop_animation(w, 0), 0);
        assert_eq!(engine_world_burst(w, ptr::null(), 0), 0);
        assert_eq!(engine_world_pick(w, 0., 0., 0., 0., 0., -1.), NO_ENTITY);
        assert_eq!(engine_world_despawn(w, 0), 0);
        engine_world_apply_impulse(w, 0, 1., 2., 3.);
        engine_world_set_gravity(w, 0., -10., 0.);
        engine_world_set_bounds(w, -1., -1., 1., 1.);
        engine_world_set_listener(w, 0);
        assert_eq!(engine_world_read_position(w, 0, 0), 0);
        assert_eq!(engine_world_read_velocity(w, 0), 0);
        assert_eq!(engine_world_after(w, 1.), 0);
        assert_eq!(engine_world_cancel_timers(w), 0);
        assert_eq!(engine_world_scoreboard(w, 0, 0., 0.), 0.);
        assert!(engine_world_scoreboard_state(w).is_null());
        engine_world_update(w, 1.);
        assert_eq!(engine_world_capacity(w), 0);
        assert_eq!(engine_world_count(w), 0);
        assert!(engine_world_matrices(w).is_null());
        assert!(engine_world_colors(w).is_null());
        assert!(engine_world_regions(w).is_null());
        assert!(engine_world_ranges(w).is_null());
        assert!(engine_world_done(w).is_null());
        assert!(engine_world_events(w).is_null());
        assert!(engine_world_scratch(w).is_null());
        assert_eq!(engine_world_done_len(w), 0);
        assert_eq!(engine_world_event_len(w), 0);
        engine_world_set_view(w, ptr::null(), 100., 100.);
        assert_eq!(engine_world_screen_ray(w, 50., 50.), 0);
        assert_eq!(engine_world_screen_to_world(w, 50., 50., 0., 0., 0., 0., 1., 0.), 0);
        assert_eq!(engine_world_to_screen(w, 0., 0., 0.), 0);
        assert_eq!(engine_world_pick_screen(w, 0., 0.), NO_ENTITY);
        assert_eq!(engine_world_play_clip(w, 0, ptr::null(), 0, 0, 1., 0., 0.), 0);
        assert_eq!(engine_world_stop_clip(w, 0, 1), 0);
        let mut untouched = [42.; 3];
        assert_eq!(engine_world_skin_points(w, 0, ptr::null(), 1, untouched.as_mut_ptr(), 0.), 0);
        assert_eq!(untouched, [42.; 3]);
        engine_world_free(w);
    }
}

#[cfg(feature = "games")]
#[test]
fn world_abi_rejects_short_descriptions_and_keeps_fixed_buffers_valid_through_reuse() {
    let _guard = ABI.lock().unwrap();
    let world = OwnedWorld(engine_world_new(2));
    unsafe {
        let w = world.0;
        let matrices = engine_world_matrices(w);
        let mut desc = [0.; DESC_LEN];
        desc[0] = 2.; // position bit
        desc[2..5].copy_from_slice(&[1., 2., 3.]);
        assert_eq!(engine_world_spawn_desc(w, ptr::null(), DESC_LEN), NO_ENTITY);
        assert_eq!(engine_world_spawn_desc(w, desc.as_ptr(), DESC_LEN - 1), NO_ENTITY);
        let first = engine_world_spawn_desc(w, desc.as_ptr(), desc.len());
        assert_ne!(first, NO_ENTITY);
        engine_world_update(w, 0.);
        assert_eq!(engine_world_read_position(w, first, 0), 1);
        assert_eq!(std::slice::from_raw_parts(engine_world_scratch(w), 3), &[1., 2., 3.]);
        assert_eq!(engine_world_count(w), 1);
        assert_eq!(engine_world_capacity(w), 2);
        assert_eq!(engine_world_matrices(w), matrices);
        assert_eq!(std::slice::from_raw_parts(matrices.add(12), 3), &[1., 2., 3.]);
        assert_eq!(engine_world_despawn(w, first), 1);
        let second = engine_world_spawn_desc(w, desc.as_ptr(), desc.len());
        assert_ne!(second, first);
        assert_eq!(engine_world_set_desc(w, first, desc.as_ptr(), desc.len()), 0);
        assert_eq!(engine_world_read_position(w, first, 0), 0);
        assert_eq!(engine_world_play_clip(w, second, ptr::null(), 0, 1, 1., 0., 0.), 0);
        assert_eq!(engine_world_play_clip(w, second, [255u8].as_ptr(), 1, 1, 1., 0., 0.), 0);
        let timer = engine_world_after(w, 0.01);
        assert_ne!(timer, 0);
        engine_world_update(w, 0.05);
        assert!(std::slice::from_raw_parts(engine_world_done(w), engine_world_done_len(w) as usize).contains(&timer));
        engine_world_update(w, 0.05);
        assert_eq!(engine_world_done_len(w), 0);
    }
}

#[test]
fn invalid_asset_handles_and_payloads_do_not_overwrite_callers_memory() {
    let _guard = ABI.lock().unwrap();
    unsafe {
        let bad = u32::MAX;
        assert_eq!(engine_model_load(ptr::null(), 0, 0, 1.), -1);
        assert_eq!(engine_texture_load(ptr::null(), 0), -1);
        assert_eq!(engine_font_load(ptr::null(), 0, 0., ptr::null(), 0, 0.), -1);
        assert_eq!(engine_mesh_create(ptr::null(), 0, ptr::null(), 0), -1);
        assert_eq!(engine_model_load(b"invalid".as_ptr(), 7, 1, f32::NAN), -1);
        assert_eq!(engine_texture_load(b"invalid".as_ptr(), 7), -1);
        assert!(engine_model_vertices(bad).is_null());
        assert!(engine_model_indices(bad).is_null());
        assert_eq!(engine_model_vertex_count(bad), 0);
        assert_eq!(engine_model_index_count(bad), 0);
        assert_eq!(engine_model_texture(bad), -1);
        assert_eq!(engine_mesh_alias(bad), -1);
        assert!(engine_texture_pixels(bad).is_null());
        assert!(engine_font_glyphs(bad).is_null());
        assert_eq!(engine_font_glyph_floats(bad), 0);
        assert_eq!(engine_font_cap_height(bad), 0.7);
        let mut size = [42.; 3];
        assert_eq!(engine_model_size(bad, size.as_mut_ptr()), 0);
        assert_eq!(size, [42.; 3]);
        let mut pixels = [42u32; 2];
        assert_eq!(engine_texture_size(bad, pixels.as_mut_ptr()), 0);
        assert_eq!(pixels, [42; 2]);
        let mut message = [255u8; 4];
        let length = engine_load_error(ptr::null_mut(), 0);
        assert!(length > 3);
        assert_eq!(engine_load_error(message.as_mut_ptr(), message.len()), length);
        assert_eq!(message[3], 0);
        let length = engine_model_rig(bad, ptr::null_mut(), 0);
        let mut json = vec![0; length + 1];
        assert_eq!(engine_model_rig(bad, json.as_mut_ptr(), json.len()), length);
        let value: serde_json::Value = serde_json::from_slice(&json[..length]).unwrap();
        assert_eq!(value, serde_json::json!({"joints":0,"clips":[]}));
        assert_eq!(json[length], 0);
        assert_eq!(engine_audio_load_wav(ptr::null(), 0), -1);
        assert_eq!(engine_audio_load_wav(b"bad".as_ptr(), 3), -1);
        engine_haptics_play(ptr::null(), 0, 1);
    }
}

#[test]
fn cache_abi_rejects_invalid_keys_and_returns_owned_blobs_across_remove_and_clear() {
    let _guard = ABI.lock().unwrap();
    let root = std::env::temp_dir().join(format!("nayan-ffi-cache-{}", std::process::id()));
    std::fs::create_dir_all(&root).unwrap();
    let path = root.to_str().unwrap().as_bytes();
    unsafe {
        assert_eq!(engine_cache_directory(path.as_ptr(), path.len()), 1);
        let key = b"source:ffi";
        for invalid in [&b""[..], &[255u8][..]] {
            assert_eq!(engine_cache_write(invalid.as_ptr(), invalid.len(), b"data".as_ptr(), 4), 0);
            assert!(engine_cache_read(invalid.as_ptr(), invalid.len()).is_null());
            assert_eq!(engine_cache_remove(invalid.as_ptr(), invalid.len()), 0);
        }
        assert_eq!(engine_cache_directory(ptr::null(), 1), 0);
        assert_eq!(engine_cache_write(key.as_ptr(), key.len(), ptr::null(), 1), 0);
        assert_eq!(engine_cache_write(key.as_ptr(), key.len(), b"x".as_ptr(), 512 * 1024 * 1024 + 1), 0);
        assert_eq!(engine_cache_write(key.as_ptr(), key.len(), b"data".as_ptr(), 4), 1);
        let blob = engine_cache_read(key.as_ptr(), key.len());
        assert!(!blob.is_null());
        assert_eq!(engine_cache_size(blob), 4);
        assert_eq!(engine_cache_remove(key.as_ptr(), key.len()), 1);
        assert!(engine_cache_read(key.as_ptr(), key.len()).is_null());
        assert_eq!(engine_cache_clear(), 1);
        assert_eq!(std::slice::from_raw_parts(engine_cache_data(blob), 4), b"data");
        engine_cache_free(blob);
        assert_eq!(engine_cache_size(ptr::null()), 0);
        assert!(engine_cache_data(ptr::null()).is_null());
        engine_cache_free(ptr::null_mut());
    }
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn geometry_results_own_their_buffers_and_report_null_oversize_and_malformed_inputs() {
    let _guard = ABI.lock().unwrap();
    unsafe {
        assert_eq!(engine_geometry_size(ptr::null()), 0);
        assert!(engine_geometry_data(ptr::null()).is_null());
        assert!(!CStr::from_ptr(engine_geometry_error(ptr::null())).is_empty());
        engine_geometry_free(ptr::null_mut());
        let recipe = br#"{"solid":{"kind":"sphere","radius":0.75},"resolution":12}"#;
        let good = engine_geometry_solid(recipe.as_ptr(), recipe.len());
        let size = engine_geometry_size(good);
        assert!(size > 8);
        let snapshot = std::slice::from_raw_parts(engine_geometry_data(good), size / 4).to_vec();
        assert!(snapshot[0] > 0 && snapshot[1].is_multiple_of(3));
        assert_eq!(size / 4, 2 + snapshot[0] as usize * 11 + snapshot[1] as usize);
        for (data, length) in [(ptr::null(), 0), (b"x".as_ptr(), 1_000_001), (b"{}".as_ptr(), 2)] {
            let bad = engine_geometry_solid(data, length);
            assert_eq!(engine_geometry_size(bad), 0);
            assert!(!CStr::from_ptr(engine_geometry_error(bad)).is_empty());
            engine_geometry_free(bad);
        }
        for (floats, count) in [(1, 0), (44_000_001, 0), (0, 24_000_001)] {
            let bad = engine_geometry_optimize(ptr::null(), floats, ptr::null(), count, 1., 0.01, 1);
            assert_eq!(engine_geometry_size(bad), 0);
            assert!(!CStr::from_ptr(engine_geometry_error(bad)).is_empty());
            engine_geometry_free(bad);
        }
        assert_eq!(std::slice::from_raw_parts(engine_geometry_data(good), size / 4), snapshot);
        engine_geometry_free(good);
    }
}

#[cfg(feature = "sqlite")]
#[test]
fn sqlite_worker_keeps_owners_isolated_and_releases_in_queue_order() {
    use engine_core::ffi::sqlite::{engine_sqlite_release, engine_sqlite_submit};
    use serde_json::{Value, json};
    use std::{
        ffi::c_void,
        sync::mpsc::{self, Receiver, Sender},
        time::Duration,
    };

    extern "C" fn reply(context: *mut c_void, bytes: *const u8, length: usize) {
        // The receiver owns a copy of the reply, which is borrowed for this callback.
        let sender = unsafe { Box::from_raw(context.cast::<Sender<Value>>()) };
        let bytes = unsafe { std::slice::from_raw_parts(bytes, length) };
        let value = serde_json::from_slice(bytes).unwrap_or(Value::Null);
        let _ = sender.send(value);
    }
    fn submit(owner: usize, command: Value) -> Receiver<Value> {
        let (sender, receiver) = mpsc::channel::<Value>();
        let context = Box::into_raw(Box::new(sender));
        let data = serde_json::to_vec(&command).unwrap();
        let accepted = unsafe { engine_sqlite_submit(owner, data.as_ptr(), data.len(), context.cast(), reply) };
        if accepted == 0 {
            drop(unsafe { Box::from_raw(context) });
            panic!("SQLite worker rejected the test command");
        }
        receiver
    }
    let receive = |receiver: Receiver<Value>| receiver.recv_timeout(Duration::from_secs(5)).unwrap();
    let first_owner = 11;
    let second_owner = 12;
    let first_open = submit(first_owner, json!({ "op": "open" }));
    let second_open = submit(second_owner, json!({ "op": "open" }));
    let first = receive(first_open);
    let second = receive(second_open);
    assert_eq!(first["ok"], true);
    assert_eq!(second["ok"], true);

    let query = |handle: &Value, sql: &str| {
        json!({
            "op": "query", "handle": handle, "statement": { "sql": sql, "params": [] }
        })
    };
    let first_query = query(&first["value"], "SELECT 7");
    let queued = submit(first_owner, first_query.clone());
    engine_sqlite_release(first_owner);
    let released = submit(first_owner, first_query);
    let unaffected = submit(second_owner, query(&second["value"], "SELECT 9"));
    engine_sqlite_release(second_owner);

    assert_eq!(receive(queued)["value"]["rows"], json!([[7]]));
    assert_eq!(receive(released)["ok"], false);
    assert_eq!(receive(unaffected)["value"]["rows"], json!([[9]]));
}
