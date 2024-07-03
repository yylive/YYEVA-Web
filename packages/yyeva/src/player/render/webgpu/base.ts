import type {VideoAnimateDescriptType} from 'src/type/mix'
import {BizBase} from './bizBase'
import getSharderCode from './sharder'
//
export type CacheType = {
  videoSampler: GPUSampler
  imgSamper: GPUSampler
  uScale: GPUBuffer
  vertexBuffer: GPUBuffer // 顶点着色器
  imgTextures: GPUTexture[]
  lastIndex: number
  startIndex: number
}
export class RenderWebGPUBase extends BizBase {
  public currentFrame = -1 //过滤重复帧
  public PER_SIZE = 9

  public adapter!: GPUAdapter
  public device!: GPUDevice
  public presentationFormat!: GPUTextureFormat
  public pipeline!: GPURenderPipeline
  private cache: CacheType = {
    videoSampler: undefined,
    imgSamper: undefined,
    uScale: undefined,
    vertexBuffer: undefined,
    imgTextures: [],
    lastIndex: 0,
    startIndex: 0,
  }
  private textureMap: any = {}
  public bindGroupLayout!: GPUBindGroupLayout
  async initGPUContext() {
    this.ctx = this.ofs.getContext('webgpu')
    this.adapter = await navigator.gpu.requestAdapter({})
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
  }
  async setup() {
    await this.initGPUContext()
    this.createbindGroup()
    this.createPipe()
  }
  createbindGroup() {
    const {cache, device} = this
    // group layout
    const entries: GPUBindGroupLayoutEntry[] = [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        externalTexture: {}, // video
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: {type: 'uniform'}, // uScale
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {type: 'filtering'}, // videoSampler
      },
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {type: 'filtering'}, // imageSampler
      },
    ]
    const {effect} = this.videoEntity.config || {}
    let i = 1
    this.cache.lastIndex = 4
    this.cache.startIndex = 4
    // img texture
    for (const k in effect) {
      entries.push({
        binding: this.cache.lastIndex,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      })
      // 4 img TextTure
      const r = effect[k]
      if (r.img) {
        cache.imgTextures.push(this.createImageTexture(r.img as ImageBitmap))
      }
      this.textureMap[r[this.videoEntity.effectId]] = i++
      //
      this.cache.lastIndex++
    }
    const {descript} = this.videoEntity.config || {}
    if (descript) {
      entries.push({
        binding: this.cache.lastIndex,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: 'read-only-storage',
        },
      })
    }
    // console.log('this.cache.lastIndex', this.cache.lastIndex, entries)
    // createBindGroupLayout
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries,
    })
    // 01 u_scale
    const u_scale = this.getScale()
    cache.uScale = this.createBufferWrite(new Float32Array(u_scale))
    // 02 videoSampler
    cache.videoSampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    })
    // 03 imgSamper
    cache.imgSamper = device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    })
  }
  createRender(frame: number) {
    const {device, video, ctx, pipeline, cache} = this
    //
    const {descript} = this.videoEntity.config || {}
    const lastBuffer = []
    if (descript) {
      lastBuffer.push({
        binding: cache.lastIndex,
        resource: {buffer: this.imgPosBindGroup(frame, descript)},
      })
    }
    //
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
    passEncoder.setPipeline(pipeline)
    //
    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: device.importExternalTexture({source: video})},
        {binding: 1, resource: {buffer: cache.uScale}},
        {binding: 2, resource: cache.videoSampler},
        {binding: 3, resource: cache.imgSamper},
        ...cache.imgTextures.map((texture, index) => ({
          binding: index + 4,
          resource: texture.createView(),
        })),
        ...lastBuffer,
      ],
    })
    //
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.setVertexBuffer(0, cache.vertexBuffer)
    //
    passEncoder.draw(6)
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])
  }

  public webgpuDestroy() {
    this.cache.vertexBuffer.destroy()
    this.device.destroy()
  }
  public destroy() {
    this.webgpuDestroy()
    super.destroy()
  }
  imgPosBindGroup(frame: number, descript: VideoAnimateDescriptType) {
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
    const size = (device.limits.maxSampledTexturesPerShaderStage - 1) * this.PER_SIZE
    posArr = posArr.concat(new Array(size - posArr.length).fill(0))
    // console.log('posArr', posArr)
    const imagePosData = new Float32Array(posArr)
    const imagePosBuffer = this.createBufferWrite(imagePosData, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    return imagePosBuffer
  }
  private createImageTexture(source: ImageBitmap) {
    const {device} = this
    const texture = device.createTexture({
      size: [source.width, source.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })
    //
    device.queue.copyExternalImageToTexture({source, flipY: true}, {texture: texture}, [source.width, source.height, 1])
    return texture
  }
  createPipe() {
    // 顶点着色器坐标
    this.cache.vertexBuffer = this.createBufferMapped(this.verriceArray)
    //
    const shaderModule = this.device.createShaderModule(getSharderCode(this.cache))
    //
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    })
    this.pipeline = this.device.createRenderPipeline({
      // layout: 'auto',
      layout: pipelineLayout,
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
}
