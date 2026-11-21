//! Baked pictures of models: one or more models drawn once on the CPU, shaded the way the renderer
//! shades them under a given light, seen from +z with an orthographic camera, into an anti-aliased
//! RGBA image (transparent around them) registered as a texture. A game shows it on a camera-facing
//! quad instead of the models: one quad instead of thousands of triangles. With a `key`, the picture
//! is kept in the engine's cache, and a later bake restores it without needing the models at all.

use super::model::{self, VERTEX_FLOATS};
use super::texture::{self, Image};
use serde::Deserialize;

/// How to bake: the picture's size and the light and sky the renderer would draw the model under.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BakeSpec {
    /// Width and height in pixels.
    pub size: u32,
    /// Samples per pixel along each side (anti-aliasing). Default 4.
    #[serde(default = "four")]
    pub supersample: u32,
    /// Toward the light (normalized here).
    pub light: [f32; 3],
    pub ambient: f32,
    #[serde(default = "white")]
    pub light_color: [f32; 3],
    /// The background color, reflected by glossy surfaces.
    #[serde(default)]
    pub sky: [f32; 3],
    /// Glossiness 0..1, as the model's material.
    #[serde(default)]
    pub shine: f32,
    /// Empty margin around the model, as a fraction of its larger side. Default 0.04.
    #[serde(default = "margin")]
    pub padding: f32,
    /// Models placed together (a tile and the fruit on it); none = just the mesh baked.
    #[serde(default)]
    pub parts: Vec<BakePart>,
    /// The square to draw, [center x, center y, half side] (default: around the models, with padding).
    #[serde(default)]
    pub frame: Option<[f32; 3]>,
    /// Keep the picture in the engine's cache under this key, and restore it from there.
    #[serde(default)]
    pub key: Option<String>,
}

/// One model in a bake: placed (scaled, then moved; no rotation), tinted and glossy as an entity.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BakePart {
    pub mesh: u32,
    #[serde(default)]
    pub position: [f32; 3],
    #[serde(default = "unit")]
    pub scale: [f32; 3],
    #[serde(default = "white")]
    pub color: [f32; 3],
    #[serde(default)]
    pub shine: f32,
}

fn unit() -> [f32; 3] {
    [1.0; 3]
}

fn four() -> u32 {
    4
}
fn white() -> [f32; 3] {
    [1.0; 3]
}
fn margin() -> f32 {
    0.04
}

/// A baked picture: its texture, and the square of model space (x, y) it covers.
#[derive(Debug, PartialEq)]
pub struct Baked {
    pub texture: u32,
    pub center: [f32; 2],
    /// Half the square's side.
    pub extent: f32,
}

