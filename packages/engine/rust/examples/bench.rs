//! `cargo run --release --example bench` — milliseconds per `update(1/60)`.
use engine_core::{BodyKind, FIXED_DT, PhysicsDesc, Shape, Vec3, World};
use std::time::Instant;

fn time(label: &str, w: &mut World) {
    time_with(label, w, 30, 300);
}

fn time_with(label: &str, w: &mut World, warmup: usize, iters: usize) {
    for _ in 0..warmup {
        w.update(FIXED_DT);
    }
    let start = Instant::now();
    for _ in 0..iters {
        w.update(FIXED_DT);
    }
    let per = start.elapsed().as_secs_f64() * 1000.0 / iters as f64;
    println!("{label:<44} {per:.3} ms/update");
}

fn main() {
    // No physics: transforms + output only.
    for n in [10_000usize, 100_000] {
        let mut w = World::new(n);
        for i in 0..n {
            let e = w.spawn(0, Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
            w.set_angular_velocity(e, Vec3::new(0.0, 1.0, 0.0));
            w.set_oscillation(e, Vec3::new(0.0, 0.8, 0.0), 1.5, (i % 97) as f32 * 0.15);
        }
        time(&format!("{n} spinning+bobbing cubes (no physics)"), &mut w);
    }

    // Physics: a pile of dynamic boxes and balls on a floor.
    let mut w = World::new(1100);
    let floor = w.spawn(2, Vec3::new(0.0, -0.5, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
    w.set_physics(floor, Some(PhysicsDesc::new(BodyKind::Fixed, Shape::Cuboid { half_extents: Vec3::new(40.0, 0.5, 40.0) })));
    for i in 0..1000 {
        let p = Vec3::new((i % 20) as f32 * 1.1 - 11.0, 1.0 + (i / 400) as f32 * 1.1, ((i / 20) % 20) as f32 * 1.1 - 11.0);
        let e = w.spawn((i % 2) as u8, p, Vec3::ONE, [1.0; 4]).unwrap();
        let shape = if i % 2 == 0 { Shape::Cuboid { half_extents: Vec3::splat(0.5) } } else { Shape::Ball { radius: 0.5 } };
        w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, shape)));
    }
    // No warm-up and only the first second: bodies are falling and colliding, not asleep.
    time_with("1000 dynamic bodies falling + piling (1st s)", &mut w, 0, 60);

    // Game-like: dynamic player, 300 dynamic chasers, 300 sensor orbs, walls.
    let mut w = World::new(1000);
    let floor = w.spawn(2, Vec3::new(0.0, -0.5, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
    w.set_physics(floor, Some(PhysicsDesc::new(BodyKind::Fixed, Shape::Cuboid { half_extents: Vec3::new(60.0, 0.5, 60.0) })));
    let player = w.spawn(1, Vec3::new(0.0, 0.5, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
    let mut pd = PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 });
    pd.layer = 1;
    pd.mask = 6;
    w.set_physics(player, Some(pd));
    for i in 0..300 {
        let a = i as f32 * 0.7;
        let e = w.spawn(0, Vec3::new(a.cos() * 40.0, 0.5, a.sin() * 40.0), Vec3::ONE, [1.0; 4]).unwrap();
        let mut d = PhysicsDesc::new(BodyKind::Dynamic, Shape::Cuboid { half_extents: Vec3::splat(0.5) });
        d.layer = 4;
        d.lock_rotations = true;
        w.set_physics(e, Some(d));
        w.set_follow(e, player, 3.0);
        let o = w.spawn(1, Vec3::new(a.sin() * 30.0, 0.7, a.cos() * 30.0), Vec3::ONE, [1.0; 4]).unwrap();
        let mut od = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.4 });
        od.layer = 2;
        od.mask = 0;
        od.sensor = true;
        w.set_physics(o, Some(od));
    }
    time("game mix: 300 dynamic chasers + 300 sensors", &mut w);
}
