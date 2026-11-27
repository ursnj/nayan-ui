//! Field graphs: a game describes its scalar fields (terrain height, material contours, walkable
//! clearance, placement rules, mesh surfaces) as a small DAG of generic math and geometry nodes, and
//! the core evaluates them. Each node refers only to earlier nodes, so a graph can't loop. Shared
//! nodes are evaluated once per sample point, and `select` evaluates only the branch it takes.

use super::math;
use serde::Deserialize;
use std::collections::HashMap;

/// A 2D primitive in the field's (x, z) plane. `offset` is subtracted from its distance (a radius
/// for points and segments); `width` is the fade length used by `falloff`.
#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum ShapeSpec {
    Point {
        x: f64,
        z: f64,
        #[serde(default)]
        offset: f64,
        #[serde(default = "one")]
        width: f64,
    },
    Segment {
        ax: f64,
        az: f64,
        bx: f64,
        bz: f64,
        #[serde(default)]
        offset: f64,
        #[serde(default = "one")]
        width: f64,
    },
    /// An oriented rectangle (signed: negative inside).
    #[serde(rename_all = "camelCase")]
    Box {
        x: f64,
        z: f64,
        half_x: f64,
        half_z: f64,
        #[serde(default)]
        yaw: f64,
        #[serde(default)]
        offset: f64,
        #[serde(default = "one")]
        width: f64,
    },
}

fn one() -> f64 {
    1.0
}

#[derive(Clone, Debug)]
enum Shape {
    Point { x: f64, z: f64 },
    Segment { ax: f64, az: f64, dx: f64, dz: f64, length2: f64 },
    Box { x: f64, z: f64, hx: f64, hz: f64, cos: f64, sin: f64 },
}

#[derive(Clone, Debug)]
struct Placed {
    shape: Shape,
    offset: f64,
    width: f64,
}

impl Placed {
    fn new(spec: &ShapeSpec) -> Result<Placed, String> {
        let (shape, offset, width) = match *spec {
            ShapeSpec::Point { x, z, offset, width } => (Shape::Point { x, z }, offset, width),
            ShapeSpec::Segment {
                ax,
                az,
                bx,
                bz,
                offset,
                width,
            } => {
                let (dx, dz) = (bx - ax, bz - az);
                (
                    Shape::Segment {
                        ax,
                        az,
                        dx,
                        dz,
                        length2: dx * dx + dz * dz,
                    },
                    offset,
                    width,
                )
            }
            ShapeSpec::Box {
                x,
                z,
                half_x,
                half_z,
                yaw,
                offset,
                width,
            } => (
                Shape::Box {
                    x,
                    z,
                    hx: half_x,
                    hz: half_z,
                    cos: math::cos(yaw),
                    sin: math::sin(yaw),
                },
                offset,
                width,
            ),
        };
        if !(width > 0.0) {
            return Err("field shape width must be positive".into());
        }
        Ok(Placed { shape, offset, width })
    }

    fn distance(&self, x: f64, z: f64) -> f64 {
        let d = match self.shape {
            Shape::Point { x: px, z: pz } => math::hypot2(x - px, z - pz),
            Shape::Segment { ax, az, dx, dz, length2 } => {
                let t = if length2 > 0.0 {
                    math::max(0.0, math::min(1.0, ((x - ax) * dx + (z - az) * dz) / length2))
                } else {
                    0.0
                };
                math::hypot2(x - ax - dx * t, z - az - dz * t)
            }
            Shape::Box { .. } => {
                let (u, v) = self.local(x, z);
                let (ox, oz) = (u.abs() - self.half().0, v.abs() - self.half().1);
                let outside = math::hypot2(math::max(ox, 0.0), math::max(oz, 0.0));
                outside + math::min(math::max(ox, oz), 0.0)
            }
        };
        d - self.offset
    }

    /// How far inside the box (min of the clearances to its sides; negative outside).
    fn depth(&self, x: f64, z: f64) -> f64 {
        let (u, v) = self.local(x, z);
        let (hx, hz) = self.half();
        math::min(hx - u.abs(), hz - v.abs()) - self.offset
    }

    fn half(&self) -> (f64, f64) {
        match self.shape {
            Shape::Box { hx, hz, .. } => (hx, hz),
            _ => (0.0, 0.0),
        }
    }

