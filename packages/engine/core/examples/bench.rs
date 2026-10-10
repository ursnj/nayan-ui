//! `cargo run --release --example bench` — time per `update()` with every entity spinning and bobbing.
use engine_core::World;
use glam::Vec3;
use std::time::Instant;

fn main() {
    for n in [10_000usize, 100_000] {
        let mut w = World::with_capacity(n);
        for i in 0..n {
            let e = w.spawn(Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE);
            w.set_angular_velocity(e, Vec3::new(0.0, 1.0, 0.0));
            w.set_oscillation(e, Vec3::new(0.0, 0.8, 0.0), 1.5, (i % 97) as f32 * 0.15);
        }
        for _ in 0..20 {
            w.update(1.0 / 60.0);
        }
        let iters = 300;
        let start = Instant::now();
        for _ in 0..iters {
            w.update(1.0 / 60.0);
        }
        let per = start.elapsed().as_secs_f64() * 1000.0 / iters as f64;
        println!("{n:>7} entities: {per:.3} ms/update");
    }
}
