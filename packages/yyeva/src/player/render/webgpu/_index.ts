class WebGPURenderer {
  // ... 其他属性和方法

  private device: GPUDevice
  private pipeline: GPURenderPipeline
  private bindGroups: GPUBindGroup[]
  private uniformBuffer: GPUBuffer
  private imagePosBuffer: GPUBuffer

  // ... 构造函数和其他方法

  async initialize(textureCount = 8) {
    // ... 设备初始化代码

    // 创建着色器模块
    const shaderModule = this.device.createShaderModule({
      code: generateWGSL(textureCount), // 使用之前定义的 generateWGSL 函数
    })

    // 创建渲染管线
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          /* 顶点缓冲区布局 */
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{format: 'bgra8unorm'}], // 或其他适当的格式
      },
      // ... 其他管线设置
    })

    // 创建纹理和采样器
    const videoTexture = await this.createVideoTexture()
    const videoSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })

    const imageTextures = await Promise.all(
      Array.from({length: textureCount}, (_, i) => this.createImageTexture(`image${i + 1}.png`)),
    )

    const imageSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })

    // 创建 uniform 缓冲区
    this.uniformBuffer = this.device.createBuffer({
      size: 16, // vec2<f32> + u32 + padding
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    // 创建 imagePos 存储缓冲区
    this.imagePosBuffer = this.device.createBuffer({
      size: 36 * textureCount, // 9 * float32 * textureCount
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    // 创建绑定组
    this.bindGroups = [
      this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer: this.uniformBuffer}},
          {binding: 1, resource: videoSampler},
          {binding: 2, resource: videoTexture.createView()},
        ],
      }),
      this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(1),
        entries: [
          {binding: 0, resource: imageSampler},
          ...imageTextures.map((texture, index) => ({
            binding: index + 1,
            resource: texture.createView(),
          })),
        ],
      }),
      this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(2),
        entries: [{binding: 0, resource: {buffer: this.imagePosBuffer}}],
      }),
    ]
  }

  private async createVideoTexture(): Promise<GPUTexture> {
    // 实现视频纹理创建逻辑
    // 这里应该包含加载视频并创建 GPUTexture 的代码
  }

  private async createImageTexture(url: string): Promise<GPUTexture> {
    const response = await fetch(url)
    const blob = await response.blob()
    const imageBitmap = await createImageBitmap(blob)

    const texture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    this.device.queue.copyExternalImageToTexture({source: imageBitmap}, {texture: texture}, [
      imageBitmap.width,
      imageBitmap.height,
    ])

    return texture
  }

  render() {
    // ... 设置命令编码器和渲染通道

    const renderPass = commandEncoder.beginRenderPass(/* ... */)
    renderPass.setPipeline(this.pipeline)
    renderPass.setBindGroup(0, this.bindGroups[0])
    renderPass.setBindGroup(1, this.bindGroups[1])
    renderPass.setBindGroup(2, this.bindGroups[2])

    // ... 设置顶点缓冲区和绘制命令

    renderPass.end()
    // ... 提交命令缓冲区
  }

  updateUniforms(scale: [number, number], imagePosCount: number) {
    const uniformData = new Float32Array([scale[0], scale[1], imagePosCount, 0])
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData)
  }

  updateImagePos(
    imagePositions: Array<{
      index: number
      x1: number
      x2: number
      y1: number
      y2: number
      mx1: number
      mx2: number
      my1: number
      my2: number
    }>,
  ) {
    const data = new Float32Array(
      imagePositions.flatMap(pos => [pos.index, pos.x1, pos.x2, pos.y1, pos.y2, pos.mx1, pos.mx2, pos.my1, pos.my2]),
    )
    this.device.queue.writeBuffer(this.imagePosBuffer, 0, data)
  }
}
