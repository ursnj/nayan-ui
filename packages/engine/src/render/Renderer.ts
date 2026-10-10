import { mat4, vec3 } from "wgpu-matrix";
import type { RNCanvasContext } from "react-native-webgpu";
import { textureImage } from "../assets/texture";
import { meshInfo, VERTEX_FLOATS } from "./meshes";
import { SHADER } from "./shader";
import { MAX_MESHES, type Camera, type Light, type RenderSource } from "../types";

/** Clear color and fog. Fog fades geometry towards `background` with distance. */
export type Environment = {
  background: readonly [number, number, number];
  /** Fog density (roughly 1 / distance at which things are mostly fogged). 0 = off. */
  fog: number;
};

const DEPTH_FORMAT: GPUTextureFormat = "depth24plus";
const SHADOW_FORMAT: GPUTextureFormat = "depth32float";
const SHADOW_SIZE = 2048;
const SAMPLES = 4;
const GLOBALS_FLOATS = 16 + 16 + 4 + 4 + 4 + 4;
const WHITE = -1; // texture key for meshes without a texture

export const defaultCamera = (): Camera => ({ eye: [0, 40, 60], target: [0, 0, 0], fov: Math.PI / 3 });
export const defaultLight = (): Light => ({ direction: [0.4, 0.8, 0.5], ambient: 0.35 });

type MeshBuffers = { vertices: GPUBuffer; indices: GPUBuffer; indexCount: number; textureGroup: GPUBindGroup };

export class Renderer {
  private pipeline: GPURenderPipeline;
  private blendPipeline: GPURenderPipeline;
  private shadowPipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private shadowBindGroup: GPUBindGroup;
  private textureLayout: GPUBindGroupLayout;
  private sampler: GPUSampler;
  /** GPU geometry per mesh id, uploaded the first time an entity uses that mesh. */
  private meshBuffers = new Map<number, MeshBuffers>();
  /** Texture bind group per texture id (WHITE for none), uploaded on first use. */
  private textureGroups = new Map<number, GPUBindGroup>();
  private globals: GPUBuffer;
  private globalsData = new Float32Array(GLOBALS_FLOATS);
  private matrixBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private regionBuffer: GPUBuffer;
  private shadowView: GPUTextureView;
  private msaa?: GPUTexture;
  private depth?: GPUTexture;
  private width = 0;
  private height = 0;
  private projectionKey = "";
  private proj = mat4.create();
  private view = mat4.create();
  /** The camera matrix of the last frame (for picking and projecting to the screen). */
  readonly viewProj = mat4.create();
  private lightView = mat4.create();
  private lightProj = mat4.create();
  private lightViewProj = mat4.create();
  private up = vec3.create(0, 1, 0);
  private lightEye = vec3.create();
  private lightTarget = vec3.create();