type V3 = [f32; 3];
fn dot(a: V3, b: V3) -> f32 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
fn normalize(a: V3) -> V3 {
    let l = dot(a, a).sqrt();
    if l > 0.0 { [a[0] / l, a[1] / l, a[2] / l] } else { [0.0, 0.0, 1.0] }
}
fn smoothstep(a: f32, b: f32, x: f32) -> f32 {
    let t = ((x - a) / (b - a)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}
fn mix3(a: V3, b: V3, t: f32) -> V3 {
    [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/// The renderer's `shade` (shader.wgsl) for an unshadowed, unfogged surface seen along -z.
fn shade(spec: &BakeSpec, shine: f32, light: V3, normal: V3, base: V3) -> V3 {
    let n = normalize(normal);
    let diffuse = dot(n, light).max(0.0);
    let hemisphere = 0.6 + 0.4 * (n[1] * 0.5 + 0.5);
    let k = spec.ambient * hemisphere + (1.0 - spec.ambient) * diffuse;
    let lit = [k * spec.light_color[0], k * spec.light_color[1], k * spec.light_color[2]];
    let peak = base[0].max(base[1]).max(base[2]);
    let glow = (peak - 1.0).clamp(0.0, 1.0);
    let dim = [base[0].min(1.0) * lit[0], base[1].min(1.0) * lit[1], base[2].min(1.0) * lit[2]];
    let bright = [base[0] / peak.max(1.0), base[1] / peak.max(1.0), base[2] / peak.max(1.0)];
    let mut color = mix3(dim, bright, glow);
    if shine > 0.0 {
        let v = [0.0, 0.0, 1.0];
        let h = normalize([light[0] + v[0], light[1] + v[1], light[2] + v[2]]);
        let highlight = dot(n, h).max(0.0).powf(16.0 + (220.0 - 16.0) * shine) * shine;
        // reflect(-v, n)
        let d = dot(n, [0.0, 0.0, -1.0]);
        let r = [-2.0 * d * n[0], -2.0 * d * n[1], -1.0 - 2.0 * d * n[2]];
        let sky = mix3(
            [0.16, 0.15, 0.14],
            [spec.sky[0] * 1.08, spec.sky[1] * 1.08, spec.sky[2] * 1.08],
            smoothstep(-0.15, 0.35, r[1]),
        );
        let fresnel = 0.05 + 0.95 * (1.0 - dot(n, v).max(0.0)).powi(5);
        color = mix3(color, sky, (fresnel * shine).min(1.0));
        for (c, l) in color.iter_mut().zip(spec.light_color) {
            *c += highlight * 1.6 * l;
        }
    }
    color
}

/// The cache record of a kept picture: "NBK1", size, center x, center y, extent, then RGBA.
fn encode(size: u32, center: [f32; 2], extent: f32, rgba: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(20 + rgba.len());
    out.extend_from_slice(b"NBK1");
    out.extend_from_slice(&size.to_le_bytes());
    for v in [center[0], center[1], extent] {
        out.extend_from_slice(&v.to_le_bytes());
    }
    out.extend_from_slice(rgba);
    out
}

fn decode(bytes: &[u8]) -> Option<(u32, [f32; 2], f32, &[u8])> {
    let word = |i: usize| bytes.get(i..i + 4).map(|b| <[u8; 4]>::try_from(b).unwrap());
    if bytes.get(..4)? != b"NBK1" {
        return None;
    }
    let size = u32::from_le_bytes(word(4)?);
    let f = |i| f32::from_le_bytes(word(i).unwrap_or_default());
    let rgba = bytes.get(20..)?;
    (size > 0 && size <= 1024 && rgba.len() == (size * size * 4) as usize).then(|| (size, [f(8), f(12)], f(16), rgba))
}

fn cache_key(key: &str) -> String {
    format!("bake:{key}")
}

/// Whether a picture was kept under `key` (cheap enough to ask before building any model).
pub fn kept(key: &str) -> bool {
    super::cache::read(&cache_key(key)).is_some_and(|bytes| decode(&bytes).is_some())
}

/// Draws model `mesh` (or the spec's parts) into a new texture; see [`BakeSpec`].
pub fn bake(mesh: crate::MeshId, spec: &BakeSpec) -> Result<Baked, String> {
    if !(1..=1024).contains(&spec.size) || !(1..=8).contains(&spec.supersample) {
        return Err("bake: size must be 1..1024 pixels and supersample 1..8".into());
    }
    if let Some(key) = &spec.key
        && let Some(bytes) = super::cache::read(&cache_key(key))
        && let Some((size, center, extent, rgba)) = decode(&bytes)
    {
        let texture = texture::register(Image {
            source_size: None,
            width: size,
            height: size,
            rgba: rgba.to_vec(),
        })?;
        return Ok(Baked { texture, center, extent });
    }
    let parts = if spec.parts.is_empty() {
        vec![BakePart {
            mesh: mesh as u32,
            position: [0.0; 3],
            scale: [1.0; 3],
            color: [1.0; 3],
            shine: spec.shine,
        }]
    } else {
        spec.parts.clone()
    };
    // Each part's model, its vertices placed (positions scaled then moved; normals scaled inversely).
    let mut placed = Vec::with_capacity(parts.len());
    for part in &parts {
        let id = crate::MeshId::try_from(part.mesh).map_err(|_| "bake: bad mesh id".to_string())?;
        let model = model::get(id).ok_or("bake: unknown model")?;
        let [sx, sy, sz] = part.scale;
        let vertices: Vec<f32> = model
            .vertices
            .as_chunks::<VERTEX_FLOATS>()
            .0
            .iter()
            .flat_map(|v| {
                let n = normalize([v[3] / sx, v[4] / sy, v[5] / sz]);
                [
                    v[0] * sx + part.position[0],
                    v[1] * sy + part.position[1],
                    v[2] * sz + part.position[2],
                    n[0],
                    n[1],
                    n[2],
                    v[6] * part.color[0],
                    v[7] * part.color[1],
                    v[8] * part.color[2],
                    v[9],
                    v[10],
                ]
            })
            .collect();
        // A mirroring scale turns triangles inside out.
        let mirrored = sx * sy * sz < 0.0;
        placed.push((model, vertices, mirrored, part.shine));
    }
    if placed.iter().all(|(_, v, _, _)| v.is_empty()) {
        return Err("bake: the model has no vertices".into());
    }
    // The square: given, or around the models' x/y bounds with a margin.
    let (center, extent) = match spec.frame {
        Some([x, y, e]) if e > 0.0 => ([x, y], e),
        _ => {
            let (mut lo, mut hi) = ([f32::INFINITY; 2], [f32::NEG_INFINITY; 2]);
            for (_, v, _, _) in &placed {
                for p in v.as_chunks::<VERTEX_FLOATS>().0 {
                    for k in 0..2 {
                        lo[k] = lo[k].min(p[k]);
                        hi[k] = hi[k].max(p[k]);
                    }
                }
            }
            let center = [(lo[0] + hi[0]) / 2.0, (lo[1] + hi[1]) / 2.0];
            (
                center,
                ((hi[0] - lo[0]).max(hi[1] - lo[1]) / 2.0 * (1.0 + 2.0 * spec.padding.max(0.0))).max(1e-6),
            )
        }
    };
    let s = spec.supersample as usize;
    let side = spec.size as usize * s;
    let to_px = |x: f32, y: f32| -> (f32, f32) {
        (
            (x - (center[0] - extent)) / (2.0 * extent) * side as f32,
            ((center[1] + extent) - y) / (2.0 * extent) * side as f32,
        )
    };
    let light = normalize(spec.light);

    // Samples: depth (nearest +z wins) and shaded color; -inf depth = empty.
    let mut depth = vec![f32::NEG_INFINITY; side * side];
    let mut color = vec![[0f32; 3]; side * side];
    for (model, v, mirrored, shine) in &placed {
        let texels = model.texture.and_then(texture::get);
        let count = v.len() / VERTEX_FLOATS;
        let vert = |i: usize| &v[i * VERTEX_FLOATS..(i + 1) * VERTEX_FLOATS];
        for t in model.indices.as_chunks::<3>().0 {
            let [a, b, c] = if *mirrored { [t[0], t[2], t[1]] } else { [t[0], t[1], t[2]] }.map(|i| i as usize);
            if a >= count || b >= count || c >= count {
                continue;
            }
            let (va, vb, vc) = (vert(a), vert(b), vert(c));
            let (pa, pb, pc) = (to_px(va[0], va[1]), to_px(vb[0], vb[1]), to_px(vc[0], vc[1]));
            // Counter-clockwise seen from +z is the front (y is flipped in pixels, so the sign flips too).
            let area = (pb.0 - pa.0) * (pc.1 - pa.1) - (pb.1 - pa.1) * (pc.0 - pa.0);
            if area >= 0.0 {
                continue;
            }
            let x0 = pa.0.min(pb.0).min(pc.0).floor().max(0.0) as usize;
            let x1 = (pa.0.max(pb.0).max(pc.0).ceil().max(0.0) as usize).min(side);
            let y0 = pa.1.min(pb.1).min(pc.1).floor().max(0.0) as usize;
            let y1 = (pa.1.max(pb.1).max(pc.1).ceil().max(0.0) as usize).min(side);
            for y in y0..y1 {
                for x in x0..x1 {
                    let (px, py) = (x as f32 + 0.5, y as f32 + 0.5);
                    // Barycentric weights (each edge function over the doubled area).
                    let wa = ((pb.0 - px) * (pc.1 - py) - (pb.1 - py) * (pc.0 - px)) / area;
                    let wb = ((pc.0 - px) * (pa.1 - py) - (pc.1 - py) * (pa.0 - px)) / area;
                    let wc = 1.0 - wa - wb;
                    if wa < 0.0 || wb < 0.0 || wc < 0.0 {
                        continue;
                    }
                    let at = |k: usize| wa * va[k] + wb * vb[k] + wc * vc[k];
                    let z = at(2);
                    let i = y * side + x;
                    if z <= depth[i] {
                        continue;
                    }
                    depth[i] = z;
                    let mut base = [at(6), at(7), at(8)];
                    if let Some(image) = &texels {
                        let (u, w) = (at(9).rem_euclid(1.0), at(10).rem_euclid(1.0));
                        let tx = ((u * image.width as f32) as u32).min(image.width - 1);
                        let ty = ((w * image.height as f32) as u32).min(image.height - 1);
                        let o = ((ty * image.width + tx) * 4) as usize;
                        for (k, b) in base.iter_mut().enumerate() {
                            *b *= image.rgba[o + k] as f32 / 255.0;
                        }
                    }
                    color[i] = shade(spec, *shine, light, [at(3), at(4), at(5)], base);
                }
            }
        }
    }

    // Down to the picture: straight (unpremultiplied) color over the covered samples, coverage as alpha.
    let n = spec.size as usize;
    let mut rgba = vec![0u8; n * n * 4];
    for y in 0..n {
        for x in 0..n {
            let (mut sum, mut covered) = ([0f32; 3], 0usize);
            for sy in 0..s {
                for sx in 0..s {
                    let i = (y * s + sy) * side + x * s + sx;
                    if depth[i] > f32::NEG_INFINITY {
                        for k in 0..3 {
                            sum[k] += color[i][k];
                        }
                        covered += 1;
                    }
                }
            }
            if covered == 0 {
                continue;
            }
            let o = (y * n + x) * 4;
            for k in 0..3 {
                rgba[o + k] = ((sum[k] / covered as f32).clamp(0.0, 1.0) * 255.0).round() as u8;
            }
            rgba[o + 3] = ((covered as f32 / (s * s) as f32) * 255.0).round() as u8;
        }
    }
    if let Some(key) = &spec.key {
        // Best effort: without a cache the picture is simply baked again next time.
        let _ = super::cache::write(&cache_key(key), &encode(spec.size, center, extent, &rgba));
    }
    let texture = texture::register(Image {
        source_size: None,
        width: spec.size,
        height: spec.size,
        rgba,
    })?;
    Ok(Baked { texture, center, extent })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bakes_a_lit_anti_aliased_picture_with_transparent_corners() {
        // A flat square facing +z, half red.
        let mut vertices = Vec::new();
        for (x, y) in [(-1.0f32, -1.0f32), (1.0, -1.0), (1.0, 1.0), (-1.0, 1.0)] {
            vertices.extend_from_slice(&[x, y, 0.0, 0.0, 0.0, 1.0, 1.0, 0.5, 0.25, 0.0, 0.0]);
        }
        let mesh = super::super::shape::create(&vertices, &[0, 1, 2, 0, 2, 3]).unwrap();
        let spec = BakeSpec {
            size: 16,
            supersample: 4,
            light: [0.0, 0.0, 1.0],
            ambient: 0.5,
            light_color: [1.0 / (0.5 * 0.8 + 0.5); 3],
            sky: [0.0; 3],
            shine: 0.0,
            padding: 0.25,
            parts: Vec::new(),
            frame: None,
            key: None,
        };
        let baked = bake(mesh, &spec).unwrap();
        assert_eq!(baked.center, [0.0, 0.0]);
        assert!((baked.extent - 1.5).abs() < 1e-6);
        let image = texture::get(baked.texture).unwrap();
        let px = |x: usize, y: usize| &image.rgba[(y * 16 + x) * 4..(y * 16 + x) * 4 + 4];
        // Facing the light with frontLight's compensation: exactly its own color, opaque.
        assert_eq!(px(8, 8), &[255, 128, 64, 255]);
        // Outside the square (the margin): transparent.
        assert_eq!(px(0, 0)[3], 0);
        // The square's edge falls mid-pixel at 16 * (1 - 1/1.5) / 2 = 2.67 px: partly covered.
        let edge = px(2, 8)[3];
        assert!(edge > 0 && edge < 255, "edge alpha {edge}");

        // Parts placed together, in a given frame: a second square scaled up and moved behind, tinted.
        let parts = BakeSpec {
            parts: vec![
                BakePart {
                    mesh: mesh as u32,
                    position: [0.0, 0.0, 0.0],
                    scale: [0.5, 0.5, 1.0],
                    color: [1.0, 1.0, 1.0],
                    shine: 0.0,
                },
                BakePart {
                    mesh: mesh as u32,
                    position: [0.0, 0.0, -1.0],
                    scale: [2.0, 2.0, 1.0],
                    color: [0.0, 1.0, 0.0],
                    shine: 0.0,
                },
            ],
            frame: Some([0.0, 0.0, 2.0]),
            ..spec.clone()
        };
        let baked = bake(mesh, &parts).unwrap();
        assert_eq!((baked.center, baked.extent), ([0.0, 0.0], 2.0));
        let image = texture::get(baked.texture).unwrap();
        let px = |x: usize, y: usize| &image.rgba[(y * 16 + x) * 4..(y * 16 + x) * 4 + 4];
        // The small square in front in the middle; the big green one around it, behind.
        assert_eq!(px(8, 8), &[255, 128, 64, 255]);
        assert_eq!(px(1, 8), &[0, 128, 0, 255]);
    }

    #[test]
    fn records_round_trip_and_reject_damage() {
        let rgba = vec![7u8; 2 * 2 * 4];
        let bytes = encode(2, [0.5, -1.0], 3.0, &rgba);
        assert_eq!(decode(&bytes), Some((2, [0.5, -1.0], 3.0, &rgba[..])));
        assert_eq!(decode(&bytes[..bytes.len() - 1]), None);
        assert_eq!(decode(b"NOPE"), None);
    }
}
