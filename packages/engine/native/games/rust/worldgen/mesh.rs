//! Field-driven mesh generators: parametric grid surfaces (ribbons, tubes, rocks, discs) and seeded
//! cards (foliage, blades, debris). Every vertex attribute is a named field of the recipe's graph, so
//! any game describes its procedural models as data and the core builds them.

use super::field::{Graph, GraphSpec, Scratch};
use super::paint::{self, FieldFn};
use super::rng::Rng;
use super::sweep::{self, FacePaint};
use crate::assets::modelling::Geometry;
use serde::Deserialize;

pub const VERTEX_FLOATS: usize = 11;
const MAX_VERTICES: usize = 2_000_000;

/// Field outputs for one vertex attribute group.
type Fields3 = [String; 3];
type Fields2 = [String; 2];

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum PartSpec {
    /// (rows + 1) × (cols + 1) vertices. Inputs: `u` = col / cols, `v` = row / rows, `row`, `col`.
    Surface {
        rows: u32,
        cols: u32,
        position: Fields3,
        normal: Fields3,
        uv: Fields2,
        color: Fields3,
        #[serde(default)]
        double: bool,
        /// Reverse the winding of the front faces.
        #[serde(default)]
        flip: bool,
    },
    /// `count` flat polygons at center + right·cu + up·cv for each corner [cu, cv, texU, texV] (3 or
    /// 4 corners). Inputs: `i`, `count` and `r0`…`r{randoms-1}`, drawn per card from `seed`.
    Cards {
        count: u32,
        seed: u32,
        randoms: u32,
        corners: Vec<[f64; 4]>,
        center: Fields3,
        right: Fields3,
        up: Fields3,
        normal: Fields3,
        color: Fields3,
        #[serde(default)]
        double: bool,
    },
    /// A profile of [radius, height] points (top to bottom) spun around +y: see [`sweep::lathe`].
    #[serde(rename_all = "camelCase")]
    Lathe {
        points: Vec<[f64; 2]>,
        segments: u32,
        #[serde(default = "full_turn")]
        sweep: f64,
        /// (points) × (segments + 1) offsets along the normal.
        #[serde(default)]
        displace: Option<Vec<f64>>,
        #[serde(default)]
        color: Option<[f64; 3]>,
        #[serde(default)]
        cap_color: Option<[f64; 3]>,
        /// Leave the caps white with their polar grid coordinates as UVs (the caller colors them).
        #[serde(default)]
        raw_caps: bool,
        #[serde(default = "one")]
        cap_rings: u32,
        #[serde(default)]
        cut_color: Option<[f64; 3]>,
        #[serde(default = "one")]
        cut_steps: u32,
        /// Side color of (u, v, x, y, z, nx, ny, nz), instead of `color`.
        #[serde(default)]
        color_field: Option<FieldFn>,
        /// Cap color of (r, angle), instead of `capColor`.
        #[serde(default)]
        cap_color_field: Option<FieldFn>,
        /// Cut-face color of (r, y), instead of `cutColor`.
        #[serde(default)]
        cut_color_field: Option<FieldFn>,
        /// Displacement along the normal of (u, v), instead of `displace`.
        #[serde(default)]
        displace_field: Option<FieldFn>,
    },
    /// A tube along a smooth curve through `points`: see [`sweep::tube`].
    #[serde(rename_all = "camelCase")]
    Tube {
        points: Vec<[f64; 3]>,
        #[serde(default)]
        closed: bool,
        sides: u32,
        steps: u32,
        radii: Vec<f64>,
        #[serde(default)]
        shape: Option<Vec<f64>>,
        #[serde(default)]
        smooth: bool,
        #[serde(default = "yes")]
        caps: bool,
        #[serde(default)]
        color: Option<[f64; 3]>,
        #[serde(default)]
        cap_color: Option<[f64; 3]>,
        #[serde(default)]
        raw_caps: bool,
        #[serde(default = "one")]
        cap_rings: u32,
        /// Side color of (u, v, x, y, z, nx, ny, nz), instead of `color`.
        #[serde(default)]
        color_field: Option<FieldFn>,
        /// Cap color of (r, angle), instead of `capColor`.
        #[serde(default)]
        cap_color_field: Option<FieldFn>,
    },
    /// A body through rounded rectangular sections [z, bottom, top, width, topWidth, square]: see [`sweep::loft`].
    Loft {
        sections: Vec<sweep::Section>,
        around: u32,
        smoothness: u32,
        #[serde(default)]
        color: Option<[f64; 3]>,
        /// Color of (x, y, z, nx, ny, nz, u, v), instead of `color`.
        #[serde(default)]
        color_field: Option<FieldFn>,
    },
}

