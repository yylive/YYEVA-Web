import logger from 'src/helper/logger'
import {isOffscreenCanvasSupported} from 'src/helper/utils'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, VideoAnimateDescriptType, WebglVersion} from 'src/type/mix'
import getSharderCode from './sharder'

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
  // public sampler!: GPUSampler
  public scaleUniformBuffer!: GPUBuffer
  public vertexBuffer!: GPUBuffer
  public pipelineLayout!: GPUPipelineLayout
  public bindGroupLayout!: GPUBindGroupLayout
  //
  // private textureMap: any = {}
  private bindGroupEntries: GPUBindGroupEntry[] = []
  private bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []
  private textureMap: any = {}
  //
  public baseLastIndex = 0
  public imgTextureLastIndex = 0
  public imgPosLastIndex = 0
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
    //
    this.setSampler()
    this.setScaleUniform()
    this.setimgTextureUniform()
    this.initImgPosBindEntry()
    // === 必须在这之前全部entry 设置完
    this.setLayout()
    this.createRenderPipeline()
  }
  createRender(frame: number) {
    const {device, video, ctx, pipeline, vertexBuffer} = this
    //
    const {descript} = this.videoEntity.config || {}
    const posBindGroupEntry = []
    if (descript) {
      const imagePosBuffer = this.createImgPosUniform(frame, descript)
      posBindGroupEntry.push({binding: this.imgPosLastIndex, resource: {buffer: imagePosBuffer}})
    }
    const entries = [
      {binding: 0, resource: device.importExternalTexture({source: video})}, // u_image_video
      ...this.bindGroupEntries,
      ...posBindGroupEntry,
    ]
    //
    const uniformBindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries,
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
  // 初始化 imgPos 的 bindEntry
  private initImgPosBindEntry() {
    this.imgPosLastIndex = this.imgTextureLastIndex + 1
    this.pushGroupEntry(null, {
      binding: this.imgPosLastIndex,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {
        // type: 'storage',
        // type: 'read-only-storage',
        type: 'uniform',
      },
    })
  }
  private pushGroupEntry(g: GPUBindGroupEntry, l: GPUBindGroupLayoutEntry) {
    if (g) this.bindGroupEntries.push(g)
    if (l) this.bindGroupLayoutEntries.push(l)
  }
  private setSampler() {
    const {device} = this
    // video samper
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    })
    this.pushGroupEntry(
      {binding: 2, resource: sampler},
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {type: 'filtering'},
      },
    )
    // img samper
    const imgSamper = device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    })
    this.pushGroupEntry(
      {binding: 3, resource: imgSamper},
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {type: 'filtering'},
      },
    )
    // video group entry need update in render
    this.pushGroupEntry(null, {
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      externalTexture: {},
    })
  }
  private setScaleUniform() {
    const u_scale = this.getScale()
    const uniformArray = new Float32Array(u_scale)
    this.scaleUniformBuffer = this.createBufferMapped(uniformArray, GPUBufferUsage.UNIFORM)
    this.pushGroupEntry(
      {binding: 1, resource: {buffer: this.scaleUniformBuffer}},
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: {type: 'uniform'},
      },
    )
  }
  private async setimgTextureUniform() {
    const {device, bindGroupEntries} = this
    this.baseLastIndex = this.bindGroupLayoutEntries.length - 1
    let index = this.baseLastIndex
    let i = 1
    const {effect} = this.videoEntity.config || {}
    for (const k in effect) {
      const r = effect[k]
      if (r.img) {
        index++
        this.createTexture(r.img as ImageBitmap, index)
      }
      this.textureMap[r[this.videoEntity.effectId]] = i++
    }
    this.imgTextureLastIndex = index
    // console.log('this.imgTextureLastIndex', this.imgTextureLastIndex)
  }
  private createTexture(source: ImageBitmap, index: number) {
    const {device} = this
    const texture = device.createTexture({
      size: [source.width, source.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })
    //
    device.queue.copyExternalImageToTexture({source}, {texture: texture}, [source.width, source.height, 1])
    //
    this.pushGroupEntry(
      {
        binding: index, // 假设纹理在绑定位置
        resource: texture.createView(),
      },
      {
        binding: index,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}, // 纹理
      },
    )
  }
  private setLayout() {
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: this.bindGroupLayoutEntries,
    })
    this.pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    })
  }
  private createRenderPipeline() {
    this.vertexBuffer = this.createBufferMapped(this.verriceArray)
    const shaderModule = this.device.createShaderModule(getSharderCode(this.device, this.PER_SIZE))
    this.pipeline = this.device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertMain',
        buffers: [
          {
            // 6 floats per vertex (2 for position, 2 for texCoord,2 for a_alpha_texCoord)
            arrayStride: this.verriceArray.BYTES_PER_ELEMENT * 6,
            attributes: [
              {shaderLocation: 0, offset: 0, format: 'float32x2'},
              {shaderLocation: 1, offset: 2 * this.verriceArray.BYTES_PER_ELEMENT, format: 'float32x2'},
              {shaderLocation: 2, offset: 4 * this.verriceArray.BYTES_PER_ELEMENT, format: 'float32x2'},
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
  //
  private createImgPosUniform(frame: number, descript: VideoAnimateDescriptType) {
    const {device} = this
    const frameData = this.videoEntity.getFrame(frame)
    const frameItem = frameData ? frameData[this.videoEntity.data] : undefined
    let posArr = []
    const {width: vW, height: vH} = descript

    if (frameItem) {
      frameItem.forEach(o => {
        posArr[posArr.length] = +this.textureMap[o[this.videoEntity.effectId]]
        const [rgbX, rgbY] = descript.rgbFrame
        const [x, y, w, h] = o[this.videoEntity.renderFrame]
        const [mX, mY, mW, mH] = o[this.videoEntity.outputFrame]
        const coord = this.computeCoord(x + rgbX, y + rgbY, w, h, vW, vH)
        const mCoord = this.computeCoord(mX, mY, mW, mH, vW, vH)
        posArr = posArr.concat(coord).concat(mCoord)
      })
    }
    // const positionBuffer = this.createBufferWrite(
    //   new Float32Array(posArr),
    //   GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    // )
    //
    const size = (device.limits.maxSampledTexturesPerShaderStage - 1) * this.PER_SIZE
    posArr = posArr.concat(new Array(size - posArr.length).fill(0))
    // console.log('posArr', posArr)
    const imagePosData = new Float32Array(posArr)
    const imagePosBuffer = device.createBuffer({
      size: imagePosData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    })
    new Float32Array(imagePosBuffer.getMappedRange()).set(imagePosData)
    imagePosBuffer.unmap()
    return imagePosBuffer
  }
  private createBufferMapped(vertices: Float32Array, usage: GPUFlagsConstant = GPUBufferUsage.VERTEX) {
    const vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage,
      mappedAtCreation: true,
    })
    const vMappedBuffer = new Float32Array(vertexBuffer.getMappedRange())
    vMappedBuffer.set(vertices)
    vertexBuffer.unmap()
    return vertexBuffer
  }
  private createBufferWrite(
    vertices: Float32Array,
    usage: GPUFlagsConstant = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  ) {
    const vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage,
    })
    this.device.queue.writeBuffer(vertexBuffer, 0, vertices)
    return vertexBuffer
  }
  public webgpuDestroy() {
    this.scaleUniformBuffer.destroy()
    this.vertexBuffer.destroy()
    this.device.destroy()
    this.ofs.remove()
  }
  public destroy() {
    this.webgpuDestroy()
    this.videoEntity.destroy()
    this.renderCache.destroy()
  }
  private get verriceArray() {
    const {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH} = this.getRgbaPos()
    logger.debug('rgbX, rgbY, rgbW, rgbH', rgbX, rgbY, rgbW, rgbH)
    logger.debug(`aX, aY, aW, aH`, aX, aY, aW, aH)
    logger.debug(`vW, vH`, vW, vH)
    const rgbCoord = this.computeCoord(rgbX, rgbY, rgbW, rgbH, vW, vH)
    const aCoord = this.computeCoord(aX, aY, aW, aH, vW, vH)
    const ver = []
    //
    // 第一个三角形 (右上角 -> 右下角 -> 左下角)
    ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]]) // 右上角
    ver.push(...[1, -1, rgbCoord[1], rgbCoord[3], aCoord[1], aCoord[3]]) // 右下角
    ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]]) // 左下角
    // 第二个三角形 (右上角 -> 左下角 -> 左上角)
    ver.push(...[1, 1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]]) // 右上角
    ver.push(...[-1, -1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]]) // 左下角
    ver.push(...[-1, 1, rgbCoord[0], rgbCoord[2], aCoord[0], aCoord[2]]) // 左上角
    //
    return new Float32Array(ver)
  }
  private getRgbaPos() {
    const descript = this.videoEntity.config?.descript
    if (descript) {
      // console.log('descript', descript)
      //=================== 创建缓冲区
      const {width: vW, height: vH} = descript
      const [rgbX, rgbY, rgbW, rgbH] = descript.rgbFrame
      let [aX, aY, aW, aH] = descript.alphaFrame
      // 正向渲染的兼容算法
      aY = vH - aH
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
