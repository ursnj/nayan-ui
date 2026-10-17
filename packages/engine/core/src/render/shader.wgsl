// One shader module, four pipelines: `vs_shadow` renders depth from the light; `vs` + `fs_opaque`
// draw solid instances (sampling that depth for shadows), `vs` + `fs_cutout` solid ones whose texture
// has holes, and `vs` + `fs_blend` see-through ones (including "puff" sprites, which face the camera).
// Each instance's model matrix, color and texture region arrive as per-instance vertex attributes
// (GLES 3.0 has no storage buffers in vertex shaders); each mesh binds its texture (white when none).

struct Globals {
  viewProj: mat4x4f,
  lightViewProj: mat4x4f,
  light: vec4f,  // xyz = direction towards the light (normalized), w = ambient
  shadow: vec4f, // x = soft (0/1), y = enabled (0/1), z = depth bias, w = sRGB target (0/1)
  camera: vec4f, // xyz = eye position
  fog: vec4f,    // rgb = fog color (the background), a = density (0 = off)
  lightColor: vec4f, // rgb = light color and brightness (multiplies sun and ambient)
};

@group(0) @binding(0) var<uniform> globals: Globals;
// A depth texture read as unfilterable float: textureLoad works on every backend (no comparison sampler).
@group(0) @binding(1) var shadowMap: texture_2d<f32>;
@group(1) @binding(0) var tex: texture_2d<f32>;
@group(1) @binding(1) var texSampler: sampler;
@group(1) @binding(2) var<uniform> material: vec4f; // x = shine (0 matte .. 1 polished)

struct Instance {
  @location(4) m0: vec4f,
  @location(5) m1: vec4f,
  @location(6) m2: vec4f,
  @location(7) m3: vec4f,
  @location(8) color: vec4f,
  @location(9) region: vec4f,
};

@vertex
fn vs_shadow(@location(0) position: vec3f, @location(4) m0: vec4f, @location(5) m1: vec4f, @location(6) m2: vec4f, @location(7) m3: vec4f) -> @builtin(position) vec4f {
  return globals.lightViewProj * mat4x4f(m0, m1, m2, m3) * vec4f(position, 1.0);
}

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) normal: vec3f,
  @location(1) color: vec4f,
  @location(2) world: vec3f,
  @location(3) uv: vec2f,
  @location(4) shadowPos: vec3f, // position in the light's clip space (orthographic, so w = 1)
  @location(5) sprite: vec4f, // puffs: xyz = toward the camera, w = 1 (0 for everything else)
};

@vertex
fn vs(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) vertexColor: vec3f, // white for built-in shapes; material color for models
  @location(3) uv: vec2f,
  inst: Instance,
) -> VSOut {
  let model = mat4x4f(inst.m0, inst.m1, inst.m2, inst.m3);
  var world = model * vec4f(position, 1.0);
  // Zero normals mark a puff: a sprite turned to face the camera, sized by the instance's x / y scale.
  let sprite = dot(normal, normal) < 0.5;
  var toward = vec3f(0.0);
  if (sprite) {
    let center = model[3].xyz;
    toward = normalize(globals.camera.xyz - center);
    let right = normalize(cross(-toward, select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(toward.y) > 0.99)));
    let up = cross(right, -toward);
    world = vec4f(center + right * position.x * length(model[0].xyz) + up * position.y * length(model[1].xyz), 1.0);
  }
  // Normals need the inverse-transpose so stretched shapes stay lit correctly. For a 3x3 matrix with
  // columns a, b, c that is (b x c, c x a, a x b) / det; the scale doesn't matter (normalized later).
  let a = model[0].xyz;
  let b = model[1].xyz;
  let c = model[2].xyz;
  let normalMatrix = mat3x3f(cross(b, c), cross(c, a), cross(a, b)) * sign(dot(a, cross(b, c)));
  var out: VSOut;
  out.pos = globals.viewProj * world;
  out.normal = normalMatrix * normal;
  out.color = inst.color * vec4f(vertexColor, 1.0);
  out.world = world.xyz;
  out.uv = mix(inst.region.xy, inst.region.zw, uv);
  out.shadowPos = (globals.lightViewProj * world).xyz; // per vertex: saves a matrix per pixel
  out.sprite = vec4f(toward, select(0.0, 1.0, sprite));
  return out;
}

fn lit(texel: vec2i, depth: f32) -> f32 {
  return select(0.0, 1.0, depth <= textureLoad(shadowMap, texel, 0).r);
}

