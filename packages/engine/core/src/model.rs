//! 3D models: glTF 2.0 (`.glb`, or `.gltf` with embedded data) merged into a single mesh.
//!
//! Every triangle primitive in the default scene is flattened into one vertex/index buffer with the
//! node transforms baked in and the material's base color (times any vertex colors) stored per
//! vertex. One model = one mesh id, so any number of copies draw in one instanced call.
//! Not supported yet: textures (base color factor only), skinning/morph targets, Draco meshes.

use base64::Engine;
use gltf::buffer::Source;
use gltf::mesh::Mode;
use rapier3d::glamx::{Mat3, Mat4, Vec3};
use std::sync::{Arc, Mutex};

/// Mesh ids 0..3 are the renderer's built-in primitives (cube, sphere, plane).
pub const FIRST_MODEL_MESH: u8 = 3;
/// Floats per vertex: position (3), normal (3), color (3).
pub const VERTEX_FLOATS: usize = 9;

/// A merged, render-ready model.
pub struct Model {
    /// `VERTEX_FLOATS` floats per vertex.
    pub vertices: Vec<f32>,
    /// Triangle list, counter-clockwise front faces.
    pub indices: Vec<u32>,
    /// Half the size of the bounding box (after centering / fitting).
    pub half_extents: Vec3,
}

#[derive(Clone, Copy, Debug)]
pub struct LoadOptions {
    /// Move the model so its bounding box is centred on the origin (colliders then fit).
    pub center: bool,
    /// Scale uniformly so the largest dimension equals this; <= 0 keeps the file's units.
    pub fit: f32,
}

impl Default for LoadOptions {
    fn default() -> Self {
        Self { center: true, fit: 0.0 }
    }
}

/// Parses and merges a glTF/GLB file.
pub fn parse(bytes: &[u8], options: LoadOptions) -> Result<Model, String> {
    let gltf = gltf::Gltf::from_slice(bytes).map_err(|e| format!("not a valid glTF file: {e}"))?;
    let buffers = gltf
        .document
        .buffers()
        .map(|buffer| match buffer.source() {
            Source::Bin => gltf.blob.clone().ok_or_else(|| "the GLB has no binary chunk".to_string()),
            Source::Uri(uri) => {
                decode_data_uri(uri).ok_or_else(|| format!("external buffer \"{uri}\" isn't supported: export as .glb or embed the data"))
            }
        })
        .collect::<Result<Vec<_>, _>>()?;

    let scene = gltf
        .document
        .default_scene()
        .or_else(|| gltf.document.scenes().next())
        .ok_or("the file has no scene")?;

    let mut builder = Builder::default();
    for node in scene.nodes() {
        builder.visit(&node, Mat4::IDENTITY, &buffers)?;
    }
    if builder.indices.is_empty() {
        return Err("no triangle meshes found (compressed or point/line-only meshes aren't supported)".into());
    }
    Ok(builder.finish(options))
}

#[derive(Default)]
struct Builder {
    positions: Vec<Vec3>,
    normals: Vec<Vec3>,
    colors: Vec<[f32; 3]>,
    indices: Vec<u32>,
}

impl Builder {
    fn visit(&mut self, node: &gltf::Node, parent: Mat4, buffers: &[Vec<u8>]) -> Result<(), String> {
        let transform = parent * Mat4::from_cols_array_2d(&node.transform().matrix());
        if let Some(mesh) = node.mesh() {
            for primitive in mesh.primitives() {
                if primitive.mode() == Mode::Triangles {
                    self.add_primitive(&primitive, transform, buffers)?;
                }
            }
        }
        for child in node.children() {
            self.visit(&child, transform, buffers)?;
        }
        Ok(())
    }

