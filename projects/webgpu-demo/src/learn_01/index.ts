;(async () => {
  const adapter = (await navigator.gpu.requestAdapter()) as GPUAdapter
  const device = await adapter.requestDevice()
  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  // canvas.style.height = '100%'
  const context = canvas.getContext('webgpu') as GPUCanvasContext
  const root = document.getElementById('emp-root')
  root?.appendChild(canvas)
  // ==================
  // const dpr = window.devicePixelRatio
  // canvas.width = canvas.clientWidth * dpr
  // canvas.height = canvas.clientHeight * dpr
  // console.log('dpr', dpr, canvas.clientWidth, canvas.clientHeight)
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  })

  //
  const cellShaderModule = device.createShaderModule({
    label: 'Cell shader',
    code: `
    @vertex
    fn vertexMain(@location(0) pos: vec2f) ->
      @builtin(position) vec4f {
      return vec4f(pos, 0, 1);
    }
  
      @fragment
      fn fragmentMain() -> @location(0) vec4f {
        return vec4(0, 0, 1, 0.1);
      }
    `,
  })
  //
  const vertexBufferLayout: GPUVertexBufferLayout = {
    // arrayStride: 2 * 4：stride 单词是 步幅 的意思，所谓 arrayStride 就是指每次读取的字节数应该是多少。
    // 由于我们本示例中一个顶点坐标仅仅声明了 x, y 2个分量信息，且每个分量信息字节数为 4，所以我们才会将 arrayStride 的值设置为 2 * 4
    arrayStride: 8,
    attributes: [
      {
        format: 'float32x2',
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
      },
    ],
  }
  //
  const vertices = new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.8, 0.8, -0.8, -0.8, 0.8, 0.8, -0.8, 0.8])

  const vertexBuffer = device.createBuffer({
    label: 'Cell vertices',
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  })
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: cellShaderModule,
      entryPoint: 'vertexMain',
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: 'fragmentMain',
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  })
  //
  device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices)
  console.log('vertices.length / 2', vertices.length / 2)
  function frame() {
    const commandEncoder = device.createCommandEncoder()
    const textureView = context.getCurrentTexture().createView()

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

    const pass = commandEncoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
    // passEncoder.draw(4)
    pass.setVertexBuffer(0, vertexBuffer)
    pass.draw(vertices.length / 2) // 6 vertices
    pass.end()

    device.queue.submit([commandEncoder.finish()])
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
})()
