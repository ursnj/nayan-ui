use super::*;
use std::f32::consts::FRAC_PI_2;

const WHITE: [f32; 4] = [1.0; 4];

fn close(a: f32, b: f32, eps: f32) -> bool {
    (a - b).abs() < eps
}

fn spawn(w: &mut World, mesh: u8, p: Vec3) -> Entity {
    w.spawn(mesh, p, Vec3::ONE, WHITE).unwrap()
}

/// Runs whole fixed steps covering `seconds`.
fn run(w: &mut World, seconds: f32) {
    for _ in 0..(seconds / FIXED_DT).round() as usize {
        w.update(FIXED_DT);
    }
}

fn events(w: &World) -> Vec<(u32, u32, u32, f32)> {
    w.events()
        .chunks(EVENT_STRIDE)
        .map(|e| (e[0], e[1], e[2], f32::from_bits(e[3])))
        .collect()
}

fn floor(w: &mut World) -> Entity {
    let f = spawn(w, 2, Vec3::new(0.0, -0.5, 0.0));
    assert!(w.set_physics(
        f,
        Some(PhysicsDesc::new(
            BodyKind::Fixed,
            Shape::Cuboid {
                half_extents: Vec3::new(50.0, 0.5, 50.0)
            }
        ))
    ));
    f
}

// ── entities & rendering ──

#[test]
fn spawn_writes_transform_and_color() {
    let mut w = World::new(4);
    let e = w.spawn(0, Vec3::new(1.0, 2.0, 3.0), Vec3::splat(2.0), [0.1, 0.2, 0.3, 1.0]).unwrap();
    assert!(w.is_alive(e));
    w.update(0.0);
    let m = w.matrices();
    assert_eq!([m[0], m[5], m[10]], [2.0, 2.0, 2.0]);
    assert_eq!([m[12], m[13], m[14], m[15]], [1.0, 2.0, 3.0, 1.0]);
    assert_eq!(&w.colors()[0..4], &[0.1, 0.2, 0.3, 1.0]);
}

#[test]
fn spawn_rejects_full_world_and_non_finite_input() {
    let mut w = World::new(2);
    assert!(w.spawn(0, Vec3::new(f32::NAN, 0.0, 0.0), Vec3::ONE, WHITE).is_none());
    assert!(w.spawn(0, Vec3::ZERO, Vec3::splat(f32::INFINITY), WHITE).is_none());
    assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_some());
    assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_some());
    assert!(w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).is_none());
}

#[test]
fn despawn_invalidates_handle_even_after_slot_reuse() {
    let mut w = World::new(4);
    let a = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
    let b = spawn(&mut w, 0, Vec3::new(2.0, 0.0, 0.0));
    assert!(w.despawn(a));
    assert!(!w.despawn(a), "double despawn is a no-op");
    assert_eq!(w.position(b), Some(Vec3::new(2.0, 0.0, 0.0)), "swap-remove keeps other handles valid");

    let c = spawn(&mut w, 0, Vec3::new(9.0, 0.0, 0.0)); // reuses a's slot
    assert_ne!(a, c);
    assert!(!w.is_alive(a), "stale handle must not alias the new entity");
    w.set_position(a, Vec3::ZERO);
    assert_eq!(w.position(c), Some(Vec3::new(9.0, 0.0, 0.0)));
    assert!(!w.is_alive(Entity(NO_ENTITY)));
}

#[test]
fn output_is_bucketed_by_mesh() {
    let mut w = World::new(8);
    spawn(&mut w, 1, Vec3::new(10.0, 0.0, 0.0));
    spawn(&mut w, 0, Vec3::new(20.0, 0.0, 0.0));
    spawn(&mut w, 1, Vec3::new(11.0, 0.0, 0.0));
    spawn(&mut w, 2, Vec3::new(30.0, 0.0, 0.0));
    w.update(0.0);
    let r = w.ranges();
    assert_eq!([r[0], r[1], r[2], r[3], r[4], r[5]], [0, 1, 1, 2, 3, 1]);
    let x = |k: usize| w.matrices()[k * 16 + 12];
    assert_eq!([x(0), x(1), x(2), x(3)], [20.0, 10.0, 11.0, 30.0]);
}

