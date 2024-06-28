import type {VideoAnimateDescriptType} from 'src/type/mix'
import {BizBase} from './bizBase'
import getSharderCode from './sharder'

export class RenderWebGPUBase extends BizBase {
  public currentFrame = -1 //过滤重复帧
  public PER_SIZE = 9

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
  }
  async setup() {
    await this.initGPUContext()
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
    const shaderModule = this.device.createShaderModule(getSharderCode(this.PER_SIZE))
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
  }
  public destroy() {
    this.webgpuDestroy()
    super.destroy()
  }
}