    fn local(&self, x: f64, z: f64) -> (f64, f64) {
        match self.shape {
            Shape::Box { x: bx, z: bz, cos, sin, .. } => {
                let (dx, dz) = (x - bx, z - bz);
                (dx * cos - dz * sin, dx * sin + dz * cos)
            }
            Shape::Point { x: px, z: pz } => (x - px, z - pz),
            Shape::Segment { ax, az, .. } => (x - ax, z - az),
        }
    }
}

/// One node as the game sends it. Operands are indices of earlier nodes.
#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "op", rename_all = "camelCase", deny_unknown_fields)]
pub enum NodeSpec {
    Const {
        value: f64,
    },
    /// A named input: x and z for terrain fields, u/v/row/col for surfaces, i and r0.. for scatter.
    Var {
        name: String,
    },
    Add {
        a: u32,
        b: u32,
    },
    Sub {
        a: u32,
        b: u32,
    },
    Mul {
        a: u32,
        b: u32,
    },
    Div {
        a: u32,
        b: u32,
    },
    Min {
        args: Vec<u32>,
    },
    Max {
        args: Vec<u32>,
    },
    Neg {
        a: u32,
    },
    Abs {
        a: u32,
    },
    Sqrt {
        a: u32,
    },
    Floor {
        a: u32,
    },
    Square {
        a: u32,
    },
    Sin {
        a: u32,
    },
    Cos {
        a: u32,
    },
    Exp {
        a: u32,
    },
    /// `a` to the power `b`.
    Pow {
        a: u32,
        b: u32,
    },
    /// `a − floor(a)`.
    Fract {
        a: u32,
    },
    /// Value noise in 0..1 on a unit lattice (the common sine-hash shader noise, smoothstep-blended),
    /// repeating every `period` cells in x when given (to wrap around a lathe without a seam).
    Noise {
        x: u32,
        z: u32,
        #[serde(default)]
        period: f64,
    },
    Hypot {
        args: Vec<u32>,
    },
    /// Hermite smoothstep of `a` clamped to 0..1.
    Smooth {
        a: u32,
    },
    Clamp {
        a: u32,
        lo: u32,
        hi: u32,
    },
    /// `le` where `test` <= 0, otherwise `gt`; only the chosen branch is evaluated.
    Select {
        test: u32,
        le: u32,
        gt: u32,
    },
    /// base + Σ amp · sin(fx·x + fz·z + phase), terms as [fx, fz, phase, amp] (winding rivers, waves).
    Sines {
        x: u32,
        z: u32,
        base: f64,
        terms: Vec<[f64; 4]>,
    },
    /// Σ height · max(0, 1 − u² − v²)^power over oriented ellipses [x, z, height, radiusU, radiusV, yaw].
    Bumps {
        x: u32,
        z: u32,
        items: Vec<[f64; 6]>,
        power: u32,
    },
    /// The smallest signed distance to any of the shapes (minus each one's offset); +∞ with none.
    Distance {
        x: u32,
        z: u32,
        shapes: Vec<ShapeSpec>,
    },
    /// Π smoothstep((distance − offset) / width): 0 at a shape, 1 beyond its fade (flattened areas).
    Falloff {
        x: u32,
        z: u32,
        shapes: Vec<ShapeSpec>,
    },
    /// The largest depth inside any of the box shapes (min of side clearances); −∞ with none.
    Depth {
        x: u32,
        z: u32,
        shapes: Vec<ShapeSpec>,
    },
}

#[derive(Clone, Debug)]
struct Bump {
    x: f64,
    z: f64,
    height: f64,
    ru: f64,
    rv: f64,
    cos: f64,
    sin: f64,
}

#[derive(Clone, Debug)]
enum Node {
    Const(f64),
    Var(usize),
    Add(u32, u32),
    Sub(u32, u32),
    Mul(u32, u32),
    Div(u32, u32),
    Min(Vec<u32>),
    Max(Vec<u32>),
    Neg(u32),
    Abs(u32),
    Sqrt(u32),
    Floor(u32),
    Square(u32),
    Sin(u32),
    Cos(u32),
    Exp(u32),
    Pow(u32, u32),
    Fract(u32),
    Noise(u32, u32, f64),
    Hypot(Vec<u32>),
    Smooth(u32),
    Clamp(u32, u32, u32),
    Select(u32, u32, u32),
    Sines(u32, u32, f64, Vec<[f64; 4]>),
    Bumps(u32, u32, Vec<Bump>, u32),
    Distance(u32, u32, Vec<Placed>),
    Falloff(u32, u32, Vec<Placed>),
    Depth(u32, u32, Vec<Placed>),
}

