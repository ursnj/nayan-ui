//! 3D text: TrueType / OpenType glyph outlines turned into extruded meshes.
//!
//! Each requested character becomes its own mesh (registered like a model), so all copies of a
//! letter in every label are drawn in one instanced call. Units: 1 = the font's em size; a glyph's
//! origin is on the baseline at its left edge, facing +Z, centered on z = 0 in depth.

use crate::model::{self, Model, VERTEX_FLOATS};
use i_overlay::core::fill_rule::FillRule;
use i_overlay::float::simplify::SimplifyShape;
use rapier3d::glamx::Vec3;
use std::sync::{Arc, Mutex};

/// Line segments per curve when flattening outlines.
const CURVE_STEPS: usize = 6;

pub struct Font {
    /// `[codepoint, mesh id (-1 = nothing to draw, e.g. space), advance]` per character, as f32.
    pub glyphs: Vec<f32>,
    /// Height of capital letters, in ems (for vertical centering).
    pub cap_height: f32,
}

/// Parses `bytes` and builds a mesh for each character of `chars` the font has.
/// `depth` is the extrusion depth in ems (0 = flat, front face only).
pub fn load(bytes: &[u8], depth: f32, chars: &str) -> Result<u32, String> {
    model::record_error(build(bytes, depth, chars).and_then(register))
}

fn build(bytes: &[u8], depth: f32, chars: &str) -> Result<Font, String> {
    let face = ttf_parser::Face::parse(bytes, 0).map_err(|e| format!("not a TrueType/OpenType font: {e}"))?;
    let scale = 1.0 / face.units_per_em() as f32;
    let depth = if depth.is_finite() { depth.max(0.0) } else { 0.0 };
    let mut glyphs = Vec::new();
    let mut seen = std::collections::HashSet::new();
    for ch in chars.chars().filter(|c| seen.insert(*c)) {
        let Some(id) = face.glyph_index(ch) else { continue };
        let advance = face.glyph_hor_advance(id).unwrap_or(0) as f32 * scale;
        let mut outline = Outline { scale, ..Default::default() };
        let mesh = match face.outline_glyph(id, &mut outline) {
            Some(_) => match extrude(&outline.finish(), depth) {
                Some(m) => model::register(m)? as f32,
                None => -1.0,
            },
            None => -1.0,
        };
        glyphs.extend_from_slice(&[ch as u32 as f32, mesh, advance]);
    }
    let cap_height = face.capital_height().map_or(0.7, |h| h as f32 * scale);
    Ok(Font { glyphs, cap_height })
}

/// Collects a glyph outline as flattened closed contours.
#[derive(Default)]
struct Outline {
    scale: f32,
    contours: Vec<Vec<[f32; 2]>>,
    current: Vec<[f32; 2]>,
}

impl Outline {
    fn point(&self, x: f32, y: f32) -> [f32; 2] {
        [x * self.scale, y * self.scale]
    }

    fn last(&self) -> [f32; 2] {
        self.current.last().copied().unwrap_or([0.0, 0.0])
    }

    fn finish(mut self) -> Vec<Vec<[f32; 2]>> {
        self.close_contour();
        self.contours
    }

    fn close_contour(&mut self) {
        let mut c = std::mem::take(&mut self.current);
        if c.len() > 1 && c.first() == c.last() {
            c.pop();
        }
        c.dedup();
        if c.len() >= 3 {
            self.contours.push(c);
        }
    }
}

