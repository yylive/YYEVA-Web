import {WebGPUBase} from 'src/base'
import fullCode from './full.wgsl'
class MP4PWebGPUPlayer extends WebGPUBase {
  public pipeline!: GPURenderPipeline
  public sampler!: GPUSampler
  public vertexBuffer!: GPUBuffer
  //
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
    //
    this.setSampler()
    this.setLayout()
    this.setPipe()
    this.startToRender()
  }
  setLayout() {
    const {device, video, sampler} = this
    // create a buffer for the uniform values
    // const uniformBufferSize =
    //   4 * 4 + // u_scale is 4 32bit floats (4bytes each)
    //   2 * 4 + // scale is 2 32bit floats (4bytes each)
    //   2 * 4 // offset is 2 32bit floats (4bytes each)
    // offsets to the various uniform values in float32 indices
    // const kColorOffset = 0;
    // const kScaleOffset = 4;
    // const kOffsetOffset = 6;
    // uniformValues.set([0, 1, 0, 1], kColorOffset);        // set the color kColorOffset 字节间隔
    // uniformValues.set([-0.5, -0.25], kOffsetOffset);      // set the offset
    // ============
    const u_scale = this.getScale()
    const scaleData = new Float32Array(u_scale)
    this.uniformBuffer = device.createBuffer({
      size: scaleData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    // COPY_DST 通常就意味着有数据会复制到此 GPUBuffer 上，这种 GPUBuffer 可以通过 queue.writeBuffer 方法写入数据：
    device.queue.writeBuffer(this.uniformBuffer, 0, scaleData.buffer)
    // ===============
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'filtering',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          externalTexture: {},
        },
      ],
    })
    //
    // 创建PipelineLayout
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
  setPipe() {
    const {device, presentationFormat} = this
    const cellShaderModule = device.createShaderModule(fullCode)
    //
    const vBuffer = this.createVertexBufferMap()
    //
    this.pipeline = device.createRenderPipeline({
      // layout: 'auto',
      layout: this.pipelineLayout,
      vertex: {
        module: cellShaderModule,
        entryPoint: 'vertMain',
        buffers: vBuffer,
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
  render = () => {
    const {device, video, context, pipeline, sampler} = this

    //
    this.uniformBindGroup = device.createBindGroup({
      // layout: pipeline.getBindGroupLayout(0),
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: sampler,
        },
        {
          binding: 2,
          resource: device.importExternalTexture({
            source: video,
          }),
        },
      ],
    })
    //

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

    const pass = commandEncoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, this.uniformBindGroup)
    //
    const {vertexBuffer} = this
    pass.setVertexBuffer(0, vertexBuffer)
    const vertexCount = vertexBuffer.size / (4 * 6)
    pass.draw(vertexCount, 1, 0, 0)
    // pass.draw(6)
    pass.end()
    device.queue.submit([commandEncoder.finish()])

    //
    video.requestVideoFrameCallback(this.render)
  }
  async startToRender() {
    await this.video.play()
    this.video.requestVideoFrameCallback(this.render)
  }
  createVertexBufferMap(): GPUVertexState['buffers'] {
    // const ver = new Float32Array(this.verPos)
    const ver = this.verPos
    console.log(ver, ver.byteLength)
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
    // pass.setPipeline(this.pipeline)
    return [
      {
        arrayStride: 4 * 6, // 6 floats per vertex
        attributes: [
          {
            // a_position
            shaderLocation: 0,
            offset: 0,
            format: 'float32x2',
          },
          {
            // a_texCoord
            shaderLocation: 1,
            offset: 4 * 2,
            format: 'float32x2',
          },
          {
            // a_alpha_texCoord
            shaderLocation: 2,
            offset: 4 * 4,
            format: 'float32x2',
          },
        ],
      },
    ]
  }
}

export default new MP4PWebGPUPlayer()