#[derive(Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct GraphSpec {
    pub nodes: Vec<NodeSpec>,
    /// Named fields the recipe refers to.
    #[serde(default)]
    pub outputs: HashMap<String, u32>,
}

/// A validated graph. Immutable: share it; evaluate with a per-thread [`Scratch`].
#[derive(Clone, Debug)]
pub struct Graph {
    nodes: Vec<Node>,
    vars: Vec<String>,
    outputs: HashMap<String, u32>,
}

pub const MAX_NODES: usize = 65_536;

impl Graph {
    pub fn new(spec: &GraphSpec) -> Result<Graph, String> {
        if spec.nodes.len() > MAX_NODES {
            return Err("field graph has too many nodes".into());
        }
        let mut vars: Vec<String> = Vec::new();
        let mut nodes = Vec::with_capacity(spec.nodes.len());
        for (index, node) in spec.nodes.iter().enumerate() {
            let at = |n: u32| -> Result<u32, String> {
                if (n as usize) < index {
                    Ok(n)
                } else {
                    Err(format!("field node {index} refers to node {n}, which is not before it"))
                }
            };
            let many = |args: &Vec<u32>| -> Result<Vec<u32>, String> {
                if args.is_empty() {
                    return Err(format!("field node {index} needs at least one operand"));
                }
                args.iter().map(|&a| at(a)).collect()
            };
            let shapes = |list: &Vec<ShapeSpec>| -> Result<Vec<Placed>, String> { list.iter().map(Placed::new).collect() };
            nodes.push(match node {
                NodeSpec::Const { value } => Node::Const(*value),
                NodeSpec::Var { name } => Node::Var(match vars.iter().position(|v| v == name) {
                    Some(slot) => slot,
                    None => {
                        vars.push(name.clone());
                        vars.len() - 1
                    }
                }),
                NodeSpec::Add { a, b } => Node::Add(at(*a)?, at(*b)?),
                NodeSpec::Sub { a, b } => Node::Sub(at(*a)?, at(*b)?),
                NodeSpec::Mul { a, b } => Node::Mul(at(*a)?, at(*b)?),
                NodeSpec::Div { a, b } => Node::Div(at(*a)?, at(*b)?),
                NodeSpec::Min { args } => Node::Min(many(args)?),
                NodeSpec::Max { args } => Node::Max(many(args)?),
                NodeSpec::Neg { a } => Node::Neg(at(*a)?),
                NodeSpec::Abs { a } => Node::Abs(at(*a)?),
                NodeSpec::Sqrt { a } => Node::Sqrt(at(*a)?),
                NodeSpec::Floor { a } => Node::Floor(at(*a)?),
                NodeSpec::Square { a } => Node::Square(at(*a)?),
                NodeSpec::Sin { a } => Node::Sin(at(*a)?),
                NodeSpec::Cos { a } => Node::Cos(at(*a)?),
                NodeSpec::Exp { a } => Node::Exp(at(*a)?),
                NodeSpec::Pow { a, b } => Node::Pow(at(*a)?, at(*b)?),
                NodeSpec::Fract { a } => Node::Fract(at(*a)?),
                NodeSpec::Noise { x, z, period } => {
                    if !(*period >= 0.0 && period.is_finite()) {
                        return Err("noise period must be finite and non-negative".into());
                    }
                    Node::Noise(at(*x)?, at(*z)?, *period)
                }
                NodeSpec::Hypot { args } => Node::Hypot(many(args)?),
                NodeSpec::Smooth { a } => Node::Smooth(at(*a)?),
                NodeSpec::Clamp { a, lo, hi } => Node::Clamp(at(*a)?, at(*lo)?, at(*hi)?),
                NodeSpec::Select { test, le, gt } => Node::Select(at(*test)?, at(*le)?, at(*gt)?),
                NodeSpec::Sines { x, z, base, terms } => Node::Sines(at(*x)?, at(*z)?, *base, terms.clone()),
                NodeSpec::Bumps { x, z, items, power } => {
                    if *power > 16 {
                        return Err("bump power must be at most 16".into());
                    }
                    let bumps = items
                        .iter()
                        .map(|&[bx, bz, height, ru, rv, yaw]| {
                            if ru > 0.0 && rv > 0.0 {
                                Ok(Bump {
                                    x: bx,
                                    z: bz,
                                    height,
                                    ru,
                                    rv,
                                    cos: math::cos(yaw),
                                    sin: math::sin(yaw),
                                })
                            } else {
                                Err("bump radii must be positive".to_string())
                            }
                        })
                        .collect::<Result<_, _>>()?;
                    Node::Bumps(at(*x)?, at(*z)?, bumps, *power)
                }
                NodeSpec::Distance { x, z, shapes: s } => Node::Distance(at(*x)?, at(*z)?, shapes(s)?),
                NodeSpec::Falloff { x, z, shapes: s } => Node::Falloff(at(*x)?, at(*z)?, shapes(s)?),
                NodeSpec::Depth { x, z, shapes: s } => Node::Depth(at(*x)?, at(*z)?, shapes(s)?),
            });
        }
        for (name, &node) in &spec.outputs {
            if node as usize >= nodes.len() {
                return Err(format!("field output {name} refers to a missing node"));
            }
        }
        Ok(Graph {
            nodes,
            vars,
            outputs: spec.outputs.clone(),
        })
    }

