// One pipeline for every mesh: each instance reads its model matrix and color from storage buffers.
export const SHADER = /* wgsl */ `
struct Globals {
  viewProj: mat4x4f,
  light: vec4f, // xyz = direction towards the light (normalized), w = ambient
};

@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<storage, read> models: array<mat4x4f>;
@group(0) @binding(2) var<storage, read> colors: array<vec4f>;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec3f,
};

@vertex
fn vs(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @builtin(instance_index) instance: u32,
) -> VSOut {
  let model = models[instance];
  var out: VSOut;
  out.pos = globals.viewProj * model * vec4f(position, 1.0);
  out.normal = (model * vec4f(normal, 0.0)).xyz; // uniform scale (or plane X/Z scale) only
  out.color = colors[instance].rgb;
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  let n = normalize(in.normal);
  let diffuse = max(dot(n, globals.light.xyz), 0.0);
  let hemisphere = mix(0.6, 1.0, n.y * 0.5 + 0.5); // sky/ground tint so faces away from the light aren't flat
  let lit = globals.light.w * hemisphere + (1.0 - globals.light.w) * diffuse;
  return vec4f(in.color * lit, 1.0);
}
`;