fn full_turn() -> f64 {
    std::f64::consts::TAU
}
fn one() -> u32 {
    1
}
fn yes() -> bool {
    true
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MeshSpec {
    /// Fields for surfaces and cards; lathes, tubes and lofts need none.
    #[serde(default)]
    pub fields: GraphSpec,
    pub parts: Vec<PartSpec>,
}

/// Vertices accumulated in f64 (as computed), converted to f32 once.
#[derive(Default)]
pub struct Builder {
    pub vertices: Vec<f64>,
    pub indices: Vec<u32>,
}

impl Builder {
    pub fn vertex(&mut self, p: [f64; 3], n: [f64; 3], uv: [f64; 2], color: [f64; 3]) -> u32 {
        let index = (self.vertices.len() / VERTEX_FLOATS) as u32;
        self.vertices
            .extend_from_slice(&[p[0], p[1], p[2], n[0], n[1], n[2], color[0], color[1], color[2], uv[0], uv[1]]);
        index
    }

    pub fn count(&self) -> usize {
        self.vertices.len() / VERTEX_FLOATS
    }

    pub fn quad(&mut self, a: u32, b: u32, c: u32, d: u32, double: bool) {
        self.indices.extend_from_slice(&[a, b, c, a, c, d]);
        if double {
            self.indices.extend_from_slice(&[c, b, a, d, c, a]);
        }
    }

    /// Appends finished geometry (its indices moved past the vertices already here).
    pub fn append(&mut self, g: Geometry) -> Result<(), String> {
        let first = self.count() as u32;
        if self.count() + g.vertices.len() / VERTEX_FLOATS > MAX_VERTICES {
            return Err("mesh recipe exceeds the vertex limit".into());
        }
        self.vertices.extend(g.vertices.iter().map(|&v| v as f64));
        self.indices.extend(g.indices.iter().map(|&i| i + first));
        Ok(())
    }

    pub fn finish(self) -> Geometry {
        Geometry {
            vertices: self.vertices.into_iter().map(|v| v as f32).collect(),
            indices: self.indices,
        }
    }
}

struct Attr {
    nodes: Vec<u32>,
}

impl Attr {
    fn new(graph: &Graph, names: &[String]) -> Result<Attr, String> {
        Ok(Attr {
            nodes: names.iter().map(|n| graph.output(n)).collect::<Result<_, _>>()?,
        })
    }
    fn three(&self, graph: &Graph, s: &mut Scratch) -> [f64; 3] {
        [graph.eval(s, self.nodes[0]), graph.eval(s, self.nodes[1]), graph.eval(s, self.nodes[2])]
    }
    fn two(&self, graph: &Graph, s: &mut Scratch) -> [f64; 2] {
        [graph.eval(s, self.nodes[0]), graph.eval(s, self.nodes[1])]
    }
}

pub fn build(spec: &MeshSpec) -> Result<Geometry, String> {
    let graph = Graph::new(&spec.fields)?;
    let mut out = Builder::default();
    for part in &spec.parts {
        build_part(&graph, part, &mut out)?;
    }
    if out.indices.is_empty() {
        return Err("mesh recipe produced no triangles".into());
    }
    Ok(out.finish())
}

pub fn build_part(graph: &Graph, part: &PartSpec, out: &mut Builder) -> Result<(), String> {
    let mut s = graph.scratch();
    match part {
        PartSpec::Surface {
            rows,
            cols,
            position,
            normal,
            uv,
            color,
            double,
            flip,
        } => {
            let (rows, cols) = (*rows, *cols);
            if rows == 0 || cols == 0 || (rows as usize + 1) * (cols as usize + 1) + out.count() > MAX_VERTICES {
                return Err("surface needs 1+ rows and columns within the vertex limit".into());
            }
            let (p, n, t, c) = (
                Attr::new(graph, position)?,
                Attr::new(graph, normal)?,
                Attr::new(graph, uv)?,
                Attr::new(graph, color)?,
            );
            let (u, v, row_slot, col_slot) = (graph.var("u"), graph.var("v"), graph.var("row"), graph.var("col"));
            let first = out.count() as u32;
            for row in 0..=rows {
                for col in 0..=cols {
                    s.set(u, col as f64 / cols as f64);
                    s.set(v, row as f64 / rows as f64);
                    s.set(row_slot, row as f64);
                    s.set(col_slot, col as f64);
                    s.begin();
                    let (pos, nor, tex, col) = (
                        p.three(graph, &mut s),
                        n.three(graph, &mut s),
                        t.two(graph, &mut s),
                        c.three(graph, &mut s),
                    );
                    out.vertex(pos, nor, tex, col);
                }
            }
            for row in 0..rows {
                for col in 0..cols {
                    let a = first + row * (cols + 1) + col;
                    let b = a + cols + 1;
                    if *flip {
                        out.quad(a, b, b + 1, a + 1, *double);
                    } else {
                        out.quad(a, a + 1, b + 1, b, *double);
                    }
                }
            }
        }
        PartSpec::Cards {
            count,
            seed,
            randoms,
            corners,
            center,
            right,
            up,
            normal,
            color,
            double,
        } => {
            if !(3..=4).contains(&corners.len()) || *randoms > 32 || *count as usize * 4 + out.count() > MAX_VERTICES {
                return Err("cards need 3 or 4 corners, at most 32 randoms and fit the vertex limit".into());
            }
            let (center, right, up, normal, color) = (
                Attr::new(graph, center)?,
                Attr::new(graph, right)?,
                Attr::new(graph, up)?,
                Attr::new(graph, normal)?,
                Attr::new(graph, color)?,
            );
            let (i_slot, count_slot) = (graph.var("i"), graph.var("count"));
            let random_slots: Vec<Option<usize>> = (0..*randoms).map(|k| graph.var(&format!("r{k}"))).collect();
            let mut rng = Rng::new(*seed);
            for i in 0..*count {
                s.set(i_slot, i as f64);
                s.set(count_slot, *count as f64);
                for slot in &random_slots {
                    s.set(*slot, rng.next_f64());
                }
                s.begin();
                let (c, r, u, n, col) = (
                    center.three(graph, &mut s),
                    right.three(graph, &mut s),
                    up.three(graph, &mut s),
                    normal.three(graph, &mut s),
                    color.three(graph, &mut s),
                );
                let ids: Vec<u32> = corners
                    .iter()
                    .map(|&[cu, cv, tu, tv]| {
                        out.vertex(
                            [c[0] + r[0] * cu + u[0] * cv, c[1] + r[1] * cu + u[1] * cv, c[2] + r[2] * cu + u[2] * cv],
                            n,
                            [tu, tv],
                            col,
                        )
                    })
                    .collect();
                if ids.len() == 4 {
                    out.quad(ids[0], ids[1], ids[2], ids[3], *double);
                } else {
                    out.indices.extend_from_slice(&[ids[0], ids[1], ids[2]]);
                    if *double {
                        out.indices.extend_from_slice(&[ids[2], ids[1], ids[0]]);
                    }
                }
            }
        }
        PartSpec::Lathe {
            points,
            segments,
            sweep: turn,
            displace,
            color,
            cap_color,
            raw_caps,
            cap_rings,
            cut_color,
            cut_steps,
            color_field,
            cap_color_field,
            cut_color_field,
            displace_field,
        } => {
            let segments = (*segments as usize).max(3);
            let turn = turn.clamp(1e-3, std::f64::consts::TAU);
            let full = turn >= std::f64::consts::TAU - 1e-6;
            let rings = (*cap_rings as usize).max(1);
            let last = points.len().saturating_sub(1);
            // The seam and the poles must move together, or the surface tears.
            let sampled = match displace_field {
                Some(field) => Some(paint::sample_grid(last, segments, field, |i, j| {
                    let u = j as f64 / segments as f64;
                    let pole = points[i][0] < 1e-6;
                    (if pole || (full && j == segments) { 0.0 } else { u }, i as f64 / last.max(1) as f64)
                })?),
                None => None,
            };
            let mut g = sweep::lathe(&sweep::LatheSpec {
                points,
                segments,
                sweep: turn,
                displace: sampled.as_deref().or(displace.as_deref()),
                color: *color,
                cap: FacePaint {
                    color: *cap_color,
                    raw: *raw_caps || cap_color_field.is_some(),
                },
                cap_rings: rings,
                cut_color: *cut_color,
                cut_steps: *cut_steps as usize,
            })?;
            // Vertices: the side grid, the caps away from the axis (top, bottom), then the two cut faces.
            let mut at = (last + 1) * (segments + 1);
            if let Some(field) = color_field {
                paint::paint_surface(&mut g.vertices, 0..at, field)?;
            }
            for i in [0, last] {
                if points[i][0] < 1e-6 {
                    continue;
                }
                let end = at + (rings + 1) * (segments + 1);
                if let Some(field) = cap_color_field {
                    paint::paint_face(&mut g.vertices, at..end, turn, field)?;
                }
                at = end;
            }
            if !full && let Some(field) = cut_color_field {
                let half = (g.vertices.len() / VERTEX_FLOATS - at) / 2;
                let widest = points.iter().fold(1e-6f64, |w, p| w.max(p[0]));
                let skin = |y: f64| {
                    // The profile's radius at height y (for r from the axis to the skin).
                    let mut best = 0f64;
                    for w in points.windows(2) {
                        let ([r0, y0], [r1, y1]) = (w[0], w[1]);
                        if (y - y0) * (y - y1) <= 0.0 && y0 != y1 {
                            best = best.max(r0 + ((y - y0) / (y1 - y0)) * (r1 - r0));
                        }
                    }
                    if best == 0.0 { widest } else { best }
                };
                paint::paint_cuts(&mut g.vertices, at..at + half, at + half, skin, field)?;
            }
            out.append(g)?
        }
        PartSpec::Tube {
            points,
            closed,
            sides,
            steps,
            radii,
            shape,
            smooth,
            caps,
            color,
            cap_color,
            raw_caps,
            cap_rings,
            color_field,
            cap_color_field,
        } => {
            let sides_n = (*sides as usize).max(3);
            let rings = (*cap_rings as usize).max(1);
            let mut g = sweep::tube(&sweep::TubeSpec {
                points,
                closed: *closed,
                sides: sides_n,
                steps: *steps as usize,
                radii,
                shape: shape.as_deref(),
                smooth: *smooth,
                caps: *caps,
                color: *color,
                cap: FacePaint {
                    color: *cap_color,
                    raw: *raw_caps || cap_color_field.is_some(),
                },
                cap_rings: rings,
            })?;
            // Vertices: the side rings, then the start and end caps (where the radius isn't 0).
            let mut at = radii.len() * (sides_n + 1);
            if let Some(field) = color_field {
                paint::paint_surface(&mut g.vertices, 0..at, field)?;
            }
            if !*closed
                && *caps
                && let Some(field) = cap_color_field
            {
                for i in [0, radii.len() - 1] {
                    if radii[i].max(0.0) < 1e-6 {
                        continue;
                    }
                    let end = at + (rings + 1) * (sides_n + 1);
                    paint::paint_face(&mut g.vertices, at..end, std::f64::consts::TAU, field)?;
                    at = end;
                }
            }
            out.append(g)?
        }
        PartSpec::Loft {
            sections,
            around,
            smoothness,
            color,
            color_field,
        } => {
            let mut g = sweep::loft(sections, *around as usize, *smoothness as usize, *color)?;
            if let Some(field) = color_field {
                let n = g.vertices.len() / VERTEX_FLOATS;
                paint::paint_surface(&mut g.vertices, 0..n, field)?;
            }
            out.append(g)?
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_a_surface_and_cards() {
        let spec: MeshSpec = serde_json::from_str(
            r#"{"fields":{"nodes":[{"op":"var","name":"u"},{"op":"var","name":"v"},{"op":"const","value":0},{"op":"const","value":1},
            {"op":"var","name":"r0"}],"outputs":{"u":0,"v":1,"zero":2,"one":3,"r":4}},
            "parts":[{"kind":"surface","rows":2,"cols":3,"position":["u","zero","v"],"normal":["zero","one","zero"],"uv":["u","v"],"color":["one","one","one"],"double":true},
            {"kind":"cards","count":5,"seed":7,"randoms":1,"corners":[[-1,0,0,0],[1,0,1,0],[0,1,0.5,1]],"center":["r","zero","zero"],"right":["one","zero","zero"],"up":["zero","one","zero"],"normal":["zero","one","zero"],"color":["one","one","one"]}]}"#,
        )
        .unwrap();
        let g = build(&spec).unwrap();
        assert_eq!(g.vertices.len() / VERTEX_FLOATS, 12 + 15);
        assert_eq!(g.indices.len(), 2 * 3 * 12 + 5 * 3);
        assert_eq!(&g.vertices[0..3], &[0.0, 0.0, 0.0]);
        assert!(g.indices.iter().all(|&i| (i as usize) < 27));
    }
}
