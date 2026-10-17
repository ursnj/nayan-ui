// OpenGL ES 3.0 fallback for GPUs without WebGPU support (older Android phones). It draws the same
// scene as `Renderer` (instancing, shadows, textures, cut-outs, blended and additive sprites) with a
// port of its shader; MSAA and the pixel ratio cap are left out (expo-gl fixes the drawing buffer size).
import { mat4, vec3 } from "wgpu-matrix";
import { textureImage } from "../assets/texture";
import { meshInfo, VERTEX_FLOATS } from "./meshes";
import type { QualityLevel } from "./quality";
import type { Environment } from "./Renderer";
import { MAX_MESHES, SHAPE_MESH, type Camera, type Light, type RenderSource } from "../types";

const WHITE = -1;
const WHITE_LIGHT = [1, 1, 1] as const;
const MODE = { opaque: 0, cutout: 1, blend: 2 } as const;

// Attribute locations shared by both programs.
const A_POSITION = 0;
const A_NORMAL = 1;
const A_COLOR = 2;
const A_UV = 3;
const A_MODEL = 4; // 4..7: model matrix columns
const A_TINT = 8;
const A_REGION = 9;

const VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 vertexColor;
layout(location = 3) in vec2 uv;
layout(location = 4) in vec4 m0;
layout(location = 5) in vec4 m1;
layout(location = 6) in vec4 m2;
layout(location = 7) in vec4 m3;
layout(location = 8) in vec4 tint;
layout(location = 9) in vec4 region;
uniform mat4 viewProj;
uniform mat4 lightViewProj;
uniform vec4 camera;
out vec3 vNormal;
out vec4 vColor;
out vec3 vWorld;
out vec2 vUv;
out vec3 vShadowPos;
out vec4 vSprite;
void main() {
  mat4 model = mat4(m0, m1, m2, m3);
  vec4 world = model * vec4(position, 1.0);
  bool sprite = dot(normal, normal) < 0.5;
  vec3 toward = vec3(0.0);
  if (sprite) {
    vec3 center = m3.xyz;
    toward = normalize(camera.xyz - center);
    vec3 right = normalize(cross(-toward, abs(toward.y) > 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, -toward);
    world = vec4(center + right * position.x * length(m0.xyz) + up * position.y * length(m1.xyz), 1.0);
  }
  vec3 a = m0.xyz;
  vec3 b = m1.xyz;
  vec3 c = m2.xyz;
  mat3 normalMatrix = mat3(cross(b, c), cross(c, a), cross(a, b)) * sign(dot(a, cross(b, c)));
  gl_Position = viewProj * world;
  vNormal = normalMatrix * normal;
  vColor = tint * vec4(vertexColor, 1.0);
  vWorld = world.xyz;
  vUv = mix(region.xy, region.zw, uv);
  vShadowPos = (lightViewProj * world).xyz;
  vSprite = vec4(toward, sprite ? 1.0 : 0.0);
}`;

const FS = /* glsl */ `#version 300 es
precision highp float;
uniform vec4 light;      // xyz = direction towards the light, w = ambient
uniform vec4 shadow;     // x = soft, y = enabled, z = depth bias
uniform vec4 camera;
uniform vec4 fog;        // rgb = color, a = density
uniform vec4 lightColor;
uniform float shine;
uniform int mode;        // 0 opaque, 1 cutout, 2 blend
uniform sampler2D tex;
uniform highp sampler2D shadowMap;
in vec3 vNormal;
in vec4 vColor;
in vec3 vWorld;
in vec2 vUv;
in vec3 vShadowPos;
in vec4 vSprite;
out vec4 outColor;

float lit(ivec2 texel, float depth) {
  return depth <= texelFetch(shadowMap, texel, 0).r ? 1.0 : 0.0;
}

float shadowFactor(vec3 ndc) {
  if (shadow.y == 0.0) return 1.0;
  vec2 uv = ndc.xy * 0.5 + 0.5;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0))) || ndc.z > 1.0) return 1.0;
  float depth = ndc.z * 0.5 + 0.5 - shadow.z;
  ivec2 size = textureSize(shadowMap, 0);
  ivec2 center = ivec2(uv * vec2(size));
  if (shadow.x == 0.0) return lit(min(center, size - 1), depth);
  float sum = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      sum += lit(clamp(center + ivec2(x, y), ivec2(0), size - 1), depth);
    }
  }
  return sum / 9.0;
}