#[test]
fn buffers_never_move_under_churn() {
    let mut w = World::new(8);
    floor(&mut w);
    let (m, c, ev) = (w.matrices().as_ptr(), w.colors().as_ptr(), w.events().as_ptr());
    let mut live = Vec::new();
    for round in 0..100 {
        while let Some(e) = w.spawn(1, Vec3::new(0.0, 1.0 + round as f32 * 0.01, 0.0), Vec3::ONE, WHITE) {
            w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
            live.push(e);
        }
        for e in live.drain(..3) {
            w.despawn(e);
        }
        w.update(FIXED_DT);
    }
    assert_eq!((w.matrices().as_ptr(), w.colors().as_ptr(), w.events().as_ptr()), (m, c, ev));
}

// ── kinematic motion ──

#[test]
fn spin_rotates_about_y() {
    let mut w = World::new(1);
    let e = spawn(&mut w, 0, Vec3::ZERO);
    w.set_angular_velocity(e, Vec3::new(0.0, FRAC_PI_2, 0.0));
    // Rendering trails the simulation by one step (it blends previous -> current), so run one
    // extra step for the drawn transform to show a full second: a quarter turn, +X maps to -Z.
    run(&mut w, 1.0 + FIXED_DT);
    let m = w.matrices();
    assert!(close(m[0], 0.0, 1e-3) && close(m[2], -1.0, 1e-3), "x axis: {:?}", &m[0..3]);
}

#[test]
fn oscillation_offsets_output_but_not_position() {
    let mut w = World::new(1);
    let e = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
    w.set_oscillation(e, Vec3::new(0.0, 2.0, 0.0), FRAC_PI_2, 0.0);
    run(&mut w, 1.0); // phase = pi/2 -> sin = 1
    assert!(close(w.matrices()[13], 2.0, 1e-3));
    assert_eq!(w.position(e), Some(Vec3::new(1.0, 0.0, 0.0)));
}

#[test]
fn velocity_moves_and_bounds_clamp() {
    let mut w = World::new(1);
    let e = spawn(&mut w, 0, Vec3::ZERO);
    w.set_bounds(Vec3::new(-5.0, 0.0, -5.0), Vec3::new(5.0, 0.0, 5.0));
    w.set_velocity(e, Vec3::new(3.0, 0.0, 0.0));
    run(&mut w, 1.0);
    assert!(close(w.position(e).unwrap().x, 3.0, 1e-3));
    run(&mut w, 1.0);
    assert!(close(w.position(e).unwrap().x, 5.0, 1e-3), "clamped at the arena edge");
}

#[test]
fn follow_steers_toward_target_and_stops_when_it_is_gone() {
    let mut w = World::new(2);
    let chaser = spawn(&mut w, 0, Vec3::ZERO);
    let target = spawn(&mut w, 0, Vec3::new(10.0, 0.0, 0.0));
    w.set_follow(chaser, target, 2.0);
    run(&mut w, 1.0);
    assert!(close(w.position(chaser).unwrap().x, 2.0, 1e-3));
    w.despawn(target);
    run(&mut w, 1.0);
    assert!(close(w.position(chaser).unwrap().x, 2.0, 1e-3), "no target, no movement");
}

#[test]
fn render_output_interpolates_between_steps() {
    let mut w = World::new(1);
    let e = spawn(&mut w, 0, Vec3::ZERO);
    w.set_velocity(e, Vec3::new(60.0, 0.0, 0.0)); // 1 unit per step
    w.update(FIXED_DT); // one step: prev = 0, current = 1
    w.update(FIXED_DT * 0.5); // no new step: drawn half way between prev (0) and current (1)
    assert!(close(w.matrices()[12], 0.5, 1e-3), "{}", w.matrices()[12]);
    assert!(close(w.position(e).unwrap().x, 1.0, 1e-3), "simulation state is not interpolated");
}

