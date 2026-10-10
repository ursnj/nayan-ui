// One shader module, three pipelines: `vs_shadow` renders depth from the light; `vs` + `fs_opaque`
// draw solid instances (sampling that depth for shadows) and `vs` + `fs_blend` see-through ones.
// Each instance reads its model matrix, color and texture region from storage buffers; each mesh
// binds its texture (white when it has none).
export const SHADER = /* wgsl */ `
struct Globals {
  viewProj: mat4x4f,
  lightViewProj: mat4x4f,
  light: vec4f,  // xyz = direction towards the light (normalized), w = ambient
  shadow: vec4f, // y = enabled (0/1), z = depth bias
  camera: vec4f, // xyz = eye position
  fog: vec4f,    // rgb = fog color (the background), a = density (0 = off)
};

@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<storage, read> models: array<mat4x4f>;
@group(0) @binding(2) var<storage, read> colors: array<vec4f>;
@group(0) @binding(3) var shadowMap: texture_depth_2d;
@group(0) @binding(4) var<storage, read> regions: array<vec4f>;
@group(1) @binding(0) var tex: texture_2d<f32>;
@group(1) @binding(1) var texSampler: sampler;

@vertex
fn vs_shadow(@location(0) position: vec3f, @builtin(instance_index) instance: u32) -> @builtin(position) vec4f {
  return globals.lightViewProj * models[instance] * vec4f(position, 1.0);
}

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec4f,
  @location(2) world: vec3f,
  @location(3) uv: vec2f,
};

@vertex
fn vs(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) vertexColor: vec3f, // white for built-in shapes; material color for models
  @location(3) uv: vec2f,
  @builtin(instance_index) instance: u32,
) -> VSOut {
  let model = models[instance];
  let world = model * vec4f(position, 1.0);
  // Normals need the inverse-transpose so stretched shapes stay lit correctly. For a 3x3 matrix with
  // columns a, b, c that is (b x c, c x a, a x b) / det; the scale doesn't matter (normalized later).
  let a = model[0].xyz;
  let b = model[1].xyz;
  let c = model[2].xyz;
  let normalMatrix = mat3x3f(cross(b, c), cross(c, a), cross(a, b)) * sign(dot(a, cross(b, c)));
  let region = regions[instance];
  var out: VSOut;
  out.pos = globals.viewProj * world;
  out.normal = normalMatrix * normal;
  out.color = colors[instance] * vec4f(vertexColor, 1.0);
  out.world = world.xyz;
  out.uv = mix(region.xy, region.zw, uv);
  return out;
}

// 1 = lit, 0 = in shadow. 3x3 PCF done by hand with textureLoad: comparison samplers are not
// available on every backend (Dawn disables them on some Metal devices, e.g. the iOS simulator).
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
  let size = vec2i(textureDimensions(shadowMap));
  let center = vec2i(uv * vec2f(size));
  var sum = 0.0;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let texel = clamp(center + vec2i(x, y), vec2i(0), size - vec2i(1));
      sum += select(0.0, 1.0, depth <= textureLoad(shadowMap, texel, 0));
    }
  }
  return sum / 9.0;
}

// Lit, fogged color of a surface.
fn shade(in: VSOut, base: vec3f) -> vec3f {
  let n = normalize(in.normal);
  let diffuse = max(dot(n, globals.light.xyz), 0.0) * shadowFactor(in.world);
  let hemisphere = mix(0.6, 1.0, n.y * 0.5 + 0.5); // sky/ground tint so faces away from the light aren't flat
  let lit = globals.light.w * hemisphere + (1.0 - globals.light.w) * diffuse;
  // Exponential-squared distance fog towards the background color: depth for far scenery.
  let d = distance(in.world, globals.camera.xyz) * globals.fog.a;
  let fog = 1.0 - exp(-d * d);
  return mix(base * lit, globals.fog.rgb, fog);
}

@fragment
fn fs_opaque(in: VSOut) -> @location(0) vec4f {
  let texel = textureSample(tex, texSampler, in.uv);
  if (texel.a < 0.5) {
    discard; // cut-out textures (leaves, sprites, rounded cards)
  }
  return vec4f(shade(in, in.color.rgb * texel.rgb), 1.0);
}

@fragment
fn fs_blend(in: VSOut) -> @location(0) vec4f {
  let texel = textureSample(tex, texSampler, in.uv);
  return vec4f(shade(in, in.color.rgb * texel.rgb), in.color.a * texel.a);
}
`;
