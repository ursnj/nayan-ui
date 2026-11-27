//! Per-point functions written as field graphs: vertex colors (skins, bark, weathered stone),
//! cut-face colors and lathe displacement, evaluated by the core instead of a JS callback per vertex.

use super::field::{Graph, GraphSpec, Scratch};
use crate::assets::geometry::VERTEX_FLOATS;
use serde::Deserialize;

/// A function of named inputs: a graph and the outputs it returns, in order.
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FieldFn {
    pub fields: GraphSpec,
    pub out: Vec<String>,
}

/// A compiled [`FieldFn`] with its own scratch space.
pub struct Function {
    graph: Graph,
    nodes: Vec<u32>,
    scratch: Scratch,
}

impl Function {
    pub fn new(spec: &FieldFn, arity: usize) -> Result<Function, String> {
        if spec.out.len() != arity {
            return Err(format!("field function needs {arity} output(s), has {}", spec.out.len()));
        }
        let graph = Graph::new(&spec.fields)?;
        let nodes = spec.out.iter().map(|n| graph.output(n)).collect::<Result<_, _>>()?;
        let scratch = graph.scratch();
        Ok(Function { graph, nodes, scratch })
    }

    /// The input slots for `names`, in order (None for inputs the function doesn't read).
    pub fn slots<const N: usize>(&self, names: [&str; N]) -> [Option<usize>; N] {
        names.map(|n| self.graph.var(n))
    }

    /// Evaluates every output at `inputs` (one value per slot from [`Function::slots`]).
    pub fn eval<const N: usize, const M: usize>(&mut self, slots: &[Option<usize>; N], inputs: [f64; N]) -> [f64; M] {
        for (slot, value) in slots.iter().zip(inputs) {
            self.scratch.set(*slot, value);
        }
        self.scratch.begin();
        let mut out = [0.0; M];
        for (o, &node) in out.iter_mut().zip(&self.nodes) {
            *o = self.graph.eval(&mut self.scratch, node);
        }
        out
    }
}

fn set_color(v: &mut [f32], c: [f64; 3]) {
    v[6] = c[0] as f32;
    v[7] = c[1] as f32;
    v[8] = c[2] as f32;
}

/// Colors vertices `range` by `color` of each surface point: inputs u, v (texture coordinates),
/// x, y, z (position) and nx, ny, nz (normal).
pub fn paint_surface(vertices: &mut [f32], range: std::ops::Range<usize>, color: &FieldFn) -> Result<(), String> {
    let mut f = Function::new(color, 3)?;
    let slots = f.slots(["u", "v", "x", "y", "z", "nx", "ny", "nz"]);
    for v in vertices[range.start * VERTEX_FLOATS..range.end * VERTEX_FLOATS]
        .as_chunks_mut::<VERTEX_FLOATS>()
        .0
    {
        let at = |k: usize| v[k] as f64;
        let c = f.eval(&slots, [at(9), at(10), at(0), at(1), at(2), at(3), at(4), at(5)]);
        set_color(v, c);
    }
    Ok(())
}

/// Colors a round end face built with raw polar texture coordinates (around 0..1, out 0..1) by
/// `color` of r (center 0 to rim 1) and angle (radians), then gives it planar disc UVs.
pub fn paint_face(vertices: &mut [f32], range: std::ops::Range<usize>, sweep: f64, color: &FieldFn) -> Result<(), String> {
    let mut f = Function::new(color, 3)?;
    let slots = f.slots(["r", "angle"]);
    for v in vertices[range.start * VERTEX_FLOATS..range.end * VERTEX_FLOATS]
        .as_chunks_mut::<VERTEX_FLOATS>()
        .0
    {
        let a = v[9] as f64 * sweep;
        let r = v[10] as f64;
        v[9] = (0.5 + (a.cos() * r) / 2.0) as f32;
        v[10] = (0.5 + (a.sin() * r) / 2.0) as f32;
        let c = f.eval(&slots, [r, a]);
        set_color(v, c);
    }
    Ok(())
}

/// Colors the two cut faces of a partial lathe (`first` then `second`, the same points in the same
/// order; the first in the a = 0 plane, so x = r) by `color` of r (axis 0 to skin 1 at that height)
/// and y. `skin(y)` is the profile's radius at height y.
pub fn paint_cuts(
    vertices: &mut [f32],
    first: std::ops::Range<usize>,
    second_start: usize,
    skin: impl Fn(f64) -> f64,
    color: &FieldFn,
) -> Result<(), String> {
    let mut f = Function::new(color, 3)?;
    let slots = f.slots(["r", "y"]);
    for k in first.clone() {
        let i = k * VERTEX_FLOATS;
        let (x, y) = (vertices[i] as f64, vertices[i + 1] as f64);
        let c = f.eval(&slots, [(x / skin(y)).min(1.0), y]);
        set_color(&mut vertices[i..i + VERTEX_FLOATS], c);
        let j = (second_start + k - first.start) * VERTEX_FLOATS;
        set_color(&mut vertices[j..j + VERTEX_FLOATS], c);
    }
    Ok(())
}

/// Samples a scalar function of u and v over a (rows + 1) × (cols + 1) grid, row-major; `input(row,
/// col)` gives the (u, v) to ask at.
pub fn sample_grid(rows: usize, cols: usize, field: &FieldFn, input: impl Fn(usize, usize) -> (f64, f64)) -> Result<Vec<f64>, String> {
    let mut f = Function::new(field, 1)?;
    let slots = f.slots(["u", "v"]);
    let mut out = Vec::with_capacity((rows + 1) * (cols + 1));
    for i in 0..=rows {
        for j in 0..=cols {
            let (u, v) = input(i, j);
            let [d] = f.eval(&slots, [u, v]);
            out.push(d);
        }
    }
    Ok(out)
}
