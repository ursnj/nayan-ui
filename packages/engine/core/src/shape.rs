//! Custom shapes: geometry built in JS (lathes, tubes, merged parts) registered as a mesh, and 2D
//! paths extruded into solids. Both draw, collide and pick like loaded models.

use crate::model::{self, Model, VERTEX_FLOATS};
use i_overlay::core::fill_rule::FillRule;
use rapier3d::glamx::Vec3;
use std::collections::HashMap;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::sync::Mutex;

/// Shapes registered so far, by a hash of their geometry: mesh ids outlive the JS context, so a
/// reload that builds the same shapes again gets the same ids back instead of using up new ones.
static SHAPES: Mutex<Option<HashMap<u64, Vec<u8>>>> = Mutex::new(None);

fn fingerprint(vertices: &[f32], indices: &[u32]) -> u64 {
    let mut h = DefaultHasher::new();
    vertices.iter().for_each(|v| v.to_bits().hash(&mut h));
    indices.hash(&mut h);
    h.finish()
}

/// Registers render-ready geometry (`VERTEX_FLOATS` floats per vertex, a triangle list) under a
/// mesh id. Colliders and picking use a box around the origin that holds every vertex. Geometry
/// identical to an earlier shape's reuses its id (meshes are immutable, so sharing is safe).
pub fn create(vertices: &[f32], indices: &[u32]) -> Result<u8, String> {
    let key = fingerprint(vertices, indices);
    let mut shapes = SHAPES.lock().map_err(|_| "shape registry unavailable".to_string())?;
    let shapes = shapes.get_or_insert_with(HashMap::new);
    let same = shapes.get(&key).and_then(|ids| {
        ids.iter().copied().find(|&id| {
            model::get(id).is_some_and(|m| m.indices == indices && m.vertices.iter().map(|v| v.to_bits()).eq(vertices.iter().map(|v| v.to_bits())))
        })
    });
    if let Some(id) = same {
        return model::record_error(Ok(id));
    }
    let id = model::record_error(build(vertices, indices).and_then(model::register))?;
    shapes.entry(key).or_default().push(id);
    Ok(id)
}

fn build(vertices: &[f32], indices: &[u32]) -> Result<Model, String> {
    let (chunks, rest) = vertices.as_chunks::<VERTEX_FLOATS>();
    if chunks.is_empty() || !rest.is_empty() {
        return Err(format!("vertices must be a non-empty multiple of {VERTEX_FLOATS} floats"));
    }
    if indices.is_empty() || !indices.len().is_multiple_of(3) {
        return Err("indices must be a non-empty list of triangles".into());
    }
    if let Some(&bad) = indices.iter().find(|&&i| i as usize >= chunks.len()) {
        return Err(format!("index {bad} is past the last vertex ({})", chunks.len() - 1));
    }
    if vertices.iter().any(|v| !v.is_finite()) {
        return Err("vertices must be finite numbers".into());
    }
    // Entities sit at the mesh's origin, so the box is centred there and reaches the furthest vertex.
    let reach = chunks
        .iter()
        .fold(Vec3::ZERO, |m, v| m.max(Vec3::new(v[0].abs(), v[1].abs(), v[2].abs())));
    Ok(Model {
        vertices: vertices.to_vec(),
        indices: indices.to_vec(),
        half_extents: reach,
        texture: None,
    })
}

