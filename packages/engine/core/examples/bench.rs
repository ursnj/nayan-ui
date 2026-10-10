//! `cargo run --release --example bench` — milliseconds per `update(1/60)` (fastest of 7 runs,
//! each on a freshly built world, so a busy machine skews it less).
use engine_core::{Animation, BodyKind, Burst, Easing, Entity, FIXED_DT, Keyframe, PhysicsDesc, Quat, Shape, Spring, Vec3, World};
use std::time::Instant;

const RUNS: usize = 7;

fn time(label: &str, build: impl Fn() -> World) {
    time_with(label, build, 30, 300, |_, _| {});
}

/// `frame` runs before every update (game code: bursts, steering).
fn time_with(label: &str, build: impl Fn() -> World, warmup: usize, iters: usize, mut frame: impl FnMut(&mut World, usize)) {
    let fastest = (0..RUNS)
        .map(|_| {
            let mut w = build();
            for f in 0..warmup {
                frame(&mut w, f);
                w.update(FIXED_DT);
            }
            let start = Instant::now();
            for f in 0..iters {
                frame(&mut w, warmup + f);
                w.update(FIXED_DT);
            }
            start.elapsed().as_secs_f64() * 1000.0 / iters as f64
        })
        .fold(f64::INFINITY, f64::min);
    println!("{label:<52} {fastest:.3} ms/update");
}

fn floor(w: &mut World, half: f32) {
    let floor = w.spawn(2, Vec3::new(0.0, -0.5, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
    let shape = Shape::Cuboid {
        half_extents: Vec3::new(half, 0.5, half),
    };
    w.set_physics(floor, Some(PhysicsDesc::new(BodyKind::Fixed, shape)));
}

/// A pile of dynamic boxes and balls on a floor.
fn pile() -> World {
    let mut w = World::new(1100);
    floor(&mut w, 40.0);
    for i in 0..1000 {
        let p = Vec3::new(
            (i % 20) as f32 * 1.1 - 11.0,
            1.0 + (i / 400) as f32 * 1.1,
            ((i / 20) % 20) as f32 * 1.1 - 11.0,
        );
        let e = w.spawn((i % 2) as u8, p, Vec3::ONE, [1.0; 4]).unwrap();
        let shape = if i % 2 == 0 {
            Shape::Cuboid {
                half_extents: Vec3::splat(0.5),
            }
        } else {
            Shape::Ball { radius: 0.5 }
        };
        w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, shape)));
    }
    w
}

