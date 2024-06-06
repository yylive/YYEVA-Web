class WebGPUVideoPlayer {
  private device: GPUDevice
  private context: GPUCanvasContext
  private swapChainFormat: GPUTextureFormat
  private video: HTMLVideoElement
  private pipeline: GPURenderPipeline
  private videoTexture: GPUTexture

  constructor(videoElementId: string, canvasElementId: string) {
    this.video = document.getElementById(videoElementId) as HTMLVideoElement
    const canvas = document.getElementById(canvasElementId) as HTMLCanvasElement
    this.context = canvas.getContext('webgpu') as GPUCanvasContext
  }

  async initialize() {
    if (!navigator.gpu) {
      console.error('WebGPU not supported!')
      return
    }

    const adapter = await navigator.gpu.requestAdapter()
    this.device = await adapter.requestDevice()
    this.swapChainFormat = 'bgra8unorm'

    this.context.configure({
      device: this.device,
      format: this.swapChainFormat,
    })

    this.video.addEventListener('loadeddata', async () => {
      await this.setupVideoTexture()
      this.pipeline = this.createPipeline()
      this.video.play()
      this.renderFrame()
    })
  }

  private async setupVideoTexture() {
    this.videoTexture = this.device.createTexture({
      size: [this.video.videoWidth, this.video.videoHeight, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })
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

  private renderFrame() {
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
    requestAnimationFrame(() => this.renderFrame())
  }
}

const videoPlayer = new WebGPUVideoPlayer('video', 'canvas')
videoPlayer.initialize().catch(console.error)
