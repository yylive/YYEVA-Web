import {WebGPUBase} from 'src/base'
import {code} from './full'

class MP4PWebGPUPlayer extends WebGPUBase {
  public pipeline!: GPURenderPipeline
  public sampler!: GPUSampler
  public vertexBuffer!: GPUBuffer
  public pipelineLayout!: GPUPipelineLayout
  public bindGroupLayout!: GPUBindGroupLayout
  public uniformBindGroup!: GPUBindGroup
  public uniformBuffer!: GPUBuffer

  constructor() {
    super()
    this.setup()
  }

  async setup() {
    await super.setup()
    await this.video.play()
    this.setSampler()
    this.setUniform()
    this.setLayout()
    this.setPipeline()
    this.startToRender()
  }

  setUniform() {
    const {device} = this
    const u_scale = this.getScale()
    const scaleData = new Float32Array(u_scale)

    this.uniformBuffer = device.createBuffer({
      size: scaleData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(this.uniformBuffer, 0, scaleData.buffer)
  }

  setLayout() {
    const {device} = this
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {type: 'uniform'},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {type: 'filtering'},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          externalTexture: {},
        },
      ],
    })

    this.pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    })
  }

  setSampler() {
    const {device} = this

    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    })
  }

  setPipeline() {
    const {device, presentationFormat} = this
    const shaderModule = device.createShaderModule({code})
    const vertexBufferLayout = this.createVertexBufferLayout()

    this.pipeline = device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertMain',
        // buffers: vertexBufferLayout,
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragMain',
        targets: [{format: presentationFormat}],
      },
      primitive: {topology: 'triangle-list'},
    })
  }

  render = () => {
    const {device, video, context, pipeline, sampler, vertexBuffer} = this

    this.uniformBindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.uniformBuffer}},
        {binding: 1, resource: sampler},
        {binding: 2, resource: device.importExternalTexture({source: video})},
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
    //
    // 设置视口
    passEncoder.setViewport(0, 0, context.canvas.width, context.canvas.height, 0, 1)

    // 设置剪裁矩形
    passEncoder.setScissorRect(0, 0, context.canvas.width, context.canvas.height)
    //
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, this.uniformBindGroup)
    passEncoder.setVertexBuffer(0, vertexBuffer)
    passEncoder.draw(6)
    passEncoder.end()

    device.queue.submit([commandEncoder.finish()])

    video.requestVideoFrameCallback(this.render)
  }

  async startToRender() {
    this.video.requestVideoFrameCallback(this.render)
  }

  createVertexBufferLayout(): GPUVertexState['buffers'] {
    const ver = this.verPos

    this.vertexBuffer = this.device.createBuffer({
      size: ver.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })

    const mappedBuffer = new Float32Array(this.vertexBuffer.getMappedRange())
    mappedBuffer.set(ver)
    this.vertexBuffer.unmap()

    return [
      {
        arrayStride: ver.BYTES_PER_ELEMENT * 6,
        attributes: [
          {shaderLocation: 0, offset: 0, format: 'float32x2'},
          {shaderLocation: 1, offset: ver.BYTES_PER_ELEMENT * 2, format: 'float32x2'},
          {shaderLocation: 2, offset: ver.BYTES_PER_ELEMENT * 4, format: 'float32x2'},
        ],
      },
    ]
  }
}

export default new MP4PWebGPUPlayer()
