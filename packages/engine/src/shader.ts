// One shader module, two pipelines: `vs_shadow` renders depth from the light; `vs`/`fs` draw the
// scene, sampling that depth for shadows. Each instance reads its model matrix and color from
// storage buffers.
export const SHADER = /* wgsl */ `
struct Globals {
  viewProj: mat4x4f,
  lightViewProj: mat4x4f,
  light: vec4f,  // xyz = direction towards the light (normalized), w = ambient
  shadow: vec4f, // x = shadow-map texel size, y = enabled (0/1), z = depth bias
};

@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<storage, read> models: array<mat4x4f>;
@group(0) @binding(2) var<storage, read> colors: array<vec4f>;
@group(0) @binding(3) var shadowMap: texture_depth_2d;
@group(0) @binding(4) var shadowSampler: sampler_comparison;

@vertex
fn vs_shadow(@location(0) position: vec3f, @builtin(instance_index) instance: u32) -> @builtin(position) vec4f {
  return globals.lightViewProj * models[instance] * vec4f(position, 1.0);
}

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec3f,
  @location(2) world: vec3f,
};

@vertex
fn vs(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @builtin(instance_index) instance: u32,
) -> VSOut {
  let model = models[instance];
  let world = model * vec4f(position, 1.0);
  var out: VSOut;
  out.pos = globals.viewProj * world;
  out.normal = (model * vec4f(normal, 0.0)).xyz; // uniform scale (or plane X/Z scale) only
  out.color = colors[instance].rgb;
  out.world = world.xyz;
  return out;
}

// 1 = lit, 0 = in shadow. 3x3 PCF on top of the sampler's hardware 2x2 comparison filter.
fn shadowFactor(world: vec3f) -> f32 {
  if (globals.shadow.y == 0.0) {
    return 1.0;
  }
  let p = globals.lightViewProj * vec4f(world, 1.0);
  let ndc = p.xyz / p.w;
  let uv = vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
  if (any(uv < vec2f(0.0)) || any(uv > vec2f(1.0)) || ndc.z > 1.0) {
    return 1.0; // outside the shadow map: lit
  }
  let depth = ndc.z - globals.shadow.z;
  let texel = globals.shadow.x;
  var sum = 0.0;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      sum += textureSampleCompareLevel(shadowMap, shadowSampler, uv + vec2f(f32(x), f32(y)) * texel, depth);
    }
  }
  return sum / 9.0;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  let n = normalize(in.normal);
  let diffuse = max(dot(n, globals.light.xyz), 0.0) * shadowFactor(in.world);
  let hemisphere = mix(0.6, 1.0, n.y * 0.5 + 0.5); // sky/ground tint so faces away from the light aren't flat
  let lit = globals.light.w * hemisphere + (1.0 - globals.light.w) * diffuse;
  return vec4f(in.color * lit, 1.0);
}
`;
