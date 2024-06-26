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
    //
    /**
    "opaque": 完全忽略 alpha 通道。这种模式下, alpha 通道不会影响最终的颜色输出。通常用于不需要透明度效果的场景。
    "premultiplied": 使用预乘 alpha 混合。在这种模式下, RGB 通道的值已经被 alpha 通道预乘过。这通常用于实现透明效果,可以提高性能。
    "straight": 使用普通的 alpha 混合。这种模式下,RGB 通道的值没有被预乘,需要在渲染时进行混合计算。相比预乘 alpha,这种模式下的性能通常较低。
    "blend": 使用等同于 "straight" 模式的 alpha 混合。
     */
    alphaMode: 'premultiplied',
    // alphaMode: 'opaque',
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
  const vertices = new Float32Array([-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0])

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
  // console.log('vertices.length / 2', vertices.length / 2)
  //
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
