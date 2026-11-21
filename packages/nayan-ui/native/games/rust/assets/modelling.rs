//! Code-authored solids: analytic distance fields, constructive operations, seeded displacement,
//! and Surface Nets tessellation. No mesh IDs are allocated until the caller registers the result.

use fast_surface_nets::{SurfaceNetsBuffer, ndshape::RuntimeShape, surface_nets};
use glamx::{Quat, UVec3, Vec3};
use serde::Deserialize;

#[derive(Clone, Debug, Default)]
pub struct Geometry {
    pub vertices: Vec<f32>,
    pub indices: Vec<u32>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SolidRecipe {
    pub solid: Solid,
    pub resolution: u32,
    #[serde(default)]
    pub uv: Projection,
}

#[derive(Default, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Projection {
    #[default]
    Xy,
    Xz,
    Yz,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum Solid {
    Sphere {
        radius: f32,
    },
    Ellipsoid {
        radii: [f32; 3],
    },
    Box {
        size: [f32; 3],
        radius: f32,
    },
    Capsule {
        start: [f32; 3],
        end: [f32; 3],
        radius: f32,
    },
    Cylinder {
        radius: f32,
        height: f32,
    },
    Torus {
        radius: f32,
        tube: f32,
    },
    Union {
        a: Box<Solid>,
        b: Box<Solid>,
        blend: f32,
    },
    Subtract {
        a: Box<Solid>,
        b: Box<Solid>,
    },
    Intersect {
        a: Box<Solid>,
        b: Box<Solid>,
    },
    Transform {
        child: Box<Solid>,
        position: [f32; 3],
        rotation: [f32; 4],
        scale: [f32; 3],
    },
    Paint {
        child: Box<Solid>,
        color: [f32; 3],
    },
    Shell {
        child: Box<Solid>,
        thickness: f32,
    },
    Displace {
        child: Box<Solid>,
        amplitude: f32,
        frequency: f32,
        seed: u32,
        octaves: u32,
    },
}

#[derive(Clone, Copy, Debug)]
struct Bounds {
    lo: Vec3,
    hi: Vec3,
}

impl Bounds {
    fn centered(extent: Vec3) -> Self {
        Self { lo: -extent, hi: extent }
    }
    fn expand(self, amount: f32) -> Self {
        Self {
            lo: self.lo - Vec3::splat(amount),
            hi: self.hi + Vec3::splat(amount),
        }
    }
}

#[derive(Clone, Copy)]
struct Sample {
    distance: f32,
    color: Vec3,
}

fn positive(value: f32) -> bool {
    value.is_finite() && value > 1e-6
}
fn finite(values: &[f32]) -> bool {
    values.iter().all(|x| x.is_finite() && x.abs() <= 1e6)
}

impl Solid {
    fn prepare(&mut self) {
        match self {
            Self::Transform { child, rotation, .. } => {
                *rotation = Quat::from_array(*rotation).normalize().to_array();
                child.prepare();
            }
            Self::Union { a, b, .. } | Self::Subtract { a, b } | Self::Intersect { a, b } => {
                a.prepare();
                b.prepare();
            }
            Self::Paint { child, .. } | Self::Shell { child, .. } | Self::Displace { child, .. } => child.prepare(),
            _ => {}
        }
    }
    fn validate(&self, depth: usize, nodes: &mut usize) -> Result<(), String> {
        *nodes += 1;
        if depth > 48 || *nodes > 256 {
            return Err("solid exceeds 256 nodes or 48 nested operations".into());
        }
        let valid = match self {
            Self::Sphere { radius } => positive(*radius),
            Self::Ellipsoid { radii } => radii.iter().all(|r| positive(*r)),
            Self::Box { size, radius } => {
                size.iter().all(|r| positive(*r))
                    && radius.is_finite()
                    && *radius >= 0.0
                    && *radius <= size.iter().copied().fold(f32::INFINITY, f32::min) * 0.5
            }
            Self::Capsule { start, end, radius } => finite(start) && finite(end) && positive(*radius),
            Self::Cylinder { radius, height } => positive(*radius) && positive(*height),
            Self::Torus { radius, tube } => positive(*radius) && positive(*tube) && radius > tube,
            Self::Union { a, b, blend } => {
                a.validate(depth + 1, nodes)?;
                b.validate(depth + 1, nodes)?;
                blend.is_finite() && *blend >= 0.0
            }
            Self::Subtract { a, b } | Self::Intersect { a, b } => {
                a.validate(depth + 1, nodes)?;
                b.validate(depth + 1, nodes)?;
                true
            }
            Self::Transform {
                child,
                position,
                rotation,
                scale,
            } => {
                child.validate(depth + 1, nodes)?;
                finite(position)
                    && finite(rotation)
                    && Quat::from_array(*rotation).length_squared() > 1e-12
                    && finite(scale)
                    && scale.iter().all(|s| s.abs() > 1e-6)
            }
            Self::Paint { child, color } => {
                child.validate(depth + 1, nodes)?;
                finite(color) && color.iter().all(|c| (0.0..=1.0).contains(c))
            }
            Self::Shell { child, thickness } => {
                child.validate(depth + 1, nodes)?;
                positive(*thickness)
            }
            Self::Displace {
                child,
                amplitude,
                frequency,
                octaves,
                ..
            } => {
                child.validate(depth + 1, nodes)?;
                amplitude.is_finite() && *amplitude >= 0.0 && positive(*frequency) && (1..=6).contains(octaves)
            }
        };
        if valid {
            Ok(())
        } else {
            Err("solid contains invalid dimensions, transform, color, or noise settings".into())
        }
    }

