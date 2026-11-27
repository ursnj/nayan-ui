//! A small generic world: a straight river at x = 10 (impassable), trees scattered with solids,
//! a spawn, reachable ground, picked spots and an overview.

use super::world::{World, WorldSpec};
use super::*;

fn recipe(seed: u32, rotation: f64) -> String {
    let axis: Vec<f64> = (0..=50).map(|i| -50.0 + i as f64 * 2.0).collect();
    serde_json::json!({
        "seed": seed,
        "rotation": rotation,
        "fields": {
            "nodes": [
                {"op": "var", "name": "x"}, {"op": "var", "name": "z"},
                {"op": "const", "value": 10}, {"op": "sub", "a": 0, "b": 2}, {"op": "abs", "a": 3},
                {"op": "const", "value": 3}, {"op": "sub", "a": 4, "b": 5},
                {"op": "const", "value": -1}, {"op": "const", "value": 0.02}, {"op": "mul", "a": 1, "b": 8},
                {"op": "select", "test": 6, "le": 7, "gt": 9},
                {"op": "const", "value": 1}, {"op": "sub", "a": 6, "b": 11},
                {"op": "const", "value": 0},
                {"op": "var", "name": "r0"}, {"op": "var", "name": "r1"},
                {"op": "const", "value": std::f64::consts::TAU}, {"op": "mul", "a": 14, "b": 16},
                {"op": "cos", "a": 17}, {"op": "sin", "a": 17},
                {"op": "const", "value": 40}, {"op": "mul", "a": 15, "b": 20},
                {"op": "mul", "a": 18, "b": 21}, {"op": "mul", "a": 19, "b": 21},
                {"op": "var", "name": "ground"}, {"op": "const", "value": 0.5}, {"op": "add", "a": 24, "b": 5}
            ],
            "outputs": {"bank": 6, "height": 10, "clear": 12, "zero": 13, "px": 22, "pz": 23, "ground": 24, "radius": 25, "top": 26}
        },
        "terrain": {
            "axis": axis, "height": "height",
            "regions": [{"field": "bank", "surface": 2, "material": 1}],
            "fallback": {"surface": 1, "material": 0}, "materials": 2
        },
        "walk": {"boundary": 45, "clearance": "clear", "height": 2},
        "steps": [
            {"kind": "spawn", "near": [-10, 0], "rings": 10, "samples": 12, "radius": 1, "surfaces": [1]},
            {"kind": "scatter", "name": "trees", "count": 60, "randoms": 2, "x": "px", "z": "pz", "y": "ground",
             "filters": [{"kind": "walkable", "radius": 1.2}, {"kind": "spawn", "minDistance": 5}],
             "solid": {"shapes": [{"kind": "circle", "radius": "radius", "bottom": "ground", "top": "top"}]}},
            {"kind": "reach", "cell": 3, "steps": 6, "radius": 0.6, "extent": 45},
            {"kind": "pick", "groups": [{"name": "gems", "count": 5, "spacing": 6, "fromSpawn": 4}]},
            {"kind": "overview", "size": 32, "extent": 45}
        ]
    })
    .to_string()
}

fn world(seed: u32, rotation: f64) -> World {
    let mut w = World::new(serde_json::from_str::<WorldSpec>(&recipe(seed, rotation)).unwrap()).unwrap();
    w.generate().unwrap();
    w
}

#[test]
fn generates_reachable_ground_on_the_spawn_side_of_the_river() {
    let w = world(3, 0.0);
    let g = &w.generated;
    assert!(w.walkable(g.spawn[0], g.spawn[1], 1.0));
    assert!(g.reachable.len() > 50);
    for p in &g.reachable {
        assert!(w.walkable(p[0], p[1], 0.6));
        assert!(p[0] < 6.0, "the river blocks the far bank: {p:?}");
    }
    assert!(!w.walkable(10.0, 0.0, 0.3));
    assert_eq!(w.surface(10.0, 0.0), 2);
    assert_eq!(w.surface(-10.0, 0.0), 1);
}

