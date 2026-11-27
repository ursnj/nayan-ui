//! Heightfield terrain: heights sampled from a field on a (possibly non-uniform) grid, drawn as
//! triangles, with material regions split along the regions' own contour fields so material edges
//! follow curves rather than grid cells. The same triangle planes answer ground-height queries, so
//! actors and scenery stand exactly on what is drawn.

use super::field::{Graph, Scratch, Slots};
use super::math;
use super::mesh::{Builder, VERTEX_FLOATS};
use crate::assets::modelling::Geometry;
use serde::Deserialize;

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RegionSpec {
    /// The region covers points where this field is <= 0 (regions are tested in order).
    pub field: String,
    /// The surface code queries report (0 is reserved for "outside").
    pub surface: u8,
    pub material: u8,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FallbackSpec {
    pub surface: u8,
    pub material: u8,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TerrainSpec {
    /// Grid lines along both axes, ascending (stored at f32 precision, as drawn).
    pub axis: Vec<f64>,
    /// Height field output name.
    pub height: String,
    /// Half-step of the finite differences that give vertex normals.
    #[serde(default = "normal_step")]
    pub normal_step: f64,
    /// World units per texture repeat along x and z.
    #[serde(default = "uv_size")]
    pub uv_size: [f64; 2],
    /// Optional per-vertex brightness field, multiplied by `tint`.
    #[serde(default)]
    pub shade: Option<String>,
    #[serde(default = "tint")]
    pub tint: [f64; 3],
    #[serde(default)]
    pub regions: Vec<RegionSpec>,
    pub fallback: FallbackSpec,
    /// Number of materials (meshes) produced.
    pub materials: u8,
}

fn normal_step() -> f64 {
    0.15
}
fn uv_size() -> [f64; 2] {
    [1.0, 1.0]
}
fn tint() -> [f64; 3] {
    [1.0, 1.0, 1.0]
}

pub struct Terrain {
    pub spec: TerrainSpec,
    axis: Vec<f64>,
    heights: Vec<f32>,
    height: u32,
    shade: Option<u32>,
    regions: Vec<(u32, u8, u8)>,
}

const MAX_AXIS: usize = 2049;

impl Terrain {
    pub fn new(spec: &TerrainSpec, graph: &Graph, s: &mut Scratch) -> Result<Terrain, String> {
        let axis: Vec<f64> = spec.axis.iter().map(|&a| a as f32 as f64).collect();
        if axis.len() < 2 || axis.len() > MAX_AXIS || axis.windows(2).any(|w| !(w[1] > w[0])) {
            return Err("terrain axis needs 2 to 2049 strictly ascending lines".into());
        }
        if spec.materials == 0 || spec.fallback.material >= spec.materials || spec.regions.iter().any(|r| r.material >= spec.materials) {
            return Err("terrain material index out of range".into());
        }
        if spec.fallback.surface == 0 || spec.regions.iter().any(|r| r.surface == 0) {
            return Err("terrain surface code 0 is reserved".into());
        }
        let height = graph.output(&spec.height)?;
        let shade = spec.shade.as_deref().map(|name| graph.output(name)).transpose()?;
        let regions = spec
            .regions
            .iter()
            .map(|r| Ok((graph.output(&r.field)?, r.surface, r.material)))
            .collect::<Result<Vec<_>, String>>()?;
        let slots = Slots::xz(graph);
        let n = axis.len();
        let mut heights = Vec::with_capacity(n * n);
        for row in 0..n {
            for col in 0..n {
                heights.push(graph.at(s, slots, height, axis[col], axis[row]) as f32);
            }
        }
        Ok(Terrain {
            spec: spec.clone(),
            axis,
            heights,
            height,
            shade,
            regions,
        })
    }

    fn cell(&self, value: f64) -> usize {
        let n = self.axis.len();
        let above = self.axis.partition_point(|&a| a <= value);
        above.saturating_sub(1).min(n - 2)
    }

    /// Height of the drawn triangle under (x, z) (the grid's own diagonal split; edges clamp).
    pub fn mesh_height(&self, x: f64, z: f64) -> f64 {
        let width = self.axis.len();
        let (col, row) = (self.cell(x), self.cell(z));
        let at = row * width + col;
        let a = &self.axis;
        let h = |i: usize| self.heights[i] as f64;
        let u = math::max(0.0, math::min(1.0, (x - a[col]) / (a[col + 1] - a[col])));
        let v = math::max(0.0, math::min(1.0, (z - a[row]) / (a[row + 1] - a[row])));
        if u + v <= 1.0 {
            h(at) + u * (h(at + 1) - h(at)) + v * (h(at + width) - h(at))
        } else {
            h(at + width + 1) + (1.0 - u) * (h(at + width) - h(at + width + 1)) + (1.0 - v) * (h(at + 1) - h(at + width + 1))
        }
    }

    /// The field height (not the drawn triangles).
    pub fn field_height(&self, graph: &Graph, s: &mut Scratch, x: f64, z: f64) -> f64 {
        graph.at(s, Slots::xz(graph), self.height, x, z)
    }

    /// (surface code, material) at a local point.
    pub fn classify(&self, graph: &Graph, s: &mut Scratch, x: f64, z: f64) -> (u8, u8) {
        let slots = Slots::xz(graph);
        s.set(slots.x, x);
        s.set(slots.z, z);
        s.begin();
        for &(field, surface, material) in &self.regions {
            if graph.eval(s, field) <= 0.0 {
                return (surface, material);
            }
        }
        (self.spec.fallback.surface, self.spec.fallback.material)
    }

    /// One mesh per material, each with only the vertices it uses.
    pub fn meshes(&self, graph: &Graph, s: &mut Scratch) -> Vec<Geometry> {
        Mesher::new(self, graph, s).run()
    }
}

#[derive(Clone, Copy)]
struct Point {
    x: f64,
    z: f64,
    index: Option<u32>,
    surface: Option<u8>,
}

struct Mesher<'a> {
    terrain: &'a Terrain,
    graph: &'a Graph,
    s: &'a mut Scratch,
    slots: Slots,
    points: Vec<Point>,
    mesh: Builder,
    targets: Vec<Vec<u32>>,
}

impl<'a> Mesher<'a> {
    fn new(terrain: &'a Terrain, graph: &'a Graph, s: &'a mut Scratch) -> Mesher<'a> {
        Mesher {
            terrain,
            graph,
            s,
            slots: Slots::xz(graph),
            points: Vec::new(),
            mesh: Builder::default(),
            targets: vec![Vec::new(); terrain.spec.materials as usize],
        }
    }

    fn field(&mut self, node: u32, x: f64, z: f64) -> f64 {
        self.graph.at(self.s, self.slots, node, x, z)
    }

    fn vertex(&mut self, id: usize) -> u32 {
        if let Some(index) = self.points[id].index {
            return index;
        }
        let Point { x, z, .. } = self.points[id];
        let t = self.terrain;
        let y = t.mesh_height(x, z);
        let e = t.spec.normal_step;
        let dx = (self.field(t.height, x + e, z) - self.field(t.height, x - e, z)) / (2.0 * e);
        let dz = (self.field(t.height, x, z + e) - self.field(t.height, x, z - e)) / (2.0 * e);
        let length = math::hypot(&[dx, 1.0, dz]);
        let shade = match t.shade {
            Some(node) => self.field(node, x, z),
            None => 1.0,
        };
        let tint = t.spec.tint;
        let index = self.mesh.vertex(
            [x, y, z],
            [-dx / length, 1.0 / length, -dz / length],
            [x / t.spec.uv_size[0], z / t.spec.uv_size[1]],
            [shade * tint[0], shade * tint[1], shade * tint[2]],
        );
        self.points[id].index = Some(index);
        index
    }

    fn surface(&mut self, id: usize) -> u8 {
        if let Some(surface) = self.points[id].surface {
            return surface;
        }
        let Point { x, z, .. } = self.points[id];
        let surface = self.terrain.classify(self.graph, self.s, x, z).0;
        self.points[id].surface = Some(surface);
        surface
    }

    fn append(&mut self, polygon: &[usize], material: u8) {
        if polygon.len() < 3 {
            return;
        }
        let ids: Vec<u32> = polygon.iter().map(|&p| self.vertex(p)).collect();
        let a = self.points[polygon[0]];
        for i in 1..polygon.len() - 1 {
            let (b, c) = (self.points[polygon[i]], self.points[polygon[i + 1]]);
            if ((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)).abs() > 1e-8 {
                self.targets[material as usize].extend_from_slice(&[ids[0], ids[i], ids[i + 1]]);
            }
        }
    }

    /// Splits a convex polygon along `node`'s zero contour: (where <= 0, where > 0).
    fn split(&mut self, polygon: &[usize], node: u32) -> (Vec<usize>, Vec<usize>) {
        let (mut inside, mut outside) = (Vec::new(), Vec::new());
        for i in 0..polygon.len() {
            let (ia, ib) = (polygon[i], polygon[(i + 1) % polygon.len()]);
            let (a, b) = (self.points[ia], self.points[ib]);
            let (fa, fb) = (self.field(node, a.x, a.z), self.field(node, b.x, b.z));
            if fa <= 0.0 { &mut inside } else { &mut outside }.push(ia);
            if (fa <= 0.0) != (fb <= 0.0) {
                let (mut low, mut high) = (0.0, 1.0);
                for _ in 0..10 {
                    let t = (low + high) / 2.0;
                    let value = self.field(node, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
                    if (value <= 0.0) == (fa <= 0.0) {
                        low = t;
                    } else {
                        high = t;
                    }
                }
                let t = (low + high) / 2.0;
                self.points.push(Point {
                    x: a.x + (b.x - a.x) * t,
                    z: a.z + (b.z - a.z) * t,
                    index: None,
                    surface: None,
                });
                let cut = self.points.len() - 1;
                inside.push(cut);
                outside.push(cut);
            }
        }
        (inside, outside)
    }

    fn triangle(&mut self, ids: [usize; 3]) {
        let kinds = [self.surface(ids[0]), self.surface(ids[1]), self.surface(ids[2])];
        if kinds[1] == kinds[0] && kinds[2] == kinds[0] {
            let material = self.material_of(kinds[0]);
            self.append(&ids, material);
            return;
        }
        let mut rest: Vec<usize> = ids.to_vec();
        for k in 0..self.terrain.regions.len() {
            let (field, _, material) = self.terrain.regions[k];
            let (inside, outside) = self.split(&rest, field);
            self.append(&inside, material);
            rest = outside;
            if rest.len() < 3 {
                return;
            }
        }
        let fallback = self.terrain.spec.fallback.material;
        self.append(&rest, fallback);
    }

    fn material_of(&self, surface: u8) -> u8 {
        self.terrain
            .regions
            .iter()
            .find(|r| r.1 == surface)
            .map_or(self.terrain.spec.fallback.material, |r| r.2)
    }

    fn run(mut self) -> Vec<Geometry> {
        let n = self.terrain.axis.len();
        for row in 0..n {
            for col in 0..n {
                self.points.push(Point {
                    x: self.terrain.axis[col],
                    z: self.terrain.axis[row],
                    index: None,
                    surface: None,
                });
                let id = self.points.len() - 1;
                self.vertex(id);
            }
        }
        let divisions = n - 1;
        for row in 0..divisions {
            for col in 0..divisions {
                let a = row * n + col;
                let b = a + n;
                self.triangle([a, b, a + 1]);
                self.triangle([a + 1, b, b + 1]);
            }
        }
        let vertices: Vec<f32> = self.mesh.vertices.iter().map(|&v| v as f32).collect();
        let total = vertices.len() / VERTEX_FLOATS;
        self.targets
            .iter()
            .map(|indices| {
                let mut remap = vec![u32::MAX; total];
                let mut compact = Vec::new();
                let mapped = indices
                    .iter()
                    .map(|&old| {
                        let slot = &mut remap[old as usize];
                        if *slot == u32::MAX {
                            *slot = (compact.len() / VERTEX_FLOATS) as u32;
                            let at = old as usize * VERTEX_FLOATS;
                            compact.extend_from_slice(&vertices[at..at + VERTEX_FLOATS]);
                        }
                        *slot
                    })
                    .collect();
                Geometry {
                    vertices: compact,
                    indices: mapped,
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::worldgen::field::GraphSpec;

    /// A plane tilted along x, with "water" below x = 0.
    fn setup() -> (Graph, TerrainSpec) {
        let spec: GraphSpec = serde_json::from_str(
            r#"{"nodes":[{"op":"var","name":"x"},{"op":"var","name":"z"},{"op":"const","value":0.5},{"op":"mul","a":0,"b":2}],
            "outputs":{"height":3,"water":0}}"#,
        )
        .unwrap();
        let terrain: TerrainSpec = serde_json::from_str(
            r#"{"axis":[-2,-1,0.5,1,2],"height":"height","regions":[{"field":"water","surface":2,"material":1}],
            "fallback":{"surface":1,"material":0},"materials":2}"#,
        )
        .unwrap();
        (Graph::new(&spec).unwrap(), terrain)
    }

    #[test]
    fn ground_follows_the_drawn_triangles_and_regions_split_along_contours() {
        let (graph, spec) = setup();
        let mut s = graph.scratch();
        let terrain = Terrain::new(&spec, &graph, &mut s).unwrap();
        assert!((terrain.mesh_height(0.75, 0.3) - 0.375).abs() < 1e-6);
        assert!((terrain.mesh_height(9.0, 0.0) - 1.0).abs() < 1e-6, "clamped at the edge");
        assert_eq!(terrain.classify(&graph, &mut s, -0.5, 0.0), (2, 1));
        assert_eq!(terrain.classify(&graph, &mut s, 0.5, 0.0), (1, 0));
        let meshes = terrain.meshes(&graph, &mut s);
        assert_eq!(meshes.len(), 2);
        for (material, mesh) in meshes.iter().enumerate() {
            assert!(!mesh.indices.is_empty());
            for v in mesh.vertices.chunks(VERTEX_FLOATS) {
                // Every vertex of the water mesh is at x <= 0, of the land at x >= 0 (cuts land on 0).
                if material == 1 {
                    assert!(v[0] <= 1e-3)
                } else {
                    assert!(v[0] >= -1e-3)
                }
                assert!((v[1] - v[0] * 0.5).abs() < 1e-5);
            }
        }
    }
}