    fn bounds(&self) -> Bounds {
        match self {
            Self::Sphere { radius } => Bounds::centered(Vec3::splat(*radius)),
            Self::Ellipsoid { radii } => Bounds::centered(Vec3::from_array(*radii)),
            Self::Box { size, .. } => Bounds::centered(Vec3::from_array(*size) * 0.5),
            Self::Capsule { start, end, radius } => Bounds {
                lo: Vec3::from_array(*start).min(Vec3::from_array(*end)),
                hi: Vec3::from_array(*start).max(Vec3::from_array(*end)),
            }
            .expand(*radius),
            Self::Cylinder { radius, height } => Bounds::centered(Vec3::new(*radius, height * 0.5, *radius)),
            Self::Torus { radius, tube } => Bounds::centered(Vec3::new(radius + tube, *tube, radius + tube)),
            Self::Union { a, b, blend } => {
                let a = a.bounds();
                let b = b.bounds();
                Bounds {
                    lo: a.lo.min(b.lo),
                    hi: a.hi.max(b.hi),
                }
                .expand(*blend * 0.25)
            }
            Self::Subtract { a, .. } => a.bounds(),
            Self::Intersect { a, b } => {
                let a = a.bounds();
                let b = b.bounds();
                Bounds {
                    lo: a.lo.max(b.lo),
                    hi: a.hi.min(b.hi),
                }
            }
            Self::Paint { child, .. } => child.bounds(),
            Self::Shell { child, thickness } => child.bounds().expand(*thickness * 0.5),
            Self::Displace { child, amplitude, .. } => child.bounds().expand(*amplitude),
            Self::Transform {
                child,
                position,
                rotation,
                scale,
            } => {
                let b = child.bounds();
                let q = Quat::from_array(*rotation);
                let s = Vec3::from_array(*scale);
                let p = Vec3::from_array(*position);
                let mut out = Bounds {
                    lo: Vec3::splat(f32::INFINITY),
                    hi: Vec3::splat(f32::NEG_INFINITY),
                };
                for x in [b.lo.x, b.hi.x] {
                    for y in [b.lo.y, b.hi.y] {
                        for z in [b.lo.z, b.hi.z] {
                            let v = q * (Vec3::new(x, y, z) * s) + p;
                            out.lo = out.lo.min(v);
                            out.hi = out.hi.max(v);
                        }
                    }
                }
                out
            }
        }
    }