    fn add_primitive(&mut self, primitive: &gltf::Primitive, transform: Mat4, buffers: &[Vec<u8>]) -> Result<(), String> {
        let reader = primitive.reader(|buffer| buffers.get(buffer.index()).map(|data| data.as_slice()));
        let Some(positions) = reader.read_positions() else { return Ok(()) };
        let positions: Vec<Vec3> = positions.map(Vec3::from_array).collect();
        let count = positions.len() as u32;
        let mut indices: Vec<u32> = match reader.read_indices() {
            Some(indices) => indices.into_u32().collect(),
            None => (0..count).collect(),
        };
        if !indices.len().is_multiple_of(3) || indices.iter().any(|&i| i >= count) {
            return Err("a mesh has invalid triangle indices".into());
        }

        let normals: Vec<Vec3> = match reader.read_normals() {
            Some(normals) => normals.map(Vec3::from_array).collect(),
            None => smooth_normals(&positions, &indices),
        };
        let base = primitive.material().pbr_metallic_roughness().base_color_factor();
        let colors: Vec<[f32; 3]> = match reader.read_colors(0) {
            Some(colors) => colors.into_rgba_f32().map(|c| [c[0] * base[0], c[1] * base[1], c[2] * base[2]]).collect(),
            None => vec![[base[0], base[1], base[2]]; positions.len()],
        };

        // Normals use the inverse-transpose; a mirroring transform flips winding, so swap it back.
        let normal_matrix = Mat3::from_mat4(transform).inverse().transpose();
        if Mat3::from_mat4(transform).determinant() < 0.0 {
            for triangle in indices.as_chunks_mut::<3>().0 {
                triangle.swap(1, 2);
            }
        }

        let offset = self.positions.len() as u32;
        self.positions.extend(positions.iter().map(|&p| transform.transform_point3(p)));
        self.normals.extend(normals.iter().map(|&n| (normal_matrix * n).normalize_or(Vec3::Y)));
        self.colors.extend(colors);
        self.indices.extend(indices.iter().map(|&i| i + offset));
        Ok(())
    }

    fn finish(self, options: LoadOptions) -> Model {
        let (min, max) = self
            .positions
            .iter()
            .fold((Vec3::splat(f32::MAX), Vec3::splat(f32::MIN)), |(lo, hi), &p| (lo.min(p), hi.max(p)));
        let center = if options.center { (min + max) / 2.0 } else { Vec3::ZERO };
        let size = max - min;
        let scale = if options.fit > 0.0 && size.max_element() > 0.0 {
            options.fit / size.max_element()
        } else {
            1.0
        };

        let mut vertices = Vec::with_capacity(self.positions.len() * VERTEX_FLOATS);
        for ((p, n), c) in self.positions.iter().zip(&self.normals).zip(&self.colors) {
            let p = (*p - center) * scale;
            vertices.extend_from_slice(&[p.x, p.y, p.z, n.x, n.y, n.z, c[0], c[1], c[2]]);
        }
        Model {
            vertices,
            indices: self.indices,
            half_extents: size * scale / 2.0,
        }
    }
}

/// Area-weighted vertex normals, for meshes exported without them.
fn smooth_normals(positions: &[Vec3], indices: &[u32]) -> Vec<Vec3> {
    let mut normals = vec![Vec3::ZERO; positions.len()];
    for &[a, b, c] in indices.as_chunks::<3>().0 {
        let [a, b, c] = [a as usize, b as usize, c as usize];
        let face = (positions[b] - positions[a]).cross(positions[c] - positions[a]);
        normals[a] += face;
        normals[b] += face;
        normals[c] += face;
    }
    normals.iter().map(|n| n.normalize_or(Vec3::Y)).collect()
}

fn decode_data_uri(uri: &str) -> Option<Vec<u8>> {
    let data = uri.strip_prefix("data:")?.split_once(";base64,")?.1;
    base64::engine::general_purpose::STANDARD.decode(data).ok()
}

// ── Registry ─────────────────────────────────────────────────────────────

static MODELS: Mutex<Vec<Arc<Model>>> = Mutex::new(Vec::new());
static LAST_ERROR: Mutex<String> = Mutex::new(String::new());

/// Why the last `load` failed (empty after a success).
pub fn last_error() -> String {
    LAST_ERROR.lock().map(|e| e.clone()).unwrap_or_default()
}