vec3 shade(vec3 normal, vec3 base) {
  vec3 n = normalize(normal);
  float s = shadowFactor(vShadowPos);
  float diffuse = max(dot(n, light.xyz), 0.0) * s;
  float hemisphere = mix(0.6, 1.0, n.y * 0.5 + 0.5);
  vec3 lighting = (light.w * hemisphere + (1.0 - light.w) * diffuse) * lightColor.rgb;
  float peak = max(base.r, max(base.g, base.b));
  float glow = clamp(peak - 1.0, 0.0, 1.0);
  vec3 color = mix(min(base, vec3(1.0)) * lighting, base / max(peak, 1.0), glow);
  if (shine > 0.0) {
    vec3 v = normalize(camera.xyz - vWorld);
    vec3 h = normalize(light.xyz + v);
    float highlight = pow(max(dot(n, h), 0.0), mix(16.0, 220.0, shine)) * shine * s;
    vec3 r = reflect(-v, n);
    vec3 sky = mix(vec3(0.16, 0.15, 0.14), fog.rgb * 1.08, smoothstep(-0.15, 0.35, r.y));
    float fresnel = 0.05 + 0.95 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    color = mix(color, sky, min(1.0, fresnel * shine)) + highlight * 1.6 * lightColor.rgb;
  }
  float d = distance(vWorld, camera.xyz) * fog.a;
  float f = (1.0 - exp(-d * d)) * (1.0 - glow * 0.75);
  return mix(color, fog.rgb, f);
}

void main() {
  vec4 texel = texture(tex, vUv);
  vec3 base = vColor.rgb * texel.rgb;
  if (mode == 0) {
    outColor = vec4(shade(vNormal, base), 1.0);
  } else if (mode == 1) {
    if (texel.a < 0.5) discard;
    outColor = vec4(shade(vNormal, base), 1.0);
  } else if (vSprite.w > 0.5) {
    vec2 p = vUv * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 >= 1.0) discard;
    vec3 toward = vSprite.xyz;
    vec3 right = normalize(cross(-toward, abs(toward.y) > 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, -toward);
    vec3 n = right * p.x - up * p.y + toward * sqrt(1.0 - r2);
    float soft = smoothstep(0.0, 0.8, 1.0 - r2);
    outColor = vec4(shade(n, base), vColor.a * texel.a * soft);
  } else {
    outColor = vec4(shade(vNormal, base), vColor.a * texel.a);
  }
}`;

const SHADOW_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 position;
layout(location = 4) in vec4 m0;
layout(location = 5) in vec4 m1;
layout(location = 6) in vec4 m2;
layout(location = 7) in vec4 m3;
uniform mat4 lightViewProj;
void main() {
  gl_Position = lightViewProj * mat4(m0, m1, m2, m3) * vec4(position, 1.0);
}`;

const SHADOW_FS = /* glsl */ `#version 300 es
precision mediump float;
void main() {}`;

type GL = WebGL2RenderingContext & { endFrameEXP?: () => void };

type MeshBuffers = {
  vertices: WebGLBuffer;
  indices: WebGLBuffer;
  indexType: number;
  indexCount: number;
  texture: WebGLTexture;
  cutout: boolean;
  shine: number;
};

type Only = "all" | "solid" | "cutout" | "blended" | "added";