#[test]
fn non_finite_dt_and_inputs_are_ignored() {
    let mut w = World::new(1);
    let e = spawn(&mut w, 0, Vec3::ZERO);
    w.set_velocity(e, Vec3::new(f32::NAN, 0.0, 0.0));
    w.set_position(e, Vec3::new(f32::INFINITY, 0.0, 0.0));
    w.update(f32::NAN);
    w.update(-1.0);
    assert_eq!(w.position(e), Some(Vec3::ZERO));
}

#[test]
fn lifetime_despawns_and_shrinks() {
    let mut w = World::new(4);
    let keep = spawn(&mut w, 0, Vec3::ZERO);
    let short = spawn(&mut w, 0, Vec3::X);
    let with_body = spawn(&mut w, 1, Vec3::Y);
    w.set_physics(with_body, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
    w.set_lifetime(short, 0.5);
    w.set_lifetime(with_body, 0.5);
    run(&mut w, 0.4);
    assert!(w.is_alive(short));
    let short_scale = w.matrices()[16]; // entity 1 (mesh 0, second instance): x scale
    assert!(short_scale < 1.0 && short_scale > 0.0, "shrinking: {short_scale}");
    run(&mut w, 0.2);
    assert!(!w.is_alive(short) && !w.is_alive(with_body));
    assert!(w.is_alive(keep));
    assert_eq!(w.physics.bodies.len(), 0, "expired bodies are removed from physics");
}

#[test]
fn children_follow_the_parents_interpolated_pose() {
    let mut w = World::new(4);
    let parent = spawn(&mut w, 0, Vec3::ZERO);
    let child = spawn(&mut w, 1, Vec3::new(1.0, 0.0, 0.0)); // local offset
    assert!(w.set_parent(child, Some(parent)));
    w.set_rotation(parent, Quat::from_rotation_y(FRAC_PI_2)); // +X local -> -Z world
    w.set_velocity(parent, Vec3::new(60.0, 0.0, 0.0)); // 1 unit per step
    w.update(FIXED_DT);
    w.update(FIXED_DT * 0.5); // parent drawn at x = 0.5
    let r = w.ranges();
    let parent_x = w.matrices()[r[0] as usize * 16 + 12];
    let c = r[2] as usize * 16;
    let (cx, cz) = (w.matrices()[c + 12], w.matrices()[c + 14]);
    assert!(close(parent_x, 0.5, 1e-3));
    assert!(
        close(cx, 0.5, 1e-3) && close(cz, -1.0, 1e-3),
        "child at parent + rotated offset: {cx}, {cz}"
    );
    assert_eq!(w.position(child), Some(Vec3::new(1.0, 0.0, 0.0)), "child state stays local");
}

#[test]
fn despawning_a_parent_despawns_its_children() {
    let mut w = World::new(4);
    let parent = spawn(&mut w, 0, Vec3::ZERO);
    let a = spawn(&mut w, 0, Vec3::X);
    let b = spawn(&mut w, 0, Vec3::Y);
    let other = spawn(&mut w, 0, Vec3::Z);
    w.set_parent(a, Some(parent));
    w.set_parent(b, Some(parent));
    w.despawn(parent);
    assert!(!w.is_alive(a) && !w.is_alive(b));
    assert!(w.is_alive(other));
    assert_eq!(w.len(), 1);
}

#[test]
fn reparented_children_despawn_with_their_new_parent_only() {
    let mut w = World::new(4);
    let a = spawn(&mut w, 0, Vec3::ZERO);
    let b = spawn(&mut w, 0, Vec3::ZERO);
    let c = spawn(&mut w, 0, Vec3::ZERO);
    let d = spawn(&mut w, 0, Vec3::ZERO);
    assert!(w.set_parent(c, Some(a)));
    assert!(w.set_parent(c, Some(b)), "moved from a to b");
    assert!(w.set_parent(d, Some(a)));
    assert!(w.set_parent(d, None), "detached");
    w.despawn(a);
    assert!(w.is_alive(c) && w.is_alive(d), "no longer a's children");
    w.despawn(b);
    assert!(!w.is_alive(c), "despawned with its new parent");
    assert!(w.is_alive(d));
}

#[test]
fn lifetimes_count_down_once_per_step_when_despawns_reorder_entities() {
    let mut w = World::new(4);
    let child = spawn(&mut w, 0, Vec3::ZERO);
    let parent = spawn(&mut w, 0, Vec3::ZERO);
    let other = spawn(&mut w, 0, Vec3::ZERO);
    assert!(w.set_parent(child, Some(parent)));
    w.set_lifetime(parent, FIXED_DT * 0.5);
    w.set_lifetime(other, FIXED_DT * 1.5);
    // Step 1 despawns the parent, then its child before it, swapping `other` back past the loop.
    w.update(FIXED_DT);
    assert!(!w.is_alive(parent) && !w.is_alive(child));
    w.update(FIXED_DT);
    assert!(!w.is_alive(other), "expired on the second step, not a step late");
}

#[test]
fn invalid_attachments_are_rejected() {
    let mut w = World::new(5);
    let a = spawn(&mut w, 0, Vec3::ZERO);
    let b = spawn(&mut w, 0, Vec3::ZERO);
    let c = spawn(&mut w, 0, Vec3::ZERO);
    let body = spawn(&mut w, 1, Vec3::ZERO);
    w.set_physics(body, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
    assert!(!w.set_parent(a, Some(a)), "self");
    assert!(!w.set_parent(body, Some(a)), "bodies can't be attached");
    assert!(w.set_parent(b, Some(a)));
    assert!(w.set_parent(c, Some(b)), "attachments nest");
    assert!(!w.set_parent(a, Some(c)), "cycle");
    assert!(!w.set_physics(b, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 }))));
    assert!(w.set_parent(b, None));
}