/// Parses a model and registers it. Returns its mesh id, or an error message.
/// Models live for the whole process, so pointers into them stay valid.
pub fn load(bytes: &[u8], options: LoadOptions) -> Result<u8, String> {
    let result = load_inner(bytes, options);
    if let Ok(mut error) = LAST_ERROR.lock() {
        *error = result.as_ref().err().cloned().unwrap_or_default();
    }
    result
}

fn load_inner(bytes: &[u8], options: LoadOptions) -> Result<u8, String> {
    let model = parse(bytes, options)?;
    let mut models = MODELS.lock().map_err(|_| "model registry unavailable".to_string())?;
    let id = FIRST_MODEL_MESH as usize + models.len();
    if id >= crate::MAX_MESHES {
        return Err(format!("too many models (at most {})", crate::MAX_MESHES - FIRST_MODEL_MESH as usize));
    }
    models.push(Arc::new(model));
    Ok(id as u8)
}

/// The model registered under a mesh id.
pub fn get(mesh: u8) -> Option<Arc<Model>> {
    let index = (mesh as usize).checked_sub(FIRST_MODEL_MESH as usize)?;
    MODELS.lock().ok()?.get(index).cloned()
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;

    /// Builds a GLB with one material-colored triangle per node, at each node's translation/scale.
    pub fn glb(nodes: &[([f32; 3], f32, [f32; 4])]) -> Vec<u8> {
        let mut bin: Vec<u8> = Vec::new();
        for v in [[0.0f32, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0]] {
            for c in v {
                bin.extend_from_slice(&c.to_le_bytes());
            }
        }
        for i in [0u16, 1, 2, 0] {
            bin.extend_from_slice(&i.to_le_bytes()); // 3 indices + padding
        }
        let materials: Vec<String> = nodes
            .iter()
            .map(|(_, _, c)| {
                format!(
                    r#"{{"pbrMetallicRoughness":{{"baseColorFactor":[{},{},{},{}]}}}}"#,
                    c[0], c[1], c[2], c[3]
                )
            })
            .collect();
        let meshes: Vec<String> = (0..nodes.len())
            .map(|i| format!(r#"{{"primitives":[{{"attributes":{{"POSITION":0}},"indices":1,"material":{i}}}]}}"#))
            .collect();
        let gltf_nodes: Vec<String> = nodes
            .iter()
            .enumerate()
            .map(|(i, (t, s, _))| format!(r#"{{"mesh":{i},"translation":[{},{},{}],"scale":[{s},{s},{s}]}}"#, t[0], t[1], t[2]))
            .collect();
        let json = format!(
            r#"{{"asset":{{"version":"2.0"}},"scene":0,"scenes":[{{"nodes":[{}]}}],"nodes":[{}],"meshes":[{}],"materials":[{}],
            "buffers":[{{"byteLength":{}}}],
            "bufferViews":[{{"buffer":0,"byteOffset":0,"byteLength":36}},{{"buffer":0,"byteOffset":36,"byteLength":6}}],
            "accessors":[{{"bufferView":0,"componentType":5126,"count":3,"type":"VEC3","min":[0,0,0],"max":[1,1,0]}},
                         {{"bufferView":1,"componentType":5123,"count":3,"type":"SCALAR"}}]}}"#,
            (0..nodes.len()).map(|i| i.to_string()).collect::<Vec<_>>().join(","),
            gltf_nodes.join(","),
            meshes.join(","),
            materials.join(","),
            bin.len()
        );
        let mut json = json.into_bytes();
        while json.len() % 4 != 0 {
            json.push(b' ');
        }
        let total = 12 + 8 + json.len() + 8 + bin.len();
        let mut out = Vec::new();
        out.extend_from_slice(b"glTF");
        out.extend_from_slice(&2u32.to_le_bytes());
        out.extend_from_slice(&(total as u32).to_le_bytes());
        out.extend_from_slice(&(json.len() as u32).to_le_bytes());
        out.extend_from_slice(b"JSON");
        out.extend_from_slice(&json);
        out.extend_from_slice(&(bin.len() as u32).to_le_bytes());
        out.extend_from_slice(b"BIN\0");
        out.extend_from_slice(&bin);
        out
    }

    fn vertex(m: &Model, i: usize) -> &[f32] {
        &m.vertices[i * VERTEX_FLOATS..(i + 1) * VERTEX_FLOATS]
    }

    #[test]
    fn merges_nodes_with_transforms_and_material_colors() {
        let bytes = glb(&[
            ([0.0, 0.0, 0.0], 1.0, [1.0, 0.0, 0.0, 1.0]),
            ([10.0, 0.0, 0.0], 2.0, [0.0, 0.5, 1.0, 1.0]),
        ]);
        let m = parse(&bytes, LoadOptions { center: false, fit: 0.0 }).unwrap();
        assert_eq!(m.vertices.len(), 6 * VERTEX_FLOATS, "two triangles merged");
        assert_eq!(m.indices, vec![0, 1, 2, 3, 4, 5]);
        assert_eq!(&vertex(&m, 1)[0..3], &[1.0, 0.0, 0.0]);
        assert_eq!(&vertex(&m, 4)[0..3], &[12.0, 0.0, 0.0], "translated 10 and scaled 2");
        assert_eq!(&vertex(&m, 0)[6..9], &[1.0, 0.0, 0.0], "first material is red");
        assert_eq!(&vertex(&m, 3)[6..9], &[0.0, 0.5, 1.0]);
        assert!((vertex(&m, 0)[5] - 1.0).abs() < 1e-5, "computed normal faces +Z");
        assert_eq!(m.half_extents, Vec3::new(6.0, 1.0, 0.0), "bounds x 0..12, y 0..2");
    }

    #[test]
    fn centers_and_fits() {
        let bytes = glb(&[([0.0, 0.0, 0.0], 1.0, [1.0; 4]), ([3.0, 0.0, 0.0], 1.0, [1.0; 4])]); // x 0..4
        let m = parse(&bytes, LoadOptions { center: true, fit: 2.0 }).unwrap();
        assert_eq!(&vertex(&m, 0)[0..3], &[-1.0, -0.25, 0.0], "centred, then scaled by 2/4");
        assert_eq!(m.half_extents, Vec3::new(1.0, 0.25, 0.0));
    }

    #[test]
    fn mirrored_transforms_keep_front_faces() {
        let bytes = glb(&[([0.0, 0.0, 0.0], -1.0, [1.0; 4])]);
        let m = parse(&bytes, LoadOptions::default()).unwrap();
        assert_eq!(m.indices, vec![0, 2, 1], "winding flipped back");
    }

    #[test]
    fn embedded_gltf_and_errors() {
        // The same document as .gltf JSON with the buffer in a data URI.
        let glb = glb(&[([0.0, 0.0, 0.0], 1.0, [1.0; 4])]);
        let json_len = u32::from_le_bytes(glb[12..16].try_into().unwrap()) as usize;
        let json = std::str::from_utf8(&glb[20..20 + json_len]).unwrap().trim_end();
        let bin = &glb[20 + json_len + 8..];
        let uri = format!(
            "data:application/octet-stream;base64,{}",
            base64::engine::general_purpose::STANDARD.encode(bin)
        );
        let embedded = json.replacen(r#""buffers":[{"#, &format!(r#""buffers":[{{"uri":"{uri}","#), 1);
        assert!(parse(embedded.as_bytes(), LoadOptions::default()).is_ok());

        let external = json.replacen(r#""buffers":[{"#, r#""buffers":[{"uri":"model.bin","#, 1);
        let err = parse(external.as_bytes(), LoadOptions::default()).err().unwrap();
        assert!(err.contains("isn't supported"), "{err}");
        assert!(parse(b"not a model", LoadOptions::default()).is_err());
    }

    #[test]
    fn registry_hands_out_mesh_ids() {
        let id = load(&glb(&[([0.0, 0.0, 0.0], 1.0, [1.0; 4])]), LoadOptions::default()).unwrap();
        assert!(id >= FIRST_MODEL_MESH);
        assert_eq!(get(id).unwrap().indices.len(), 3);
        assert!(get(0).is_none(), "built-in meshes aren't models");
    }
}
