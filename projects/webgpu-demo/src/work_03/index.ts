import {WebGPUBase} from 'src/base'
import shaderModuleCode from './full.wgsl'
class MP4PWebGPUPlayer extends WebGPUBase {
  public pipeline!: GPURenderPipeline
  public sampler!: GPUSampler
  public vertexBuffer!: GPUBuffer
  constructor() {
    super()
    this.setup()
  }
  async setup() {
    await super.setup()
    this.setPipe()
    this.setSampler()
    this.startToRender()
  }
  setPipe() {
    const {device, presentationFormat} = this
    const cellShaderModule = device.createShaderModule(shaderModuleCode)
    //
    const ver = this.verPos
    this.vertexBuffer = this.device.createBuffer({
      size: ver.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true, // 创建时立刻映射，让 CPU 端能读写数据
    })
    // 让 GPUBuffer 映射出一块 CPU 端的内存，即 ArrayBuffer，此时这个 Float32Array 仍是空的
    const mappedBuffer = new Float32Array(this.vertexBuffer.getMappedRange())
    // 将数据传入这个 Float32Array
    mappedBuffer.set(ver)
    // 令 GPUBuffer 解除映射，此时 verticesBufferArray 那块内存才能被 GPU 访问
    this.vertexBuffer.unmap()
    //
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: cellShaderModule,
        entryPoint: 'vertMain',
      },
      fragment: {
        module: cellShaderModule,
        entryPoint: 'fragMain',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    })
  }
  setSampler() {
    const {device} = this
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })
  }
  render = () => {
    const {device, video, context, pipeline} = this
    const uniformBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 1,
          resource: this.sampler,
        },
        {
          binding: 2,
          resource: device.importExternalTexture({
            source: video,
          }),
        },
      ],
    })

    const commandEncoder = device.createCommandEncoder()
    const textureView = context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: [0, 0, 0, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, uniformBindGroup)
    //
    const {vertexBuffer} = this
    passEncoder.setVertexBuffer(0, vertexBuffer)
    passEncoder.draw(6)
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])

    //
    video.requestVideoFrameCallback(this.render)
  }
  async startToRender() {
    await this.video.play()
    this.video.requestVideoFrameCallback(this.render)
  }
}

export default new MP4PWebGPUPlayer()
