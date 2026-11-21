//! glTF skeletons and animation clips. Shared immutable data; each world owns its players.

use glamx::{Mat4, Quat, Vec3, Vec4};
use gltf::accessor::{DataType, Dimensions};
use gltf::animation::{Interpolation, Property, util::ReadOutputs};

/// Fits an 8 KiB uniform on the GLES fallback as well as Metal/Vulkan.
pub const MAX_JOINTS: usize = 128;
pub const PALETTE_FLOATS: usize = MAX_JOINTS * 16;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Transform {
    pub translation: Vec3,
    pub rotation: Quat,
    pub scale: Vec3,
}

impl Transform {
    pub fn matrix(self) -> Mat4 {
        Mat4::from_scale_rotation_translation(self.scale, self.rotation, self.translation)
    }
    pub fn blend(self, other: Self, t: f32) -> Self {
        Self {
            translation: self.translation.lerp(other.translation, t),
            rotation: self.rotation.slerp(other.rotation, t).normalize(),
            scale: self.scale.lerp(other.scale, t),
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Node {
    pub parent: Option<usize>,
    pub rest: Transform,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ChannelKind {
    Translation,
    Rotation,
    Scale,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Channel {
    pub node: usize,
    pub kind: ChannelKind,
    pub interpolation: Interpolation,
    pub times: Vec<f32>,
    /// CUBICSPLINE stores incoming tangent, value, outgoing tangent for each key.
    pub values: Vec<Vec4>,
}

impl Channel {
    pub fn sample(&self, time: f32) -> Vec4 {
        let cubic = self.interpolation == Interpolation::CubicSpline;
        let value = |i: usize| self.values[if cubic { i * 3 + 1 } else { i }];
        let end = self.times.partition_point(|&t| t <= time);
        if end == 0 {
            return value(0);
        }
        if end == self.times.len() {
            return value(end - 1);
        }
        let first = end - 1;
        let a = value(first);
        if self.interpolation == Interpolation::Step {
            return a;
        }
        let b = value(end);
        let duration = self.times[end] - self.times[first];
        let t = ((time - self.times[first]) / duration).clamp(0.0, 1.0);
        if cubic {
            let t2 = t * t;
            let t3 = t2 * t;
            return a * (2.0 * t3 - 3.0 * t2 + 1.0)
                + self.values[first * 3 + 2] * (duration * (t3 - 2.0 * t2 + t))
                + b * (-2.0 * t3 + 3.0 * t2)
                + self.values[end * 3] * (duration * (t3 - t2));
        }
        if self.kind == ChannelKind::Rotation {
            return Vec4::from_array(
                Quat::from_array(a.to_array())
                    .normalize()
                    .slerp(Quat::from_array(b.to_array()).normalize(), t)
                    .to_array(),
            );
        }
        a.lerp(b, t)
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Clip {
    pub name: String,
    pub duration: f32,
    pub channels: Vec<Channel>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Joint {
    pub node: usize,
    /// Mesh bind transform and model centering/fitting have already been accounted for.
    pub inverse: Mat4,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Skeleton {
    pub nodes: Vec<Node>,
    pub order: Vec<usize>,
    pub joints: Vec<Joint>,
    pub clips: Vec<Clip>,
    pub normalization: Mat4,
}

/// Validate before calling gltf's typed readers, which assume matching accessor types/strides.
pub fn readable(a: &gltf::Accessor, types: &[DataType], dims: Dimensions) -> bool {
    types.contains(&a.data_type())
        && a.dimensions() == dims
        && a.sparse().is_none()
        && a.view().and_then(|v| v.stride()).is_none_or(|stride| stride >= a.size())
}

impl Skeleton {
    pub fn parse(document: &gltf::Document, buffers: &[Vec<u8>]) -> Result<Option<Self>, String> {
        if document.skins().len() == 0 && document.animations().len() == 0 {
            return Ok(None);
        }
        let mut nodes = Vec::with_capacity(document.nodes().len());
        for node in document.nodes() {
            let (t, r, s) = node.transform().decomposed();
            let rest = Transform {
                translation: Vec3::from_array(t),
                rotation: Quat::from_array(r),
                scale: Vec3::from_array(s),
            };
            if !rest.translation.is_finite() || !rest.rotation.is_finite() || rest.rotation.length_squared() < 1e-10 || !rest.scale.is_finite() {
                return Err("a skeleton has an invalid node transform".into());
            }
            nodes.push(Node {
                parent: None,
                rest: Transform {
                    rotation: rest.rotation.normalize(),
                    ..rest
                },
            });
        }
        for node in document.nodes() {
            for child in node.children() {
                if nodes[child.index()].parent.replace(node.index()).is_some() {
                    return Err("a skeleton node has multiple parents".into());
                }
            }
        }
        let mut order = Vec::with_capacity(nodes.len());
        let mut seen = vec![0u8; nodes.len()];
        fn visit(i: usize, depth: usize, nodes: &[Node], seen: &mut [u8], order: &mut Vec<usize>) -> Result<(), String> {
            if seen[i] == 2 {
                return Ok(());
            }
            if seen[i] == 1 || depth > 256 {
                return Err("cyclic or excessively deep skeleton".into());
            }
            seen[i] = 1;
            if let Some(parent) = nodes[i].parent {
                visit(parent, depth + 1, nodes, seen, order)?;
            }
            seen[i] = 2;
            order.push(i);
            Ok(())
        }
        for i in 0..nodes.len() {
            visit(i, 0, &nodes, &mut seen, &mut order)?;
        }
        let mut clips = Vec::new();
        for animation in document.animations() {
            let name = animation
                .name()
                .map(str::to_owned)
                .unwrap_or_else(|| format!("Animation {}", animation.index()));
            if clips.iter().any(|c: &Clip| c.name == name) {
                return Err("animation clip names must be unique".into());
            }
            let mut channels = Vec::new();
            let mut duration = 0.0f32;
            for channel in animation.channels() {
                let property = channel.target().property();
                if property == Property::MorphTargetWeights {
                    continue;
                }
                let sampler = channel.sampler();
                let dims = if property == Property::Rotation {
                    Dimensions::Vec4
                } else {
                    Dimensions::Vec3
                };
                let output = sampler.output();
                let output_types: &[DataType] = if property == Property::Rotation && output.normalized() {
                    &[DataType::I8, DataType::U8, DataType::I16, DataType::U16, DataType::F32]
                } else {
                    &[DataType::F32]
                };
                if !readable(&sampler.input(), &[DataType::F32], Dimensions::Scalar) || !readable(&output, output_types, dims) {
                    return Err("an animation has an unsupported accessor layout".into());
                }
                let reader = channel.reader(|b| buffers.get(b.index()).map(Vec::as_slice));
                let times: Vec<f32> = reader.read_inputs().ok_or("missing animation times")?.collect();
                if times.is_empty() || times.iter().any(|t| !t.is_finite() || *t < 0.0) || times.windows(2).any(|t| t[1] <= t[0]) {
                    return Err("animation times must be finite and strictly increasing".into());
                }
                let (kind, values): (_, Vec<Vec4>) = match reader.read_outputs().ok_or("missing animation values")? {
                    ReadOutputs::Translations(v) => (ChannelKind::Translation, v.map(|v| Vec3::from_array(v).extend(0.0)).collect()),
                    ReadOutputs::Scales(v) => (ChannelKind::Scale, v.map(|v| Vec3::from_array(v).extend(0.0)).collect()),
                    ReadOutputs::Rotations(v) => (ChannelKind::Rotation, v.into_f32().map(Vec4::from_array).collect()),
                    _ => return Err("unsupported animation channel".into()),
                };
                let cubic = sampler.interpolation() == Interpolation::CubicSpline;
                if values.len() != times.len() * if cubic { 3 } else { 1 } || values.iter().any(|v| !v.is_finite()) {
                    return Err("animation key values do not match their times".into());
                }
                if kind == ChannelKind::Rotation && (0..times.len()).any(|i| values[if cubic { i * 3 + 1 } else { i }].length_squared() < 1e-10) {
                    return Err("an animation has a zero rotation quaternion".into());
                }
                duration = duration.max(*times.last().unwrap());
                channels.push(Channel {
                    node: channel.target().node().index(),
                    kind,
                    interpolation: sampler.interpolation(),
                    times,
                    values,
                });
            }
            clips.push(Clip { name, duration, channels });
        }
        Ok(Some(Self {
            nodes,
            order,
            joints: Vec::new(),
            clips,
            normalization: Mat4::IDENTITY,
        }))
    }

    pub fn bind(&mut self, node: &gltf::Node, transform: Mat4, buffers: &[Vec<u8>]) -> Result<Vec<usize>, String> {
        if !transform.is_finite() || transform.determinant().abs() < 1e-10 {
            return Err("a skinned mesh has a singular transform".into());
        }
        let first = self.joints.len();
        if let Some(skin) = node.skin() {
            if let Some(a) = skin.inverse_bind_matrices()
                && !readable(&a, &[DataType::F32], Dimensions::Mat4)
            {
                return Err("invalid inverse bind matrices".into());
            }
            let inverse: Vec<Mat4> = match skin.reader(|b| buffers.get(b.index()).map(Vec::as_slice)).read_inverse_bind_matrices() {
                Some(m) => m.map(|m| Mat4::from_cols_array_2d(&m)).collect(),
                None if skin.inverse_bind_matrices().is_none() => vec![Mat4::IDENTITY; skin.joints().len()],
                None => return Err("missing inverse bind matrix data".into()),
            };
            if inverse.len() != skin.joints().len() || inverse.iter().any(|m| !m.is_finite()) {
                return Err("invalid inverse bind matrix count".into());
            }
            for (joint, inverse) in skin.joints().zip(inverse) {
                self.joints.push(Joint {
                    node: joint.index(),
                    inverse: inverse * transform.inverse(),
                });
            }
        } else {
            self.joints.push(Joint {
                node: node.index(),
                inverse: transform.inverse(),
            });
        }
        let count = self.joints.len() - first;
        if count == 0 {
            return Err("a skin has no joints".into());
        }
        if let Some(existing) = self.joints[..first].windows(count).position(|joints| joints == &self.joints[first..]) {
            self.joints.truncate(first);
            return Ok((existing..existing + count).collect());
        }
        if self.joints.len() > MAX_JOINTS {
            return Err(format!("a model exceeds the {MAX_JOINTS}-joint palette limit"));
        }
        Ok((first..self.joints.len()).collect())
    }

    pub fn normalize(&mut self, center: Vec3, scale: f32) {
        self.normalization = Mat4::from_scale(Vec3::splat(scale)) * Mat4::from_translation(-center);
        let inverse = self.normalization.inverse();
        for joint in &mut self.joints {
            joint.inverse *= inverse;
        }
    }

    pub fn sample(&self, clip: usize, time: f32, pose: &mut Vec<Transform>) {
        pose.clear();
        pose.extend(self.nodes.iter().map(|n| n.rest));
        for channel in &self.clips[clip].channels {
            let value = channel.sample(time);
            match channel.kind {
                ChannelKind::Translation => pose[channel.node].translation = value.truncate(),
                ChannelKind::Scale => pose[channel.node].scale = value.truncate(),
                ChannelKind::Rotation => pose[channel.node].rotation = Quat::from_array(value.to_array()).normalize(),
            }
        }
    }

    pub fn palette(&self, pose: &[Transform], globals: &mut Vec<Mat4>, out: &mut [f32; PALETTE_FLOATS]) {
        globals.resize(self.nodes.len(), Mat4::IDENTITY);
        for &i in &self.order {
            globals[i] = self.nodes[i].parent.map_or(Mat4::IDENTITY, |p| globals[p]) * pose[i].matrix();
        }
        for (i, joint) in self.joints.iter().enumerate() {
            out[i * 16..i * 16 + 16].copy_from_slice(&(self.normalization * globals[joint.node] * joint.inverse).to_cols_array());
        }
    }
}

/// One active character's bone matrices, indexed in the world's instance-buffer order.
pub struct SkinDraw {
    pub instance: usize,
    pub matrices: [f32; PALETTE_FLOATS],
}

impl SkinDraw {
    pub fn new(instance: usize) -> Self {
        let mut matrices = [0.0; PALETTE_FLOATS];
        for m in matrices.as_chunks_mut::<16>().0 {
            m.copy_from_slice(&Mat4::IDENTITY.to_cols_array());
        }
        Self { instance, matrices }
    }
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use serde_json::json;

    pub fn fixture() -> Vec<u8> {
        let mut bin = Vec::new();
        let mut views = Vec::new();
        let mut append = |data: Vec<u8>| {
            while bin.len() % 4 != 0 {
                bin.push(0);
            }
            let index = views.len();
            views.push(json!({"buffer":0,"byteOffset":bin.len(),"byteLength":data.len()}));
            bin.extend(data);
            index
        };
        let floats = |values: &[f32]| values.iter().flat_map(|f| f.to_le_bytes()).collect();
        let positions = append(floats(&[0., 0., 0., 1., 0., 0., 0., 1., 0.]));
        let indices = append(vec![0, 0, 1, 0, 2, 0]);
        let joints = append(vec![0; 24]);
        let weights = append(floats(&[1., 0., 0., 0., 1., 0., 0., 0., 1., 0., 0., 0.]));
        let inverse = append(floats(&Mat4::IDENTITY.to_cols_array()));
        let times = append(floats(&[0., 1.]));
        let values = append(floats(&[0., 0., 0., 0., 2., 0.]));
        let back = append(floats(&[0., 0., 0., 0., -2., 0.]));
        let accessor = |view, component, count, kind| json!({"bufferView":view,"componentType":component,"count":count,"type":kind});
        let mut accessors = vec![
            accessor(positions, 5126, 3, "VEC3"),
            accessor(indices, 5123, 3, "SCALAR"),
            accessor(joints, 5123, 3, "VEC4"),
            accessor(weights, 5126, 3, "VEC4"),
            accessor(inverse, 5126, 1, "MAT4"),
            accessor(times, 5126, 2, "SCALAR"),
            accessor(values, 5126, 2, "VEC3"),
            accessor(back, 5126, 2, "VEC3"),
        ];
        accessors[0]["min"] = json!([0, 0, 0]);
        accessors[0]["max"] = json!([1, 1, 0]);
        let animation = |name, output| json!({"name":name,"samplers":[{"input":5,"output":output,"interpolation":"LINEAR"}],"channels":[{"sampler":0,"target":{"node":0,"path":"translation"}}]});
        let doc = json!({"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[0,1]}],"nodes":[{}, {"mesh":0,"skin":0}],"meshes":[{"primitives":[{"attributes":{"POSITION":0,"JOINTS_0":2,"WEIGHTS_0":3},"indices":1}]}],"skins":[{"joints":[0],"inverseBindMatrices":4}],"animations":[animation("Move",6),animation("Back",7)],"accessors":accessors,"bufferViews":views,"buffers":[{"uri":format!("data:application/octet-stream;base64,{}",base64::Engine::encode(&base64::engine::general_purpose::STANDARD,&bin)),"byteLength":bin.len()}]});
        serde_json::to_vec(&doc).unwrap()
    }

    #[test]
    fn parses_skin_and_applies_center_and_fit_to_animation() {
        let model = crate::assets::model::parse(&fixture(), crate::assets::model::LoadOptions { center: true, fit: 2.0 }).unwrap();
        assert_eq!(model.vertices.len() / 11, 3);
        assert_eq!(model.skin.len(), 24);
        let rig = model.skeleton.unwrap();
        assert_eq!(rig.joints.len(), 1);
        assert_eq!(rig.clips[0].name, "Move");
        let mut pose = Vec::new();
        let mut globals = Vec::new();
        let mut palette = [0.0; PALETTE_FLOATS];
        rig.sample(0, 0.5, &mut pose);
        rig.palette(&pose, &mut globals, &mut palette);
        let p = Mat4::from_cols_slice(&palette[..16]).transform_point3(Vec3::new(-1., -1., 0.));
        assert!((p - Vec3::new(-1., 1., 0.)).length() < 1e-5);
    }

    #[test]
    fn submeshes_sharing_a_skin_reuse_the_same_joint_palette() {
        let mut doc: serde_json::Value = serde_json::from_slice(&fixture()).unwrap();
        doc["nodes"].as_array_mut().unwrap().push(serde_json::json!({"mesh":0,"skin":0}));
        doc["scenes"][0]["nodes"].as_array_mut().unwrap().push(serde_json::json!(2));
        let model = crate::assets::model::parse(&serde_json::to_vec(&doc).unwrap(), Default::default()).unwrap();
        assert_eq!(model.vertices.len() / 11, 6);
        assert_eq!(model.skeleton.unwrap().joints.len(), 1);
    }

    #[test]
    fn samples_step_linear_slerp_and_cubic_channels() {
        let mut channel = Channel {
            node: 0,
            kind: ChannelKind::Translation,
            interpolation: Interpolation::Linear,
            times: vec![0., 2.],
            values: vec![Vec4::ZERO, Vec4::new(2., 0., 0., 0.)],
        };
        assert_eq!(channel.sample(1.).x, 1.);
        channel.interpolation = Interpolation::Step;
        assert_eq!(channel.sample(1.).x, 0.);
        channel.interpolation = Interpolation::CubicSpline;
        channel.values = vec![
            Vec4::ZERO,
            Vec4::ZERO,
            Vec4::new(1., 0., 0., 0.),
            Vec4::new(1., 0., 0., 0.),
            Vec4::new(2., 0., 0., 0.),
            Vec4::ZERO,
        ];
        assert!((channel.sample(1.).x - 1.).abs() < 1e-6);
        channel.interpolation = Interpolation::Linear;
        channel.kind = ChannelKind::Rotation;
        channel.values = vec![Vec4::W, Vec4::from_array(Quat::from_rotation_y(1.).to_array())];
        let q = Quat::from_array(channel.sample(1.).to_array());
        assert!(q.dot(Quat::from_rotation_y(0.5)).abs() > 0.99999);
    }

    #[test]
    fn rejects_bad_joint_attributes_and_animation_layouts_without_panicking() {
        let source: serde_json::Value = serde_json::from_slice(&fixture()).unwrap();
        for (accessor, field, value) in [
            (2, "type", json!("VEC3")),
            (3, "componentType", json!(5125)),
            (5, "type", json!("VEC2")),
            (6, "type", json!("SCALAR")),
        ] {
            let mut doc = source.clone();
            doc["accessors"][accessor][field] = value;
            assert!(crate::assets::model::parse(&serde_json::to_vec(&doc).unwrap(), Default::default()).is_err());
        }
    }
}