    pub fn output(&self, name: &str) -> Result<u32, String> {
        self.outputs.get(name).copied().ok_or_else(|| format!("missing field output \"{name}\""))
    }

    pub fn output_names(&self) -> impl Iterator<Item = (&String, &u32)> {
        self.outputs.iter()
    }

    /// The input slot for `name`, or None when no node reads it.
    pub fn var(&self, name: &str) -> Option<usize> {
        self.vars.iter().position(|v| v == name)
    }

    pub fn len(&self) -> usize {
        self.nodes.len()
    }

    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
    }

    pub fn scratch(&self) -> Scratch {
        Scratch {
            values: vec![0.0; self.nodes.len()],
            stamps: vec![0; self.nodes.len()],
            now: 1,
            vars: vec![0.0; self.vars.len()],
        }
    }
}

/// Per-evaluation state: inputs and the values computed at the current sample point.
#[derive(Clone)]
pub struct Scratch {
    values: Vec<f64>,
    stamps: Vec<u32>,
    now: u32,
    vars: Vec<f64>,
}

impl Scratch {
    /// Starts a new sample point: earlier node values no longer apply.
    pub fn begin(&mut self) {
        self.now = self.now.wrapping_add(1);
        if self.now == 0 {
            self.stamps.iter_mut().for_each(|s| *s = 0);
            self.now = 1;
        }
    }

    pub fn set(&mut self, slot: Option<usize>, value: f64) {
        if let Some(slot) = slot {
            self.vars[slot] = value;
        }
    }
}

/// Inputs bound by name once, then set per sample.
#[derive(Clone, Copy, Debug, Default)]
pub struct Slots {
    pub x: Option<usize>,
    pub z: Option<usize>,
}

impl Slots {
    pub fn xz(graph: &Graph) -> Slots {
        Slots {
            x: graph.var("x"),
            z: graph.var("z"),
        }
    }
}