#[test]
fn scattered_items_are_solid_and_picks_are_spaced_on_reachable_ground() {
    let w = world(5, 0.0);
    let trees = &w.generated.layers[0];
    assert_eq!(trees.stride, 3);
    assert!(trees.data.len() / 3 > 5);
    for t in trees.data.chunks(3) {
        assert!(!w.walkable(t[0], t[2], 0.3), "a tree blocks walkers");
        assert!((t[1] - w.ground(t[0], t[2])).abs() < 1e-12);
    }
    let (name, gems) = &w.generated.picks[0];
    assert_eq!(name, "gems");
    assert_eq!(gems.len(), 5);
    for (i, a) in gems.iter().enumerate() {
        assert!(w.generated.reachable.contains(a));
        assert!(math::hypot2(a[0] - w.generated.spawn[0], a[1] - w.generated.spawn[1]) >= 4.0);
        for b in &gems[i + 1..] {
            assert!(math::hypot2(a[0] - b[0], a[1] - b[1]) >= 6.0);
        }
    }
}

#[test]
fn generation_is_deterministic_and_rotation_turns_the_world() {
    assert_eq!(world(9, 0.4).generated, world(9, 0.4).generated);
    assert_ne!(world(9, 0.4).generated.layers, world(10, 0.4).generated.layers);
    let turned = world(9, std::f64::consts::FRAC_PI_2);
    // The river (local x = 10) runs along world z = 10 after a quarter turn.
    let (x, z) = turned.to_world(10.0, 3.0);
    assert!((x - 3.0).abs() < 1e-9 && (z + 10.0).abs() < 1e-9);
    assert_eq!(turned.surface(x, z), 2);
}

#[test]
fn a_saved_world_restores_the_same_results_and_queries() {
    let text = recipe(11, 0.3);
    let generated = world(11, 0.3).generated;
    let bytes = store::encode(&text, &generated);
    let mut restored = World::new(serde_json::from_str::<WorldSpec>(&text).unwrap()).unwrap();
    restored.adopt(store::decode(&bytes, &text).unwrap());
    let original = world(11, 0.3);
    assert_eq!(restored.generated, original.generated);
    for t in original.generated.layers[0].data.chunks(3) {
        assert_eq!(restored.walkable(t[0], t[2], 0.3), original.walkable(t[0], t[2], 0.3));
    }
    assert!(store::decode(&bytes, &recipe(12, 0.3)).is_err());
}

#[test]
fn walkers_slide_along_obstacles_and_never_end_up_inside() {
    let w = world(3, 0.0);
    let start = w.generated.spawn;
    // Head straight for the river: stop at its bank.
    let end = w.move_walker(start, 40.0, 0.0, 0.5, &[]);
    assert!(w.walkable(end[0], end[1], 0.5));
    assert!(end[0] < 6.0 && end[0] > start[0]);
    // Another walker in the way is not passed through.
    let blocker = [start[0] + 2.0, start[1], 0.5];
    let end = w.move_walker(start, 4.0, 0.0, 0.5, &[blocker]);
    assert!(math::hypot2(end[0] - blocker[0], end[1] - blocker[1]) >= 1.0 - 1e-6);
    assert!(!w.sight(start, [20.0, start[1]], 0.25, 0.4, 2.0), "the river blocks sight");
    let near = w.generated.reachable[1];
    assert!(w.sight(start, near, 0.25, 0.4, 2.0) || !w.walkable(near[0], near[1], 0.25));
}

#[test]
fn overview_and_terrain_meshes() {
    let w = world(3, 0.0);
    let overview = &w.generated.overview;
    assert_eq!(overview.len(), 32 * 32);
    assert_eq!(overview[0], 0, "corners are outside the boundary");
    assert!(overview.contains(&1) && overview.contains(&2));
    let land = w.take_terrain(0).unwrap();
    let water = w.take_terrain(1).unwrap();
    assert!(!land.indices.is_empty() && !water.indices.is_empty());
    assert!(w.take_terrain(0).is_some(), "rebuilt after both were handed over");
}

#[test]
fn registry_builds_frees_and_reports_errors() {
    let handle = build(&recipe(1, 0.0), "", false);
    assert!(handle > 0);
    assert!(with(handle, |w| w.generated.reachable.len()).unwrap() > 0);
    let info: serde_json::Value = serde_json::from_str(&with(handle, info).unwrap()).unwrap();
    assert_eq!(info["picks"]["gems"].as_array().unwrap().len(), 5);
    assert!(with_mut(handle, |w| w.repick(1)).unwrap());
    free(handle);
    assert!(with(handle, |_| ()).is_none());
    assert_eq!(build("{\"seed\":1}", "", false), 0);
    assert!(last_error().contains("recipe"));
}
