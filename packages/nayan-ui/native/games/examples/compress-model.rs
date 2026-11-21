//! Offline GLB packing, preserving vertex order for applications that retain surface vertex IDs.
//! cargo run --release --example compress-model -- input.glb output.glb [float-bits=20]
//! No simplification, resampling, node removal or animation timing changes. Float precision is
//! bounded by the exponential filter; normals use 16 bits, UVs/weights normalized 16-bit storage.
use meshopt::ffi;
use serde_json::{Value, json};
use std::{collections::HashMap, env, fs};

const EXT: &str = "EXT_meshopt_compression";

#[derive(Clone, Copy)]
enum Kind {
    Exact,
    VertexExact,
    Position,
    Float,
    Normal,
    Joints,
    Unit,
    Rotation,
    Indices,
}

struct Group {
    mode: &'static str,
    filter: &'static str,
    stride: usize,
    vertex: bool,
    bytes: Vec<u8>,
}

struct Packer<'a> {
    original: &'a Value,
    binary: &'a [u8],
    accessors: Vec<Value>,
    views: Vec<Value>,
    encoded: Vec<u8>,
    decoded_length: usize,
    cache: HashMap<Vec<u8>, usize>,
    groups: Vec<Group>,
    bits: i32,
}

fn number(value: &Value) -> usize {
    value.as_u64().expect("expected a nonnegative integer") as usize
}

fn components(accessor: &Value) -> usize {
    match accessor["type"].as_str().unwrap() {
        "SCALAR" => 1,
        "VEC2" => 2,
        "VEC3" => 3,
        "VEC4" => 4,
        "MAT4" => 16,
        _ => panic!("unsupported accessor type"),
    }
}

fn component_size(accessor: &Value) -> usize {
    match number(&accessor["componentType"]) {
        5120 | 5121 => 1,
        5122 | 5123 => 2,
        5125 | 5126 => 4,
        _ => panic!("unsupported component type"),
    }
}

fn floats(bytes: &[u8]) -> Vec<f32> {
    bytes.chunks_exact(4).map(|b| f32::from_le_bytes(b.try_into().unwrap())).collect()
}