impl Graph {
    /// Evaluates `node` at the scratch's current inputs (call `Scratch::begin` after changing them).
    pub fn eval(&self, s: &mut Scratch, node: u32) -> f64 {
        let n = node as usize;
        if s.stamps[n] == s.now {
            return s.values[n];
        }
        let value = match &self.nodes[n] {
            Node::Const(v) => *v,
            Node::Var(slot) => s.vars[*slot],
            Node::Add(a, b) => self.eval(s, *a) + self.eval(s, *b),
            Node::Sub(a, b) => self.eval(s, *a) - self.eval(s, *b),
            Node::Mul(a, b) => self.eval(s, *a) * self.eval(s, *b),
            Node::Div(a, b) => self.eval(s, *a) / self.eval(s, *b),
            Node::Min(args) => {
                let mut v = self.eval(s, args[0]);
                for &a in &args[1..] {
                    v = math::min(v, self.eval(s, a));
                }
                v
            }
            Node::Max(args) => {
                let mut v = self.eval(s, args[0]);
                for &a in &args[1..] {
                    v = math::max(v, self.eval(s, a));
                }
                v
            }
            Node::Neg(a) => -self.eval(s, *a),
            Node::Abs(a) => self.eval(s, *a).abs(),
            Node::Sqrt(a) => self.eval(s, *a).sqrt(),
            Node::Floor(a) => self.eval(s, *a).floor(),
            Node::Square(a) => {
                let v = self.eval(s, *a);
                v * v
            }
            Node::Sin(a) => math::sin(self.eval(s, *a)),
            Node::Cos(a) => math::cos(self.eval(s, *a)),
            Node::Exp(a) => math::exp(self.eval(s, *a)),
            Node::Pow(a, b) => math::pow(self.eval(s, *a), self.eval(s, *b)),
            Node::Fract(a) => {
                let v = self.eval(s, *a);
                v - v.floor()
            }
            Node::Noise(x, z, period) => math::noise(self.eval(s, *x), self.eval(s, *z), *period),
            Node::Hypot(args) => {
                let mut values = [0.0f64; 8];
                if args.len() <= values.len() {
                    for (i, &a) in args.iter().enumerate() {
                        values[i] = self.eval(s, a);
                    }
                    math::hypot(&values[..args.len()])
                } else {
                    let all: Vec<f64> = args.iter().map(|&a| self.eval(s, a)).collect();
                    math::hypot(&all)
                }
            }
            Node::Smooth(a) => math::smooth(self.eval(s, *a)),
            Node::Clamp(a, lo, hi) => {
                let (v, lo, hi) = (self.eval(s, *a), self.eval(s, *lo), self.eval(s, *hi));
                math::max(lo, math::min(hi, v))
            }
            Node::Select(test, le, gt) => {
                if self.eval(s, *test) <= 0.0 {
                    self.eval(s, *le)
                } else {
                    self.eval(s, *gt)
                }
            }
            Node::Sines(x, z, base, terms) => {
                let (x, z) = (self.eval(s, *x), self.eval(s, *z));
                let mut v = *base;
                for [fx, fz, phase, amp] in terms {
                    v += math::sin(fx * x + fz * z + phase) * amp;
                }
                v
            }
            Node::Bumps(x, z, bumps, power) => {
                let (x, z) = (self.eval(s, *x), self.eval(s, *z));
                let mut height = 0.0;
                for b in bumps {
                    let (dx, dz) = (x - b.x, z - b.z);
                    let u = (dx * b.cos + dz * b.sin) / b.ru;
                    let v = (-dx * b.sin + dz * b.cos) / b.rv;
                    let influence = math::max(0.0, 1.0 - u * u - v * v);
                    if influence > 0.0 {
                        let mut p = 1.0;
                        for _ in 0..*power {
                            p *= influence;
                        }
                        height += b.height * p;
                    }
                }
                height
            }
            Node::Distance(x, z, shapes) => {
                let (x, z) = (self.eval(s, *x), self.eval(s, *z));
                shapes.iter().fold(f64::INFINITY, |d, shape| math::min(d, shape.distance(x, z)))
            }
            Node::Falloff(x, z, shapes) => {
                let (x, z) = (self.eval(s, *x), self.eval(s, *z));
                shapes.iter().fold(1.0, |f, shape| f * math::smooth(shape.distance(x, z) / shape.width))
            }
            Node::Depth(x, z, shapes) => {
                let (x, z) = (self.eval(s, *x), self.eval(s, *z));
                shapes.iter().fold(f64::NEG_INFINITY, |d, shape| math::max(d, shape.depth(x, z)))
            }
        };
        s.values[n] = value;
        s.stamps[n] = s.now;
        value
    }

