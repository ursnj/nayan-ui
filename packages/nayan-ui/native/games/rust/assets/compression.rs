//! Expand EXT_meshopt_compression once at load time, before the normal mesh/skin/clip readers.
use gltf::buffer::Source;
use serde::Deserialize;

pub(super) const EXTENSION: &str = "EXT_meshopt_compression";
// Bound allocations from untrusted extension metadata, including placeholder fallback buffers.
const MAX_DECODED_BYTES: usize = 128 * 1024 * 1024;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Stream {
    buffer: usize,
    #[serde(default)]
    byte_offset: usize,
    byte_length: usize,
    byte_stride: usize,
    count: usize,
    mode: String,
    #[serde(default = "no_filter")]
    filter: String,
}

fn no_filter() -> String {
    "NONE".into()
}

pub(super) fn buffers(gltf: &gltf::Gltf) -> Result<Vec<Vec<u8>>, String> {
    let document = &gltf.document;
    let mut allocated = 0usize;
    let mut buffers = Vec::new();
    let mut placeholders = Vec::new();
    for buffer in document.buffers() {
        let marked = buffer
            .extension_value(EXTENSION)
            .and_then(|v| v.get("fallback"))
            .and_then(|v| v.as_bool())
            == Some(true);
        let placeholder = matches!(buffer.source(), Source::Bin) && buffer.index() > 0;
        if marked && buffer.index() == 0 && matches!(buffer.source(), Source::Bin) {
            return Err("Meshopt fallback cannot replace the GLB binary chunk".into());
        }
        let bytes = match buffer.source() {
            Source::Bin if placeholder => {
                // A fallback buffer without a URI deliberately has no bytes in the file. Every
                // view must be supplied by the extension; never silently supply zero geometry.
                if !document.extensions_required().any(|name| name == EXTENSION)
                    || document
                        .views()
                        .filter(|v| v.buffer().index() == buffer.index())
                        .any(|v| v.extension_value(EXTENSION).is_none())
                {
                    return Err("Meshopt fallback buffer has an uncompressed view or is not required".into());
                }
                allocated = allocated.checked_add(buffer.length()).ok_or("Meshopt allocation overflow")?;
                if allocated > MAX_DECODED_BYTES {
                    return Err("Meshopt fallback buffers exceed the 128 MiB limit".into());
                }
                vec![0; buffer.length()]
            }
            Source::Bin if buffer.index() == 0 => gltf.blob.clone().ok_or("the GLB has no binary chunk")?,
            Source::Bin => return Err("a GLB may only have one stored binary buffer".into()),
            Source::Uri(uri) => super::model::decode_data_uri(uri)
                .ok_or_else(|| format!("external buffer \"{uri}\" isn't supported: export as .glb or embed the data"))?,
        };
        if bytes.len() < buffer.length() {
            return Err("buffer is shorter than its declared byteLength".into());
        }
        buffers.push(bytes);
        placeholders.push(placeholder);
    }

    let mut decoded = Vec::new();
    let mut total = 0usize;
    for view in document.views() {
        let Some(extension) = view.extension_value(EXTENSION) else { continue };
        let stream: Stream = serde_json::from_value(extension.clone()).map_err(|e| format!("invalid Meshopt stream: {e}"))?;
        let size = stream.count.checked_mul(stream.byte_stride).ok_or("Meshopt size overflow")?;
        total = total.checked_add(size).ok_or("Meshopt allocation overflow")?;
        if total > MAX_DECODED_BYTES || size == 0 || size != view.length() || view.stride().is_some_and(|s| s != stream.byte_stride) {
            return Err("invalid Meshopt decoded length or stride (128 MiB limit)".into());
        }
        let destination = buffers.get(view.buffer().index()).ok_or("Meshopt destination buffer missing")?;
        let end = view.offset().checked_add(size).ok_or("Meshopt destination overflow")?;
        if end > destination.len() || end > view.buffer().length() {
            return Err("Meshopt destination out of range".into());
        }
        let source = buffers.get(stream.buffer).ok_or("Meshopt source buffer missing")?;
        if placeholders[stream.buffer] {
            return Err("Meshopt source refers to a missing fallback buffer".into());
        }
        let end = stream.byte_offset.checked_add(stream.byte_length).ok_or("Meshopt source overflow")?;
        let source = source.get(stream.byte_offset..end).ok_or("Meshopt source out of range")?;
        decoded.push((view.buffer().index(), view.offset(), decode(&stream, source)?));
    }
    // Decode all sources before writing any destinations: the extension permits shared buffers.
    for (buffer, offset, bytes) in decoded {
        buffers[buffer][offset..offset + bytes.len()].copy_from_slice(&bytes);
    }
    Ok(buffers)
}

