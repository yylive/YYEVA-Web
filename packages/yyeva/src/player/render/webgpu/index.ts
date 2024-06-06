import {logger} from 'src/helper/logger'
import {Canvas2dControl} from 'src/player/render/canvas2d/control'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, VideoAnimateDataItemType} from 'src/type/mix'

export default class Render2D extends Canvas2dControl {
  public isPlay = false
  public renderType = 'webgpu'
  public videoEntity: VideoEntity
  public renderCache: RenderCache
  public op: MixEvideoOptions

  private video: HTMLVideoElement | undefined
  private canvas: HTMLCanvasElement
  private device: GPUDevice
  private context: GPUCanvasContext
  private swapChainFormat: GPUTextureFormat
  private pipeline: GPURenderPipeline
  private videoTexture: GPUTexture
  private frameTexture: GPUTexture
  drawEffect: any
  public videoSeekedEvent() {
    // return this.renderCache.mCache.videoSeekedEvent()
  }
  constructor(op: MixEvideoOptions) {
    super()
    logger.debug('[Render In WebGPU]')
    this.op = op
    this.canvas = document.createElement('canvas')
    this.renderCache = new RenderCache(this.canvas, op)
    this.videoEntity = new VideoEntity(op)

    this.initializeWebGPU()
  }

  async initializeWebGPU() {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser.')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('Failed to get GPU adapter.')
    }

    this.device = await adapter.requestDevice()
    this.op.container.appendChild(this.canvas)
    this.context = this.canvas.getContext('webgpu')

    this.swapChainFormat = 'bgra8unorm'
    this.context.configure({
      device: this.device,
      format: this.swapChainFormat,
    })

    this.pipeline = this.createPipeline()
  }

  private createPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({
          code: `
              @vertex
              fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
                var pos = array<vec2<f32>, 4>(
                  vec2<f32>(-1.0, -1.0),
                  vec2<f32>( 1.0, -1.0),
                  vec2<f32>(-1.0,  1.0),
                  vec2<f32>( 1.0,  1.0)
                );
                return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
              }
            `,
        }),
        entryPoint: 'main',
      },
      fragment: {
        module: this.device.createShaderModule({
          code: `
              @group(0) @binding(0) var mySampler: sampler;
              @group(0) @binding(1) var myTexture: texture_2d<f32>;
  
              @fragment
              fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
                var uv = fragCoord.xy / vec2<f32>(800.0, 600.0); // assuming canvas size
                var color = textureSample(myTexture, mySampler, uv);
                return color;
              }
            `,
        }),
        entryPoint: 'main',
        targets: [
          {
            format: this.swapChainFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-strip',
        stripIndexFormat: 'uint32',
      },
      layout: 'auto',
    })
  }

  async setup(video?: HTMLVideoElement) {
    if (!video) throw new Error('video must support!')
    await this.renderCache.setup()
    this.video = video
    if (!this.op.fps) {
      this.op.fps = 10
    }
    await this.videoEntity.setup()

    this.canvas.width = video.videoWidth / 2
    this.canvas.height = video.videoHeight

    // Create video texture
    this.videoTexture = this.device.createTexture({
      size: [video.videoWidth, video.videoHeight, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    // Create frame texture
    this.frameTexture = this.device.createTexture({
      size: [video.videoWidth, video.videoHeight, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })

    // const descript = this.videoEntity?.config?.descript
    // const effect = this.videoEntity?.config?.effect
    // if (descript) {
    //   const [x, y, w, h] = descript.rgbFrame
    //   this.canvas.width = w
    //   this.canvas.height = h
    // }
    // if (effect) {
    //   for (const k in effect) {
    //     const r = effect[k]
    //     if (r.img) {
    //       this.drawEffect[r.effectId] = r
    //     }
    //   }
    // }
    this.setSizeCanvas(this.canvas, this.op.resizeCanvas)
  }

  setSizeCanvas(canvas: HTMLCanvasElement, resizeCanvas: ResizeCanvasType) {
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

  async render(frame = 0) {
    if (this.video.readyState >= 2) {
      const videoFrame = new VideoFrame(this.video)
      this.device.queue.copyExternalImageToTexture({source: videoFrame}, {texture: this.videoTexture}, [
        this.video.videoWidth,
        this.video.videoHeight,
        1,
      ])
      videoFrame.close()
    }

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
    passEncoder.draw(4, 1, 0, 0)
    passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])
  }

  destroy() {
    this.clear()
    this.videoEntity.destroy()
    if (this.canvas) {
      this.canvas.remove()
      delete this.canvas
      this.canvas = null
    }
    this.drawEffect = undefined
  }

  clear() {
    // if (this.video && this.context) {
    //   this.context.clearRect(0, 0, this.video.videoWidth, this.video.videoHeight)
    // }
  }
}