export class GLRenderer {
  private scene: WebGLProgram;
  private shadowProgram: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private uShadowLightViewProj: WebGLUniformLocation | null;
  private matrixBuffer: WebGLBuffer;
  private colorBuffer: WebGLBuffer;
  private regionBuffer: WebGLBuffer;
  private shadowTexture?: WebGLTexture;
  private shadowFramebuffer?: WebGLFramebuffer;
  /** Offscreen target at the quality level's resolution, scaled up to the screen after drawing. */
  private target?: { framebuffer: WebGLFramebuffer; color: WebGLRenderbuffer; depth: WebGLRenderbuffer };
  private meshBuffers = new Map<number, MeshBuffers>();
  private textures = new Map<number, { texture: WebGLTexture; cutout: boolean }>();
  private shadowSize = 0;
  private softShadows = true;
  private width = 0;
  private height = 0;
  private projectionKey = NaN;
  private proj = mat4.create();
  private view = mat4.create();
  readonly viewProj = mat4.create();
  private lightView = mat4.create();
  private lightProj = mat4.create();
  private lightViewProj = mat4.create();
  private up = vec3.create(0, 1, 0);
  private north = vec3.create(0, 0, -1);
  private south = vec3.create(0, 0, 1);
  private lightDirection = vec3.create();
  private lightEye = vec3.create();
  private lightTarget = vec3.create();

