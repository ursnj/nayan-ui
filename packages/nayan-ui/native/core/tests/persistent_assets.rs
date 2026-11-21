//! Real app-private files, fresh core registrations and explicit user clearing.
use engine_core::{
    assets::{cache, model, prepared},
    ffi::cache::*,
};

#[test]
fn durable_records_restore_prepared_geometry_and_clear_without_invalidating_live_handles() {
    let parent = std::env::temp_dir().join(format!("nayan-durable-{}", std::process::id()));
    std::fs::create_dir_all(&parent).unwrap();
    let settings = parent.join("app-settings.json");
    std::fs::write(&settings, b"keep").unwrap();
    cache::set_directory(parent.to_str().unwrap()).unwrap();
    let root = parent.join("nayan-engine-assets-v1");
    let custom = root.join("unrelated.txt");
    std::fs::write(&custom, b"keep").unwrap();
    for i in 0..150 {
        cache::write(&format!("source:{i}"), &[i as u8]).unwrap();
    }
    assert_eq!(cache::read("source:0"), Some(vec![0]));
    // A cold prepared registry must accept the persisted geometry, without invoking tessellation.
    let recipe = br#"{"resolution":16,"solid":{"kind":"sphere","radius":0.67}}"#;
    let options = b"{}";
    let canonical = serde_json::to_vec(&serde_json::from_slice::<serde_json::Value>(recipe).unwrap()).unwrap();
    let key = format!("prepared-solid-v1:{}", cache::fingerprint(&[&canonical, options]));
    let vertices = [
        0., 0., 0., 0., 0., 1., 1., 1., 1., 0., 0., 2., 0., 0., 0., 0., 1., 1., 1., 1., 1., 0., 0., 2., 0., 0., 0., 1., 1., 1., 1., 0., 1.,
    ];
    let mut geometry = Vec::new();
    geometry.extend_from_slice(&33u32.to_le_bytes());
    geometry.extend_from_slice(&3u32.to_le_bytes());
    for value in vertices {
        geometry.extend_from_slice(&f32::to_le_bytes(value));
    }
    for index in [0u32, 1, 2] {
        geometry.extend_from_slice(&index.to_le_bytes());
    }
    cache::write(&key, &geometry).unwrap();
    let mesh = prepared::solid(recipe, options).unwrap();
    assert_eq!(
        model::get(mesh).unwrap().vertices.len(),
        33,
        "used saved triangle instead of generating the sphere"
    );
    let source = b"source:149";
    unsafe {
        let record = engine_cache_read(source.as_ptr(), source.len());
        assert!(!record.is_null());
        assert_eq!(engine_cache_clear(), 1);
        assert_eq!(std::slice::from_raw_parts(engine_cache_data(record), engine_cache_size(record)), &[149]);
        engine_cache_free(record);
    }
    assert!(cache::read("source:0").is_none());
    assert!(cache::read(&key).is_none());
    assert_eq!(model::get(mesh).unwrap().vertices.len(), 33, "clearing storage keeps live worlds safe");
    assert_eq!(std::fs::read(settings).unwrap(), b"keep");
    assert_eq!(std::fs::read(custom).unwrap(), b"keep");
    std::fs::remove_dir_all(parent).unwrap();
}
