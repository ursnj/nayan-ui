//! Generated worlds: a recipe (fields, terrain, platforms, solids, walking rules and an ordered list
//! of generation steps) becomes terrain, seeded placements, reachable ground and picked spots, plus
//! the queries actors need every frame (ground, surface, walkability, swept movement, sight).
//!
//! Fields are defined in a local frame; `rotation` turns the whole local frame into the world, so one
//! recipe yields differently oriented worlds. Queries and placements use world coordinates.

use super::field::{Graph, GraphSpec, Scratch, Slots};
use super::math;
use super::mesh::{self, MeshSpec, VERTEX_FLOATS};
use super::rng::{Rng, derive};
use super::solids::{Solid, Solids, Template};
use super::terrain::{Terrain, TerrainSpec};
use crate::assets::modelling::Geometry;
use serde::Deserialize;
use std::sync::Mutex;

#[derive(Clone, Copy, Default, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Frame {
    Local,
    #[default]
    World,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PlatformSpec {
    /// An axis-aligned walkable deck in the local frame (bridges, piers) at height `y`.
    pub x: f64,
    pub z: f64,
    pub half_x: f64,
    pub half_z: f64,
    pub y: f64,
    pub surface: u8,
}

#[derive(Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum SolidSpec {
    #[serde(rename_all = "camelCase")]
    Box {
        x: f64,
        z: f64,
        half_x: f64,
        half_z: f64,
        #[serde(default)]
        yaw: f64,
        bottom: f64,
        top: f64,
        #[serde(default)]
        frame: Frame,
    },
    Circle {
        x: f64,
        z: f64,
        radius: f64,
        bottom: f64,
        top: f64,
        #[serde(default)]
        frame: Frame,
    },
    Hull {
        template: usize,
        x: f64,
        y: f64,
        z: f64,
        scale: [f64; 3],
        #[serde(default)]
        yaw: f64,
        #[serde(default)]
        frame: Frame,
    },
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WalkSpec {
    /// Walkers stay within this distance of the world origin (their radius included).
    pub boundary: f64,
    /// Local field: walkable ground where >= 0 under every footprint sample.
    pub clearance: String,
    /// Samples on the footprint's rim (plus its centre).
    #[serde(default = "footprint")]
    pub footprint: u32,
    /// Largest height change across a footprint: max(step[0], radius · step[1]).
    #[serde(default = "step")]
    pub step: [f64; 2],
    /// Walker height: solids overlapping lift..height above the ground block it.
    pub height: f64,
    #[serde(default = "lift")]
    pub lift: f64,
    /// Spatial grid cell for solids.
    #[serde(default = "cell")]
    pub cell: f64,
}

fn footprint() -> u32 {
    8
}
fn step() -> [f64; 2] {
    [0.25, 0.5]
}
fn lift() -> f64 {
    0.02
}
fn cell() -> f64 {
    8.0
}

#[derive(Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Source {
    #[default]
    None,
    /// Each item starts at a random reachable point (inputs `sx`, `sz`).
    Reachable,
    /// `count` items per anchor (inputs `a0`, `a1`, …).
    Anchors(Vec<Vec<f64>>),
}

#[derive(Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum Filter {
    /// Keeps items where the field is within min..max.
    Field {
        field: String,
        #[serde(default)]
        min: Option<f64>,
        #[serde(default)]
        max: Option<f64>,
    },
    Walkable {
        radius: f64,
    },
    Surface {
        surfaces: Vec<u8>,
    },
    #[serde(rename_all = "camelCase")]
    Spawn {
        min_distance: f64,
    },
}

#[derive(Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum ItemSolid {
    None,
    Circle {
        radius: String,
        bottom: String,
        top: String,
    },
    Hull {
        template: String,
        scale: [String; 3],
        y: String,
        yaw: String,
    },
}