impl Packer<'_> {
    fn data(&self, id: usize) -> (Value, Vec<u8>) {
        let accessor = self.original["accessors"][id].clone();
        assert!(accessor.get("sparse").is_none(), "sparse accessors aren't supported by this packer");
        let view = &self.original["bufferViews"][number(&accessor["bufferView"])];
        assert_eq!(number(&view["buffer"]), 0, "the packer expects a single embedded buffer");
        let size = components(&accessor) * component_size(&accessor);
        let offset = view["byteOffset"].as_u64().unwrap_or(0) as usize + accessor["byteOffset"].as_u64().unwrap_or(0) as usize;
        let stride = view["byteStride"].as_u64().map_or(size, |n| n as usize);
        let mut bytes = Vec::with_capacity(size * number(&accessor["count"]));
        for i in 0..number(&accessor["count"]) {
            bytes.extend_from_slice(&self.binary[offset + i * stride..offset + i * stride + size]);
        }
        (accessor, bytes)
    }

    fn accessor(&mut self, id: usize, kind: Kind) -> usize {
        let (accessor, bytes) = self.data(id);
        self.add(accessor, bytes, kind)
    }

    fn add(&mut self, mut accessor: Value, mut bytes: Vec<u8>, kind: Kind) -> usize {
        for field in ["bufferView", "byteOffset"] {
            accessor.as_object_mut().unwrap().remove(field);
        }
        let count = number(&accessor["count"]);
        let mut filter = "NONE";
        let mode = if matches!(kind, Kind::Indices) { "TRIANGLES" } else { "ATTRIBUTES" };
        match kind {
            Kind::Rotation if accessor["componentType"] == 5126 => {
                let rotations: Vec<[f32; 4]> = floats(&bytes).chunks_exact(4).map(|v| v.try_into().unwrap()).collect();
                let encoded = meshopt::encode_filter_quat(&rotations, 16);
                bytes = encoded.into_iter().flatten().flat_map(i16::to_le_bytes).collect();
                accessor["componentType"] = json!(5122);
                accessor["normalized"] = json!(true);
                filter = "QUATERNION";
            }
            Kind::Joints if accessor["componentType"] == 5123 => {
                let joints: Vec<u16> = bytes.chunks_exact(2).map(|b| u16::from_le_bytes(b.try_into().unwrap())).collect();
                if joints.iter().all(|j| *j <= 255) {
                    bytes = joints.into_iter().map(|j| j as u8).collect();
                    accessor["componentType"] = json!(5121);
                }
            }
            Kind::Unit if accessor["componentType"] == 5126 => {
                let values = floats(&bytes);
                assert!(
                    values.iter().all(|v| v.is_finite() && (0.0..=1.0).contains(v)),
                    "UV/weight outside normalized range"
                );
                bytes = values.into_iter().flat_map(|v| ((v * 65535.0).round() as u16).to_le_bytes()).collect();
                accessor["componentType"] = json!(5123);
                accessor["normalized"] = json!(true);
            }
            Kind::Indices => {
                let values: Vec<u32> = bytes
                    .chunks_exact(component_size(&accessor))
                    .map(|b| match component_size(&accessor) {
                        1 => b[0] as u32,
                        2 => u16::from_le_bytes(b.try_into().unwrap()) as u32,
                        _ => u32::from_le_bytes(b.try_into().unwrap()),
                    })
                    .collect();
                let vertices = values.iter().copied().max().unwrap() as usize + 1;
                let values = meshopt::optimize_vertex_cache(&values, vertices);
                if vertices <= 65536 {
                    bytes = values.into_iter().flat_map(|v| (v as u16).to_le_bytes()).collect();
                    accessor["componentType"] = json!(5123);
                } else {
                    bytes = values.into_iter().flat_map(u32::to_le_bytes).collect();
                    accessor["componentType"] = json!(5125);
                }
            }
            Kind::Position | Kind::Float | Kind::Normal if accessor["componentType"] == 5126 => {
                let values = floats(&bytes);
                assert!(values.iter().all(|v| v.is_finite()));
                let mut encoded = vec![0u32; values.len()];
                // Shared exponents make adjacent floats easier to compress. No transform is
                // introduced, so the original hierarchy and inverse bind matrices stay intact.
                unsafe {
                    ffi::meshopt_encodeFilterExp(
                        encoded.as_mut_ptr().cast(),
                        count,
                        components(&accessor) * 4,
                        if matches!(kind, Kind::Normal) { 16 } else { self.bits },
                        values.as_ptr(),
                        meshopt::EncodeExpMode::SharedComponent as _,
                    );
                }
                // Recompute POSITION bounds from the actual decoded values, as glTF requires.
                if accessor.get("min").is_some() || accessor.get("max").is_some() {
                    let mut decoded = encoded.clone();
                    unsafe { ffi::meshopt_decodeFilterExp(decoded.as_mut_ptr().cast(), count, components(&accessor) * 4) };
                    let n = components(&accessor);
                    let mut min = vec![f32::INFINITY; n];
                    let mut max = vec![f32::NEG_INFINITY; n];
                    for (i, value) in decoded.iter().map(|v| f32::from_bits(*v)).enumerate() {
                        min[i % n] = min[i % n].min(value);
                        max[i % n] = max[i % n].max(value);
                    }
                    accessor["min"] = json!(min);
                    accessor["max"] = json!(max);
                }
                bytes = encoded.into_iter().flat_map(u32::to_le_bytes).collect();
                filter = "EXPONENTIAL";
            }
            _ => {}
        }
        let stride = components(&accessor) * component_size(&accessor);
        assert_eq!(bytes.len(), count * stride);
        // Include metadata and interpretation so identical bytes with different types/filters
        // cannot accidentally alias. Shared time arrays and constant tracks are stored once.
        let vertex = matches!(kind, Kind::Position | Kind::Normal | Kind::Joints | Kind::Unit | Kind::VertexExact);
        let mut key = serde_json::to_vec(&json!([accessor, mode, filter, vertex])).unwrap();
        key.extend_from_slice(&bytes);
        if let Some(id) = self.cache.get(&key) {
            return *id;
        }
        let group = self
            .groups
            .iter()
            .position(|g| g.mode == mode && g.filter == filter && g.stride == stride && g.vertex == vertex)
            .unwrap_or_else(|| {
                self.groups.push(Group {
                    mode,
                    filter,
                    stride,
                    vertex,
                    bytes: Vec::new(),
                });
                self.groups.len() - 1
            });
        accessor["bufferView"] = json!(group);
        accessor["byteOffset"] = json!(self.groups[group].bytes.len());
        self.groups[group].bytes.extend(bytes);
        let id = self.accessors.len();
        self.accessors.push(accessor);
        self.cache.insert(key, id);
        id
    }

    fn finish(&mut self) {
        // One stream per storage layout, rather than hundreds of tiny animation streams. Accessor
        // offsets retain sharing while avoiding per-stream headers, tails and JSON overhead.
        for group in &self.groups {
            let Group {
                mode,
                filter,
                stride,
                bytes,
                vertex,
            } = group;
            let (mode, filter, stride) = (*mode, *filter, *stride);
            let count = bytes.len() / stride;
            let encoded = if mode == "TRIANGLES" {
                let indices: Vec<u32> = bytes
                    .chunks_exact(stride)
                    .map(|b| match stride {
                        2 => u16::from_le_bytes(b.try_into().unwrap()) as u32,
                        4 => u32::from_le_bytes(b.try_into().unwrap()),
                        _ => panic!("indices must be 16 or 32 bits"),
                    })
                    .collect();
                meshopt::encode_index_buffer(&indices, indices.iter().copied().max().unwrap() as usize + 1).unwrap()
            } else {
                assert!(stride.is_multiple_of(4) && stride <= 256, "unsupported attribute stride");
                let bound = unsafe { ffi::meshopt_encodeVertexBufferBound(count, stride) };
                let mut result = vec![0; bound];
                let size = unsafe { ffi::meshopt_encodeVertexBufferLevel(result.as_mut_ptr(), bound, bytes.as_ptr().cast(), count, stride, 3, 0) };
                assert!(size > 0);
                result.truncate(size);
                result
            };
            while !self.encoded.len().is_multiple_of(4) {
                self.encoded.push(0);
            }
            self.decoded_length = self.decoded_length.next_multiple_of(4);
            self.views.push(json!({
                "buffer": 1, "byteOffset": self.decoded_length, "byteLength": bytes.len(),
                "extensions": { EXT: {
                    "buffer": 0, "byteOffset": self.encoded.len(), "byteLength": encoded.len(),
                    "byteStride": stride, "count": count, "mode": mode, "filter": filter
                }}
            }));
            if *vertex {
                let view = self.views.last_mut().unwrap();
                view["byteStride"] = json!(stride);
                view["target"] = json!(34962);
            } else if mode == "TRIANGLES" {
                self.views.last_mut().unwrap()["target"] = json!(34963);
            }
            self.encoded.extend(encoded);
            self.decoded_length += bytes.len();
        }
    }
}