    /// Evaluates `node` at a fresh (x, z) sample.
    pub fn at(&self, s: &mut Scratch, slots: Slots, node: u32, x: f64, z: f64) -> f64 {
        s.set(slots.x, x);
        s.set(slots.z, z);
        s.begin();
        self.eval(s, node)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn graph(json: &str) -> Graph {
        Graph::new(&serde_json::from_str(json).unwrap()).unwrap()
    }

    #[test]
    fn evaluates_math_select_and_shared_nodes() {
        let g = graph(
            r#"{"nodes":[{"op":"var","name":"x"},{"op":"const","value":2},{"op":"mul","a":0,"b":1},
            {"op":"select","test":0,"le":1,"gt":2},{"op":"smooth","a":0}],"outputs":{"f":3,"s":4}}"#,
        );
        let mut s = g.scratch();
        let slots = Slots::xz(&g);
        assert_eq!(g.at(&mut s, slots, 3, -1.0, 0.0), 2.0);
        assert_eq!(g.at(&mut s, slots, 3, 3.0, 0.0), 6.0);
        assert_eq!(g.at(&mut s, slots, 4, 0.5, 0.0), 0.5);
        assert_eq!(g.output("f").unwrap(), 3);
    }

    #[test]
    fn geometric_nodes() {
        let g = graph(
            r#"{"nodes":[{"op":"var","name":"x"},{"op":"var","name":"z"},
            {"op":"distance","x":0,"z":1,"shapes":[{"kind":"segment","ax":0,"az":-5,"bx":0,"bz":5,"offset":1}]},
            {"op":"depth","x":0,"z":1,"shapes":[{"kind":"box","x":0,"z":0,"halfX":2,"halfZ":1}]},
            {"op":"bumps","x":0,"z":1,"items":[[0,0,3,4,4,0]],"power":2},
            {"op":"falloff","x":0,"z":1,"shapes":[{"kind":"point","x":0,"z":0,"offset":1,"width":2}]},
            {"op":"sines","x":0,"z":1,"base":1,"terms":[[0,1,0,2]]}]}"#,
        );
        let mut s = g.scratch();
        let slots = Slots::xz(&g);
        assert_eq!(g.at(&mut s, slots, 2, 3.0, 2.0), 2.0);
        assert_eq!(g.at(&mut s, slots, 2, 0.0, 8.0), 2.0);
        assert_eq!(g.at(&mut s, slots, 3, 0.5, 0.0), 1.0);
        assert!(g.at(&mut s, slots, 3, 5.0, 0.0) < 0.0);
        assert_eq!(g.at(&mut s, slots, 4, 0.0, 0.0), 3.0);
        assert_eq!(g.at(&mut s, slots, 4, 9.0, 0.0), 0.0);
        assert_eq!(g.at(&mut s, slots, 5, 0.5, 0.0), 0.0);
        assert_eq!(g.at(&mut s, slots, 5, 4.0, 0.0), 1.0);
        assert_eq!(g.at(&mut s, slots, 6, 0.0, 0.0), 1.0);
    }

    #[test]
    fn noise_exp_pow_and_fract() {
        let g = graph(
            r#"{"nodes":[{"op":"var","name":"x"},{"op":"var","name":"z"},{"op":"noise","x":0,"z":1},
            {"op":"noise","x":0,"z":1,"period":4},{"op":"exp","a":0},{"op":"const","value":3},{"op":"pow","a":0,"b":5},
            {"op":"fract","a":0}]}"#,
        );
        let mut s = g.scratch();
        let slots = Slots::xz(&g);
        for i in 0..200 {
            let (x, z) = (i as f64 * 0.37 - 30.0, i as f64 * 0.21);
            let n = g.at(&mut s, slots, 2, x, z);
            assert!((0.0..=1.0).contains(&n));
            // Wrapped noise repeats every `period` cells in x.
            assert_eq!(g.at(&mut s, slots, 3, x, z), g.at(&mut s, slots, 3, x + 4.0, z));
        }
        // On lattice points the noise is the hash itself, the same as the shader formula.
        let hash = |x: f64, y: f64| {
            let n = (x * 127.1 + y * 311.7).sin() * 43758.5453;
            n - n.floor()
        };
        assert!((g.at(&mut s, slots, 2, 3.0, 5.0) - hash(3.0, 5.0)).abs() < 1e-9);
        assert!((g.at(&mut s, slots, 4, 1.0, 0.0) - std::f64::consts::E).abs() < 1e-15);
        assert_eq!(g.at(&mut s, slots, 6, 2.0, 0.0), 8.0);
        assert_eq!(g.at(&mut s, slots, 7, -1.25, 0.0), 0.75);
    }

    #[test]
    fn rejects_forward_references_and_bad_outputs() {
        let spec: GraphSpec = serde_json::from_str(r#"{"nodes":[{"op":"abs","a":0}]}"#).unwrap();
        assert!(Graph::new(&spec).is_err());
        let spec: GraphSpec = serde_json::from_str(r#"{"nodes":[{"op":"const","value":1}],"outputs":{"a":4}}"#).unwrap();
        assert!(Graph::new(&spec).is_err());
    }
}