impl ttf_parser::OutlineBuilder for Outline {
    fn move_to(&mut self, x: f32, y: f32) {
        self.close_contour();
        self.current.push(self.point(x, y));
    }
    fn line_to(&mut self, x: f32, y: f32) {
        self.current.push(self.point(x, y));
    }
    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        let (p0, p1, p2) = (self.last(), self.point(x1, y1), self.point(x, y));
        for i in 1..=CURVE_STEPS {
            let t = i as f32 / CURVE_STEPS as f32;
            let u = 1.0 - t;
            self.current.push([
                u * u * p0[0] + 2.0 * u * t * p1[0] + t * t * p2[0],
                u * u * p0[1] + 2.0 * u * t * p1[1] + t * t * p2[1],
            ]);
        }
    }
    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        let (p0, p1, p2, p3) = (self.last(), self.point(x1, y1), self.point(x2, y2), self.point(x, y));
        for i in 1..=CURVE_STEPS {
            let t = i as f32 / CURVE_STEPS as f32;
            let u = 1.0 - t;
            let (a, b, c, d) = (u * u * u, 3.0 * u * u * t, 3.0 * u * t * t, t * t * t);
            self.current.push([
                a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
                a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
            ]);
        }
    }
    fn close(&mut self) {
        self.close_contour();
    }
}

fn signed_area(c: &[[f32; 2]]) -> f32 {
    let mut a = 0.0;
    for i in 0..c.len() {
        let (p, q) = (c[i], c[(i + 1) % c.len()]);
        a += p[0] * q[1] - q[0] * p[1];
    }
    a / 2.0
}

/// Resolves the outline with the non-zero fill rule fonts use (overlapping and self-crossing strokes,
/// common in variable-font instances, merge) into clean shapes, triangulates them and extrudes them
/// into a closed mesh. None if nothing could be triangulated.
fn extrude(contours: &[Vec<[f32; 2]>], depth: f32) -> Option<Model> {
    let shapes = contours.to_vec().simplify_shape(FillRule::NonZero);
    let mut mesh = MeshBuilder::default();
    let (front, back) = (depth / 2.0, -depth / 2.0);
    // Every ring, wound so the solid is on its left: outlines counter-clockwise, holes clockwise.
    let mut rings: Vec<Vec<[f32; 2]>> = Vec::new();
    for shape in &shapes {
        let Some((outer, holes)) = shape.split_first() else { continue };
        let wound = |c: &Vec<[f32; 2]>, ccw: bool| {
            let mut c = c.clone();
            if (signed_area(&c) > 0.0) != ccw {
                c.reverse();
            }
            c
        };
        let outer = wound(outer, true);
        let holes: Vec<Vec<[f32; 2]>> = holes.iter().map(|h| wound(h, false)).collect();
        let mut flat: Vec<f64> = outer.iter().flat_map(|p| [p[0] as f64, p[1] as f64]).collect();
        let mut hole_starts = Vec::new();
        for h in &holes {
            hole_starts.push(flat.len() / 2);
            flat.extend(h.iter().flat_map(|p| [p[0] as f64, p[1] as f64]));
        }
        rings.push(outer);
        rings.extend(holes);
        let Ok(triangles) = earcutr::earcut(&flat, &hole_starts, 2) else {
            continue;
        };
        let points: Vec<[f32; 2]> = flat.as_chunks::<2>().0.iter().map(|p| [p[0] as f32, p[1] as f32]).collect();
        for t in triangles.as_chunks::<3>().0 {
            let (a, b, c) = (points[t[0]], points[t[1]], points[t[2]]);
            mesh.triangle([a, b, c].map(|p| Vec3::new(p[0], p[1], front)), Vec3::Z);
            if depth > 0.0 {
                mesh.triangle([a, b, c].map(|p| Vec3::new(p[0], p[1], back)), Vec3::NEG_Z);
            }
        }
    }
    if depth > 0.0 {
        // Side walls: the solid is on each ring's left, so the outward normal is to the right.
        for ring in &rings {
            for k in 0..ring.len() {
                let (a, b) = (ring[k], ring[(k + 1) % ring.len()]);
                let normal = Vec3::new(b[1] - a[1], a[0] - b[0], 0.0).normalize_or_zero();
                let (af, bf) = (Vec3::new(a[0], a[1], front), Vec3::new(b[0], b[1], front));
                let (ab, bb) = (Vec3::new(a[0], a[1], back), Vec3::new(b[0], b[1], back));
                mesh.triangle([ab, bb, bf], normal);
                mesh.triangle([ab, bf, af], normal);
            }
        }
    }
    mesh.finish()
}