fn compress(source: &[u8], bits: i32) -> Vec<u8> {
    assert_eq!(&source[..8], b"glTF\x02\0\0\0");
    let json_length = u32::from_le_bytes(source[12..16].try_into().unwrap()) as usize;
    let original: Value = serde_json::from_slice(&source[20..20 + json_length]).unwrap();
    assert!(original.get("extensionsRequired").is_none(), "compress the original uncompressed GLB");
    assert_eq!(original["buffers"].as_array().unwrap().len(), 1);
    assert!((16..=24).contains(&bits));
    let mut pack = Packer {
        original: &original,
        binary: &source[28 + json_length..],
        accessors: Vec::new(),
        views: Vec::new(),
        encoded: Vec::new(),
        decoded_length: 0,
        cache: HashMap::new(),
        groups: Vec::new(),
        bits,
    };
    let mut doc = original.clone();
    for mesh in doc["meshes"].as_array_mut().unwrap() {
        for primitive in mesh["primitives"].as_array_mut().unwrap() {
            assert_eq!(primitive["mode"].as_u64().unwrap_or(4), 4, "the packer expects triangle lists");
            assert!(primitive.get("targets").is_none(), "morph targets aren't supported by this packer");
            let attributes = primitive["attributes"].as_object_mut().unwrap();
            if attributes.get("COLOR_0").is_some_and(|id| {
                let (a, data) = pack.data(number(id));
                a["componentType"] == 5126 && floats(&data).iter().all(|v| *v == 1.0)
            }) {
                attributes.remove("COLOR_0");
            }
            for (name, id) in attributes {
                let kind = match name.as_str() {
                    "POSITION" => Kind::Position,
                    "NORMAL" => Kind::Normal,
                    "JOINTS_0" => Kind::Joints,
                    "WEIGHTS_0" | "TEXCOORD_0" => Kind::Unit,
                    _ => Kind::VertexExact,
                };
                *id = json!(pack.accessor(number(id), kind));
            }
            primitive["indices"] = json!(pack.accessor(number(&primitive["indices"]), Kind::Indices));
        }
    }
    for skin in doc["skins"].as_array_mut().into_iter().flatten() {
        skin["inverseBindMatrices"] = json!(pack.accessor(number(&skin["inverseBindMatrices"]), Kind::Exact));
    }
    let mut constants = 0;
    let mut omitted = 0;
    for animation in doc["animations"].as_array_mut().into_iter().flatten() {
        let old_samplers = animation["samplers"].as_array().unwrap().clone();
        let mut channels = Vec::new();
        let mut samplers = Vec::new();
        let original_channels = animation["channels"].as_array().unwrap().clone();
        let channel_count = original_channels.len();
        // A long constant rest track can be the only source of a clip's duration. Protect one
        // longest track so pruning cannot shorten the clip, including entirely static clips.
        let longest = original_channels
            .iter()
            .enumerate()
            .map(|(i, c)| {
                let sampler = &old_samplers[number(&c["sampler"])];
                let (_, times) = pack.data(number(&sampler["input"]));
                (i, f32::from_le_bytes(times[times.len() - 4..].try_into().unwrap()))
            })
            .max_by(|a, b| a.1.total_cmp(&b.1))
            .unwrap()
            .0;
        for (channel_index, mut channel) in original_channels.into_iter().enumerate() {
            let mut sampler = old_samplers[number(&channel["sampler"])].clone();
            let (mut input, mut times) = pack.data(number(&sampler["input"]));
            let (mut output, mut values) = pack.data(number(&sampler["output"]));
            let stride = components(&output) * component_size(&output);
            let linear = sampler["interpolation"].as_str().unwrap_or("LINEAR") == "LINEAR";
            let constant = linear && input["count"] == output["count"] && values.chunks_exact(stride).all(|v| v == &values[..stride]);
            if constant {
                let node = &original["nodes"][number(&channel["target"]["node"])];
                let path = channel["target"]["path"].as_str().unwrap();
                let rest = node.get(path).cloned().unwrap_or_else(|| match path {
                    "rotation" => json!([0, 0, 0, 1]),
                    "scale" => json!([1, 1, 1]),
                    _ => json!([0, 0, 0]),
                });
                // Only omit exact rest values, and retain at least one channel per clip. Preserve
                // clips' original durations by keeping the final key on all retained tracks.
                if node.get("matrix").is_none()
                    && channel_index != longest
                    && rest
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|v| v.as_f64().unwrap() as f32)
                        .eq(floats(&values[..stride]))
                    && (channel_index + 1 < channel_count || !channels.is_empty())
                {
                    omitted += 1;
                    continue;
                }
                if number(&input["count"]) > 2 {
                    let last = times[times.len() - 4..].to_vec();
                    times.truncate(4);
                    times.extend(last);
                    values.truncate(stride);
                    values.extend_from_within(..);
                    input["count"] = json!(2);
                    output["count"] = json!(2);
                    constants += 1;
                }
            }
            sampler["input"] = json!(pack.add(input, times, Kind::Exact));
            let kind = if linear && channel["target"]["path"] == "rotation" {
                Kind::Rotation
            } else if linear {
                Kind::Float
            } else {
                Kind::Exact
            };
            sampler["output"] = json!(pack.add(output, values, kind));
            channel["sampler"] = json!(samplers.len());
            channels.push(channel);
            samplers.push(sampler);
        }
        animation["channels"] = json!(channels);
        animation["samplers"] = json!(samplers);
    }
    pack.finish();
    // Images are already encoded PNG/JPEG streams, not vertex data. Keep them verbatim in the
    // stored buffer, outside the placeholder containing decoded geometry and animation views.
    for image in doc["images"].as_array_mut().into_iter().flatten() {
        if let Some(id) = image.get("bufferView") {
            let view = &original["bufferViews"][number(id)];
            assert_eq!(number(&view["buffer"]), 0, "image must use the embedded buffer");
            let offset = view["byteOffset"].as_u64().unwrap_or(0) as usize;
            let length = number(&view["byteLength"]);
            while !pack.encoded.len().is_multiple_of(4) {
                pack.encoded.push(0);
            }
            image["bufferView"] = json!(pack.views.len());
            pack.views.push(json!({"buffer":0,"byteOffset":pack.encoded.len(),"byteLength":length}));
            pack.encoded.extend_from_slice(&pack.binary[offset..offset + length]);
        }
    }
    doc["accessors"] = json!(pack.accessors);
    doc["bufferViews"] = json!(pack.views);
    doc["buffers"] = json!([
        { "byteLength": pack.encoded.len() },
        { "byteLength": pack.decoded_length, "extensions": { EXT: { "fallback": true } } }
    ]);
    doc["extensionsUsed"] = json!([EXT]);
    doc["extensionsRequired"] = json!([EXT]);
    let mut text = serde_json::to_vec(&doc).unwrap();
    while !text.len().is_multiple_of(4) {
        text.push(b' ');
    }
    while !pack.encoded.len().is_multiple_of(4) {
        pack.encoded.push(0);
    }
    let mut result = Vec::new();
    for value in [
        0x46546c67u32,
        2,
        (28 + text.len() + pack.encoded.len()) as u32,
        text.len() as u32,
        0x4e4f534a,
    ] {
        result.extend(value.to_le_bytes());
    }
    result.extend(text);
    result.extend((pack.encoded.len() as u32).to_le_bytes());
    result.extend(0x004e4942u32.to_le_bytes());
    result.extend(pack.encoded);
    // Use the actual production loader as the final format check before replacing any asset.
    let model = engine_core::assets::model::parse(&result, Default::default()).expect("compressed GLB must load natively");
    let original_model = engine_core::assets::model::parse(source, Default::default()).expect("original GLB must load natively");
    if let Some(rig) = original_model.skeleton {
        let packed_rig = model.skeleton.unwrap();
        assert!(
            rig.clips
                .iter()
                .map(|c| (&c.name, c.duration))
                .eq(packed_rig.clips.iter().map(|c| (&c.name, c.duration))),
            "clip timing changed"
        );
    }
    println!(
        "{} -> {} bytes ({:.1}% smaller); {omitted} rest tracks omitted, {constants} constant tracks reduced; {bits}-bit floats",
        source.len(),
        result.len(),
        100.0 * (1.0 - result.len() as f64 / source.len() as f64)
    );
    result
}

