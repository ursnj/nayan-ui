//! Solids of revolution, swept tubes and lofted bodies: the tessellation behind the engine's
//! `lathe`, `tube` and `loft`. Each follows the same steps, in the same order and precision (f64
//! math, f32 storage, then the shared normal/winding passes), as the TypeScript builders it replaces,
//! so models keep their exact look. Per-point game functions arrive as samples: a displacement grid
//! for lathes, a radius per ring and a cross-section per side for tubes.

use crate::assets::geometry::{self, Placement, VERTEX_FLOATS};
use crate::assets::modelling::Geometry;
use crate::assets::shape;
use std::f64::consts::{PI, TAU};

const MAX_VERTICES: usize = 2_000_000;

fn push_vertex(out: &mut Vec<f32>, p: [f64; 3], n: [f64; 3], u: f64, v: f64) {
    out.extend_from_slice(&[
        p[0] as f32,
        p[1] as f32,
        p[2] as f32,
        n[0] as f32,
        n[1] as f32,
        n[2] as f32,
        1.0,
        1.0,
        1.0,
        u as f32,
        v as f32,
    ]);
}

/// A (rows + 1) × (cols + 1) grid: `at(u, v, col, row)` gives position and normal; texture
/// coordinates are (u, v). Triangles face the side from which u goes right and v goes down.
fn grid(rows: usize, cols: usize, mut at: impl FnMut(f64, f64, usize, usize) -> ([f64; 3], [f64; 3])) -> Geometry {
    let mut vertices = Vec::with_capacity((rows + 1) * (cols + 1) * VERTEX_FLOATS);
    for i in 0..=rows {
        for j in 0..=cols {
            let (u, v) = (j as f64 / cols as f64, i as f64 / rows as f64);
            let (p, n) = at(u, v, j, i);
            push_vertex(&mut vertices, p, n, u, v);
        }
    }
    let mut indices = Vec::with_capacity(rows * cols * 6);
    for i in 0..rows {
        for j in 0..cols {
            let a = (i * (cols + 1) + j) as u32;
            let b = a + cols as u32 + 1;
            indices.extend_from_slice(&[a, b, a + 1, a + 1, b, b + 1]);
        }
    }
    Geometry { vertices, indices }
}

fn paint(g: &mut Geometry, color: Option<[f64; 3]>) {
    if let Some(c) = color {
        for v in g.vertices.as_chunks_mut::<VERTEX_FLOATS>().0.iter_mut() {
            v[6] = c[0] as f32;
            v[7] = c[1] as f32;
            v[8] = c[2] as f32;
        }
    }
}

fn face_outward(mut g: Geometry) -> Geometry {
    geometry::face_outward(&g.vertices, &mut g.indices);
    g
}

fn smooth_normals(mut g: Geometry) -> Geometry {
    geometry::smooth_normals(&mut g.vertices, &g.indices);
    g
}

/// Joins parts as `merge` does (each placed unmoved, which also renormalizes its normals in f32).
fn merge(parts: Vec<Geometry>) -> Geometry {
    if parts.len() == 1 {
        return parts.into_iter().next().unwrap();
    }
    let floats: usize = parts.iter().map(|p| p.vertices.len()).sum();
    let count: usize = parts.iter().map(|p| p.indices.len()).sum();
    let mut out = Geometry {
        vertices: vec![0.0; floats],
        indices: vec![0; count],
    };
    let (mut vo, mut io) = (0, 0);
    let identity = Placement::default();
    for p in &parts {
        let (nv, ni) = (p.vertices.len(), p.indices.len());
        geometry::place_part(
            &p.vertices,
            &p.indices,
            &identity,
            (vo / VERTEX_FLOATS) as u32,
            &mut out.vertices[vo..vo + nv],
            &mut out.indices[io..io + ni],
        );
        vo += nv;
        io += ni;
    }
    out
}

/// How a round end face is colored: a flat color, or (`raw`) left white with its polar grid
/// coordinates (around 0..1, out 0..1) in the texture coordinates, for the caller to color and map.
#[derive(Clone, Copy)]
pub struct FacePaint {
    pub color: Option<[f64; 3]>,
    pub raw: bool,
}