/// Fills closed 2D contours (each a list of [x, y] points, y up) with `fill` and extrudes them
/// `depth` deep, centred on z = 0 with the front face at +Z (0 = the front face only). Holes come
/// from the fill rule: a contour inside another is a hole when wound the other way (non-zero) or
/// always (even-odd). Returns vertices (`VERTEX_FLOATS` each, unindexed triangles), or None.
pub fn extrude(contours: &[Vec<[f32; 2]>], depth: f32, even_odd: bool) -> Option<Vec<f32>> {
    let contours: Vec<Vec<[f32; 2]>> = contours
        .iter()
        .filter(|c| c.len() >= 3 && c.iter().all(|p| p[0].is_finite() && p[1].is_finite()))
        .cloned()
        .collect();
    let depth = if depth.is_finite() { depth.max(0.0) } else { 0.0 };
    let fill = if even_odd { FillRule::EvenOdd } else { FillRule::NonZero };
    crate::font::extrude(&contours, depth, fill).map(|m| m.vertices)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn square(x: f32, y: f32, size: f32, clockwise: bool) -> Vec<[f32; 2]> {
        let mut c = vec![[x, y], [x + size, y], [x + size, y + size], [x, y + size]];
        if clockwise {
            c.reverse();
        }
        c
    }

    /// Area of the triangles facing +Z.
    fn front_area(vertices: &[f32]) -> f32 {
        vertices
            .as_chunks::<{ VERTEX_FLOATS * 3 }>()
            .0
            .iter()
            .filter(|t| t[5] > 0.5)
            .map(|t| {
                let (a, b, c) = ([t[0], t[1]], [t[11], t[12]], [t[22], t[23]]);
                ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])).abs() / 2.0
            })
            .sum()
    }

    #[test]
    fn creates_a_mesh_with_a_box_around_the_origin() {
        let v = |x: f32, y: f32, z: f32| [x, y, z, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0];
        let vertices: Vec<f32> = [v(-1.0, 0.0, 0.0), v(2.0, 0.0, 0.0), v(0.0, 3.0, 0.5)].concat();
        let mesh = create(&vertices, &[0, 1, 2]).unwrap();
        let model = model::get(mesh).unwrap();
        assert_eq!(model.half_extents, Vec3::new(2.0, 3.0, 0.5));
        assert_eq!(model.indices, vec![0, 1, 2]);
    }

    #[test]
    fn identical_geometry_reuses_its_mesh() {
        let v = |x: f32, y: f32| [x, y, 0.25, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0];
        let vertices: Vec<f32> = [v(-7.0, 0.0), v(7.0, 0.0), v(0.0, 7.0)].concat();
        let first = create(&vertices, &[0, 1, 2]).unwrap();
        assert_eq!(create(&vertices, &[0, 1, 2]).unwrap(), first, "built again (a JS reload)");
        assert_ne!(create(&vertices, &[0, 2, 1]).unwrap(), first, "different triangles");
        let mut moved = vertices.clone();
        moved[0] = -7.5;
        assert_ne!(create(&moved, &[0, 1, 2]).unwrap(), first, "different vertices");
    }

    #[test]
    fn rejects_bad_geometry() {
        let tri = [0.0f32; VERTEX_FLOATS * 3];
        assert!(create(&tri[..VERTEX_FLOATS * 3 - 1], &[0, 1, 2]).is_err(), "partial vertex");
        assert!(create(&tri, &[0, 1]).is_err(), "partial triangle");
        assert!(create(&tri, &[0, 1, 3]).is_err(), "index past the end");
        let mut nan = tri;
        nan[4] = f32::NAN;
        assert!(create(&nan, &[0, 1, 2]).is_err(), "NaN");
        assert!(!model::last_error().is_empty());
    }

    #[test]
    fn fill_rules_make_holes() {
        let outer = square(0.0, 0.0, 4.0, false);
        // Same winding: non-zero fills the inner square, even-odd cuts it out.
        let inner = square(1.0, 1.0, 2.0, false);
        let both = [outer.clone(), inner.clone()];
        assert!((front_area(&extrude(&both, 0.0, false).unwrap()) - 16.0).abs() < 1e-3);
        assert!((front_area(&extrude(&both, 0.0, true).unwrap()) - 12.0).abs() < 1e-3);
        // Opposite winding is a hole under either rule.
        let hole = [outer, square(1.0, 1.0, 2.0, true)];
        assert!((front_area(&extrude(&hole, 0.0, false).unwrap()) - 12.0).abs() < 1e-3);
    }

    #[test]
    fn extrudes_a_closed_solid_with_uvs() {
        let v = extrude(&[square(0.0, 0.0, 2.0, false)], 0.5, false).unwrap();
        let points = v.as_chunks::<VERTEX_FLOATS>().0;
        // Front and back (2 triangles each) and four walls (2 each).
        assert_eq!(points.len(), 12 * 3);
        assert!(points.iter().all(|p| (p[2].abs() - 0.25).abs() < 1e-6));
        assert!(points.iter().all(|p| (0.0..=1.0).contains(&p[9]) && (0.0..=1.0).contains(&p[10])));
    }

    #[test]
    fn skips_degenerate_contours() {
        assert!(extrude(&[vec![[0.0, 0.0], [1.0, 1.0]]], 1.0, false).is_none());
        assert!(extrude(&[vec![[0.0, 0.0], [f32::NAN, 1.0], [1.0, 0.0]]], 1.0, false).is_none());
    }
}