  constructor(
    private gl: GL,
    private source: RenderSource,
    quality: QualityLevel,
  ) {
    this.scene = program(gl, VS, FS);
    this.shadowProgram = program(gl, SHADOW_VS, SHADOW_FS);
    for (const name of ["viewProj", "lightViewProj", "camera", "light", "shadow", "fog", "lightColor", "shine", "mode", "tex", "shadowMap"]) {
      this.u[name] = gl.getUniformLocation(this.scene, name);
    }
    this.uShadowLightViewProj = gl.getUniformLocation(this.shadowProgram, "lightViewProj");
    const instances = (floats: number) => {
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, Math.max(1, source.capacity) * floats * 4, gl.DYNAMIC_DRAW);
      return buffer;
    };
    this.matrixBuffer = instances(16);
    this.colorBuffer = instances(4);
    this.regionBuffer = instances(4);
    if (!source.regions) {
      const whole = new Float32Array(Math.max(1, source.capacity) * 4);
      for (let i = 0; i < whole.length; i += 4) whole.set([0, 0, 1, 1], i);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.regionBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, whole);
    }
    gl.useProgram(this.scene);
    gl.uniform1i(this.u.tex!, 0);
    gl.uniform1i(this.u.shadowMap!, 1);
    for (let i = A_POSITION; i <= A_REGION; i++) gl.enableVertexAttribArray(i);
    for (let i = A_MODEL; i <= A_REGION; i++) gl.vertexAttribDivisor(i, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    this.setQuality(quality);
  }

  setQuality(quality: QualityLevel) {
    this.softShadows = quality.softShadows;
    if (quality.shadowSize === this.shadowSize) return;
    const gl = this.gl;
    this.shadowSize = quality.shadowSize;
    if (this.shadowTexture) gl.deleteTexture(this.shadowTexture);
    if (this.shadowFramebuffer) gl.deleteFramebuffer(this.shadowFramebuffer);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, this.shadowSize, this.shadowSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shadowTexture = texture;
    this.shadowFramebuffer = framebuffer;
  }

  private updateLight(camera: Camera, light: Light, direction: Float32Array) {
    const extent = light.shadowExtent ?? 30;
    const texelWorld = (2 * extent) / this.shadowSize;
    const snap = (v: number) => Math.round(v / texelWorld) * texelWorld;
    vec3.set(snap(camera.target[0]), snap(camera.target[1]), snap(camera.target[2]), this.lightTarget);
    vec3.addScaled(this.lightTarget, direction, 60, this.lightEye);
    const up = Math.abs(direction[1]!) > 0.99 ? this.south : this.up;
    mat4.lookAt(this.lightEye, this.lightTarget, up, this.lightView);
    mat4.ortho(-extent, extent, -extent, extent, 1, 140, this.lightProj);
    mat4.multiply(this.lightProj, this.lightView, this.lightViewProj);
  }

  render(width: number, height: number, camera: Camera, light: Light, environment: Environment) {
    const gl = this.gl;
    const screenWidth = gl.drawingBufferWidth;
    const screenHeight = gl.drawingBufferHeight;
    width = Math.min(width, screenWidth);
    height = Math.min(height, screenHeight);
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.projectionKey = NaN;
      this.resizeTarget(width < screenWidth || height < screenHeight);
    }
    const key = camera.ortho ? -camera.ortho : camera.fov;
    if (key !== this.projectionKey) {
      const aspect = width / height;
      if (camera.ortho) {
        const h = camera.ortho;
        mat4.ortho(-h * aspect, h * aspect, -h, h, 0.1, 500, this.proj);
      } else {
        mat4.perspective(camera.fov, aspect, 0.1, 500, this.proj);
      }
      this.projectionKey = key;
    }
    const flat = Math.abs(camera.target[0] - camera.eye[0]) + Math.abs(camera.target[2] - camera.eye[2]) < 1e-6;
    mat4.lookAt(camera.eye, camera.target, flat ? this.north : this.up, this.view);
    mat4.multiply(this.proj, this.view, this.viewProj);

    const [lx, ly, lz] = light.direction;
    const direction = vec3.normalize(vec3.set(lx, ly, lz, this.lightDirection), this.lightDirection);
    const shadows = light.shadows ?? true;
    if (shadows) this.updateLight(camera, light, direction);

    const used = this.source.count;
    if (used > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.matrixBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.source.matrices.subarray(0, used * 16));
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.source.colors.subarray(0, used * 4));
      if (this.source.regions) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.regionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.source.regions.subarray(0, used * 4));
      }
    }

    if (shadows && used > 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFramebuffer!);
      gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(2, 2);
      gl.useProgram(this.shadowProgram);
      gl.uniformMatrix4fv(this.uShadowLightViewProj, false, this.lightViewProj);
      this.draw(used, 0, false, "all");
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.target?.framebuffer ?? null);
    gl.viewport(0, 0, width, height);
    const [br, bg, bb] = environment.background;
    gl.clearColor(br, bg, bb, 1);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (used > 0) {
      gl.useProgram(this.scene);
      const [cr, cg, cb] = light.color ?? WHITE_LIGHT;
      gl.uniformMatrix4fv(this.u.viewProj!, false, this.viewProj);
      gl.uniformMatrix4fv(this.u.lightViewProj!, false, this.lightViewProj);
      gl.uniform4f(this.u.camera!, camera.eye[0], camera.eye[1], camera.eye[2], 1);
      gl.uniform4f(this.u.light!, direction[0]!, direction[1]!, direction[2]!, light.ambient);
      gl.uniform4f(this.u.shadow!, this.softShadows ? 1 : 0, shadows ? 1 : 0, 0.0005, 0);
      gl.uniform4f(this.u.fog!, br, bg, bb, Math.max(0, environment.fog));
      gl.uniform4f(this.u.lightColor!, cr, cg, cb, 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture!);
      gl.activeTexture(gl.TEXTURE0);

      gl.disable(gl.BLEND);
      gl.uniform1i(this.u.mode!, MODE.opaque);
      this.draw(used, 0, true, "solid");
      gl.uniform1i(this.u.mode!, MODE.cutout);
      this.draw(used, 0, true, "cutout");
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.uniform1i(this.u.mode!, MODE.blend);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      this.draw(used, MAX_MESHES, true, "blended");
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ZERO, gl.ONE);
      this.draw(used, MAX_MESHES, true, "added");
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }
    if (this.target) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.target.framebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.blitFramebuffer(0, 0, width, height, 0, 0, screenWidth, screenHeight, gl.COLOR_BUFFER_BIT, gl.LINEAR);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.flush();
    gl.endFrameEXP?.();
  }

  /** (Re)creates the offscreen target at this.width x this.height, or drops it when drawing at full size. */
  private resizeTarget(scaled: boolean) {
    const gl = this.gl;
    if (this.target) {
      gl.deleteFramebuffer(this.target.framebuffer);
      gl.deleteRenderbuffer(this.target.color);
      gl.deleteRenderbuffer(this.target.depth);
      this.target = undefined;
    }
    if (!scaled) return;
    const color = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, color);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, this.width, this.height);
    const depth = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.target = { framebuffer, color, depth };
  }

  private draw(used: number, offset: number, textured: boolean, only: Only) {
    const gl = this.gl;
    const ranges = this.source.ranges;
    const end = Math.min(offset + MAX_MESHES, ranges.length / 2);
    for (let b = offset; b < end; b++) {
      const first = ranges[b * 2]!;
      const count = Math.min(ranges[b * 2 + 1]!, Math.max(0, used - first));
      if (count === 0) continue;
      const id = b - offset;
      const mesh = this.buffersFor(id);
      if (!mesh || (only === "solid" && mesh.cutout) || (only === "cutout" && !mesh.cutout)) continue;
      if ((only === "blended" && id === SHAPE_MESH.flame) || (only === "added" && id !== SHAPE_MESH.flame)) continue;
      if (textured) {
        gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
        gl.uniform1f(this.u.shine!, mesh.shine);
      }
      const stride = VERTEX_FLOATS * 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
      gl.vertexAttribPointer(A_POSITION, 3, gl.FLOAT, false, stride, 0);
      gl.vertexAttribPointer(A_NORMAL, 3, gl.FLOAT, false, stride, 12);
      gl.vertexAttribPointer(A_COLOR, 3, gl.FLOAT, false, stride, 24);
      gl.vertexAttribPointer(A_UV, 2, gl.FLOAT, false, stride, 36);
      // No base instance in GLES 3.0: start the instance attributes at `first` instead.
      gl.bindBuffer(gl.ARRAY_BUFFER, this.matrixBuffer);
      for (let i = 0; i < 4; i++) gl.vertexAttribPointer(A_MODEL + i, 4, gl.FLOAT, false, 64, first * 64 + i * 16);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.vertexAttribPointer(A_TINT, 4, gl.FLOAT, false, 16, first * 16);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.regionBuffer);
      gl.vertexAttribPointer(A_REGION, 4, gl.FLOAT, false, 16, first * 16);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
      gl.drawElementsInstanced(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0, count);
    }
  }

  private buffersFor(mesh: number) {
    let buffers = this.meshBuffers.get(mesh);
    if (buffers) return buffers;
    const info = meshInfo(mesh);
    if (!info) return undefined;
    const gl = this.gl;
    const { vertices, indices } = info.geometry;
    const short = vertices.length / VERTEX_FLOATS <= 0x10000;
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const ibo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, short ? Uint16Array.from(indices) : indices, gl.STATIC_DRAW);
    const texture = this.texture(info.texture ?? WHITE);
    buffers = {
      vertices: vbo,
      indices: ibo,
      indexType: short ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
      indexCount: indices.length,
      texture: texture.texture,
      cutout: texture.cutout,
      shine: info.shine ?? 0,
    };
    this.meshBuffers.set(mesh, buffers);
    return buffers;
  }

  private texture(id: number) {
    let entry = this.textures.get(id);
    if (entry) return entry;
    const gl = this.gl;
    const image = id === WHITE ? { width: 1, height: 1, pixels: new Uint8Array([255, 255, 255, 255]) } : textureImage(id);
    const texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.pixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    entry = { texture, cutout: hasCutout(image.pixels) };
    this.textures.set(id, entry);
    return entry;
  }

  /** Frees every GL object this renderer made. */
  dispose() {
    const gl = this.gl;
    for (const m of this.meshBuffers.values()) {
      gl.deleteBuffer(m.vertices);
      gl.deleteBuffer(m.indices);
    }
    for (const t of this.textures.values()) gl.deleteTexture(t.texture);
    for (const b of [this.matrixBuffer, this.colorBuffer, this.regionBuffer]) gl.deleteBuffer(b);
    if (this.shadowTexture) gl.deleteTexture(this.shadowTexture);
    if (this.shadowFramebuffer) gl.deleteFramebuffer(this.shadowFramebuffer);
    this.resizeTarget(false);
    gl.deleteProgram(this.scene);
    gl.deleteProgram(this.shadowProgram);
    this.meshBuffers.clear();
    this.textures.clear();
  }
}

function program(gl: GL, vs: string, fs: string) {
  const compile = (type: number, code: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`GL shader: ${gl.getShaderInfoLog(shader) ?? "compile failed"}`);
    }
    return shader;
  };
  const p = gl.createProgram()!;
  const v = compile(gl.VERTEX_SHADER, vs);
  const f = compile(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`GL program: ${gl.getProgramInfoLog(p) ?? "link failed"}`);
  gl.deleteShader(v);
  gl.deleteShader(f);
  return p;
}

function hasCutout(pixels: Uint8Array) {
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i]! < 128) return true;
  return false;
}