/// A polar grid of `rings` × `segments` around `center` in the plane of unit vectors `x` and `y`,
/// `radius(col)` toward the rim, facing `normal`, swept `sweep` radians; planar disc UVs.
#[allow(clippy::too_many_arguments)]
fn round_face(
    center: [f64; 3],
    x: [f64; 3],
    y: [f64; 3],
    normal: [f64; 3],
    radius: impl Fn(usize) -> f64,
    sweep: f64,
    segments: usize,
    rings: usize,
    paint_as: FacePaint,
) -> Geometry {
    let mut g = face_outward(grid(rings, segments, |u, v, j, _| {
        let a = u * sweep;
        let r = radius(j) * v;
        let (c, s) = (a.cos() * r, a.sin() * r);
        (
            [
                center[0] + x[0] * c + y[0] * s,
                center[1] + x[1] * c + y[1] * s,
                center[2] + x[2] * c + y[2] * s,
            ],
            normal,
        )
    }));
    if !paint_as.raw {
        for v in g.vertices.as_chunks_mut::<VERTEX_FLOATS>().0.iter_mut() {
            let a = v[9] as f64 * sweep;
            let r = v[10] as f64;
            v[9] = (0.5 + (a.cos() * r) / 2.0) as f32;
            v[10] = (0.5 + (a.sin() * r) / 2.0) as f32;
        }
        paint(&mut g, paint_as.color);
    }
    g
}

pub struct LatheSpec<'a> {
    /// [radius, height], top to bottom, distinct neighbours, radii ≥ 0.
    pub points: &'a [[f64; 2]],
    pub segments: usize,
    pub sweep: f64,
    /// (points + 1 rows) × (segments + 1) offsets along the normal, row-major; none = smooth.
    pub displace: Option<&'a [f64]>,
    pub color: Option<[f64; 3]>,
    pub cap: FacePaint,
    pub cap_rings: usize,
    pub cut_color: Option<[f64; 3]>,
    pub cut_steps: usize,
}