#[test]
fn nested_attachments_compose_transforms_and_despawn_together() {
    let mut w = World::new(4);
    let root = spawn(&mut w, 0, Vec3::new(10.0, 0.0, 0.0));
    w.set_scale(root, Vec3::splat(2.0));
    w.set_rotation(root, Quat::from_rotation_y(std::f32::consts::FRAC_PI_2));
    let arm = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
    let hand = spawn(&mut w, 0, Vec3::new(1.0, 0.0, 0.0));
    assert!(w.set_parent(arm, Some(root)));
    assert!(w.set_parent(hand, Some(arm)));
    w.update(0.0);
    assert!(w.read_position(hand, true));
    let p = Vec3::from_slice(&w.scratch()[..3]);
    // Local +X 2 units (1 + 1), scaled by 2 and turned to -Z: (10, 0, -4).
    assert!((p - Vec3::new(10.0, 0.0, -4.0)).length() < 1e-4, "{p:?}");
    w.despawn(root);
    assert_eq!(w.len(), 0);
}

#[test]
fn pick_finds_the_nearest_visible_entity() {
    let mut w = World::new(4);
    let near = spawn(&mut w, 0, Vec3::new(0.0, 0.0, 2.0));
    let _far = spawn(&mut w, 0, Vec3::ZERO);
    let hidden = spawn(&mut w, shapes::NONE, Vec3::new(0.0, 0.0, 4.0));
    w.update(0.0);
    let ray = (Vec3::new(0.0, 0.0, 10.0), Vec3::NEG_Z);
    assert_eq!(w.pick(ray.0, ray.1), Some(near), "invisible entities are skipped");
    assert!((w.scratch()[0] - 7.5).abs() < 1e-4, "hits the front face");
    w.set_pickable(near, false);
    assert_ne!(w.pick(ray.0, ray.1), Some(near));
    assert_ne!(w.pick(ray.0, ray.1), Some(hidden));
    assert_eq!(w.pick(Vec3::new(5.0, 0.0, 10.0), Vec3::NEG_Z), None, "miss");
}