  constructor(
    private device: GPUDevice,
    private context: RNCanvasContext,
    private format: GPUTextureFormat,
    private source: RenderSource,
  ) {
    this.globals = device.createBuffer({
      size: this.globalsData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const instances = (floats: number) =>
      device.createBuffer({
        size: Math.max(floats * 4, source.capacity * floats * 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    this.matrixBuffer = instances(16);
    this.colorBuffer = instances(4);
    this.regionBuffer = instances(4);
    if (!source.regions) {
      // Sources without regions show whole textures.
      const whole = new Float32Array(Math.max(1, source.capacity) * 4);
      for (let i = 0; i < whole.length; i += 4) whole.set([0, 0, 1, 1], i);
      device.queue.writeBuffer(this.regionBuffer, 0, whole);
    }
    this.shadowView = device
      .createTexture({
        size: { width: SHADOW_SIZE, height: SHADOW_SIZE },
        format: SHADOW_FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      })
      .createView();
    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "repeat",
      addressModeV: "repeat",
    });

    const V = GPUShaderStage.VERTEX;
    const F = GPUShaderStage.FRAGMENT;
    const sceneLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: V | F, buffer: { type: "uniform" } },
        { binding: 1, visibility: V, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: V, buffer: { type: "read-only-storage" } },
        { binding: 3, visibility: F, texture: { sampleType: "depth" } },
        { binding: 4, visibility: V, buffer: { type: "read-only-storage" } },
      ],
    });
    this.textureLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: F, texture: { sampleType: "float" } },
        { binding: 1, visibility: F, sampler: { type: "filtering" } },
      ],
    });
    // The shadow pass writes the shadow map, so it can't bind it: it gets a layout without it.
    const shadowLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: V, buffer: { type: "uniform" } },
        { binding: 1, visibility: V, buffer: { type: "read-only-storage" } },
      ],
    });

    const module = device.createShaderModule({ code: SHADER });
    const vertexLayout: GPUVertexBufferLayout = {
      arrayStride: VERTEX_FLOATS * 4,
      attributes: [
        { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
        { shaderLocation: 1, offset: 12, format: "float32x3" }, // normal
        { shaderLocation: 2, offset: 24, format: "float32x3" }, // color
        { shaderLocation: 3, offset: 36, format: "float32x2" }, // uv
      ],
    };
    const layout = device.createPipelineLayout({ bindGroupLayouts: [sceneLayout, this.textureLayout] });
    const scenePipeline = (entryPoint: string, transparent: boolean) =>
      device.createRenderPipeline({
        layout,
        vertex: { module, entryPoint: "vs", buffers: [vertexLayout] },
        fragment: {
          module,
          entryPoint,
          targets: [
            transparent
              ? {
                  format,
                  blend: {
                    color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
                    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
                  },
                }
              : { format },
          ],
        },
        primitive: { topology: "triangle-list", cullMode: "back" },
        // See-through surfaces are tested against depth but don't hide what's behind them.
        depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: !transparent, depthCompare: "less" },
        multisample: { count: SAMPLES },
      });
    this.pipeline = scenePipeline("fs_opaque", false);
    this.blendPipeline = scenePipeline("fs_blend", true);
    this.shadowPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [shadowLayout] }),
      vertex: { module, entryPoint: "vs_shadow", buffers: [vertexLayout] },
      primitive: { topology: "triangle-list", cullMode: "back" },
      // Slope-scaled bias keeps surfaces from shadowing themselves ("acne").
      depthStencil: {
        format: SHADOW_FORMAT,
        depthWriteEnabled: true,
        depthCompare: "less",
        depthBias: 2,
        depthBiasSlopeScale: 2,
      },
    });

    this.bindGroup = device.createBindGroup({
      layout: sceneLayout,
      entries: [
        { binding: 0, resource: { buffer: this.globals } },
        { binding: 1, resource: { buffer: this.matrixBuffer } },
        { binding: 2, resource: { buffer: this.colorBuffer } },
        { binding: 3, resource: this.shadowView },
        { binding: 4, resource: { buffer: this.regionBuffer } },
      ],
    });
    this.shadowBindGroup = device.createBindGroup({
      layout: shadowLayout,
      entries: [
        { binding: 0, resource: { buffer: this.globals } },
        { binding: 1, resource: { buffer: this.matrixBuffer } },
      ],
    });
  }

  private resize(width: number, height: number) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.msaa?.destroy();
    this.depth?.destroy();
    const size = { width, height };
    this.msaa = this.device.createTexture({
      size,
      format: this.format,
      sampleCount: SAMPLES,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depth = this.device.createTexture({
      size,
      format: DEPTH_FORMAT,
      sampleCount: SAMPLES,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.projectionKey = ""; // force projection rebuild
  }

  /** Orthographic light camera covering `extent` around the camera target, snapped to texels to avoid shimmer. */
  private updateLight(camera: Camera, light: Light, direction: Float32Array) {
    const extent = light.shadowExtent ?? 30;
    const texelWorld = (2 * extent) / SHADOW_SIZE;
    const snap = (v: number) => Math.round(v / texelWorld) * texelWorld;
    vec3.set(snap(camera.target[0]), snap(camera.target[1]), snap(camera.target[2]), this.lightTarget);
    vec3.addScaled(this.lightTarget, direction, 60, this.lightEye);
    const up = Math.abs(direction[1]!) > 0.99 ? vec3.create(0, 0, 1) : this.up;
    mat4.lookAt(this.lightEye, this.lightTarget, up, this.lightView);
    mat4.ortho(-extent, extent, -extent, extent, 1, 140, this.lightProj);
    mat4.multiply(this.lightProj, this.lightView, this.lightViewProj);
  }

  render(width: number, height: number, camera: Camera, light: Light, environment: Environment) {
    this.resize(width, height);
    const key = camera.ortho ? `o${camera.ortho}` : `p${camera.fov}`;
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
    // Looking straight down (board games) needs a different "up" than the world's.
    const flat = Math.abs(camera.target[0] - camera.eye[0]) + Math.abs(camera.target[2] - camera.eye[2]) < 1e-6;
    mat4.lookAt(camera.eye, camera.target, flat ? [0, 0, -1] : this.up, this.view);
    mat4.multiply(this.proj, this.view, this.viewProj);

    const direction = vec3.normalize(vec3.create(...light.direction));
    const shadows = light.shadows ?? true;
    if (shadows) this.updateLight(camera, light, direction);
    const g = this.globalsData;
    g.set(this.viewProj, 0);
    g.set(this.lightViewProj, 16);
    g.set([direction[0]!, direction[1]!, direction[2]!, light.ambient], 32);
    g.set([0, shadows ? 1 : 0, 0.0005, 0], 36);
    const [br, bg, bb] = environment.background;
    g.set([camera.eye[0], camera.eye[1], camera.eye[2], 0], 40);
    g.set([br, bg, bb, Math.max(0, environment.fog)], 44);

    const queue = this.device.queue;
    const used = this.source.count;
    queue.writeBuffer(this.globals, 0, g);
    if (used > 0) {
      queue.writeBuffer(this.matrixBuffer, 0, this.source.matrices, 0, used * 16);
      queue.writeBuffer(this.colorBuffer, 0, this.source.colors, 0, used * 4);
      if (this.source.regions) queue.writeBuffer(this.regionBuffer, 0, this.source.regions, 0, used * 4);
    }

    const encoder = this.device.createCommandEncoder();
    if (shadows && used > 0) {
      const pass = encoder.beginRenderPass({
        colorAttachments: [],
        depthStencilAttachment: {
          view: this.shadowView,
          depthClearValue: 1,
          depthLoadOp: "clear",
          depthStoreOp: "store",
        },
      });
      pass.setPipeline(this.shadowPipeline);
      pass.setBindGroup(0, this.shadowBindGroup);
      this.draw(pass, used, 0, false); // see-through instances don't cast shadows
      pass.end();
    }

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.msaa!.createView(),
          resolveTarget: this.context.getCurrentTexture().createView(),
          clearValue: [br, bg, bb, 1],
          loadOp: "clear",
          storeOp: "discard", // MSAA target never leaves tile memory
        },
      ],
      depthStencilAttachment: {
        view: this.depth!.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
    });
    if (used > 0) {
      pass.setBindGroup(0, this.bindGroup);
      pass.setPipeline(this.pipeline);
      this.draw(pass, used, 0, true);
      pass.setPipeline(this.blendPipeline);
      this.draw(pass, used, MAX_MESHES, true); // see-through instances last, over the solid scene
    }
    pass.end();
    queue.submit([encoder.finish()]);
    this.context.present();
  }

  /**
   * One instanced draw per mesh, for the ranges starting at bucket `offset` (0 = opaque,
   * MAX_MESHES = transparent). Ranges are clamped to `used` so a stale buffer can't overrun.
   */
  private draw(pass: GPURenderPassEncoder, used: number, offset: number, textured: boolean) {
    const ranges = this.source.ranges;
    const end = Math.min(offset + MAX_MESHES, ranges.length / 2);
    for (let b = offset; b < end; b++) {
      const first = ranges[b * 2]!;
      const count = Math.min(ranges[b * 2 + 1]!, Math.max(0, used - first));
      if (count === 0) continue;
      const mesh = this.buffersFor(b - offset);
      if (!mesh) continue;
      if (textured) pass.setBindGroup(1, mesh.textureGroup);
      pass.setVertexBuffer(0, mesh.vertices);
      pass.setIndexBuffer(mesh.indices, "uint32");
      pass.drawIndexed(mesh.indexCount, count, 0, 0, first);
    }
  }

  private buffersFor(mesh: number) {
    let buffers = this.meshBuffers.get(mesh);
    if (buffers) return buffers;
    const info = meshInfo(mesh);
    if (!info) return undefined; // "none", or an unknown id: nothing to draw
    const upload = (data: Float32Array | Uint32Array, usage: number) => {
      const buffer = this.device.createBuffer({ size: Math.max(4, data.byteLength), usage: usage | GPUBufferUsage.COPY_DST });
      this.device.queue.writeBuffer(buffer, 0, data);
      return buffer;
    };
    buffers = {
      vertices: upload(info.geometry.vertices, GPUBufferUsage.VERTEX),
      indices: upload(info.geometry.indices, GPUBufferUsage.INDEX),
      indexCount: info.geometry.indices.length,
      textureGroup: this.textureGroup(info.texture ?? WHITE),
    };
    this.meshBuffers.set(mesh, buffers);
    return buffers;
  }

  private textureGroup(id: number) {
    let group = this.textureGroups.get(id);
    if (group) return group;
    const image = id === WHITE ? { width: 1, height: 1, pixels: new Uint8Array([255, 255, 255, 255]) } : textureImage(id);
    const texture = this.device.createTexture({
      size: { width: image.width, height: image.height },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.device.queue.writeTexture({ texture }, image.pixels, { bytesPerRow: image.width * 4 }, { width: image.width, height: image.height });
    group = this.device.createBindGroup({
      layout: this.textureLayout,
      entries: [
        { binding: 0, resource: texture.createView() },
        { binding: 1, resource: this.sampler },
      ],
    });
    this.textureGroups.set(id, group);
    return group;
  }
}
