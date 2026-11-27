use engine_core::assets::modelling::generate;
use serde_json::json;

#[test]
fn shells_have_inner_and_outer_surfaces_with_opposite_normals() {
    let recipe = json!({"solid":{"kind":"shell","child":{"kind":"sphere","radius":1},"thickness":0.2},"resolution":48});
    let mesh = generate(&serde_json::to_vec(&recipe).unwrap()).unwrap();
    let mut inside = 0;
    let mut outside = 0;
    for v in mesh.vertices.chunks_exact(11) {
        let radius = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
        let facing = v[0] * v[3] + v[1] * v[4] + v[2] * v[5];
        if radius < 1.0 {
            assert!((radius - 0.9).abs() < 0.01 && facing < 0.0);
            inside += 1;
        } else {
            assert!((radius - 1.1).abs() < 0.01 && facing > 0.0);
            outside += 1;
        }
    }
    assert!(inside > 100 && outside > 100);
}

#[test]
fn intersection_respects_both_solids_and_resolution_controls_triangle_budget() {
    let solid = json!({"kind":"intersect","a":{"kind":"sphere","radius":1},"b":{"kind":"box","size":[1,3,3],"radius":0}});
    let low = generate(&serde_json::to_vec(&json!({"solid":solid,"resolution":16})).unwrap()).unwrap();
    let high = generate(&serde_json::to_vec(&json!({"solid":solid,"resolution":48})).unwrap()).unwrap();
    assert!(high.indices.len() > low.indices.len() * 4);
    assert!(high.vertices.chunks_exact(11).all(|v| v[0].abs() <= 0.501));
    assert!(high.vertices.chunks_exact(11).any(|v| v[0].abs() > 0.49));
}