#[test]
fn transparent_instances_are_drawn_after_opaque_ones() {
    let mut w = World::new(4);
    w.spawn(0, Vec3::ZERO, Vec3::ONE, [1.0, 0.0, 0.0, 0.5]).unwrap();
    w.spawn(0, Vec3::ZERO, Vec3::ONE, WHITE).unwrap();
    w.update(0.0);
    let r = w.ranges();
    assert_eq!(r[0..2], [0, 1], "opaque cube first");
    assert_eq!(r[MAX_MESHES * 2..MAX_MESHES * 2 + 2], [1, 1], "then the transparent one");
    assert_eq!(w.colors()[7], 0.5);
}

#[test]
fn planar_bodies_stay_in_their_plane() {
    let mut w = World::new(4);
    let ball = spawn(&mut w, 1, Vec3::new(0.0, 5.0, 0.0));
    let mut d = PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 });
    d.planar = true;
    w.set_physics(ball, Some(d));
    w.set_velocity(ball, Vec3::new(1.0, 0.0, 3.0));
    for _ in 0..30 {
        w.update(FIXED_DT);
    }
    let p = w.position(ball).unwrap();
    assert!(p.z.abs() < 1e-5 && p.x > 0.1 && p.y < 5.0, "{p:?}");
}

#[test]
fn spin_keeps_planar_and_upright_bodies_in_their_locks() {
    let mut w = World::new(4);
    let flat = spawn(&mut w, 1, Vec3::new(0.0, 5.0, 0.0));
    let upright = spawn(&mut w, 1, Vec3::new(5.0, 5.0, 0.0));
    let (mut planar, mut locked) = (
        PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 }),
        PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 }),
    );
    planar.planar = true;
    locked.lock_rotations = true;
    w.set_angular_velocity(upright, Vec3::splat(3.0)); // before the body: handed to it
    assert!(w.set_physics(flat, Some(planar)) && w.set_physics(upright, Some(locked)));
    w.set_angular_velocity(flat, Vec3::new(3.0, 3.0, 3.0));
    run(&mut w, 0.5);
    let (f, u) = (w.rotation[0], w.rotation[1]);
    assert!(f.x.abs() < 1e-5 && f.y.abs() < 1e-5 && f.z.abs() > 0.1, "only spins around Z: {f:?}");
    assert!(u.angle_between(Quat::IDENTITY) < 1e-5, "doesn't tip over: {u:?}");
}

#[test]
fn impact_feedback_plays_scaled_and_panned_from_the_core() {
    feedback::LOG.with(|l| l.borrow_mut().clear());
    let mut w = World::new(4);
    floor(&mut w);
    let listener = spawn(&mut w, 0, Vec3::new(-12.0, 0.0, 0.0)); // ball lands 12 to its right
    let ball = spawn(&mut w, 1, Vec3::new(0.0, 4.0, 0.0));
    w.set_physics(ball, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
    w.set_impact_feedback(
        ball,
        Some(ImpactFeedback {
            sound: Some(3),
            min_speed: 1.0,
            max_speed: 9.0,
            volume: 1.0,
            haptic: 0.8,
        }),
    );
    w.set_listener(Some(listener));
    run(&mut w, 1.5);
    let log = feedback::LOG.with(|l| l.borrow().clone());
    let (_, volume, pan) = *log.iter().find(|e| e.0 == "sound").expect("landing plays a sound");
    assert!(volume > 0.1 && volume < 1.0, "scaled by speed and distance: {volume}");
    assert!((pan - 1.0).abs() < 1e-3, "panned right: {pan}");
    assert!(log.iter().any(|e| e.0 == "haptic" && e.1 > 0.0));

    // Invalid settings are ignored, None removes it.
    w.set_impact_feedback(
        ball,
        Some(ImpactFeedback {
            sound: None,
            min_speed: 5.0,
            max_speed: 1.0,
            volume: 1.0,
            haptic: 0.0,
        }),
    );
    assert!(w.feedback[w.dense(ball).unwrap()].is_some(), "kept the valid settings");
    w.set_impact_feedback(ball, None);
    assert!(w.feedback[w.dense(ball).unwrap()].is_none());
}

// ── physics ──

#[test]
fn dynamic_ball_falls_and_rests_on_the_floor() {
    let mut w = World::new(4);
    floor(&mut w);
    let ball = spawn(&mut w, 1, Vec3::new(0.0, 5.0, 0.0));
    assert!(w.set_physics(ball, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 }))));
    run(&mut w, 0.5);
    let y = w.position(ball).unwrap().y;
    assert!(y < 4.0, "gravity pulls it down: {y}");
    run(&mut w, 3.0);
    let y = w.position(ball).unwrap().y;
    assert!(close(y, 0.5, 0.05), "rests on the floor surface: {y}");
}