#[derive(Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LayerSolid {
    /// Field choosing which entry of `shapes` an item uses (default: the first).
    #[serde(default)]
    pub variant: Option<String>,
    pub shapes: Vec<ItemSolid>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LayerSpec {
    pub name: String,
    pub count: u32,
    /// Random inputs r0… drawn per item, before its position.
    #[serde(default)]
    pub randoms: u32,
    /// The random stream: layers with the same salt draw the same values (paired scenery). By
    /// default each step has its own.
    #[serde(default)]
    pub salt: Option<u32>,
    #[serde(default)]
    pub source: Source,
    /// The frame `x` and `z` produce positions in.
    #[serde(default)]
    pub frame: Frame,
    pub x: String,
    pub z: String,
    #[serde(default)]
    pub filters: Vec<Filter>,
    /// Inputs here and below also include `x`, `z` (local), `wx`, `wz` (world) and `ground`.
    pub y: String,
    #[serde(default)]
    pub attributes: Vec<String>,
    #[serde(default)]
    pub solid: Option<LayerSolid>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PickGroup {
    pub name: String,
    pub count: u32,
    pub spacing: f64,
    #[serde(default)]
    pub from_spawn: f64,
}

#[derive(Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum StepSpec {
    /// Finds a walkable spawn near a local point, searching outwards in rings.
    Spawn {
        near: [f64; 2],
        rings: u32,
        samples: u32,
        radius: f64,
        #[serde(default)]
        surfaces: Vec<u8>,
    },
    Scatter(LayerSpec),
    /// Flood-fills the ground walkable from the spawn on a lattice of `cell / steps` spacing, linking
    /// cells `cell` apart only through clear lattice steps.
    Reach {
        cell: f64,
        steps: u32,
        radius: f64,
        extent: f64,
    },
    /// Spaced spots among the reachable cells, re-drawn per run with `pick(run)`.
    Pick {
        groups: Vec<PickGroup>,
        #[serde(default = "attempts")]
        attempts: u32,
    },
    /// A size × size grid of surface codes over ±extent (0 outside the boundary).
    Overview {
        size: u32,
        extent: f64,
    },
}

