import { mat4, vec3 } from "wgpu-matrix";
import type { RNCanvasContext } from "react-native-webgpu";
import { createMeshes } from "./meshes";
import { SHADER } from "./shader";
import type { Camera, Light, RenderSource } from "../types";

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
const MESH_COUNT = 3;
const GLOBALS_FLOATS = 16 + 16 + 4 + 4 + 4 + 4;

export const defaultCamera = (): Camera => ({ eye: [0, 40, 60], target: [0, 0, 0], fov: Math.PI / 3 });
export const defaultLight = (): Light => ({ direction: [0.4, 0.8, 0.5], ambient: 0.35 });

export class Renderer {
  private pipeline: GPURenderPipeline;
  private shadowPipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private shadowBindGroup: GPUBindGroup;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private meshes = createMeshes();
  private globals: GPUBuffer;
  private globalsData = new Float32Array(GLOBALS_FLOATS);
  private matrixBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private shadowView: GPUTextureView;
  private msaa?: GPUTexture;
  private depth?: GPUTexture;
  private width = 0;
  private height = 0;
  private fov = 0;
  private proj = mat4.create();
  private view = mat4.create();
  private viewProj = mat4.create();
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
    const { vertices, indices } = this.meshes;
    this.vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    this.indexBuffer = device.createBuffer({
      size: indices.byteLength, // meshes pads to a multiple of 4 bytes
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.globals = device.createBuffer({
      size: this.globalsData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.matrixBuffer = device.createBuffer({
      size: Math.max(64, source.capacity * 64),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.colorBuffer = device.createBuffer({
      size: Math.max(16, source.capacity * 16),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.shadowView = device
      .createTexture({
        size: { width: SHADOW_SIZE, height: SHADOW_SIZE },
        format: SHADOW_FORMAT,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      })
      .createView();

    const module = device.createShaderModule({ code: SHADER });
    const vertexLayout: GPUVertexBufferLayout = {
      arrayStride: 24,
      attributes: [
        { shaderLocation: 0, offset: 0, format: "float32x3" },
        { shaderLocation: 1, offset: 12, format: "float32x3" },
      ],
    };
    this.pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module, entryPoint: "vs", buffers: [vertexLayout] },
      fragment: { module, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "triangle-list", cullMode: "back" },
      depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: "less" },
      multisample: { count: SAMPLES },
    });
    this.shadowPipeline = device.createRenderPipeline({
      layout: "auto",
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
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.globals } },
        { binding: 1, resource: { buffer: this.matrixBuffer } },
        { binding: 2, resource: { buffer: this.colorBuffer } },
        { binding: 3, resource: this.shadowView },
      ],
    });
    // "auto" layouts only contain the bindings an entry point uses, so the shadow pass needs its own group.
    this.shadowBindGroup = device.createBindGroup({
      layout: this.shadowPipeline.getBindGroupLayout(0),
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
    this.fov = 0; // force projection rebuild
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
    if (camera.fov !== this.fov) {
      mat4.perspective(camera.fov, width / height, 0.1, 500, this.proj);
      this.fov = camera.fov;
    }
    mat4.lookAt(camera.eye, camera.target, this.up, this.view);
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
      this.drawAll(pass, used);
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
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    if (used > 0) this.drawAll(pass, used);
    pass.end();
    queue.submit([encoder.finish()]);
    this.context.present();
  }

  /** One instanced draw per mesh. Ranges are clamped to `used` so a stale buffer can't overrun. */
  private drawAll(pass: GPURenderPassEncoder, used: number) {
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    const ranges = this.source.ranges;
    for (let m = 0; m < MESH_COUNT; m++) {
      const first = ranges[m * 2]!;
      const count = Math.min(ranges[m * 2 + 1]!, Math.max(0, used - first));
      if (count === 0) continue;
      const mesh = this.meshes.ranges[m]!;
      pass.drawIndexed(mesh.indexCount, count, mesh.firstIndex, mesh.baseVertex, first);
    }
  }
}