/// Spins a profile around the vertical axis; caps open ends and, for a partial sweep, the cut faces.
pub fn lathe(spec: &LatheSpec) -> Result<Geometry, String> {
    let points = spec.points;
    if points.len() < 2 || points.iter().flatten().any(|v| !v.is_finite()) {
        return Err("lathe: the profile needs at least two finite points".into());
    }
    let segments = spec.segments.max(3);
    let sweep = spec.sweep.clamp(1e-3, TAU);
    let full = sweep >= TAU - 1e-6;
    let last = points.len() - 1;
    let rings = spec.cap_rings.max(1);
    if (last + 1) * (segments + 1) + 2 * (rings + 1) * (segments + 1) > MAX_VERTICES {
        return Err("lathe: too many vertices".into());
    }
    if let Some(d) = spec.displace
        && d.len() != (last + 1) * (segments + 1)
    {
        return Err("lathe: displacement samples don't match the grid".into());
    }

    // Profile normals in the (radius, height) plane: the average of the neighbouring edges', turned outward.
    let edge = |i: isize| -> [f64; 2] {
        let a = points[i.max(0) as usize];
        let b = points[((i + 1) as usize).min(last)];
        let len = (b[0] - a[0]).hypot(b[1] - a[1]);
        let len = if len == 0.0 { 1.0 } else { len };
        [(a[1] - b[1]) / len, (b[0] - a[0]) / len]
    };
    let normals: Vec<[f64; 2]> = points
        .iter()
        .enumerate()
        .map(|(i, &[r, _])| {
            // On the axis the surface is a pole: straight up at the top, down at the bottom.
            if r < 1e-6 && (i == 0 || i == last) {
                return [0.0, if i == 0 { 1.0 } else { -1.0 }];
            }
            let (e1, e2) = (edge(i as isize - 1), edge(i as isize));
            let n = if i == 0 {
                e2
            } else if i == last {
                e1
            } else {
                [e1[0] + e2[0], e1[1] + e2[1]]
            };
            let len = n[0].hypot(n[1]);
            let len = if len == 0.0 { 1.0 } else { len };
            [n[0] / len, n[1] / len]
        })
        .collect();

    // a = u · sweep around the axis; the built-in sphere's orientation, so faces point outward.
    let side = grid(last, segments, |u, _, j, i| {
        let a = u * sweep;
        let [r, y] = points[i];
        let [nr, ny] = normals[i];
        let n = [nr * a.cos(), ny, -nr * a.sin()];
        let d = spec.displace.map_or(0.0, |d| d[i * (segments + 1) + j]);
        ([r * a.cos() + n[0] * d, y + n[1] * d, -r * a.sin() + n[2] * d], n)
    });
    let mut side = if spec.displace.is_some() { smooth_normals(side) } else { side };
    paint(&mut side, spec.color);
    let mut parts = vec![side];

    // Ends away from the axis: flat round faces (part of a circle when the sweep is partial).
    for (i, facing) in [(0usize, 1.0), (last, -1.0)] {
        let [r, y] = points[i];
        if r < 1e-6 {
            continue;
        }
        parts.push(round_face(
            [0.0, y, 0.0],
            [1.0, 0.0, 0.0],
            [0.0, 0.0, -1.0],
            [0.0, facing, 0.0],
            |_| r,
            sweep,
            segments,
            rings,
            spec.cap,
        ));
    }
    if full {
        return Ok(merge(parts));
    }

    // The cut: the region between the profile and the axis, laid into the planes at a = 0 and a = sweep.
    // A profile whose height only falls gets a grid (so a color function has points to work with);
    // one that turns back (a dimple) is filled exactly.
    let falling = points.windows(2).all(|w| w[1][1] <= w[0][1] + 1e-9);
    let mut face = if falling {
        face_outward(grid(last, spec.cut_steps.max(1), |u, _, _, i| {
            let [r, y] = points[i];
            ([u * r, y, 0.0], [0.0, 0.0, 1.0])
        }))
    } else {
        let mut contour = Vec::with_capacity(points.len() + 2);
        contour.push([0.0, points[0][1] as f32]);
        contour.extend(points.iter().map(|&[r, y]| [r as f32, y as f32]));
        contour.push([0.0, points[last][1] as f32]);
        let vertices = shape::extrude(&[contour], 0.0, false).unwrap_or_default();
        if vertices.is_empty() {
            return Err("extrude: the path encloses no area".into());
        }
        let indices = (0..(vertices.len() / VERTEX_FLOATS) as u32).collect();
        Geometry { vertices, indices }
    };
    paint(&mut face, spec.cut_color);
    let cut = |angle: f64, flip: bool| -> Geometry {
        let mut g = Geometry {
            vertices: face.vertices.clone(),
            indices: face.indices.clone(),
        };
        let (c, s) = (angle.cos(), angle.sin());
        let n = if angle == 0.0 { [0.0, 0.0, 1.0] } else { [-s as f32, 0.0, -c as f32] };
        for v in g.vertices.as_chunks_mut::<VERTEX_FLOATS>().0.iter_mut() {
            let r = v[0] as f64;
            v[0] = (r * c) as f32;
            v[2] = (-r * s) as f32;
            v[3..6].copy_from_slice(&n);
        }
        if flip {
            for t in g.indices.as_chunks_mut::<3>().0.iter_mut() {
                t.swap(1, 2);
            }
        }
        g
    };
    parts.push(cut(0.0, false));
    parts.push(cut(sweep, true));
    Ok(merge(parts))
}

