import logger from 'src/helper/logger'
import {isOffscreenCanvasSupported} from 'src/helper/utils'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, WebglVersion} from 'src/type/mix'

export class RenderWebGPUBase {
  public isPlay = false
  public videoEntity: VideoEntity
  public renderType = 'webgl'
  public renderCache: RenderCache
  public PER_SIZE = 9
  public version: WebglVersion
  public op: MixEvideoOptions
  public currentFrame = -1 //过滤重复帧
  public video: HTMLVideoElement | undefined
  // webGPU
  public ofs: HTMLCanvasElement
  private device: GPUDevice
  public ctx: GPUCanvasContext
  constructor(op: MixEvideoOptions) {
    logger.debug('[Render In Webgl]')
    this.op = op
    this.createCanvas(op)
    this.renderCache = new RenderCache(this.ofs, this.op)
    this.videoEntity = new VideoEntity(op)
  }
  private createCanvas(op: MixEvideoOptions) {
    this.ofs = document.createElement('canvas')
    if (op.resizeCanvas) {
      this.setSizeCanvas(this.ofs, op.resizeCanvas)
    }
    op.container.appendChild(this.ofs)
    this.op = op
  }
  async initGPUContext() {
    this.ctx = this.ofs.getContext('webgpu')
    // 创建一个适配器对象 adapter，适配器是一个 GPU 物理硬件设备的抽象。
    // 比如 { powerPreference: 'low-power' } 表示优先使用低能耗的 GPU
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('WebGPU adapter not available')
    }

    // requestDevice 方法也可以传入配置项，去开启一些高级特性，或是指定一些硬件限制，比如最大纹理尺寸。
    this.device = await adapter.requestDevice()
    // 接着是调用 ctx.configure() 方法配置刚刚声明的 device 对象和像素格式。
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
    this.ctx.configure({
      device: this.device,
      format: canvasFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
  }
  createRender() {
    const {device, ctx} = this
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
    //
    const texture = device.importExternalTexture({source: this.video})
    //
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: ctx.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: {r: 0.6, g: 0.8, b: 0.9, a: 1},
          storeOp: 'store',
        },
      ],
    })

    // 创建顶点数据
    // prettier-ignore
    const vertices = new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5])

    // 缓冲区
    const vertexBuffer = device.createBuffer({
      // 标识，字符串随意写，报错时会通过它定位，
      label: 'Triangle Vertices',
      // 缓冲区大小，这里是 24 字节。6 个 4 字节（即 32 位）的浮点数
      size: vertices.byteLength,
      // 标识缓冲区用途（1）用于顶点着色器（2）可以从 CPU 复制数据到缓冲区
      // eslint-disable-next-line no-undef
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })
    // 将顶点数据复制到缓冲区
    device.queue.writeBuffer(vertexBuffer, /* bufferOffset */ 0, vertices)

    // GPU 应该如何读取缓冲区中的数据
    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 2 * 4, // 每一组的字节数，每组有两个数字（2 * 4字节）
      attributes: [
        {
          format: 'float32x2', // 每个数字是32位浮点数
          offset: 0, // 从每组的第一个数字开始
          shaderLocation: 0, // 顶点着色器中的位置
        },
      ],
    }

    // 着色器用的是 WGSL 着色器语言
    const vertexShaderModule = device.createShaderModule({
      label: 'Cell shader',
      code: `
        @vertex
        fn vertexMain(@location(0) pos: vec2f) ->
          @builtin(position) vec4f {
          return vec4f(pos, 0, 1);
        }
    
        @fragment
        fn fragmentMain() -> @location(0) vec4f {
          return vec4f(1, 0, 0, 1);
        }
      `,
    })

    // 渲染流水线
    const pipeline = device.createRenderPipeline({
      label: 'pipeline',
      layout: 'auto',
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: vertexShaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: canvasFormat,
          },
        ],
      },
    })

    pass.setPipeline(pipeline)
    pass.setVertexBuffer(0, vertexBuffer)
    pass.draw(vertices.length / 2)

    pass.end()
    const commandBuffer = encoder.finish()
    device.queue.submit([commandBuffer])
  }
  //
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
  public resizeCanvasToDisplaySize() {
    const descript = this.videoEntity.config?.descript
    const ofs = this.ofs
    if (!descript) {
      if (!this.video) return
      const vw = this.video.videoWidth ? this.video.videoWidth / 2 : 900
      const vh = this.video.videoHeight ? this.video.videoHeight : 1000
      // logger.debug('[resizeCanvasToDisplaySize]', vw, vh)
      // 默认左右结构
      ofs.width = vw
      ofs.height = vh
    } else {
      // 实际渲染大小
      const [x, y, w, h] = descript.rgbFrame
      ofs.width = w
      ofs.height = h
    }
  }
  public destroy() {
    console.log('destroy')
    // this.webglDestroy()
    this.ofs.remove()
    this.videoEntity.destroy()
    this.renderCache.destroy()
  }
}
