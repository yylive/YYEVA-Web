import logger from 'src/helper/logger'
import {isOffscreenCanvasSupported} from 'src/helper/utils'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, WebglVersion} from 'src/type/mix'
import {code} from './sharder'

export class RenderWebGPUBase {
  public isPlay = false
  public videoEntity: VideoEntity
  public renderType = 'webgpu'
  public renderCache: RenderCache
  public PER_SIZE = 9
  public version = 0
  public op: MixEvideoOptions
  public currentFrame = -1 //过滤重复帧
  public video: HTMLVideoElement | undefined
  // webGPU
  public ofs!: HTMLCanvasElement
  public ctx!: GPUCanvasContext
  public adapter!: GPUAdapter
  public device!: GPUDevice
  public presentationFormat!: GPUTextureFormat
  public pipeline!: GPURenderPipeline
  public sampler!: GPUSampler
  public uniformBuffer!: GPUBuffer
  public vertexBuffer!: GPUBuffer
  public pipelineLayout!: GPUPipelineLayout
  public bindGroupLayout!: GPUBindGroupLayout
  //
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
  }
  async initGPUContext() {
    this.ctx = this.ofs.getContext('webgpu')
    this.adapter = await navigator.gpu.requestAdapter({
      // powerPreference: 'low-power',
    })
    if (!this.adapter) {
      throw new Error('WebGPU adapter not available')
    }
    this.device = await this.adapter.requestDevice()
    if (!this.device) {
      throw new Error('need a browser that supports WebGPU')
    }
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat()
    this.ctx.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: 'premultiplied',
    })
    // createSampler
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    })
    // setUniform
    const u_scale = this.getScale()
    const uniformArray = new Float32Array(u_scale)
    const uniformBuffer = this.device.createBuffer({
      size: uniformArray.byteLength,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true,
    })
    const uMappedBuffer = new Float32Array(uniformBuffer.getMappedRange())
    uMappedBuffer.set(uniformArray)
    uniformBuffer.unmap()
    this.uniformBuffer = uniformBuffer
    // setVertextBuffer
    const vertices = this.verriceArray
    const vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    })
    const vMappedBuffer = new Float32Array(vertexBuffer.getMappedRange())
    vMappedBuffer.set(vertices)
    vertexBuffer.unmap()
    this.vertexBuffer = vertexBuffer
    // setLayout
    this.bindGroupLayout = this.device.createBindGroupLayout({
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
    this.pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    })
    // setPipeline
    const shaderModule = this.device.createShaderModule({code})
    this.pipeline = this.device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertMain',
        buffers: [
          {
            // 6 floats per vertex (2 for position, 2 for texCoord,2 for a_alpha_texCoord)
            arrayStride: vertices.BYTES_PER_ELEMENT * 6,
            attributes: [
              {shaderLocation: 0, offset: 0, format: 'float32x2'},
              {shaderLocation: 1, offset: 2 * vertices.BYTES_PER_ELEMENT, format: 'float32x2'},
              {shaderLocation: 2, offset: 4 * vertices.BYTES_PER_ELEMENT, format: 'float32x2'},
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragMain',
        targets: [{format: this.presentationFormat}],
      },
      primitive: {topology: 'triangle-list'},
    })
  }
  createRender() {
    const {device, video, ctx, pipeline, sampler, vertexBuffer} = this

    const uniformBindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.uniformBuffer}},
        {binding: 1, resource: sampler},
        {binding: 2, resource: device.importExternalTexture({source: video})},
      ],
    })
    const commandEncoder = device.createCommandEncoder()
    const textureView = ctx.getCurrentTexture().createView()
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
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, uniformBindGroup)
    passEncoder.setVertexBuffer(0, vertexBuffer)
    passEncoder.draw(6)
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])
  }
  public webgpuDestroy() {
    this.uniformBuffer.destroy()
    this.vertexBuffer.destroy()
    this.device.destroy()
    this.ofs.remove()
  }
  public destroy() {
    console.log('destroy')
    this.webgpuDestroy()
    this.videoEntity.destroy()
    this.renderCache.destroy()
  }
  private get verriceArray() {
    const {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH} = this.getRgbaPos()
    console.log('rgbX, rgbY, rgbW, rgbH, aX, aY, aW, aH', rgbX, rgbY, rgbW, rgbH, aX, aY, aW, aH, vW, vH)
    const rgbCoord = this.computeCoord(rgbX, rgbY, rgbW, rgbH, vW, vH)
    const aCoord = this.computeCoord(aX, aY, aW, aH, vW, vH)
    const ver = []
    ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]])
    ver.push(...[1, -1, rgbCoord[1], rgbCoord[3], aCoord[1], aCoord[3]])
    ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]])
    ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]])
    ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]])
    ver.push(...[-1, 1, rgbCoord[0], rgbCoord[2], aCoord[0], aCoord[2]])
    //
    // ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]])
    // ver.push(...[1, -1, rgbCoord[1], rgbCoord[3], aCoord[1], aCoord[3]])
    // ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]])
    // ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]])
    // ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]])
    // ver.push(...[-1, 1, rgbCoord[0], rgbCoord[2], aCoord[0], aCoord[2]])
    //
    return new Float32Array(ver)
  }
  private getRgbaPos() {
    const descript = this.videoEntity.config?.descript
    if (descript) {
      //=================== 创建缓冲区
      const {width: vW, height: vH} = descript
      const [rgbX, rgbY, rgbW, rgbH] = descript.rgbFrame
      const [aX, aY, aW, aH] = descript.alphaFrame
      return {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH}
    } else if (this.video) {
      //默认为左右均分
      const vW = this.video.videoWidth ? this.video.videoWidth : 1800
      const vH = this.video.videoHeight ? this.video.videoHeight : 1000
      const stageW = vW / 2
      const [rgbX, rgbY, rgbW, rgbH] = this.op.alphaDirection === 'right' ? [0, 0, stageW, vH] : [stageW, 0, stageW, vH]
      const [aX, aY, aW, aH] = this.op.alphaDirection === 'right' ? [stageW, 0, stageW, vH] : [0, 0, stageW, vH]
      return {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH}
    }
  }
  public computeCoord(x: number, y: number, w: number, h: number, vw: number, vh: number) {
    // leftX rightX bottomY topY
    const leftX = x / vw
    const rightX = (x + w) / vw
    const bottomY = (vh - y - h) / vh
    const topY = (vh - y) / vh
    // console.log(`leftX, rightX, bottomY, topY`, leftX, rightX, bottomY, topY)
    return [leftX, rightX, bottomY, topY]
  }
  private getScale() {
    let scaleX = 1
    let scaleY = 1
    if (this.video && this.op.mode) {
      const ofs = this.ofs
      const canvasAspect = ofs.clientWidth / ofs.clientHeight
      const videoAspect = ofs.width / ofs.height

      ofs.setAttribute('class', `e-video-${this.op.mode.toLocaleLowerCase()}`)
      switch (this.op.mode) {
        case 'AspectFill':
        case 'vertical': //fit vertical | AspectFill 竖屏
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          break
        case 'AspectFit':
        case 'horizontal': //fit horizontal | AspectFit 横屏
          scaleX = 1
          scaleY = canvasAspect / videoAspect
          break
        case 'contain':
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          if (scaleX > 1) {
            scaleY = 1 / scaleX
            scaleX = 1
          }
          break
        case 'Fill':
        case 'cover':
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          if (scaleX < 1) {
            scaleY = 1 / scaleX
            scaleX = 1
          }
          break
      }
      // console.log('canvasAspect', canvasAspect)
      // console.log('videoAspect', videoAspect)
      // console.log('scaleX', scaleX, scaleY)
    }
    return [scaleX, scaleY]
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
}
