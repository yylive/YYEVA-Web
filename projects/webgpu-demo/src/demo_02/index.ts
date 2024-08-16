import {WebGPUBase} from 'src/base'
// import flag from './flag.wgsl'
// import vert from './texture.wgsl'
import flag from './_flag.wgsl'
import vert from './_vertext.wgsl'
class MP4PWebGPUPlayer extends WebGPUBase {
  public pipeline!: GPURenderPipeline
  // public sampler!: GPUSampler
  constructor() {
    super()
    this.setup()
  }
  async setup() {
    await super.setup()
    // console.log('this.device', this.device)
    this.createPipe()
    // this.createSampler()
    //
    // this.canvas.addEventListener('click', () => {
    //   this.startToRender()
    // })
    this.startToRender()
  }
  createUniforms(): GPUBindGroup {
    const {device, pipeline, video} = this

    // 创建一个uniform缓冲区来存储u_scale变量的值
    const uniformBuffer = device.createBuffer({
      size: 8, // vec2<f32> 需要8字节
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const scale = new Float32Array(this.getScale()) // 示例值
    device.queue.writeBuffer(uniformBuffer, 0, scale.buffer, scale.byteOffset, scale.byteLength)

    //===
    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
          },
        },
      ],
    })

    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
      ],
    })
    return bindGroup
    //===

    /*     
    const uniformBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: device.importExternalTexture({
            source: video,
          }),
        },
      ],
    })

    return uniformBindGroup */
  }
  createPipe() {
    const {device, video, context, presentationFormat} = this
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule(vert),
        entryPoint: 'main',
        buffers: [
          {
            // 假设所有顶点属性都存储在同一个顶点缓冲区中
            arrayStride: 24, // 每个顶点的总字节大小（例如，每个属性是vec2<f32>，即2*4字节，共3个属性，所以是24字节）
            attributes: [
              {
                // a_position
                shaderLocation: 0, // 对应[[location(0)]]
                offset: 0,
                format: 'float32x2',
              },
              {
                // a_texCoord
                shaderLocation: 1, // 对应[[location(1)]]
                offset: 8, // 偏移量，因为a_position占用前8字节
                format: 'float32x2',
              },
              {
                // a_alpha_texCoord
                shaderLocation: 2, // 对应[[location(2)]]
                offset: 16, // 偏移量，因为a_position和a_texCoord共占用前16字节
                format: 'float32x2',
              },
            ],
          },
          // 如果有更多的顶点缓冲区，可以继续在这里添加
        ],
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
  // createSampler() {
  //   const {device} = this
  //   if (!device) return
  //   this.sampler = device.createSampler({
  //     magFilter: 'linear',
  //     minFilter: 'linear',
  //   })
  // }
  render = () => {
    const {device, video, context, pipeline} = this
    // const uniformBindGroup = device.createBindGroup({
    //   layout: pipeline.getBindGroupLayout(0),
    //   entries: [
    //     {
    //       binding: 1,
    //       resource: this.sampler,
    //     },
    //     {
    //       binding: 2,
    //       resource: device.importExternalTexture({
    //         source: video,
    //       }),
    //     },
    //   ],
    // })
    const uniformBindGroup = this.createUniforms()
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
