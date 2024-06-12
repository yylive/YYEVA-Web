import {WebGPUBase} from 'src/base'
import flag from './flag.wgsl'
import vert from './texture.wgsl'
class MP4PWebGPUPlayer extends WebGPUBase {
  public pipeline!: GPURenderPipeline
  public sampler!: GPUSampler
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
    const {device, video, context, presentationFormat} = this
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule(vert),
      },
      fragment: {
        module: device.createShaderModule(flag),
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