fn main() {
    // No physics: transforms + output only.
    for n in [10_000usize, 100_000] {
        time(&format!("{n} spinning+bobbing cubes (no physics)"), || {
            let mut w = World::new(n);
            for i in 0..n {
                let e = w.spawn(0, Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
                w.set_angular_velocity(e, Vec3::new(0.0, 1.0, 0.0));
                w.set_oscillation(e, Vec3::new(0.0, 0.8, 0.0), 1.5, (i % 97) as f32 * 0.15);
            }
            w
        });
    }

    // 10000 static entities, many meshes, a third see-through: mostly grouping + output.
    time("10000 static, 40 meshes, 1/3 transparent", || {
        let mut w = World::new(10_000);
        for i in 0..10_000 {
            let alpha = if i % 3 == 0 { 0.5 } else { 1.0 };
            w.spawn((i * 7 % 40) as u8, Vec3::new((i % 100) as f32, 0.0, (i / 100) as f32), Vec3::ONE, [1.0, 1.0, 1.0, alpha]);
        }
        w
    });

    // Scene graph: 1000 spinning roots, each with a chain of 7 attached parts (depth 8).
    time("1000 spinning roots x 8-deep attachment chains", || {
        let mut w = World::new(8000);
        for r in 0..1000 {
            let root = w.spawn(0, Vec3::new((r % 40) as f32 * 3.0, 0.0, (r / 40) as f32 * 3.0), Vec3::ONE, [1.0; 4]).unwrap();
            w.set_angular_velocity(root, Vec3::new(0.0, 1.0, 0.0));
            let mut parent = root;
            for d in 0..7 {
                let c = w.spawn(1, Vec3::new(0.0, 1.0, 0.0), Vec3::splat(0.9), [1.0; 4]).unwrap();
                w.set_rotation(c, Quat::from_rotation_z(0.1 * d as f32));
                w.set_parent(c, Some(parent));
                parent = c;
            }
        }
        w
    });

    // Particles: a 60-particle burst every frame, 1 s lifetimes (~3000 alive, ~60 expiring per frame).
    let burst = Burst {
        position: Vec3::ZERO,
        direction: Vec3::Y,
        spread: 0.8,
        count: 60,
        mesh: 1,
        size: 0.1,
        speed: 6.0,
        lifetime: 1.0,
        gravity: -9.81,
        colors: vec![[1.0, 0.5, 0.0, 1.0], [1.0, 1.0, 0.0, 0.8]],
    };
    time_with("particles: 60/frame burst, 1 s life (~3000 alive)", || World::new(5000), 90, 300, |w, _| {
        w.burst(&burst);
    });

    // No warm-up and only the first second: bodies are falling and colliding, not asleep.
    time_with("1000 dynamic bodies falling + piling (1st s)", pile, 0, 60, |_, _| {});
    // The same pile after it has come to rest (most bodies asleep).
    time_with("1000 dynamic bodies at rest (after 8 s)", pile, 480, 120, |_, _| {});

    // Game-like: dynamic player, 300 dynamic chasers, 300 sensor orbs, walls.
    time("game mix: 300 dynamic chasers + 300 sensors", || {
        let mut w = World::new(1000);
        floor(&mut w, 60.0);
        let player = w.spawn(1, Vec3::new(0.0, 0.5, 0.0), Vec3::ONE, [1.0; 4]).unwrap();
        let mut pd = PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 });
        pd.layer = 1;
        pd.mask = 6;
        w.set_physics(player, Some(pd));
        for i in 0..300 {
            let a = i as f32 * 0.7;
            let e = w.spawn(0, Vec3::new(a.cos() * 40.0, 0.5, a.sin() * 40.0), Vec3::ONE, [1.0; 4]).unwrap();
            let mut d = PhysicsDesc::new(
                BodyKind::Dynamic,
                Shape::Cuboid {
                    half_extents: Vec3::splat(0.5),
                },
            );
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
        w
    });

    // Animations: every entity runs a looping keyframed hop (move + turn + scale) in Rust.
    time("10000 entities with keyframe animations", || {
        let mut w = World::new(10_000);
        let all: Vec<Entity> = (0..10_000)
            .map(|i| w.spawn(0, Vec3::new((i % 100) as f32, 0.0, (i / 100) as f32), Vec3::ONE, [1.0; 4]).unwrap())
            .collect();
        let hop = |y: f32| Keyframe {
            move_by: Some(Vec3::new(0.0, y, 0.0)),
            ..Default::default()
        };
        w.animate(&Animation {
            entities: all,
            keys: vec![
                hop(1.0),
                Keyframe {
                    turn: Some(Vec3::new(0.0, 6.0, 0.0)),
                    scale: Some(Vec3::splat(1.3)),
                    ..hop(0.0)
                },
            ],
            duration: 1.0,
            delay: 0.0,
            easing: Easing::InOut,
            repeat: -1,
            yoyo: true,
            stagger: 0.0001,
            smooth: true,
            spring: None,
        });
        w
    });

    let springs = || {
        let mut w = World::new(1000);
        let all: Vec<Entity> = (0..1000).map(|i| w.spawn(0, Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE, [1.0; 4]).unwrap()).collect();
        w.animate(&Animation {
            entities: all,
            keys: vec![Keyframe {
                move_by: Some(Vec3::new(5.0, 0.0, 0.0)),
                ..Default::default()
            }],
            duration: 0.0,
            delay: 0.0,
            easing: Easing::Linear,
            repeat: 0,
            yoyo: false,
            stagger: 0.0,
            smooth: false,
            spring: Some(Spring {
                stiffness: 120.0,
                damping: 4.0, // barely damped: keeps moving for the whole measurement
                mass: 1.0,
            }),
        });
        w
    };
    time_with("1000 entities on springs", springs, 5, 100, |_, _| {});
}
