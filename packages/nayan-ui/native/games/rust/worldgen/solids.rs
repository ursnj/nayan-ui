//! Collision solids for walkers: vertical prisms (circles and convex polygons with a bottom and top)
//! in a uniform spatial grid. Polygons can be convex hulls of a mesh recipe's vertices, so a rendered
//! rock and its collision footprint come from the same geometry.

use super::math;
use std::collections::HashMap;

#[derive(Clone, Debug, PartialEq)]
pub enum Footprint {
    Circle { x: f64, z: f64, radius: f64 },
    Polygon { points: Vec<[f64; 2]> },
}

#[derive(Clone, Debug, PartialEq)]
pub struct Solid {
    pub footprint: Footprint,
    pub bottom: f64,
    pub top: f64,
    pub bounds: [f64; 4],
}

impl Solid {
    pub fn circle(x: f64, z: f64, radius: f64, bottom: f64, top: f64) -> Solid {
        Solid {
            footprint: Footprint::Circle { x, z, radius },
            bottom,
            top,
            bounds: [x - radius, x + radius, z - radius, z + radius],
        }
    }

    pub fn polygon(points: Vec<[f64; 2]>, bottom: f64, top: f64) -> Solid {
        let mut bounds = [f64::INFINITY, f64::NEG_INFINITY, f64::INFINITY, f64::NEG_INFINITY];
        for p in &points {
            bounds = [
                math::min(bounds[0], p[0]),
                math::max(bounds[1], p[0]),
                math::min(bounds[2], p[1]),
                math::max(bounds[3], p[1]),
            ];
        }
        Solid {
            footprint: Footprint::Polygon { points },
            bottom,
            top,
            bounds,
        }
    }

    /// An oriented box: yaw turns +x towards −z, as the world frame does.
    pub fn rectangle(x: f64, z: f64, half_x: f64, half_z: f64, yaw: f64, bottom: f64, top: f64) -> Solid {
        let (cos, sin) = (math::cos(yaw), math::sin(yaw));
        let points = [[-half_x, -half_z], [half_x, -half_z], [half_x, half_z], [-half_x, half_z]]
            .iter()
            .map(|&[u, v]| [x + cos * u + sin * v, z - sin * u + cos * v])
            .collect();
        Solid::polygon(points, bottom, top)
    }

    /// Signed distance to the footprint (negative inside).
    pub fn distance(&self, x: f64, z: f64) -> f64 {
        match &self.footprint {
            Footprint::Circle { x: cx, z: cz, radius } => math::hypot2(x - cx, z - cz) - radius,
            Footprint::Polygon { points } => {
                let mut distance2 = f64::INFINITY;
                let mut inside = true;
                for i in 0..points.len() {
                    let (a, b) = (points[i], points[(i + 1) % points.len()]);
                    let (dx, dz) = (b[0] - a[0], b[1] - a[1]);
                    let length2 = dx * dx + dz * dz;
                    if dx * (z - a[1]) - dz * (x - a[0]) < -1e-10 {
                        inside = false;
                    }
                    let t = if length2 > 0.0 {
                        math::max(0.0, math::min(1.0, ((x - a[0]) * dx + (z - a[1]) * dz) / length2))
                    } else {
                        0.0
                    };
                    let (ex, ez) = (x - a[0] - dx * t, z - a[1] - dz * t);
                    distance2 = math::min(distance2, ex * ex + ez * ez);
                }
                distance2.sqrt() * if inside { -1.0 } else { 1.0 }
            }
        }
    }
}

/// A convex outline and vertical extent, placed per instance with scale and yaw.
#[derive(Clone, Debug)]
pub struct Template {
    pub hull: Vec<[f64; 2]>,
    pub bottom: f64,
    pub top: f64,
}

impl Template {
    /// From mesh vertex positions (x, y, z triples).
    pub fn from_positions(positions: impl Iterator<Item = [f64; 3]>) -> Template {
        let mut points = Vec::new();
        let (mut bottom, mut top) = (f64::INFINITY, f64::NEG_INFINITY);
        for [x, y, z] in positions {
            points.push([x, z]);
            bottom = math::min(bottom, y);
            top = math::max(top, y);
        }
        Template {
            hull: convex_hull(points),
            bottom,
            top,
        }
    }