#[test]
fn impulse_and_planar_velocity_move_dynamic_bodies() {
    let mut w = World::new(4);
    floor(&mut w);
    let ball = spawn(&mut w, 1, Vec3::new(0.0, 0.5, 0.0));
    let mut desc = PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 });
    desc.friction = 0.0;
    w.set_physics(ball, Some(desc));
    w.apply_impulse(ball, Vec3::new(0.0, 5.0, 0.0));
    assert!(w.read_velocity(ball));
    assert!(w.scratch()[1] > 1.0, "impulse launched it upward: {:?}", &w.scratch()[0..3]);

    w.set_planar_velocity(ball, 2.0, 0.0);
    assert!(w.read_velocity(ball));
    assert!(close(w.scratch()[0], 2.0, 1e-3) && w.scratch()[1] > 1.0, "x set, y kept");
}

#[test]
fn collision_events_report_start_stop_sensor_and_speed() {
    let mut w = World::new(4);
    let player = spawn(&mut w, 1, Vec3::new(-3.0, 0.0, 0.0));
    let orb = spawn(&mut w, 1, Vec3::ZERO);
    let mut p = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
    p.layer = 1;
    p.mask = 2;
    let mut o = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
    o.layer = 2;
    o.mask = 0; // relies on the player's mask: "either side" semantics
    o.sensor = true;
    w.set_physics(player, Some(p));
    w.set_physics(orb, Some(o));
    w.set_velocity(player, Vec3::new(6.0, 0.0, 0.0));

    let mut started = None;
    for _ in 0..120 {
        w.update(FIXED_DT);
        if let Some(&e) = events(&w).iter().find(|e| e.2 & EVENT_STARTED != 0) {
            started = Some(e);
            break;
        }
    }
    let (a, b, flags, speed) = started.expect("touch should start");
    assert!([a, b].contains(&player.0) && [a, b].contains(&orb.0));
    assert!(flags & EVENT_SENSOR != 0);
    assert!(close(speed, 6.0, 0.5), "impact speed ~ relative velocity: {speed}");

    let mut stopped = false;
    for _ in 0..120 {
        w.update(FIXED_DT);
        stopped |= events(&w).iter().any(|e| e.2 & EVENT_STARTED == 0);
    }
    assert!(stopped, "passing through should end the touch");
}

#[test]
fn layers_filter_collisions() {
    let mut w = World::new(4);
    let a = spawn(&mut w, 1, Vec3::ZERO);
    let b = spawn(&mut w, 1, Vec3::new(0.5, 0.0, 0.0));
    let mut d = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
    d.layer = 1;
    d.mask = 1;
    w.set_physics(a, Some(d));
    d.layer = 2;
    d.mask = 2;
    w.set_physics(b, Some(d));
    run(&mut w, 0.2);
    let mut any = false;
    for _ in 0..10 {
        w.update(FIXED_DT);
        any |= !w.events().is_empty();
    }
    assert!(!any, "no shared layer/mask, no events");
}