#[derive(Default)]
struct MeshBuilder {
    vertices: Vec<f32>,
    bounds: Option<(Vec3, Vec3)>,
}

impl MeshBuilder {
    /// Adds a triangle, flipping it if needed so it faces `normal` (counter-clockwise front).
    fn triangle(&mut self, mut p: [Vec3; 3], normal: Vec3) {
        if (p[1] - p[0]).cross(p[2] - p[0]).dot(normal) < 0.0 {
            p.swap(1, 2);
        }
        for v in p {
            self.vertices
                .extend_from_slice(&[v.x, v.y, v.z, normal.x, normal.y, normal.z, 1.0, 1.0, 1.0, 0.0, 0.0]);
            self.bounds = Some(match self.bounds {
                Some((lo, hi)) => (lo.min(v), hi.max(v)),
                None => (v, v),
            });
        }
    }

    fn finish(self) -> Option<Model> {
        let (lo, hi) = self.bounds?;
        let count = (self.vertices.len() / VERTEX_FLOATS) as u32;
        Some(Model {
            vertices: self.vertices,
            indices: (0..count).collect(),
            half_extents: (hi - lo) / 2.0,
            texture: None,
        })
    }
}

// ── Registry ─────────────────────────────────────────────────────────────

static FONTS: Mutex<Vec<Arc<Font>>> = Mutex::new(Vec::new());

fn register(font: Font) -> Result<u32, String> {
    let mut fonts = FONTS.lock().map_err(|_| "font registry unavailable".to_string())?;
    fonts.push(Arc::new(font));
    Ok(fonts.len() as u32 - 1)
}

