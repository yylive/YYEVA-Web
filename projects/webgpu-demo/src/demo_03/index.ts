async function initWebGPU(canvas: HTMLCanvasElement) {
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('Failed to get GPU adapter')
  }
  const device = await adapter.requestDevice()

  const context = canvas.getContext('webgpu') as GPUCanvasContext
  if (!context) {
    throw new Error('Failed to get WebGPU context')
  }

  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format,
    alphaMode: 'opaque',
  })

  // 顶点着色器
  const vertexShaderModule = device.createShaderModule({
    code: `
      struct VertexInput {
        @location(0) a_position: vec2<f32>,
        @location(1) a_texCoord: vec2<f32>,
        @location(2) a_alpha_texCoord: vec2<f32>
      }
  
      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) v_texcoord: vec2<f32>,
        @location(1) v_alpha_texCoord: vec2<f32>
      }
  
      @group(0) @binding(0) var<uniform> u_scale: vec2<f32>;
  
      @vertex
      fn vs_main(in: VertexInput) -> VertexOutput {
        var out: VertexOutput;
        out.position = vec4<f32>(u_scale * in.a_position, 0.0, 1.0);
        out.v_texcoord = in.a_texCoord;
        out.v_alpha_texCoord = in.a_alpha_texCoord;
        return out;
      }
    `,
  })

  // 片段着色器
  const fragmentShaderModule = device.createShaderModule({
    code: `
      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) v_texcoord: vec2<f32>,
        @location(1) v_alpha_texCoord: vec2<f32>
      }

      @group(0) @binding(1) var u_image_video: texture_2d<f32>;
      @group(0) @binding(2) var u_image_video_sampler: sampler;
  
      @fragment
      fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
        let bg_color = textureSample(u_image_video, u_image_video_sampler, in.v_texcoord).rgb;
        let alpha = textureSample(u_image_video, u_image_video_sampler, in.v_alpha_texCoord).r;
        return vec4<f32>(bg_color, alpha);
      }
    `,
  })

  // JS 绑定部分
  const pipeline = device.createRenderPipeline({
    vertex: {
      module: vertexShaderModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 4 * 2, // 2 个 vec2
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2',
            },
            {
              shaderLocation: 1,
              offset: 4 * 2,
              format: 'float32x2',
            },
            {
              shaderLocation: 2,
              offset: 4 * 4,
              format: 'float32x2',
            },
          ],
        },
      ],
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: 'fs_main',
      targets: [
        {
          format: 'rgba8unorm',
        },
      ],
    },
    primitive: {
      topology: 'triangle-strip',
    },
    layout: 'auto',
  })

  // 创建缓冲区和纹理
  const vertexBuffer = device.createBuffer({
    size: 4 * 2 * 3, // 3 个顶点,每个顶点 2 个 vec2
    usage: GPUBufferUsage.VERTEX,
  })

  const scaleUniform = device.createBuffer({
    size: 4 * 2, // 2 个 vec2
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })

  const texture = device.createTexture({
    size: [1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  })

  const sampler = device.createSampler()

  // 绑定资源
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: scaleUniform,
        },
      },
      {
        binding: 1,
        resource: texture.createView(),
      },
      {
        binding: 2,
        resource: sampler,
      },
    ],
  })

  // 绘制
  const commandEncoder = device.createCommandEncoder()
  const renderPassEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  })

  renderPassEncoder.setPipeline(pipeline)
  renderPassEncoder.setBindGroup(0, bindGroup)
  renderPassEncoder.setVertexBuffer(0, vertexBuffer)
  renderPassEncoder.draw(3, 1, 0, 0)
  renderPassEncoder.end()

  device.queue.submit([commandEncoder.finish()])
}

// 初始化 WebGPU
const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
if (canvas) {
  initWebGPU(canvas).catch(console.error)
} else {
  console.error('Canvas element not found')
}
