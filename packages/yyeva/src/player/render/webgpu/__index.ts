import {logger} from 'src/helper/logger'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, VideoAnimateDataItemType} from 'src/type/mix'

export default class RenderWebGPU {
  public isPlay = false
  public videoEntity: VideoEntity
  public renderCache: RenderCache
  public isSupport = !!navigator.gpu
  public renderType = 'webgpu'

  private video: HTMLVideoElement | undefined
  private canvas: HTMLCanvasElement
  private context: GPUCanvasContext
  private device: GPUDevice
  private pipeline: GPURenderPipeline
  private op!: MixEvideoOptions
  public currentFrame = -1 //过滤重复帧

  drawEffect: {[key: string]: any}
  public videoSeekedEvent() {
    // return this.renderCache.mCache.videoSeekedEvent()
  }
  constructor(op: MixEvideoOptions) {
    logger.debug('[Render In WebGPU]')
    this.op = op
    this.canvas = document.createElement('canvas')
    this.drawEffect = {}
    //
    this.renderCache = new RenderCache(this.canvas, this.op)
    this.videoEntity = new VideoEntity(this.op)
  }

  async initWebGPU(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser.')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('Failed to get GPU adapter.')
    }

    const device = await adapter.requestDevice()
    const context = canvas.getContext('webgpu') as GPUCanvasContext
    const swapChainFormat = 'bgra8unorm'

    context.configure({
      device: device,
      format: swapChainFormat,
    })

    this.device = device
    this.context = context
  }

  async setup(video?: HTMLVideoElement) {
    if (!video) throw new Error('video must support!')
    this.video = video
    await this.renderCache.setup()

    this.video = video

    if (!this.op.fps) {
      this.op.fps = 10
    }

    await this.videoEntity.setup()

    const canvas = this.canvas
    this.op.container.appendChild(canvas)
    canvas.width = video.videoWidth / 2
    canvas.height = video.videoHeight
    this.canvas = canvas

    await this.initWebGPU(canvas)
    //

    const shaderCode = `
        @vertex
        fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
          var pos = array<vec2<f32>, 3>(
            vec2<f32>(0.0, 0.5),
            vec2<f32>(-0.5, -0.5),
            vec2<f32>(0.5, -0.5)
          );
          return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }

        @fragment
        fn fs_main() -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
      `

    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    })

    const pipeline = this.device.createRenderPipeline({
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: 'bgra8unorm',
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
      layout: 'auto',
    })

    this.pipeline = pipeline

    this.setSizeCanvas(canvas, this.op.resizeCanvas)
  }

  private setSizeCanvas(canvas: HTMLCanvasElement, resizeCanvas: ResizeCanvasType) {
    switch (resizeCanvas) {
      case 'percent':
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        break
      case 'percentH':
        canvas.style.height = '100%'
        break
      case 'percentW':
        canvas.style.width = '100%'
        break
      default:
        break
    }
  }

  render(frame = 0) {
    this.currentFrame = frame
    const commandEncoder = this.device.createCommandEncoder()
    const textureView = this.context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(this.pipeline)
    passEncoder.draw(3, 1, 0, 0)
    passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
  public destroy() {
    // this.webgl.destroy()
    this.videoEntity.destroy()
    this.renderCache.destroy()
  }
}
