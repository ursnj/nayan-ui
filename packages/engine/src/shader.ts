// One pipeline, one draw call: every instance reads its model matrix from a storage buffer.
export const SHADER = /* wgsl */ `
struct Globals {
  viewProj: mat4x4f,
  lightDir: vec4f,
};

@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<storage, read> models: array<mat4x4f>;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec3f,
};

fn hashColor(i: u32) -> vec3f {
  let h = i * 2654435761u;
  return vec3f(
    f32((h >> 0u) & 255u),
    f32((h >> 8u) & 255u),
    f32((h >> 16u) & 255u),
  ) / 255.0 * 0.7 + 0.3;
}

@vertex
fn vs(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @builtin(instance_index) instance: u32,
) -> VSOut {
  let model = models[instance];
  var out: VSOut;
  out.pos = globals.viewProj * model * vec4f(position, 1.0);
  out.normal = (model * vec4f(normal, 0.0)).xyz; // uniform scale only
  out.color = hashColor(instance);
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  let diffuse = max(dot(normalize(in.normal), globals.lightDir.xyz), 0.0);
  return vec4f(in.color * (0.25 + 0.75 * diffuse), 1.0);
}
`;