fn attempts() -> u32 {
    8
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WorldSpec {
    pub seed: u32,
    #[serde(default)]
    pub rotation: f64,
    pub fields: GraphSpec,
    pub terrain: TerrainSpec,
    #[serde(default)]
    pub platforms: Vec<PlatformSpec>,
    /// Mesh recipes whose convex hulls serve as solid templates.
    #[serde(default)]
    pub templates: Vec<MeshSpec>,
    #[serde(default)]
    pub solids: Vec<SolidSpec>,
    pub walk: WalkSpec,
    #[serde(default)]
    pub steps: Vec<StepSpec>,
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Layer {
    pub name: String,
    pub stride: u32,
    pub data: Vec<f64>,
}

/// What generation produced: everything a restore needs besides the recipe.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Generated {
    pub spawn: [f64; 2],
    pub layers: Vec<Layer>,
    pub solids: Vec<Solid>,
    pub reachable: Vec<[f64; 2]>,
    pub picks: Vec<(String, Vec<[f64; 2]>)>,
    pub overview: Vec<u8>,
}

struct Walk {
    boundary: f64,
    clearance: u32,
    footprint: Vec<[f64; 2]>,
    step: [f64; 2],
    height: f64,
    lift: f64,
}

pub struct World {
    seed: u32,
    cos: f64,
    sin: f64,
    graph: Graph,
    slots: Slots,
    terrain: Terrain,
    platforms: Vec<PlatformSpec>,
    templates: Vec<Template>,
    solids: Solids,
    walk: Walk,
    steps: Vec<StepSpec>,
    pub generated: Generated,
    pub restored: bool,
    scratch: Mutex<Scratch>,
    pub terrain_meshes: Mutex<Option<Vec<Option<Geometry>>>>,
}

const MAX_ITEMS: u64 = 1_000_000;

impl World {
    /// The recipe's fixed parts: fields, terrain heights, platforms, templates and static solids.
    pub fn new(spec: WorldSpec) -> Result<World, String> {
        let graph = Graph::new(&spec.fields)?;
        let mut scratch = graph.scratch();
        let terrain = Terrain::new(&spec.terrain, &graph, &mut scratch)?;
        let templates = spec
            .templates
            .iter()
            .map(|recipe| {
                let g = mesh::build(recipe)?;
                Ok(Template::from_positions(
                    g.vertices.chunks(VERTEX_FLOATS).map(|v| [v[0] as f64, v[1] as f64, v[2] as f64]),
                ))
            })
            .collect::<Result<Vec<_>, String>>()?;
        let w = &spec.walk;
        if !(w.boundary > 0.0 && w.height > 0.0 && w.cell > 0.0) || w.footprint > 64 {
            return Err("walk boundary, height and cell must be positive (footprint at most 64)".into());
        }
        let mut footprint = vec![[0.0, 0.0]];
        for i in 1..=w.footprint {
            let angle = ((i - 1) as f64 / w.footprint as f64) * std::f64::consts::PI * 2.0;
            footprint.push([math::cos(angle), math::sin(angle)]);
        }
        let walk = Walk {
            boundary: w.boundary,
            clearance: graph.output(&w.clearance)?,
            footprint,
            step: w.step,
            height: w.height,
            lift: w.lift,
        };
        let slots = Slots::xz(&graph);
        let mut world = World {
            seed: spec.seed,
            cos: math::cos(spec.rotation),
            sin: math::sin(spec.rotation),
            graph,
            slots,
            terrain,
            platforms: spec.platforms,
            templates,
            solids: Solids::new(spec.walk.cell, 1.5),
            walk,
            steps: spec.steps,
            generated: Generated::default(),
            restored: false,
            scratch: Mutex::new(scratch),
            terrain_meshes: Mutex::new(None),
        };
        let rotation = spec.rotation;
        for solid in &spec.solids {
            let placed = world.static_solid(solid, rotation)?;
            world.solids.add(placed);
        }
        Ok(world)
    }

    fn static_solid(&self, spec: &SolidSpec, rotation: f64) -> Result<Solid, String> {
        let place = |frame: Frame, x: f64, z: f64, yaw: f64| match frame {
            Frame::Local => {
                let (wx, wz) = self.to_world(x, z);
                (wx, wz, yaw + rotation)
            }
            Frame::World => (x, z, yaw),
        };
        Ok(match *spec {
            SolidSpec::Box {
                x,
                z,
                half_x,
                half_z,
                yaw,
                bottom,
                top,
                frame,
            } => {
                let (x, z, yaw) = place(frame, x, z, yaw);
                Solid::rectangle(x, z, half_x, half_z, yaw, bottom, top)
            }
            SolidSpec::Circle {
                x,
                z,
                radius,
                bottom,
                top,
                frame,
            } => {
                let (x, z, _) = place(frame, x, z, 0.0);
                Solid::circle(x, z, radius, bottom, top)
            }
            SolidSpec::Hull {
                template,
                x,
                y,
                z,
                scale,
                yaw,
                frame,
            } => {
                let (x, z, yaw) = place(frame, x, z, yaw);
                self.templates
                    .get(template)
                    .ok_or("solid template index out of range")?
                    .place(x, y, z, scale, yaw)
            }
        })
    }

    /// Adopts saved results (from a matching recipe) instead of generating.
    pub fn adopt(&mut self, generated: Generated) {
        for solid in &generated.solids {
            self.solids.add(solid.clone());
        }
        self.generated = generated;
        self.restored = true;
    }

    pub fn generate(&mut self) -> Result<(), String> {
        let steps = std::mem::take(&mut self.steps);
        let mut item = self.graph.scratch();
        let mut query = self.graph.scratch();
        for (index, step) in steps.iter().enumerate() {
            match step {
                StepSpec::Spawn {
                    near,
                    rings,
                    samples,
                    radius,
                    surfaces,
                } => {
                    self.generated.spawn = self.find_spawn(&mut query, *near, *rings, *samples, *radius, surfaces);
                }
                StepSpec::Scatter(layer) => {
                    let (out, solids) = self.scatter(layer, index as u32, &mut item, &mut query)?;
                    for solid in &solids {
                        self.solids.add(solid.clone());
                    }
                    self.generated.solids.extend(solids);
                    self.generated.layers.push(out);
                }
                StepSpec::Reach { cell, steps, radius, extent } => {
                    self.generated.reachable = self.reach(&mut query, *cell, *steps, *radius, *extent)?;
                }
                StepSpec::Pick { groups, attempts } => {
                    self.generated.picks = self
                        .pick(0, groups, *attempts)
                        .ok_or("not enough reachable ground for the picked spots")?;
                }
                StepSpec::Overview { size, extent } => {
                    self.generated.overview = self.overview(&mut query, *size, *extent)?;
                }
            }
        }
        self.steps = steps;
        Ok(())
    }

    // Frames.

    pub fn to_local(&self, x: f64, z: f64) -> (f64, f64) {
        (self.cos * x - self.sin * z, self.sin * x + self.cos * z)
    }

    pub fn to_world(&self, x: f64, z: f64) -> (f64, f64) {
        (self.cos * x + self.sin * z, -self.sin * x + self.cos * z)
    }

    // Queries (world coordinates).

    fn platform_local(&self, x: f64, z: f64) -> Option<usize> {
        self.platforms
            .iter()
            .position(|p| (x - p.x).abs() <= p.half_x && (z - p.z).abs() <= p.half_z)
    }

    pub fn platform(&self, x: f64, z: f64) -> Option<usize> {
        let (lx, lz) = self.to_local(x, z);
        self.platform_local(lx, lz)
    }

    pub fn ground(&self, x: f64, z: f64) -> f64 {
        let (lx, lz) = self.to_local(x, z);
        match self.platform_local(lx, lz) {
            Some(i) => self.platforms[i].y,
            None => self.terrain.mesh_height(lx, lz),
        }
    }

    fn surface_with(&self, s: &mut Scratch, x: f64, z: f64) -> u8 {
        let (lx, lz) = self.to_local(x, z);
        match self.platform_local(lx, lz) {
            Some(i) => self.platforms[i].surface,
            None => self.terrain.classify(&self.graph, s, lx, lz).0,
        }
    }

    fn walkable_with(&self, s: &mut Scratch, x: f64, z: f64, radius: f64) -> bool {
        if !(x + z).is_finite() || math::hypot2(x, z) + radius > self.walk.boundary {
            return false;
        }
        let y = self.ground(x, z);
        let step = math::max(self.walk.step[0], radius * self.walk.step[1]);
        for &[dx, dz] in &self.walk.footprint {
            let (sx, sz) = (x + dx * radius, z + dz * radius);
            let (lx, lz) = self.to_local(sx, sz);
            if self.graph.at(s, self.slots, self.walk.clearance, lx, lz) < -1e-8 {
                return false;
            }
            if (self.ground(sx, sz) - y).abs() > step {
                return false;
            }
        }
        self.solids.clearance(x, z, radius, y + self.walk.lift, y + self.walk.height) >= -1e-8
    }

    fn clearance_with(&self, s: &mut Scratch, x: f64, z: f64, radius: f64) -> f64 {
        let mut clearance = self.walk.boundary - radius - math::hypot2(x, z);
        for &[dx, dz] in &self.walk.footprint {
            let (lx, lz) = self.to_local(x + dx * radius, z + dz * radius);
            clearance = math::min(clearance, self.graph.at(s, self.slots, self.walk.clearance, lx, lz));
        }
        let floor = self.ground(x, z);
        math::min(
            clearance,
            self.solids.clearance(x, z, radius, floor + self.walk.lift, floor + self.walk.height),
        )
    }

    fn scratch(&self) -> std::sync::MutexGuard<'_, Scratch> {
        self.scratch.lock().unwrap_or_else(|e| e.into_inner())
    }

    pub fn surface(&self, x: f64, z: f64) -> u8 {
        self.surface_with(&mut self.scratch(), x, z)
    }

    pub fn walkable(&self, x: f64, z: f64, radius: f64) -> bool {
        self.walkable_with(&mut self.scratch(), x, z, radius)
    }

    pub fn clearance(&self, x: f64, z: f64, radius: f64) -> f64 {
        self.clearance_with(&mut self.scratch(), x, z, radius)
    }

    pub fn solid_clearance(&self, x: f64, z: f64, radius: f64, bottom: f64, top: f64) -> f64 {
        self.solids.clearance(x, z, radius, bottom, top)
    }

    pub fn field_index(&self, name: &str) -> Option<u32> {
        self.graph.output(name).ok()
    }

    /// A field at a world point (evaluated in the local frame).
    pub fn field(&self, node: u32, x: f64, z: f64) -> f64 {
        if node as usize >= self.graph.len() {
            return f64::NAN;
        }
        let (lx, lz) = self.to_local(x, z);
        self.graph.at(&mut self.scratch(), self.slots, node, lx, lz)
    }

    /// The ground's tilt under (x, z) as a quaternion [x, y, z, w] in a frame turned by `yaw`.
    pub fn tilt(&self, x: f64, z: f64, yaw: f64) -> [f64; 4] {
        let (c, s) = (math::cos(yaw) * 0.12, math::sin(yaw) * 0.12);
        let dx = (self.ground(x + c, z - s) - self.ground(x - c, z + s)) / 0.24;
        let dz = (self.ground(x + s, z + c) - self.ground(x - s, z - c)) / 0.24;
        let length = math::hypot(&[dx, 1.0, dz]);
        let q = [-dz / length, 0.0, dx / length, 1.0 + 1.0 / length];
        let norm = math::hypot(&q);
        [q[0] / norm, 0.0, q[2] / norm, q[3] / norm]
    }

    /// Whether a walker of `radius` could walk straight from a to b (sampled every `step`), with the
    /// two ends at most `rise` apart in height.
    pub fn sight(&self, a: [f64; 2], b: [f64; 2], radius: f64, step: f64, rise: f64) -> bool {
        if (self.ground(a[0], a[1]) - self.ground(b[0], b[1])).abs() > rise || !(step > 0.0) {
            return false;
        }
        let steps = (math::hypot2(b[0] - a[0], b[1] - a[1]) / step).ceil().min(100_000.0) as u32;
        let mut s = self.scratch();
        (1..steps).all(|i| {
            let t = i as f64 / steps as f64;
            self.walkable_with(&mut s, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, radius)
        })
    }

    /// Moves a walker by (dx, dz) in small sweeps: settles just before contact, then slides along the
    /// contact normal. `bodies` are other walkers [x, z, radius] it can't pass through (one it already
    /// overlaps may separate).
    pub fn move_walker(&self, start: [f64; 2], dx: f64, dz: f64, radius: f64, bodies: &[[f64; 3]]) -> [f64; 2] {
        let mut s = self.scratch();
        let mut point = start;
        let steps = math::max(1.0, (math::hypot2(dx, dz) / 0.2).ceil()).min(10_000.0);
        let (sx, sz) = (dx / steps, dz / steps);
        let length = math::hypot2(sx, sz);
        if !(length >= 1e-8) {
            return point;
        }
        let clear = |s: &mut Scratch, point: [f64; 2], x: f64, z: f64| {
            self.walkable_with(s, x, z, radius)
                && bodies.iter().all(|b| {
                    let next = math::hypot2(x - b[0], z - b[1]);
                    let current = math::hypot2(point[0] - b[0], point[1] - b[1]);
                    next >= radius + b[2] - 1e-8 || (current < radius + b[2] && next > current + 1e-8)
                })
        };
        let clearance = |s: &mut Scratch, x: f64, z: f64| {
            bodies.iter().fold(self.clearance_with(s, x, z, radius), |c, b| {
                math::min(c, math::hypot2(x - b[0], z - b[1]) - b[2] - radius)
            })
        };
        for _ in 0..steps as u32 {
            if clear(&mut s, point, point[0] + sx, point[1] + sz) {
                point = [point[0] + sx, point[1] + sz];
                continue;
            }
            let (mut low, mut high) = (0.0, 1.0);
            for _ in 0..9 {
                let t = (low + high) / 2.0;
                if clear(&mut s, point, point[0] + sx * t, point[1] + sz * t) {
                    low = t;
                } else {
                    high = t;
                }
            }
            let fraction = math::max(0.0, low - 0.003 / length);
            point = [point[0] + sx * fraction, point[1] + sz * fraction];
            let probe = 0.08;
            let nx = clearance(&mut s, point[0] + probe, point[1]) - clearance(&mut s, point[0] - probe, point[1]);
            let nz = clearance(&mut s, point[0], point[1] + probe) - clearance(&mut s, point[0], point[1] - probe);
            let norm = math::hypot2(nx, nz);
            if !(norm >= 1e-8) {
                continue;
            }
            let (normal_x, normal_z) = (nx / norm, nz / norm);
            let dot = math::min(0.0, sx * normal_x + sz * normal_z);
            let slide = [(sx - dot * normal_x) * (1.0 - fraction), (sz - dot * normal_z) * (1.0 - fraction)];
            if math::hypot2(slide[0], slide[1]) < 0.002 {
                continue;
            }
            for amount in [1.0, 0.5, 0.25] {
                if clear(&mut s, point, point[0] + slide[0] * amount, point[1] + slide[1] * amount) {
                    point = [point[0] + slide[0] * amount, point[1] + slide[1] * amount];
                    break;
                }
            }
        }
        point
    }

    // Generation steps.

    fn find_spawn(&self, s: &mut Scratch, near: [f64; 2], rings: u32, samples: u32, radius: f64, surfaces: &[u8]) -> [f64; 2] {
        let (x, z) = self.to_world(near[0], near[1]);
        let mut spawn = [x, z];
        let mut ring = 0;
        while ring < rings && !self.walkable_with(s, spawn[0], spawn[1], radius) {
            for i in 0..samples {
                let angle = (i as f64 / samples as f64) * std::f64::consts::PI * 2.0;
                let (cx, cz) = self.to_world(near[0] + math::cos(angle) * ring as f64, near[1] + math::sin(angle) * ring as f64);
                if (surfaces.is_empty() || surfaces.contains(&self.surface_with(s, cx, cz))) && self.walkable_with(s, cx, cz, radius) {
                    spawn = [cx, cz];
                    break;
                }
            }
            ring += 1;
        }
        spawn
    }

    fn scatter(&self, layer: &LayerSpec, index: u32, s: &mut Scratch, q: &mut Scratch) -> Result<(Layer, Vec<Solid>), String> {
        let g = &self.graph;
        let anchors: Vec<Option<&Vec<f64>>> = match &layer.source {
            Source::Anchors(list) => list.iter().map(Some).collect(),
            _ => vec![None],
        };
        if anchors.len() as u64 * layer.count as u64 > MAX_ITEMS || layer.randoms > 64 {
            return Err(format!("layer {} has too many items or randoms", layer.name));
        }
        if matches!(layer.source, Source::Reachable) && self.generated.reachable.is_empty() {
            return Err(format!("layer {} scatters over reachable ground before a reach step", layer.name));
        }
        let node = |name: &String| g.output(name);
        let (xf, zf, yf) = (node(&layer.x)?, node(&layer.z)?, node(&layer.y)?);
        let attributes = layer.attributes.iter().map(node).collect::<Result<Vec<_>, _>>()?;
        let filters: Vec<(Option<u32>, &Filter)> = layer
            .filters
            .iter()
            .map(|f| match f {
                Filter::Field { field, .. } => node(field).map(|n| (Some(n), f)),
                _ => Ok((None, f)),
            })
            .collect::<Result<_, _>>()?;
        struct Solved {
            variant: Option<u32>,
            shapes: Vec<SolvedShape>,
        }
        enum SolvedShape {
            None,
            Circle(u32, u32, u32),
            Hull(u32, [u32; 3], u32, u32),
        }
        let solid = layer
            .solid
            .as_ref()
            .map(|spec| -> Result<Solved, String> {
                Ok(Solved {
                    variant: spec.variant.as_ref().map(node).transpose()?,
                    shapes: spec
                        .shapes
                        .iter()
                        .map(|shape| {
                            Ok(match shape {
                                ItemSolid::None => SolvedShape::None,
                                ItemSolid::Circle { radius, bottom, top } => SolvedShape::Circle(node(radius)?, node(bottom)?, node(top)?),
                                ItemSolid::Hull { template, scale, y, yaw } => SolvedShape::Hull(
                                    node(template)?,
                                    [node(&scale[0])?, node(&scale[1])?, node(&scale[2])?],
                                    node(y)?,
                                    node(yaw)?,
                                ),
                            })
                        })
                        .collect::<Result<_, String>>()?,
                })
            })
            .transpose()?;
        let slot = |name: &str| g.var(name);
        let (i_slot, count_slot, sx_slot, sz_slot) = (slot("i"), slot("count"), slot("sx"), slot("sz"));
        let (wx_slot, wz_slot, ground_slot) = (slot("wx"), slot("wz"), slot("ground"));
        let random_slots: Vec<Option<usize>> = (0..layer.randoms).map(|k| slot(&format!("r{k}"))).collect();
        let anchor_slots: Vec<Option<usize>> = (0..16).map(|k| slot(&format!("a{k}"))).collect();
        let mut rng = Rng::new(derive(self.seed, layer.salt.unwrap_or_else(|| index.wrapping_mul(7919).wrapping_add(1))));
        let stride = 3 + attributes.len() as u32;
        let mut out = Layer {
            name: layer.name.clone(),
            stride,
            data: Vec::new(),
        };
        let mut solids = Vec::new();
        for anchor in anchors {
            for i in 0..layer.count {
                s.set(i_slot, i as f64);
                s.set(count_slot, layer.count as f64);
                if let Some(values) = anchor {
                    for (k, value) in values.iter().take(anchor_slots.len()).enumerate() {
                        s.set(anchor_slots[k], *value);
                    }
                }
                if matches!(layer.source, Source::Reachable) {
                    let reachable = &self.generated.reachable;
                    let at = reachable[((rng.next_f64() * reachable.len() as f64) as usize).min(reachable.len() - 1)];
                    s.set(sx_slot, at[0]);
                    s.set(sz_slot, at[1]);
                }
                for slot in &random_slots {
                    s.set(*slot, rng.next_f64());
                }
                s.set(self.slots.x, f64::NAN);
                s.set(self.slots.z, f64::NAN);
                s.begin();
                let (px, pz) = (g.eval(s, xf), g.eval(s, zf));
                let ((lx, lz), (wx, wz)) = match layer.frame {
                    Frame::Local => ((px, pz), self.to_world(px, pz)),
                    Frame::World => (self.to_local(px, pz), (px, pz)),
                };
                let ground = self.ground(wx, wz);
                s.set(self.slots.x, lx);
                s.set(self.slots.z, lz);
                s.set(wx_slot, wx);
                s.set(wz_slot, wz);
                s.set(ground_slot, ground);
                s.begin();
                let keep = filters.iter().all(|(field, filter)| match filter {
                    Filter::Field { min, max, .. } => {
                        let v = g.eval(s, field.unwrap());
                        min.is_none_or(|m| v >= m) && max.is_none_or(|m| v <= m)
                    }
                    Filter::Walkable { radius } => self.walkable_with(q, wx, wz, *radius),
                    Filter::Surface { surfaces } => surfaces.contains(&self.surface_with(q, wx, wz)),
                    Filter::Spawn { min_distance } => math::hypot2(wx - self.generated.spawn[0], wz - self.generated.spawn[1]) >= *min_distance,
                });
                if !keep {
                    continue;
                }
                let y = g.eval(s, yf);
                out.data.extend_from_slice(&[wx, y, wz]);
                for &a in &attributes {
                    out.data.push(g.eval(s, a));
                }
                if let Some(solid) = &solid {
                    let variant = solid.variant.map_or(0.0, |v| g.eval(s, v));
                    let shape = if variant >= 0.0 { solid.shapes.get(variant as usize) } else { None };
                    match shape {
                        Some(SolvedShape::Circle(r, b, t)) => solids.push(Solid::circle(wx, wz, g.eval(s, *r), g.eval(s, *b), g.eval(s, *t))),
                        Some(SolvedShape::Hull(template, scale, y, yaw)) => {
                            let t = g.eval(s, *template);
                            let template = (t >= 0.0)
                                .then(|| self.templates.get(t as usize))
                                .flatten()
                                .ok_or("hull template index out of range")?;
                            let scale = [g.eval(s, scale[0]), g.eval(s, scale[1]), g.eval(s, scale[2])];
                            solids.push(template.place(wx, g.eval(s, *y), wz, scale, g.eval(s, *yaw)));
                        }
                        Some(SolvedShape::None) | None => {}
                    }
                }
            }
        }
        Ok((out, solids))
    }

    fn reach(&self, s: &mut Scratch, cell: f64, steps: u32, radius: f64, extent: f64) -> Result<Vec<[f64; 2]>, String> {
        if !(cell > 0.0) || steps == 0 || !(extent > 0.0) {
            return Err("reach needs a positive cell, steps and extent".into());
        }
        let spacing = cell / steps as f64;
        let spawn = self.generated.spawn;
        let min_x = ((-extent - spawn[0]) / spacing).floor() as i64;
        let min_z = ((-extent - spawn[1]) / spacing).floor() as i64;
        let width = ((extent * 2.0) / spacing).ceil() as i64 + 3;
        if width > 8192 {
            return Err("reach lattice too large".into());
        }
        let mut walkable = vec![0u8; (width * width) as usize];
        let mut clear_at = |s: &mut Scratch, x: i64, z: i64| {
            let (col, row) = (x - min_x, z - min_z);
            if col < 0 || row < 0 || col >= width || row >= width {
                return false;
            }
            let index = (row * width + col) as usize;
            if walkable[index] == 0 {
                walkable[index] = if self.walkable_with(s, spawn[0] + x as f64 * spacing, spawn[1] + z as f64 * spacing, radius) {
                    1
                } else {
                    2
                };
            }
            walkable[index] == 1
        };
        let mut visited = std::collections::HashSet::from([(0i64, 0i64)]);
        let mut queue = vec![(0i64, 0i64)];
        let mut points = Vec::new();
        let n = steps as i64;
        let mut index = 0;
        while index < queue.len() {
            let (cx, cz) = queue[index];
            index += 1;
            points.push([spawn[0] + cx as f64 * cell, spawn[1] + cz as f64 * cell]);
            for (dx, dz) in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)] {
                let (nx, nz) = (cx + dx, cz + dz);
                if visited.contains(&(nx, nz)) {
                    continue;
                }
                if !clear_at(s, nx * n, nz * n) {
                    visited.insert((nx, nz));
                    continue;
                }
                if (1..n).all(|step| clear_at(s, cx * n + dx * step, cz * n + dz * step)) {
                    visited.insert((nx, nz));
                    queue.push((nx, nz));
                }
            }
        }
        Ok(points)
    }

    /// Spaced spots for run `run` (0 at generation), or None when a group doesn't fit.
    pub fn pick(&self, run: u32, groups: &[PickGroup], attempts: u32) -> Option<Vec<(String, Vec<[f64; 2]>)>> {
        let spawn = self.generated.spawn;
        let gap = |a: [f64; 2], b: [f64; 2]| math::hypot2(a[0] - b[0], a[1] - b[1]);
        'attempt: for attempt in 0..attempts.max(1) {
            let mut rng = Rng::new(derive(self.seed, run.wrapping_mul(attempts.max(1)).wrapping_add(attempt + 1)));
            let mut candidates = self.generated.reachable.clone();
            for i in (1..candidates.len()).rev() {
                let at = ((rng.next_f64() * (i + 1) as f64) as usize).min(i);
                candidates.swap(i, at);
            }
            let mut result = Vec::new();
            for group in groups {
                let mut target: Vec<[f64; 2]> = Vec::new();
                for &p in &candidates {
                    if target.len() == group.count as usize {
                        break;
                    }
                    if gap(p, spawn) >= group.from_spawn && target.iter().all(|&o| gap(p, o) >= group.spacing) {
                        target.push(p);
                    }
                }
                if target.len() != group.count as usize {
                    continue 'attempt;
                }
                result.push((group.name.clone(), target));
            }
            return Some(result);
        }
        None
    }

    /// Re-picks the spots for `run` (Play Again); false keeps the previous ones.
    pub fn repick(&mut self, run: u32) -> bool {
        let found = self.steps.iter().find_map(|step| match step {
            StepSpec::Pick { groups, attempts } => Some(self.pick(run, groups, *attempts)),
            _ => None,
        });
        match found {
            Some(Some(picks)) => {
                self.generated.picks = picks;
                true
            }
            _ => false,
        }
    }

    fn overview(&self, s: &mut Scratch, size: u32, extent: f64) -> Result<Vec<u8>, String> {
        if size == 0 || size > 4096 {
            return Err("overview size must be 1 to 4096".into());
        }
        let mut cells = Vec::with_capacity((size * size) as usize);
        for row in 0..size {
            let z = (((row as f64 + 0.5) / size as f64) * 2.0 - 1.0) * extent;
            for col in 0..size {
                let x = (((col as f64 + 0.5) / size as f64) * 2.0 - 1.0) * extent;
                cells.push(if math::hypot2(x, z) > self.walk.boundary {
                    0
                } else {
                    self.surface_with(s, x, z)
                });
            }
        }
        Ok(cells)
    }

    /// Builds (once) and hands over the mesh of `material`.
    pub fn take_terrain(&self, material: u32) -> Option<Geometry> {
        let mut meshes = self.terrain_meshes.lock().unwrap_or_else(|e| e.into_inner());
        if meshes.is_none() {
            *meshes = Some(self.terrain.meshes(&self.graph, &mut self.scratch()).into_iter().map(Some).collect());
        }
        let list = meshes.as_mut()?;
        let mesh = list.get_mut(material as usize)?.take();
        if list.iter().all(Option::is_none) {
            *meshes = None;
        }
        mesh
    }

    pub fn prepare_terrain(&self) {
        let mut meshes = self.terrain_meshes.lock().unwrap_or_else(|e| e.into_inner());
        if meshes.is_none() {
            *meshes = Some(self.terrain.meshes(&self.graph, &mut self.scratch()).into_iter().map(Some).collect());
        }
    }

    pub fn materials(&self) -> u8 {
        self.terrain.spec.materials
    }
}