fn main() {
    let args: Vec<String> = env::args().collect();
    assert!(
        (3..=4).contains(&args.len()),
        "Usage: compress-model input.glb output.glb [float-bits=20]"
    );
    let source = fs::read(&args[1]).expect("read input");
    let result = compress(&source, args.get(3).map_or(20, |v| v.parse().unwrap()));
    fs::write(&args[2], result).expect("write output");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> Vec<u8> {
        let mut binary = Vec::new();
        let mut views = Vec::new();
        let mut accessors = Vec::new();
        let mut append = |data: &[f32], count: usize, kind: &str| {
            let bytes: Vec<u8> = data.iter().flat_map(|f| f.to_le_bytes()).collect();
            views.push(json!({"buffer":0,"byteOffset":binary.len(),"byteLength":bytes.len()}));
            binary.extend(bytes);
            accessors.push(json!({"bufferView":views.len()-1,"componentType":5126,"count":count,"type":kind}));
            accessors.len() - 1
        };
        let positions = append(&[0., 0., 0., 1., 0., 0., 0., 1., 0.], 3, "VEC3");
        let weights = append(&[1., 0., 0., 0., 1., 0., 0., 0., 1., 0., 0., 0.], 3, "VEC4");
        let inverse = append(&[1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1.], 1, "MAT4");
        let long = append(&[0., 0.5, 1., 1.5], 4, "SCALAR");
        let short = append(&[0., 0.5], 2, "SCALAR");
        let rest = append(&[1.; 12], 4, "VEC3");
        let movement = append(&[0., 0., 0., 0., 2., 0.], 2, "VEC3");
        let rotation = append(&[0., 0., 0., 1., 0., 1., 0., 0.], 2, "VEC4");
        views.push(json!({"buffer":0,"byteOffset":binary.len(),"byteLength":12}));
        binary.extend([0u8; 12]);
        let joints = accessors.len();
        accessors.push(json!({"bufferView":views.len()-1,"componentType":5121,"count":3,"type":"VEC4"}));
        views.push(json!({"buffer":0,"byteOffset":binary.len(),"byteLength":6}));
        binary.extend([0, 0, 1, 0, 2, 0]);
        let indices = accessors.len();
        accessors.push(json!({"bufferView":views.len()-1,"componentType":5123,"count":3,"type":"SCALAR"}));
        let mut image = Vec::new();
        {
            let mut encoder = png::Encoder::new(&mut image, 1, 1);
            encoder.set_color(png::ColorType::Rgba);
            encoder.set_depth(png::BitDepth::Eight);
            encoder.write_header().unwrap().write_image_data(&[29, 91, 173, 255]).unwrap();
        }
        while !binary.len().is_multiple_of(4) {
            binary.push(0);
        }
        let image_view = views.len();
        views.push(json!({"buffer":0,"byteOffset":binary.len(),"byteLength":image.len()}));
        binary.extend(image);
        accessors[positions]["min"] = json!([0, 0, 0]);
        accessors[positions]["max"] = json!([1, 1, 0]);
        let rest_sampler = json!({"input":long,"output":rest});
        let rest_channel = json!({"sampler":0,"target":{"node":0,"path":"scale"}});
        let doc = json!({
            "asset":{"version":"2.0"}, "scene":0, "scenes":[{"nodes":[0,1]}], "nodes":[{}, {"mesh":0,"skin":0}],
            "meshes":[{"primitives":[{"attributes":{"POSITION":positions,"JOINTS_0":joints,"WEIGHTS_0":weights},"indices":indices,"material":0}]}],
            "materials":[{"pbrMetallicRoughness":{"baseColorTexture":{"index":0}}}],
            "textures":[{"source":0}],"images":[{"bufferView":image_view,"mimeType":"image/png"}],
            "skins":[{"joints":[0],"inverseBindMatrices":inverse}],
            "animations":[
                {"name":"Static","samplers":[rest_sampler],"channels":[rest_channel]},
                {"name":"Mixed","samplers":[rest_sampler,{"input":short,"output":movement}],"channels":[rest_channel,{"sampler":1,"target":{"node":0,"path":"translation"}}]},
                {"name":"Turn","samplers":[{"input":short,"output":rotation}],"channels":[{"sampler":0,"target":{"node":0,"path":"rotation"}}]}
            ], "accessors":accessors,"bufferViews":views,"buffers":[{"byteLength":binary.len()}]
        });
        let mut text = serde_json::to_vec(&doc).unwrap();
        while !text.len().is_multiple_of(4) {
            text.push(b' ');
        }
        while !binary.len().is_multiple_of(4) {
            binary.push(0);
        }
        let mut result = Vec::new();
        for n in [0x46546c67u32, 2, (28 + text.len() + binary.len()) as u32, text.len() as u32, 0x4e4f534a] {
            result.extend(n.to_le_bytes());
        }
        result.extend(text);
        result.extend((binary.len() as u32).to_le_bytes());
        result.extend(0x004e4942u32.to_le_bytes());
        result.extend(binary);
        result
    }

    #[test]
    fn packing_keeps_static_clips_longest_rest_tracks_and_rotation_poses() {
        let source = fixture();
        let compressed = compress(&source, 16);
        assert_eq!(compressed, compress(&source, 16), "packing must be reproducible");
        let a = engine_core::assets::model::parse(&source, Default::default()).unwrap();
        let b = engine_core::assets::model::parse(&compressed, Default::default()).unwrap();
        assert!(a.texture.is_some() && b.texture.is_some(), "embedded textures must still decode");
        let unpack = |bytes: &[u8]| {
            let length = u32::from_le_bytes(bytes[12..16].try_into().unwrap()) as usize;
            let doc: Value = serde_json::from_slice(&bytes[20..20 + length]).unwrap();
            let view = &doc["bufferViews"][number(&doc["images"][0]["bufferView"])];
            assert_eq!(number(&view["buffer"]), 0);
            let start = 28 + length + number(&view["byteOffset"]);
            bytes[start..start + number(&view["byteLength"])].to_vec()
        };
        assert_eq!(unpack(&source), unpack(&compressed), "image bytes must be preserved");
        assert_eq!(a.vertices, b.vertices);
        assert_eq!(a.skin, b.skin);
        let (a, b) = (a.skeleton.unwrap(), b.skeleton.unwrap());
        for clip in 0..a.clips.len() {
            assert_eq!(a.clips[clip].duration, b.clips[clip].duration);
            for frame in 0..33 {
                let (mut ap, mut bp) = (Vec::new(), Vec::new());
                let time = a.clips[clip].duration * frame as f32 / 32.0;
                a.sample(clip, time, &mut ap);
                b.sample(clip, time, &mut bp);
                for (a, b) in ap.iter().zip(&bp) {
                    assert!(
                        a.matrix()
                            .to_cols_array()
                            .iter()
                            .zip(b.matrix().to_cols_array())
                            .all(|(a, b)| (a - b).abs() < 0.0001)
                    );
                }
            }
        }
    }
}