#[test]
fn raycast_hits_solid_colliders_by_mask() {
    let mut w = World::new(4);
    let wall = spawn(&mut w, 0, Vec3::new(5.0, 0.0, 0.0));
    let mut d = PhysicsDesc::new(
        BodyKind::Fixed,
        Shape::Cuboid {
            half_extents: Vec3::splat(0.5),
        },
    );
    d.layer = 4;
    w.set_physics(wall, Some(d));
    let sensor = spawn(&mut w, 1, Vec3::new(2.0, 0.0, 0.0));
    let mut s = PhysicsDesc::new(BodyKind::Kinematic, Shape::Ball { radius: 0.5 });
    s.sensor = true;
    s.layer = 4;
    w.set_physics(sensor, Some(s));
    w.update(FIXED_DT); // build the query structures

    let hit = w.raycast(Vec3::ZERO, Vec3::X, 100.0, 4);
    assert_eq!(hit, Some(wall), "sensors are skipped");
    assert!(close(w.scratch()[0], 4.5, 1e-3), "distance to the near face: {}", w.scratch()[0]);
    assert!(close(w.scratch()[1], -1.0, 1e-3), "normal faces the ray");
    assert_eq!(w.raycast(Vec3::ZERO, Vec3::X, 100.0, 1), None, "mask excludes the wall");
    assert_eq!(w.raycast(Vec3::ZERO, Vec3::X, 3.0, 4), None, "out of range");
    assert_eq!(w.raycast(Vec3::ZERO, Vec3::ZERO, 3.0, 4), None, "zero direction");
}

#[test]
fn invalid_physics_is_rejected_without_panicking() {
    let mut w = World::new(2);
    let e = spawn(&mut w, 1, Vec3::ZERO);
    for shape in [
        Shape::Ball { radius: 0.0 },
        Shape::Ball { radius: -1.0 },
        Shape::Ball { radius: f32::NAN },
        Shape::Cuboid {
            half_extents: Vec3::new(1.0, 0.0, 1.0),
        },
    ] {
        assert!(!w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, shape))));
    }
    let mut d = PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 1.0 });
    d.density = 0.0;
    assert!(!w.set_physics(e, Some(d)));
    assert!(!w.set_physics(Entity(NO_ENTITY), Some(PhysicsDesc::new(BodyKind::Fixed, Shape::Ball { radius: 1.0 }))));
    run(&mut w, 0.1);
}

#[test]
fn removing_physics_and_despawning_clean_up_bodies() {
    let mut w = World::new(4);
    let e = spawn(&mut w, 1, Vec3::ZERO);
    w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
    assert_eq!(w.physics.bodies.len(), 1);
    assert!(w.set_physics(e, None));
    assert_eq!(w.physics.bodies.len(), 0);
    w.set_physics(e, Some(PhysicsDesc::new(BodyKind::Dynamic, Shape::Ball { radius: 0.5 })));
    w.despawn(e);
    assert_eq!(w.physics.bodies.len(), 0);
    assert_eq!(w.physics.colliders.len(), 0);
}

#[test]
fn dynamic_follower_chases_while_gravity_still_applies() {
    let mut w = World::new(4);
    floor(&mut w);
    let target = spawn(&mut w, 1, Vec3::new(10.0, 0.5, 0.0));
    let chaser = spawn(&mut w, 0, Vec3::new(0.0, 3.0, 0.0));
    let mut d = PhysicsDesc::new(
        BodyKind::Dynamic,
        Shape::Cuboid {
            half_extents: Vec3::splat(0.5),
        },
    );
    d.lock_rotations = true;
    w.set_physics(chaser, Some(d));
    w.set_follow(chaser, target, 3.0);
    run(&mut w, 2.0);
    let p = w.position(chaser).unwrap();
    assert!(p.x > 4.0, "moved toward the target: {p}");
    assert!(close(p.y, 0.5, 0.1), "landed on the floor: {p}");
}