    fn sample(&self, p: Vec3) -> Sample {
        let distance = match self {
            Self::Sphere { radius } => p.length() - radius,
            Self::Ellipsoid { radii } => {
                let r = Vec3::from_array(*radii);
                let k0 = (p / r).length();
                let k1 = (p / (r * r)).length();
                if k1 > 1e-12 { k0 * (k0 - 1.0) / k1 } else { -r.min_element() }
            }
            Self::Box { size, radius } => {
                let q = p.abs() - (Vec3::from_array(*size) * 0.5 - Vec3::splat(*radius));
                q.max(Vec3::ZERO).length() + q.max_element().min(0.0) - radius
            }
            Self::Capsule { start, end, radius } => {
                let a = Vec3::from_array(*start);
                let ab = Vec3::from_array(*end) - a;
                let h = if ab.length_squared() > 1e-12 {
                    ((p - a).dot(ab) / ab.length_squared()).clamp(0.0, 1.0)
                } else {
                    0.0
                };
                (p - a - ab * h).length() - radius
            }
            Self::Cylinder { radius, height } => {
                let a = p.x.hypot(p.z) - radius;
                let b = p.y.abs() - height * 0.5;
                a.max(0.0).hypot(b.max(0.0)) + a.max(b).min(0.0)
            }
            Self::Torus { radius, tube } => (p.x.hypot(p.z) - radius).hypot(p.y) - tube,
            Self::Transform {
                child,
                position,
                rotation,
                scale,
            } => {
                let s = Vec3::from_array(*scale);
                let q = Quat::from_array(*rotation);
                let mut value = child.sample((q.conjugate() * (p - Vec3::from_array(*position))) / s);
                value.distance *= s.abs().min_element();
                return value;
            }
            Self::Paint { child, color } => {
                let mut value = child.sample(p);
                value.color = Vec3::from_array(*color);
                return value;
            }
            Self::Union { a, b, blend } => {
                let a = a.sample(p);
                let b = b.sample(p);
                if *blend <= 1e-6 {
                    return if a.distance <= b.distance { a } else { b };
                }
                let h = (0.5 + 0.5 * (b.distance - a.distance) / blend).clamp(0.0, 1.0);
                return Sample {
                    distance: b.distance + (a.distance - b.distance) * h - blend * h * (1.0 - h),
                    color: b.color.lerp(a.color, h),
                };
            }
            Self::Subtract { a, b } => {
                let mut value = a.sample(p);
                value.distance = value.distance.max(-b.sample(p).distance);
                return value;
            }
            Self::Intersect { a, b } => {
                let a = a.sample(p);
                let b = b.sample(p);
                return if a.distance >= b.distance { a } else { b };
            }
            Self::Shell { child, thickness } => {
                let mut value = child.sample(p);
                value.distance = value.distance.abs() - thickness * 0.5;
                return value;
            }
            Self::Displace {
                child,
                amplitude,
                frequency,
                seed,
                octaves,
            } => {
                let mut value = child.sample(p);
                let mut noise = 0.0;
                let mut weight = 1.0;
                let mut total = 0.0;
                let mut frequency = *frequency;
                for octave in 0..*octaves {
                    noise += value_noise(p * frequency, seed.wrapping_add(octave)) * weight;
                    total += weight;
                    weight *= 0.5;
                    frequency *= 2.0;
                }
                value.distance += noise / total * amplitude;
                return value;
            }
        };
        Sample { distance, color: Vec3::ONE }
    }
}

fn value_noise(p: Vec3, seed: u32) -> f32 {
    let cell = p.floor();
    let t = p - cell;
    let t = t * t * (Vec3::splat(3.0) - 2.0 * t);
    let hash = |x: i32, y: i32, z: i32| {
        let mut n = (x as u32).wrapping_mul(0x8da6b343) ^ (y as u32).wrapping_mul(0xd8163841) ^ (z as u32).wrapping_mul(0xcb1ab31f) ^ seed;
        n ^= n >> 16;
        n = n.wrapping_mul(0x7feb352d);
        n ^= n >> 15;
        n = n.wrapping_mul(0x846ca68b);
        n ^= n >> 16;
        n as f32 / u32::MAX as f32 * 2.0 - 1.0
    };
    let mut value = 0.0;
    for z in 0..2 {
        for y in 0..2 {
            for x in 0..2 {
                let w = Vec3::new(
                    if x == 0 { 1.0 - t.x } else { t.x },
                    if y == 0 { 1.0 - t.y } else { t.y },
                    if z == 0 { 1.0 - t.z } else { t.z },
                );
                value += w.x
                    * w.y
                    * w.z
                    * hash(
                        (cell.x as i32).wrapping_add(x),
                        (cell.y as i32).wrapping_add(y),
                        (cell.z as i32).wrapping_add(z),
                    );
            }
        }
    }
    value
}

pub fn generate(recipe: &[u8]) -> Result<Geometry, String> {
    if recipe.len() > 1_000_000 {
        return Err("solid recipe is too large".into());
    }
    let mut recipe: SolidRecipe = serde_json::from_slice(recipe).map_err(|e| format!("invalid solid recipe: {e}"))?;
    recipe.solid.validate(0, &mut 0)?;
    recipe.solid.prepare();
    if !(8..=128).contains(&recipe.resolution) {
        return Err("solid resolution must be an integer from 8 to 128".into());
    }
    let bounds = recipe.solid.bounds();
    let extent = bounds.hi - bounds.lo;
    if !extent.is_finite() || extent.min_element() <= 1e-6 || !bounds.lo.is_finite() || !bounds.hi.is_finite() {
        return Err("solid is empty or has invalid bounds".into());
    }
    let step = extent.max_element() / recipe.resolution as f32;
    let lo = bounds.lo - Vec3::splat(step * 2.0);
    let dims = (extent / step).ceil().as_uvec3() + UVec3::splat(5);
    let dims = dims.to_array();
    let count = dims
        .iter()
        .try_fold(1usize, |n, &d| n.checked_mul(d as usize))
        .ok_or("solid grid is too large")?;
    if count > 2_500_000 {
        return Err("solid grid exceeds the 2.5 million sample budget".into());
    }
    let shape = RuntimeShape::<u32, 3>::new(dims);
    let mut field = Vec::with_capacity(count);
    for z in 0..dims[2] {
        for y in 0..dims[1] {
            for x in 0..dims[0] {
                field.push(recipe.solid.sample(lo + Vec3::new(x as f32, y as f32, z as f32) * step).distance);
            }
        }
    }
    if field.iter().any(|d| !d.is_finite()) {
        return Err("solid distance field contains non-finite samples".into());
    }
    let mut mesh = SurfaceNetsBuffer::default();
    surface_nets(&field, &shape, [0; 3], dims.map(|d| d - 1), &mut mesh);
    if mesh.indices.is_empty() {
        return Err("solid has no surface at this resolution; increase resolution or feature thickness".into());
    }
    let mut vertices = Vec::with_capacity(mesh.positions.len() * 11);
    for (&position, &normal) in mesh.positions.iter().zip(&mesh.normals) {
        let p = lo + Vec3::from_array(position) * step;
        let n = Vec3::from_array(normal).normalize_or(Vec3::Y);
        let color = recipe.solid.sample(p).color;
        let uv = (p - bounds.lo) / extent;
        let (u, v) = match recipe.uv {
            Projection::Xy => (uv.x, uv.y),
            Projection::Xz => (uv.x, uv.z),
            Projection::Yz => (uv.y, uv.z),
        };
        vertices.extend_from_slice(&[p.x, p.y, p.z, n.x, n.y, n.z, color.x, color.y, color.z, u, v]);
    }
    // Match engine culling even if a future mesher changes its default orientation.
    super::geometry::face_outward(&vertices, &mut mesh.indices);
    Ok(Geometry {
        vertices,
        indices: mesh.indices,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn build(solid: serde_json::Value, resolution: u32) -> Geometry {
        generate(&serde_json::to_vec(&json!({"solid":solid,"resolution":resolution})).unwrap()).unwrap()
    }

    #[test]
    fn sphere_has_finite_unit_normals_and_a_closed_surface() {
        let g = build(json!({"kind":"sphere","radius":1}), 24);
        let mut edges = std::collections::HashMap::new();
        for v in g.vertices.chunks_exact(11) {
            assert!(v.iter().all(|x| x.is_finite()));
            assert!((Vec3::new(v[3], v[4], v[5]).length() - 1.0).abs() < 1e-5);
            assert!((Vec3::new(v[0], v[1], v[2]).length() - 1.0).abs() < 0.02);
        }
        for t in g.indices.chunks_exact(3) {
            for (a, b) in [(t[0], t[1]), (t[1], t[2]), (t[2], t[0])] {
                *edges.entry((a.min(b), a.max(b))).or_insert(0) += 1;
            }
        }
        assert!(edges.values().all(|&count| count == 2));
    }

    #[test]
    fn subtraction_makes_a_real_hole() {
        let g = build(
            json!({"kind":"subtract","a":{"kind":"box","size":[2,2,2],"radius":0.1},"b":{"kind":"cylinder","radius":0.4,"height":4}}),
            32,
        );
        assert!(g.vertices.chunks_exact(11).any(|v| v[0].hypot(v[2]) < 0.43 && v[1].abs() < 0.5));
        assert!(g.vertices.chunks_exact(11).all(|v| v[0].hypot(v[2]) > 0.35));
    }

    #[test]
    fn seeded_displacement_is_reproducible_and_changes_with_seed() {
        let solid = |seed| json!({"kind":"displace","child":{"kind":"sphere","radius":1},"amplitude":0.15,"frequency":3,"octaves":3,"seed":seed});
        assert_eq!(build(solid(42), 24).vertices, build(solid(42), 24).vertices);
        assert_ne!(build(solid(42), 24).vertices, build(solid(43), 24).vertices);
    }

    #[test]
    fn invalid_or_disjoint_solids_fail_without_meshing() {
        for solid in [json!({"kind":"sphere","radius":-1}), json!({"kind":"box","size":[1,1,1],"radius":2})] {
            assert!(generate(&serde_json::to_vec(&json!({"solid":solid,"resolution":24})).unwrap()).is_err());
        }
    }

    #[test]
    fn blends_keep_both_colors_and_nonuniform_transforms_keep_bounds() {
        let a = json!({"kind":"paint","child":{"kind":"sphere","radius":0.7},"color":[1,0,0]});
        let b = json!({"kind":"transform","child":{"kind":"paint","child":{"kind":"sphere","radius":0.7},"color":[0,0,1]},"position":[0.8,0,0],"rotation":[0,0,0,1],"scale":[1,1,1]});
        let g = build(json!({"kind":"union","a":a,"b":b,"blend":0.25}), 32);
        assert!(g.vertices.chunks_exact(11).any(|v| v[6] > 0.95));
        assert!(g.vertices.chunks_exact(11).any(|v| v[8] > 0.95));
        assert!(g.vertices.chunks_exact(11).any(|v| v[6] > 0.1 && v[8] > 0.1));
        let g = build(
            json!({"kind":"transform","child":{"kind":"sphere","radius":1},"position":[1,2,3],"rotation":[0,0,0,2],"scale":[2,1,0.5]}),
            32,
        );
        let min = g.vertices.chunks_exact(11).map(|v| v[0]).fold(f32::INFINITY, f32::min);
        let max = g.vertices.chunks_exact(11).map(|v| v[0]).fold(f32::NEG_INFINITY, f32::max);
        assert!((min + 1.0).abs() < 0.04 && (max - 3.0).abs() < 0.04);
    }

    #[test]
    fn empty_cuts_bad_resolutions_and_large_noise_coordinates_do_not_panic() {
        let sphere = json!({"kind":"sphere","radius":1});
        assert!(generate(&serde_json::to_vec(&json!({"solid":{"kind":"subtract","a":sphere,"b":sphere},"resolution":24})).unwrap()).is_err());
        assert!(generate(&serde_json::to_vec(&json!({"solid":sphere,"resolution":256})).unwrap()).is_err());
        assert!(value_noise(Vec3::splat(1e15), 42).is_finite());
    }
}
