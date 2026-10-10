import { mat4, vec3 } from "wgpu-matrix";
import type { RNCanvasContext } from "react-native-webgpu";
import { createCube } from "./cube";
import { SHADER } from "./shader";
import type { Simulation } from "./types";

const DEPTH_FORMAT: GPUTextureFormat = "depth24plus";
const SAMPLES = 4;

export class Renderer {
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private indexCount: number;
  private globals: GPUBuffer;
  private globalsData = new Float32Array(16 + 4);
  private instances: GPUBuffer;
  private msaaView?: GPUTextureView;
  private depthView?: GPUTextureView;
  private width = 0;
  private height = 0;
  private viewProj = mat4.create();
  private proj = mat4.create();
  private view = mat4.create();

  constructor(
    private device: GPUDevice,
    private context: RNCanvasContext,
    private format: GPUTextureFormat,
    private sim: Simulation,
  ) {
    const cube = createCube();
    this.indexCount = cube.indices.length;

    this.vertexBuffer = device.createBuffer({
      size: cube.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, cube.vertices);

    this.indexBuffer = device.createBuffer({
      size: cube.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.indexBuffer, 0, cube.indices);

    this.globals = device.createBuffer({
      size: this.globalsData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.instances = device.createBuffer({
      size: sim.matrices.byteLength,
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
        { binding: 1, resource: { buffer: this.instances } },
      ],
    });

    this.globalsData.set([0.4, 0.8, 0.5, 0], 16);
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
    mat4.perspective(Math.PI / 3, width / height, 0.1, 500, this.proj);
  }

  render(width: number, height: number, time: number) {
    this.resize(width, height);

    const r = 60;
    mat4.lookAt([Math.sin(time * 0.2) * r, 35, Math.cos(time * 0.2) * r], [0, 0, 0], vec3.create(0, 1, 0), this.view);
    mat4.multiply(this.proj, this.view, this.viewProj);
    this.globalsData.set(this.viewProj, 0);

    const queue = this.device.queue;
    queue.writeBuffer(this.globals, 0, this.globalsData);
    queue.writeBuffer(this.instances, 0, this.sim.matrices);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.msaaView!,
          resolveTarget: this.context.getCurrentTexture().createView(),
          clearValue: [0.05, 0.06, 0.09, 1],
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
    pass.drawIndexed(this.indexCount, this.sim.count);
    pass.end();
    queue.submit([encoder.finish()]);
    this.context.present();
  }
}
