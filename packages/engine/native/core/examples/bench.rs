//! `cargo run --release --example bench` — milliseconds per `update(1/60)` (fastest of 7 runs,
//! each on a freshly built world, so a busy machine skews it less). An argument runs only the
//! scenarios whose label contains it: `cargo run --release --example bench -- particles`.
use engine_core::drawing::Document;
use engine_core::{Animation, BodyKind, Burst, Easing, Entity, FIXED_DT, Keyframe, PhysicsDesc, Quat, Shape, Spring, Vec3, World};
use serde_json::{Value, json};
use std::time::Instant;

const RUNS: usize = 7;

fn time(label: &str, build: impl Fn() -> World) {
    time_with(label, build, 30, 300, |_, _| {});
}

/// `frame` runs before every update (game code: bursts, steering).
fn time_with(label: &str, build: impl Fn() -> World, warmup: usize, iters: usize, mut frame: impl FnMut(&mut World, usize)) {
    if std::env::args().nth(1).is_some_and(|filter| !label.contains(&filter)) {
        return;
    }
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

/// Milliseconds per call of `run` (fastest of `RUNS`), each run on freshly built state.
fn time_op<S>(label: &str, build: impl Fn() -> S, iters: usize, mut run: impl FnMut(&mut S)) {
    if std::env::args().nth(1).is_some_and(|filter| !label.contains(&filter)) {
        return;
    }
    let fastest = (0..RUNS)
        .map(|_| {
            let mut state = build();
            run(&mut state);
            let start = Instant::now();
            for _ in 0..iters {
                run(&mut state);
            }
            start.elapsed().as_secs_f64() * 1000.0 / iters as f64
        })
        .fold(f64::INFINITY, f64::min);
    println!("{label:<52} {fastest:.3} ms/op");
}

/// A curvy 200-sample gesture across a 1024 x 1024 document.
fn gesture(seed: usize) -> impl Iterator<Item = (f32, f32)> {
    (0..200).map(move |i| {
        let t = i as f32 / 199.0;
        let s = seed as f32 * 0.37;
        (80.0 + t * 860.0, 512.0 + (t * 9.0 + s).sin() * (300.0 - (seed % 7) as f32 * 30.0))
    })
}

/// SVG strokes for replay: 200 of them, each a 40-segment polyline.
fn strokes(layers: &[u32]) -> Vec<Value> {
    (0..200)
        .map(|k| {
            let mut d = String::new();
            for (i, (x, y)) in gesture(k).step_by(5).enumerate() {
                d.push_str(&format!("{}{x:.1} {y:.1} ", if i == 0 { "M" } else { "L" }));
            }
            json!({"path":d,"color":format!("#{:06x}", k * 0x0a1b2c % 0xffffff),"width":4 + k % 12,"opacity":0.8,"style":"stroke","layerId":layers[k % layers.len()]})
        })
        .collect()
}

fn drawing(layers: &[u32]) -> Document {
    let mut d = Document::new(1024.0, 1024.0, 1.0).unwrap();
    let paths = strokes(layers);
    let project = if layers.len() == 1 {
        json!(paths)
    } else {
        let layers: Vec<Value> = layers
            .iter()
            .map(|&id| json!({"id":id,"name":"layer","visible":true,"locked":false,"opacity":0.9}))
            .collect();
        json!({"version":2,"layers":layers,"activeLayer":0,"paths":paths})
    };
    d.command(json!({"op":"load","paths":project})).unwrap();
    d
}

fn drawing_benches() {
    for brush in ["NORMAL", "NEON"] {
        time_op(
            &format!("drawing: {brush} stroke preview, 200 samples (1024^2)"),
            || {
                let mut d = Document::new(1024.0, 1024.0, 1.0).unwrap();
                d.command(json!({"op":"texture"})).unwrap();
                d.command(json!({"op":"brush","brushType":brush,"color":"#3366cc","width":12,"opacity":0.8}))
                    .unwrap();
                d
            },
            10,
            |d| {
                for (i, (x, y)) in gesture(3).enumerate() {
                    d.touch_document(if i == 0 { 0 } else { 1 }, x, y, 1.0);
                    d.sync_texture();
                }
                d.touch_document(2, 940.0, 512.0, 1.0);
                d.sync_texture();
                d.command(json!({"op":"undo"})).unwrap();
            },
        );
    }
    for layers in [&[0][..], &[0, 1, 2]] {
        time_op(
            &format!("drawing: undo+redo, 200 strokes, {} layer(s) (1024^2)", layers.len()),
            || {
                let mut d = drawing(layers);
                d.command(json!({"op":"brush","brushType":"NORMAL","color":"#000000","width":3,"opacity":1}))
                    .unwrap();
                d.touch_document(0, 10.0, 10.0, 1.0);
                d.touch_document(2, 20.0, 20.0, 1.0);
                d
            },
            10,
            |d| {
                d.command(json!({"op":"undo"})).unwrap();
                d.command(json!({"op":"redo"})).unwrap();
            },
        );
    }
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
        let e = w.spawn((i % 2) as engine_core::MeshId, p, Vec3::ONE, [1.0; 4]).unwrap();
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

/// Moves, turns and scales `entities` (3 tracks each) over `duration` seconds.
fn tween(entities: Vec<Entity>, duration: f32, repeat: i32) -> Animation {
    Animation {
        entities,
        keys: vec![Keyframe {
            move_by: Some(Vec3::new(0.0, 1.0, 0.0)),
            turn: Some(Vec3::new(0.0, 3.0, 0.0)),
            scale: Some(Vec3::splat(1.3)),
            ..Default::default()
        }],
        duration,
        delay: 0.0,
        easing: Easing::InOut,
        repeat,
        yoyo: true,
        stagger: 0.0,
        smooth: false,
        spring: None,
    }
}

fn main() {
    drawing_benches();

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
            w.spawn(
                (i * 7 % 40) as engine_core::MeshId,
                Vec3::new((i % 100) as f32, 0.0, (i / 100) as f32),
                Vec3::ONE,
                [1.0, 1.0, 1.0, alpha],
            );
        }
        w
    });

    // Scene graph: 1000 spinning roots, each with a chain of 7 attached parts (depth 8).
    time("1000 spinning roots x 8-deep attachment chains", || {
        let mut w = World::new(8000);
        for r in 0..1000 {
            let root = w
                .spawn(0, Vec3::new((r % 40) as f32 * 3.0, 0.0, (r / 40) as f32 * 3.0), Vec3::ONE, [1.0; 4])
                .unwrap();
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
        end_size: 1.0,
        end_color: None,
    };
    time_with(
        "particles: 60/frame burst, 1 s life (~3000 alive)",
        || World::new(5000),
        90,
        300,
        |w, _| {
            w.burst(&burst);
        },
    );

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
            .map(|i| {
                w.spawn(0, Vec3::new((i % 100) as f32, 0.0, (i / 100) as f32), Vec3::ONE, [1.0; 4])
                    .unwrap()
            })
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

    // One-shot tweens on 10000 entities that all end in the measured second (3 tracks each).
    time_with(
        "10000 one-shot tweens ending together (1st s)",
        || {
            let mut w = World::new(10_000);
            let all: Vec<Entity> = (0..10_000)
                .map(|i| w.spawn(0, Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE, [1.0; 4]).unwrap())
                .collect();
            w.animate(&tween(all, 0.5, 0));
            w
        },
        0,
        60,
        |_, _| {},
    );

    // UI-like: 2000 entities looping a tween while particles expire around them (despawns must not
    // search every animation track).
    time_with(
        "2000 looping tweens + 60/frame particle bursts",
        || {
            let mut w = World::new(6000);
            let all: Vec<Entity> = (0..2000)
                .map(|i| w.spawn(0, Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE, [1.0; 4]).unwrap())
                .collect();
            w.animate(&tween(all, 1.0, -1));
            w
        },
        90,
        300,
        |w, _| {
            w.burst(&burst);
        },
    );

    let springs = || {
        let mut w = World::new(1000);
        let all: Vec<Entity> = (0..1000)
            .map(|i| w.spawn(0, Vec3::new(i as f32, 0.0, 0.0), Vec3::ONE, [1.0; 4]).unwrap())
            .collect();
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
