import {WebGPUBase} from 'src/base'
import fullCode from './full.wgsl'
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
    //
    this.setSampler()
    this.setPipe()
    this.startToRender()
  }
  setSampler() {
    const {device} = this
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })
  }
  setPipe() {
    const {device, presentationFormat} = this
    const cellShaderModule = device.createShaderModule(fullCode)
    //
    const vBuffer = this.createVertexBufferMap()
    //
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
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
    const uniformBufferSize = 2 * 4
    const uniformBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    const uniformValues = new Float32Array(uniformBufferSize / 4)
    uniformValues.set(this.getScale(), 0)
    //
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues)
    //
    const uniformBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        // {binding: 0, resource: {buffer: uniformBuffer}},
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
    const vertexCount = vertexBuffer.size / (4 * 6)
    passEncoder.draw(vertexCount, 1, 0, 0)
    // passEncoder.draw(6)
    passEncoder.end()
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
    this.vertexBuffer = this.device.createBuffer({
      size: ver.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })
    //
    const mappedBuffer = new Float32Array(this.vertexBuffer.getMappedRange())
    mappedBuffer.set(ver)
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