type V3 = [f64; 3];
fn sub(a: V3, b: V3) -> V3 {
    [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
fn cross(a: V3, b: V3) -> V3 {
    [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
fn dot(a: V3, b: V3) -> f64 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
fn length(a: V3) -> f64 {
    a[0].hypot(a[1]).hypot(a[2])
}
fn norm(a: V3) -> V3 {
    let l = length(a);
    let l = if l == 0.0 { 1.0 } else { l };
    [a[0] / l, a[1] / l, a[2] / l]
}

pub struct TubeSpec<'a> {
    /// Distinct consecutive points (and, closed, a last point unlike the first).
    pub points: &'a [V3],
    pub closed: bool,
    pub sides: usize,
    /// Curve steps between each pair of points.
    pub steps: usize,
    /// One radius per curve point: (points − 1, or points when closed) × steps + 1.
    pub radii: &'a [f64],
    /// A radius multiplier per side, sides + 1 values (the last equal to the first); none = round.
    pub shape: Option<&'a [f64]>,
    /// Recompute normals from the surface (tapered or shaped tubes).
    pub smooth: bool,
    pub caps: bool,
    pub color: Option<[f64; 3]>,
    pub cap: FacePaint,
    pub cap_rings: usize,
}

/// The number of curve points a tube through `points` makes.
pub fn tube_curve_points(points: usize, closed: bool, steps: usize) -> usize {
    (points - if closed { 0 } else { 1 }) * steps + 1
}

/// A tube along a Catmull-Rom curve through the points, with minimally rotating frames.
pub fn tube(spec: &TubeSpec) -> Result<Geometry, String> {
    let points = spec.points;
    let closed = spec.closed;
    if points.len() < if closed { 3 } else { 2 } || points.iter().flatten().any(|v| !v.is_finite()) {
        return Err(format!("tube: needs at least {} distinct points", if closed { "three" } else { "two" }));
    }
    let sides = spec.sides.max(3);
    let steps = spec.steps.max(1);
    let n = points.len();
    let count = tube_curve_points(n, closed, steps);
    if spec.radii.len() != count || spec.shape.is_some_and(|s| s.len() != sides + 1) {
        return Err("tube: radius or shape samples don't match the curve".into());
    }
    if count * (sides + 1) + 2 * (spec.cap_rings.max(1) + 1) * (sides + 1) > MAX_VERTICES {
        return Err("tube: too many vertices".into());
    }
    let shape = |j: usize| spec.shape.map_or(1.0, |s| s[j]);

    // Catmull-Rom through the points.
    let p = |i: isize| -> V3 {
        if closed {
            points[i.rem_euclid(n as isize) as usize]
        } else {
            points[i.clamp(0, n as isize - 1) as usize]
        }
    };
    let mut curve: Vec<V3> = Vec::with_capacity(count);
    for i in 0..(n - if closed { 0 } else { 1 }) as isize {
        let (a, b, c, d) = (p(i - 1), p(i), p(i + 1), p(i + 2));
        for s in 0..steps {
            let t = s as f64 / steps as f64;
            let t2 = t * t;
            let t3 = t2 * t;
            let k = |k: usize| {
                0.5 * (2.0 * b[k]
                    + (-a[k] + c[k]) * t
                    + (2.0 * a[k] - 5.0 * b[k] + 4.0 * c[k] - d[k]) * t2
                    + (-a[k] + 3.0 * b[k] - 3.0 * c[k] + d[k]) * t3)
            };
            curve.push([k(0), k(1), k(2)]);
        }
    }
    curve.push(p(if closed { 0 } else { n as isize - 1 }));

    let last = curve.len() - 1;
    let mut tangents: Vec<V3> = (0..=last)
        .map(|i| {
            let ahead = if closed && i == last { 1 } else { (i + 1).min(last) };
            let behind = if closed && i == 0 { last - 1 } else { i.saturating_sub(1) };
            let mut delta = sub(curve[ahead], curve[behind]);
            // A reversing curve has no central derivative. Use its incoming/outgoing segment instead.
            if length(delta) < 1e-9 {
                delta = if i > 0 { sub(curve[i], curve[i - 1]) } else { sub(curve[1], curve[0]) };
            }
            norm(delta)
        })
        .collect();
    if closed {
        tangents[last] = tangents[0];
    }
    // Minimal rotations between tangents: projecting the previous normal onto the next plane
    // collapses at right-angle bends and adds unwanted twist to curls.
    let t0 = tangents[0];
    let mut normal = norm(cross(t0, if t0[1].abs() < 0.9 { [0.0, 1.0, 0.0] } else { [1.0, 0.0, 0.0] }));
    let mut previous = t0;
    let mut frames: Vec<(V3, V3)> = Vec::with_capacity(curve.len());
    for &t in &tangents {
        let axis = cross(previous, t);
        let cosine = dot(previous, t).clamp(-1.0, 1.0);
        if cosine > -1.0 + 1e-8 {
            let turn = cross(axis, normal);
            let second = cross(axis, turn);
            normal = [
                normal[0] + turn[0] + second[0] / (1.0 + cosine),
                normal[1] + turn[1] + second[1] / (1.0 + cosine),
                normal[2] + turn[2] + second[2] / (1.0 + cosine),
            ];
        }
        // At a reversal, a half turn about the normal retains it and reverses the binormal.
        let projection = dot(normal, t);
        normal = norm(sub(normal, [t[0] * projection, t[1] * projection, t[2] * projection]));
        frames.push((normal, cross(t, normal)));
        previous = t;
    }
    if closed {
        let (end, start) = (frames[last].0, frames[0].0);
        let correction = dot(t0, cross(end, start)).atan2(dot(end, start));
        let mut lengths = vec![0.0; last + 1];
        for i in 1..=last {
            lengths[i] = lengths[i - 1] + length(sub(curve[i], curve[i - 1]));
        }
        for i in 1..=last {
            let angle = (correction * lengths[i]) / lengths[last];
            let (n, bn) = frames[i];
            let (c, s) = (angle.cos(), angle.sin());
            let corrected = [n[0] * c + bn[0] * s, n[1] * c + bn[1] * s, n[2] * c + bn[2] * s];
            frames[i] = (corrected, cross(tangents[i], corrected));
        }
        frames[last] = frames[0];
    }

    let mut vertices = Vec::with_capacity(curve.len() * (sides + 1) * VERTEX_FLOATS);
    let mut ring_radius = Vec::with_capacity(curve.len());
    for (i, c) in curve.iter().enumerate() {
        let r = 0f64.max(spec.radii[i]);
        let (n, bn) = frames[i];
        for j in 0..=sides {
            let a = (if j == sides { 0.0 } else { j as f64 / sides as f64 }) * TAU;
            let (cosine, sine) = (a.cos(), a.sin());
            let dir = [cosine * n[0] + sine * bn[0], cosine * n[1] + sine * bn[1], cosine * n[2] + sine * bn[2]];
            let rj = r * shape(j);
            push_vertex(
                &mut vertices,
                [c[0] + dir[0] * rj, c[1] + dir[1] * rj, c[2] + dir[2] * rj],
                dir,
                j as f64 / sides as f64,
                i as f64 / last as f64,
            );
        }
        ring_radius.push(r);
    }
    let mut indices = Vec::with_capacity(last * sides * 6);
    for i in 0..last {
        for j in 0..sides {
            let a = (i * (sides + 1) + j) as u32;
            let c = a + sides as u32 + 1;
            indices.extend_from_slice(&[a, a + 1, c, a + 1, c + 1, c]);
        }
    }
    let side = face_outward(Geometry { vertices, indices });
    // Taper changes the longitudinal component too; radial normals only describe a cylinder.
    let mut side = if spec.smooth { smooth_normals(side) } else { side };
    paint(&mut side, spec.color);
    let mut parts = vec![side];
    if !closed && spec.caps {
        for (i, facing) in [(0usize, -1.0), (last, 1.0)] {
            let r = ring_radius[i];
            if r < 1e-6 {
                continue;
            }
            let t = tangents[i];
            let (fnormal, fbinormal) = frames[i];
            parts.push(round_face(
                curve[i],
                fnormal,
                fbinormal,
                [t[0] * facing, t[1] * facing, t[2] * facing],
                |j| r * shape(j),
                TAU,
                sides,
                spec.cap_rings.max(1),
                spec.cap,
            ));
        }
    }
    Ok(merge(parts))
}

/// A loft cross-section: [z, bottom, top, half width at the lower corners, top half width, squareness].
pub type Section = [f64; 6];

/// A smooth closed body through rounded rectangular sections along +z (ordered, validated):
/// `around` points per section, `smoothness` rows between sections, flat end caps.
pub fn loft(sections: &[Section], around: usize, smoothness: usize, color: Option<[f64; 3]>) -> Result<Geometry, String> {
    if sections.len() < 2 || !(6..=512).contains(&around) || !(1..=64).contains(&smoothness) || sections.iter().flatten().any(|v| !v.is_finite()) {
        return Err("loft: needs at least two valid cross sections".into());
    }
    let last = sections.len() - 1;
    let at = |i: isize| sections[i.clamp(0, last as isize) as usize];
    let row = |v: f64| -> Section {
        let cursor = v * last as f64;
        let i = ((last - 1) as f64).min(cursor.floor()) as isize;
        let t = cursor - i as f64;
        let (a, b, c, d) = (at(i - 1), at(i), at(i + 1), at(i + 2));
        let mut f = [0.0; 6];
        for k in 0..6 {
            f[k] = 0.5
                * (2.0 * b[k]
                    + (-a[k] + c[k]) * t
                    + (2.0 * a[k] - 5.0 * b[k] + 4.0 * c[k] - d[k]) * t * t
                    + (-a[k] + 3.0 * b[k] - 3.0 * c[k] + d[k]) * t * t * t);
        }
        f[2] = (f[1] + 1e-6).max(f[2]);
        f[3] = 0f64.max(f[3]);
        f[4] = 0f64.max(f[4]);
        f[5] = 1f64.max(f[5]);
        f
    };
    let row_count = last * smoothness;
    let (nu, nv) = (around, row_count);
    if (nu + 1) * (nv + 1) > 1_000_000 {
        return Err("parametricSurface: invalid segments or surface exceeds one million vertices".into());
    }
    let rows: Vec<Section> = (0..=row_count).map(|i| row(i as f64 / row_count as f64)).collect();
    // JavaScript's Math.sign: zero keeps its sign.
    let sign = |x: f64| {
        if x > 0.0 {
            1.0
        } else if x < 0.0 {
            -1.0
        } else {
            x
        }
    };
    let point = |u: f64, v: f64| -> V3 {
        let [z, bottom, top, width, top_width, square] = rows[(v * row_count as f64).round() as usize];
        let angle = -PI / 2.0 + u * PI * 2.0;
        let (c, s) = (angle.cos(), angle.sin());
        let exponent = 2.0 / square;
        let x = sign(c) * c.abs().powf(exponent);
        let y = sign(s) * s.abs().powf(exponent);
        [
            x * if y > 0.0 { width + (top_width - width) * y } else { width },
            (bottom + top) / 2.0 + (y * (top - bottom)) / 2.0,
            z,
        ]
    };

    // The sides: a u-wrapped parametric surface, degenerate triangles left out, smooth normals.
    let mut vertices = Vec::with_capacity((nu + 1) * (nv + 1) * VERTEX_FLOATS);
    for y in 0..=nv {
        for x in 0..=nu {
            let (u, v) = (x as f64 / nu as f64, y as f64 / nv as f64);
            let p = point(if x == nu { 0.0 } else { u }, v);
            if p.iter().any(|c| !c.is_finite()) {
                return Err("parametricSurface: sample returned a non-finite position".into());
            }
            push_vertex(&mut vertices, p, [0.0, 1.0, 0.0], u, v);
        }
    }
    let mut indices = Vec::with_capacity(nu * nv * 6);
    let mut triangle = |a: usize, b: usize, c: usize| {
        let at = |i: usize, k: usize| vertices[i * VERTEX_FLOATS + k] as f64;
        let (x1, y1, z1) = (at(b, 0) - at(a, 0), at(b, 1) - at(a, 1), at(b, 2) - at(a, 2));
        let (x2, y2, z2) = (at(c, 0) - at(a, 0), at(c, 1) - at(a, 1), at(c, 2) - at(a, 2));
        if length([y1 * z2 - z1 * y2, z1 * x2 - x1 * z2, x1 * y2 - y1 * x2]) > 0.0 {
            indices.extend_from_slice(&[a as u32, b as u32, c as u32]);
        }
    };
    for y in 0..nv {
        for x in 0..nu {
            let a = y * (nu + 1) + x;
            let b = a + nu + 1;
            triangle(a, a + 1, b);
            triangle(a + 1, b + 1, b);
        }
    }
    let mut parts = vec![smooth_normals(Geometry { vertices, indices })];
    for (v, facing) in [(0usize, -1.0f64), (1, 1.0)] {
        let section = rows[v * row_count];
        let cy = (section[1] + section[2]) / 2.0;
        let mut vertices = Vec::with_capacity((nu + 1) * VERTEX_FLOATS);
        push_vertex(&mut vertices, [0.0, cy, section[0]], [0.0, 0.0, facing], 0.5, 0.5);
        let mut indices = Vec::with_capacity(nu * 3);
        let width = section[3].max(section[4]).max(1e-6);
        for j in 0..nu {
            let p = point(j as f64 / nu as f64, v as f64);
            push_vertex(
                &mut vertices,
                p,
                [0.0, 0.0, facing],
                0.5 + p[0] / (2.0 * width),
                (p[1] - section[1]) / (section[2] - section[1]),
            );
            let (a, b) = (j as u32 + 1, ((j + 1) % nu) as u32 + 1);
            indices.extend_from_slice(&if facing == 1.0 { [0, a, b] } else { [0, b, a] });
        }
        parts.push(Geometry { vertices, indices });
    }
    let mut g = merge(parts);
    paint(&mut g, color);
    Ok(g)
}

#[cfg(test)]
mod tests {
    use super::*;

    const WHITE: FacePaint = FacePaint { color: None, raw: false };

    fn closed_ok(g: &Geometry) {
        let n = (g.vertices.len() / VERTEX_FLOATS) as u32;
        assert!(!g.indices.is_empty() && g.indices.iter().all(|&i| i < n));
        assert!(g.vertices.iter().all(|v| v.is_finite()));
    }

    #[test]
    fn lathes_caps_and_cuts() {
        let profile = [[0.0, 1.0], [0.5, 0.5], [0.5, -0.5], [0.3, -1.0]];
        let base = LatheSpec {
            points: &profile,
            segments: 12,
            sweep: TAU,
            displace: None,
            color: Some([1.0, 0.0, 0.0]),
            cap: WHITE,
            cap_rings: 1,
            cut_color: None,
            cut_steps: 1,
        };
        let whole = lathe(&base).unwrap();
        closed_ok(&whole);
        // Side grid plus one bottom cap (the top is on the axis).
        assert_eq!(whole.vertices.len() / VERTEX_FLOATS, 4 * 13 + 2 * 13);
        let half = lathe(&LatheSpec { sweep: PI, ..base }).unwrap();
        closed_ok(&half);
        assert_eq!(half.vertices.len() / VERTEX_FLOATS, 4 * 13 + 2 * 13 + 2 * 4 * 2);
        let bumps = vec![0.01; 4 * 13];
        closed_ok(
            &lathe(&LatheSpec {
                displace: Some(&bumps),
                ..base
            })
            .unwrap(),
        );
        assert!(
            lathe(&LatheSpec {
                displace: Some(&bumps[1..]),
                ..base
            })
            .is_err()
        );
    }

    #[test]
    fn tubes_open_and_closed() {
        let points = [[0.0, 0.0, 0.0], [0.0, 1.0, 0.0], [1.0, 1.5, 0.0]];
        let radii = vec![0.1; tube_curve_points(3, false, 4)];
        let spec = TubeSpec {
            points: &points,
            closed: false,
            sides: 8,
            steps: 4,
            radii: &radii,
            shape: None,
            smooth: false,
            caps: true,
            color: None,
            cap: WHITE,
            cap_rings: 1,
        };
        let g = tube(&spec).unwrap();
        closed_ok(&g);
        assert_eq!(g.vertices.len() / VERTEX_FLOATS, 9 * 9 + 2 * 2 * 9);
        let ring = vec![0.1; tube_curve_points(3, true, 4)];
        closed_ok(
            &tube(&TubeSpec {
                closed: true,
                radii: &ring,
                ..spec
            })
            .unwrap(),
        );
        assert!(tube(&TubeSpec { radii: &ring, ..spec }).is_err());
    }

    #[test]
    fn lofts_a_body() {
        let sections = [
            [-1.0, 0.0, 1.0, 0.5, 0.4, 4.0],
            [0.0, 0.1, 1.2, 0.6, 0.5, 4.0],
            [1.0, 0.0, 0.9, 0.4, 0.3, 4.0],
        ];
        let g = loft(&sections, 16, 4, Some([0.2, 0.4, 0.6])).unwrap();
        closed_ok(&g);
        assert_eq!(g.vertices.len() / VERTEX_FLOATS, 17 * 9 + 2 * 17);
        assert_eq!(g.vertices[6], 0.2);
    }
}
