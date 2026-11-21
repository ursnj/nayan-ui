//! Run from the repo root: cargo run --release --manifest-path packages/engine/native/core/Cargo.toml --example storage_bench
//! Native core only: excludes JSI/React and is not a react-native-mmkv/device benchmark.
use engine_core::storage;
use serde_json::json;
use std::{hint::black_box, time::Instant};
const BACKEND: &str = "mmap-buffered";
fn flush() {
    let result: serde_json::Value = serde_json::from_str(&storage::request(r#"{"op":"flush"}"#)).unwrap();
    assert!(result.get("error").is_none(), "{result}");
}
fn median(iterations: usize, mut run: impl FnMut(usize)) -> f64 {
    let mut times = Vec::new();
    for _ in 0..3 {
        let start = Instant::now();
        for i in 0..iterations {
            run(i);
        }
        times.push(start.elapsed().as_secs_f64() * 1_000_000.0 / iterations as f64);
    }
    times.sort_by(f64::total_cmp);
    times[1]
}
fn main() {
    let root = std::env::temp_dir().join(format!("nayan-storage-bench-{}", std::process::id()));
    storage::set_directory(root.to_str().unwrap()).unwrap();
    let result: serde_json::Value = serde_json::from_str(&storage::request(r#"{"op":"open","id":"bench"}"#)).unwrap();
    let handle = result["value"].as_u64().unwrap() as u32;
    let keys: Vec<_> = (0..128).map(|i| format!("key-{i}")).collect();
    let mut results = Vec::new();
    for size in [96, 4096] {
        let mut value = vec![b'x'; size];
        value[0] = 1;
        for key in &keys {
            storage::write(handle, key, &value).unwrap();
        }
        flush();
        let read = median(100_000, |i| {
            black_box(storage::read(handle, &keys[i % keys.len()]).unwrap());
        });
        let mut version = 0usize;
        let set = median(2000, |i| {
            version += 1;
            value[1] = b'a' + (version % 26) as u8;
            storage::write(handle, &keys[i % keys.len()], &value).unwrap();
        });
        flush();
        let durable = median(100, |i| {
            version += 1;
            value[1] = b'a' + (version % 26) as u8;
            storage::write(handle, &keys[i % keys.len()], &value).unwrap();
            flush();
        });
        results.push(json!({ "bytes": size, "read_us": read, "set_us": set, "set_and_flush_us": durable }));
    }
    println!("{}", json!({ "backend": BACKEND, "median_of": 3, "results": results }));
    flush();
    let _ = std::fs::remove_dir_all(root);
}