pub fn get(id: u32) -> Option<Arc<Font>> {
    FONTS.lock().ok()?.get(id as usize).cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn square(x: f32, y: f32, size: f32, ccw: bool) -> Vec<[f32; 2]> {
        let mut c = vec![[x, y], [x + size, y], [x + size, y + size], [x, y + size]];
        if !ccw {
            c.reverse();
        }
        c
    }

    #[test]
    fn extrudes_a_ring_with_a_hole() {
        // An "o": outer square with a square hole, given in TrueType winding (outer clockwise).
        let contours = vec![square(0.0, 0.0, 1.0, false), square(0.25, 0.25, 0.5, true)];
        let m = extrude(&contours, 0.2).unwrap();
        let triangles = m.vertices.len() / VERTEX_FLOATS / 3;
        // front 8 + back 8 (a square ring) + walls 2 per edge * 8 edges
        assert_eq!(triangles, 8 + 8 + 16);
        assert!((m.half_extents - Vec3::new(0.5, 0.5, 0.1)).length() < 1e-5);
        // Every front-face triangle (z = +0.1, normal +Z) is counter-clockwise.
        for t in m.vertices.as_chunks::<{ VERTEX_FLOATS * 3 }>().0 {
            let v = |k: usize| Vec3::new(t[k * VERTEX_FLOATS], t[k * VERTEX_FLOATS + 1], t[k * VERTEX_FLOATS + 2]);
            let n = Vec3::new(t[3], t[4], t[5]);
            assert!((v(1) - v(0)).cross(v(2) - v(0)).dot(n) > 0.0, "faces its normal");
        }
        // Front-face area = 1 - 0.25 (the hole isn't filled).
        let area: f32 = m
            .vertices
            .as_chunks::<{ VERTEX_FLOATS * 3 }>()
            .0
            .iter()
            .filter(|t| t[5] > 0.5)
            .map(|t| {
                let v = |k: usize| Vec3::new(t[k * VERTEX_FLOATS], t[k * VERTEX_FLOATS + 1], 0.0);
                (v(1) - v(0)).cross(v(2) - v(0)).length() / 2.0
            })
            .sum();
        assert!((area - 0.75).abs() < 1e-4, "area {area}");
    }

    fn front_area(m: &Model) -> f32 {
        m.vertices
            .as_chunks::<{ VERTEX_FLOATS * 3 }>()
            .0
            .iter()
            .filter(|t| t[5] > 0.5)
            .map(|t| {
                let v = |k: usize| Vec3::new(t[k * VERTEX_FLOATS], t[k * VERTEX_FLOATS + 1], 0.0);
                (v(1) - v(0)).cross(v(2) - v(0)).length() / 2.0
            })
            .sum()
    }

    #[test]
    fn overlapping_and_self_crossing_outlines_fill_once() {
        // Two overlapping strokes (like an "N" in a variable-font instance) merge: 1.5 x 1, not 2.
        let m = extrude(&[square(0.0, 0.0, 1.0, false), square(0.5, 0.0, 1.0, false)], 0.0).unwrap();
        assert!((front_area(&m) - 1.5).abs() < 1e-3);
        // One contour that crosses itself (a bow tie): both halves filled, no overfill.
        let bow = vec![[0.0, 0.0], [1.0, 1.0], [1.0, 0.0], [0.0, 1.0]];
        let m = extrude(&[bow], 0.0).unwrap();
        assert!((front_area(&m) - 0.5).abs() < 1e-3, "{}", front_area(&m));
    }

    #[test]
    fn flat_text_has_front_faces_only() {
        let m = extrude(&[square(0.0, 0.0, 1.0, true)], 0.0).unwrap();
        assert_eq!(m.vertices.len() / VERTEX_FLOATS, 6);
    }

    #[test]
    fn builds_glyphs_from_a_real_font() {
        let bytes = std::fs::read(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/Inter-Bold.ttf")).unwrap();
        let font = get(load(&bytes, 0.2, "08A A").unwrap()).unwrap();
        // "0", "8", "A", " " (duplicates skipped); space has an advance but nothing to draw.
        let glyphs: &[[f32; 3]] = font.glyphs.as_chunks::<3>().0;
        assert_eq!(glyphs.len(), 4);
        assert_eq!(glyphs[3][0], ' ' as u32 as f32);
        assert_eq!(glyphs[3][1], -1.0);
        assert!(glyphs[3][2] > 0.1);
        for g in &glyphs[..3] {
            let mesh = model::get(g[1] as u8).expect("a mesh per drawn glyph");
            assert!(mesh.indices.len() > 100, "an extruded, triangulated outline");
            assert!((mesh.half_extents.z - 0.1).abs() < 1e-4, "depth 0.2");
        }
        assert!((0.6..0.8).contains(&font.cap_height));
    }

    #[test]
    fn every_glyph_fills_exactly_its_outline() {
        let bytes = std::fs::read(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/Inter-Bold.ttf")).unwrap();
        let face = ttf_parser::Face::parse(&bytes, 0).unwrap();
        for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?&%@#".chars() {
            let mut outline = Outline {
                scale: 1.0 / face.units_per_em() as f32,
                ..Default::default()
            };
            face.outline_glyph(face.glyph_index(ch).unwrap(), &mut outline);
            let contours = outline.finish();
            // The filled area: outlines minus holes once overlaps are resolved.
            let expected: f32 = contours
                .to_vec()
                .simplify_shape(FillRule::NonZero)
                .iter()
                .flat_map(|shape| {
                    shape
                        .iter()
                        .enumerate()
                        .map(|(k, c)| signed_area(c).abs() * if k == 0 { 1.0 } else { -1.0 })
                })
                .sum();
            let got = front_area(&extrude(&contours, 0.0).unwrap());
            assert!((got - expected).abs() < 1e-3, "{ch}: filled {got}, outline {expected}");
        }
    }

    #[test]
    fn rejects_non_fonts() {
        assert!(load(b"not a font", 0.1, "A").is_err());
        assert!(!model::last_error().is_empty());
    }
}