fn decode(stream: &Stream, source: &[u8]) -> Result<Vec<u8>, String> {
    let stride = stream.byte_stride;
    let attributes = stream.mode == "ATTRIBUTES";
    let valid_mode = match stream.mode.as_str() {
        "ATTRIBUTES" => (4..=256).contains(&stride) && stride.is_multiple_of(4),
        "TRIANGLES" => matches!(stride, 2 | 4) && stream.count.is_multiple_of(3),
        "INDICES" => matches!(stride, 2 | 4),
        _ => false,
    };
    let valid_filter = match stream.filter.as_str() {
        "NONE" => true,
        "OCTAHEDRAL" => attributes && matches!(stride, 4 | 8),
        "QUATERNION" => attributes && stride == 8,
        "EXPONENTIAL" => attributes && stride.is_multiple_of(4),
        _ => false,
    };
    if !valid_mode || !valid_filter {
        return Err("invalid Meshopt mode, filter or stride".into());
    }
    let size = stream
        .count
        .checked_mul(stride)
        .filter(|n| *n > 0 && *n <= MAX_DECODED_BYTES)
        .ok_or("invalid Meshopt decoded size")?;
    // The filters access i16/f32 values; use aligned storage rather than a Vec<u8> allocation.
    let mut words = vec![0u32; size.div_ceil(4)];
    let pointer = words.as_mut_ptr().cast();
    // SAFETY: the destination covers count*stride bytes, with 4-byte alignment. The mode/stride
    // combinations above meet the codec contracts. Meshopt bounds-checks the input stream.
    let status = unsafe {
        match stream.mode.as_str() {
            "ATTRIBUTES" => meshopt::ffi::meshopt_decodeVertexBuffer(pointer, stream.count, stride, source.as_ptr(), source.len()),
            "TRIANGLES" => meshopt::ffi::meshopt_decodeIndexBuffer(pointer, stream.count, stride, source.as_ptr(), source.len()),
            _ => meshopt::ffi::meshopt_decodeIndexSequence(pointer, stream.count, stride, source.as_ptr(), source.len()),
        }
    };
    if status != 0 {
        return Err(format!("invalid Meshopt compressed stream ({status})"));
    }
    // SAFETY: filter-specific sizes and alignment were validated above; decoding succeeded.
    unsafe {
        match stream.filter.as_str() {
            "OCTAHEDRAL" => meshopt::ffi::meshopt_decodeFilterOct(pointer, stream.count, stride),
            "QUATERNION" => meshopt::ffi::meshopt_decodeFilterQuat(pointer, stream.count, stride),
            "EXPONENTIAL" => meshopt::ffi::meshopt_decodeFilterExp(pointer, stream.count, stride),
            _ => {}
        }
    }
    // SAFETY: words owns at least size initialized bytes and remains alive while copying them.
    Ok(unsafe { std::slice::from_raw_parts(words.as_ptr().cast::<u8>(), size) }.to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::Engine;
    use serde_json::{Value, json};

    fn stream(count: usize, stride: usize, mode: &str, filter: &str) -> Stream {
        Stream {
            buffer: 0,
            byte_offset: 0,
            byte_length: 0,
            byte_stride: stride,
            count,
            mode: mode.into(),
            filter: filter.into(),
        }
    }

    #[test]
    fn decodes_attribute_and_both_index_modes() {
        let vertices = [[1.0f32, 2.0, 3.0], [-2.0, 0.5, 4.0]];
        let encoded = meshopt::encode_vertex_buffer(&vertices).unwrap();
        let actual = decode(&stream(2, 12, "ATTRIBUTES", "NONE"), &encoded).unwrap();
        assert_eq!(actual, vertices.into_iter().flatten().flat_map(f32::to_le_bytes).collect::<Vec<_>>());
        for stride in [2, 4] {
            let indices = [0, 1, 2, 2, 1, 3];
            for (mode, encoded) in [
                ("TRIANGLES", meshopt::encode_index_buffer(&indices, 4).unwrap()),
                ("INDICES", meshopt::encode_index_sequence(&indices, 4).unwrap()),
            ] {
                let actual = decode(&stream(6, stride, mode, "NONE"), &encoded).unwrap();
                let expected: Vec<u8> = indices.into_iter().flat_map(|i| i.to_le_bytes().into_iter().take(stride)).collect();
                assert_eq!(actual, expected);
            }
        }
    }

    #[test]
    fn applies_each_filter_after_decoding() {
        let oct = meshopt::encode_filter_oct::<i8>(&[[0., 0., 1., 1.], [1., 0., 0., 0.]], 8);
        let bytes = decode(&stream(2, 4, "ATTRIBUTES", "OCTAHEDRAL"), &meshopt::encode_vertex_buffer(&oct).unwrap()).unwrap();
        assert_eq!(bytes, vec![0, 0, 127, 127, 127, 0, 0, 0]);
        let q = std::f32::consts::FRAC_1_SQRT_2;
        let quats = meshopt::encode_filter_quat(&[[0., q, 0., q]], 16);
        let bytes = decode(&stream(1, 8, "ATTRIBUTES", "QUATERNION"), &meshopt::encode_vertex_buffer(&quats).unwrap()).unwrap();
        for (chunk, expected) in bytes.chunks_exact(2).zip([0., q, 0., q]) {
            let actual = i16::from_le_bytes(chunk.try_into().unwrap()) as f32 / 32767.0;
            assert!((actual - expected).abs() < 0.00005);
        }
        let exp = meshopt::encode_filter_exp(&[[1.25, -2.5, 0.125]], 20, meshopt::EncodeExpMode::SharedComponent);
        let bytes = decode(&stream(1, 12, "ATTRIBUTES", "EXPONENTIAL"), &meshopt::encode_vertex_buffer(&exp).unwrap()).unwrap();
        let actual: Vec<f32> = bytes.chunks_exact(4).map(|b| f32::from_le_bytes(b.try_into().unwrap())).collect();
        assert_eq!(actual, vec![1.25, -2.5, 0.125]);
    }

    fn fixture() -> Value {
        let input = super::super::skeleton::tests::fixture();
        let gltf = gltf::Gltf::from_slice(&input).unwrap();
        let original = buffers(&gltf).unwrap();
        let mut doc: Value = serde_json::from_slice(&input).unwrap();
        let mut encoded = Vec::new();
        for view in doc["bufferViews"].as_array_mut().unwrap() {
            let offset = view["byteOffset"].as_u64().unwrap() as usize;
            let length = view["byteLength"].as_u64().unwrap() as usize;
            let data = &original[0][offset..offset + length];
            // The fixture's only non-word-aligned view is its three u16 indices.
            let (stride, count, mode, compressed) = if length == 6 {
                (2, 3, "TRIANGLES", meshopt::encode_index_buffer(&[0, 1, 2], 3).unwrap())
            } else {
                let words: Vec<u32> = data.chunks_exact(4).map(|b| u32::from_le_bytes(b.try_into().unwrap())).collect();
                (4, words.len(), "ATTRIBUTES", meshopt::encode_vertex_buffer(&words).unwrap())
            };
            view["buffer"] = json!(1);
            view["extensions"] = json!({EXTENSION: {"buffer":0,"byteOffset":encoded.len(),"byteLength":compressed.len(),"count":count,"byteStride":stride,"mode":mode}});
            encoded.extend(compressed);
        }
        doc["buffers"] = json!([
            {"byteLength":encoded.len(),"uri":format!("data:application/octet-stream;base64,{}",base64::engine::general_purpose::STANDARD.encode(encoded))},
            {"byteLength":original[0].len(),"extensions":{EXTENSION:{"fallback":true}}}
        ]);
        doc["extensionsUsed"] = json!([EXTENSION]);
        doc["extensionsRequired"] = json!([EXTENSION]);
        doc
    }

    fn parse(doc: &Value) -> Result<super::super::model::Model, String> {
        super::super::model::parse(&serde_json::to_vec(doc).unwrap(), Default::default())
    }

    #[test]
    fn mesh_skin_and_animation_readers_use_expanded_views() {
        let original = super::super::model::parse(&super::super::skeleton::tests::fixture(), Default::default()).unwrap();
        for marker in [true, false] {
            let mut doc = fixture();
            if !marker {
                doc["buffers"][1].as_object_mut().unwrap().remove("extensions");
            }
            let model = parse(&doc).unwrap();
            assert_eq!(model.vertices, original.vertices);
            assert_eq!(model.indices, original.indices);
            assert_eq!(model.skin, original.skin);
            let (a, b) = (original.skeleton.as_ref().unwrap(), model.skeleton.as_ref().unwrap());
            assert_eq!(a.joints.len(), b.joints.len());
            for (ac, bc) in a.clips.iter().zip(&b.clips) {
                assert_eq!((&ac.name, ac.duration), (&bc.name, bc.duration));
                for frame in 0..17 {
                    let mut ap = Vec::new();
                    let mut bp = Vec::new();
                    let clip = a.clips.iter().position(|c| c.name == ac.name).unwrap();
                    a.sample(clip, ac.duration * frame as f32 / 16.0, &mut ap);
                    b.sample(clip, bc.duration * frame as f32 / 16.0, &mut bp);
                    for (a, b) in ap.iter().zip(&bp) {
                        assert_eq!(a.matrix(), b.matrix());
                    }
                }
            }
        }
    }

    #[test]
    fn rejects_invalid_streams_and_sizes_without_panicking() {
        for (field, value) in [
            ("count", json!(u64::MAX)),
            ("count", json!(0)),
            ("byteStride", json!(0)),
            ("byteStride", json!(3)),
            ("byteStride", json!(512)),
            ("mode", json!("unknown")),
            ("filter", json!("unknown")),
            ("filter", json!("QUATERNION")),
            ("byteOffset", json!(u64::MAX)),
            ("byteLength", json!(1)),
            ("buffer", json!(9)),
            ("buffer", json!(1)),
        ] {
            let mut doc = fixture();
            doc["bufferViews"][0]["extensions"][EXTENSION][field] = value;
            assert!(parse(&doc).is_err(), "invalid {field} accepted");
        }
        let mut doc = fixture();
        doc["buffers"][1]["byteLength"] = json!(MAX_DECODED_BYTES + 1);
        assert!(parse(&doc).is_err());
        let mut doc = fixture();
        doc["bufferViews"][0]["byteOffset"] = json!(u64::MAX);
        assert!(parse(&doc).is_err());
        let mut doc = fixture();
        doc["bufferViews"][0]["extensions"] = json!({});
        assert!(parse(&doc).is_err());
        let mut doc = fixture();
        doc["extensionsRequired"] = json!([EXTENSION, "unknown_required_extension"]);
        assert!(parse(&doc).is_err());
        assert!(decode(&stream(3, 2, "TRIANGLES", "EXPONENTIAL"), &[]).is_err());
        assert!(decode(&stream(4, 2, "TRIANGLES", "NONE"), &[]).is_err());
    }
}
