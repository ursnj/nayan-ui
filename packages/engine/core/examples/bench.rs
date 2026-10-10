//! `cargo run --release --example bench`
//! Time per `update()` for (a) 10k/100k spinning+bobbing cubes and (b) a game-like mix with
//! chasers and colliders.
use engine_core::World;
use glam::Vec3;
use std::time::Instant;

fn time(label: &str, w: &mut World) {
    for _ in 0..20 {
        w.update(1.0 / 60.0);
    }
    let iters = 300;
    let start = Instant::now();
    for _ in 0..iters {
        w.update(1.0 / 60.0);
    }
    let per = start.elapsed().as_secs_f64() * 1000.0 / iters as f64;
    println!("{label:<34} {per:.3} ms/update");
}

fn main() {
    for n in [10_000usize, 100_000] {
        let mut w = World::new(n);
        for i in 0..n {
            let e = w.spawn(0, Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
            w.set_angular_velocity(e, Vec3::new(0.0, 1.0, 0.0));
            w.set_oscillation(e, Vec3::new(0.0, 0.8, 0.0), 1.5, (i % 97) as f32 * 0.15);
        }
        time(&format!("{n} spinning+bobbing cubes"), &mut w);
    }

    // Game-like: one player, 500 chasers, 500 orbs, all with colliders (O(n^2) pair checks).
    let mut w = World::new(2000);
    let player = w.spawn(1, Vec3::ZERO, Vec3::ONE, [1.0; 4]).unwrap();
    w.set_collider(player, 0.5, 1, 6);
    for i in 0..500 {
        let a = i as f32 * 0.7;
        let e = w.spawn(0, Vec3::new(a.cos() * 40.0, 0.0, a.sin() * 40.0), Vec3::ONE, [1.0; 4]).unwrap();
        w.set_follow(e, player, 3.0);
        w.set_collider(e, 0.5, 4, 0);
        let o = w.spawn(1, Vec3::new(a.sin() * 30.0, 0.0, a.cos() * 30.0), Vec3::ONE, [1.0; 4]).unwrap();
        w.set_collider(o, 0.3, 2, 0);
    }
    time("game mix: 1001 colliders + 500 chasers", &mut w);
}
