//! Game-facing access to a drawing: a live texture for world entities, stroke geometry for
//! colliders and tracing, and pixel queries for colouring and scratch-off scoring. Everything is in
//! document coordinates (the size the document was created with), independent of any canvas view.
use super::{Document, Rect, number};
use raqote::PathOp;
use serde_json::{Value, json};

/// Contours of a flattened path as flat [x0, y0, x1, y1, ...] arrays, with whether each is closed.
fn contours(path: &raqote::Path, tolerance: f32) -> Vec<(Vec<f32>, bool)> {
    let mut out = Vec::new();
    let mut current: Vec<f32> = Vec::new();
    let flush = |current: &mut Vec<f32>, closed: bool, out: &mut Vec<(Vec<f32>, bool)>| {
        if current.len() >= 4 {
            out.push((std::mem::take(current), closed));
        } else {
            current.clear();
        }
    };
    for op in path.flatten(tolerance).ops {
        match op {
            PathOp::MoveTo(p) => {
                flush(&mut current, false, &mut out);
                current.extend([p.x, p.y]);
            }
            PathOp::LineTo(p) => current.extend([p.x, p.y]),
            PathOp::Close => flush(&mut current, true, &mut out),
            _ => {}
        }
    }
    flush(&mut current, false, &mut out);
    out
}

fn round(v: f32) -> f32 {
    (v * 100.).round() / 100.
}

impl Document {
    /// The id of a dynamic texture that mirrors this document's pixels, created on first use.
    pub fn texture(&mut self) -> Result<u32, String> {
        if let Some(id) = self.texture {
            return Ok(id);
        }
        let id = crate::assets::texture::register_dynamic(self.raster.width, self.raster.height)?;
        self.texture = Some(id);
        self.raster.texture_dirty = Some(Rect {
            x: 0,
            y: 0,
            width: self.raster.width,
            height: self.raster.height,
        });
        self.texture_version = u64::MAX;
        self.sync_texture();
        Ok(id)
    }

    /// Copies changed pixels (including an in-progress stroke) into the bound texture as straight
    /// alpha. Cheap when nothing changed; the renderer uploads only the changed rows.
    pub fn sync_texture(&mut self) {
        let Some(id) = self.texture else { return };
        if self.texture_version == self.paint_version {
            return;
        }
        self.prepare_preview();
        self.texture_version = self.paint_version;
        let Some(rect) = self.raster.texture_dirty.take() else { return };
        let width = self.raster.width as usize;
        let pixels = &self.raster.pixels;
        crate::assets::texture::write_dynamic(id, [rect.x, rect.y, rect.width, rect.height], |row, out| {
            let start = (row as usize * width + rect.x as usize) * 4;
            out.copy_from_slice(&pixels[start..start + out.len()]);
            for p in out.as_chunks_mut::<4>().0 {
                let a = p[3] as u32;
                if a > 0 && a < 255 {
                    for c in &mut p[..3] {
                        *c = ((*c as u32 * 255 + a / 2) / a).min(255) as u8;
                    }
                }
            }
        });
    }

    /// Stroke geometry from index `from`, flattened to `tolerance` document units. `lines` are the
    /// smoothed gesture centrelines (brush strokes drawn this session); `outline` is the painted
    /// shape, which is the centreline itself for `style: "stroke"` paths. A stroke still under
    /// the finger is not reported (and is not finished early).
    pub fn strokes(&self, v: &Value) -> Value {
        let tolerance = number(v, "tolerance", 0.5).clamp(0.05, 20.);
        let from = v["from"].as_u64().unwrap_or(0) as usize;
        let strokes = self.paths.iter().enumerate().skip(from).map(|(index, s)| {
            let outline: Vec<(Vec<f32>, bool)> = contours(&s.path, tolerance);
            let (mut min, mut max) = ([f32::MAX; 2], [f32::MIN; 2]);
            for (points, _) in &outline {
                for p in points.as_chunks::<2>().0 {
                    for axis in 0..2 {
                        min[axis] = min[axis].min(p[axis]);
                        max[axis] = max[axis].max(p[axis]);
                    }
                }
            }
            let bounds = if min[0] <= max[0] {
                [round(min[0]), round(min[1]), round(max[0] - min[0]), round(max[1] - min[1])]
            } else {
                [0.; 4]
            };
            let lines: Vec<Vec<f32>> = s
                .centerline
                .iter()
                .filter(|line| line.len() > 1)
                .map(|line| line.iter().flat_map(|&[x, y]| [round(x), round(y)]).collect())
                .collect();
            json!({
                "index": index,
                "layerId": super::project::layer_id(s),
                "color": s.data.get("color").cloned().unwrap_or(json!("#000000")),
                "width": s.style(false).width,
                "opacity": s.opacity,
                "isEraser": s.erase,
                "brushType": s.brush,
                "style": if s.fill { "fill" } else { "stroke" },
                "bounds": bounds,
                "lines": lines,
                "outline": outline.into_iter().map(|(points, closed)| json!({
                    "points": points.into_iter().map(round).collect::<Vec<_>>(),
                    "closed": closed,
                })).collect::<Vec<_>>(),
            })
        });
        Value::Array(strokes.collect())
    }

    /// The composited colour under a document point, as straight-alpha `#rrggbb` + alpha, or null
    /// off the paper. Transparent paper reports alpha 0.
    pub fn sample(&mut self, x: f32, y: f32) -> Value {
        self.prepare_preview();
        let Some(i) = self.raster.offset(x, y) else { return Value::Null };
        let p = &self.raster.pixels[i..i + 4];
        let a = p[3] as u32;
        let rgb = [0, 1, 2].map(|c| (p[c] as u32 * 255 + a / 2).checked_div(a).map_or(0, |v| v.min(255)));
        json!({"color": format!("#{:02x}{:02x}{:02x}", rgb[0], rgb[1], rgb[2]), "alpha": round(a as f32 / 255.)})
    }

    /// Fraction (0..1) of pixels in a document rectangle (default: the whole paper) whose ink alpha
    /// reaches `minAlpha`. Use it to score colouring, scratch-off and fill-the-area games.
    pub fn coverage(&mut self, v: &Value) -> f32 {
        self.prepare_preview();
        let r = self.raster.ratio;
        let x0 = (number(v, "x", 0.) * r).floor().clamp(0., self.raster.width as f32) as u32;
        let y0 = (number(v, "y", 0.) * r).floor().clamp(0., self.raster.height as f32) as u32;
        let x1 = ((number(v, "x", 0.) + number(v, "width", self.width)) * r)
            .ceil()
            .clamp(0., self.raster.width as f32) as u32;
        let y1 = ((number(v, "y", 0.) + number(v, "height", self.height)) * r)
            .ceil()
            .clamp(0., self.raster.height as f32) as u32;
        if x1 <= x0 || y1 <= y0 {
            return 0.;
        }
        let threshold = (number(v, "minAlpha", 0.5).clamp(0., 1.) * 255.).round().max(1.) as u8;
        let mut inked = 0u64;
        for y in y0..y1 {
            let start = ((y * self.raster.width + x0) * 4) as usize;
            let end = ((y * self.raster.width + x1) * 4) as usize;
            inked += self.raster.pixels[start..end]
                .as_chunks::<4>()
                .0
                .iter()
                .filter(|p| p[3] >= threshold)
                .count() as u64;
        }
        inked as f32 / ((x1 - x0) as u64 * (y1 - y0) as u64) as f32
    }
}

impl Drop for Document {
    fn drop(&mut self) {
        if let Some(id) = self.texture.take() {
            crate::assets::texture::release_dynamic(id);
        }
    }
}
