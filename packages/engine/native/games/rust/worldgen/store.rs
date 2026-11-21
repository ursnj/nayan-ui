//! Compact binary records of generated worlds, tied to the exact recipe (its SHA-256): a changed
//! recipe never restores a stale world.

use super::solids::{Footprint, Solid};
use super::world::{Generated, Layer};

const MAGIC: &[u8; 4] = b"NWG1";
const LIMIT: usize = 256 * 1024 * 1024;

struct Writer(Vec<u8>);

impl Writer {
    fn u32(&mut self, v: u32) {
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    fn f64(&mut self, v: f64) {
        self.0.extend_from_slice(&v.to_le_bytes());
    }
    fn text(&mut self, v: &str) {
        self.u32(v.len() as u32);
        self.0.extend_from_slice(v.as_bytes());
    }
    fn points(&mut self, points: &[[f64; 2]]) {
        self.u32(points.len() as u32);
        for p in points {
            self.f64(p[0]);
            self.f64(p[1]);
        }
    }
}

struct Reader<'a> {
    bytes: &'a [u8],
    at: usize,
}

impl<'a> Reader<'a> {
    fn take(&mut self, n: usize) -> Result<&'a [u8], String> {
        let end = self
            .at
            .checked_add(n)
            .filter(|&e| e <= self.bytes.len())
            .ok_or("truncated world record")?;
        let slice = &self.bytes[self.at..end];
        self.at = end;
        Ok(slice)
    }
    fn u32(&mut self) -> Result<u32, String> {
        Ok(u32::from_le_bytes(self.take(4)?.try_into().unwrap()))
    }
    fn f64(&mut self) -> Result<f64, String> {
        Ok(f64::from_le_bytes(self.take(8)?.try_into().unwrap()))
    }
    fn count(&mut self, size: usize) -> Result<usize, String> {
        let n = self.u32()? as usize;
        if n.saturating_mul(size) > self.bytes.len() - self.at {
            return Err("corrupt world record length".into());
        }
        Ok(n)
    }
    fn text(&mut self) -> Result<String, String> {
        let n = self.count(1)?;
        String::from_utf8(self.take(n)?.to_vec()).map_err(|_| "corrupt world record text".into())
    }
    fn points(&mut self) -> Result<Vec<[f64; 2]>, String> {
        let n = self.count(16)?;
        (0..n).map(|_| Ok([self.f64()?, self.f64()?])).collect()
    }
}

pub fn encode(recipe: &str, g: &Generated) -> Vec<u8> {
    let mut w = Writer(MAGIC.to_vec());
    w.text(recipe);
    w.f64(g.spawn[0]);
    w.f64(g.spawn[1]);
    w.u32(g.layers.len() as u32);
    for layer in &g.layers {
        w.text(&layer.name);
        w.u32(layer.stride);
        w.u32(layer.data.len() as u32);
        layer.data.iter().for_each(|&v| w.f64(v));
    }
    w.u32(g.solids.len() as u32);
    for solid in &g.solids {
        w.f64(solid.bottom);
        w.f64(solid.top);
        match &solid.footprint {
            Footprint::Circle { x, z, radius } => {
                w.u32(0);
                w.f64(*x);
                w.f64(*z);
                w.f64(*radius);
            }
            Footprint::Polygon { points } => {
                w.u32(1);
                w.points(points);
            }
        }
    }
    w.points(&g.reachable);
    w.u32(g.picks.len() as u32);
    for (name, points) in &g.picks {
        w.text(name);
        w.points(points);
    }
    w.u32(g.overview.len() as u32);
    w.0.extend_from_slice(&g.overview);
    w.0
}

/// The record's results, if it was made from exactly `recipe`.
pub fn decode(bytes: &[u8], recipe: &str) -> Result<Generated, String> {
    if bytes.len() > LIMIT || bytes.get(..4) != Some(MAGIC.as_slice()) {
        return Err("not a world record".into());
    }
    let mut r = Reader { bytes, at: 4 };
    if r.text()? != recipe {
        return Err("world record from another recipe".into());
    }
    let mut g = Generated {
        spawn: [r.f64()?, r.f64()?],
        ..Default::default()
    };
    for _ in 0..r.count(12)? {
        let name = r.text()?;
        let stride = r.u32()?;
        let n = r.count(8)?;
        let data = (0..n).map(|_| r.f64()).collect::<Result<_, _>>()?;
        g.layers.push(Layer { name, stride, data });
    }
    for _ in 0..r.count(20)? {
        let (bottom, top) = (r.f64()?, r.f64()?);
        g.solids.push(match r.u32()? {
            0 => Solid::circle(r.f64()?, r.f64()?, r.f64()?, bottom, top),
            1 => Solid::polygon(r.points()?, bottom, top),
            _ => return Err("corrupt world record solid".into()),
        });
    }
    g.reachable = r.points()?;
    for _ in 0..r.count(8)? {
        let name = r.text()?;
        g.picks.push((name, r.points()?));
    }
    let n = r.count(1)?;
    g.overview = r.take(n)?.to_vec();
    if r.at != bytes.len() {
        return Err("trailing bytes in world record".into());
    }
    Ok(g)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_and_rejects_other_recipes() {
        let g = Generated {
            spawn: [1.5, -2.0],
            layers: vec![Layer {
                name: "trees".into(),
                stride: 4,
                data: vec![1.0, 2.0, 3.0, 4.0],
            }],
            solids: vec![
                Solid::circle(1.0, 2.0, 0.5, 0.0, 3.0),
                Solid::polygon(vec![[0.0, 0.0], [1.0, 0.0], [0.0, 1.0]], -1.0, 1.0),
            ],
            reachable: vec![[0.0, 0.0], [3.0, 0.0]],
            picks: vec![("gems".into(), vec![[3.0, 0.0]])],
            overview: vec![0, 1, 2, 3],
        };
        let bytes = encode("{\"a\":1}", &g);
        assert_eq!(decode(&bytes, "{\"a\":1}").unwrap(), g);
        assert!(decode(&bytes, "{\"a\":2}").is_err());
        assert!(decode(&bytes[..bytes.len() - 1], "{\"a\":1}").is_err());
    }
}