// 1 = lit, 0 = in shadow. 3x3 PCF (or one tap when shadows are hard) done by hand with textureLoad.
fn shadowFactor(ndc: vec3f) -> f32 {
  if (globals.shadow.y == 0.0) {
    return 1.0;
  }
  let uv = vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
  if (any(uv < vec2f(0.0)) || any(uv > vec2f(1.0)) || ndc.z > 1.0) {
    return 1.0; // outside the shadow map: lit
  }
  let depth = ndc.z - globals.shadow.z;
  let size = vec2i(textureDimensions(shadowMap));
  let center = vec2i(uv * vec2f(size));
  if (globals.shadow.x == 0.0) {
    return lit(min(center, size - vec2i(1)), depth);
  }
  var sum = 0.0;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      sum += lit(clamp(center + vec2i(x, y), vec2i(0), size - vec2i(1)), depth);
    }
  }
  return sum / 9.0;
}

// Lit, fogged color of a surface.
fn shade(in: VSOut, base: vec3f) -> vec3f {
  let n = normalize(in.normal);
  let shadow = shadowFactor(in.shadowPos);
  let diffuse = max(dot(n, globals.light.xyz), 0.0) * shadow;
  let hemisphere = mix(0.6, 1.0, n.y * 0.5 + 0.5); // sky/ground tint so faces away from the light aren't flat
  let light = (globals.light.w * hemisphere + (1.0 - globals.light.w) * diffuse) * globals.lightColor.rgb;
  // Colors brighter than 1 glow: at a peak channel of 2 the surface is self-lit (its hue at full
  // brightness, ignoring light and shadow), blending in from 1. Fire, lamps, lasers.
  let peak = max(base.r, max(base.g, base.b));
  let glow = clamp(peak - 1.0, 0.0, 1.0);
  var color = mix(min(base, vec3f(1.0)) * light, base / max(peak, 1.0), glow);
  // Glossy materials: a sun highlight, and the sky reflected more strongly at grazing angles (Fresnel).
  let shine = material.x;
  if (shine > 0.0) {
    let v = normalize(globals.camera.xyz - in.world);
    let h = normalize(globals.light.xyz + v);
    let highlight = pow(max(dot(n, h), 0.0), mix(16.0, 220.0, shine)) * shine * shadow;
    let r = reflect(-v, n);
    let sky = mix(vec3f(0.16, 0.15, 0.14), globals.fog.rgb * 1.08, smoothstep(-0.15, 0.35, r.y));
    let fresnel = 0.05 + 0.95 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    color = mix(color, sky, min(1.0, fresnel * shine)) + highlight * 1.6 * globals.lightColor.rgb;
  }
  // Exponential-squared distance fog towards the background color: depth for far scenery. Glowing
  // colors cut through it, as lights do in haze.
  let d = distance(in.world, globals.camera.xyz) * globals.fog.a;
  let fog = (1.0 - exp(-d * d)) * (1.0 - glow * 0.75);
  return mix(color, globals.fog.rgb, fog);
}

// Colors are authored for a non-sRGB target. When the surface only offers sRGB formats (common with
// GLES), undo its encoding so the picture looks the same.
fn output(color: vec3f, alpha: f32) -> vec4f {
  if (globals.shadow.w > 0.5) {
    return vec4f(pow(max(color, vec3f(0.0)), vec3f(2.2)), alpha);
  }
  return vec4f(color, alpha);
}

@fragment
fn fs_opaque(in: VSOut) -> @location(0) vec4f {
  let texel = textureSample(tex, texSampler, in.uv);
  return output(shade(in, in.color.rgb * texel.rgb), 1.0);
}

@fragment
fn fs_cutout(in: VSOut) -> @location(0) vec4f {
  let texel = textureSample(tex, texSampler, in.uv);
  if (texel.a < 0.5) {
    discard; // cut-out textures (leaves, sprites, rounded cards)
  }
  return output(shade(in, in.color.rgb * texel.rgb), 1.0);
}

@fragment
fn fs_blend(in: VSOut) -> @location(0) vec4f {
  let texel = textureSample(tex, texSampler, in.uv);
  if (in.sprite.w > 0.5) {
    // A puff: shaded like a ball (normals bulging toward the camera), fading out softly to its rim.
    let p = in.uv * 2.0 - 1.0;
    let r2 = dot(p, p);
    if (r2 >= 1.0) {
      discard;
    }
    let toward = in.sprite.xyz;
    let right = normalize(cross(-toward, select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(toward.y) > 0.99)));
    let up = cross(right, -toward);
    var bulged = in;
    bulged.normal = right * p.x - up * p.y + toward * sqrt(1.0 - r2);
    let soft = smoothstep(0.0, 0.8, 1.0 - r2); // a full core, fading smoothly over the outer part
    return output(shade(bulged, in.color.rgb * texel.rgb), in.color.a * texel.a * soft);
  }
  return output(shade(in, in.color.rgb * texel.rgb), in.color.a * texel.a);
}
