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
    //
    const uniformArray = new Float32Array(u_scale)
    // 缓冲映射，创建映射（Mapping）后的某块显存，就能被 CPU 访问
    const uniformBuffer = device.createBuffer({
      size: uniformArray.byteLength,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true,
    })
    // 然后马上就可以获取映射后的 ArrayBuffer
    const mappedBuffer = new Float32Array(uniformBuffer.getMappedRange())
    mappedBuffer.set(uniformArray)
    // 解映射，还管理权给 GPU
    uniformBuffer.unmap()
    //
    this.uniformBuffer = uniformBuffer
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
    const buffers = this.createVertexBufferLayout()

    this.pipeline = device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertMain',
        buffers,
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
    // passEncoder.setViewport(0, 0, context.canvas.width, context.canvas.height, 0, 1)    // 设置视口
    // passEncoder.setScissorRect(0, 0, context.canvas.width, context.canvas.height)    // 设置剪裁矩形
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
  public get verriceArray() {
    const alphaDirection = 'right'
    //默认为左右均分
    const vW = this.video.videoWidth ? this.video.videoWidth : 1800
    const vH = this.video.videoHeight ? this.video.videoHeight : 1000
    const stageW = vW / 2
    const [rgbX, rgbY, rgbW, rgbH] = alphaDirection === 'right' ? [0, 0, stageW, vH] : [stageW, 0, stageW, vH]
    const [aX, aY, aW, aH] = alphaDirection === 'right' ? [stageW, 0, stageW, vH] : [0, 0, stageW, vH]
    const ver = []
    const rgbCoord = this.computeCoord(rgbX, rgbY, rgbW, rgbH, vW, vH)
    const aCoord = this.computeCoord(aX, aY, aW, aH, vW, vH)
    // =====a_position | a_texCoord | a_alpha_texCoord
    // ver.push(...[1, 1, 0.5, 0, 1, 0])
    // ver.push(...[1, -1, 0.5, 1, 1, 1])
    // ver.push(...[-1, -1, 0, 1, 0.5, 1])
    // ver.push(...[1, 1, 0.5, 0, 1, 0])
    // ver.push(...[-1, -1, 0, 1, 0.5, 1])
    // ver.push(...[-1, 1, 0, 0, 0.5, 0])
    //===  `leftX, rightX, bottomY, topY` 只能 X跟Y组合
    ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]])
    ver.push(...[1, -1, rgbCoord[1], rgbCoord[3], aCoord[1], aCoord[3]])
    ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]])
    ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]])
    ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]])
    ver.push(...[-1, 1, rgbCoord[0], rgbCoord[2], aCoord[0], aCoord[2]])
    //
    return new Float32Array(ver)
  }
  createVertexBufferLayout(): GPUVertexState['buffers'] {
    const vertices = this.verriceArray
    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })
    const mappedBuffer = new Float32Array(this.vertexBuffer.getMappedRange())
    mappedBuffer.set(vertices)
    this.vertexBuffer.unmap()

    return [
      {
        arrayStride: vertices.BYTES_PER_ELEMENT * 6, // 6 floats per vertex (2 for position, 2 for texCoord,2 for a_alpha_texCoord)
        attributes: [
          {shaderLocation: 0, offset: 0, format: 'float32x2'},
          {shaderLocation: 1, offset: 2 * vertices.BYTES_PER_ELEMENT, format: 'float32x2'},
          {shaderLocation: 2, offset: 4 * vertices.BYTES_PER_ELEMENT, format: 'float32x2'},
        ],
      },
    ]
  }
}

export default new MP4PWebGPUPlayer()
