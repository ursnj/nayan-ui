import { mat4, vec3 } from "wgpu-matrix";
import type { RNCanvasContext } from "react-native-webgpu";
import { createMeshes } from "./meshes";
import { SHADER } from "./shader";
import type { Camera, Light, RenderSource } from "./types";

const DEPTH_FORMAT: GPUTextureFormat = "depth24plus";
const SAMPLES = 4;
const MESH_COUNT = 3;

export const defaultCamera = (): Camera => ({ eye: [0, 40, 60], target: [0, 0, 0], fov: Math.PI / 3 });
export const defaultLight = (): Light => ({ direction: [0.4, 0.8, 0.5], ambient: 0.35 });

export class Renderer {
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private meshes = createMeshes();
  private globals: GPUBuffer;
  private globalsData = new Float32Array(16 + 4);
  private matrixBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private msaaView?: GPUTextureView;
  private depthView?: GPUTextureView;
  private width = 0;
  private height = 0;
  private fov = 0;
  private proj = mat4.create();
  private view = mat4.create();
  private viewProj = mat4.create();
  private up = vec3.create(0, 1, 0);

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
    // Index buffer size must be a multiple of 4 bytes.
    this.indexBuffer = device.createBuffer({
      size: Math.ceil(indices.byteLength / 4) * 4,
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

    const module = device.createShaderModule({ code: SHADER });
    this.pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 24,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 12, format: "float32x3" },
            ],
          },
        ],
      },
      fragment: { module, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "triangle-list", cullMode: "back" },
      depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: "less" },
      multisample: { count: SAMPLES },
    });
    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.globals } },
        { binding: 1, resource: { buffer: this.matrixBuffer } },
        { binding: 2, resource: { buffer: this.colorBuffer } },
      ],
    });
  }

  private resize(width: number, height: number) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    const size = { width, height };
    this.msaaView = this.device
      .createTexture({ size, format: this.format, sampleCount: SAMPLES, usage: GPUTextureUsage.RENDER_ATTACHMENT })
      .createView();
    this.depthView = this.device
      .createTexture({ size, format: DEPTH_FORMAT, sampleCount: SAMPLES, usage: GPUTextureUsage.RENDER_ATTACHMENT })
      .createView();
    this.fov = 0; // force projection rebuild
  }

  render(width: number, height: number, camera: Camera, light: Light) {
    this.resize(width, height);
    if (camera.fov !== this.fov) {
      mat4.perspective(camera.fov, width / height, 0.1, 500, this.proj);
      this.fov = camera.fov;
    }
    mat4.lookAt(camera.eye, camera.target, this.up, this.view);
    mat4.multiply(this.proj, this.view, this.viewProj);

    const [lx, ly, lz] = light.direction;
    const len = Math.hypot(lx, ly, lz) || 1;
    this.globalsData.set(this.viewProj, 0);
    this.globalsData.set([lx / len, ly / len, lz / len, light.ambient], 16);

    const queue = this.device.queue;
    const used = this.source.count;
    queue.writeBuffer(this.globals, 0, this.globalsData);
    if (used > 0) {
      queue.writeBuffer(this.matrixBuffer, 0, this.source.matrices, 0, used * 16);
      queue.writeBuffer(this.colorBuffer, 0, this.source.colors, 0, used * 4);
    }

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.msaaView!,
          resolveTarget: this.context.getCurrentTexture().createView(),
          clearValue: [0.04, 0.05, 0.09, 1],
          loadOp: "clear",
          storeOp: "discard", // MSAA target never leaves tile memory
        },
      ],
      depthStencilAttachment: {
        view: this.depthView!,
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    const ranges = this.source.ranges;
    for (let m = 0; m < MESH_COUNT; m++) {
      const count = ranges[m * 2 + 1]!;
      if (count === 0) continue;
      const mesh = this.meshes.ranges[m]!;
      pass.drawIndexed(mesh.indexCount, count, mesh.firstIndex, mesh.baseVertex, ranges[m * 2]!);
    }
    pass.end();
    queue.submit([encoder.finish()]);
    this.context.present();
  }
}