    pub fn place(&self, x: f64, y: f64, z: f64, scale: [f64; 3], yaw: f64) -> Solid {
        let (cos, sin) = (math::cos(yaw), math::sin(yaw));
        let points = self
            .hull
            .iter()
            .map(|p| {
                [
                    x + cos * p[0] * scale[0] + sin * p[1] * scale[2],
                    z - sin * p[0] * scale[0] + cos * p[1] * scale[2],
                ]
            })
            .collect();
        Solid::polygon(points, y + self.bottom * scale[1], y + self.top * scale[1])
    }
}

/// Andrew's monotone chain, counter-clockwise in (x, z).
pub fn convex_hull(mut points: Vec<[f64; 2]>) -> Vec<[f64; 2]> {
    points.sort_by(|a, b| a[0].total_cmp(&b[0]).then(a[1].total_cmp(&b[1])));
    let cross = |a: [f64; 2], b: [f64; 2], c: [f64; 2]| (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    let half = |input: &mut dyn Iterator<Item = [f64; 2]>| {
        let mut result: Vec<[f64; 2]> = Vec::new();
        for p in input {
            while result.len() > 1 && cross(result[result.len() - 2], result[result.len() - 1], p) <= 0.0 {
                result.pop();
            }
            result.push(p);
        }
        result.pop();
        result
    };
    let mut hull = half(&mut points.iter().copied());
    hull.extend(half(&mut points.iter().rev().copied()));
    hull
}

pub struct Solids {
    pub list: Vec<Solid>,
    cells: HashMap<(i32, i32), Vec<u32>>,
    cell: f64,
    margin: f64,
}

impl Solids {
    pub fn new(cell: f64, margin: f64) -> Solids {
        Solids {
            list: Vec::new(),
            cells: HashMap::new(),
            cell,
            margin,
        }
    }

    pub fn add(&mut self, solid: Solid) {
        let index = self.list.len() as u32;
        let [min_x, max_x, min_z, max_z] = solid.bounds;
        let key = |v: f64| (v / self.cell).floor() as i32;
        for ix in key(min_x - self.margin)..=key(max_x + self.margin) {
            for iz in key(min_z - self.margin)..=key(max_z + self.margin) {
                self.cells.entry((ix, iz)).or_default().push(index);
            }
        }
        self.list.push(solid);
    }

    /// The smallest clearance from a walker of `radius` to a solid overlapping heights bottom..top.
    pub fn clearance(&self, x: f64, z: f64, radius: f64, bottom: f64, top: f64) -> f64 {
        let mut clearance = f64::INFINITY;
        if !(x.is_finite() && z.is_finite()) {
            return clearance;
        }
        if let Some(bucket) = self.cells.get(&((x / self.cell).floor() as i32, (z / self.cell).floor() as i32)) {
            for &i in bucket {
                let solid = &self.list[i as usize];
                if solid.top <= bottom + 0.001 || solid.bottom >= top {
                    continue;
                }
                clearance = math::min(clearance, solid.distance(x, z) - radius);
            }
        }
        clearance
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hull_rectangle_and_clearance() {
        let hull = convex_hull(vec![[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.5, 0.5]]);
        assert_eq!(hull.len(), 4);
        let mut solids = Solids::new(8.0, 1.5);
        solids.add(Solid::rectangle(0.0, 0.0, 1.0, 0.5, 0.0, 0.0, 1.0));
        solids.add(Solid::circle(5.0, 0.0, 1.0, 0.0, 3.0));
        assert!((solids.clearance(0.0, 2.0, 0.5, 0.0, 2.0) - 1.0).abs() < 1e-12);
        assert!(solids.clearance(0.0, 0.0, 0.0, 0.0, 2.0) < 0.0);
        assert_eq!(solids.clearance(0.0, 0.0, 0.0, 1.5, 2.0), 4.0, "above the box: only the circle counts");
        assert!((solids.clearance(3.0, 0.0, 0.5, 0.0, 2.0) - 0.5).abs() < 1e-12);
    }
}
